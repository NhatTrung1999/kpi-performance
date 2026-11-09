import {
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import {
  SessionsService,
  type ClientInfo,
  type IssuedRefresh,
} from './sessions.service.js';
import { LoginAttemptsService } from './login-attempts.service.js';
import { AccessService, type AppRole } from '../access/access.service.js';

export type AuthenticatedUser = {
  userId: string;
  accountId: string;
  fullName: string | null;
  personSerialKey: string | null;
  role: AppRole;
};

// Dạng user trả cho frontend (khớp CurrentUser trong frontend/src/lib/session.ts).
export type UserProfile = {
  accountId: string;
  name: string;
  role: AppRole;
};

// Đúng mật khẩu nhưng không phải admin / chủ quản đang được cấp quyền.
const noAccess = () =>
  new ForbiddenException({
    statusCode: 403,
    code: 'NO_ACCESS',
    message: 'Tài khoản chưa được cấp quyền truy cập hệ thống',
  });

const HTTP_LOCKED = 423;

// Mật khẩu trong bảng users được lưu theo dạng SHA1(SHA1(mật khẩu)),
// tương đương HASHBYTES('SHA1', HASHBYTES('SHA1', @pass)) của SQL Server.
function hashPassword(pass: string): Buffer {
  const inner = createHash('sha1').update(pass, 'utf8').digest();
  return createHash('sha1').update(inner).digest();
}

// Khoá tạm do sai mật khẩu nhiều lần (khác khoá thật trong HRIS): có retryAfter (giây)
// để frontend hiện đồng hồ đếm ngược.
const tooManyAttempts = (retryAfter: number) =>
  new HttpException(
    {
      statusCode: HTTP_LOCKED,
      code: 'TOO_MANY_ATTEMPTS',
      locked: true,
      retryAfter,
      message: 'Nhập sai quá nhiều lần, vui lòng thử lại sau',
    },
    HTTP_LOCKED,
  );

const toProfile = (user: AuthenticatedUser): UserProfile => ({
  accountId: user.accountId,
  name: user.fullName ?? user.accountId,
  role: user.role,
});

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessions: SessionsService,
    private attempts: LoginAttemptsService,
    private access: AccessService,
  ) {}

  async validateUser(
    accountId: string,
    pass: string,
  ): Promise<AuthenticatedUser> {
    // Đang bị khoá tạm vì sai nhiều lần: từ chối ngay, không kiểm tra mật khẩu.
    const lockedFor = this.attempts.lockedFor(accountId);
    if (lockedFor > 0) throw tooManyAttempts(lockedFor);

    const user = await this.usersService.findByAccountId(accountId);

    const expected = hashPassword(pass);
    const valid =
      !!user?.password &&
      user.password.length === expected.length &&
      timingSafeEqual(user.password, expected);

    if (!user || !valid) {
      const result = this.attempts.recordFailure(accountId);
      if (result.lockedFor > 0) throw tooManyAttempts(result.lockedFor);
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Sai tài khoản hoặc mật khẩu',
        attemptsLeft: result.attemptsLeft,
      });
    }
    this.attempts.reset(accountId);

    // 423 + locked: true để frontend (auth-errors.ts) hiển thị "tài khoản bị khóa".
    if (user.locked) {
      throw new HttpException(
        {
          statusCode: HTTP_LOCKED,
          code: 'ACCOUNT_LOCKED',
          locked: true,
          message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên',
        },
        HTTP_LOCKED,
      );
    }

    // Chỉ admin và chủ quản đang được cấp quyền mới vào được hệ thống.
    const role = await this.access.resolveRole(
      user.accountId,
      user.personSerialKey,
    );
    if (!role) throw noAccess();

    return {
      userId: user.userId,
      accountId: user.accountId,
      fullName: user.fullName,
      personSerialKey: user.personSerialKey,
      role,
    };
  }

  private signAccess(user: AuthenticatedUser, sessionId: string) {
    const profile = toProfile(user);
    return this.jwtService.sign({
      sub: user.userId,
      username: user.accountId,
      name: profile.name,
      role: user.role,
      psk: user.personSerialKey,
      sid: sessionId,
    });
  }

  async login(
    user: AuthenticatedUser,
    remember: boolean,
    client: ClientInfo,
  ): Promise<{ token: string; user: UserProfile; refresh: IssuedRefresh }> {
    const refresh = await this.sessions.create(user, remember, client);
    return {
      token: this.signAccess(user, refresh.sessionId),
      user: toProfile(user),
      refresh,
    };
  }

  // Cấp access token mới từ refresh token (cookie). Kiểm tra lại HRIS và quyền truy cập:
  // tài khoản bị khóa/xoá hoặc bị thu hồi quyền thì thu hồi phiên.
  async refresh(
    refreshToken: string | undefined,
  ): Promise<{ token: string; refresh: IssuedRefresh }> {
    const refresh = await this.sessions.rotate(refreshToken);
    const user = await this.usersService.findByAccountId(refresh.accountId);
    if (!user || user.locked || user.userId !== refresh.userId) {
      await this.sessions.revokeById(
        refresh.sessionId,
        user?.locked ? 'locked' : 'user-missing',
      );
      throw new UnauthorizedException();
    }
    const role = await this.access.resolveRole(
      user.accountId,
      user.personSerialKey,
    );
    if (!role) {
      await this.sessions.revokeById(refresh.sessionId, 'no-access');
      throw new UnauthorizedException();
    }
    const token = this.signAccess(
      {
        userId: user.userId,
        accountId: user.accountId,
        fullName: user.fullName,
        personSerialKey: user.personSerialKey,
        role,
      },
      refresh.sessionId,
    );
    return { token, refresh };
  }

  logout(refreshToken: string | undefined) {
    return this.sessions.revoke(refreshToken, 'logout');
  }

  // Đọc lại từ DB để tài khoản bị khóa / bị thu hồi quyền sau khi đăng nhập không dùng tiếp được.
  async getMe(accountId: string): Promise<UserProfile> {
    const user = await this.usersService.findByAccountId(accountId);
    if (!user || user.locked) {
      throw new UnauthorizedException();
    }
    const role = await this.access.resolveRole(
      user.accountId,
      user.personSerialKey,
    );
    if (!role) throw new UnauthorizedException();
    return toProfile({
      userId: user.userId,
      accountId: user.accountId,
      fullName: user.fullName,
      personSerialKey: user.personSerialKey,
      role,
    });
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';

export type SessionOwner = { userId: string; accountId: string };
export type ClientInfo = { userAgent?: string; ip?: string };
export type IssuedRefresh = {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
  remember: boolean;
};

// Hai tab cùng refresh một lúc: tab thứ hai mang token vừa bị thay. Trong khoảng này
// coi là hợp lệ (trả lại token mới đã cấp) thay vì báo "token bị dùng lại".
const ROTATION_GRACE_MS = 30_000;

// Refresh token = "<sessionId>.<bí mật ngẫu nhiên>"; DB chỉ lưu SHA-256 của phần bí mật.
const hashSecret = (secret: string) =>
  createHash('sha256').update(secret, 'utf8').digest();
const newSecret = () => randomBytes(32).toString('base64url');

function parseToken(token: string) {
  const dot = token.indexOf('.');
  if (dot <= 0) return undefined;
  return { sessionId: token.slice(0, dot), secret: token.slice(dot + 1) };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class SessionsService {
  private readonly ttlHours: number;
  private readonly ttlRememberDays: number;
  // sessionId -> lần xoay vòng gần nhất (chỉ giữ trong bộ nhớ, vài chục giây).
  private readonly recentRotations = new Map<
    string,
    { previousHash: Buffer; issued: IssuedRefresh; at: number }
  >();
  private readonly inflight = new Map<string, Promise<IssuedRefresh>>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.ttlHours = Number(config.get('REFRESH_TTL_HOURS') ?? 12);
    this.ttlRememberDays = Number(
      config.get('REFRESH_TTL_REMEMBER_DAYS') ?? 30,
    );
  }

  private expiryFor(remember: boolean) {
    const ms = remember
      ? this.ttlRememberDays * 24 * 3600_000
      : this.ttlHours * 3600_000;
    return new Date(Date.now() + ms);
  }

  async create(
    owner: SessionOwner,
    remember: boolean,
    client: ClientInfo,
  ): Promise<IssuedRefresh> {
    const id = randomUUID();
    const secret = newSecret();
    const expiresAt = this.expiryFor(remember);
    await this.prisma.authSession.create({
      data: {
        id,
        userId: owner.userId,
        accountId: owner.accountId,
        tokenHash: hashSecret(secret),
        remember,
        userAgent: client.userAgent?.slice(0, 255),
        ip: client.ip?.slice(0, 45),
        expiresAt,
      },
    });
    return {
      sessionId: id,
      refreshToken: `${id}.${secret}`,
      expiresAt,
      remember,
    };
  }

  /**
   * Đổi refresh token cũ lấy token mới (xoay vòng). Hạn phiên giữ nguyên từ lúc đăng nhập.
   * Token đã bị thay mà vẫn được dùng lại (ngoài khoảng grace) = có thể bị đánh cắp → thu hồi cả phiên.
   */
  async rotate(
    token: string | undefined,
  ): Promise<IssuedRefresh & SessionOwner> {
    const parsed = token ? parseToken(token) : undefined;
    if (!parsed || !UUID_RE.test(parsed.sessionId)) {
      throw new UnauthorizedException();
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: parsed.sessionId },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    const presented = hashSecret(parsed.secret);
    const current = Buffer.from(session.tokenHash);
    const owner = { userId: session.userId, accountId: session.accountId };

    if (!timingSafeEqual(presented, current)) {
      // Request khác vừa ghi hash mới cho chính token này và chưa xong → chờ dùng chung kết quả.
      const pendingSame = this.inflight.get(
        `${session.id}:${presented.toString('hex')}`,
      );
      if (pendingSame) return { ...(await pendingSame), ...owner };

      const recent = this.recentRotations.get(session.id);
      if (
        recent &&
        Date.now() - recent.at < ROTATION_GRACE_MS &&
        timingSafeEqual(presented, recent.previousHash)
      ) {
        return { ...recent.issued, ...owner };
      }
      await this.revokeById(session.id, 'reuse');
      throw new UnauthorizedException();
    }

    // Cùng một token đang được xoay ở request khác (2 tab cùng lúc) → dùng chung kết quả.
    const key = `${session.id}:${current.toString('hex')}`;
    let pending = this.inflight.get(key);
    if (!pending) {
      pending = this.swap(session, current).finally(() =>
        this.inflight.delete(key),
      );
      this.inflight.set(key, pending);
    }
    return { ...(await pending), ...owner };
  }

  private async swap(
    session: { id: string; expiresAt: Date; remember: boolean },
    current: Buffer,
  ): Promise<IssuedRefresh> {
    const secret = newSecret();
    // Điều kiện tokenHash cũ: hai request song song chỉ một bên ghi được.
    const { count } = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        tokenHash: new Uint8Array(current),
        revokedAt: null,
      },
      data: { tokenHash: hashSecret(secret), lastUsedAt: new Date() },
    });
    if (count === 0) {
      const recent = this.recentRotations.get(session.id);
      if (recent && Date.now() - recent.at < ROTATION_GRACE_MS) {
        return recent.issued;
      }
      throw new UnauthorizedException();
    }

    const issued: IssuedRefresh = {
      sessionId: session.id,
      refreshToken: `${session.id}.${secret}`,
      expiresAt: session.expiresAt,
      remember: session.remember,
    };
    this.rememberRotation(session.id, current, issued);
    return issued;
  }

  /** Thu hồi theo refresh token (đăng xuất). Token sai/không có thì bỏ qua. */
  async revoke(token: string | undefined, reason: string) {
    const parsed = token ? parseToken(token) : undefined;
    if (!parsed || !UUID_RE.test(parsed.sessionId)) return;
    await this.revokeById(parsed.sessionId, reason);
  }

  async revokeById(sessionId: string, reason: string) {
    this.recentRotations.delete(sessionId);
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  private rememberRotation(
    sessionId: string,
    previousHash: Buffer,
    issued: IssuedRefresh,
  ) {
    const now = Date.now();
    for (const [id, r] of this.recentRotations) {
      if (now - r.at >= ROTATION_GRACE_MS) this.recentRotations.delete(id);
    }
    this.recentRotations.set(sessionId, { previousHash, issued, at: now });
  }
}

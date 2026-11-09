import {
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  CookieOptions,
  Request as ExpressRequest,
  Response,
} from 'express';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService, type AuthenticatedUser } from './auth.service';
import type { RequestUser } from '../access/access.service';
import { Public } from './decorators';
import type { IssuedRefresh } from './sessions.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

// Refresh token nằm trong cookie httpOnly: JS của trang không đọc được,
// chỉ gửi kèm các request tới /api/auth (refresh, logout).
const REFRESH_COOKIE = 'kpi_rt';
const cookieBase: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.COOKIE_SECURE === 'true',
  path: '/api/auth',
};

function setRefreshCookie(res: Response, refresh: IssuedRefresh) {
  res.cookie(REFRESH_COOKIE, refresh.refreshToken, {
    ...cookieBase,
    // Không "Remember me": cookie phiên (mất khi đóng trình duyệt); server vẫn giới hạn bằng expiresAt.
    ...(refresh.remember
      ? { maxAge: refresh.expiresAt.getTime() - Date.now() }
      : {}),
  });
}

const refreshCookieOf = (req: ExpressRequest): string | undefined => {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' ? value : undefined;
};

/** req.user do LocalStrategy (login) / JwtStrategy (các route còn lại) gắn vào. */
type LoginRequest = ExpressRequest & { user: AuthenticatedUser };
type JwtRequest = ExpressRequest & { user: RequestUser };

// Mọi route /api/auth/*: tối đa 30 request/phút/IP (vượt → 429).
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Body: { identifier, password, remember } (xem frontend/src/lib/auth.ts).
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // login: 10 lần/phút/IP
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  async login(
    @Request() req: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const body = req.body as { remember?: unknown } | undefined;
    const { token, user, refresh } = await this.authService.login(
      req.user,
      body?.remember === true,
      { userAgent: req.get('user-agent'), ip: req.ip },
    );
    setRefreshCookie(res, refresh);
    return { token, user };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { token, refresh } = await this.authService.refresh(
        refreshCookieOf(req),
      );
      setRefreshCookie(res, refresh);
      return { token };
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, cookieBase);
      throw error;
    }
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(refreshCookieOf(req));
    res.clearCookie(REFRESH_COOKIE, cookieBase);
  }

  @Get('me')
  getMe(@Request() req: JwtRequest) {
    return this.authService.getMe(req.user.username);
  }
}

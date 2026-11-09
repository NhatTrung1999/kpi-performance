import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AppRole, RequestUser } from './access.service.js';

export const ROLES_KEY = 'roles';
/** Chỉ cho các vai trò này gọi route (vd. @Roles('AD')). Không gắn = mọi tài khoản đã đăng nhập. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

/** Guard toàn cục, chạy sau JwtAuthGuard: kiểm tra req.user.role với @Roles(...). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AppRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles || roles.length === 0) return true;
    const user = context
      .switchToHttp()
      .getRequest<{ user?: RequestUser }>().user;
    if (user && roles.includes(user.role)) return true;
    throw new ForbiddenException();
  }
}

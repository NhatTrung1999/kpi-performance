import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Vai trò được phép vào hệ thống. Nhân viên thường không đăng nhập được. */
export type AppRole = 'AD' | 'CQ';

export const UNIT_TYPES = ['TEAM', 'NO_TEAM', 'DEPARTMENT'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

/**
 * Một mục trong phạm vi của chủ quản:
 * - TEAM: một team (key = mã team DS...).
 * - NO_TEAM: nhân viên chưa xếp team của một đơn vị (key = mã đơn vị DP...).
 * - DEPARTMENT: cả đơn vị — chỉ dùng cho đơn vị không có team nào (key = DP...).
 */
export type ScopeUnit = { type: UnitType; key: string };

/** Người dùng đã xác thực, gắn vào request (req.user) bởi JwtStrategy. */
export type RequestUser = {
  userId: string;
  /** AccountID — giữ tên `username` cho tương thích code cũ. */
  username: string;
  role: AppRole;
  personSerialKey: string | null;
  sid?: string;
};

/**
 * Quyết định ai được vào hệ thống (xem memory/permission-model):
 * - Admin: đúng 1 tài khoản khai báo ở ADMIN_ACCOUNT (.env), so theo AccountID.
 * - Chủ quản: có dòng managers.isActive = 1 theo Person_Serial_Key (lấy từ LYV_HRIS.users lúc đăng nhập).
 * - Còn lại: không được vào.
 */
@Injectable()
export class AccessService {
  private readonly adminAccount: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.adminAccount = String(config.get('ADMIN_ACCOUNT') ?? '')
      .trim()
      .toLowerCase();
  }

  isAdminAccount(accountId: string) {
    return (
      this.adminAccount !== '' &&
      accountId.trim().toLowerCase() === this.adminAccount
    );
  }

  /** Vai trò của tài khoản; null = không được vào hệ thống. */
  async resolveRole(
    accountId: string,
    personSerialKey: string | null,
  ): Promise<AppRole | null> {
    if (this.isAdminAccount(accountId)) return 'AD';
    if (!personSerialKey) return null;
    const manager = await this.prisma.manager.findUnique({
      where: { personSerialKey },
      select: { isActive: true },
    });
    return manager?.isActive ? 'CQ' : null;
  }

  /** Phạm vi đang được gán cho chủ quản (rỗng nếu không có). */
  async scopesOf(personSerialKey: string | null): Promise<ScopeUnit[]> {
    if (!personSerialKey) return [];
    const rows = await this.prisma.managerScope.findMany({
      where: { personSerialKey, manager: { isActive: true } },
      select: { unitType: true, unitKey: true },
    });
    return rows
      .filter((r): r is { unitType: UnitType; unitKey: string } =>
        (UNIT_TYPES as readonly string[]).includes(r.unitType),
      )
      .map((r) => ({ type: r.unitType, key: r.unitKey }));
  }
}

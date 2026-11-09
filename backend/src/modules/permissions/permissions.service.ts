import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DepartmentsService } from '../departments/departments.service.js';
import type { ScopeUnit, UnitType } from '../access/access.service.js';
import type { ManagerChangeDto } from './permissions.dto.js';

export type ManagerView = {
  personSerialKey: string;
  personId: string;
  isActive: boolean;
  scopes: ScopeUnit[];
  updatedAt: Date;
};

const scopeId = (s: ScopeUnit) => `${s.type}:${s.key}`;
const sortScopes = (list: ScopeUnit[]) =>
  [...list].sort((a, b) => scopeId(a).localeCompare(scopeId(b)));
const sameScopes = (a: ScopeUnit[], b: ScopeUnit[]) =>
  sortScopes(a).map(scopeId).join('|') === sortScopes(b).map(scopeId).join('|');
const toJson = (list: ScopeUnit[]) => JSON.stringify(sortScopes(list));

/**
 * Cấp/thu hồi quyền chủ quản và gán phạm vi (bảng ở KPI_PERFORMANCE, server 0.235).
 * Mỗi lần lưu là một transaction: cập nhật managers + manager_scopes và ghi permission_changes.
 */
@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly departments: DepartmentsService,
  ) {}

  async listManagers(): Promise<ManagerView[]> {
    const rows = await this.prisma.manager.findMany({
      include: { scopes: { select: { unitType: true, unitKey: true } } },
      orderBy: { personId: 'asc' },
    });
    return rows.map((m) => ({
      personSerialKey: m.personSerialKey,
      personId: m.personId,
      isActive: m.isActive,
      scopes: m.scopes.map((s) => ({
        type: s.unitType as UnitType,
        key: s.unitKey,
      })),
      updatedAt: m.updatedAt,
    }));
  }

  /** Kiểm tra phạm vi khớp cây đơn vị hiện tại trong HRIS; trả về danh sách đã bỏ trùng. */
  private async validateScopes(changes: ManagerChangeDto[]) {
    const all = changes.flatMap((c) => (c.active ? c.scopes : []));
    if (all.length === 0) return;
    const tree = await this.departments.findTree();
    const valid = new Set<string>();
    for (const d of tree) {
      if (d.children.length === 0) valid.add(`DEPARTMENT:${d.id}`);
      else valid.add(`NO_TEAM:${d.id}`);
      for (const t of d.children) if (t.id) valid.add(`TEAM:${t.id}`);
    }
    const invalid = [...new Set(all.map(scopeId))].filter(
      (id) => !valid.has(id),
    );
    if (invalid.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_SCOPE',
        message: 'Phạm vi không hợp lệ hoặc đơn vị/team không còn hoạt động',
        invalid,
      });
    }
  }

  async saveChanges(changes: ManagerChangeDto[], changedBy: string) {
    const keys = changes.map((c) => c.personSerialKey);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException(
        'Một người xuất hiện nhiều lần trong lần lưu',
      );
    }
    await this.validateScopes(changes);

    const result = { granted: 0, revoked: 0, scopeChanged: 0 };
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.manager.findMany({
        where: { personSerialKey: { in: keys } },
        include: { scopes: true },
      });
      const byKey = new Map(current.map((m) => [m.personSerialKey, m]));

      for (const c of changes) {
        const before = byKey.get(c.personSerialKey);
        const oldScopes: ScopeUnit[] = (before?.scopes ?? []).map((s) => ({
          type: s.unitType as UnitType,
          key: s.unitKey,
        }));
        // Bỏ trùng phạm vi gửi lên.
        const newScopes = [
          ...new Map(c.scopes.map((s) => [scopeId(s), s])).values(),
        ].map((s) => ({ type: s.type, key: s.key }));
        const wasActive = !!before?.isActive;
        const log = (action: 'GRANT' | 'REVOKE' | 'SCOPE') =>
          tx.permissionChange.create({
            data: {
              personSerialKey: c.personSerialKey,
              personId: c.personId,
              personName: c.personName ?? null,
              action,
              oldScopes: before ? toJson(oldScopes) : null,
              newScopes: action === 'REVOKE' ? null : toJson(newScopes),
              changedBy,
            },
          });

        if (!c.active) {
          // Thu hồi: giữ dòng và phạm vi để còn dấu vết / cấp lại.
          if (wasActive) {
            await tx.manager.update({
              where: { personSerialKey: c.personSerialKey },
              data: { isActive: false },
            });
            await log('REVOKE');
            result.revoked++;
          }
          continue;
        }

        const scopesChanged = !sameScopes(oldScopes, newScopes);
        if (!wasActive || scopesChanged) {
          await tx.manager.upsert({
            where: { personSerialKey: c.personSerialKey },
            create: {
              personSerialKey: c.personSerialKey,
              personId: c.personId,
              isActive: true,
            },
            update: { personId: c.personId, isActive: true },
          });
        }
        if (scopesChanged) {
          await tx.managerScope.deleteMany({
            where: { personSerialKey: c.personSerialKey },
          });
          if (newScopes.length > 0) {
            await tx.managerScope.createMany({
              data: newScopes.map((s) => ({
                personSerialKey: c.personSerialKey,
                unitType: s.type,
                unitKey: s.key,
              })),
            });
          }
        }
        if (!wasActive) {
          await log('GRANT');
          result.granted++;
        } else if (scopesChanged) {
          await log('SCOPE');
          result.scopeChanged++;
        }
      }
    });
    return result;
  }

  history(personSerialKey: string | undefined, limit: number) {
    return this.prisma.permissionChange
      .findMany({
        where: personSerialKey ? { personSerialKey } : undefined,
        orderBy: { changedAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 200),
      })
      .then((rows) =>
        rows.map((r) => ({
          ...r,
          id: r.id.toString(), // BigInt → chuỗi để trả JSON
          oldScopes: r.oldScopes
            ? (JSON.parse(r.oldScopes) as ScopeUnit[])
            : null,
          newScopes: r.newScopes
            ? (JSON.parse(r.newScopes) as ScopeUnit[])
            : null,
        })),
      );
  }
}

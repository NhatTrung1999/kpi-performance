import { Body, Controller, Get, Put, Query, Req } from '@nestjs/common';
import { Roles } from '../access/roles.guard.js';
import type { RequestUser } from '../access/access.service.js';
import { PermissionsService } from './permissions.service.js';
import { SaveManagersDto } from './permissions.dto.js';

// Chỉ admin (ADMIN_ACCOUNT) được quản lý phân quyền.
@Roles('AD')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  /** GET /api/permissions/managers → chủ quản (cả đã thu hồi) kèm phạm vi. */
  @Get('managers')
  listManagers() {
    return this.permissions.listManagers();
  }

  /** PUT /api/permissions/managers { changes: [...] } — lưu theo lô (một transaction). */
  @Put('managers')
  saveManagers(
    @Req() req: { user: RequestUser },
    @Body() body: SaveManagersDto,
  ) {
    return this.permissions.saveChanges(body.changes, req.user.username);
  }

  /** GET /api/permissions/history?personSerialKey=&limit= — mới nhất trước. */
  @Get('history')
  history(
    @Query('personSerialKey') personSerialKey?: string,
    @Query('limit') limit?: string,
  ) {
    return this.permissions.history(
      personSerialKey?.trim() || undefined,
      Number(limit) || 50,
    );
  }
}

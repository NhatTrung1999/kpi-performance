import { Controller, Get, Req } from '@nestjs/common';
import { DepartmentsService } from './departments.service.js';
import { EmployeesService } from './employees.service.js';
import { AccessService, type RequestUser } from '../access/access.service.js';
import {
  filterEmployeesByScopes,
  filterTreeByScopes,
  noTeamDepts,
} from '../access/scope-filter.js';

/**
 * Đơn vị và nhân viên (HRIS 0.117). Admin thấy toàn bộ đơn vị gốc;
 * chủ quản chỉ thấy đúng các team được gán — lọc ở đây, không dựa vào giao diện.
 */
@Controller()
export class DepartmentsController {
  constructor(
    private readonly departments: DepartmentsService,
    private readonly employees: EmployeesService,
    private readonly access: AccessService,
  ) {}

  /** GET /api/departments → [{ id, name, employees, children: [{ id, name, employees }] }] */
  @Get('departments')
  async findTree(@Req() req: { user: RequestUser }) {
    const tree = await this.departments.findTree();
    if (req.user.role === 'AD') return tree;
    return filterTreeByScopes(
      tree,
      await this.access.scopesOf(req.user.personSerialKey),
    );
  }

  /**
   * GET /api/employees → nhân viên đang làm việc (tháng hiện tại) của mọi đơn vị trong phạm vi, một lần gọi.
   * Chủ quản: SQL chỉ lấy trong các đơn vị/team được gán, rồi lọc chính xác theo phạm vi.
   */
  @Get('employees')
  async findEmployees(@Req() req: { user: RequestUser }) {
    if (req.user.role === 'AD') return this.employees.findAll();

    const scopes = await this.access.scopesOf(req.user.personSerialKey);
    if (scopes.length === 0) return [];
    const noTeam = noTeamDepts(scopes);
    const [list, activeTeams] = await Promise.all([
      this.employees.findAll({
        depts: scopes.filter((s) => s.type !== 'TEAM').map((s) => s.key),
        teams: scopes.filter((s) => s.type === 'TEAM').map((s) => s.key),
      }),
      this.departments.activeTeamsByDept(noTeam),
    ]);
    return filterEmployeesByScopes(list, scopes, activeTeams);
  }
}

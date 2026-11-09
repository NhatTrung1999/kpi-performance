import type { ScopeUnit } from './access.service.js';

type TeamLike = { id: string | null; employees: number };
type DeptLike<T extends TeamLike> = {
  id: string;
  employees: number;
  children: T[];
};

/**
 * Cắt cây đơn vị theo phạm vi của chủ quản: chỉ giữ team được gán (TEAM), nhóm chưa có team
 * khi được gán NO_TEAM, và đơn vị không có team khi được gán DEPARTMENT. Đơn vị không còn gì thì bỏ.
 */
export function filterTreeByScopes<T extends TeamLike, D extends DeptLike<T>>(
  tree: D[],
  scopes: ScopeUnit[],
): D[] {
  const has = (type: ScopeUnit['type'], key: string) =>
    scopes.some((s) => s.type === type && s.key === key);
  const out: D[] = [];
  for (const dept of tree) {
    if (dept.children.length === 0) {
      if (has('DEPARTMENT', dept.id)) out.push(dept);
      continue;
    }
    const children = dept.children.filter((c) =>
      c.id === null ? has('NO_TEAM', dept.id) : has('TEAM', c.id),
    );
    if (children.length === 0) continue;
    out.push({
      ...dept,
      children,
      employees: children.reduce((a, c) => a + c.employees, 0),
    });
  }
  return out;
}

/** Mã đơn vị có phạm vi NO_TEAM — cần danh sách team đang hoạt động của chúng (activeTeamsByDept). */
export const noTeamDepts = (scopes: ScopeUnit[]) =>
  scopes.filter((s) => s.type === 'NO_TEAM').map((s) => s.key);

/**
 * Lọc nhân viên (nhiều đơn vị) theo phạm vi chủ quản.
 * NO_TEAM gồm người chưa có team và người thuộc team đã ngưng dùng (không có trong activeTeams của đơn vị),
 * khớp cách tính nhóm "No team" của cây đơn vị.
 * @param activeTeams team đang hoạt động của các đơn vị trong noTeamDepts(scopes).
 */
export function filterEmployeesByScopes<
  E extends { departmentKey: string; teamKey: string | null },
>(
  employees: E[],
  scopes: ScopeUnit[],
  activeTeams: Map<string, Set<string>>,
): E[] {
  const keys = (type: ScopeUnit['type']) =>
    new Set(scopes.filter((s) => s.type === type).map((s) => s.key));
  const teams = keys('TEAM');
  const wholeDept = keys('DEPARTMENT');
  return employees.filter((e) => {
    if (wholeDept.has(e.departmentKey)) return true;
    const active = activeTeams.get(e.departmentKey);
    // Đơn vị không có NO_TEAM: chỉ người thuộc team được gán.
    if (!active) return e.teamKey !== null && teams.has(e.teamKey);
    return e.teamKey !== null && active.has(e.teamKey)
      ? teams.has(e.teamKey)
      : true;
  });
}

import { countOf, leavesOf, norm, unitLabel, type Unit } from './data';

/** count = undefined khi chưa biết số người (API đơn vị chưa trả số nhân viên). */
export type TreeRow = { unit: Unit; level: number; hasKids: boolean; open: boolean; name: string; count?: number };

/** Làm phẳng cây đơn vị; khi có từ khóa thì chỉ giữ nhánh khớp và tự mở rộng. */
export const flattenTree = (units: Unit[], query: string, openIds: string[]): TreeRow[] => {
  const q = norm(query.trim());
  const open = new Set(openIds);
  const out: TreeRow[] = [];
  const match = (u: Unit): boolean => norm(unitLabel(u.n)).includes(q) || (u.k ?? []).some(match);
  const walk = (list: Unit[], level: number) =>
    list.forEach((u) => {
      if (q && !match(u)) return;
      const hasKids = !!u.k;
      const isOpen = hasKids && (!!q || open.has(u.id));
      out.push({ unit: u, level, hasKids, open: isOpen, name: unitLabel(u.n), count: leavesOf(u).some((l) => l.c !== undefined) ? countOf(u) : undefined });
      if (isOpen) walk(u.k!, level + 1);
    });
  walk(units, 0);
  return out;
};

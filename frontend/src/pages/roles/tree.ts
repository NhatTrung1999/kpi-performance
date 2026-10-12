import { countOf, norm, parseName, type Unit } from './data';

export type TreeRow = { unit: Unit; level: number; hasKids: boolean; open: boolean; vi: string; zh: string; count: number };

/** Làm phẳng cây đơn vị; khi có từ khóa thì chỉ giữ nhánh khớp và tự mở rộng. */
export const flattenTree = (units: Unit[], query: string, openIds: string[]): TreeRow[] => {
  const q = norm(query.trim());
  const open = new Set(openIds);
  const out: TreeRow[] = [];
  const match = (u: Unit): boolean => norm(u.n).includes(q) || (u.k ?? []).some(match);
  const walk = (list: Unit[], level: number) =>
    list.forEach((u) => {
      if (q && !match(u)) return;
      const hasKids = !!u.k;
      const isOpen = hasKids && (!!q || open.has(u.id));
      const { vi, zh } = parseName(u.n);
      out.push({ unit: u, level, hasKids, open: isOpen, vi, zh, count: countOf(u) });
      if (isOpen) walk(u.k!, level + 1);
    });
  walk(units, 0);
  return out;
};

import { countOf, leavesOf, norm, unitLabel, unitZh, type Unit } from './data';

/** count = undefined khi chưa biết số người (API đơn vị chưa trả số nhân viên). */
export type TreeRow = { unit: Unit; level: number; hasKids: boolean; open: boolean; name: string; zh: string; count?: number };

/**
 * Làm phẳng cây đơn vị; khi có từ khóa thì chỉ giữ nhánh khớp và tự mở rộng
 * (đơn vị cha khớp thì hiện đủ bộ phận con). `keep` lọc nút lá (vd. nhóm chưa có chủ quản):
 * chỉ giữ cha còn lá được giữ, và mở sẵn mọi nhánh.
 */
export const flattenTree = (units: Unit[], query: string, openIds: string[], keep?: (leaf: Unit) => boolean): TreeRow[] => {
  const raw = query.trim();
  const q = norm(raw);
  const open = new Set(openIds);
  const out: TreeRow[] = [];
  const hit = (u: Unit) => norm(unitLabel(u.n)).includes(q) || unitZh(u.n).includes(raw);
  const match = (u: Unit): boolean => hit(u) || (u.k ?? []).some(match);
  const kept = (u: Unit): boolean => !keep || (u.k ? u.k.some(kept) : keep(u));
  const walk = (list: Unit[], level: number, parentHit: boolean) =>
    list.forEach((u) => {
      if (!kept(u) || (q && !parentHit && !match(u))) return;
      const hasKids = !!u.k;
      const isOpen = hasKids && (!!q || !!keep || open.has(u.id));
      out.push({ unit: u, level, hasKids, open: isOpen, name: unitLabel(u.n), zh: unitZh(u.n), count: leavesOf(u).some((l) => l.c !== undefined) ? countOf(u) : undefined });
      if (isOpen) walk(u.k!, level + 1, parentHit || (!!q && hit(u)));
    });
  walk(units, 0, false);
  return out;
};

import { COLUMN_GROUPS, type ColumnGroup } from '@/config/promotion-proposal';

/**
 * Nhóm cột đang thu gọn, lưu theo từng người dùng trong localStorage.
 * Đọc/ghi đều bọc try/catch: chế độ riêng tư, bị chặn lưu trữ hay dữ liệu hỏng thì coi như chưa thu gọn nhóm nào.
 */
const KEY = 'promotion.collapsedGroups';

const keyOf = (user: string) => `${KEY}.${user}`;

export function loadCollapsed(user: string): ReadonlySet<ColumnGroup> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(keyOf(user)) ?? '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((g): g is ColumnGroup => (COLUMN_GROUPS as readonly unknown[]).includes(g)));
  } catch {
    return new Set();
  }
}

export function saveCollapsed(user: string, groups: ReadonlySet<ColumnGroup>) {
  try {
    if (groups.size) localStorage.setItem(keyOf(user), JSON.stringify([...groups]));
    else localStorage.removeItem(keyOf(user));
  } catch {
    // Không lưu được thì chỉ mất trạng thái khi tải lại trang.
  }
}

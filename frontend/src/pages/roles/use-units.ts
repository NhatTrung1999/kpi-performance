import { useQuery } from '@tanstack/react-query';
import i18n from '@/i18n';
import { http } from '@/lib/axios';
import { noTeamId, type Unit } from './data';

/** Dạng trả về của GET /api/departments (backend/src/modules/departments). */
type TeamNode = { id: string | null; name: string | null; employees: number };
type DepartmentNode = { id: string; name: string; employees: number; children: TeamNode[] };

export const unitsQueryKey = ['departments'] as const;

/**
 * Cây đơn vị lấy từ HRIS (server 0.117): đơn vị → team, kèm số nhân viên đang làm việc trong tháng.
 * Danh sách ít thay đổi nên giữ "mới" 10 phút, không tải lại mỗi lần mở trang.
 */
export function useUnits() {
  return useQuery({
    queryKey: unitsQueryKey,
    queryFn: () => http.get<DepartmentNode[]>('/departments'),
    staleTime: 10 * 60_000,
    select: (nodes): Unit[] =>
      nodes.map((d) =>
        d.children.length > 0
          ? {
              id: d.id,
              n: d.name,
              // Số người của đơn vị = tổng các team (countOf), nên chỉ gắn `c` ở team.
              k: d.children.map((c) => ({
                id: c.id ?? noTeamId(d.id),
                n: c.name ?? i18n.t('roles:noTeam'),
                c: c.employees,
              })),
            }
          : { id: d.id, n: d.name, c: d.employees },
      ),
  });
}

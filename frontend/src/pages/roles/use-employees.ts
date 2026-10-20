import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { http } from '@/lib/axios';
import type { Person } from './data';

/** Dạng trả về của GET /api/departments/:id/employees (backend/src/modules/departments). */
type EmployeeDto = {
  personSerialKey: string;
  personId: string;
  name: string;
  departmentId: string;
  teamKey: string | null;
  team: string;
  joinDate: string | null;
  position: string;
};

const fetchEmployees = async (deptKey: string): Promise<Person[]> => {
  const list = await http.get<EmployeeDto[]>(`/departments/${encodeURIComponent(deptKey)}/employees`);
  return list.map((e) => ({
    psk: e.personSerialKey,
    id: e.personId,
    name: e.name,
    deptKey,
    unit: e.departmentId,
    teamKey: e.teamKey,
    dept: e.team,
    join: e.joinDate,
    position: e.position,
  }));
};

// Ngoài component để useQueries giữ nguyên tham chiếu kết quả khi dữ liệu không đổi.
const combine = (results: UseQueryResult<Person[]>[]) => ({
  data: results.flatMap((r) => r.data ?? []),
  isPending: results.some((r) => r.isPending),
  isError: results.some((r) => r.isError),
  refetch: () => results.forEach((r) => void r.refetch()),
});

/**
 * Nhân viên đang làm việc (tháng hiện tại) của các đơn vị gốc, từ HRIS (server 0.117).
 * Lấy cả đơn vị một lần rồi lọc team ở trình duyệt → đổi team không phải gọi lại API.
 */
export function useEmployees(deptKeys: string[]) {
  return useQueries({
    queries: deptKeys.map((deptKey) => ({
      queryKey: ['departments', deptKey, 'employees'],
      queryFn: () => fetchEmployees(deptKey),
      staleTime: 5 * 60_000,
    })),
    combine,
  });
}

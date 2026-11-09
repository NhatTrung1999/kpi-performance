import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/axios';
import type { Person } from './data';

/** Dạng trả về của GET /api/employees (backend/src/modules/departments). */
type EmployeeDto = {
  personSerialKey: string;
  personId: string;
  name: string;
  departmentKey: string;
  departmentId: string;
  teamKey: string | null;
  team: string;
  joinDate: string | null;
  position: string;
};

export const employeesQueryKey = ['employees'] as const;

const NO_PEOPLE: Person[] = [];

/**
 * Nhân viên đang làm việc (tháng hiện tại) trong phạm vi người dùng, từ HRIS (server 0.117) — một lần gọi.
 * Backend đã lọc theo phạm vi (chủ quản chỉ nhận team được gán); lọc theo đơn vị/team chọn làm ở trình duyệt.
 */
export function useEmployees() {
  const query = useQuery({
    queryKey: employeesQueryKey,
    queryFn: () => http.get<EmployeeDto[]>('/employees'),
    staleTime: 5 * 60_000,
    select: (list): Person[] =>
      list.map((e) => ({
        psk: e.personSerialKey,
        id: e.personId,
        name: e.name,
        deptKey: e.departmentKey,
        unit: e.departmentId,
        teamKey: e.teamKey,
        dept: e.team,
        join: e.joinDate,
        position: e.position,
      })),
  });
  return {
    data: query.data ?? NO_PEOPLE,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/axios';
import type { Unit } from './data';
import { noTeamId } from './data';

/** Một mục phạm vi, khớp backend (src/modules/access/access.service.ts). */
export type ScopeUnit = { type: 'TEAM' | 'NO_TEAM' | 'DEPARTMENT'; key: string };

type ManagerDto = { personSerialKey: string; personId: string; isActive: boolean; scopes: ScopeUnit[] };

export type ManagerChange = {
  personSerialKey: string;
  personId: string;
  personName: string;
  active: boolean;
  scopes: ScopeUnit[];
};

export const managersQueryKey = ['permissions', 'managers'] as const;

/** Chủ quản đã lưu: { personSerialKey → { active, leafIds } } (leafIds = mã nút lá trên cây đơn vị). */
export function useManagers() {
  return useQuery({
    queryKey: managersQueryKey,
    queryFn: () => http.get<ManagerDto[]>('/permissions/managers'),
  });
}

/** Lưu theo lô; thành công thì tải lại danh sách chủ quản và cây/nhân viên (phạm vi có thể đã đổi). */
export function useSaveManagers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: ManagerChange[]) => http.put('/permissions/managers', { changes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  });
}

// ───────── Đổi qua lại giữa nút lá trên cây (giao diện) và mục phạm vi (backend) ─────────
// Nút lá: team (DS...), "No team" của đơn vị (`${DP}::no-team`), hoặc đơn vị không có team (DP...).

export const leafToScope = (leafId: string, units: Unit[]): ScopeUnit => {
  const suffix = noTeamId('');
  if (leafId.endsWith(suffix)) return { type: 'NO_TEAM', key: leafId.slice(0, -suffix.length) };
  if (units.some((u) => u.id === leafId && !u.k)) return { type: 'DEPARTMENT', key: leafId };
  return { type: 'TEAM', key: leafId };
};

export const scopeToLeaf = (s: ScopeUnit) => (s.type === 'NO_TEAM' ? noTeamId(s.key) : s.key);

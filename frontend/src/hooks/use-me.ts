import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth';

export const meQueryKey = ['auth', 'me'] as const;

/**
 * GET /auth/me — xác nhận phiên với server khi mở app và cập nhật họ tên/vai trò mới nhất vào store.
 * Tài khoản bị khóa/xoá → server trả 401 → interceptor thử refresh, thất bại thì về /login.
 * Gọi một lần ở layout đã đăng nhập (MainLayout); component khác đọc user qua useCurrentUser().
 */
export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      const me = await http.get<Record<string, unknown>>('/auth/me');
      useAuthStore.getState().setUser(me);
      return me;
    },
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

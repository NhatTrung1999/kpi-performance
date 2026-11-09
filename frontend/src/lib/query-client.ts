import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './axios';

/**
 * QueryClient dùng chung cho cả app (TanStack Query v5) — quản lý dữ liệu lấy từ server.
 * Quy ước: dữ liệu server đi qua useQuery/useMutation với queryFn gọi `http` (lib/axios.ts),
 * không tự cache bằng useState/useEffect.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mặc định của thư viện là 0 (luôn cũ → tải lại mỗi lần mount/focus). Dữ liệu KPI ít đổi từng giây nên giữ 30 giây.
      staleTime: 30_000,
      // Mặc định thử lại 3 lần mọi lỗi. Lỗi 4xx (sai quyền, không tìm thấy, dữ liệu sai) thử lại không có ích;
      // 401 đã được interceptor refresh token xử lý trước khi tới đây.
      retry: (failureCount, error) => {
        const status = error instanceof ApiError ? error.status : undefined;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 3;
      },
    },
  },
});

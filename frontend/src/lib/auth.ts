import { ApiError, clearToken, http, revokeSession, setToken } from './axios';
import { queryClient } from './query-client';
import { meQueryKey } from '@/hooks/use-me';
import { saveCurrentUser } from './session';
import { toLoginFailure, type LoginFailure } from './auth-errors';
import type { LoginValues } from './validations/login';

export type LoginResult = { ok: true } | { ok: false; failure: LoginFailure };

interface LoginResponse {
  token: string;
  /** { accountId, name } (sau này thêm role). Thiếu thì gọi GET /auth/me. */
  user?: Record<string, unknown>;
}

/**
 * Hợp đồng API (backend/src/modules/auth):
 *   POST /auth/login { identifier, password, remember } -> 200 { token, user } + cookie refresh (httpOnly)
 *   400                    body sai định dạng
 *   401 { attemptsLeft }   sai thông tin
 *   423 { retryAfter? }    khoá tạm do sai nhiều lần (có retryAfter, giây) / khoá trong HRIS (không có)
 *   403 { code: NO_ACCESS } đúng mật khẩu nhưng chưa được admin cấp quyền (chỉ admin + chủ quản được vào)
 *   429                    quá nhiều lần thử trong 1 phút
 * Việc đếm số lần sai và khóa tài khoản do server quyết định.
 * Không ném lỗi ra ngoài: mọi lỗi được chuẩn hoá qua toLoginFailure.
 */
export async function login(values: LoginValues): Promise<LoginResult> {
  try {
    const { token, user } = await http.post<LoginResponse>('/auth/login', values);
    queryClient.clear(); // bỏ dữ liệu của phiên trước (nếu có) trước khi vào phiên mới
    setToken(token, values.remember);
    // Lấy họ tên/chức danh/vai trò từ server; lỗi ở đây không làm hỏng đăng nhập (dự phòng: claim trong token).
    const me = user ?? (await http.get<Record<string, unknown>>('/auth/me').catch(() => null));
    if (me) {
      saveCurrentUser(me);
      queryClient.setQueryData(meQueryKey, me); // useMe() không phải gọi lại ngay sau khi đăng nhập
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      // Không có status = mất mạng / quá thời gian chờ (axios.ts đã chuyển thành ApiError).
      return {
        ok: false,
        failure: toLoginFailure(
          error.status === undefined
            ? { error: new TypeError(error.message) }
            : { status: error.status, body: error.data },
        ),
      };
    }
    return { ok: false, failure: toLoginFailure({ error }) };
  }
}

/**
 * Đăng xuất: thu hồi phiên trên server (POST /auth/logout xoá refresh token + cookie),
 * rồi xoá token + user ở localStorage/sessionStorage. Lỗi mạng vẫn xoá phiên trên trình duyệt.
 * Xoá luôn cache TanStack Query để người đăng nhập sau không thấy dữ liệu của người trước.
 */
export async function logout(): Promise<void> {
  await revokeSession();
  queryClient.clear();
  clearToken();
}

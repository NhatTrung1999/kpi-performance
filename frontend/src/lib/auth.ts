import { ApiError, http, setToken } from './axios';
import { saveCurrentUser } from './session';
import { toLoginFailure, type LoginFailure } from './auth-errors';
import type { LoginValues } from './validations/login';

export type LoginResult = { ok: true } | { ok: false; failure: LoginFailure };

interface LoginResponse {
  token: string;
  /** Tuỳ chọn: { name, title, role }. Thiếu thì gọi GET /auth/me. */
  user?: unknown;
}

/**
 * Giả định hợp đồng API (cần đối chiếu với backend):
 *   POST /auth/login { identifier, password, remember } -> 2xx { token }
 *   401 { attemptsLeft? }  sai thông tin
 *   423 { retryAfter? }    tài khoản bị khóa (giây)
 *   429                    thao tác quá nhanh
 * Việc đếm số lần sai và khóa tài khoản do server quyết định.
 * Không ném lỗi ra ngoài: mọi lỗi được chuẩn hoá qua toLoginFailure.
 */
export async function login(values: LoginValues): Promise<LoginResult> {
  try {
    const { token, user } = await http.post<LoginResponse>('/auth/login', values);
    setToken(token, values.remember);
    // Lấy họ tên/chức danh/vai trò từ server; lỗi ở đây không làm hỏng đăng nhập (dự phòng: claim trong token).
    saveCurrentUser(user ?? (await http.get('/auth/me').catch(() => null)));
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

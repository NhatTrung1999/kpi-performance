import { create } from 'zustand';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

/** User do server trả về (POST /auth/login, GET /auth/me) — giữ nguyên dạng thô, session.ts tự chuẩn hoá. */
export type ServerUser = Record<string, unknown>;

type AuthState = {
  token: string | null;
  user: ServerUser | null;
  /** Đăng nhập xong: remember = true lưu lâu dài (localStorage), ngược lại chỉ trong phiên (sessionStorage). */
  signIn: (token: string, remember: boolean) => void;
  /** Access token mới sau khi refresh — giữ nguyên nơi lưu. */
  replaceToken: (token: string) => void;
  setUser: (user: unknown) => void;
  signOut: () => void;
};

// ───────── Lưu bền (storage có thể bị chặn/đầy: lỗi thì chỉ giữ trong bộ nhớ) ─────────

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/** Phiên đang lưu ở đâu: localStorage nếu "ghi nhớ", ngược lại sessionStorage. */
const currentStorage = () =>
  safe(() => (localStorage.getItem(TOKEN_KEY) !== null ? localStorage : sessionStorage), sessionStorage);

const readToken = () =>
  safe(() => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY), null);

const readUser = (): ServerUser | null =>
  safe(() => {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as ServerUser) : null;
  }, null);

const clearStorage = () =>
  safe(() => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
    }
  }, undefined);

/**
 * Phiên đăng nhập phía trình duyệt: một nguồn duy nhất cho token + user.
 * Component đọc qua selector (useAuthStore((s) => s.token)) nên tự re-render khi phiên đổi;
 * code ngoài React (axios interceptor) dùng useAuthStore.getState().
 */
export const useAuthStore = create<AuthState>()((set) => ({
  token: readToken(),
  user: readUser(),

  signIn: (token, remember) => {
    clearStorage();
    safe(() => (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token), undefined);
    set({ token, user: null });
  },

  replaceToken: (token) => {
    safe(() => currentStorage().setItem(TOKEN_KEY, token), undefined);
    set({ token });
  },

  setUser: (user) => {
    if (!user || typeof user !== 'object') return;
    safe(() => currentStorage().setItem(USER_KEY, JSON.stringify(user)), undefined);
    set({ user: user as ServerUser });
  },

  signOut: () => {
    clearStorage();
    set({ token: null, user: null });
  },
}));

// Đăng nhập/đăng xuất ở tab khác (localStorage — chỉ khi "ghi nhớ") → đồng bộ tab này.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.storageArea !== localStorage || (e.key !== null && e.key !== TOKEN_KEY && e.key !== USER_KEY)) return;
    useAuthStore.setState({ token: readToken(), user: readUser() });
  });
}

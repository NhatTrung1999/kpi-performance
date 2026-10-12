import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);

/** remember = true lưu lâu dài (localStorage), ngược lại chỉ trong phiên (sessionStorage). */
export function setToken(token: string, remember: boolean) {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30000),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chỉ tồn tại ở dev: nhánh này bị loại hoàn toàn khỏi bản build production.
if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true') {
  void import('./mock-auth').then((m) => m.installMockAuth(api));
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  config.headers['Accept-Language'] = localStorage.getItem('lang') || 'vi';
  return config;
});

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const status = error.response?.status;
    const serverMsg =
      error.response?.data?.message ?? error.response?.data?.error;
    const url = error.config?.url ?? '';

    if (status === 401 && !url.includes('/auth/login')) {
      clearToken();
      if (window.location.pathname !== '/login')
        window.location.href = '/login';
    }

    let message: string;
    if (error.code === 'ECONNABORTED')
      message = 'The server took too long to respond. Please try again.';
    else if (!error.response)
      message = 'Unable to connect to the server. Please check your network.';
    else if (status === 400) message = serverMsg ?? 'Invalid request data.';
    else if (status === 401)
      message = serverMsg ?? 'Your session has expired. Please log in again.';
    else if (status === 403)
      message = 'You do not have permission to perform this action.';
    else if (status === 404)
      message = serverMsg ?? 'The requested data was not found.';
    else if (status && status >= 500)
      message = 'The server encountered an error. Please try again later.';
    else message = serverMsg ?? 'An unexpected error occurred.';

    return Promise.reject(new ApiError(message, status, error.response?.data));
  },
);

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((res) => res.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, body, config).then((res) => res.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, body, config).then((res) => res.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((res) => res.data),
};

export async function downloadFile(
  url: string,
  params?: object,
  fallbackName = 'download.xlsx',
) {
  const res = await api.get(url, { params, responseType: 'blob' });

  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(res.data);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function uploadFile<T>(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData();
  form.append('file', file);
  return http.post<T>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) =>
      onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
  });
}

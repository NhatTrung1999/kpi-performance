import axios, { AxiosError, type AxiosAdapter, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { AppRole } from './session';

/**
 * Backend giả CHỈ cho môi trường phát triển (xem điều kiện ở axios.ts).
 * Bật bằng VITE_MOCK_AUTH=true trong .env.local. Mật khẩu chung: dev12345.
 * Chỉ giả lập /auth/login và /auth/me; mọi URL khác vẫn đi tới backend thật.
 */
const ACCOUNTS: Record<string, { name: string; title: string; role: AppRole }> = {
  'admin.dev': { name: 'Lê Quản Trị', title: 'Quản trị hệ thống', role: 'AD' },
  'chuquan.dev': { name: 'Phạm Chủ Quản', title: 'Trưởng bộ phận', role: 'CQ' },
  'nhanvien.dev': { name: 'Trần Minh Anh', title: 'Chuyên viên', role: 'NV' },
};
const PASSWORD = 'dev12345';

const reply = (config: InternalAxiosRequestConfig, status: number, data: unknown) => {
  const response = { data, status, statusText: String(status), headers: {}, config };
  return status < 400
    ? Promise.resolve(response)
    : Promise.reject(new AxiosError(`Mock ${status}`, String(status), config, null, response));
};

const userOfToken = (config: InternalAxiosRequestConfig) => {
  const token = String(config.headers.Authorization ?? '').replace('Bearer ', '');
  return token.startsWith('mock.') ? ACCOUNTS[token.slice(5)] : undefined;
};

export function installMockAuth(api: AxiosInstance) {
  const realAdapter = axios.getAdapter(api.defaults.adapter);
  const mock: AxiosAdapter = (config) => {
    const url = config.url ?? '';
    if (url.includes('/auth/login') && config.method === 'post') {
      const { identifier, password } = JSON.parse(config.data ?? '{}');
      return identifier in ACCOUNTS && password === PASSWORD
        ? reply(config, 200, { token: `mock.${identifier}`, user: ACCOUNTS[identifier] })
        : reply(config, 401, { message: 'Sai thông tin đăng nhập (mock).' });
    }
    if (url.includes('/auth/me')) {
      const user = userOfToken(config);
      return user ? reply(config, 200, user) : reply(config, 401, { message: 'Token mock không hợp lệ.' });
    }
    return realAdapter(config);
  };
  api.defaults.adapter = mock;
  console.info('[mock-auth] Đang dùng backend giả cho /auth — tài khoản: admin.dev, chuquan.dev, nhanvien.dev / dev12345');
}

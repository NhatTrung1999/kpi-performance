import axios, { AxiosError, type AxiosAdapter, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import i18n from '@/i18n';
import type { AppRole } from './session';

/**
 * Backend giả CHỈ cho môi trường phát triển (xem điều kiện ở axios.ts).
 * Bật bằng VITE_MOCK_AUTH=true trong .env.local. Mật khẩu chung: dev12345.
 * Chỉ giả lập /auth/login và /auth/me; mọi URL khác vẫn đi tới backend thật.
 * Nhân viên (nhanvien.dev) đúng mật khẩu vẫn bị từ chối 403 NO_ACCESS như backend thật.
 */
const ACCOUNTS: Record<string, { name: string; title: string; email: string; role: AppRole }> = {
  'admin.dev': { name: 'Lê Quản Trị', title: 'System administrator', email: 'admin.dev@example.com', role: 'AD' },
  'chuquan.dev': { name: 'Phạm Chủ Quản', title: 'Department head', email: 'chuquan.dev@example.com', role: 'CQ' },
  'bld.dev': { name: 'Võ Lãnh Đạo', title: 'Board of directors', email: 'bld.dev@example.com', role: 'BLD' },
  'nhanvien.dev': { name: 'Trần Minh Anh', title: 'Specialist', email: 'nhanvien.dev@example.com', role: 'NV' },
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
      if (!(identifier in ACCOUNTS) || password !== PASSWORD) return reply(config, 401, { message: i18n.t('errors:mock.invalid') });
      if (ACCOUNTS[identifier].role === 'NV') return reply(config, 403, { code: 'NO_ACCESS' });
      return reply(config, 200, { token: `mock.${identifier}`, user: ACCOUNTS[identifier] });
    }
    if (url.includes('/auth/me')) {
      const user = userOfToken(config);
      return user ? reply(config, 200, user) : reply(config, 401, { message: i18n.t('errors:mock.token') });
    }
    return realAdapter(config);
  };
  api.defaults.adapter = mock;
  console.info('[mock-auth] Using the fake backend for /auth — accounts: admin.dev, chuquan.dev, bld.dev (nhanvien.dev → 403) / dev12345');
}

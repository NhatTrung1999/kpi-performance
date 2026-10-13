import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/en/common.json';
import nav from './locales/en/nav.json';
import auth from './locales/en/auth.json';
import errors from './locales/en/errors.json';
import roles from './locales/en/roles.json';
import dashboard from './locales/en/dashboard.json';

/** Bản dịch gốc — kiểu của nó là nguồn cho key có kiểm tra (xem i18next.d.ts). */
export const resources = { common, nav, auth, errors, roles, dashboard } as const;

export const DEFAULT_LANGUAGE = 'en';
export const NAMESPACES = Object.keys(resources) as (keyof typeof resources)[];

// Hiện chỉ có tiếng Anh. Thêm ngôn ngữ: tạo locales/<mã>/ cùng bộ file, đăng ký vào `resources` theo mã.
void i18n.use(initReactI18next).init({
  resources: { [DEFAULT_LANGUAGE]: resources },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: NAMESPACES,
  interpolation: { escapeValue: false }, // React đã escape
  returnNull: false,
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/en/common.json';
import nav from './locales/en/nav.json';
import auth from './locales/en/auth.json';
import errors from './locales/en/errors.json';
import roles from './locales/en/roles.json';
import dashboard from './locales/en/dashboard.json';
import team from './locales/en/team.json';
import proposal from './locales/en/proposal.json';
import viCommon from './locales/vi/common.json';
import viNav from './locales/vi/nav.json';
import viAuth from './locales/vi/auth.json';
import viErrors from './locales/vi/errors.json';
import viRoles from './locales/vi/roles.json';
import viProposal from './locales/vi/proposal.json';

/** Bản dịch gốc (tiếng Anh) — kiểu của nó là nguồn cho key có kiểm tra (xem i18next.d.ts). */
export const resources = { common, nav, auth, errors, roles, dashboard, team, proposal } as const;

/** Namespace của các trang đang dùng; `dashboard`, `team` thuộc các trang cũ đã gỡ khỏi menu nên chỉ có tiếng Anh. */
type ActiveNs = 'common' | 'nav' | 'auth' | 'errors' | 'roles' | 'proposal';

/** Tiếng Việt: kiểm tra kiểu theo bản tiếng Anh để không thiếu key. */
const vi: { [K in ActiveNs]: (typeof resources)[K] } = {
  common: viCommon,
  nav: viNav,
  auth: viAuth,
  errors: viErrors,
  roles: viRoles,
  proposal: viProposal,
};

export const DEFAULT_LANGUAGE = 'vi';
export const NAMESPACES = Object.keys(resources) as (keyof typeof resources)[];

// Thêm ngôn ngữ: tạo locales/<mã>/ cùng bộ file, đăng ký vào `resources` theo mã và thêm locale Intl ở lib/format.ts.
void i18n.use(initReactI18next).init({
  resources: { en: resources, vi },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: NAMESPACES,
  interpolation: { escapeValue: false }, // React đã escape
  returnNull: false,
});

document.documentElement.lang = DEFAULT_LANGUAGE;

export default i18n;

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
import promotion from './locales/en/promotion.json';
import viCommon from './locales/vi/common.json';
import viNav from './locales/vi/nav.json';
import viAuth from './locales/vi/auth.json';
import viErrors from './locales/vi/errors.json';
import viRoles from './locales/vi/roles.json';
import viProposal from './locales/vi/proposal.json';
import viPromotion from './locales/vi/promotion.json';
import zhCommon from './locales/zh/common.json';
import zhNav from './locales/zh/nav.json';
import zhAuth from './locales/zh/auth.json';
import zhErrors from './locales/zh/errors.json';
import zhRoles from './locales/zh/roles.json';
import zhProposal from './locales/zh/proposal.json';
import zhPromotion from './locales/zh/promotion.json';

/** Bản dịch gốc (tiếng Anh) — kiểu của nó là nguồn cho key có kiểm tra (xem i18next.d.ts). */
export const resources = { common, nav, auth, errors, roles, dashboard, team, proposal, promotion } as const;

/** Namespace của các trang đang dùng; `dashboard`, `team` thuộc các trang cũ đã gỡ khỏi menu nên chỉ có tiếng Anh. */
type ActiveNs = 'common' | 'nav' | 'auth' | 'errors' | 'roles' | 'proposal' | 'promotion';

/** Tiếng Việt: kiểm tra kiểu theo bản tiếng Anh để không thiếu key. */
const vi: { [K in ActiveNs]: (typeof resources)[K] } = {
  common: viCommon,
  nav: viNav,
  auth: viAuth,
  errors: viErrors,
  roles: viRoles,
  proposal: viProposal,
  promotion: viPromotion,
};

/** Tiếng Trung phồn thể (zh-TW, như file Excel của LYV): cũng kiểm tra kiểu theo bản tiếng Anh. */
const zh: { [K in ActiveNs]: (typeof resources)[K] } = {
  common: zhCommon,
  nav: zhNav,
  auth: zhAuth,
  errors: zhErrors,
  roles: zhRoles,
  proposal: zhProposal,
  promotion: zhPromotion,
};

/** Ngôn ngữ người dùng chọn được (nút đổi ngôn ngữ trên thanh trên cùng), theo thứ tự trên nút. Tiếng Anh cũng là dự phòng khi thiếu key. */
export const LANGUAGES = ['vi', 'zh', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'vi';

/** Ngôn ngữ đã lưu (lib/language.ts ghi) — đọc ngay khi khởi tạo để không nháy tiếng Việt rồi mới đổi. */
const initialLanguage = (): Language => {
  try {
    const v = localStorage.getItem('kpi-language');
    if (v && (LANGUAGES as readonly string[]).includes(v)) return v as Language;
  } catch {
    /* storage bị chặn */
  }
  return DEFAULT_LANGUAGE;
};
export const NAMESPACES = Object.keys(resources) as (keyof typeof resources)[];

// Thêm ngôn ngữ: tạo locales/<mã>/ cùng bộ file, đăng ký vào `resources` theo mã và thêm locale Intl ở lib/format.ts.
void i18n.use(initReactI18next).init({
  resources: { en: resources, vi, zh },
  lng: initialLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: NAMESPACES,
  interpolation: { escapeValue: false }, // React đã escape
  returnNull: false,
});


export default i18n;

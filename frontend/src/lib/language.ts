import { useSyncExternalStore } from 'react';
import i18n, { DEFAULT_LANGUAGE, LANGUAGES, type Language } from '@/i18n';

/** Ngôn ngữ người dùng chọn, nhớ trong localStorage (cùng khóa i18n/index.ts đọc lúc khởi tạo). */
const KEY = 'kpi-language';

/** Thuộc tính lang của <html> (đọc màn hình, font chữ Hán phồn thể). */
const HTML_LANG: Record<Language, string> = { vi: 'vi', zh: 'zh-Hant-TW', en: 'en' };

const isLanguage = (v: unknown): v is Language => typeof v === 'string' && (LANGUAGES as readonly string[]).includes(v);

const current = (): Language => (isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE);

const applyHtmlLang = (lng: Language) => {
  document.documentElement.lang = HTML_LANG[lng];
};

/** Gọi một lần lúc khởi động (i18n đã đọc ngôn ngữ đã lưu khi khởi tạo — xem i18n/index.ts): đặt lang cho <html>. */
export function initLanguage() {
  applyHtmlLang(current());
}

export function setLanguage(lng: Language) {
  try {
    localStorage.setItem(KEY, lng);
  } catch {
    /* storage bị chặn */
  }
  applyHtmlLang(lng);
  void i18n.changeLanguage(lng);
}

const subscribe = (onChange: () => void) => {
  i18n.on('languageChanged', onChange);
  return () => i18n.off('languageChanged', onChange);
};

export const useLanguage = () => useSyncExternalStore(subscribe, current);

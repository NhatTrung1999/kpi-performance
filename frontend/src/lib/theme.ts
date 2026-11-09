import { useSyncExternalStore } from "react";

/**
 * Sáng / tối cho toàn app (cả trang đăng nhập). Nguồn sự thật duy nhất: class `dark` trên `<html>`.
 * Lưu lựa chọn ở localStorage `kpi-theme`; chưa chọn thì theo hệ điều hành. index.html có script chống nháy làm y hệt initTheme.
 */
export type Theme = "light" | "dark";
const KEY = "kpi-theme";
const root = () => document.documentElement;

export const getTheme = (): Theme => (root().classList.contains("dark") ? "dark" : "light");

function apply(theme: Theme) {
  root().classList.toggle("dark", theme === "dark");
  root().style.colorScheme = theme;
}

/** Người dùng chủ động chọn → lưu lại. */
export function setTheme(theme: Theme) {
  apply(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Không lưu được: chỉ có tác dụng tới khi tải lại trang.
  }
}

/** Gọi một lần trong main.tsx trước khi render. */
export function initTheme() {
  let saved: Theme | null = null;
  try {
    saved = localStorage.getItem(KEY) as Theme | null;
  } catch {
    // bỏ qua
  }
  apply(saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
}

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(root(), { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

/** ThemeToggle và Toaster cùng đọc từ đây. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

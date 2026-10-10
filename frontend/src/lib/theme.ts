import { useSyncExternalStore } from "react";

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
  localStorage.setItem(KEY, theme);
}

/** Gọi một lần trong main.tsx trước khi render (index.html có script chống nháy — xem README). */
export function initTheme() {
  const saved = localStorage.getItem(KEY) as Theme | null;
  apply(saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
}

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(root(), { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

/** Nguồn sự thật duy nhất: class `dark` trên <html>. ThemeToggle và Toaster cùng đọc từ đây. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

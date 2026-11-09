import { useTranslation } from "react-i18next";
import { LANGUAGES, type Language } from "@/i18n";
import { setLanguage, useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

/** Nhãn ngắn trên nút (không dịch — luôn hiện đúng chữ của ngôn ngữ đó để người không đọc được ngôn ngữ hiện tại vẫn nhận ra). */
const SHORT: Record<Language, string> = { vi: "VI", zh: "中文", en: "EN" };

/**
 * Nút chuyển ngôn ngữ dạng các nút liền (Tiếng Việt / 中文 / English), đặt trên thanh trên cùng và trang đăng nhập.
 * Nền của nút đang chọn là một lớp riêng trượt qua lại (các nút rộng bằng nhau nên chỉ cần dịch theo chỉ số);
 * người dùng bật "giảm chuyển động" thì đổi ngay, không trượt.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const index = Math.max(0, LANGUAGES.indexOf(lang));
  return (
    <div
      role="group"
      aria-label={t("language.switch")}
      className={cn("relative grid h-9 flex-none auto-cols-fr grid-flow-col items-center rounded-full border border-border bg-card p-0.5", className)}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-full bg-[var(--switch-active,var(--accent))] shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: `calc((100% - 4px) / ${LANGUAGES.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {LANGUAGES.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            lang={l === "zh" ? "zh-Hant-TW" : l}
            aria-pressed={active}
            title={t(`language.${l}`)}
            onClick={() => !active && setLanguage(l)}
            className={cn(
              "relative h-full min-w-11 rounded-full px-2 text-xs font-semibold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none",
              active ? "text-[var(--switch-active-foreground,var(--brand-text))]" : "text-text-secondary hover:text-foreground"
            )}
          >
            {SHORT[l]}
          </button>
        );
      })}
    </div>
  );
}

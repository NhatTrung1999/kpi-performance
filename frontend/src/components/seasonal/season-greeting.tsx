import { useTranslation } from "react-i18next";
import type { ActiveSeason } from "@/lib/season";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

/**
 * Thẻ kính mờ chúc mừng theo dịp lễ (trang đăng nhập):
 * - Tết: kính đỏ, viền vàng kim, ấn "福"; tên năm can chi theo ngôn ngữ đang chọn.
 * - Giáng sinh: kính xanh thông, viền vàng kim, ấn ngôi sao.
 */
export function SeasonGreeting({ active, className }: { active: ActiveSeason; className?: string }) {
  const { t } = useTranslation("auth");
  const lang = useLanguage();
  const tet = active.season === "tet";
  const key = tet ? "tet" : "xmas";
  const kicker = tet ? t("tet.year", { name: active.tet[lang] }) : t("xmas.kicker", { year: active.year });
  return (
    <section aria-label={t(`${key}.title`, { year: active.year })} className={cn(tet ? "tet-glass" : "xmas-glass", "flex items-center gap-4 px-5 py-4 text-white", className)}>
      <span aria-hidden="true" className={cn("season-seal grid size-12 flex-none place-items-center rounded-2xl text-2xl font-bold", !tet && "text-[26px]")}>
        {tet ? "福" : "★"}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", tet ? "text-amber-200/90" : "text-emerald-100/85")}>{kicker}</span>
        <span className="bg-linear-to-r from-amber-100 via-yellow-200 to-amber-300 bg-clip-text text-lg leading-tight font-bold text-transparent">
          {t(`${key}.title`, { year: active.year })}
        </span>
        <span className={cn("text-[13px]", tet ? "text-rose-50/80" : "text-emerald-50/80")}>{t(`${key}.wish`)}</span>
      </div>
    </section>
  );
}

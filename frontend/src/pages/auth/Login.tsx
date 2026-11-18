import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Download, FileText, Flower2, Mail, Megaphone, ShieldCheck, Smartphone, Snowflake, TrendingUp, Wrench, type LucideIcon } from "lucide-react";

import { AppLogo } from "@/components/ui/app-logo";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { SeasonGreeting } from "@/components/seasonal/season-greeting";
import { SeasonParticles } from "@/components/seasonal/season-particles";
import { HR_ANNOUNCEMENTS, UPDATES, type UpdateIcon } from "@/config/announcements";
import { useNow } from "@/hooks/use-now";
import { formatClockParts, formatDate, formatLongDate } from "@/lib/format";
import { WEEKS_IN_QUARTER, getQuarterInfo } from "@/lib/quarter";
import { getCurrentUser } from "@/lib/session";
import { measureFps } from "@/lib/perf";
import { activeSeason, setSeasonOff, useSeasonOff } from "@/lib/season";
import { useGlassUi } from "@/lib/ui-theme";
import { cn } from "@/lib/utils";
import { crack, shatter } from "@/lib/shatter";
import { homeOf } from "@/routes/config";

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const UPDATE_ICON: Record<UpdateIcon, React.ReactNode> = {
  wrench: <Wrench />,
  download: <Download />,
  smartphone: <Smartphone />,
  mail: <Mail />,
};

/** 3 tính năng chính giới thiệu trên khối gradient (nhãn trong auth.json `hero.features.*`). */
const FEATURES: readonly { key: "proposal" | "promotion" | "permissions"; icon: LucideIcon }[] = [
  { key: "proposal", icon: FileText },
  { key: "promotion", icon: TrendingUp },
  { key: "permissions", icon: ShieldCheck },
];

// Trang công khai (trước đăng nhập): chỉ hiện giờ, quý và nội dung công khai từ config — không có dữ liệu cá nhân/KPI.

const Login = () => {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  // Trang trí theo dịp lễ — Tết, Giáng sinh (lib/season.ts): theo lịch hoặc `?season=tet|xmas`; người dùng tắt được.
  const [season] = useState(() => activeSeason());
  const seasonOff = useSeasonOff();
  // Giao diện kính (mặc định) hay phẳng sáng — chung lựa chọn với trang trong (lib/ui-theme.ts). Phẳng: không nền cực quang,
  // không kính, không nứt/vỡ kính, không trang trí lễ (thẻ chúc mừng kính + tuyết trắng không hợp nền sáng).
  const glass = useGlassUi();
  const decor = glass && season && !seasonOff ? season : null;
  const rootRef = useRef<HTMLDivElement>(null);
  // Máy yếu → chế độ nhẹ (lib/perf.ts).
  useEffect(() => measureFps(), []);
  // Rê chuột (chuột/bút, không tính chạm) lên thẻ kính (các thẻ bên trái + thẻ đăng nhập — `[data-crack]`): sau một nhịp ngắn kính nứt tại chỗ con trỏ đang đứng
  // (không phải mép vừa đi vào), rời ra thì vết nứt mờ đi. Đang có trang trí lễ thì tắt (hiệu ứng kính vỡ không hợp không khí lễ).
  const decorOn = decor !== null;
  const glassFx = glass && !decorOn;
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !glassFx) return;
    const active = new Map<HTMLElement, () => void>();
    const pending = new Map<HTMLElement, number>();
    let last = { x: 0, y: 0 };
    const cardOf = (e: PointerEvent) => (e.target as Element).closest<HTMLElement>('[data-slot="info-card"], [data-crack]');
    const inside = (card: HTMLElement, e: PointerEvent) => e.relatedTarget instanceof Node && card.contains(e.relatedTarget);
    const move = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
    };
    const over = (e: PointerEvent) => {
      const card = cardOf(e);
      if (!card || e.pointerType === "touch" || active.has(card) || pending.has(card) || inside(card, e)) return;
      move(e);
      pending.set(card, window.setTimeout(() => {
        pending.delete(card);
        // Thẻ đăng nhập: nứt nhạt hơn và chừa trống ô nhập + nút để chữ gõ vào luôn rõ.
        const form = card.hasAttribute("data-crack");
        active.set(card, crack(card, last, form ? { opacity: 0.5, exclude: 'input, button[type="submit"]' } : undefined));
      }, 120));
    };
    const out = (e: PointerEvent) => {
      const card = cardOf(e);
      if (!card || inside(card, e)) return;
      window.clearTimeout(pending.get(card));
      pending.delete(card);
      active.get(card)?.();
      active.delete(card);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerover", over);
    root.addEventListener("pointerout", out);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerover", over);
      root.removeEventListener("pointerout", out);
      pending.forEach((id) => window.clearTimeout(id));
      active.forEach((remove) => remove());
    };
  }, [glassFx]);
  const leaving = useRef(false);
  // Đăng nhập thành công: thẻ kính vỡ tung từ chỗ nút Đăng nhập (lib/shatter.ts) rồi mới vào trang trong;
  // đang có trang trí lễ hoặc giao diện phẳng thì vào thẳng, không vỡ kính.
  const enter = async () => {
    if (leaving.current) return;
    leaving.current = true;
    const card = cardRef.current;
    if (card && glassFx) {
      const b = card.querySelector<HTMLElement>('button[type="submit"]')?.getBoundingClientRect();
      await shatter(card, b && { x: b.left + b.width / 2, y: b.top + b.height / 2 });
    }
    navigate(homeOf(getCurrentUser().role), { replace: true });
  };
  const now = useNow();

  const clock = formatClockParts(now, TIME_ZONE);
  const quarter = getQuarterInfo(now, TIME_ZONE);
  const announcement = HR_ANNOUNCEMENTS.find((a) => a.pinned) ?? HR_ANNOUNCEMENTS[0];
  const daysLabel = t("daysLeft", { count: quarter.daysLeft, quarter: quarter.quarter });

  const newest = UPDATES[0];

  // Đổi theme / ngôn ngữ: ở bên form (từ lg) hoặc trên khối gradient (điện thoại).
  const controls = (
    <>
      <ThemeToggle />
      <LanguageSwitch className="liquid-glass" />
      {glass && season && (
        <button
          type="button"
          aria-pressed={!seasonOff}
          aria-label={seasonOff ? t("season.decorOn") : t("season.decorOff")}
          title={seasonOff ? t("season.decorOn") : t("season.decorOff")}
          onClick={() => setSeasonOff(!seasonOff)}
          className={cn(
            "liquid-glass grid size-9 flex-none place-items-center rounded-full border border-border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-[17px]",
            seasonOff ? "text-text-secondary" : season.season === "tet" ? "text-amber-300" : "text-sky-200"
          )}
        >
          {season.season === "tet" ? <Flower2 aria-hidden="true" /> : <Snowflake aria-hidden="true" />}
        </button>
      )}
    </>
  );

  return (
    // Chia đôi màn hình: trái = khối gradient giới thiệu (tiêu đề, 3 tính năng, thẻ xem trước nổi: tiến độ quý, đồng hồ,
    // thông báo HR, mục mới nhất); phải = form đăng nhập trên nền chấm. Chỉ thông tin công khai.
    <div
      ref={rootRef}
      className={cn(
        "relative isolate flex min-h-dvh flex-col font-login text-foreground lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1.2fr)_minmax(440px,1fr)]",
        glass ? "login-backdrop" : "flat-backdrop",
        decor && `season-${decor.season}`
      )}
    >
      <section className="login-panel relative isolate m-3 mb-0 flex flex-col overflow-hidden rounded-[20px] px-4 py-2 sm:px-6 lg:mb-3 lg:rounded-[28px] lg:px-10 lg:pt-7 lg:pb-8 xl:px-12 2xl:px-16 [@media(max-height:760px)]:lg:pt-5 [@media(max-height:760px)]:lg:pb-6">
        <PanelDecor />

        <header className="on-band flex h-11 flex-none animate-card-in items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Thay bằng logo công ty */}
            <AppLogo />
            <span className="truncate text-[15px] font-bold max-[379px]:sr-only">{t("common:appName")}</span>
          </div>
          <div className="flex items-center gap-2 lg:hidden">{controls}</div>
        </header>

        {/* Dưới lg: ẩn phần giới thiệu, khối xanh chỉ còn thanh logo + nút sáng/tối, ngôn ngữ; form ngay bên dưới. */}
        <div className="hidden min-h-0 flex-1 flex-col justify-center gap-7 lg:flex lg:py-8 [@media(max-height:760px)]:lg:gap-5">
          <div className="on-band flex animate-fade-up flex-col items-start gap-3 lg:gap-4">
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border bg-white/10 px-3 text-xs font-semibold [@media(max-height:720px)]:max-lg:hidden">
              <span aria-hidden="true" className="size-1.5 animate-pulse-soft rounded-full bg-emerald-300" />
              {t("quarterInProgress", { quarter: quarter.quarter })} · {t("quarterWeek", { week: quarter.week, total: WEEKS_IN_QUARTER })}
            </span>
            <h1 className="max-w-[20ch] text-[26px] leading-[1.1] font-bold tracking-[-0.03em] text-balance sm:text-[30px] lg:max-w-[17ch] lg:text-[40px] 2xl:text-[52px] [@media(max-height:760px)]:lg:text-[36px]">
              {t("hero.title")}
            </h1>
            <p className="hidden max-w-[46ch] text-[15px] leading-relaxed text-text-secondary lg:block">{t("hero.subtitle")}</p>
            <ul className="hidden flex-wrap gap-2 lg:flex">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-white/10 pr-3.5 pl-1.5 text-[13px] font-semibold">
                  <span aria-hidden="true" className="grid size-6.5 place-items-center rounded-full bg-white text-brand-from [&>svg]:size-3.5">
                    <Icon />
                  </span>
                  {t(`hero.features.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Thẻ xem trước (từ lg): nền thẻ thường (không .on-band), nổi nhẹ lên xuống. */}
          <div className="hidden max-w-[640px] grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 xl:grid [@media(max-height:680px)]:xl:hidden">
            <div className="flex animate-bob flex-col items-center justify-center gap-2 rounded-[22px] bg-card px-5 py-5 text-center shadow-toast motion-reduce:animate-none">
              <ProgressRing value={quarter.progress} label={t("hero.progressLabel")} />
              <p className="text-[13px] leading-snug text-muted-foreground">
                <b className="text-[15px] font-bold text-foreground tabular-nums">{quarter.daysLeft}</b> {daysLabel}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex animate-bob-slow flex-col gap-1 rounded-[22px] bg-card px-5 py-4 shadow-toast motion-reduce:animate-none">
                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{t("clockLabel")}</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[34px] leading-none font-bold tracking-[-0.04em] tabular-nums">
                    {clock.hours}
                    <span className="animate-colon">:</span>
                    {clock.minutes}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{clock.period}</span>
                </span>
                <span className="text-xs text-text-secondary">{formatLongDate(now, TIME_ZONE)}</span>
              </div>
              {announcement && (
                <div className="flex animate-bob items-start gap-3 rounded-[22px] bg-card px-4 py-3.5 shadow-toast [animation-delay:-3s] motion-reduce:animate-none">
                  <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-xl bg-warning-soft text-warning-text [&>svg]:size-4">
                    <Megaphone />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-warning-text">{t("announcementBadge")}</span>
                    <span className="text-[13px] leading-snug font-semibold">{announcement.title}</span>
                    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{announcement.description}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mục mới nhất của "Có gì mới" (từ lg). */}
        {newest && (
          <div className="on-band hidden flex-none animate-card-in items-center gap-3 border-t border-border pt-4 text-[13px] [animation-delay:300ms] xl:flex">
            <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-[10px] bg-muted [&>svg]:size-4">
              {UPDATE_ICON[newest.icon]}
            </span>
            <span className="font-semibold">{t("updatesTitle")}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold">{t(`updateKind.${newest.kind}`)}</span>
            <span className="min-w-0 truncate">
              {newest.title}
              {newest.detail && <span className="text-text-secondary"> · {newest.detail}</span>}
            </span>
            <span className="ml-auto flex-none text-text-secondary tabular-nums">{formatDate(newest.date, false)}</span>
          </div>
        )}
      </section>

      <main className="relative flex flex-1 flex-col px-4 pt-3 pb-3 sm:px-8 lg:pb-5 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:pt-6 xl:px-12 2xl:px-16">
        <div className="hidden flex-none items-center justify-end gap-2 lg:flex">{controls}</div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4 lg:py-6">
          {decor && <SeasonGreeting active={decor} className="w-full max-w-[440px] flex-none animate-form-in [animation-delay:160ms]" />}
          <div
            ref={cardRef}
            data-crack
            className={cn(
              "w-full max-w-[440px] animate-form-in p-6 text-foreground [animation-delay:200ms] sm:p-8 xl:p-9 [@media(max-height:760px)]:lg:py-7",
              glass ? "dark login-form-glass rounded-2xl" : "rounded-[28px] border border-border/70 bg-card shadow-panel"
            )}
          >
            <LoginForm onSuccess={() => void enter()} />
          </div>
        </div>
      </main>
      {decor && <SeasonParticles season={decor.season} />}
    </div>
  );
};

/** Vòng tiến độ quý (SVG): nét gradient thương hiệu, % ở giữa. */
function ProgressRing({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className="relative size-30">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <defs>
          <linearGradient id="login-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-from)" />
            <stop offset="100%" stopColor="var(--brand-to)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#login-ring)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl leading-none font-bold tracking-[-0.03em] tabular-nums">{Math.round(pct)}%</span>
        <span className="mt-1 text-[10.5px] font-medium text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

/** Hoa văn khối gradient: lưới chấm, vòng tròn lớn, vòng nét đứt, sóng ở đáy (dưới nội dung). */
function PanelDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="shell-band-dots" />
      <div className="absolute -top-40 -right-40 size-[520px] rounded-full border-[56px] border-white/[.07]" />
      <div className="absolute right-[18%] bottom-[22%] size-32 rounded-full border-2 border-dashed border-white/25" />
      <div className="absolute -bottom-48 -left-32 size-[440px] rounded-full bg-white/[.05]" />
      <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full">
        <path d="M0 70 C 160 20 300 110 480 64 S 700 30 800 60 V120 H0z" fill="rgb(255 255 255 / 0.06)" />
        <path d="M0 92 C 180 60 340 120 520 88 S 720 64 800 90 V120 H0z" fill="rgb(255 255 255 / 0.08)" />
      </svg>
    </div>
  );
}

export default Login;

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Download, Flower2, Mail, Megaphone, Smartphone, Snowflake, Wrench } from "lucide-react";

import { AppLogo } from "@/components/ui/app-logo";
import { AnnouncementCard } from "@/components/ui/announcement-card";
import { ClockCard } from "@/components/ui/clock-card";
import { CountdownCard } from "@/components/ui/countdown-card";
import { QuarterProgress } from "@/components/ui/quarter-progress";
import { UpdatesList, type UpdateTone, type UpdatesListItem } from "@/components/ui/updates-list";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { SeasonGreeting } from "@/components/seasonal/season-greeting";
import { SeasonParticles } from "@/components/seasonal/season-particles";
import { HR_ANNOUNCEMENTS, RELEASE_NOTES_URL, UPDATES, type UpdateIcon, type UpdateKind } from "@/config/announcements";
import { useNow } from "@/hooks/use-now";
import { formatClockParts, formatDate, formatLongDate, formatMonthShort } from "@/lib/format";
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
// Màn hình thấp: bớt dòng cuối để khối không bị cắt.
const SHORT_SCREEN_HIDE = ["", "", "[@media(max-height:620px)]:hidden", "[@media(max-height:700px)]:hidden"];
const UPDATE_TONE: Record<UpdateKind, UpdateTone> = { planned: "warning", new: "brand", improved: "info" };

// Trang công khai (trước đăng nhập): chỉ hiện giờ, quý và nội dung công khai từ config — không có dữ liệu cá nhân/KPI.
/** Cột thông tin nền tối: ô đang chọn của nút ngôn ngữ trắng đặc chữ tím, như thanh trên cùng trong ứng dụng. */
const LOGIN_INFO_VARS = { "--switch-active": "#FFFFFF", "--switch-active-foreground": "#1D4ED8" } as CSSProperties;

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

  const updates: UpdatesListItem[] = UPDATES.map((u, i) => ({
    id: u.id,
    icon: UPDATE_ICON[u.icon],
    tone: UPDATE_TONE[u.kind],
    tag: t(`updateKind.${u.kind}`),
    title: u.title,
    detail: u.detail,
    date: formatDate(u.date, false),
    href: u.href,
    className: i >= 2 ? SHORT_SCREEN_HIDE[Math.min(i, 3)] : undefined,
  }));

  return (
    // Đồng bộ với khung trang trong: nền xanh navy + họa tiết (`login-backdrop`, index.css), cột thông tin tông tối
    // (class `dark` chỉ trên cột này), thẻ đăng nhập giữ màu thường — mảng sáng duy nhất để mắt vào ô nhập.
    <div ref={rootRef} className={cn("relative isolate min-h-dvh overflow-x-hidden font-login text-foreground lg:h-dvh lg:overflow-hidden", glass ? "login-backdrop" : "flat-backdrop", decor && `season-${decor.season}`)}>

      <div className="mx-auto flex min-h-dvh max-w-[1680px] flex-col gap-4 p-4 sm:p-6 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_clamp(380px,32vw,448px)] lg:gap-6 xl:gap-8 xl:p-12 [@media(max-height:820px)]:lg:p-6">
        {/* Cột thông tin: trên mobile chỉ còn header + thẻ đếm ngược nhỏ */}
        <section className={cn("flex min-w-0 flex-col gap-4 text-foreground lg:min-h-0", glass && "dark login-glass")} style={glass ? LOGIN_INFO_VARS : undefined}>
          <header className="flex animate-card-in items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Thay bằng logo công ty */}
              <AppLogo />
              <span className="text-[15px] font-bold">{t("common:appName")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden h-7 items-center gap-2 rounded-full border border-border px-3 text-xs text-muted-foreground lg:flex">
                <span aria-hidden="true" className="size-1.5 animate-pulse-soft rounded-full bg-success" />
                {t("today")}
              </span>
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
            </div>
          </header>

          <CountdownCard
            compact
            className="lg:hidden"
            days={quarter.daysLeft}
            daysLabel={daysLabel}
            trailing={`${clock.hours}:${clock.minutes} ${clock.period}`}
          />

          <div className="hidden min-h-0 flex-1 flex-col gap-4 lg:flex">
            <div className="grid shrink-0 grid-cols-2 gap-4 lg:min-h-[clamp(132px,19vh,168px)]">
              <ClockCard
                delay={90}
                label={t("clockLabel")}
                hours={clock.hours}
                minutes={clock.minutes}
                period={clock.period}
                date={formatLongDate(now, TIME_ZONE)}
              />
              <CountdownCard
                delay={180}
                label={t("countdownLabel")}
                days={quarter.daysLeft}
                daysLabel={daysLabel}
                weeks={WEEKS_IN_QUARTER}
                filledWeeks={quarter.week}
              />
            </div>

            {announcement && (
              <AnnouncementCard
                delay={270}
                icon={<Megaphone />}
                badge={t("announcementBadge")}
                title={announcement.title}
                description={announcement.description}
                aside={announcement.pinned ? t("announcementPinned") : undefined}
              />
            )}

            <QuarterProgress
              delay={360}
              title={t("quarterInProgress", { quarter: quarter.quarter })}
              caption={t("quarterWeek", { week: quarter.week, total: WEEKS_IN_QUARTER })}
              progress={quarter.progress}
              marks={[
                formatDate(quarter.startDate, false),
                ...quarter.months.slice(1).map(formatMonthShort),
                formatDate(quarter.endDate, false),
              ]}
            />

            <UpdatesList
              delay={450}
              className="min-h-0 flex-1"
              title={t("updatesTitle")}
              action={RELEASE_NOTES_URL ? { label: t("releaseNotes"), href: RELEASE_NOTES_URL } : undefined}
              items={updates}
            />
          </div>
        </section>

        {/* Form: thẻ vào sau cùng */}
        <main className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 lg:justify-center">
          {decor && <SeasonGreeting active={decor} className="w-full max-w-[468px] flex-none animate-form-in [animation-delay:160ms] lg:max-w-none" />}
          <div ref={cardRef} data-crack className={cn(
              "max-h-full w-full max-w-[468px] animate-form-in overflow-y-auto rounded-2xl p-6 text-foreground [animation-delay:220ms] sm:p-8 lg:max-w-none lg:p-10 [@media(max-height:820px)]:lg:p-8",
              glass ? "dark login-form-glass" : "rounded-[28px] border border-border/70 bg-card shadow-panel"
            )}
          >
            <LoginForm onSuccess={() => void enter()} />
          </div>
        </main>
      </div>
      {decor && <SeasonParticles season={decor.season} />}
    </div>
  );
};

export default Login;

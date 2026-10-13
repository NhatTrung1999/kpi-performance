import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChartLine, Download, Mail, Megaphone, Smartphone, Wrench } from "lucide-react";

import { AnnouncementCard } from "@/components/ui/announcement-card";
import { ClockCard } from "@/components/ui/clock-card";
import { CountdownCard } from "@/components/ui/countdown-card";
import { QuarterProgress } from "@/components/ui/quarter-progress";
import { UpdatesList, type UpdateTone, type UpdatesListItem } from "@/components/ui/updates-list";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { HR_ANNOUNCEMENTS, RELEASE_NOTES_URL, UPDATES, type UpdateIcon, type UpdateKind } from "@/config/announcements";
import { useNow } from "@/hooks/use-now";
import { formatClockParts, formatDate, formatLongDate, formatMonthShort } from "@/lib/format";
import { WEEKS_IN_QUARTER, getQuarterInfo } from "@/lib/quarter";

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
const Login = () => {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
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
    <div className="relative isolate min-h-dvh overflow-x-hidden bg-page font-login text-foreground lg:h-dvh lg:overflow-hidden">
      {/* Nền: lưới mờ + quầng sáng thương hiệu */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[length:48px_48px] opacity-60 [mask-image:radial-gradient(80%_80%_at_30%_30%,#000,transparent)]"
      />
      <div aria-hidden="true" className="absolute -top-40 -left-32 -z-10 h-[520px] w-[760px] rounded-full bg-brand/20 blur-[60px]" />
      <div aria-hidden="true" className="absolute right-[6%] bottom-[8%] -z-10 hidden h-[560px] w-[560px] rounded-full bg-brand/15 blur-[80px] lg:block" />

      <div className="mx-auto flex min-h-dvh max-w-[1680px] flex-col gap-4 p-4 sm:p-6 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_clamp(380px,32vw,448px)] lg:gap-6 xl:gap-8 xl:p-12 [@media(max-height:820px)]:lg:p-6">
        {/* Cột thông tin: trên mobile chỉ còn header + thẻ đếm ngược nhỏ */}
        <section className="flex min-w-0 flex-col gap-4 lg:min-h-0">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Thay bằng logo công ty */}
              <div className="grid size-[30px] place-items-center rounded-[9px] bg-brand-gradient text-white">
                <ChartLine aria-hidden="true" className="size-4" />
              </div>
              <span className="text-[15px] font-bold">{t("common:appName")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden h-7 items-center gap-2 rounded-full border border-border px-3 text-xs text-muted-foreground lg:flex">
                <span aria-hidden="true" className="size-1.5 animate-pulse-soft rounded-full bg-success" />
                {t("today")}
              </span>
              <ThemeToggle />
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
            <div className="grid shrink-0 grid-cols-2 gap-4 lg:h-[clamp(132px,19vh,168px)]">
              <ClockCard
                delay={60}
                label={t("clockLabel")}
                hours={clock.hours}
                minutes={clock.minutes}
                period={clock.period}
                date={formatLongDate(now, TIME_ZONE)}
              />
              <CountdownCard
                delay={120}
                label={t("countdownLabel")}
                days={quarter.daysLeft}
                daysLabel={daysLabel}
                weeks={WEEKS_IN_QUARTER}
                filledWeeks={quarter.week}
              />
            </div>

            {announcement && (
              <AnnouncementCard
                delay={180}
                icon={<Megaphone />}
                badge={t("announcementBadge")}
                title={announcement.title}
                description={announcement.description}
                aside={announcement.pinned ? t("announcementPinned") : undefined}
              />
            )}

            <QuarterProgress
              delay={240}
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
              delay={300}
              className="min-h-0 flex-1"
              title={t("updatesTitle")}
              action={RELEASE_NOTES_URL ? { label: t("releaseNotes"), href: RELEASE_NOTES_URL } : undefined}
              items={updates}
            />
          </div>
        </section>

        {/* Form: thẻ vào sau cùng */}
        <main className="flex min-h-0 flex-1 items-start justify-center lg:items-center">
          <div className="max-h-full w-full max-w-[468px] animate-form-in overflow-y-auto rounded-xl border border-border bg-card/80 p-6 shadow-glass-sm backdrop-blur-sm [animation-delay:360ms] sm:p-8 lg:max-w-none lg:p-10 [@media(max-height:820px)]:lg:p-8">
            <LoginForm onSuccess={() => navigate("/dashboard", { replace: true })} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;

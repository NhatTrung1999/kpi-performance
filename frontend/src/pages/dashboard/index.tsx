import { useEffect, useState, useSyncExternalStore } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowRight, ArrowUp, ArrowDown, Check, CircleAlert, CircleCheck, MessageSquare, Pencil, Sun } from 'lucide-react';
import { MobileToolbar } from '@/components/common/Toolbar';
import { Badge, type BadgeStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow, MetricCard, Pill } from '@/components/ui/metric-card';
import { PageBanner } from '@/components/ui/page-banner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Sparkline, TrendChart } from '@/components/ui/trend-chart';
import { getKpiTone, type KpiTone } from '@/config/kpi';
import { useCountUp } from '@/hooks/use-count-up';
import { formatDate, formatMonthShort, formatMonthYear, formatNumber, formatPercent, formatTime, formatWeekdayShort } from '@/lib/format';
import { getQuarterInfo } from '@/lib/quarter';
import { shortNameOf, useCurrentUser } from '@/lib/session';
import { cn } from '@/lib/utils';
import { getOverview, type OverviewActivityKind, type OverviewData, type OverviewEvent } from '@/services/dashboard';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';

// Trạng thái suy ra từ ngưỡng trong config/kpi.ts — không viết cứng theo từng dòng dữ liệu.
const STATUS: Record<KpiTone, { key: 'onTrack' | 'atRisk' | 'behind'; badge: BadgeStatus }> = {
  success: { key: 'onTrack', badge: 'dat' },
  warning: { key: 'atRisk', badge: 'canh-bao' },
  danger: { key: 'behind', badge: 'chua-dat' },
};

const ACTIVITY_STYLE: Record<OverviewActivityKind, { icon: React.ReactNode; className: string }> = {
  updated: { icon: <Pencil />, className: 'bg-accent text-accent-foreground' },
  approved: { icon: <CircleCheck />, className: 'bg-success-soft text-success-text' },
  achieved: { icon: <Check />, className: 'bg-success-soft text-success-text' },
  comment: { icon: <MessageSquare />, className: 'bg-warning-soft text-warning-text' },
};

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysUntil = (iso: string, now: Date) => Math.round((startOfDay(new Date(`${iso}T00:00`)) - startOfDay(now)) / DAY_MS);
/** Số có 1 chữ số thập phân nếu cần (72.1%), ngược lại số nguyên (78%). */
const pct = (v: number) => formatPercent(v, Number.isInteger(v) ? 0 : 1);
const num = (v: number, decimals = 0) => formatNumber(v, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const narrowQuery = '(max-width: 639px)';
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(narrowQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => window.matchMedia(narrowQuery).matches, () => false);

/** Số đếm tăng dần khi xuất hiện (hiện ngay số cuối nếu giảm chuyển động). */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return <>{num(useCountUp(value, 900, 200, decimals), decimals)}</>;
}

/** Hiệu ứng xuất hiện lần lượt của thẻ. */
const rise = (i: number) => ({ className: 'animate-rise-in', style: { animationDelay: `${i * 60}ms` } });

function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}

function OverviewSkeleton() {
  const { t } = useTranslation('dashboard');
  return (
    <div role="status" aria-label={t('loading')} className="flex flex-col gap-3 lg:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:gap-5 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} variant="raised" className="gap-4 p-4 sm:p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="hidden h-1.5 w-full sm:block" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-3 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_352px]">
        <div className="flex flex-col gap-3 lg:gap-5">
          <Card variant="raised" className="gap-4 p-5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-52 w-full" />
          </Card>
          <Card variant="raised" className="gap-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
          </Card>
        </div>
        <div className="flex flex-col gap-3 lg:gap-5">
          <Card variant="raised" className="gap-3 p-5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
          </Card>
          <Card variant="raised" className="gap-3 p-5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function StatCards({ data, quarter }: { data: OverviewData; quarter: number }) {
  const { t } = useTranslation('dashboard');
  const { completion, goals, score, change } = data;
  const prevQuarter = quarter === 1 ? 4 : quarter - 1;
  const delta = +(change.current - change.previous).toFixed(1);
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const trend = delta > 0 ? 'improving' : delta < 0 ? 'declining' : 'steady';
  const needAttention = goals.total - goals.achieved;

  return (
    <>
      {/* Từ sm: thẻ đầy đủ; mobile: lưới 2×2 rút gọn như thiết kế. */}
      <section className="hidden gap-5 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          {...rise(1)}
          label={t('stats.completion')}
          tag={<Pill>{t('stats.quarterTag', { quarter })}</Pill>}
          value={<CountUp value={completion.value} />}
          unit={t('stats.completionUnit', { quarter })}
          footer={
            <>
              <div className="flex justify-between text-xs leading-none text-muted-foreground">
                <span>{t('stats.progress')}</span>
                <span>{t('stats.target', { value: formatPercent(completion.target) })}</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-muted">
                <div className="h-full origin-left animate-bar-in rounded-full bg-brand-gradient" style={{ width: `${Math.min(100, completion.value)}%` }} />
                <div aria-hidden="true" className="absolute -top-[3px] h-3 w-0.5 rounded-xs bg-muted-foreground" style={{ left: `${completion.target}%` }} />
              </div>
            </>
          }
        />
        <MetricCard
          {...rise(2)}
          label={t('stats.goals')}
          tag={<Pill>{t('stats.quarterTag', { quarter })}</Pill>}
          value={<CountUp value={goals.achieved} />}
          unit={t('stats.goalsUnit', { total: goals.total })}
          footer={
            <>
              <div className="flex justify-between text-xs leading-none text-muted-foreground">
                <span>{t('stats.onTrack', { count: goals.achieved })}</span>
                {needAttention > 0 && <span>{t('stats.needAttention', { count: needAttention })}</span>}
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(goals.total, 1)}, minmax(0, 1fr))` }}>
                {Array.from({ length: Math.max(goals.total, 1) }, (_, i) =>
                  i < goals.achieved ? (
                    <div key={i} className="h-1.5 origin-left animate-bar-in rounded-full bg-brand" style={{ animationDelay: `${250 + i * 40}ms` }} />
                  ) : (
                    <div key={i} className="h-1.5 rounded-full bg-muted" />
                  )
                )}
              </div>
            </>
          }
        />
        <MetricCard
          {...rise(3)}
          label={t('stats.score')}
          tag={<Pill>{t('stats.reviews', { count: score.reviews })}</Pill>}
          value={<CountUp value={score.value} decimals={1} />}
          unit={`/ ${num(score.max)}`}
          footer={
            <>
              <div className="flex justify-between text-xs leading-none text-muted-foreground">
                <span>{t('stats.self', { value: num(score.self, 1) })}</span>
                <span>{t('stats.manager', { value: num(score.manager, 1) })}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full origin-left animate-bar-in rounded-full bg-brand" style={{ width: `${score.max ? (score.value / score.max) * 100 : 0}%` }} />
              </div>
            </>
          }
        />
        <MetricCard
          {...rise(4)}
          label={t('stats.change', { quarter: prevQuarter })}
          tag={
            <Pill tone={delta > 0 ? 'success' : delta < 0 ? 'danger' : 'neutral'}>
              {delta > 0 && <ArrowUp aria-hidden="true" strokeWidth={3} />}
              {delta < 0 && <ArrowDown aria-hidden="true" strokeWidth={3} />}
              {t(`stats.${trend}`)}
            </Pill>
          }
          value={
            <>
              {sign}
              <CountUp value={Math.abs(delta)} decimals={1} />
            </>
          }
          unit={t('stats.changeUnit')}
          caption={t('stats.changeCaption', { from: prevQuarter, to: quarter, prev: pct(change.previous), curr: pct(change.current) })}
          footer={change.trend.length > 1 ? <Sparkline values={change.trend} tone={delta < 0 ? 'danger' : 'success'} /> : undefined}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:hidden">
        {[
          { label: t('mobileStats.completion'), value: <CountUp value={completion.value} />, unit: '%' },
          { label: t('mobileStats.goals'), value: <CountUp value={goals.achieved} />, unit: `/ ${num(goals.total)}` },
          { label: t('mobileStats.score'), value: <CountUp value={score.value} decimals={1} />, unit: `/ ${num(score.max)}` },
          { label: t('mobileStats.change', { quarter: prevQuarter }), value: <>{sign}<CountUp value={Math.abs(delta)} decimals={1} /></>, unit: t('stats.changeUnit') },
        ].map((s, i) => (
          <Card key={i} variant="raised" {...rise(i + 1)} className={cn('animate-rise-in gap-2.5 p-4')}>
            <Eyebrow>{s.label}</Eyebrow>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl leading-none font-bold tracking-[-0.03em] tabular-nums">{s.value}</span>
              <span className="text-[13px] font-medium text-muted-foreground">{s.unit}</span>
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}

function MonthlyCard({ data, index }: { data: OverviewData; index: number }) {
  const { t } = useTranslation('dashboard');
  const narrow = useNarrow();
  const { year, values } = data.monthly;
  const target = data.completion.target;
  const last = values.length - 1;
  const lastValue = values[last];
  const gap = lastValue !== undefined ? +(target - lastValue).toFixed(1) : 0;
  const monthLabel = formatMonthShort(last + 1);

  return (
    <Card variant="raised" {...rise(index)} className="animate-rise-in gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-2">
          <Eyebrow>{narrow ? t('monthly.titleShort') : t('monthly.title', { year })}</Eyebrow>
          {lastValue !== undefined && (
            <div className="hidden items-baseline gap-1.5 sm:flex">
              <span className="text-[28px] leading-none font-bold tracking-[-0.03em] tabular-nums">{pct(lastValue)}</span>
              <span className="text-[13px] text-muted-foreground">
                {gap > 0 ? t('monthly.summary', { month: monthLabel, gap: num(gap, Number.isInteger(gap) ? 0 : 1) }) : t('monthly.summaryMet', { month: monthLabel })}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-xs bg-brand" />
            {t('monthly.completion')}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-muted-foreground" />
            {t('monthly.target', { value: formatPercent(target) })}
          </span>
        </div>
      </div>
      {values.length === 0 ? (
        <EmptyNote>{t('monthly.empty')}</EmptyNote>
      ) : (
        <TrendChart
          ariaLabel={t('monthly.chartLabel', { year, month: monthLabel, value: pct(lastValue), target: formatPercent(target) })}
          min={40}
          max={100}
          target={target}
          ticks={[100, 80, 60, 40].map((v) => ({ value: v, label: formatPercent(v) }))}
          labelEvery={narrow ? 3 : 1}
          points={values.map((v, i) => ({ label: formatMonthShort(i + 1), value: v, tooltip: `${formatMonthShort(i + 1)} · ${pct(v)}` }))}
          callout={{
            title: narrow ? undefined : formatMonthYear(new Date(year, last, 1)),
            value: pct(lastValue),
            caption: narrow ? monthLabel : t('monthly.calloutCaption'),
          }}
        />
      )}
    </Card>
  );
}

const KPI_COLS = 'grid-cols-[minmax(0,1fr)_200px_84px_96px_16px]';

function KpiCard({ data, index }: { data: OverviewData; index: number }) {
  const { t } = useTranslation('dashboard');
  const { items, total } = data.kpis;
  return (
    <Card variant="raised" {...rise(index)} className="animate-rise-in gap-0 py-0">
      <div className="flex h-14 items-center justify-between px-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Eyebrow>{t('myKpi.title')}</Eyebrow>
          {total > 0 && <Pill>{t('myKpi.countTag', { shown: items.length, total })}</Pill>}
        </div>
        <Link to="/kpi" className="flex items-center gap-1 rounded-md text-[13px] font-semibold text-brand-text outline-none hover:text-brand-text-hover focus-visible:ring-3 focus-visible:ring-ring/50">
          {t('myKpi.viewAll')}
          <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyNote>{t('myKpi.empty')}</EmptyNote>
      ) : (
        <>
          {/* Desktop: bảng lưới */}
          <div role="table" aria-label={t('myKpi.title')} className="hidden pb-2 md:block">
            <div role="row" className={cn('grid h-7 items-center gap-4 px-5 text-[11px] font-semibold tracking-[.06em] text-placeholder uppercase', KPI_COLS)}>
              <span role="columnheader">{t('myKpi.goal')}</span>
              <span role="columnheader">{t('myKpi.progress')}</span>
              <span role="columnheader">{t('myKpi.due')}</span>
              <span role="columnheader">{t('myKpi.status')}</span>
              <span />
            </div>
            <div role="rowgroup" className="flex flex-col px-2">
              {items.map((k, i) => {
                const status = STATUS[getKpiTone(k.progress)];
                return (
                  <div
                    key={k.id}
                    role="row"
                    className={cn('group grid h-13 items-center gap-4 rounded-[10px] px-3 transition-colors duration-150 hover:bg-brand/5', KPI_COLS)}
                  >
                    <span role="cell" className="truncate text-sm font-medium">{k.name}</span>
                    <span role="cell">
                      <ProgressBar value={k.progress} label={k.name} showValue size="sm" animated style={{ animationDelay: `${i * 40}ms` }} />
                    </span>
                    <span role="cell" className="text-[13px] text-text-secondary tabular-nums">{formatDate(k.due, false)}</span>
                    <span role="cell"><Badge status={status.badge}>{t(`status.${status.key}`)}</Badge></span>
                    <ArrowRight aria-hidden="true" className="size-4 justify-self-end text-brand-text opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Mobile: danh sách thẻ */}
          <ul className="flex flex-col px-4 pb-2 md:hidden">
            {items.map((k) => {
              const status = STATUS[getKpiTone(k.progress)];
              return (
                <li key={k.id} className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm leading-snug font-medium">{k.name}</span>
                    <Badge status={status.badge}>{t(`status.${status.key}`)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={k.progress} label={k.name} showValue size="sm" animated className="flex-1" />
                    <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">· {formatDate(k.due, false)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

function eventMeta(e: OverviewEvent, t: ReturnType<typeof useTranslation<'dashboard'>>['t']) {
  const time = 'time' in e.when ? formatTime(`${e.date}T${e.when.time}`) : 'allDay' in e.when ? t('upcoming.allDay') : t('upcoming.endOfDay');
  return t('upcoming.meta', { weekday: formatWeekdayShort(e.date), time });
}

function UpcomingCard({ data, index, daysLeft, quarter }: { data: OverviewData; index: number; daysLeft: number; quarter: number }) {
  const { t } = useTranslation('dashboard');
  const now = new Date();
  return (
    <Card variant="raised" {...rise(index)} className="animate-rise-in gap-1 p-4 sm:p-5">
      <div className="flex items-center justify-between pb-2">
        <Eyebrow>{t('upcoming.title')}</Eyebrow>
        <Pill>{t('upcoming.daysLeft', { count: daysLeft, quarter })}</Pill>
      </div>
      {data.upcoming.length === 0 ? (
        <EmptyNote>{t('upcoming.empty')}</EmptyNote>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.upcoming.map((e) => {
            const days = daysUntil(e.date, now);
            const soon = days >= 0 && days <= 3;
            const soonLabel = days === 0 ? t('upcoming.today') : days === 1 ? t('upcoming.tomorrow') : t('upcoming.inDays', { count: days });
            return (
              <li key={e.id} className={cn('-mx-2.5 flex items-center gap-3 rounded-xl px-2.5 py-2', soon && 'bg-brand/7')}>
                <div
                  className={cn(
                    'flex size-11 flex-none flex-col items-center justify-center gap-0.5 rounded-[10px] border',
                    soon ? 'border-brand/25 bg-card' : 'border-border'
                  )}
                >
                  <span className={cn('text-[10px] leading-none font-semibold tracking-[.06em] uppercase', soon ? 'text-accent-foreground' : 'text-muted-foreground')}>
                    {formatMonthShort(Number(e.date.slice(5, 7)))}
                  </span>
                  <span className="text-base leading-none font-bold tabular-nums">{formatDate(e.date, false).split(' ')[0]}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{eventMeta(e, t)}</span>
                </div>
                {soon && <Pill tone="warning">{soonLabel}</Pill>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function activityTime(iso: string, now: Date, t: ReturnType<typeof useTranslation<'dashboard'>>['t']) {
  const d = new Date(iso);
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / DAY_MS);
  if (minutes < 1) return t('activity.justNow');
  if (minutes < 60) return t('activity.minutesAgo', { count: minutes });
  if (dayDiff === 0) return t('activity.hoursAgo', { count: Math.floor(minutes / 60) });
  if (dayDiff === 1) return t('activity.yesterday', { time: formatTime(d) });
  return formatDate(d, false);
}

function ActivityCard({ data, index }: { data: OverviewData; index: number }) {
  const { t } = useTranslation('dashboard');
  const now = new Date();
  return (
    <Card variant="raised" {...rise(index)} className="animate-rise-in gap-3 p-4 sm:p-5">
      <Eyebrow>{t('activity.title')}</Eyebrow>
      {data.activity.length === 0 ? (
        <EmptyNote>{t('activity.empty')}</EmptyNote>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {data.activity.map((a) => {
            const style = ACTIVITY_STYLE[a.kind];
            return (
              <li key={a.id} className="flex gap-3">
                <div aria-hidden="true" className={cn('flex size-8 flex-none items-center justify-center rounded-full [&>svg]:size-[15px]', style.className)}>
                  {style.icon}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] leading-[1.4] text-pretty">{t(`activity.${a.kind}`, { goal: a.goal, value: a.value !== undefined ? pct(a.value) : '' })}</span>
                  <span className="text-xs text-muted-foreground">{activityTime(a.at, now, t)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: OverviewData };

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getOverview()
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  const now = new Date();
  const quarter = getQuarterInfo(now, TIME_ZONE);
  const user = useCurrentUser();
  const hour = now.getHours();
  const greeting = t(hour < 12 ? 'greeting.morning' : hour < 18 ? 'greeting.afternoon' : 'greeting.evening', { name: shortNameOf(user.name) });
  const data = state.status === 'ready' ? state.data : null;

  let subtitle: string | undefined;
  if (data && data.goals.total > 0) {
    const attention = data.goals.total - data.goals.achieved;
    subtitle = `${t(`banner.${STATUS[getKpiTone(data.completion.value)].key}`)} · ${attention > 0 ? t('banner.attention', { count: attention }) : t('banner.allClear')}`;
  }
  const bold = { 1: <b className="font-bold tabular-nums" /> };

  return (
    <main className="flex flex-col gap-3 p-4 lg:gap-5 lg:p-6">
      <div {...rise(0)}>
        <PageBanner
          icon={<Sun />}
          title={greeting}
          subtitle={subtitle}
          loadingLabel={tc('loading')}
          badges={[
            {
              label: data && data.kpis.total > 0 ? <span><Trans t={t} i18nKey="banner.quarterBadge" values={{ value: formatPercent(data.completion.value), quarter: quarter.quarter }} components={bold} /></span> : null,
              value: '',
              loading: !data && state.status === 'loading',
            },
            {
              label: <span><Trans t={t} i18nKey="banner.daysBadge" count={quarter.daysLeft} values={{ count: quarter.daysLeft }} components={bold} /></span>,
              value: '',
            },
          ].filter((b) => b.label !== null || b.loading)}
        />
      </div>

      <MobileToolbar />

      {state.status === 'loading' && <OverviewSkeleton />}

      {state.status === 'error' && (
        <Card variant="raised" role="alert" className="items-center gap-3 px-6 py-10 text-center">
          <div aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger-text">
            <CircleAlert className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="text-base font-semibold">{t('error.title')}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t('error.description')}</p>
          <Button variant="outline" size="lg" className="mt-1 px-4" onClick={retry}>
            {tc('retry')}
          </Button>
        </Card>
      )}

      {data && (
        <>
          {/* Chưa có KPI nào trong quý thì bỏ các thẻ số liệu (toàn số 0, không có nghĩa). */}
          {data.kpis.total > 0 && <StatCards data={data} quarter={quarter.quarter} />}
          <div className="grid grid-cols-1 items-start gap-3 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_352px]">
            <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
              <MonthlyCard data={data} index={5} />
              <KpiCard data={data} index={6} />
            </div>
            <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
              <UpcomingCard data={data} index={7} daysLeft={quarter.daysLeft} quarter={quarter.quarter} />
              <ActivityCard data={data} index={8} />
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default Dashboard;

import { Trans, useTranslation } from 'react-i18next';
import Header, { MobileToolbar } from '@/components/common/Header';
import { Badge, type BadgeStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatCard } from '@/components/ui/stat-card';
import { formatDate, formatMonthShort, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

type GoalKey = 'revenue' | 'renewal' | 'newClients' | 'response' | 'report';

// Dữ liệu mẫu: số liệu thô, chữ lấy từ i18n (namespace `dashboard`), số/ngày định dạng qua lib/format.
const GOALS: { key: GoalKey; meta: { weight: string; actual?: string; target?: string; date?: string }; progress: number; due: string; status: BadgeStatus }[] = [
  { key: 'revenue', meta: { weight: formatPercent(30), actual: formatNumber(4.6, { minimumFractionDigits: 1 }), target: formatNumber(5, { minimumFractionDigits: 1 }) }, progress: 92, due: '2026-12-31', status: 'dat' },
  { key: 'renewal', meta: { weight: formatPercent(15), actual: formatPercent(86.4, 1), target: formatPercent(90) }, progress: 96, due: '2026-12-31', status: 'dat' },
  { key: 'newClients', meta: { weight: formatPercent(20), actual: formatNumber(17), target: formatNumber(23) }, progress: 74, due: '2026-12-20', status: 'canh-bao' },
  { key: 'response', meta: { weight: formatPercent(15), actual: formatPercent(52.2, 1), target: formatPercent(90) }, progress: 58, due: '2026-12-15', status: 'chua-dat' },
  { key: 'report', meta: { weight: formatPercent(10), date: formatDate('2026-12-04', false) }, progress: 100, due: '2026-12-12', status: 'cho-duyet' },
];

const DEADLINES: { day: string; key: 'evidence' | 'managerReview' | 'closeData' | 'updateClients' | 'selfReview'; left: number; tone: 'danger' | 'warning' | 'neutral' }[] = [
  { day: '2026-12-10', key: 'evidence', left: 2, tone: 'danger' },
  { day: '2026-12-12', key: 'managerReview', left: 4, tone: 'warning' },
  { day: '2026-12-15', key: 'closeData', left: 7, tone: 'neutral' },
  { day: '2026-12-20', key: 'updateClients', left: 12, tone: 'neutral' },
  { day: '2026-12-26', key: 'selfReview', left: 18, tone: 'neutral' },
];

const ACTIVITIES: { who: string; name: string | null; text: 'approved' | 'commented' | 'updated' | 'submitted'; params?: { value?: string; from?: string; to?: string }; time: 'hoursAgo' | 'yesterday' | 'date'; timeParams?: Record<string, string | number>; self: boolean }[] = [
  { who: 'TH', name: 'Phạm Thu Hà', text: 'approved', params: { value: formatPercent(96) }, time: 'hoursAgo', timeParams: { count: 2 }, self: false },
  { who: 'TH', name: 'Phạm Thu Hà', text: 'commented', time: 'yesterday', timeParams: { time: '4:40 PM' }, self: false },
  { who: 'MA', name: null, text: 'updated', params: { from: formatNumber(4.1, { minimumFractionDigits: 1 }), to: formatNumber(4.6, { minimumFractionDigits: 1 }) }, time: 'yesterday', timeParams: { time: '9:12 AM' }, self: true },
  { who: 'MA', name: null, text: 'submitted', time: 'date', timeParams: { date: formatDate('2026-12-04') }, self: true },
];

// Tiến độ theo tháng (% hoàn thành); tháng 12 là số tạm tính đến 08/12.
const MONTHLY = [62, 68, 71, 66, 76, 83, 78, 86, 89, 92, 90, 80];
const CHART = { w: 720, h: 236, left: 48, right: 700, top: 16, bottom: 208, min: 50, max: 100 };
const x = (i: number) => CHART.left + (i * (CHART.right - CHART.left)) / (MONTHLY.length - 1);
const y = (v: number) => CHART.bottom - ((v - CHART.min) / (CHART.max - CHART.min)) * (CHART.bottom - CHART.top);
const pt = (i: number) => `${x(i).toFixed(1)} ${y(MONTHLY[i]).toFixed(1)}`;

function ProgressChart() {
  const { t } = useTranslation('dashboard');
  const last = MONTHLY.length - 1;
  const solid = MONTHLY.slice(0, last).map((_, i) => `${i === 0 ? 'M' : 'L'}${pt(i)}`).join('');
  const area = `${MONTHLY.map((_, i) => `${i === 0 ? 'M' : 'L'}${pt(i)}`).join('')}L${CHART.right} ${CHART.bottom}L${CHART.left} ${CHART.bottom}Z`;
  const ticks = [100, 90, 80, 70, 60, 50];
  return (
    <svg
      viewBox={`0 0 ${CHART.w} ${CHART.h}`}
      role="img"
      aria-label={t('monthly.chartLabel', { value: formatPercent(MONTHLY[last]), date: formatDate('2026-12-08', false), target: formatPercent(90) })}
      className="block w-full overflow-visible"
    >
      <defs>
        <linearGradient id="kpiArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={CHART.left} x2={CHART.right} y1={y(tick)} y2={y(tick)} className="stroke-border" />
          <text x={36} y={y(tick) + 4} textAnchor="end" fontSize={12} className="fill-muted-foreground">{formatPercent(tick)}</text>
        </g>
      ))}
      <line x1={CHART.left} x2={CHART.right} y1={y(90)} y2={y(90)} strokeWidth={1.5} strokeDasharray="6 5" className="stroke-muted-foreground" />
      <path d={area} fill="url(#kpiArea)" />
      <path d={solid} fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="stroke-brand" />
      <path d={`M${pt(last - 1)}L${pt(last)}`} fill="none" strokeWidth={2.5} strokeDasharray="4 4" strokeLinecap="round" className="stroke-brand" />
      {MONTHLY.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 5 : 3.5} strokeWidth={2} className="fill-card stroke-brand" />
      ))}
      <g transform={`translate(${x(last)} ${y(MONTHLY[last])})`}>
        <rect x={-108} y={-46} width={108} height={34} rx={8} className="fill-foreground" />
        <text x={-54} y={-31} textAnchor="middle" fontSize={11} className="fill-card">{t('monthly.tooltip', { date: formatDate('2026-12-08', false) })}</text>
        <text x={-54} y={-17} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-card">{formatPercent(MONTHLY[last])}</text>
      </g>
      {MONTHLY.map((_, i) => (
        <text key={i} x={x(i)} y={230} textAnchor="middle" fontSize={12} className="fill-muted-foreground">{formatMonthShort(i + 1)}</text>
      ))}
    </svg>
  );
}

const TONE: Record<'danger' | 'warning' | 'neutral', { box: string; text: string }> = {
  danger: { box: 'bg-danger-soft text-danger-text', text: 'text-danger-text font-medium' },
  warning: { box: 'bg-warning-soft text-warning-text', text: 'text-warning-text font-medium' },
  neutral: { box: 'bg-muted text-text-secondary', text: 'text-muted-foreground' },
};

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation();
  const trendLabels = { flat: tc('trend.flat'), up: tc('trend.up'), down: tc('trend.down') };
  return (
    <>
      <Header />
      <main className="flex flex-col gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <MobileToolbar />
        {/* Hero */}
        <section className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 lg:min-h-40 lg:flex-row lg:items-center lg:gap-8 lg:px-8 lg:py-7">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-15 size-105 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand)_24%,transparent),transparent_68%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute right-65 -bottom-55 size-95 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--info)_16%,transparent),transparent_68%)]" />
          <div className="relative flex min-w-0 flex-1 flex-col gap-3">
            <span className="text-[13px] text-muted-foreground">{t('periodLine', { from: formatDate('2026-10-01', false), to: formatDate('2026-12-31') })}</span>
            <h2 className="text-2xl leading-tight font-bold tracking-tight lg:text-[32px]">
              <Trans t={t} i18nKey="heroTitle" values={{ value: formatPercent(78) }} components={{ 1: <span className="text-brand-text tabular-nums" /> }} />
            </h2>
            <ProgressBar value={78} label={t('heroProgress')} showValue className="max-w-130" />
          </div>
          <div className="relative flex items-center justify-between gap-4 lg:gap-7">
            <div className="flex flex-col leading-tight lg:items-end">
              <span className="hidden text-[13px] text-muted-foreground lg:block">{t('left')}</span>
              <span className="text-xl font-bold tabular-nums lg:text-3xl"><span className="lg:hidden">{t('left')} </span>{t('daysLeft', { count: 23 })}</span>
              <span className="text-[13px] text-muted-foreground">{t('selfReviewBy', { date: formatDate('2026-12-26', false) })}</span>
            </div>
            <Button size="lg">{t('updateProgress')}</Button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
          <StatCard label={t('stats.completion')} value={formatNumber(78)} unit="%" progress={78} />
          <StatCard label={t('stats.goalsMet')} value={`${formatNumber(5)}/${formatNumber(8)}`} unit={t('stats.goalsUnit')} progress={63} />
          <StatCard label={t('stats.avgScore')} value={formatNumber(4.3, { minimumFractionDigits: 1 })} unit={`/ ${formatNumber(5)}`} trend={{ value: 5, labels: trendLabels, caption: t('stats.avgCaption', { value: formatNumber(4.1, { minimumFractionDigits: 1 }) }) }} />
          <StatCard label={t('stats.change')} value={`+${formatNumber(8.2, { minimumFractionDigits: 1 })}`} unit={`% ${t('stats.changeUnit', { from: formatPercent(72.1, 1), to: formatPercent(78) })}`} />
        </section>

        <div className="grid grid-cols-1 items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('monthly.title')}</CardTitle>
                <CardDescription>{t('monthly.desc')}</CardDescription>
                <CardAction>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-brand" />{t('monthly.actual')}</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-muted-foreground" />{t('monthly.target', { value: formatPercent(90) })}</span>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('myKpi.title')}</CardTitle>
                <CardDescription>{t('myKpi.desc', { done: 5, total: 8 })}</CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm">{t('myKpi.viewAll')}</Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <table className="hidden w-full border-collapse text-left md:table">
                  <thead>
                    <tr className="text-xs font-medium text-muted-foreground">
                      <th scope="col" className="pb-2.5 font-medium">{t('myKpi.goal')}</th>
                      <th scope="col" className="w-50 px-3 pb-2.5 font-medium">{t('myKpi.progress')}</th>
                      <th scope="col" className="w-24 px-3 pb-2.5 font-medium">{t('myKpi.due')}</th>
                      <th scope="col" className="w-30 pb-2.5 font-medium">{t('myKpi.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GOALS.map((g) => {
                      const name = t(`goals.${g.key}.name`);
                      return (
                      <tr key={g.key} className="border-t border-border">
                        <td className="py-3 pr-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{name}</span>
                            <span className="text-xs text-muted-foreground">{t(`goals.${g.key}.meta`, g.meta)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><ProgressBar value={g.progress} label={name} showValue /></td>
                        <td className="px-3 py-3 whitespace-nowrap text-text-secondary tabular-nums">{formatDate(g.due)}</td>
                        <td className="py-3"><Badge status={g.status}>{t(`status.${g.status}`)}</Badge></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                <ul className="flex flex-col md:hidden">
                  {GOALS.map((g) => {
                    const name = t(`goals.${g.key}.name`);
                    return (
                    <li key={g.key} className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="leading-snug font-medium">{name}</span>
                        <Badge status={g.status}>{t(`status.${g.status}`)}</Badge>
                      </div>
                      <ProgressBar value={g.progress} label={name} showValue />
                      <span className="text-xs text-muted-foreground">{t('myKpi.dueShort')} <span className="tabular-nums">{formatDate(g.due)}</span> · {t(`goals.${g.key}.meta`, g.meta)}</span>
                    </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('deadlines.title')}</CardTitle>
                <CardDescription>{t('deadlines.desc', { count: DEADLINES.length })}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col">
                  {DEADLINES.map((d, i) => (
                    <li key={d.key} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-border')}>
                      <div className={cn('flex size-11 flex-none flex-col items-center justify-center rounded-[10px] leading-tight', TONE[d.tone].box)}>
                        <span className="text-[15px] font-bold tabular-nums">{formatDate(d.day, false).split(' ')[0]}</span>
                        <span className="text-[11px]">{formatMonthShort(12)}</span>
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{t(`deadlines.${d.key}`)}</span>
                        <span className={cn('text-xs', TONE[d.tone].text)}>{t('deadlines.left', { count: d.left })}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('activity.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {ACTIVITIES.map((a) => (
                    <li key={a.text + a.time} className="flex gap-3">
                      <div className={cn('flex size-8 flex-none items-center justify-center rounded-full text-xs font-semibold', a.self ? 'bg-muted text-text-secondary' : 'bg-accent text-accent-foreground')}>
                        {a.who}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="leading-snug text-pretty"><b className="font-semibold">{a.name ?? t('activity.you')}</b> {t(`activity.${a.text}`, a.params)}</span>
                        <span className="text-xs text-muted-foreground">{a.time === 'date' ? a.timeParams!.date : t(`activity.${a.time}`, a.timeParams)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;

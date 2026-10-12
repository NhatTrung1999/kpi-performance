import Header, { MobileToolbar } from '@/components/common/Header';
import { Badge, type BadgeStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';

const GOALS: { name: string; meta: string; progress: number; due: string; status: BadgeStatus }[] = [
  { name: 'Doanh thu bán hàng khu vực miền Bắc', meta: 'Trọng số 30% · 4,6/5,0 tỷ đồng', progress: 92, due: '31/12/2026', status: 'dat' },
  { name: 'Tỷ lệ gia hạn hợp đồng', meta: 'Trọng số 15% · 86,4% / mục tiêu 90%', progress: 96, due: '31/12/2026', status: 'dat' },
  { name: 'Số khách hàng doanh nghiệp mới', meta: 'Trọng số 20% · 17/23 khách hàng', progress: 74, due: '20/12/2026', status: 'canh-bao' },
  { name: 'Phản hồi yêu cầu khách hàng trong 4 giờ', meta: 'Trọng số 15% · đạt 52,2% / mục tiêu 90%', progress: 58, due: '15/12/2026', status: 'chua-dat' },
  { name: 'Báo cáo phân tích thị trường Quý 4', meta: 'Trọng số 10% · đã nộp 04/12', progress: 100, due: '12/12/2026', status: 'cho-duyet' },
];

const DEADLINES: { day: string; title: string; left: string; tone: 'danger' | 'warning' | 'neutral' }[] = [
  { day: '10', title: 'Nộp minh chứng chỉ tiêu phản hồi', left: 'Còn 2 ngày', tone: 'danger' },
  { day: '12', title: 'Quản lý duyệt báo cáo thị trường', left: 'Còn 4 ngày', tone: 'warning' },
  { day: '15', title: 'Chốt số liệu thời gian phản hồi', left: 'Còn 7 ngày', tone: 'neutral' },
  { day: '20', title: 'Cập nhật khách hàng doanh nghiệp mới', left: 'Còn 12 ngày', tone: 'neutral' },
  { day: '26', title: 'Nộp phiếu tự đánh giá Quý 4', left: 'Còn 18 ngày', tone: 'neutral' },
];

const ACTIVITIES = [
  { who: 'TH', name: 'Phạm Thu Hà', text: 'đã duyệt cập nhật “Tỷ lệ gia hạn hợp đồng” lên 96%', time: '2 giờ trước', self: false },
  { who: 'TH', name: 'Phạm Thu Hà', text: 'nhận xét: “Cần bổ sung minh chứng cho chỉ tiêu phản hồi 4 giờ.”', time: 'Hôm qua, 16:40', self: false },
  { who: 'MA', name: 'Bạn', text: 'cập nhật “Doanh thu miền Bắc”: 4,1 → 4,6 tỷ đồng', time: 'Hôm qua, 09:12', self: true },
  { who: 'MA', name: 'Bạn', text: 'gửi duyệt “Báo cáo phân tích thị trường Quý 4”', time: '04/12/2026', self: true },
];

// Tiến độ theo tháng (% hoàn thành); T12 là số tạm tính đến 08/12.
const MONTHLY = [62, 68, 71, 66, 76, 83, 78, 86, 89, 92, 90, 80];
const CHART = { w: 720, h: 236, left: 48, right: 700, top: 16, bottom: 208, min: 50, max: 100 };
const x = (i: number) => CHART.left + (i * (CHART.right - CHART.left)) / (MONTHLY.length - 1);
const y = (v: number) => CHART.bottom - ((v - CHART.min) / (CHART.max - CHART.min)) * (CHART.bottom - CHART.top);
const pt = (i: number) => `${x(i).toFixed(1)} ${y(MONTHLY[i]).toFixed(1)}`;

function ProgressChart() {
  const last = MONTHLY.length - 1;
  const solid = MONTHLY.slice(0, last).map((_, i) => `${i === 0 ? 'M' : 'L'}${pt(i)}`).join('');
  const area = `${MONTHLY.map((_, i) => `${i === 0 ? 'M' : 'L'}${pt(i)}`).join('')}L${CHART.right} ${CHART.bottom}L${CHART.left} ${CHART.bottom}Z`;
  const ticks = [100, 90, 80, 70, 60, 50];
  return (
    <svg
      viewBox={`0 0 ${CHART.w} ${CHART.h}`}
      role="img"
      aria-label="Biểu đồ tiến độ KPI theo tháng năm 2026, tháng 12 đạt 80% đến ngày 08/12, mục tiêu 90%"
      className="block w-full overflow-visible"
    >
      <defs>
        <linearGradient id="kpiArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand)" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={CHART.left} x2={CHART.right} y1={y(t)} y2={y(t)} className="stroke-border" />
          <text x={36} y={y(t) + 4} textAnchor="end" fontSize={12} className="fill-muted-foreground">{t}%</text>
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
        <text x={-54} y={-31} textAnchor="middle" fontSize={11} className="fill-card">T12 (đến 08/12)</text>
        <text x={-54} y={-17} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-card">{MONTHLY[last]}%</text>
      </g>
      {MONTHLY.map((_, i) => (
        <text key={i} x={x(i)} y={230} textAnchor="middle" fontSize={12} className="fill-muted-foreground">T{i + 1}</text>
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
            <span className="text-[13px] text-muted-foreground">Kỳ đánh giá Quý 4/2026 · 01/10 – 31/12/2026</span>
            <h2 className="text-2xl leading-tight font-bold tracking-tight lg:text-[32px]">
              Hoàn thành <span className="text-brand-text tabular-nums">78%</span> KPI Quý 4
            </h2>
            <ProgressBar value={78} label="Tiến độ KPI Quý 4" showValue className="max-w-130" />
          </div>
          <div className="relative flex items-center justify-between gap-4 lg:gap-7">
            <div className="flex flex-col leading-tight lg:items-end">
              <span className="hidden text-[13px] text-muted-foreground lg:block">Còn</span>
              <span className="text-xl font-bold tabular-nums lg:text-3xl"><span className="lg:hidden">Còn </span>23 ngày</span>
              <span className="text-[13px] text-muted-foreground">Tự đánh giá trước 26/12</span>
            </div>
            <Button size="lg">Cập nhật tiến độ</Button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
          <StatCard label="Hoàn thành KPI" value="78" unit="%" progress={78} />
          <StatCard label="Mục tiêu đã đạt" value="5/8" unit="mục tiêu" progress={63} />
          <StatCard label="Điểm đánh giá trung bình" value="4,3" unit="/ 5" trend={{ value: 5, caption: 'so với Quý 3 (4,1)' }} />
          <StatCard label="Thay đổi so với Quý 3" value="+8,2" unit="% (72,1% → 78%)" />
        </section>

        <div className="grid grid-cols-1 items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tiến độ KPI theo tháng</CardTitle>
                <CardDescription>Năm 2026 · % hoàn thành chỉ tiêu tháng</CardDescription>
                <CardAction>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-brand" />Thực tế</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-muted-foreground" />Mục tiêu 90%</span>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>KPI của tôi</CardTitle>
                <CardDescription>5/8 mục tiêu Quý 4 · sắp xếp theo hạn chót</CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm">Xem tất cả</Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <table className="hidden w-full border-collapse text-left md:table">
                  <thead>
                    <tr className="text-xs font-medium text-muted-foreground">
                      <th scope="col" className="pb-2.5 font-medium">Mục tiêu</th>
                      <th scope="col" className="w-50 px-3 pb-2.5 font-medium">Tiến độ</th>
                      <th scope="col" className="w-24 px-3 pb-2.5 font-medium">Hạn chót</th>
                      <th scope="col" className="w-30 pb-2.5 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GOALS.map((g) => (
                      <tr key={g.name} className="border-t border-border">
                        <td className="py-3 pr-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{g.name}</span>
                            <span className="text-xs text-muted-foreground">{g.meta}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><ProgressBar value={g.progress} label={g.name} showValue /></td>
                        <td className="px-3 py-3 whitespace-nowrap text-text-secondary tabular-nums">{g.due}</td>
                        <td className="py-3"><Badge status={g.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="flex flex-col md:hidden">
                  {GOALS.map((g) => (
                    <li key={g.name} className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="leading-snug font-medium">{g.name}</span>
                        <Badge status={g.status} />
                      </div>
                      <ProgressBar value={g.progress} label={g.name} showValue />
                      <span className="text-xs text-muted-foreground">Hạn <span className="tabular-nums">{g.due}</span> · {g.meta}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sắp đến hạn</CardTitle>
                <CardDescription>5 việc trong 30 ngày tới</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col">
                  {DEADLINES.map((d, i) => (
                    <li key={d.title} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-border')}>
                      <div className={cn('flex size-11 flex-none flex-col items-center justify-center rounded-[10px] leading-tight', TONE[d.tone].box)}>
                        <span className="text-[15px] font-bold tabular-nums">{d.day}</span>
                        <span className="text-[11px]">Th12</span>
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{d.title}</span>
                        <span className={cn('text-xs', TONE[d.tone].text)}>{d.left}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {ACTIVITIES.map((a) => (
                    <li key={a.time + a.text} className="flex gap-3">
                      <div className={cn('flex size-8 flex-none items-center justify-center rounded-full text-xs font-semibold', a.self ? 'bg-muted text-text-secondary' : 'bg-accent text-accent-foreground')}>
                        {a.who}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="leading-snug text-pretty"><b className="font-semibold">{a.name}</b> {a.text}</span>
                        <span className="text-xs text-muted-foreground">{a.time}</span>
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

import { MetricCard, Pill, Sparkline } from 'frontend';

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const Row = ({ left, right }: { left: string; right: string }) => (
  <div className="text-muted-foreground" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, lineHeight: 1 }}>
    <span>{left}</span>
    <span>{right}</span>
  </div>
);

export const Overview = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 260px)', gap: 20 }}>
    <MetricCard
      label="Completion"
      tag={<Pill>Q4</Pill>}
      value="78"
      unit="% of Q4 target"
      footer={
        <>
          <Row left="Progress" right="Target 85%" />
          <div className="bg-muted" style={{ position: 'relative', height: 6, borderRadius: 999 }}>
            <div className="bg-brand-gradient" style={{ height: '100%', width: '78%', borderRadius: 999 }} />
            <div className="bg-muted-foreground" style={{ position: 'absolute', top: -3, left: '85%', width: 2, height: 12, borderRadius: 2 }} />
          </div>
        </>
      }
    />
    <MetricCard
      label="Goals achieved"
      tag={<Pill>Q4</Pill>}
      value="5"
      unit="/ 8 goals"
      footer={
        <>
          <Row left="5 on track" right="3 need attention" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 4 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={i < 5 ? 'bg-brand' : 'bg-muted'} style={{ height: 6, borderRadius: 999 }} />
            ))}
          </div>
        </>
      }
    />
    <MetricCard
      label="Avg. score"
      tag={<Pill>6 reviews</Pill>}
      value="4.2"
      unit="/ 5"
      footer={
        <>
          <Row left="Self 4.4" right="Manager 4.0" />
          <div className="bg-muted" style={{ height: 6, borderRadius: 999, overflow: 'hidden' }}>
            <div className="bg-brand" style={{ height: '100%', width: '84%' }} />
          </div>
        </>
      }
    />
    <MetricCard
      label="Change vs Q3"
      tag={<Pill tone="success"><Arrow />Improving</Pill>}
      value="+6.1"
      unit="pts"
      caption="Q3 72.1% → Q4 78.2%"
      footer={<Sparkline values={[64, 66, 65, 69, 71, 70, 74, 78]} />}
    />
  </div>
);

export const Minimal = () => (
  <div style={{ width: 260 }}>
    <MetricCard label="Reviews pending" value="3" unit="due this week" caption="Oldest submitted 12 Oct 2026" />
  </div>
);

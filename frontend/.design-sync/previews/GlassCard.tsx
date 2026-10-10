import { GlassCard } from 'frontend';

const Nen = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 32, borderRadius: 16, background: 'linear-gradient(135deg,#4F46E5 0%,#2563EB 55%,#10B981 100%)' }}>{children}</div>
);

export const Panel = () => (
  <Nen>
    <GlassCard style={{ width: 340, padding: 24 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>Chào mừng trở lại</h3>
      <p style={{ margin: '8px 0 0', opacity: 0.8 }}>Theo dõi KPI của bạn và đội nhóm theo thời gian thực.</p>
    </GlassCard>
  </Nen>
);

export const Pill = () => (
  <Nen>
    <GlassCard variant="pill" style={{ display: 'inline-flex', padding: '6px 14px', fontWeight: 500 }}>
      Doanh thu +12,4%
    </GlassCard>
  </Nen>
);

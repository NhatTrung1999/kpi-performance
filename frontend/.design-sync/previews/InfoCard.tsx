import { InfoCard } from 'frontend';

export const Default = () => (
  <div style={{ width: 320 }}>
    <InfoCard style={{ padding: 20 }}>
      <div style={{ fontSize: 13, opacity: 0.7 }}>Review cycle</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Q4 check-ins open</div>
    </InfoCard>
  </div>
);

export const Brand = () => (
  <div style={{ width: 320 }}>
    <InfoCard tone="brand" style={{ padding: 20 }}>
      <div style={{ fontSize: 13, opacity: 0.7 }}>Quarter countdown</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>79 days left</div>
    </InfoCard>
  </div>
);

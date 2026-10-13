import { CountdownCard } from 'frontend';

export const Full = () => (
  <div style={{ width: 380, height: 168, display: 'flex' }}>
    <CountdownCard label="Quarter countdown" days={79} daysLabel="days left in Q4" weeks={13} filledWeeks={2} style={{ flex: 1 }} />
  </div>
);

export const LateInQuarter = () => (
  <div style={{ width: 380, height: 168, display: 'flex' }}>
    <CountdownCard label="Quarter countdown" days={12} daysLabel="days left in Q4" weeks={13} filledWeeks={12} style={{ flex: 1 }} />
  </div>
);

export const Compact = () => (
  <div style={{ width: 340 }}>
    <CountdownCard compact days={79} daysLabel="days left in Q4" trailing="08:42 AM" />
  </div>
);

import { Pill } from 'frontend';

const Arrow = ({ up }: { up?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={up ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'} />
  </svg>
);

export const Tones = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
    <Pill>Q4</Pill>
    <Pill tone="brand">6 reviews</Pill>
    <Pill tone="success">On track</Pill>
    <Pill tone="warning">At risk</Pill>
    <Pill tone="danger">Behind</Pill>
  </div>
);

export const Trend = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Pill tone="success"><Arrow up />Improving</Pill>
    <Pill tone="danger"><Arrow />Declining</Pill>
    <Pill>Steady</Pill>
  </div>
);

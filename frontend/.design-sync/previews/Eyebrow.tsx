import { Eyebrow, Pill } from 'frontend';

export const Labels = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <Eyebrow>Completion</Eyebrow>
    <Eyebrow>My KPIs</Eyebrow>
    <Eyebrow>Upcoming deadlines</Eyebrow>
  </div>
);

export const CardHeading = () => (
  <div className="bg-card border border-border" style={{ width: 280, padding: 20, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Eyebrow>Goals achieved</Eyebrow>
    <Pill>Q4</Pill>
  </div>
);

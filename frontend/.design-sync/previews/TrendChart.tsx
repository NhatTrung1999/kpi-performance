import { Card, Eyebrow, TrendChart } from 'frontend';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const VALUES = [58, 61, 63, 60, 66, 69, 71, 70, 74, 78];
const ticks = [100, 80, 60, 40].map((v) => ({ value: v, label: `${v}%` }));

export const MonthlyProgress = () => (
  <Card variant="raised" style={{ width: 640, padding: 20, gap: 16 }}>
    <Eyebrow>Monthly progress · 2026</Eyebrow>
    <TrendChart
      ariaLabel="Monthly KPI completion for 2026: October at 78%, target 85%"
      min={40}
      max={100}
      target={85}
      ticks={ticks}
      points={VALUES.map((v, i) => ({ label: MONTHS[i], value: v, tooltip: `${MONTHS[i]} · ${v}%` }))}
      callout={{ title: 'October 2026', value: '78%', caption: 'completion' }}
    />
  </Card>
);

export const Narrow = () => (
  <Card variant="raised" style={{ width: 340, padding: 16, gap: 12 }}>
    <Eyebrow>Monthly progress</Eyebrow>
    <TrendChart
      ariaLabel="Monthly KPI completion for 2026: October at 78%, target 85%"
      target={85}
      ticks={ticks}
      labelEvery={3}
      points={VALUES.map((v, i) => ({ label: MONTHS[i], value: v }))}
      callout={{ value: '78%', caption: 'Oct' }}
    />
  </Card>
);

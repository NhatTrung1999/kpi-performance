import { QuarterProgress } from 'frontend';

export const EarlyQuarter = () => (
  <div style={{ width: 520 }}>
    <QuarterProgress title="Q4 is in progress" caption="Week 2 of 13" progress={14} marks={['1 Oct', 'Nov', 'Dec', '31 Dec']} />
  </div>
);

export const MidQuarter = () => (
  <div style={{ width: 520 }}>
    <QuarterProgress title="Q4 is in progress" caption="Week 7 of 13" progress={52} marks={['1 Oct', 'Nov', 'Dec', '31 Dec']} />
  </div>
);

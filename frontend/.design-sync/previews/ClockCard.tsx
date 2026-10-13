import { ClockCard } from 'frontend';

export const Morning = () => (
  <div style={{ width: 380, height: 168, display: 'flex' }}>
    <ClockCard label="Local time · Ho Chi Minh City" hours="08" minutes="42" period="AM" date="Tuesday, October 13, 2026" style={{ flex: 1 }} />
  </div>
);

export const Afternoon = () => (
  <div style={{ width: 380, height: 168, display: 'flex' }}>
    <ClockCard label="Local time · Ho Chi Minh City" hours="03" minutes="05" period="PM" date="Friday, December 4, 2026" style={{ flex: 1 }} />
  </div>
);

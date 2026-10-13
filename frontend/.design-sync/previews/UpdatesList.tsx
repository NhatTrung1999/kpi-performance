import { UpdatesList } from 'frontend';

const svg = (d: string[]) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d.map((p) => <path key={p} d={p} />)}
  </svg>
);

const items = [
  { id: 'm', tone: 'warning' as const, tag: 'Planned', title: 'Scheduled maintenance', detail: 'Sat 10 PM – 11 PM', date: '17 Oct', icon: svg(['M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4Z']) },
  { id: 'x', tone: 'brand' as const, tag: 'New', title: 'Export your KPI report to Excel', date: '9 Oct', href: '#', icon: svg(['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14']) },
  { id: 'l', tone: 'info' as const, tag: 'Improved', title: 'Mobile layout improvements', date: '6 Oct', icon: svg(['M9.5 2.5h5a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z', 'M11 18h2']) },
  { id: 'e', tone: 'success' as const, tag: 'New', title: 'Check-in reminders by email', date: '2 Oct', icon: svg(['M4 6h16v12H4z', 'm4 7 8 6 8-6']) },
];

export const WhatsNew = () => (
  <div style={{ width: 560, height: 300, display: 'flex' }}>
    <UpdatesList title="What's new" action={{ label: 'Release notes', href: '#' }} items={items} style={{ flex: 1 }} />
  </div>
);

export const Short = () => (
  <div style={{ width: 560, height: 170, display: 'flex' }}>
    <UpdatesList title="What's new" items={items.slice(0, 2)} style={{ flex: 1 }} />
  </div>
);

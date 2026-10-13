import { AnnouncementCard } from 'frontend';

const Megaphone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M19 6a8 8 0 0 1 0 12" />
  </svg>
);

export const Pinned = () => (
  <div style={{ width: 560 }}>
    <AnnouncementCard
      icon={<Megaphone />}
      badge="From HR"
      title="Q4 self-review opens Dec 1"
      description="Complete your self-assessment before Dec 15 so your manager can review it."
      aside="Pinned"
    />
  </div>
);

export const Simple = () => (
  <div style={{ width: 560 }}>
    <AnnouncementCard badge="From HR" title="Office closed on Nov 20" description="Plan your check-ins around the holiday." />
  </div>
);

import { SidebarNavItem } from 'frontend';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const HOME = 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z';
const TARGET = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z';
const BELL = 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0';

export const States = () => (
  <nav className="bg-shell text-foreground" style={{ width: 248, padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <SidebarNavItem icon={<Icon d={HOME} />} label="Overview" active />
    <SidebarNavItem icon={<Icon d={TARGET} />} label="My KPI" />
    <SidebarNavItem icon={<Icon d={BELL} />} label="Notifications" badge={12} />
  </nav>
);

export const Collapsed = () => (
  <nav className="bg-shell text-foreground" style={{ width: 72, padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <SidebarNavItem icon={<Icon d={HOME} />} label="Overview" active collapsed />
    <SidebarNavItem icon={<Icon d={TARGET} />} label="My KPI" collapsed />
    <SidebarNavItem icon={<Icon d={BELL} />} label="Notifications" badge={12} collapsed />
  </nav>
);

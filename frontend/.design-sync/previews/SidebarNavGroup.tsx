import { SidebarNavGroup, SidebarNavItem } from 'frontend';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const HOME = 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z';
const CLIPBOARD = 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4';
const SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
const USERS = 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75';

export const LabeledGroups = () => (
  <nav className="bg-shell text-foreground" style={{ width: 248, padding: 12, display: 'flex', flexDirection: 'column' }}>
    <SidebarNavGroup label="General">
      <SidebarNavItem icon={<Icon d={HOME} />} label="Overview" active />
      <SidebarNavItem icon={<Icon d={CLIPBOARD} />} label="Evaluations" />
    </SidebarNavGroup>
    <SidebarNavGroup label="Administration">
      <SidebarNavItem icon={<Icon d={SHIELD} />} label="Permissions" />
      <SidebarNavItem icon={<Icon d={USERS} />} label="Departments" />
    </SidebarNavGroup>
  </nav>
);

export const Collapsed = () => (
  <nav className="bg-shell text-foreground" style={{ width: 72, padding: 12, display: 'flex', flexDirection: 'column' }}>
    <SidebarNavGroup label="General" collapsed>
      <SidebarNavItem icon={<Icon d={HOME} />} label="Overview" active collapsed />
      <SidebarNavItem icon={<Icon d={CLIPBOARD} />} label="Evaluations" collapsed />
    </SidebarNavGroup>
    <SidebarNavGroup label="Administration" collapsed>
      <SidebarNavItem icon={<Icon d={SHIELD} />} label="Permissions" collapsed />
      <SidebarNavItem icon={<Icon d={USERS} />} label="Departments" collapsed />
    </SidebarNavGroup>
  </nav>
);

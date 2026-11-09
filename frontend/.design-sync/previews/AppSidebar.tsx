import { AppSidebar, SidebarNavGroup, SidebarNavItem, SidebarToggle } from 'frontend';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const HOME = 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z';
const TARGET = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z';
const CLIPBOARD = 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4';
const BELL = 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0';
const SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';

const Nav = ({ collapsed }: { collapsed: boolean }) => (
  <>
    <SidebarNavGroup collapsed={collapsed}>
      <SidebarNavItem icon={<Icon d={HOME} />} label="Overview" active collapsed={collapsed} />
      <SidebarNavItem icon={<Icon d={TARGET} />} label="My KPI" collapsed={collapsed} />
      <SidebarNavItem icon={<Icon d={CLIPBOARD} />} label="Evaluations" collapsed={collapsed} />
      <SidebarNavItem icon={<Icon d={BELL} />} label="Notifications" badge={3} collapsed={collapsed} />
    </SidebarNavGroup>
    <SidebarNavGroup label="Administration" collapsed={collapsed}>
      <SidebarNavItem icon={<Icon d={SHIELD} />} label="Permissions" collapsed={collapsed} />
    </SidebarNavGroup>
  </>
);

export const ExpandedAndCollapsed = () => (
  <div className="flat-backdrop text-foreground" style={{ display: 'flex', gap: 24, height: 440, padding: '0 8px' }}>
    <AppSidebar logo="K" name="KPI Performance" toggle={<SidebarToggle collapsed={false} onToggle={() => {}} />}>
      <Nav collapsed={false} />
    </AppSidebar>
    <AppSidebar collapsed logo="K" name="KPI Performance" toggle={<SidebarToggle collapsed onToggle={() => {}} />}>
      <Nav collapsed />
    </AppSidebar>
  </div>
);

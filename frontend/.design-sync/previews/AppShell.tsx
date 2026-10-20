import { AccountMenu, AppShell, AppSidebar, Card, MetricCard, Pill, SidebarNavGroup, SidebarNavItem, SidebarToggle } from 'frontend';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const HOME = 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z';
const TARGET = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z';
const CLIPBOARD = 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4';
const SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';

const Bar = ({ value }: { value: number }) => (
  <div className="bg-muted" style={{ height: 6, borderRadius: 999 }}>
    <div className="bg-brand-gradient" style={{ height: '100%', width: `${value}%`, borderRadius: 999 }} />
  </div>
);

export const OverviewPage = () => (
  <AppShell
    sidebar={
      <AppSidebar logo="K" name="KPI Performance" toggle={<SidebarToggle collapsed={false} onToggle={() => {}} />}>
        <SidebarNavGroup>
          <SidebarNavItem icon={<Icon d={HOME} />} label="Overview" active />
          <SidebarNavItem icon={<Icon d={TARGET} />} label="My KPI" />
          <SidebarNavItem icon={<Icon d={CLIPBOARD} />} label="Evaluations" />
        </SidebarNavGroup>
        <SidebarNavGroup label="Administration">
          <SidebarNavItem icon={<Icon d={SHIELD} />} label="Permissions" />
        </SidebarNavGroup>
      </AppSidebar>
    }
    header={
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 24px' }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Overview</span>
        <AccountMenu
          name="Linh Tran"
          initials="LT"
          title="Sales Manager"
          email="linh.tran@example.com"
          items={[{ key: 'logout', label: 'Log out', tone: 'danger', onSelect: () => {} }]}
        />
      </header>
    }
  >
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
        <MetricCard label="Completion" tag={<Pill>Q4</Pill>} value="78" unit="% of Q4 target" footer={<Bar value={78} />} />
        <MetricCard label="Goals achieved" tag={<Pill>Q4</Pill>} value="5" unit="/ 8 goals" footer={<Bar value={62} />} />
        <MetricCard label="Avg. score" tag={<Pill>6 reviews</Pill>} value="4.2" unit="/ 5" footer={<Bar value={84} />} />
      </div>
      <Card variant="raised" style={{ padding: 20, gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>My KPIs</span>
        <span className="text-muted-foreground" style={{ fontSize: 14 }}>The panel to the right of the sidebar is the only scrolling region.</span>
      </Card>
    </div>
  </AppShell>
);

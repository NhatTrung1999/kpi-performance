import { SidebarToggle } from 'frontend';

// In the app the toggle sits inside AppSidebar and fades in on sidebar hover; `opacity-100` shows it at rest here.
export const Expanded = () => (
  <div className="flat-backdrop text-foreground" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', width: 248 }}>
    <div className="bg-brand-gradient" style={{ width: 32, height: 32, borderRadius: 10, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>K</div>
    <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>KPI Performance</span>
    <SidebarToggle collapsed={false} onToggle={() => {}} className="opacity-100" />
  </div>
);

export const Collapsed = () => (
  <div className="flat-backdrop text-foreground" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 0', width: 72 }}>
    <div className="bg-brand-gradient" style={{ width: 32, height: 32, borderRadius: 10, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>K</div>
    <SidebarToggle collapsed onToggle={() => {}} className="opacity-100" />
  </div>
);

import { Popover } from '@base-ui/react/popover';
import { Dialog } from '@base-ui/react/dialog';
import { Briefcase, Check, ChevronDown, History, MoreHorizontal, Search, ShieldCheck, TriangleAlert, UserRoundCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  INITIAL_ROLES, INITIAL_SCOPES, LEAF_BY_ID, PEOPLE, ROLE_FILTERS, ROLE_LABEL, ROLE_OPTIONS, UNITS,
  findUnit, leavesOf, norm, parseName, type Role,
} from './data';
import { flattenTree } from './tree';
import { TreeRowView, ZhText } from './unit-tree';

const popupClass = 'z-50 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_18px_40px_-16px_rgba(15,23,42,.4)]';
const fieldClass =
  'relative flex h-10 w-full items-center gap-2 rounded-[10px] border border-border-strong bg-card px-3 text-left data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20';

const Label = ({ vi, zh }: { vi: string; zh: string }) => (
  <span className="flex items-baseline gap-1.5 text-[13px] font-semibold">
    {vi}
    <ZhText>{zh}</ZhText>
  </span>
);

const ROLE_STYLE: Record<Role, string> = {
  NV: 'border-border bg-muted text-text-secondary',
  CQ: 'border-brand/40 bg-accent text-accent-foreground',
  AD: 'border-warning/40 bg-warning-soft text-warning-text',
  NONE: 'border-dashed border-border-strong bg-transparent text-muted-foreground',
};

type Col = { w: number; vi: string; zh: string; align?: 'center'; sticky?: number };
const COLS: Col[] = [
  { w: 64, vi: 'No', zh: '序號 · STT', align: 'center', sticky: 0 },
  { w: 84, vi: 'MSNV', zh: '工號', sticky: 64 },
  { w: 210, vi: 'Họ và tên', zh: '姓名', sticky: 148 },
  { w: 90, vi: 'Đơn vị', zh: '單位' },
  { w: 124, vi: 'Phòng ban', zh: '部門' },
  { w: 118, vi: 'Ngày vào công ty', zh: '入職日期' },
  { w: 196, vi: 'Vai trò', zh: '角色' },
  { w: 250, vi: 'Phạm vi quản lý', zh: '管理範圍' },
  { w: 90, vi: 'Thao tác', zh: '操作', align: 'center' },
];
const colStyle = (c: Col) => ({ width: c.w, minWidth: c.w, left: c.sticky });
const stickyClass = (c: Col) => (c.sticky !== undefined ? 'sticky z-2' : '');

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const Roles = () => {
  const [unit, setUnit] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [unitMenu, setUnitMenu] = useState(false);
  const [mq, setMq] = useState('');
  const [open, setOpen] = useState<string[]>(['kt']);
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [q, setQ] = useState('');
  const [saved, setSaved] = useState({ roles: INITIAL_ROLES, scopes: INITIAL_SCOPES });
  const [roles, setRoles] = useState<Record<number, Role>>(INITIAL_ROLES);
  const [scopes, setScopes] = useState<Record<number, string[]>>(INITIAL_SCOPES);
  const [drawer, setDrawer] = useState<number | null>(null);
  const [dSel, setDSel] = useState<string[]>([]);
  const [dq, setDq] = useState('');
  const [dOpen, setDOpen] = useState<string[]>(['kt']);

  const roleOf = (i: number): Role => roles[i] ?? 'NV';
  const baseOf = (i: number): Role => saved.roles[i] ?? 'NV';
  const fu = unit ? findUnit(unit) : undefined;
  const pu = fu ? parseName(fu.n) : { vi: '', zh: '' };
  const hasData = searched && !!fu;

  /** Phạm vi thống kê: toàn hệ thống khi chưa chọn đơn vị, ngược lại là đơn vị đã chọn. */
  const people = useMemo(() => {
    const all = PEOPLE.map((p, i) => ({ ...p, i }));
    if (!fu) return all;
    const depts = leavesOf(fu).map((l) => l.n);
    return all.filter((p) => depts.includes(p.dept));
  }, [fu]);
  // Dữ liệu hiện là mock cục bộ nên không có trạng thái tải; khi nối API thì lấy từ query.
  const loading = false;
  const count = (r: Role) => people.filter((p) => roleOf(p.i) === r).length;
  const rows = people.filter((p) => {
    const k = norm(q.trim());
    return (filter === 'all' || roleOf(p.i) === filter) && (!k || norm(p.name).includes(k) || p.id.includes(k));
  });
  const changes = people.filter((p) => roleOf(p.i) !== baseOf(p.i));
  const peopleOf = (ids: string[]) => ids.reduce((a, id) => a + (LEAF_BY_ID[id].c ?? 0), 0);

  const menuRows = flattenTree(UNITS, mq, open);
  const dRows = flattenTree(UNITS, dq, dOpen);
  const dParents = UNITS.filter((u) => u.k).map((u) => u.id);
  const dAllOpen = dParents.every((id) => dOpen.includes(id));
  const dSet = new Set(dSel);
  const dPerson = drawer !== null ? PEOPLE[drawer] : null;
  const filterLabel = ROLE_FILTERS.find((f) => f.key === filter)!;

  const pickUnit = (id: string) => {
    setUnit(id);
    setUnitMenu(false);
  };
  const openScope = (i: number) => {
    setDrawer(i);
    setDSel([...(scopes[i] ?? [])]);
    setDq('');
  };
  const closeDrawer = () => setDrawer(null);

  return (
    <>
      <Header />
      <main className="flex min-w-0 flex-col gap-4 px-4 pt-6 pb-28 lg:px-8">
        <section className="relative flex min-h-28 flex-wrap items-center gap-4 overflow-hidden rounded-[18px] bg-brand-gradient px-7 py-5.5 text-white shadow-brand">
          <svg viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
            <path d="M0 92 C 200 62 380 122 600 92 S 1000 52 1200 86 L1200 140 L0 140Z" fill="rgba(255,255,255,.08)" />
            <path d="M0 112 C 240 86 420 136 660 110 S 1020 80 1200 108 L1200 140 L0 140Z" fill="rgba(255,255,255,.08)" />
            <path d="M0 40 C 260 70 520 10 760 36 S 1080 64 1200 30" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" />
          </svg>
          <div className="relative flex size-14 flex-none items-center justify-center rounded-2xl border border-white/30 bg-white/18">
            <ShieldCheck className="size-7" />
          </div>
          <div className="relative flex min-w-70 flex-1 flex-col gap-1">
            <h2 className="text-[26px] font-extrabold tracking-[.06em]">PHÂN QUYỀN</h2>
            <span className="text-sm text-white/90">
              <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif]">權限管理</span> · Permission management
            </span>
          </div>
          <div className="relative flex flex-wrap gap-2.5 self-start">
            {(
              [
                ['Chủ quản', '主管', 'CQ'],
                ['Chưa phân quyền', '未分配', 'NONE'],
              ] as const
            ).map(([vi, zh, role]) => (
              <span key={vi} className="flex h-[34px] items-center gap-2 rounded-full border border-white/35 bg-white/16 px-3.5 text-[13px] font-medium whitespace-nowrap backdrop-blur-sm">
                {vi}
                <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif] text-xs font-normal text-white/85">{zh}</span>
                {loading ? (
                  <span role="status" aria-label="Đang tải" className="h-4 w-6 animate-pulse rounded bg-white/35" />
                ) : (
                  <b className="text-[15px] tabular-nums">{count(role)}</b>
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="relative z-10 flex flex-wrap items-end gap-4 rounded-[14px] border border-border bg-card px-5 py-4">
          <div className="flex min-w-70 flex-[0_1_460px] flex-col gap-1.5">
            <Label vi="Đơn vị" zh="單位" />
            <Popover.Root open={unitMenu} onOpenChange={setUnitMenu}>
              <Popover.Trigger className={fieldClass}>
                <Briefcase className="size-4 text-brand-text" />
                {fu ? (
                  <span className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                    <span className="font-semibold">{pu.vi}</span>
                    <ZhText>{pu.zh}</ZhText>
                  </span>
                ) : (
                  <span className="flex-1 text-placeholder">-- Chọn đơn vị · 請選擇單位 --</span>
                )}
                <ChevronDown className="size-4 text-muted-foreground" />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={6} align="start">
                  <Popover.Popup className={cn(popupClass, 'flex w-[min(460px,90vw)] flex-col gap-2 rounded-[14px] p-2')}>
                    <Input value={mq} onChange={(e) => setMq(e.target.value)} placeholder="Tìm đơn vị · 搜尋單位 (VD: pattern, 樣品)" aria-label="Tìm đơn vị" startIcon={<Search />} className="h-9 pl-9" />
                    <div role="listbox" className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
                      {menuRows.map((r) => {
                        const sel = unit === r.unit.id;
                        return (
                          <div
                            key={r.unit.id}
                            role="option"
                            aria-selected={sel}
                            tabIndex={0}
                            onClick={() => pickUnit(r.unit.id)}
                            onKeyDown={(e) => e.key === 'Enter' && pickUnit(r.unit.id)}
                            className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2.5 pl-1.5 hover:bg-muted', sel && 'bg-accent/40 ring-1 ring-brand/40 ring-inset')}
                          >
                            <TreeRowView row={r} query={mq} onToggle={() => setOpen((o) => toggleIn(o, r.unit.id))} />
                            {sel && <Check className="size-4 text-brand-text" />}
                          </div>
                        );
                      })}
                      {menuRows.length === 0 && <div className="p-6 text-center text-muted-foreground">Không tìm thấy đơn vị khớp “{mq}”</div>}
                    </div>
                    <div className="border-t border-border px-1.5 pt-2 pb-0.5 text-xs text-muted-foreground">Chọn bộ phận cha để xem nhân viên của tất cả bộ phận con</div>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <div className="flex min-w-45 flex-[0_1_220px] flex-col gap-1.5">
            <Label vi="Vai trò" zh="角色" />
            <Popover.Root>
              <Popover.Trigger className={fieldClass}>
                <span className="flex flex-1 items-baseline gap-1.5">
                  {filterLabel.vi}
                  <ZhText>{filterLabel.zh}</ZhText>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={6} align="start">
                  <Popover.Popup className={cn(popupClass, 'flex w-55 flex-col gap-0.5')}>
                    {ROLE_FILTERS.map((f) => (
                      <Popover.Close key={f.key} onClick={() => setFilter(f.key)} className={cn('flex h-9 items-center gap-2 rounded-lg px-2.5 text-left hover:bg-muted', filter === f.key && 'bg-accent/40')}>
                        <span className="flex flex-1 items-baseline gap-1.5">
                          {f.vi}
                          <ZhText>{f.zh}</ZhText>
                        </span>
                        <span className="text-xs text-muted-foreground">{hasData ? (f.key === 'all' ? people.length : count(f.key)) : ''}</span>
                      </Popover.Close>
                    ))}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <Button size="lg" onClick={() => setSearched(true)} className="h-10 min-w-30 rounded-[10px] px-[18px] font-semibold">
            <Search className="size-4" />
            Search
          </Button>
        </section>

        <section className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex flex-col items-center gap-1 px-6 pt-5.5 pb-4 text-center">
            <h2 className="text-xl font-extrabold tracking-[.04em] text-brand-text">DANH SÁCH PHÂN QUYỀN NHÂN VIÊN</h2>
            <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif] text-sm font-medium tracking-[.12em] text-text-secondary">員工權限名單</span>
            <span className={'mt-1.5 mb-1 h-[3px] w-18 rounded-sm bg-brand-gradient'} />
            <span className="text-[13px] text-muted-foreground">
              {hasData ? `Đơn vị: ${pu.vi}${pu.zh ? ' · ' + pu.zh : ''}${fu!.k ? ` (gồm ${fu!.k.length} bộ phận con)` : ''}` : 'Chưa chọn đơn vị · 尚未選擇單位'}
            </span>
          </div>

          {hasData ? (
            <>
              <div className="flex flex-wrap items-center gap-3 px-6 pb-3.5">
                <span className="flex h-[34px] items-center gap-2 rounded-full bg-brand-from px-4 font-semibold whitespace-nowrap text-white">
                  Total
                  <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif] text-xs font-normal text-white/85">共計</span>
                  <span className="tabular-nums">: {rows.length}</span>
                </span>
                <div className="min-w-55 flex-[0_1_320px]">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên / MSNV · 搜尋姓名、工號" aria-label="Tìm nhân viên" startIcon={<Search />} className="h-9 pl-9" />
                </div>
                <span className="flex-1" />
                <Button variant="ghost" size="sm">
                  <History />
                  Lịch sử thay đổi
                </Button>
              </div>
              <div className="mx-6 mb-6 h-140 overflow-auto overscroll-contain rounded-xl border border-border">
                <table className="w-max min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="sticky top-0 z-3 bg-brand-from">
                      {COLS.map((c) => (
                        <th key={c.vi} style={colStyle(c)} className={cn('h-13 border-r border-white/14 bg-brand-from px-3 text-white', c.align === 'center' ? 'text-center' : 'text-left', stickyClass(c) && 'sticky z-4')}>
                          <span className="block text-[13px] font-semibold whitespace-nowrap">{c.vi}</span>
                          <span lang="zh-Hant" className="block font-['Noto_Sans_TC',sans-serif] text-xs font-normal whitespace-nowrap text-white/85">{c.zh}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, k) => {
                      const role = roleOf(p.i);
                      const sc = scopes[p.i] ?? [];
                      const cell = 'h-14 border-b border-border bg-inherit px-3';
                      return (
                        <tr key={p.i} className={cn(k % 2 ? 'bg-accent/40' : 'bg-card', 'hover:bg-accent')}>
                          <td style={colStyle(COLS[0])} className={cn(cell, stickyClass(COLS[0]), 'text-center text-muted-foreground tabular-nums')}>{k + 1}</td>
                          <td style={colStyle(COLS[1])} className={cn(cell, stickyClass(COLS[1]), 'font-medium tabular-nums')}>{p.id}</td>
                          <td style={colStyle(COLS[2])} className={cn(cell, stickyClass(COLS[2]), 'shadow-[6px_0_8px_-6px_rgba(15,23,42,.18)]')}>
                            <span className="block max-w-full truncate text-[13px] font-semibold tracking-[.01em]">{p.name}</span>
                            <ZhText className="block">{p.zh}</ZhText>
                          </td>
                          <td className={cn(cell, 'font-medium text-text-secondary')}>VPCT</td>
                          <td className={cn(cell, 'text-text-secondary')}>{p.dept}</td>
                          <td className={cn(cell, 'text-text-secondary tabular-nums')}>{p.join}</td>
                          <td className={cell}>
                            <div className="flex items-center gap-2">
                              <Popover.Root>
                                <Popover.Trigger aria-label={`Vai trò: ${ROLE_LABEL[role]}`} className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border pr-2 pl-2.5 text-[13px] font-semibold whitespace-nowrap', ROLE_STYLE[role])}>
                                  <span className="size-1.5 rounded-full bg-current" />
                                  {ROLE_LABEL[role]}
                                  <ChevronDown className="size-3.5" />
                                </Popover.Trigger>
                                <Popover.Portal>
                                  <Popover.Positioner sideOffset={6} align="start">
                                    <Popover.Popup className={cn(popupClass, 'flex w-72.5 flex-col gap-0.5')}>
                                      {ROLE_OPTIONS.map((o) => (
                                        <Popover.Close key={o.key} onClick={() => setRoles((r) => ({ ...r, [p.i]: o.key }))} className={cn('flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted', role === o.key && 'bg-accent/40')}>
                                          <span className="flex flex-1 flex-col gap-0.5">
                                            <span className="flex items-baseline gap-1.5 font-semibold">
                                              {o.vi}
                                              <ZhText>{o.zh}</ZhText>
                                            </span>
                                            <span className="text-xs leading-snug text-muted-foreground">{o.desc}</span>
                                          </span>
                                          {role === o.key && <Check className="mt-0.5 size-4 text-brand-text" />}
                                        </Popover.Close>
                                      ))}
                                    </Popover.Popup>
                                  </Popover.Positioner>
                                </Popover.Portal>
                              </Popover.Root>
                              {role !== baseOf(p.i) && (
                                <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-warning-text">
                                  <span className="size-1.5 rounded-full bg-warning-text" />
                                  Chưa lưu
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={cell}>
                            <div className="flex items-center gap-2">
                              {role !== 'CQ' ? (
                                <span title="Chỉ áp dụng cho Chủ quản" className="text-placeholder">—</span>
                              ) : sc.length > 0 ? (
                                <>
                                  <span className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap tabular-nums">
                                    <Briefcase className="size-3.5 text-brand-text" />
                                    {sc.length} bộ phận · {peopleOf(sc)} người
                                  </span>
                                  <button type="button" onClick={() => openScope(p.i)} className="h-7 rounded-lg border border-brand/40 bg-card px-2.5 text-[13px] font-semibold whitespace-nowrap text-brand-text hover:bg-accent/40">Chỉnh sửa</button>
                                </>
                              ) : (
                                <>
                                  <span className="flex flex-1 items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-warning-text">
                                    <TriangleAlert className="size-3.5" />
                                    Chưa giao phạm vi
                                  </span>
                                  <button type="button" onClick={() => openScope(p.i)} className="h-7 rounded-lg bg-brand-from px-2.5 text-[13px] font-semibold whitespace-nowrap text-white">Giao phạm vi</button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className={cell}>
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon-lg" aria-label="Lịch sử phân quyền" className="size-8"><History className="size-[15px]" /></Button>
                              <Button variant="ghost" size="icon-lg" aria-label="Thao tác khác" className="size-8"><MoreHorizontal className="size-[15px]" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length === 0 && <div className="sticky left-0 w-full px-6 py-12 text-center text-muted-foreground">Không có nhân viên phù hợp bộ lọc</div>}
              </div>
            </>
          ) : (
            <div className="mx-6 mb-6 flex h-130 flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-brand/40 bg-accent/40 p-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-[18px] bg-accent text-brand-text">
                <UserRoundCheck className="size-7" />
              </div>
              <span className="flex flex-col gap-1">
                <span className="text-lg font-bold">Chọn đơn vị để xem danh sách phân quyền</span>
                <ZhText className="text-[13px]">請選擇單位以查看員工權限</ZhText>
              </span>
              <span className="max-w-115 leading-relaxed text-balance text-muted-foreground">Chọn một bộ phận, hoặc chọn bộ phận cha để xem nhân viên của tất cả bộ phận con, bằng ô “Đơn vị” phía trên, rồi bấm Search.</span>
            </div>
          )}
        </section>

        {hasData && changes.length > 0 && (
          <div className="sticky bottom-6 z-30 mx-auto flex max-w-full items-center gap-3.5 rounded-[14px] border border-border-strong bg-popover py-2.5 pr-2.5 pl-4.5 whitespace-nowrap text-popover-foreground shadow-[0_18px_40px_-16px_rgba(15,23,42,.35)]">
            <span className="size-2 flex-none rounded-full bg-warning-text" />
            <span className="font-medium">
              Bạn có <b className="tabular-nums">{changes.length}</b> thay đổi chưa lưu
            </span>
            <span className="max-w-110 min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {changes.map((p) => `${p.name}: ${ROLE_LABEL[baseOf(p.i)]} → ${ROLE_LABEL[roleOf(p.i)]}`).join(' · ')}
            </span>
            <div className="ml-2 flex flex-none gap-2">
              <Button variant="outline" size="lg" onClick={() => { setRoles(saved.roles); setScopes(saved.scopes); }}>Hủy</Button>
              <Button size="lg" onClick={() => setSaved({ roles, scopes })} className="px-4 font-semibold">Lưu thay đổi</Button>
            </div>
          </div>
        )}
      </main>

      <Dialog.Root open={drawer !== null} onOpenChange={(o) => !o && closeDrawer()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(10,20,25,.42)]" />
          <Dialog.Popup className="fixed inset-y-0 right-0 z-51 flex w-125 max-w-full flex-col bg-card text-foreground shadow-[-18px_0_44px_-20px_rgba(15,23,42,.45)]">
            <div className="relative flex flex-none items-center gap-3 overflow-hidden bg-brand-gradient py-4.5 pr-4 pl-6 text-white">
              <div className="relative flex size-10 flex-none items-center justify-center rounded-full bg-white/20 text-[13px] font-bold">
                {dPerson?.name.split(' ').slice(-2).map((w) => w[0]).join('')}
              </div>
              <div className="relative flex flex-1 flex-col gap-0.5 leading-snug">
                <Dialog.Title className="flex items-baseline gap-2 text-base font-bold">
                  Phạm vi quản lý
                  <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif] text-xs font-normal text-white/85">管理範圍</span>
                </Dialog.Title>
                <span className="text-[13px] text-white/90">{dPerson?.name} · {dPerson?.id} · Chủ quản</span>
              </div>
              <Dialog.Close aria-label="Đóng" className="relative flex size-9 items-center justify-center rounded-[10px] bg-white/14">
                <X className="size-[18px]" />
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
              <Dialog.Description className="leading-normal text-balance text-text-secondary">
                Chủ quản chỉ xem được nhân viên thuộc các bộ phận được chọn. Tích bộ phận cha để chọn toàn bộ bộ phận con.
              </Dialog.Description>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input value={dq} onChange={(e) => setDq(e.target.value)} placeholder="Tìm bộ phận · 搜尋部門" aria-label="Tìm bộ phận" startIcon={<Search />} className="h-9 pl-9" />
                </div>
                <Button variant="outline" size="lg" onClick={() => setDOpen(dAllOpen ? [] : dParents)}>{dAllOpen ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}</Button>
              </div>
              <div role="tree" aria-multiselectable="true" className="flex flex-col gap-0.5">
                {dRows.map((r) => {
                  const lv = leavesOf(r.unit);
                  const on = lv.filter((l) => dSet.has(l.id)).length;
                  const all = on === lv.length;
                  return (
                    <div key={r.unit.id} role="treeitem" aria-level={r.level + 1} aria-selected={all} className={cn('flex min-h-11 items-center gap-2.5 rounded-lg py-1.5 pr-3 pl-1.5 hover:bg-muted', all && 'bg-accent/40')}>
                      <TreeRowView
                        row={r}
                        query={dq}
                        onToggle={() => setDOpen((o) => toggleIn(o, r.unit.id))}
                        lead={
                          <Checkbox
                            checked={all}
                            indeterminate={on > 0 && !all}
                            aria-label={r.unit.n}
                            onCheckedChange={() => setDSel((s) => (all ? s.filter((id) => !lv.some((l) => l.id === id)) : [...new Set([...s, ...lv.map((l) => l.id)])]))}
                          />
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-none items-center gap-2 border-t border-border px-6 py-4">
              <span className="flex-1 text-text-secondary">
                Đã chọn <b className="text-foreground tabular-nums">{dSel.length}</b> bộ phận · <b className="text-foreground tabular-nums">{peopleOf(dSel)}</b> người
              </span>
              <Button variant="outline" size="lg" onClick={closeDrawer}>Hủy</Button>
              <Button
                size="lg"
                onClick={() => {
                  if (drawer !== null) setScopes((s) => ({ ...s, [drawer]: [...dSel] }));
                  closeDrawer();
                }}
                className="px-4 font-semibold"
              >
                Áp dụng
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default Roles;

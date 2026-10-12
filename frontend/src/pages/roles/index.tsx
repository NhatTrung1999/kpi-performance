import { Dialog } from '@base-ui/react/dialog';
import { Briefcase, Check, ChevronDown, ChevronLeft, ChevronRight, History, MoreHorizontal, Search, ShieldCheck, TriangleAlert, UserRoundCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { PageBanner } from '@/components/ui/page-banner';
import { PageShell, TableCard, TableCardBar, TableCardBody } from '@/components/ui/table-page';
import { cn } from '@/lib/utils';
import {
  INITIAL_ROLES, INITIAL_SCOPES, LEAF_BY_ID, PEOPLE, ROLE_FILTERS, ROLE_LABEL, ROLE_OPTIONS, UNITS,
  findUnit, leavesOf, norm, parseName, type Role,
} from './data';
import { flattenTree } from './tree';
import { TreeRowView, ZhText } from './unit-tree';

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

const PAGE_SIZES = [20, 50, 100] as const;

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const Roles = () => {
  const [unit, setUnit] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [unitMenu, setUnitMenu] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const [mq, setMq] = useState('');
  const [open, setOpen] = useState<string[]>(['kt']);
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [q, setQ] = useState('');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page, setPage] = useState(1);
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
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
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
    setPage(1);
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
      <PageShell>
        <PageBanner
          icon={<ShieldCheck />}
          title="PHÂN QUYỀN"
          subtitle={
            <>
              <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif]">權限管理</span> · Permission management
            </>
          }
          badges={(
            [
              ['Chủ quản', '主管', 'CQ'],
              ['Chưa phân quyền', '未分配', 'NONE'],
            ] as const
          ).map(([vi, zh, role]) => ({
            label: (
              <>
                {vi} <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif]">{zh}</span>
              </>
            ),
            value: count(role),
            loading,
          }))}
        />

        <section className="relative z-10 flex flex-none flex-wrap items-end gap-4 rounded-[14px] border border-border bg-card px-5 py-4">
          <div className="flex min-w-70 flex-[0_1_460px] flex-col gap-1.5">
            <Label vi="Đơn vị" zh="單位" />
            <Popover open={unitMenu} onOpenChange={setUnitMenu}>
              <PopoverTrigger className={fieldClass}>
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
              </PopoverTrigger>
              <PopoverContent className="min-w-90" onKeyDown={onListKeyDown}>
                <div className="flex-none p-2">
                  <Input value={mq} onChange={(e) => setMq(e.target.value)} placeholder="Tìm đơn vị · 搜尋單位 (VD: pattern, 樣品)" aria-label="Tìm đơn vị" startIcon={<Search />} className="h-9 pl-9" />
                </div>
                <div role="listbox" aria-label="Đơn vị" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
                  {menuRows.map((r) => {
                    const sel = unit === r.unit.id;
                    return (
                      <div
                        key={r.unit.id}
                        role="option"
                        aria-selected={sel}
                        tabIndex={-1}
                        onClick={() => pickUnit(r.unit.id)}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === 'Enter') pickUnit(r.unit.id);
                          else if (e.key === 'ArrowRight' && r.hasKids && !r.open) setOpen((o) => toggleIn(o, r.unit.id));
                          else if (e.key === 'ArrowLeft' && r.hasKids && r.open) setOpen((o) => toggleIn(o, r.unit.id));
                        }}
                        className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2.5 pl-1.5 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', sel && 'bg-accent')}
                      >
                        <TreeRowView row={r} query={mq} onToggle={() => setOpen((o) => toggleIn(o, r.unit.id))} />
                        {sel && <Check className="size-4 text-brand-text" />}
                      </div>
                    );
                  })}
                  {menuRows.length === 0 && <div className="p-6 text-center text-muted-foreground">Không tìm thấy đơn vị khớp “{mq}”</div>}
                </div>
                <div className="flex-none border-t border-border px-4 py-2.5 text-xs text-muted-foreground">Chọn bộ phận cha để xem nhân viên của tất cả bộ phận con</div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex min-w-45 flex-[0_1_220px] flex-col gap-1.5">
            <Label vi="Vai trò" zh="角色" />
            <Popover open={roleMenu} onOpenChange={setRoleMenu}>
              <PopoverTrigger className={fieldClass}>
                <span className="flex flex-1 items-baseline gap-1.5">
                  {filterLabel.vi}
                  <ZhText>{filterLabel.zh}</ZhText>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent onKeyDown={onListKeyDown}>
                <div role="listbox" aria-label="Vai trò" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                  {ROLE_FILTERS.map((f) => {
                    const sel = filter === f.key;
                    const pick = () => {
                      setFilter(f.key);
                      setPage(1);
                      setRoleMenu(false);
                    };
                    return (
                      <div
                        key={f.key}
                        role="option"
                        aria-selected={sel}
                        tabIndex={-1}
                        onClick={pick}
                        onKeyDown={(e) => e.key === 'Enter' && pick()}
                        className={cn('flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2.5 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', sel && 'bg-accent')}
                      >
                        <span className="flex flex-1 items-baseline gap-1.5">
                          {f.vi}
                          <ZhText>{f.zh}</ZhText>
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">{hasData ? (f.key === 'all' ? people.length : count(f.key)) : ''}</span>
                        {sel && <Check className="size-4 text-brand-text" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button size="lg" onClick={() => setSearched(true)} className="h-10 min-w-30 rounded-[10px] px-[18px] font-semibold">
            <Search className="size-4" />
            Search
          </Button>
        </section>

        <TableCard>
          <TableCardBar className="min-h-14 flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-2">
            <h2 className="text-[13px] font-bold tracking-[.06em]">
              DANH SÁCH PHÂN QUYỀN NHÂN VIÊN · <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif]">員工權限名單</span>
            </h2>
            <span className="text-[13px] text-muted-foreground">
              {hasData ? (
                <>
                  {pu.vi} · <b className="font-semibold text-foreground tabular-nums">{people.length}</b> nhân viên
                </>
              ) : (
                'Chưa chọn đơn vị · 尚未選擇單位'
              )}
            </span>
          </TableCardBar>

          {hasData ? (
            <>
              <TableCardBar className="flex-wrap px-5 py-3">
                <span className="flex h-[34px] items-center gap-2 rounded-full bg-accent px-4 font-semibold whitespace-nowrap text-accent-foreground">
                  Total
                  <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif] text-xs font-normal opacity-80">共計</span>
                  <span className="tabular-nums">: {rows.length}</span>
                </span>
                <div className="min-w-55 flex-[0_1_320px]">
                  <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Tìm tên / MSNV · 搜尋姓名、工號" aria-label="Tìm nhân viên" startIcon={<Search />} className="h-9 pl-9" />
                </div>
                <span className="flex-1" />
                {changes.length > 0 && (
                  <>
                    <span
                      title={changes.map((p) => `${p.name}: ${ROLE_LABEL[baseOf(p.i)]} → ${ROLE_LABEL[roleOf(p.i)]}`).join(' · ')}
                      className="flex items-center gap-2 font-medium whitespace-nowrap"
                    >
                      <span className="size-2 flex-none rounded-full bg-warning" />
                      <b className="tabular-nums">{changes.length}</b> thay đổi chưa lưu · 未儲存
                    </span>
                    <Button variant="outline" size="sm" onClick={() => { setRoles(saved.roles); setScopes(saved.scopes); }}>Hủy thay đổi</Button>
                    <Button size="sm" onClick={() => setSaved({ roles, scopes })} className="font-semibold">Lưu thay đổi</Button>
                  </>
                )}
                <Button variant="ghost" size="sm">
                  <History />
                  Lịch sử thay đổi
                </Button>
              </TableCardBar>
              <TableCardBody className="border-t border-border">
                <table className="w-max min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="sticky top-0 z-3 bg-card bg-linear-to-b from-muted to-muted">
                      {COLS.map((c) => (
                        <th key={c.vi} style={colStyle(c)} className={cn('h-11 [background:inherit] px-3 font-normal text-muted-foreground', c.align === 'center' ? 'text-center' : 'text-left', stickyClass(c) && 'sticky z-4')}>
                          <span className="block text-xs font-semibold whitespace-nowrap">{c.vi}</span>
                          <span lang="zh-Hant" className="block font-['Noto_Sans_TC',sans-serif] text-[11px] font-normal whitespace-nowrap">{c.zh}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p, k) => {
                      const role = roleOf(p.i);
                      const sc = scopes[p.i] ?? [];
                      const cell = 'h-14 border-b border-border [background:inherit] px-3 text-sm font-normal';
                      const changed = role !== baseOf(p.i);
                      return (
                        <tr key={p.i} className={cn('bg-card bg-linear-to-b hover:from-accent hover:to-accent', changed ? 'from-accent to-accent' : k % 2 ? 'from-accent/40 to-accent/40' : 'from-transparent to-transparent')}>
                          <td style={colStyle(COLS[0])} className={cn(cell, stickyClass(COLS[0]), 'text-center text-muted-foreground tabular-nums')}>{start + k + 1}</td>
                          <td style={colStyle(COLS[1])} className={cn(cell, stickyClass(COLS[1]), 'tabular-nums')}>{p.id}</td>
                          <td style={colStyle(COLS[2])} className={cn(cell, stickyClass(COLS[2]), 'border-r')}>
                            <span className="flex max-w-full items-center gap-2">
                              <span className="truncate font-medium">{p.name}</span>
                              {changed && <span className="flex-none rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-semibold text-warning-text">Đã sửa</span>}
                            </span>
                            <ZhText className="block">{p.zh}</ZhText>
                          </td>
                          <td className={cn(cell, 'text-text-secondary')}>VPCT</td>
                          <td className={cn(cell, 'text-text-secondary')}>{p.dept}</td>
                          <td className={cn(cell, 'text-text-secondary tabular-nums')}>{p.join}</td>
                          <td className={cell}>
                            <div className="flex items-center gap-2">
                              <Popover>
                                <PopoverTrigger aria-label={`Vai trò: ${ROLE_LABEL[role]}`} className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border pr-2 pl-2.5 text-sm font-normal whitespace-nowrap', ROLE_STYLE[role])}>
                                  <span className="size-1.5 rounded-full bg-current" />
                                  {ROLE_LABEL[role]}
                                  <ChevronDown className="size-3.5" />
                                </PopoverTrigger>
                                <PopoverContent className="w-72.5 min-w-72.5" onKeyDown={onListKeyDown}>
                                  <div role="listbox" aria-label="Vai trò" className="flex flex-col gap-0.5 overflow-y-auto p-2">
                                    {ROLE_OPTIONS.map((o) => (
                                      <PopoverClose key={o.key} role="option" aria-selected={role === o.key} tabIndex={-1} onClick={() => setRoles((r) => ({ ...r, [p.i]: o.key }))} className={cn('flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', role === o.key && 'bg-accent')}>
                                        <span className="flex flex-1 flex-col gap-0.5">
                                          <span className="flex items-baseline gap-1.5 font-semibold">
                                            {o.vi}
                                            <ZhText>{o.zh}</ZhText>
                                          </span>
                                          <span className="text-xs leading-snug text-muted-foreground">{o.desc}</span>
                                        </span>
                                        {role === o.key && <Check className="mt-0.5 size-4 text-brand-text" />}
                                      </PopoverClose>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {changed && (
                                <span className="flex items-center gap-1 text-xs font-normal whitespace-nowrap text-warning-text">
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
              </TableCardBody>
              <TableCardBar className="h-14 flex-wrap justify-between gap-4 border-t border-border px-5">
                <span className="text-[13px] text-muted-foreground">
                  Hiển thị{' '}
                  <b className="font-semibold text-foreground tabular-nums">{rows.length === 0 ? 0 : `${start + 1}–${start + pageRows.length}`}</b>
                  {' '}/ <span className="tabular-nums">{rows.length}</span> nhân viên
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-lg" aria-label="Trang trước" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)} className="size-8"><ChevronLeft className="size-4" /></Button>
                    <span className="min-w-16 text-center text-[13px] text-muted-foreground tabular-nums">{curPage} / {pageCount}</span>
                    <Button variant="outline" size="icon-lg" aria-label="Trang sau" disabled={curPage >= pageCount} onClick={() => setPage(curPage + 1)} className="size-8"><ChevronRight className="size-4" /></Button>
                  </div>
                  <div role="group" aria-label="Số dòng mỗi trang" className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span>Số dòng</span>
                    {PAGE_SIZES.map((n) => (
                      <Button key={n} variant={pageSize === n ? 'default' : 'ghost'} size="sm" aria-pressed={pageSize === n} onClick={() => { setPageSize(n); setPage(1); }} className="tabular-nums">{n}</Button>
                    ))}
                  </div>
                </div>
              </TableCardBar>
            </>
          ) : (
            <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-2.5 border-t border-dashed border-brand/40 bg-accent/40 p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRoundCheck className="size-5.5" />
              </div>
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold">Chưa chọn đơn vị</span>
                <ZhText className="text-[13px]">請選擇單位以查看員工權限</ZhText>
              </span>
              <span className="max-w-90 text-[13px] leading-relaxed text-balance text-muted-foreground">Chọn Đơn vị 單位 rồi bấm Search để xem danh sách nhân viên cần phân quyền.</span>
            </div>
          )}
        </TableCard>
      </PageShell>

      <Dialog.Root open={drawer !== null} onOpenChange={(o) => !o && closeDrawer()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(10,20,25,.42)]" />
          <Dialog.Popup className="fixed inset-y-0 right-0 z-51 flex w-120 max-w-full flex-col bg-card text-foreground shadow-[-18px_0_44px_-20px_rgba(15,23,42,.45)]">
            <div className="flex flex-none items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="flex items-baseline gap-2 text-xs font-bold tracking-[.06em] text-brand-text">
                  PHẠM VI QUẢN LÝ
                  <span lang="zh-Hant" className="font-['Noto_Sans_TC',sans-serif] font-normal">管理範圍</span>
                </Dialog.Title>
                <span className="text-lg font-semibold">{dPerson?.name}</span>
                <span className="text-[13px] text-muted-foreground">{dPerson?.id} · Chủ quản 主管</span>
              </div>
              <Dialog.Close aria-label="Đóng" className="flex size-8 flex-none items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted">
                <X className="size-4" />
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

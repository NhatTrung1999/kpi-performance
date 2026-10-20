import { Dialog } from '@base-ui/react/dialog';
import { Briefcase, Check, ChevronDown, ChevronLeft, ChevronRight, History, MoreHorizontal, Search, ShieldCheck, TriangleAlert, UserRoundCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { PageBanner } from '@/components/ui/page-banner';
import { PageShell, TableCard, TableCardBar, TableCardBody } from '@/components/ui/table-page';
import { formatIsoDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ROLE_FILTER_KEYS, ROLE_OPTION_KEYS,
  findUnit, leafMapOf, leavesOf, norm, peopleInUnit, unitLabel, type Role,
} from './data';
import { flattenTree } from './tree';
import { TreeRowView } from './unit-tree';
import { useEmployees } from './use-employees';
import { useUnits } from './use-units';
import { leafToScope, scopeToLeaf, useManagers, useSaveManagers, type ManagerChange } from './use-permissions';

const fieldClass =
  'relative flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-card px-3 text-left transition-colors hover:border-border-strong data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20';

/** Bộ lọc phụ do huy hiệu trên banner bật: chưa gán vai trò / quản lý chưa có phạm vi. */
type Special = 'none' | 'noScope' | null;

const ROLE_STYLE: Record<Role, string> = {
  CQ: 'border-brand/40 bg-accent text-accent-foreground',
  NONE: 'border-dashed border-border-strong bg-transparent text-muted-foreground',
};

type ColKey = 'no' | 'employeeId' | 'name' | 'unit' | 'dept' | 'joinDate' | 'role' | 'scope' | 'actions';
type Col = { key: ColKey; w: number; align?: 'center'; sticky?: number };
const COLS: Col[] = [
  { key: 'no', w: 64, align: 'center', sticky: 0 },
  { key: 'employeeId', w: 112, sticky: 64 },
  { key: 'name', w: 210, sticky: 176 },
  { key: 'unit', w: 90 },
  { key: 'dept', w: 124 },
  { key: 'joinDate', w: 118 },
  { key: 'role', w: 196 },
  { key: 'scope', w: 250 },
  { key: 'actions', w: 90, align: 'center' },
];
const colStyle = (c: Col) => ({ width: c.w, minWidth: c.w, left: c.sticky });
const stickyClass = (c: Col) => (c.sticky !== undefined ? 'sticky z-2' : '');

const PAGE_SIZES = [20, 50, 100] as const;

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const Roles = () => {
  const { t } = useTranslation(['roles', 'common']);
  const roleLabel = (role: Role) => t(`role.${role}`);
  const [unit, setUnit] = useState<string | null>(null);
  const [unitMenu, setUnitMenu] = useState(false);
  const [mq, setMq] = useState('');
  const unitsQuery = useUnits();
  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const parentIds = useMemo(() => units.filter((u) => u.k).map((u) => u.id), [units]);
  // null = chưa bấm mở/đóng lần nào → mặc định mở mọi phòng ban có bộ phận con.
  const [openState, setOpenState] = useState<string[] | null>(null);
  const open = openState ?? parentIds;
  const toggleMenuOpen = (id: string) => setOpenState((o) => toggleIn(o ?? parentIds, id));
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [special, setSpecial] = useState<Special>(null);
  const [q, setQ] = useState('');
  const dq0 = useDebouncedValue(q, 300);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page, setPage] = useState(1);
  // Đã lưu (server) + bản nháp đang sửa, theo Person_Serial_Key. "Save changes" gửi bản nháp lên một lần.
  const managersQuery = useManagers();
  const saveManagers = useSaveManagers();
  const saved = useMemo(() => {
    const roles: Record<string, Role> = {};
    const scopes: Record<string, string[]> = {};
    for (const m of managersQuery.data ?? []) {
      roles[m.personSerialKey] = m.isActive ? 'CQ' : 'NONE';
      scopes[m.personSerialKey] = m.scopes.map(scopeToLeaf);
    }
    return { roles, scopes };
  }, [managersQuery.data]);
  const [roleEdits, setRoles] = useState<Record<string, Role>>({});
  const [scopeEdits, setScopes] = useState<Record<string, string[]>>({});
  const [drawer, setDrawer] = useState<string | null>(null);
  const [dSel, setDSel] = useState<string[]>([]);
  const [dq, setDq] = useState('');
  const [dOpenState, setDOpen] = useState<string[] | null>(null);
  const dOpen = dOpenState ?? parentIds;

  // Chưa có dòng trong bảng phân quyền = không được vào hệ thống.
  const roleOf = (psk: string): Role => roleEdits[psk] ?? saved.roles[psk] ?? 'NONE';
  const baseOf = (psk: string): Role => saved.roles[psk] ?? 'NONE';
  const scopeOf = (psk: string): string[] => scopeEdits[psk] ?? saved.scopes[psk] ?? [];
  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const fu = unit ? findUnit(units, unit) : undefined;
  const unitName = fu ? unitLabel(fu.n) : '';
  const rootIds = useMemo(() => units.map((u) => u.id), [units]);
  const employees = useEmployees(rootIds);
  /** Phạm vi thống kê: mọi đơn vị gốc khi chưa chọn đơn vị, ngược lại là đơn vị/team đã chọn. */
  const people = useMemo(() => peopleInUnit(employees.data, units, fu), [employees.data, fu, units]);
  const loading = unitsQuery.isPending || employees.isPending || managersQuery.isPending;
  const count = (r: Role) => people.filter((p) => roleOf(p.psk) === r).length;
  const noScopeCount = people.filter((p) => roleOf(p.psk) === 'CQ' && scopeOf(p.psk).length === 0).length;
  // Huy hiệu "without scope" biến mất khi hết quản lý thiếu phạm vi thì bộ lọc cũng tự tắt.
  const activeSpecial: Special = special === 'noScope' && noScopeCount === 0 ? null : special;
  // Chưa chọn đơn vị: bảng chỉ hiện khi bật bộ lọc từ banner (khi đó xem toàn hệ thống).
  const hasData = !!fu || activeSpecial !== null;

  const k = norm(dq0.trim());
  const searched = people.filter((p) => !k || norm(p.name).includes(k) || p.id.includes(k));
  const tabCount = (key: 'all' | Role) => (key === 'all' ? searched.length : searched.filter((p) => roleOf(p.psk) === key).length);
  const rows = searched.filter((p) => {
    if (filter !== 'all' && roleOf(p.psk) !== filter) return false;
    if (activeSpecial === 'none') return roleOf(p.psk) === 'NONE';
    if (activeSpecial === 'noScope') return roleOf(p.psk) === 'CQ' && scopeOf(p.psk).length === 0;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  // Thay đổi chưa lưu (trên mọi đơn vị đã tải, không chỉ đơn vị đang xem).
  const changes = employees.data.filter(
    (p) => roleOf(p.psk) !== baseOf(p.psk) || (roleOf(p.psk) === 'CQ' && !sameSet(scopeOf(p.psk), saved.scopes[p.psk] ?? [])),
  );
  const discard = () => {
    setRoles({});
    setScopes({});
  };
  const save = () => {
    const payload: ManagerChange[] = changes.map((p) => ({
      personSerialKey: p.psk,
      personId: p.id,
      personName: p.name,
      active: roleOf(p.psk) === 'CQ',
      scopes: roleOf(p.psk) === 'CQ' ? scopeOf(p.psk).map((id) => leafToScope(id, units)) : [],
    }));
    saveManagers.mutate(payload, {
      onSuccess: discard,
      onError: (error) => {
        const code = error instanceof ApiError ? (error.data as { code?: string } | undefined)?.code : undefined;
        toast.error(t(code === 'INVALID_SCOPE' ? 'saveInvalidScope' : 'saveError'), { id: 'permissions-save' });
      },
    });
  };
  const leafById = useMemo(() => leafMapOf(units), [units]);
  // Số người theo bộ phận: chưa có từ API (c trống) → 0; mã phạm vi mẫu không có trong HRIS cũng tính 0.
  const peopleOf = (ids: string[]) => ids.reduce((a, id) => a + (leafById[id]?.c ?? 0), 0);

  const menuRows = flattenTree(units, mq, open);
  const dRows = flattenTree(units, dq, dOpen);
  const dParents = parentIds;
  const dAllOpen = dParents.every((id) => dOpen.includes(id));
  const dSet = new Set(dSel);
  const dPerson = drawer !== null ? employees.data.find((p) => p.psk === drawer) : undefined;
  const tabLabel = (key: 'all' | Role) => t(`tabs.${key}`);

  const pickUnit = (id: string) => {
    setUnit(id);
    setPage(1);
    setUnitMenu(false);
  };
  const pickTab = (key: 'all' | Role) => {
    setFilter(key);
    setSpecial(null);
    setPage(1);
  };
  const toggleSpecial = (s: Exclude<Special, null>) => {
    const on = activeSpecial === s;
    setSpecial(on ? null : s);
    setFilter(on || s === 'none' ? 'all' : 'CQ');
    setPage(1);
  };
  const openScope = (psk: string) => {
    setDrawer(psk);
    setDSel([...scopeOf(psk)]);
    setDq('');
  };
  const closeDrawer = () => setDrawer(null);

  return (
    <>
      <PageShell>
        <PageBanner
          icon={<ShieldCheck />}
          title={t('title')}
          subtitle={t('subtitle')}
          loadingLabel={t('common:loading')}
          badges={[
            { label: t('badgeManagers'), value: `${formatNumber(count('CQ'))}/${formatNumber(people.length)}`, loading },
            {
              label: roleLabel('NONE'),
              value: formatNumber(count('NONE')),
              loading,
              onClick: () => toggleSpecial('none'),
              active: activeSpecial === 'none',
              title: t('filterUnassigned'),
            },
            ...(noScopeCount > 0
              ? [{
                  label: t('badgeNoScope', { count: noScopeCount }),
                  value: '',
                  loading,
                  dot: true,
                  onClick: () => toggleSpecial('noScope'),
                  active: activeSpecial === 'noScope',
                  title: t('filterNoScope'),
                }]
              : []),
          ]}
        />

        <section className="relative z-10 flex flex-none flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex min-w-70 flex-1 flex-col">
            <Popover open={unitMenu} onOpenChange={setUnitMenu}>
              <PopoverTrigger className={fieldClass}>
                <Briefcase className="size-4 text-brand-text" />
                {fu ? (
                  <span className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                    <span className="font-semibold">{unitName}</span>
                  </span>
                ) : (
                  <span className="flex-1 text-placeholder">{t('selectUnit')}</span>
                )}
                <ChevronDown className="size-4 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent className="min-w-90" onKeyDown={onListKeyDown}>
                <div className="flex-none p-2">
                  <Input value={mq} onChange={(e) => setMq(e.target.value)} placeholder={t('searchUnitPlaceholder')} aria-label={t('searchUnit')} startIcon={<Search />} className="h-9 pl-9" />
                </div>
                <div role="listbox" aria-label={t('unit')} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
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
                          else if (e.key === 'ArrowRight' && r.hasKids && !r.open) toggleMenuOpen(r.unit.id);
                          else if (e.key === 'ArrowLeft' && r.hasKids && r.open) toggleMenuOpen(r.unit.id);
                        }}
                        className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2.5 pl-1.5 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', sel && 'bg-accent')}
                      >
                        <TreeRowView row={r} query={mq} onToggle={() => toggleMenuOpen(r.unit.id)} />
                        {sel && <Check className="size-4 text-brand-text" />}
                      </div>
                    );
                  })}
                  {unitsQuery.isPending && <div className="p-6 text-center text-muted-foreground">{t('common:loading')}…</div>}
                  {unitsQuery.isError && (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
                      {t('unitsError')}
                      <Button variant="outline" size="sm" onClick={() => void unitsQuery.refetch()}>{t('common:retry')}</Button>
                    </div>
                  )}
                  {unitsQuery.isSuccess && menuRows.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">{mq ? t('noUnitMatch', { query: mq }) : t('noUnits')}</div>
                  )}
                </div>
                <div className="flex-none border-t border-border px-4 py-2.5 text-xs text-muted-foreground">{t('unitHint')}</div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative w-85 max-w-full flex-none max-md:w-full">
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder={t('searchEmployeePlaceholder')}
              aria-label={t('searchEmployee')}
              startIcon={<Search />}
              className="h-10 rounded-xl bg-card pr-9 pl-9"
              endAdornment={
                q && (
                  <button type="button" aria-label={t('clearSearch')} onClick={() => { setQ(''); setPage(1); }} className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )
              }
            />
          </div>
        </section>

        <TableCard>
          <TableCardBar className="min-h-14 flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-2">
            <h2 className="text-[13px] font-bold tracking-[.06em]">
              {t('listTitle')}
            </h2>
            {hasData && (
              <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                {t('unit')}
                <span className="inline-flex h-5.5 items-center rounded-full bg-muted px-2.25 text-[11px] font-semibold whitespace-nowrap text-foreground">{fu ? unitName : t('allUnits')}</span>
              </span>
            )}
          </TableCardBar>

          {hasData ? (
            <>
              <TableCardBar className="flex-wrap gap-x-6 gap-y-0 px-5 py-0">
                <div role="tablist" aria-label={t('roleField')} className="flex items-center gap-6">
                  {ROLE_FILTER_KEYS.map((key) => {
                    const on = filter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => pickTab(key)}
                        className={cn('relative flex h-12 items-center gap-1.5 px-0.5 text-sm outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground', on ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground')}
                      >
                        {tabLabel(key)}
                        <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums', on ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{formatNumber(tabCount(key))}</span>
                        {on && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-sm bg-brand" />}
                      </button>
                    );
                  })}
                </div>
                <span className="flex-1" />
                {changes.length > 0 && (
                  <>
                    <span
                      title={changes.map((p) => `${p.name}: ${roleLabel(baseOf(p.psk))} → ${roleLabel(roleOf(p.psk))}`).join(' · ')}
                      className="flex items-center gap-2 font-medium whitespace-nowrap"
                    >
                      <span className="size-2 flex-none rounded-full bg-warning" />
                      {t('unsavedChanges', { count: changes.length })}
                    </span>
                    <Button variant="outline" size="sm" disabled={saveManagers.isPending} onClick={discard}>{t('discard')}</Button>
                    <Button size="sm" loading={saveManagers.isPending} onClick={save} className="font-semibold">{t('save')}</Button>
                  </>
                )}
                <Button variant="ghost" size="sm">
                  <History />
                  {t('history')}
                </Button>
              </TableCardBar>
              <TableCardBody className="border-t border-border">
                <table className="w-max min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="sticky top-0 z-3 bg-card bg-linear-to-b from-muted to-muted">
                      {COLS.map((c) => (
                        <th key={c.key} style={colStyle(c)} className={cn('h-11 [background:inherit] px-3 font-normal text-muted-foreground', c.align === 'center' ? 'text-center' : 'text-left', stickyClass(c) && 'sticky z-4')}>
                          <span className="block text-xs font-semibold whitespace-nowrap">{t(`cols.${c.key}`)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p, k) => {
                      const role = roleOf(p.psk);
                      const sc = scopeOf(p.psk);
                      const cell = 'h-14 border-b border-border [background:inherit] px-3 text-sm font-normal';
                      const changed = changes.includes(p);
                      return (
                        <tr key={p.psk} className={cn('bg-card bg-linear-to-b hover:from-accent hover:to-accent', changed ? 'from-accent to-accent' : k % 2 ? 'from-accent/40 to-accent/40' : 'from-transparent to-transparent')}>
                          <td style={colStyle(COLS[0])} className={cn(cell, stickyClass(COLS[0]), 'text-center text-muted-foreground tabular-nums')}>{start + k + 1}</td>
                          <td style={colStyle(COLS[1])} className={cn(cell, stickyClass(COLS[1]), 'tabular-nums')}>{p.id}</td>
                          <td style={colStyle(COLS[2])} className={cn(cell, stickyClass(COLS[2]), 'border-r')}>
                            <span className="flex max-w-full items-center gap-2">
                              <span className="flex min-w-0 flex-col">
                                <span className="truncate font-medium">{p.name}</span>
                                {p.position && <span className="truncate text-xs text-muted-foreground">{p.position}</span>}
                              </span>
                              {changed && <span className="flex-none rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-semibold text-warning-text">{t('edited')}</span>}
                            </span>
                          </td>
                          <td className={cn(cell, 'text-text-secondary')}>{p.unit}</td>
                          <td className={cn(cell, 'text-text-secondary')}>{p.dept || <span className="text-placeholder">{t('noTeam')}</span>}</td>
                          <td className={cn(cell, 'text-text-secondary tabular-nums')}>{p.join ? formatIsoDate(p.join) : '—'}</td>
                          <td className={cell}>
                            <div className="flex items-center gap-2">
                              <Popover>
                                <PopoverTrigger aria-label={t('roleOf', { role: roleLabel(role) })} className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border pr-2 pl-2.5 text-sm font-normal whitespace-nowrap', ROLE_STYLE[role])}>
                                  <span className="size-1.5 rounded-full bg-current" />
                                  {roleLabel(role)}
                                  <ChevronDown className="size-3.5" />
                                </PopoverTrigger>
                                <PopoverContent className="w-72.5 min-w-72.5" onKeyDown={onListKeyDown}>
                                  <div role="listbox" aria-label={t('roleField')} className="flex flex-col gap-0.5 overflow-y-auto p-2">
                                    {ROLE_OPTION_KEYS.map((key) => (
                                      <PopoverClose key={key} role="option" aria-selected={role === key} tabIndex={-1} onClick={() => setRoles((r) => ({ ...r, [p.psk]: key }))} className={cn('flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', role === key && 'bg-accent')}>
                                        <span className="flex flex-1 flex-col gap-0.5">
                                          <span className="font-semibold">{roleLabel(key)}</span>
                                          <span className="text-xs leading-snug text-muted-foreground">{t(`roleDesc.${key}`)}</span>
                                        </span>
                                        {role === key && <Check className="mt-0.5 size-4 text-brand-text" />}
                                      </PopoverClose>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {changed && (
                                <span className="flex items-center gap-1 text-xs font-normal whitespace-nowrap text-warning-text">
                                  <span className="size-1.5 rounded-full bg-warning-text" />
                                  {t('unsaved')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={cell}>
                            <div className="flex items-center gap-2">
                              {role !== 'CQ' ? (
                                <span title={t('scopeOnlyManager')} className="text-placeholder">—</span>
                              ) : sc.length > 0 ? (
                                <>
                                  <span className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap tabular-nums">
                                    <Briefcase className="size-3.5 text-brand-text" />
                                    {t('scopeSummary', { depts: t('deptCount', { count: sc.length }), people: t('peopleCount', { count: peopleOf(sc) }) })}
                                  </span>
                                  <button type="button" onClick={() => openScope(p.psk)} className="h-7 rounded-lg border border-brand/40 bg-card px-2.5 text-[13px] font-semibold whitespace-nowrap text-brand-text hover:bg-accent/40">{t('edit')}</button>
                                </>
                              ) : (
                                <>
                                  <span className="flex flex-1 items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-warning-text">
                                    <TriangleAlert className="size-3.5" />
                                    {t('noScope')}
                                  </span>
                                  <button type="button" onClick={() => openScope(p.psk)} className="h-7 rounded-lg bg-brand-from px-2.5 text-[13px] font-semibold whitespace-nowrap text-white">{t('assignScope')}</button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className={cell}>
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon-lg" aria-label={t('roleHistory')} className="size-8"><History className="size-[15px]" /></Button>
                              <Button variant="ghost" size="icon-lg" aria-label={t('moreActions')} className="size-8"><MoreHorizontal className="size-[15px]" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {employees.isPending || managersQuery.isPending ? (
                  <div className="sticky left-0 w-full px-6 py-12 text-center text-muted-foreground">{t('common:loading')}…</div>
                ) : (employees.isError && rows.length === 0) || managersQuery.isError ? (
                  <div className="sticky left-0 flex w-full flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
                    {t(managersQuery.isError ? 'managersError' : 'employeesError')}
                    <Button variant="outline" size="sm" onClick={() => (managersQuery.isError ? void managersQuery.refetch() : employees.refetch())}>{t('common:retry')}</Button>
                  </div>
                ) : (
                  rows.length === 0 && <div className="sticky left-0 w-full px-6 py-12 text-center text-muted-foreground">{t('noMatch')}</div>
                )}
              </TableCardBody>
              <TableCardBar className="h-14 flex-wrap justify-between gap-4 border-t border-border px-5">
                <span className="text-[13px] text-muted-foreground">
                  {t('showing')}{' '}
                  <b className="font-semibold text-foreground tabular-nums">{rows.length === 0 ? 0 : `${formatNumber(start + 1)}–${formatNumber(start + pageRows.length)}`}</b>
                  {' '}/ <span className="tabular-nums">{t('employeeCount', { count: rows.length })}</span>
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-lg" aria-label={t('prevPage')} disabled={curPage <= 1} onClick={() => setPage(curPage - 1)} className="size-8"><ChevronLeft className="size-4" /></Button>
                    <span className="min-w-16 text-center text-[13px] text-muted-foreground tabular-nums">{formatNumber(curPage)} / {formatNumber(pageCount)}</span>
                    <Button variant="outline" size="icon-lg" aria-label={t('nextPage')} disabled={curPage >= pageCount} onClick={() => setPage(curPage + 1)} className="size-8"><ChevronRight className="size-4" /></Button>
                  </div>
                  <div role="group" aria-label={t('rowsPerPage')} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span>{t('rows')}</span>
                    {PAGE_SIZES.map((n) => (
                      <Button key={n} variant={pageSize === n ? 'default' : 'ghost'} size="sm" aria-pressed={pageSize === n} onClick={() => { setPageSize(n); setPage(1); }} className="tabular-nums">{n}</Button>
                    ))}
                  </div>
                </div>
              </TableCardBar>
            </>
          ) : (
            <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-2.5 border-t border-border p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRoundCheck className="size-5.5" />
              </div>
              <span className="text-sm text-muted-foreground">{t('emptyTitle')}</span>
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
                <Dialog.Title className="text-xs font-bold tracking-[.06em] text-brand-text">{t('drawerTitle')}</Dialog.Title>
                <span className="text-lg font-semibold">{dPerson?.name}</span>
                <span className="text-[13px] text-muted-foreground">{dPerson?.id} · {roleLabel('CQ')}</span>
              </div>
              <Dialog.Close aria-label={t('close')} className="flex size-8 flex-none items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
              <Dialog.Description className="leading-normal text-balance text-text-secondary">
                {t('drawerDesc')}
              </Dialog.Description>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input value={dq} onChange={(e) => setDq(e.target.value)} placeholder={t('searchDept')} aria-label={t('searchDept')} startIcon={<Search />} className="h-9 pl-9" />
                </div>
                <Button variant="outline" size="lg" onClick={() => setDOpen(dAllOpen ? [] : dParents)}>{dAllOpen ? t('collapseAll') : t('expandAll')}</Button>
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
                        onToggle={() => setDOpen((o) => toggleIn(o ?? parentIds, r.unit.id))}
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
                {t('selected')}: <b className="text-foreground tabular-nums">{t('selectedDepts', { count: dSel.length })}</b> · <b className="text-foreground tabular-nums">{t('peopleCount', { count: peopleOf(dSel) })}</b>
              </span>
              <Button variant="outline" size="lg" onClick={closeDrawer}>{t('cancel')}</Button>
              <Button
                size="lg"
                onClick={() => {
                  if (drawer !== null) setScopes((s) => ({ ...s, [drawer]: [...dSel] }));
                  closeDrawer();
                }}
                className="px-4 font-semibold"
              >
                {t('apply')}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default Roles;

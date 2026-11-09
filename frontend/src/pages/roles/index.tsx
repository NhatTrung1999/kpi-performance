import { Dialog } from '@base-ui/react/dialog';
import { Check, ChevronDown, Search, SearchX, ShieldCheck, TriangleAlert, UserCheck, Users, X } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode, type UIEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid, type DataGridColumn } from '@/components/ui/data-grid';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/metric-card';
import { PageBanner } from '@/components/ui/page-banner';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { PageShell, TableCard, TableCardBar, TableCardBody } from '@/components/ui/table-page';
import { toast } from '@/components/ui/toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useGlassPopup } from '@/hooks/use-is-desktop';
import { ApiError } from '@/lib/axios';
import { formatNumber, formatSlashDate } from '@/lib/format';
import { useUnsavedChanges } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import {
  ROLE_FILTER_KEYS, ROLE_OPTION_KEYS,
  findUnit, leafMapOf, leavesOf, norm, peopleInUnit, unitLabel, unitZh, type Person, type Role, type RoleFilter,
} from './data';
import { flattenTree } from './tree';
import { TreeRowView } from './unit-tree';
import { UnitMenu, type UnitMenuHandle } from './unit-menu';
import { useEmployees } from './use-employees';
import { useUnits } from './use-units';
import { leafToScope, scopeToLeaf, useManagers, useSaveManagers, type ManagerChange } from './use-permissions';

/** Vai trò đã giao = màu thương hiệu; chưa phân quyền = cam nhạt (token cảnh báo). */
const ROLE_TONE: Record<Role, 'brand' | 'warning'> = { CQ: 'brand', NONE: 'warning' };

/** Cột bảng theo % (layout 9): luôn lấp đủ chiều ngang, không cuộn ngang. */
const COL_WIDTH = { name: 26, dept: 18, position: 15, joinDate: 11, role: 14, scope: 16 } as const;
type ColKey = keyof typeof COL_WIDTH;
const width = (k: ColKey) => `minmax(0,${COL_WIDTH[k]}fr)`;

/** Dòng giả cho skeleton khi đang tải. */
const SKELETON_ROWS: Person[] = Array.from({ length: 8 }, (_, i) => ({
  psk: `skeleton-${i}`, id: '', name: '', deptKey: '', unit: '', teamKey: null, dept: '', join: null, position: '',
}));

/** Trạng thái trống trong thân bảng (layout 9d): icon trong ô bo tròn, tiêu đề, dòng tiếng Trung, mô tả, nút phụ. */
const EmptyState = ({ icon, title, zh, text, action }: { icon: ReactNode; title: string; zh?: string; text?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-1.5 px-6 pt-12 pb-18 text-center">
    <div className="mb-2.5 flex size-12 items-center justify-center rounded-[14px] bg-muted text-muted-foreground [&_svg]:size-5.5">{icon}</div>
    <span className="text-[15px] font-semibold text-foreground">{title}</span>
    {zh && <span className="text-xs text-muted-foreground">{zh}</span>}
    {text && <span className="max-w-95 text-[13px] leading-normal text-pretty text-text-secondary">{text}</span>}
    {action && <div className="mt-3 flex gap-2">{action}</div>}
  </div>
);

/** Bảng có thể có hàng nghìn người: vẽ dần từng đợt khi cuộn gần đáy. */
const STEP = 100;

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const Roles = () => {
  const { t } = useTranslation(['roles', 'common']);
  const glass = useGlassPopup();
  const roleLabel = (role: Role) => t(`role.${role}`);

  const unitsQuery = useUnits();
  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const parentIds = useMemo(() => units.filter((u) => u.k).map((u) => u.id), [units]);
  const leafById = useMemo(() => leafMapOf(units), [units]);
  const employees = useEmployees();

  // Đơn vị đang xem: chưa chọn thì mặc định đơn vị gốc đầu tiên để danh sách hiện ngay.
  const [unit, setUnit] = useState<string | null>(null);
  const fu = findUnit(units, unit ?? units[0]?.id ?? '');
  // Mặc định xem "Tất cả chủ quản" của mọi đơn vị (không cần chọn đơn vị); chọn một đơn vị trong menu thì về danh sách theo đơn vị.
  const [overview, setOverview] = useState(true);
  const menuRef = useRef<UnitMenuHandle>(null);
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [q, setQ] = useState('');
  const dq0 = useDebouncedValue(q, 300);
  const [limit, setLimit] = useState(STEP);

  // Đã lưu (server) + bản nháp đang sửa, theo Person_Serial_Key. "Lưu thay đổi" gửi bản nháp lên một lần.
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

  // Ngăn phạm vi
  const [drawer, setDrawer] = useState<string | null>(null);
  // Người đang/vừa mở ngăn kéo: giữ lại sau khi đóng để tiêu đề không trống trong lúc ngăn trượt ra.
  const [drawerPsk, setDrawerPsk] = useState<string | null>(null);
  const [dSel, setDSel] = useState<string[]>([]);
  const [dq, setDq] = useState('');
  const [dOpenState, setDOpen] = useState<string[] | null>(null);
  const dOpen = dOpenState ?? parentIds;

  // Chưa có dòng trong bảng phân quyền = không được vào hệ thống.
  const roleOf = (psk: string): Role => roleEdits[psk] ?? saved.roles[psk] ?? 'NONE';
  const scopeOf = (psk: string): string[] => scopeEdits[psk] ?? saved.scopes[psk] ?? [];
  const peopleOf = (ids: string[]) => ids.reduce((a, id) => a + (leafById[id]?.c ?? 0), 0);
  const scopeText = (ids: string[]) => {
    const people = peopleOf(ids);
    return t('scopeSummary', {
      groups: t('groupCount', { count: ids.length, n: formatNumber(ids.length) }),
      people: t('staffCount', { count: people, n: formatNumber(people) }),
    });
  };

  // Toàn hệ thống (kể cả bản nháp): số chủ quản và các nhóm (nút lá) chưa thuộc phạm vi của chủ quản nào.
  const managerPsks = [...new Set([...Object.keys(saved.roles), ...Object.keys(roleEdits)])].filter((psk) => roleOf(psk) === 'CQ');
  const covered = new Set(managerPsks.flatMap(scopeOf));
  const orphanCount = Object.keys(leafById).filter((id) => !covered.has(id)).length;

  const loading = unitsQuery.isPending || employees.isPending || managersQuery.isPending;
  // "Tất cả chủ quản": người đã là chủ quản (đã lưu) hoặc vừa được chọn làm chủ quản trong bản nháp — người vừa bị bỏ quyền
  // vẫn ở lại trong danh sách (nhãn "Chưa phân quyền") cho tới khi lưu, để không biến mất khi đang sửa.
  const managerSet = useMemo(
    () => new Set([...Object.entries(saved.roles), ...Object.entries(roleEdits)].filter(([, r]) => r === 'CQ').map(([psk]) => psk)),
    [saved.roles, roleEdits]
  );
  const people = useMemo(
    () => (overview ? employees.data.filter((p) => managerSet.has(p.psk)) : fu ? peopleInUnit(employees.data, units, fu) : []),
    [overview, managerSet, employees.data, fu, units]
  );
  const k = norm(dq0.trim());
  const searched = people.filter((p) => !k || norm(p.name).includes(k) || norm(p.id).includes(k));
  const quickCount = (key: RoleFilter) => (key === 'all' ? people.length : people.filter((p) => roleOf(p.psk) === key).length);
  const rows = searched.filter((p) => filter === 'all' || roleOf(p.psk) === filter);
  const shownRows = rows.slice(0, limit);

  // Thay đổi chưa lưu (trên mọi đơn vị đã tải, không chỉ đơn vị đang xem).
  const changes = employees.data.filter((p) => {
    const role = roleOf(p.psk);
    return role !== (saved.roles[p.psk] ?? 'NONE') || (role === 'CQ' && !sameSet(scopeOf(p.psk), saved.scopes[p.psk] ?? []));
  });
  const changed = new Set(changes.map((p) => p.psk));
  useUnsavedChanges(changes.length > 0);

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

  const dRows = flattenTree(units, dq, dOpen);
  const dSet = new Set(dSel);
  const dPerson = drawerPsk !== null ? employees.data.find((p) => p.psk === drawerPsk) : undefined;

  const pickUnit = (id: string) => {
    setUnit(id);
    setOverview(false);
    setLimit(STEP);
  };
  const showOverview = () => {
    setOverview(true);
    setFilter('all');
    setLimit(STEP);
  };
  const pickFilter = (key: RoleFilter) => {
    setFilter(key);
    setLimit(STEP);
  };
  const openScope = (psk: string) => {
    setDrawer(psk);
    setDrawerPsk(psk);
    setDSel([...scopeOf(psk)]);
    setDq('');
  };
  const closeDrawer = () => setDrawer(null);
  const onBodyScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (rows.length > limit && el.scrollTop + el.clientHeight > el.scrollHeight - 400) setLimit((l) => l + STEP);
  };

  const col = (key: ColKey, cell: DataGridColumn<Person>['cell']): DataGridColumn<Person> => ({
    key, header: t(`cols.${key}.label`), sub: t(`cols.${key}.sub`), width: width(key), tone: 'read', cell,
  });
  const twoLines = (main: ReactNode, sub?: string) => (
    <span className="flex min-w-0 flex-col gap-0.5">
      {main}
      {sub && <span className="truncate text-xs text-muted-foreground tabular-nums">{sub}</span>}
    </span>
  );
  const columns: DataGridColumn<Person>[] = [
    // Dòng phụ "tên tiếng Trung · số thẻ"; chưa có tên tiếng Trung thì chỉ số thẻ (không để "·" thừa).
    col('name', (p) => twoLines(<span className="truncate font-semibold">{p.name}</span>, [p.zh, p.id].filter(Boolean).join(' · '))),
    col('dept', (p) => twoLines(p.dept ? <span className="truncate">{unitLabel(p.dept)}</span> : <span className="text-placeholder">{t('noTeam')}</span>, p.dept ? unitZh(p.dept) : '')),
    col('position', (p) => (p.position ? <span className="truncate">{p.position}</span> : <span className="text-placeholder">—</span>)),
    col('joinDate', (p) => <span className="whitespace-nowrap text-text-secondary tabular-nums">{p.join ? formatSlashDate(p.join) : '—'}</span>),
    col('role', (p) => {
      const role = roleOf(p.psk);
      return (
        <span className="flex min-w-0 items-center gap-1.5">
          <Popover>
            <PopoverTrigger
              aria-label={t('changeRole', { role: roleLabel(role) })}
              className="inline-flex min-w-0 items-center gap-1 rounded-full border border-transparent py-0.75 pr-1.5 pl-0.75 outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand/50 data-popup-open:border-border-strong"
            >
              <Pill tone={ROLE_TONE[role]}>{roleLabel(role)}</Pill>
              <ChevronDown className="size-3 flex-none text-muted-foreground" strokeWidth={2.2} />
            </PopoverTrigger>
            <PopoverContent className="w-70 min-w-70 gap-0.5 p-1" onKeyDown={onListKeyDown}>
              <div role="listbox" aria-label={t('cols.role.label')} className="flex flex-col gap-0.5">
                {ROLE_OPTION_KEYS.map((key) => (
                  <PopoverClose
                    key={key}
                    role="option"
                    aria-selected={role === key}
                    tabIndex={-1}
                    onClick={() => setRoles((r) => ({ ...r, [p.psk]: key }))}
                    className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', role === key && 'bg-accent hover:bg-accent')}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-baseline gap-1.5">
                        <span className="font-semibold">{roleLabel(key)}</span>
                        <span className="text-[11px] text-muted-foreground">{t(`roleZh.${key}`)}</span>
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">{t(`roleDesc.${key}`)}</span>
                    </span>
                    {role === key && <Check className="size-3.5 flex-none text-brand-text" strokeWidth={2.4} />}
                  </PopoverClose>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {changed.has(p.psk) && <span title={t('unsaved')} aria-label={t('unsaved')} className="size-[7px] flex-none rounded-full bg-brand" />}
        </span>
      );
    }),
    col('scope', (p) => {
      if (roleOf(p.psk) !== 'CQ') return <span title={t('scopeOnlyManager')} className="text-placeholder">—</span>;
      const sc = scopeOf(p.psk);
      return (
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className={cn('min-w-0 flex-1 truncate font-medium tabular-nums', sc.length === 0 && 'text-warning-text')}>
            {sc.length > 0 ? scopeText(sc) : t('noScope')}
          </span>
          <Button variant="outline" size="sm" className="flex-none" onClick={() => openScope(p.psk)}>{sc.length > 0 ? t('edit') : t('assignScope')}</Button>
        </span>
      );
    }),
  ];
  // Trạng thái thân bảng: đang tải (skeleton) · lỗi · đơn vị không có người · lọc không ra kết quả.
  const failed = unitsQuery.isError || managersQuery.isError || (employees.isError && people.length === 0);
  const retry = () => {
    if (unitsQuery.isError) void unitsQuery.refetch();
    if (managersQuery.isError) void managersQuery.refetch();
    if (employees.isError) void employees.refetch();
  };
  const clearFilters = () => {
    setQ('');
    pickFilter('all');
  };
  const empty = failed ? (
    <EmptyState
      icon={<TriangleAlert />}
      title={t(unitsQuery.isError ? 'unitsError' : managersQuery.isError ? 'managersError' : 'employeesError')}
      action={<Button variant="outline" className="h-9" onClick={retry}>{t('common:retry')}</Button>}
    />
  ) : overview && !people.length ? (
    <EmptyState
      icon={<UserCheck />}
      title={t('empty.noManagers.title')}
      zh={t('empty.noManagers.zh')}
      text={t('empty.noManagers.text')}
      action={<Button variant="outline" className="h-9" onClick={() => menuRef.current?.open()}>{t('empty.noManagers.action')}</Button>}
    />
  ) : people.length ? (
    <EmptyState
      icon={<SearchX />}
      title={t('empty.noMatch.title')}
      zh={t('empty.noMatch.zh')}
      text={t('empty.noMatch.text')}
      action={<Button variant="outline" className="h-9" onClick={clearFilters}>{t('empty.noMatch.action')}</Button>}
    />
  ) : (
    <EmptyState
      icon={<Users />}
      title={t('empty.noPeople.title')}
      zh={t('empty.noPeople.zh')}
      text={t('empty.noPeople.text')}
      action={<Button variant="outline" className="h-9" onClick={() => menuRef.current?.open()}>{t('empty.noPeople.action')}</Button>}
    />
  );
  // Đang tải: các dòng giả cùng chiều cao, không hiện màn trống.
  const skeletonColumns = columns.map((c, i): DataGridColumn<Person> => ({
    ...c,
    cell: (_, r) => (
      <span aria-hidden="true" className="flex w-full flex-col gap-1.5">
        <span style={{ width: `${55 + ((r * 7 + i * 13) % 35)}%` }} className="h-3 animate-pulse rounded bg-muted" />
        {i < 2 && <span className="h-2.5 w-2/5 animate-pulse rounded bg-muted" />}
      </span>
    ),
  }));

  const fuName = fu ? unitLabel(fu.n) : '';

  return (
    <>
      <PageShell className="relative gap-3">
        <PageBanner
          icon={<ShieldCheck />}
          title={t('title')}
          subtitle={`${t('titleZh')} · ${t('subtitle')}`}
          loadingLabel={t('common:loading')}
          badges={[
            {
              label: t('badgeManagers'),
              value: formatNumber(managerPsks.length),
              loading: managersQuery.isPending,
              onClick: showOverview,
              active: overview,
              title: t('allManagersHint'),
            },
            ...(orphanCount > 0
              ? [{
                  label: t('badgeOrphan'),
                  value: formatNumber(orphanCount),
                  loading: loading,
                  dot: true,
                  onClick: () => {
                    setOrphanOnly(true);
                    menuRef.current?.open();
                  },
                  active: orphanOnly,
                  title: t('filterOrphan'),
                }]
              : []),
          ]}
        />

        <div className="relative z-10 flex flex-none flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={overview}
            onClick={showOverview}
            title={t('allManagersHint')}
            className={cn(
              'inline-flex h-9 flex-none items-center gap-2 rounded-lg border px-3 text-[13px] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
              overview ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-brand' : 'border-border bg-card text-text-secondary shadow-field hover:border-border-strong hover:text-foreground'
            )}
          >
            <UserCheck aria-hidden="true" className="size-[15px] flex-none" />
            {t('allManagers')}
            <span className={cn('text-[11.5px] tabular-nums', overview ? 'opacity-80' : 'text-muted-foreground')}>{formatNumber(managerPsks.length)}</span>
          </button>
          <UnitMenu
            ref={menuRef}
            units={units}
            status={unitsQuery.status}
            onRetry={() => void unitsQuery.refetch()}
            selected={overview ? undefined : fu}
            onPick={pickUnit}
            covered={covered}
            orphanOnly={orphanOnly}
            orphanCount={orphanCount}
            onOrphanOnlyChange={setOrphanOnly}
          />

          <div className="w-65 max-w-full flex-none">
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(STEP); }}
              placeholder={t('searchEmployeePlaceholder')}
              aria-label={t('searchEmployee')}
              startIcon={<Search />}
              className="h-9 pr-9 pl-9"
              endAdornment={
                q && (
                  <button type="button" aria-label={t('clearSearch')} onClick={() => { setQ(''); setLimit(STEP); }} className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )
              }
            />
          </div>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border max-md:hidden" />
          <div role="group" aria-label={t('quickFilter')} className="flex flex-wrap items-center gap-1.5">
            {ROLE_FILTER_KEYS.map((key) => {
              const on = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickFilter(key)}
                  className={cn(
                    'inline-flex h-7.5 items-center gap-1.5 rounded-full border px-3 text-[12.5px] whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50',
                    on ? 'border-foreground bg-foreground font-semibold text-background' : 'border-transparent bg-muted font-medium text-text-secondary hover:bg-border hover:text-foreground'
                  )}
                >
                  {t(`tabs.${key}`)}
                  <span className={cn('text-[11.5px] tabular-nums', on ? 'opacity-70' : 'text-muted-foreground')}>{formatNumber(quickCount(key))}</span>
                </button>
              );
            })}
          </div>
        </div>

        <TableCard>
          <TableCardBar className="flex-wrap justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="flex min-w-0 items-baseline gap-2 text-[15px] font-semibold">
              <span>{t('listTitle')}</span>
              {(overview || fu) && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="truncate">{overview ? t('allManagersTitle') : fuName}</span>
                </>
              )}
              <span className="text-xs font-normal text-muted-foreground">{t('listZh')}</span>
            </h2>
            <div className="flex items-center gap-2">
              {rows.length !== people.length && <span className="text-xs text-muted-foreground tabular-nums">{t('shown', { n: formatNumber(rows.length) })}</span>}
              <Pill tone="neutral">{t('total', { n: formatNumber(people.length) })}</Pill>
            </div>
          </TableCardBar>
          <TableCardBody onScroll={onBodyScroll} className={cn('flex flex-col', changes.length > 0 && drawer === null && 'pb-20')}>
            <DataGrid
              aria-label={t('listTitle')}
              columns={loading ? skeletonColumns : columns}
              rows={loading ? SKELETON_ROWS : shownRows}
              rowKey={(p) => p.psk}
              density="comfortable"
              striped
              hoverRows={!loading}
              empty={empty}
              fillEmpty
            />
          </TableCardBody>
        </TableCard>

        {changes.length > 0 && drawer === null && (
          <div
            role="status"
            // Viên thuốc kính nổi (từ lg: `.liquid-popup` — cùng lớp kính với menu xổ).
            className="liquid-popup absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-border-strong bg-card py-1.5 pr-1.5 pl-5 shadow-toast max-lg:fixed"
          >
            <span className="size-2 flex-none animate-pulse-soft rounded-full bg-brand shadow-[0_0_10px_var(--brand)]" />
            <span className="text-[13.5px] font-semibold whitespace-nowrap tabular-nums">{t('unsavedChanges', { count: changes.length })}</span>
            <span className="text-xs whitespace-nowrap text-muted-foreground max-sm:hidden">{t('unsavedZh')}</span>
            <div className="ml-2 flex gap-2">
              <Button variant="ghost" className="h-9 rounded-full px-4" disabled={saveManagers.isPending} onClick={discard}>{t('discard')}</Button>
              <Button className="h-9 rounded-full px-4.5" loading={saveManagers.isPending} onClick={save}>{t('save')}</Button>
            </div>
          </div>
        )}
      </PageShell>

      <Dialog.Root open={drawer !== null} onOpenChange={(o) => !o && closeDrawer()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(10,20,25,.34)] transition-opacity duration-300 data-ending-style:duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none" />
          <Dialog.Popup
            className={cn(
              'fixed inset-y-0 right-0 z-51 flex w-117 max-w-full flex-col border-l border-border bg-card text-foreground shadow-[-16px_0_40px_rgba(0,0,0,.18)]',
              // Mở: trượt vào từ phải + hiện dần; đóng: trượt ra nhanh hơn. Tắt khi bật "giảm chuyển động".
              'transition-[translate,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] data-starting-style:translate-x-[calc(100%+2rem)] data-starting-style:opacity-0 data-ending-style:translate-x-[calc(100%+2rem)] data-ending-style:opacity-0 data-ending-style:duration-200 data-ending-style:ease-in motion-reduce:transition-none',
              glass && cn(glass, 'liquid-drawer inset-y-3 right-3 max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[20px] border')
            )}
          >
            <div className="flex flex-none items-start gap-3 border-b border-border px-5 pt-5 pb-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Dialog.Title className="text-[11px] font-semibold tracking-[.08em] text-muted-foreground uppercase">{t('drawerTitle')}</Dialog.Title>
                <span className="truncate text-lg font-semibold">{dPerson?.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{t('drawerSub', { id: dPerson?.id ?? '' })}</span>
              </div>
              <Dialog.Close render={<Button variant="ghost" size="icon-sm" />} aria-label={t('close')}>
                <X />
              </Dialog.Close>
            </div>
            <div className="flex flex-none flex-col gap-2 px-5 pt-3.5 pb-2">
              <Input value={dq} onChange={(e) => setDq(e.target.value)} placeholder={t('searchUnitPlaceholder')} aria-label={t('searchUnit')} startIcon={<Search />} className="h-9 pl-9" />
              <Dialog.Description className="text-xs text-muted-foreground">{t('drawerHint')}</Dialog.Description>
            </div>
            <div role="tree" aria-multiselectable="true" className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-3 pt-1 pb-3">
              {dRows.map((r) => {
                const lv = leavesOf(r.unit);
                const on = lv.filter((l) => dSet.has(l.id)).length;
                const all = on === lv.length;
                const toggleCheck = () => setDSel((s) => (all ? s.filter((id) => !lv.some((l) => l.id === id)) : [...new Set([...s, ...lv.map((l) => l.id)])]));
                return (
                  <div
                    key={r.unit.id}
                    role="treeitem"
                    aria-level={r.level + 1}
                    aria-selected={all}
                    onClick={toggleCheck}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-1 pl-1 hover:bg-muted"
                  >
                    <TreeRowView
                      row={r}
                      query={dq}
                      onToggle={() => setDOpen(toggleIn(dOpen, r.unit.id))}
                      lead={
                        <span onClick={(e) => e.stopPropagation()} className="flex">
                          <Checkbox checked={all} indeterminate={on > 0 && !all} aria-label={r.name} onCheckedChange={toggleCheck} />
                        </span>
                      }
                    />
                    {r.hasKids && on > 0 && <span className="flex-none text-[10.5px] text-muted-foreground">{t('partial', { on, total: lv.length })}</span>}
                    {r.count !== undefined && (
                      <span className="flex-none text-[11.5px] text-muted-foreground tabular-nums">{t('staffCount', { count: r.count, n: formatNumber(r.count) })}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-none items-center gap-3 border-t border-border bg-card px-5 py-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold tabular-nums">
                  {t('selectedSummary', {
                    groups: t('groupCount', { count: dSel.length, n: formatNumber(dSel.length) }),
                    people: t('staffCount', { count: peopleOf(dSel), n: formatNumber(peopleOf(dSel)) }),
                  })}
                </span>
                <span className="text-[11px] text-muted-foreground">{t('selectedZh')}</span>
              </div>
              <Button variant="outline" className="h-9" onClick={closeDrawer}>{t('cancel')}</Button>
              <Button
                className="h-9"
                disabled={dSel.length === 0}
                onClick={() => {
                  if (drawer !== null) setScopes((s) => ({ ...s, [drawer]: [...dSel] }));
                  closeDrawer();
                }}
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

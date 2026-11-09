import { Briefcase, Check, ChevronDown, ChevronLeft, ChevronRight, Search, UsersRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { PageBanner } from '@/components/ui/page-banner';
import { PageShell, TableCard, TableCardBar, TableCardBody } from '@/components/ui/table-page';
import { formatIsoDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { findUnit, norm, peopleInUnit, unitLabel } from '@/pages/roles/data';
import { flattenTree } from '@/pages/roles/tree';
import { TreeRowView } from '@/pages/roles/unit-tree';
import { useEmployees } from '@/pages/roles/use-employees';
import { useUnits } from '@/pages/roles/use-units';

const fieldClass =
  'relative flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-card px-3 text-left transition-colors hover:border-border-strong data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20';
const optionClass =
  'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2.5 pl-1.5 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50';

type ColKey = 'no' | 'employeeId' | 'name' | 'unit' | 'dept' | 'joinDate';
const COLS: { key: ColKey; w: number; align?: 'center' }[] = [
  { key: 'no', w: 64, align: 'center' },
  { key: 'employeeId', w: 120 },
  { key: 'name', w: 260 },
  { key: 'unit', w: 110 },
  { key: 'dept', w: 200 },
  { key: 'joinDate', w: 130 },
];

const PAGE_SIZES = [20, 50, 100] as const;

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/**
 * Chủ quản xem nhân viên trong phạm vi admin đã gán.
 * Backend đã lọc /api/departments và /api/employees theo phạm vi — trang này chỉ hiển thị.
 */
const Team = () => {
  const { t } = useTranslation(['team', 'common']);
  const unitsQuery = useUnits();
  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const parentIds = useMemo(() => units.filter((u) => u.k).map((u) => u.id), [units]);
  const employees = useEmployees();

  const [unit, setUnit] = useState<string | null>(null);
  const [unitMenu, setUnitMenu] = useState(false);
  const [mq, setMq] = useState('');
  const [openState, setOpenState] = useState<string[] | null>(null);
  const open = openState ?? parentIds;
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 300);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page, setPage] = useState(1);

  const fu = unit ? findUnit(units, unit) : undefined;
  const people = useMemo(() => peopleInUnit(employees.data, units, fu), [employees.data, units, fu]);
  const k = norm(dq.trim());
  const rows = people.filter((p) => !k || norm(p.name).includes(k) || p.id.includes(k));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const loading = unitsQuery.isPending || employees.isPending;
  const noScope = unitsQuery.isSuccess && units.length === 0;
  const menuRows = flattenTree(units, mq, open);

  const pickUnit = (id: string | null) => {
    setUnit(id);
    setPage(1);
    setUnitMenu(false);
  };

  return (
    <PageShell>
      <PageBanner
        icon={<UsersRound />}
        title={t('title')}
        subtitle={t('subtitle')}
        loadingLabel={t('common:loading')}
        badges={[
          { label: t('badgeMembers'), value: formatNumber(employees.data.length), loading },
          { label: t('badgeUnits'), value: formatNumber(units.length), loading: unitsQuery.isPending },
        ]}
      />

      <section className="relative z-10 flex flex-none flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex min-w-70 flex-1 flex-col">
          <Popover open={unitMenu} onOpenChange={setUnitMenu}>
            <PopoverTrigger className={fieldClass} disabled={noScope}>
              <Briefcase className="size-4 text-brand-text" />
              <span className="min-w-0 flex-1 truncate font-semibold">{fu ? unitLabel(fu.n) : t('allUnits')}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="min-w-90" onKeyDown={onListKeyDown}>
              <div className="flex-none p-2">
                <Input value={mq} onChange={(e) => setMq(e.target.value)} placeholder={t('searchUnitPlaceholder')} aria-label={t('searchUnit')} startIcon={<Search />} className="h-9 pl-9" />
              </div>
              <div role="listbox" aria-label={t('unit')} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
                {!mq && (
                  <div
                    role="option"
                    aria-selected={unit === null}
                    tabIndex={-1}
                    onClick={() => pickUnit(null)}
                    onKeyDown={(e) => e.key === 'Enter' && pickUnit(null)}
                    className={cn(optionClass, 'pl-2.5', unit === null && 'bg-accent')}
                  >
                    <span className="flex-1 font-medium">{t('allUnits')}</span>
                    {unit === null && <Check className="size-4 text-brand-text" />}
                  </div>
                )}
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
                        else if (e.key === 'ArrowRight' && r.hasKids && !r.open) setOpenState((o) => toggleIn(o ?? parentIds, r.unit.id));
                        else if (e.key === 'ArrowLeft' && r.hasKids && r.open) setOpenState((o) => toggleIn(o ?? parentIds, r.unit.id));
                      }}
                      className={cn(optionClass, sel && 'bg-accent')}
                    >
                      <TreeRowView row={r} query={mq} onToggle={() => setOpenState((o) => toggleIn(o ?? parentIds, r.unit.id))} />
                      {sel && <Check className="size-4 text-brand-text" />}
                    </div>
                  );
                })}
                {mq && menuRows.length === 0 && <div className="p-6 text-center text-muted-foreground">{t('noUnitMatch', { query: mq })}</div>}
              </div>
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
          <h2 className="text-[13px] font-bold tracking-[.06em]">{t('listTitle')}</h2>
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            {t('unit')}
            <span className="inline-flex h-5.5 items-center rounded-full bg-muted px-2.25 text-[11px] font-semibold whitespace-nowrap text-foreground">{fu ? unitLabel(fu.n) : t('allUnits')}</span>
          </span>
        </TableCardBar>

        {noScope ? (
          <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UsersRound className="size-5.5" />
            </div>
            <span className="text-sm font-semibold">{t('noScopeTitle')}</span>
            <span className="text-sm text-muted-foreground">{t('noScopeHint')}</span>
          </div>
        ) : (
          <>
            <TableCardBody>
              <table className="w-max min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="sticky top-0 z-3 bg-card bg-linear-to-b from-muted to-muted">
                    {COLS.map((c) => (
                      <th key={c.key} style={{ width: c.w, minWidth: c.w }} className={cn('h-11 [background:inherit] px-3 font-normal text-muted-foreground', c.align === 'center' ? 'text-center' : 'text-left')}>
                        <span className="block text-xs font-semibold whitespace-nowrap">{t(`cols.${c.key}`)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p, i) => {
                    const cell = 'h-14 border-b border-border [background:inherit] px-3 text-sm font-normal';
                    return (
                      <tr key={p.psk} className={cn('bg-card bg-linear-to-b hover:from-accent hover:to-accent', i % 2 ? 'from-accent/40 to-accent/40' : 'from-transparent to-transparent')}>
                        <td className={cn(cell, 'text-center text-muted-foreground tabular-nums')}>{start + i + 1}</td>
                        <td className={cn(cell, 'tabular-nums')}>{p.id}</td>
                        <td className={cell}>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">{p.name}</span>
                            {p.position && <span className="truncate text-xs text-muted-foreground">{p.position}</span>}
                          </span>
                        </td>
                        <td className={cn(cell, 'text-text-secondary')}>{p.unit}</td>
                        <td className={cn(cell, 'text-text-secondary')}>{p.dept || <span className="text-placeholder">{t('noTeam')}</span>}</td>
                        <td className={cn(cell, 'text-text-secondary tabular-nums')}>{p.join ? formatIsoDate(p.join) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {loading ? (
                <div className="sticky left-0 w-full px-6 py-12 text-center text-muted-foreground">{t('common:loading')}…</div>
              ) : unitsQuery.isError || (employees.isError && rows.length === 0) ? (
                <div className="sticky left-0 flex w-full flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
                  {t(unitsQuery.isError ? 'unitsError' : 'employeesError')}
                  <Button variant="outline" size="sm" onClick={() => (unitsQuery.isError ? void unitsQuery.refetch() : void employees.refetch())}>{t('common:retry')}</Button>
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
        )}
      </TableCard>
    </PageShell>
  );
};

export default Team;

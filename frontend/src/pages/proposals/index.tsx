import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, CircleAlert, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataGrid, type DataGridColumn, type DataGridGroup } from '@/components/ui/data-grid';
import { ConfirmDialog } from '@/components/ui/dialog';
import { FormAlert } from '@/components/ui/form-alert';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/metric-card';
import { PageBanner, type PageBannerBadge } from '@/components/ui/page-banner';
import { Popover, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { PageShell, TableCard, TableCardBody } from '@/components/ui/table-page';
import { toast } from '@/components/ui/toast';
import { ABC_RULES, PROPOSAL_RESULTS, type ProposalResult } from '@/config/kpi-proposal';
import { formatAccounting, formatMoney, formatMonthRange, formatPercent, formatPeriodShort, formatSlashDate, formatTime } from '@/lib/format';
import { useCurrentUser } from '@/lib/session';
import { useUnsavedChanges } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import type { ProposalEdit, ProposalRow } from '@/services/kpiProposal';
import { diffOf, formatAbc, isMutedRow, nextOf, percentOf, rowTextClass, validateRow, type RowIssue } from './logic';
import { useKpiProposal, useSaveKpiProposalDraft, useSubmitKpiProposal } from './use-kpi-proposal';

/** Ô nhập trong bảng: trong suốt, viền hiện khi rê chuột/focus, chữ theo màu của dòng. */
const fieldClass =
  'box-border w-full rounded-lg border bg-card text-inherit outline-none placeholder:text-placeholder hover:border-border-strong focus:border-brand focus:ring-3 focus:ring-accent';
const textareaClass = cn(fieldClass, 'min-h-7.5 resize-none border-transparent px-2 py-1.5 leading-[1.35] field-sizing-content');
const optionClass =
  'flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50';

const editOf = (r: ProposalRow): ProposalEdit => ({ duties: r.duties, result: r.result, next: r.next, note: r.note });

/** % thay đổi: giảm trong ngoặc đơn như số tiền; kỳ trước = 0 mà kỳ này có tiền → "Mới". */
const changeText = (prev: number, next: number, newLabel: string) => {
  const pct = percentOf(prev, next);
  if (pct === null) return next > 0 ? newLabel : '';
  return pct < 0 ? `(${formatPercent(-pct)})` : formatPercent(pct);
};

const Proposals = () => {
  const { t } = useTranslation(['proposal', 'common']);
  const user = useCurrentUser();
  const { data, isPending, isError, refetch } = useKpiProposal();
  const save = useSaveKpiProposalDraft();
  const submit = useSubmitKpiProposal();

  /** Bản nháp cục bộ: chỉ các dòng đã sửa, gửi lên khi "Lưu nháp" / "Xác nhận & gửi". */
  const [edits, setEdits] = useState<Record<string, ProposalEdit>>({});
  const [unit, setUnit] = useState<string | null>(null);
  const [unitMenu, setUnitMenu] = useState(false);
  const [resultMenu, setResultMenu] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // BLĐ tạm thời chỉ xem; đã gửi thì khóa với mọi người.
  const submitted = data?.status === 'submitted';
  const readOnly = user.role === 'BLD' || submitted;
  const dirty = Object.keys(edits).length > 0;
  useUnsavedChanges(dirty && !readOnly);

  const rows = useMemo(() => (data?.rows ?? []).map((r) => ({ ...r, ...edits[r.psk] })), [data, edits]);
  const issues = useMemo(() => {
    const m = new Map<string, RowIssue>();
    if (!readOnly) for (const r of rows) {
      const issue = validateRow(r);
      if (issue) m.set(r.psk, issue);
    }
    return m;
  }, [rows, readOnly]);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) => (!unit || r.unit === unit) && (!q || r.name.toLowerCase().includes(q) || r.cardNo.toLowerCase().includes(q))
  );
  // Dòng tổng cộng mọi dòng đang hiển thị (gồm cả dòng nền xám và dòng bằng 0).
  const totalPrev = visible.reduce((s, r) => s + r.prev, 0);
  const totalNext = visible.reduce((s, r) => s + nextOf(r), 0);
  const totalDiff = totalNext - totalPrev;
  const filled = rows.filter((r) => r.duties.trim()).length;

  const edit = (row: ProposalRow, patch: Partial<ProposalEdit>) =>
    setEdits((e) => ({ ...e, [row.psk]: { ...editOf(row), ...patch } }));

  /** Bỏ khỏi bản nháp các dòng vừa gửi đi — giữ lại những gì người dùng sửa tiếp trong lúc chờ. */
  const clearSent = (sent: Record<string, ProposalEdit>) =>
    setEdits((cur) => Object.fromEntries(Object.entries(cur).filter(([k, v]) => sent[k] !== v)));

  const saveDraft = () =>
    save.mutate(edits, { onSuccess: (_, sent) => clearSent(sent), onError: () => toast.error(t('saveError')) });

  const confirmSubmit = () => {
    setConfirmOpen(false);
    submit.mutate(edits, {
      onSuccess: (_, sent) => {
        clearSent(sent);
        setResultMenu(null);
        toast.success(t('submitted'));
      },
      onError: () => toast.error(t('submitError')),
    });
  };

  const period = data?.period;
  const prevRange = period ? formatMonthRange(period.prev.from, period.prev.to) : '';
  const nextRange = period ? formatMonthRange(period.next.from, period.next.to) : '';
  const maxIncrease = formatMoney(ABC_RULES.maxIncrease);

  const resultLabel = (k: ProposalResult) => t(`results.${k}.label`);
  const resultHint = (k: ProposalResult) => t(`results.${k}.hint`) || undefined;

  const columns: DataGridColumn<ProposalRow>[] = [
    { key: 'unit', width: 88, pinned: true, tone: 'read', header: t('cols.unit.label'), sub: t('cols.unit.sub'), tooltip: t('cols.unit.full'), cellClassName: 'whitespace-nowrap', cell: (r) => r.unit },
    { key: 'name', width: 88, pinned: true, tone: 'read', divider: 'end', header: t('cols.name.label'), sub: t('cols.name.sub'), tooltip: t('cols.name.full'), cellClassName: 'font-semibold', cell: (r) => r.name },
    { key: 'cardNo', width: 80, tone: 'read', header: t('cols.cardNo.label'), sub: t('cols.cardNo.sub'), tooltip: t('cols.cardNo.full'), cellClassName: 'tabular-nums', cell: (r) => r.cardNo },
    { key: 'joinDate', width: 88, tone: 'read', header: t('cols.joinDate.label'), sub: t('cols.joinDate.sub'), tooltip: t('cols.joinDate.full'), cellClassName: 'whitespace-nowrap tabular-nums', cell: (r) => formatSlashDate(r.joinDate) },
    { key: 'seniority', width: 96, align: 'end', tone: 'read', header: t('cols.seniority.label'), sub: t('cols.seniority.sub'), tooltip: t('cols.seniority.full'), cellClassName: 'tabular-nums', cell: (r) => formatAccounting(r.seniority, 1) },
    { key: 'position', width: 84, tone: 'read', header: t('cols.position.label'), sub: t('cols.position.sub'), tooltip: t('cols.position.full'), cellClassName: 'whitespace-nowrap', cell: (r) => r.position },
    { key: 'abc', width: 128, tone: 'read', header: t('cols.abc.label'), sub: t('cols.abc.sub'), tooltip: t('cols.abc.full'), cellClassName: 'tabular-nums', cell: (r) => formatAbc(r.abc) },
    { key: 'status', width: 124, tone: 'read', header: t('cols.status.label'), sub: t('cols.status.sub'), tooltip: t('cols.status.full'), cell: (r) => t(`status.${r.status}`) },
    {
      key: 'leave', width: 172, tone: 'read', header: t('cols.leave.label'), sub: t('cols.leave.sub'), tooltip: t('cols.leave.full'), cellClassName: 'whitespace-nowrap tabular-nums',
      cell: (r) => r.leave && t('leaveRange', { from: formatSlashDate(r.leave.from), to: formatSlashDate(r.leave.to) }),
    },
    { key: 'resignDate', width: 100, tone: 'read', divider: 'end', header: t('cols.resignDate.label'), sub: t('cols.resignDate.sub'), tooltip: t('cols.resignDate.full'), cellClassName: 'whitespace-nowrap tabular-nums', cell: (r) => r.resignDate && formatSlashDate(r.resignDate) },
    {
      key: 'duties', width: 'minmax(180px,1fr)', tone: 'input', field: true, header: t('cols.duties.label'), sub: t('cols.duties.sub'), tooltip: t('cols.duties.full'),
      cell: (r) =>
        readOnly ? (
          <span className="px-2 py-1.5 whitespace-pre-wrap">{r.duties}</span>
        ) : (
          <textarea rows={1} value={r.duties} onChange={(e) => edit(r, { duties: e.target.value })} placeholder={t('placeholder')} aria-label={t('fields.duties', { name: r.name })} className={textareaClass} />
        ),
    },
    {
      key: 'result', width: 200, tone: 'input', field: true, header: t('cols.result.label'), sub: t('cols.result.sub'), tooltip: t('cols.result.full'),
      cell: (r) => {
        const issue = issues.get(r.psk);
        return (
          <div className="flex w-full flex-col justify-center gap-0.75">
            {readOnly ? (
              <span title={resultHint(r.result)} className="px-2 py-1 font-medium">
                {resultLabel(r.result)}
              </span>
            ) : (
              <Popover open={resultMenu === r.psk} onOpenChange={(o) => setResultMenu(o ? r.psk : null)}>
                <PopoverTrigger
                  title={resultHint(r.result)}
                  aria-label={t('fields.result', { name: r.name })}
                  aria-invalid={issue === 'mustReduce' || undefined}
                  className={cn(
                    fieldClass,
                    'flex min-h-7.5 cursor-pointer items-center gap-1 px-2 py-1 text-left leading-[1.3] font-medium data-popup-open:border-brand',
                    issue === 'mustReduce' ? 'border-danger-text' : 'border-transparent'
                  )}
                >
                  <span className="min-w-0 flex-1">{resultLabel(r.result)}</span>
                  <ChevronDown aria-hidden="true" className="size-3 flex-none opacity-55" />
                </PopoverTrigger>
                <PopoverContent className="min-w-75 p-1" onKeyDown={onListKeyDown}>
                  <div role="listbox" aria-label={t('cols.result.label')} className="flex flex-col gap-0.5 overflow-y-auto">
                    {PROPOSAL_RESULTS.map((k) => {
                      const sel = k === r.result;
                      const pick = () => {
                        edit(r, { result: k });
                        setResultMenu(null);
                      };
                      return (
                        <div
                          key={k}
                          role="option"
                          aria-selected={sel}
                          tabIndex={-1}
                          onClick={pick}
                          onKeyDown={(e) => e.key === 'Enter' && pick()}
                          className={cn(optionClass, sel && 'bg-accent text-accent-foreground')}
                        >
                          <span className="flex flex-col gap-px">
                            <span className="font-medium">{resultLabel(k)}</span>
                            {resultHint(k) && <span className="text-[11px] text-muted-foreground">{resultHint(k)}</span>}
                          </span>
                          {sel && <Check aria-hidden="true" className="size-3.5 flex-none text-brand-text" />}
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {issue && (
              <div role="alert" className="flex items-center gap-1 px-1 text-[11px] font-semibold text-danger-text">
                <CircleAlert aria-hidden="true" className="size-3 flex-none" />
                <span>{t(`issue.${issue}`, { max: maxIncrease })}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'prev', width: 104, align: 'end', tone: 'read', header: prevRange, sub: t('cols.amount.sub'), tooltip: t('cols.amount.full', { range: prevRange }),
      cellClassName: 'tabular-nums', cell: (r) => formatMoney(r.prev), footer: formatMoney(totalPrev),
    },
    {
      key: 'next', width: 116, align: 'end', tone: 'input', field: true, header: nextRange, sub: t('cols.amount.sub'), tooltip: t('cols.amount.full', { range: nextRange }),
      footer: formatMoney(totalNext),
      cell: (r) =>
        readOnly ? (
          <span className="px-2 font-semibold tabular-nums">{r.next === null ? '' : formatMoney(r.next)}</span>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={r.next === null ? '' : formatMoney(r.next)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              edit(r, { next: digits === '' ? null : Number(digits) });
            }}
            aria-label={t('fields.amount', { range: nextRange, name: r.name })}
            aria-invalid={issues.get(r.psk) === 'capIncrease' || undefined}
            className={cn(fieldClass, 'h-7.5 px-2 text-right font-semibold tabular-nums', issues.get(r.psk) === 'capIncrease' ? 'border-danger-text' : 'border-transparent')}
          />
        ),
    },
    {
      key: 'diff', width: 100, align: 'end', tone: 'read', header: t('cols.diff.label'), sub: t('cols.diff.sub'), tooltip: t('cols.diff.full'),
      cellClassName: (r) => cn('font-medium whitespace-nowrap tabular-nums', diffOf(r) < 0 && 'text-danger-text'),
      cell: (r) => formatMoney(diffOf(r)),
      footer: <span className={cn(totalDiff < 0 && 'text-danger-text')}>{formatMoney(totalDiff)}</span>,
    },
    {
      key: 'percent', width: 88, align: 'end', tone: 'read', header: t('cols.percent.label'), sub: t('cols.percent.sub'), tooltip: t('cols.percent.full'),
      cellClassName: (r) => cn('whitespace-nowrap tabular-nums', diffOf(r) < 0 && 'text-danger-text'),
      cell: (r) => changeText(r.prev, nextOf(r), t('newEntry')),
      footer: <span className={cn(totalDiff < 0 && 'text-danger-text')}>{changeText(totalPrev, totalNext, t('newEntry'))}</span>,
    },
    {
      key: 'note', width: 132, tone: 'plain', field: true, header: t('cols.note.label'), sub: t('cols.note.sub'), tooltip: t('cols.note.full'),
      cell: (r) =>
        readOnly ? (
          <span className="px-2 py-1.5 whitespace-pre-wrap">{r.note}</span>
        ) : (
          <textarea rows={1} value={r.note} onChange={(e) => edit(r, { note: e.target.value })} placeholder={t('placeholder')} aria-label={t('fields.note', { name: r.name })} className={textareaClass} />
        ),
    },
    // Chỉ BLĐ cập nhật — Chủ quản và Admin chỉ xem.
    {
      key: 'board', width: 124, tone: 'locked', divider: 'start', header: t('cols.board.label'), sub: t('cols.board.sub'), tooltip: t('cols.board.full'),
      cell: (r) => <span title={t('boardOnly')}>{r.boardDecision}</span>,
    },
  ];

  const groups: DataGridGroup[] = [
    { key: 'hr', span: 2, tone: 'read', label: t('groups.hr.label'), tooltip: t('groups.hr.full') },
    { key: 'hr-rest', span: 8, tone: 'read', divider: true },
    { key: 'cqFill', span: 1, tone: 'input', divider: true, label: t('groups.cqFill.label'), tooltip: t('groups.cqFill.full') },
    { key: 'preset', span: 1, tone: 'input', divider: true, label: t('groups.preset.label'), tooltip: t('groups.preset.full') },
    { key: 'system', span: 1, tone: 'read', divider: true, label: t('groups.system.label'), tooltip: t('groups.system.full') },
    { key: 'cqGive', span: 1, tone: 'input', divider: true, label: t('groups.cqGive.label'), tooltip: t('groups.cqGive.full') },
    { key: 'auto', span: 2, tone: 'read', divider: true, label: t('groups.auto.label'), tooltip: t('groups.auto.full') },
    { key: 'rest', span: 2, tone: 'plain' },
  ];

  const total = rows.length;
  const badges: PageBannerBadge[] = !data
    ? [{ label: t('badge.filled'), value: '', loading: true }]
    : submitted
      ? [
          { label: t('badge.submitted'), value: t('badge.awaiting'), dot: true },
          { label: t('badge.filled'), value: t('badge.filledValue', { filled, total }) },
        ]
      : [
          { label: t('badge.open'), value: t('badge.deadline', { date: formatSlashDate(data.period.deadline) }), dot: true },
          { label: t('badge.filled'), value: t('badge.filledValue', { filled, total }) },
        ];

  const noScope = !!data && data.units.length === 0;
  const busy = save.isPending || submit.isPending;

  return (
    <PageShell className="gap-3 lg:px-6 lg:pt-4 lg:pb-5">
      <PageBanner
        icon={<FileText />}
        title={period ? t('banner.title', { round: period.round }) : ' '}
        subtitle={period && t('banner.subtitle', { range: formatPeriodShort(period.next.from, period.next.to) })}
        badges={badges}
        loadingLabel={t('common:loading')}
      />

      <div className="flex flex-none flex-wrap items-center gap-2">
        <Popover open={unitMenu} onOpenChange={setUnitMenu}>
          <PopoverTrigger
            aria-label={t('unitFilter')}
            disabled={!data || noScope}
            className="flex h-9 w-43 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 data-popup-open:border-brand"
          >
            <span className="font-normal text-muted-foreground">{t('unitLabel')}</span>
            <span className="min-w-0 truncate">{unit ?? t('allUnits')}</span>
            <ChevronDown aria-hidden="true" className="ml-auto size-3.5 flex-none opacity-60" />
          </PopoverTrigger>
          <PopoverContent className="min-w-43 p-1" onKeyDown={onListKeyDown}>
            <div role="listbox" aria-label={t('unitFilter')} className="flex flex-col gap-0.5 overflow-y-auto">
              {[null, ...(data?.units ?? [])].map((u) => {
                const sel = u === unit;
                const pick = () => {
                  setUnit(u);
                  setUnitMenu(false);
                };
                return (
                  <div
                    key={u ?? 'all'}
                    role="option"
                    aria-selected={sel}
                    tabIndex={-1}
                    onClick={pick}
                    onKeyDown={(e) => e.key === 'Enter' && pick()}
                    className={cn(optionClass, sel && 'bg-accent text-accent-foreground')}
                  >
                    <span>{u ?? t('allUnits')}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{u ? rows.filter((r) => r.unit === u).length : rows.length}</span>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <div className="w-full sm:w-65">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('search')}
            startIcon={<Search />}
            className="h-9 pl-9 text-[13px]"
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {issues.size > 0 && <span className="text-[13px] font-medium text-danger-text">{t('issues', { count: issues.size })}</span>}
          {readOnly ? (
            data && <Pill tone={submitted ? 'warning' : 'neutral'}>{submitted ? t('submittedPill') : t('readOnlyPill')}</Pill>
          ) : (
            <>
              {data?.savedAt && !dirty && <span className="text-[13px] text-muted-foreground">{t('savedAt', { time: formatTime(data.savedAt) })}</span>}
              <Button variant="outline" size="lg" className="px-3.5" onClick={saveDraft} disabled={!data || !dirty || busy}>
                {save.isPending ? t('saving') : t('saveDraft')}
              </Button>
              <Button size="lg" className="px-3.5" onClick={() => setConfirmOpen(true)} disabled={!data || noScope || issues.size > 0 || busy}>
                {t('submit')}
              </Button>
            </>
          )}
        </div>
      </div>

      {isError ? (
        <FormAlert tone="error" className="flex-none">
          <span className="flex-1">{t('loadError')}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </Button>
        </FormAlert>
      ) : (
        <TableCard>
          {/* flex-col: DataGrid (flex-1) cao ít nhất bằng khung để dòng tổng nằm ở đáy. */}
          <TableCardBody className="flex flex-col">
            {isPending ? (
              <p role="status" className="p-6 text-center text-sm text-muted-foreground">
                {t('common:loading')}
              </p>
            ) : (
              <DataGrid
                aria-label={t('grid')}
                columns={columns}
                groups={groups}
                rows={visible}
                rowKey={(r) => r.psk}
                rowClassName={(r) => cn(isMutedRow(r) ? 'bg-grid-row-muted' : 'bg-card', rowTextClass(r))}
                empty={
                  noScope ? (
                    <span className="flex flex-col gap-1">
                      <strong className="font-semibold text-foreground">{t('noScopeTitle')}</strong>
                      {t('noScopeHint')}
                    </span>
                  ) : (
                    t('noMatch')
                  )
                }
                footerLabel={
                  <>
                    {t('total')}
                    <span className="font-normal text-muted-foreground">· {t('employeeCount', { count: visible.length })}</span>
                  </>
                }
              />
            )}
          </TableCardBody>
        </TableCard>
      )}

      <FormAlert tone="info" className="flex-none px-3.5 py-2.5 text-xs">
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          <span className="font-semibold text-foreground">{t('rules.title')}</span>
          <span className="text-text-secondary">{t('rules.body')}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <Pill tone="danger">{t('rules.c3')}</Pill>
            <Pill tone="warning">{t('rules.c2', { max: maxIncrease })}</Pill>
            <Pill tone="neutral">{t('rules.c1')}</Pill>
          </span>
        </span>
      </FormAlert>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirm.title', { units: data?.units.join(', ') ?? '' })}
        description={t('confirm.description')}
        confirmLabel={t('confirm.confirm')}
        cancelLabel={t('confirm.cancel')}
        onConfirm={confirmSubmit}
      />
    </PageShell>
  );
};

export default Proposals;

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, FileText, Search, TriangleAlert } from 'lucide-react';
import { AbcChip } from '@/components/ui/abc-chip';
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
import { Tooltip } from '@/components/ui/tooltip';
import { ABC_RULES, canEdit, isEditor, PROPOSAL_RESULTS, type EditableField, type ProposalResult } from '@/config/kpi-proposal';
import { parseAbcRatings } from '@/lib/abc';
import { formatAccounting, formatMoney, formatMonthRange, formatPercent, formatPeriodShort, formatSlashDate, formatTime } from '@/lib/format';
import { useCurrentUser } from '@/lib/session';
import { useUnsavedChanges } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import type { ProposalEdit, ProposalRow } from '@/services/kpiProposal';
import {
  abcChipTone,
  diffOf,
  isMutedRow,
  nextOf,
  percentOf,
  resultAccentClass,
  resultTextClass,
  summarize,
  validateRow,
  type RowIssue,
} from './logic';
import {
  useApproveKpiProposal,
  useKpiProposal,
  useReturnKpiProposal,
  useSaveKpiProposalDraft,
  useSubmitKpiProposal,
} from './use-kpi-proposal';

/** Ô nhập trong bảng: viền nhạt, đậm lên khi rê chuột/focus. */
const fieldClass =
  'box-border w-full min-w-0 rounded-lg border bg-card text-foreground outline-none placeholder:text-placeholder hover:border-brand focus:border-brand focus:ring-3 focus:ring-accent';
const textareaClass = cn(fieldClass, 'min-h-8 resize-none border-border px-2 py-1.5 leading-[1.35] field-sizing-content');
const optionClass =
  'flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50';

type ConfirmMode = 'submit' | 'approve' | 'return';

/** % thay đổi: giảm trong ngoặc đơn như số tiền; kỳ trước = 0 mà kỳ này có tiền → "Mới". */
const changeText = (prev: number, next: number, newLabel: string) => {
  const pct = percentOf(prev, next);
  if (pct === null) return next > 0 ? newLabel : '';
  return pct < 0 ? `(${formatPercent(-pct)})` : formatPercent(pct);
};

/** Số tiền + % thay đổi ở dòng phụ, căn phải; âm thì đỏ. */
const DiffCell = ({ prev, next, newLabel, className }: { prev: number; next: number; newLabel: string; className?: string }) => {
  const diff = next - prev;
  return (
    <span className={cn('flex flex-col items-end gap-px tabular-nums', diff < 0 && 'text-danger-text', className)}>
      <span>{formatMoney(diff)}</span>
      <span className="text-[11px] font-normal opacity-75">{changeText(prev, next, newLabel)}</span>
    </span>
  );
};

const Proposals = () => {
  const { t } = useTranslation(['proposal', 'common']);
  const user = useCurrentUser();
  const { data, isPending, isError, refetch } = useKpiProposal();
  const save = useSaveKpiProposalDraft();
  const actions = { submit: useSubmitKpiProposal(), approve: useApproveKpiProposal(), return: useReturnKpiProposal() };

  /** Bản nháp cục bộ: chỉ các ô đã sửa, gửi lên khi lưu nháp / gửi / duyệt / trả lại. */
  const [edits, setEdits] = useState<Record<string, ProposalEdit>>({});
  const [unit, setUnit] = useState<string | null>(null);
  const [unitMenu, setUnitMenu] = useState(false);
  const [resultMenu, setResultMenu] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<ConfirmMode | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const status = data?.status ?? 'draft';
  // Quyền theo cột lấy từ cấu hình (ROLE_EDIT), không đặt điều kiện vai trò rải rác trong bảng.
  const can = (field: EditableField) => !!data && canEdit(user.role, status, field);
  const editor = !!data && isEditor(user.role, status);
  const checksAbc = can('next') || can('result');
  const dirty = Object.keys(edits).length > 0;
  useUnsavedChanges(dirty && editor);

  const rows = useMemo(() => (data?.rows ?? []).map((r) => ({ ...r, ...edits[r.psk] })), [data, edits]);
  const issues = useMemo(() => {
    const m = new Map<string, RowIssue>();
    if (checksAbc) for (const r of rows) {
      const issue = validateRow(r);
      if (issue) m.set(r.psk, issue);
    }
    return m;
  }, [rows, checksAbc]);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) => (!unit || r.unit === unit) && (!q || r.name.toLowerCase().includes(q) || r.cardNo.toLowerCase().includes(q))
  );
  // Dòng tổng cộng TẤT CẢ các dòng đang hiển thị (gồm cả dòng nền xám và dòng bằng 0).
  const total = summarize(visible);

  const edit = (row: ProposalRow, patch: ProposalEdit) => setEdits((e) => ({ ...e, [row.psk]: { ...e[row.psk], ...patch } }));

  /** Bỏ khỏi bản nháp các dòng vừa gửi đi — giữ lại những gì người dùng sửa tiếp trong lúc chờ. */
  const clearSent = (sent: Record<string, ProposalEdit>) =>
    setEdits((cur) => Object.fromEntries(Object.entries(cur).filter(([k, v]) => sent[k] !== v)));

  const saveDraft = () =>
    save.mutate(edits, { onSuccess: (_, sent) => clearSent(sent), onError: () => toast.error(t('saveError')) });

  const runConfirm = () => {
    if (!confirm) return;
    const mode = confirm;
    setConfirm(null);
    actions[mode].mutate(edits, {
      onSuccess: (_, sent) => {
        clearSent(sent);
        setResultMenu(null);
        toast.success(t(`done.${mode}`));
      },
      onError: () => toast.error(t('actionError')),
    });
  };

  const period = data?.period;
  const prevRange = period ? formatMonthRange(period.prev.from, period.prev.to) : '';
  const nextRange = period ? formatMonthRange(period.next.from, period.next.to) : '';
  const maxIncrease = formatMoney(ABC_RULES.maxIncrease);
  const issueText = (issue: RowIssue) => t(`issue.${issue}`, { max: maxIncrease });

  const resultLabel = (k: ProposalResult) => t(`results.${k}.label`);
  const resultHint = (k: ProposalResult) => t(`results.${k}.hint`) || undefined;
  const readText = (text: string | null) =>
    text ? <span className="px-0.5 whitespace-pre-wrap">{text}</span> : <span className="px-0.5 text-placeholder">{t('none')}</span>;

  const columns: DataGridColumn<ProposalRow>[] = [
    {
      key: 'unit', width: 68, pinned: true, header: t('cols.unit.label'), sub: t('cols.unit.sub'), tooltip: t('cols.unit.full'),
      cellClassName: 'whitespace-nowrap text-text-secondary', cell: (r) => r.unit,
      filter: { label: t('unitFilter'), active: !!unit, onClick: () => setUnitMenu(true) },
    },
    {
      key: 'name', width: 96, pinned: true, divider: 'end', header: t('cols.name.label'), sub: t('cols.name.sub'), tooltip: t('cols.name.full'),
      filter: { label: t('nameFilter'), active: !!q, onClick: () => searchRef.current?.focus() },
      cell: (r) => (
        <span className="flex min-w-0 flex-col gap-px">
          <span className={cn('truncate text-[13px] font-semibold', resultTextClass(r))}>{r.name}</span>
          <span className="truncate text-[11px] text-muted-foreground tabular-nums">{r.cardNo}</span>
        </span>
      ),
    },
    { key: 'joinDate', width: 88, header: t('cols.joinDate.label'), sub: t('cols.joinDate.sub'), tooltip: t('cols.joinDate.full'), cellClassName: 'whitespace-nowrap tabular-nums', cell: (r) => formatSlashDate(r.joinDate) },
    { key: 'seniority', width: 76, align: 'end', header: t('cols.seniority.label'), sub: t('cols.seniority.sub'), tooltip: t('cols.seniority.full'), cellClassName: 'pr-3 tabular-nums', cell: (r) => formatAccounting(r.seniority, 1) },
    { key: 'position', width: 64, header: t('cols.position.label'), sub: t('cols.position.sub'), tooltip: t('cols.position.full'), cellClassName: 'whitespace-nowrap', cell: (r) => r.position },
    {
      key: 'abc', width: 100, header: t('cols.abc.label'), sub: t('cols.abc.sub'), tooltip: t('cols.abc.full'),
      // Màu chip theo mức bình bầu, không theo màu kết quả của dòng.
      cell: (r) => (
        <span className="flex flex-nowrap items-center gap-1">
          {parseAbcRatings(r.abc).map((a, i) => (
            <AbcChip key={i} count={a.count} grade={a.grade} tone={abcChipTone(a)} />
          ))}
        </span>
      ),
    },
    {
      key: 'status', width: 152, header: t('cols.status.label'), sub: t('cols.status.sub'), tooltip: t('cols.status.full'),
      cell: (r) => {
        if (r.status === 'active') return null;
        const sub = r.leave
          ? t('leaveRange', { from: formatSlashDate(r.leave.from), to: formatSlashDate(r.leave.to) })
          : r.resignDate && t('resignOn', { date: formatSlashDate(r.resignDate) });
        return (
          <span className="flex flex-col items-start gap-0.5 py-1">
            <Pill tone="neutral">{t(`status.${r.status}`)}</Pill>
            {sub && <span className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">{sub}</span>}
          </span>
        );
      },
    },
    {
      key: 'duties', width: 'minmax(96px,1fr)', field: true, header: t('cols.duties.label'), sub: t('cols.duties.sub'), tooltip: t('cols.duties.full'),
      cell: (r) =>
        can('duties') ? (
          <textarea rows={1} value={r.duties} onChange={(e) => edit(r, { duties: e.target.value })} placeholder={t('placeholder')} aria-label={t('fields.duties', { name: r.name })} className={textareaClass} />
        ) : (
          readText(r.duties)
        ),
    },
    {
      key: 'result', width: 148, field: true, header: t('cols.result.label'), sub: t('cols.result.sub'), tooltip: t('cols.result.full'),
      cellClassName: (r) => resultTextClass(r),
      cell: (r) => {
        if (!can('result'))
          return (
            <span title={resultHint(r.result)} className="line-clamp-2 px-0.5 font-medium">
              {resultLabel(r.result)}
            </span>
          );
        const invalid = issues.get(r.psk) === 'mustReduce';
        return (
          <Popover open={resultMenu === r.psk} onOpenChange={(o) => setResultMenu(o ? r.psk : null)}>
            <PopoverTrigger
              title={resultHint(r.result)}
              aria-label={t('fields.result', { name: r.name })}
              aria-invalid={invalid || undefined}
              className={cn(fieldClass, 'flex min-h-8 cursor-pointer items-center gap-1.5 px-2 py-1 text-left leading-[1.3] font-medium text-inherit data-popup-open:border-brand', invalid ? 'border-danger-text' : 'border-border')}
            >
              <span className="line-clamp-2 min-w-0 flex-1">{resultLabel(r.result)}</span>
              <ChevronDown aria-hidden="true" className="size-3 flex-none text-muted-foreground" />
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
                    <div key={k} role="option" aria-selected={sel} tabIndex={-1} onClick={pick} onKeyDown={(e) => e.key === 'Enter' && pick()} className={cn(optionClass, sel && 'bg-accent text-accent-foreground')}>
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
        );
      },
    },
    {
      key: 'prev', width: 88, align: 'end', header: t('cols.prev.label'), sub: t('cols.prev.sub', { range: prevRange }), tooltip: t('cols.prev.full', { range: prevRange }),
      cellClassName: 'pr-2.5 tabular-nums', cell: (r) => formatMoney(r.prev), footer: formatMoney(total.prev),
    },
    {
      key: 'next', width: 116, align: 'end', field: true, header: t('cols.next.label'), sub: t('cols.next.sub', { range: nextRange }), tooltip: t('cols.next.full', { range: nextRange }),
      cellClassName: (r) => cn('gap-1', resultTextClass(r)), footer: <span className="pr-1">{formatMoney(total.next)}</span>,
      cell: (r) => {
        const issue = issues.get(r.psk);
        return (
          <>
            {issue && (
              <Tooltip content={issueText(issue)} side="top" sideOffset={6}>
                <span tabIndex={0} role="img" aria-label={issueText(issue)} className="flex flex-none cursor-help rounded-sm text-danger-text outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <TriangleAlert aria-hidden="true" className="size-[15px]" strokeWidth={2.2} />
                </span>
              </Tooltip>
            )}
            {can('next') ? (
              <input
                type="text"
                inputMode="numeric"
                value={r.next === null ? '' : formatMoney(r.next)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  edit(r, { next: digits === '' ? null : Number(digits) });
                }}
                aria-label={t('fields.amount', { name: r.name })}
                aria-invalid={!!issue || undefined}
                className={cn(fieldClass, 'h-8 flex-1 px-2 text-right text-[12.5px] font-semibold text-inherit tabular-nums', issue ? 'border-danger-text' : 'border-border')}
              />
            ) : (
              <span className="pr-1 text-[12.5px] font-semibold tabular-nums">{r.next === null ? '' : formatMoney(r.next)}</span>
            )}
          </>
        );
      },
    },
    {
      key: 'diff', width: 100, align: 'end', header: t('cols.diff.label'), sub: t('cols.diff.sub'), tooltip: t('cols.diff.full'),
      cellClassName: (r) => cn('pr-2.5 font-medium whitespace-nowrap', resultTextClass(r)),
      cell: (r) => <DiffCell prev={r.prev} next={nextOf(r)} newLabel={t('newEntry')} className={cn(diffOf(r) < 0 && 'text-danger-text')} />,
      footer: <DiffCell prev={total.prev} next={total.next} newLabel={t('newEntry')} className={cn('pr-1', total.diff > 0 && 'text-info')} />,
    },
    {
      key: 'note', width: 80, field: true, header: t('cols.note.label'), sub: t('cols.note.sub'), tooltip: t('cols.note.full'),
      cell: (r) =>
        can('note') ? (
          <textarea rows={1} value={r.note} onChange={(e) => edit(r, { note: e.target.value })} placeholder={t('placeholder')} aria-label={t('fields.note', { name: r.name })} className={textareaClass} />
        ) : (
          readText(r.note)
        ),
    },
    {
      // Chỉ BLĐ nhập; CQ và Admin chỉ xem ("Chờ BLĐ" khi chưa có).
      key: 'board', width: 100, field: true, divider: 'start', tone: can('boardDecision') ? 'plain' : 'locked', header: t('cols.board.label'), sub: t('cols.board.sub'), tooltip: t('cols.board.full'),
      cell: (r) =>
        can('boardDecision') ? (
          <textarea rows={1} value={r.boardDecision ?? ''} onChange={(e) => edit(r, { boardDecision: e.target.value || null })} placeholder={t('placeholder')} aria-label={t('fields.decision', { name: r.name })} className={textareaClass} />
        ) : (
          <span title={t('boardOnly')} className={cn('px-0.5', r.boardDecision ? 'font-medium text-foreground' : 'text-muted-foreground')}>
            {r.boardDecision || t('boardPending')}
          </span>
        ),
    },
  ];

  const groups: DataGridGroup[] = [
    { key: 'hr', span: 2, tone: 'read', label: t('groups.hr.label'), tooltip: t('groups.hr.full') },
    { key: 'hr-rest', span: 5, tone: 'read', divider: true },
    { key: 'cqFill', span: 1, tone: 'read', marker: 'brand', divider: true, label: t('groups.cqFill.label'), tooltip: t('groups.cqFill.full') },
    { key: 'preset', span: 1, tone: 'read', marker: 'brand', divider: true, label: t('groups.preset.label'), tooltip: t('groups.preset.full') },
    { key: 'system', span: 1, tone: 'read', divider: true, label: t('groups.system.label'), tooltip: t('groups.system.full') },
    { key: 'cqGive', span: 1, tone: 'read', marker: 'brand', divider: true, label: t('groups.cqGive.label'), tooltip: t('groups.cqGive.full') },
    { key: 'auto', span: 1, tone: 'read', divider: true, label: t('groups.auto.label'), tooltip: t('groups.auto.full') },
    { key: 'rest', span: 2, tone: 'plain' },
  ];

  const count = rows.length;
  const progress =
    user.role === 'BLD'
      ? { label: t('badge.decided'), value: t('badge.filledValue', { filled: rows.filter((r) => r.boardDecision).length, total: count }) }
      : { label: t('badge.filled'), value: t('badge.filledValue', { filled: rows.filter((r) => r.duties.trim()).length, total: count }) };
  const badges: PageBannerBadge[] = !data
    ? [{ label: t('badge.filled'), value: '', loading: true }]
    : [
        status === 'draft'
          ? { label: t('badge.open'), value: t('badge.deadline', { date: formatSlashDate(data.period.deadline) }), dot: true }
          : status === 'submitted'
            ? { label: t('badge.submitted'), value: t('badge.awaiting'), dot: true }
            : { label: t('badge.approved'), value: '' },
        progress,
      ];

  const noScope = !!data && data.units.length === 0;
  const busy = save.isPending || Object.values(actions).some((a) => a.isPending);
  const units = data?.units.join(', ') ?? '';

  return (
    <PageShell className="gap-3 lg:px-5 lg:pt-4 lg:pb-5">
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
                  <div key={u ?? 'all'} role="option" aria-selected={sel} tabIndex={-1} onClick={pick} onKeyDown={(e) => e.key === 'Enter' && pick()} className={cn(optionClass, sel && 'bg-accent text-accent-foreground')}>
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
            ref={searchRef}
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
          {editor ? (
            <>
              {data?.savedAt && !dirty && <span className="text-[13px] text-muted-foreground">{t('savedAt', { time: formatTime(data.savedAt) })}</span>}
              <Button variant="outline" size="lg" className="px-3.5" onClick={saveDraft} disabled={!dirty || busy}>
                {save.isPending ? t('saving') : t('saveDraft')}
              </Button>
              {status === 'draft' ? (
                <Button size="lg" className="px-3.5" onClick={() => setConfirm('submit')} disabled={noScope || issues.size > 0 || busy}>
                  {t('submit')}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="lg" className="px-3.5" onClick={() => setConfirm('return')} disabled={busy}>
                    {t('return')}
                  </Button>
                  <Button size="lg" className="px-3.5" onClick={() => setConfirm('approve')} disabled={busy}>
                    {t('approve')}
                  </Button>
                </>
              )}
            </>
          ) : (
            data && <Pill tone={status === 'approved' ? 'success' : status === 'submitted' ? 'warning' : 'neutral'}>{t(`pill.${status}`)}</Pill>
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
                striped
                rowAccent={resultAccentClass}
                rowClassName={(r) => (isMutedRow(r) ? 'bg-grid-row-muted' : undefined)}
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
                    <span className="font-normal text-muted-foreground">· {t('employeeCount', { count: total.count })}</span>
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
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm ? t(`confirm.${confirm}.title`, { units }) : ''}
        description={confirm ? t(`confirm.${confirm}.description`) : undefined}
        confirmLabel={confirm ? t(`confirm.${confirm}.confirm`) : undefined}
        cancelLabel={t('confirm.cancel')}
        tone={confirm === 'return' ? 'danger' : 'default'}
        onConfirm={runConfirm}
      />
    </PageShell>
  );
};

export default Proposals;

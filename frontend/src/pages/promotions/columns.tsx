import type { TFunction } from 'i18next';
import { Lock, TriangleAlert } from 'lucide-react';
import { AbcChip } from '@/components/ui/abc-chip';
import type { DataGridColumn, DataGridGroup, DataGridTone } from '@/components/ui/data-grid';
import { Pill } from '@/components/ui/metric-card';
import { Tooltip } from '@/components/ui/tooltip';
import {
  ABC_LOCK,
  BOARD_TYPES,
  canEdit,
  canView,
  COLUMN_GROUPS,
  COLUMN_KEYS,
  hasPromotion,
  hasRaise,
  levelInfo,
  POSITION_CODES,
  PROPOSAL_TYPES,
  SALARY_SUBGROUPS,
  type BoardType,
  type ColumnGroup,
  type GroupStatus,
  type PromotionColumn,
  type PromotionField,
  type ProposalType,
} from '@/config/promotion-proposal';
import { parseAbcRatings, type AbcRating } from '@/lib/abc';
import { formatAccounting, formatSlashDate } from '@/lib/format';
import type { AppRole } from '@/lib/session';
import { cn } from '@/lib/utils';
import type { PromotionEdit, PromotionRow, SalaryInfo } from '@/services/promotionProposal';
import { AutoTextarea, Dash, fieldClass, HistoryCell, LockedCell, LongTextCell, Money, MoneyInput, Position, SelectCell, TwoLine } from './cells';
import {
  boardTypeChange,
  boardTypeOf,
  diffOldNew,
  diffProposedActual,
  grantedRaise,
  proposalLock,
  proposedRaise,
  seniorityYears,
  titleOptions,
  totalCurrent,
  totalNew,
  typeChange,
  type RowIssue,
} from './logic';

type T = TFunction<'promotion'>;

/** Màu nhóm cột: tông nền hàng nhóm/tiêu đề và chấm trước nhãn. */
const GROUP_STYLE: Record<ColumnGroup, { tone: DataGridTone; marker: DataGridGroup['marker'] }> = {
  hr: { tone: 'read', marker: 'muted' },
  cq: { tone: 'warn', marker: 'warning' },
  kpi: { tone: 'info', marker: 'info' },
  salary: { tone: 'salary', marker: 'warning' },
  hrOpinion: { tone: 'success', marker: 'success' },
  board: { tone: 'info', marker: 'info' },
};

export type ColumnContext = {
  t: T;
  role: AppRole;
  status: GroupStatus;
  issues: Map<string, RowIssue>;
  edit: (row: PromotionRow, patch: PromotionEdit) => void;
  collapsed: ReadonlySet<ColumnGroup>;
  toggle: (group: ColumnGroup) => void;
};

/** Chip bình bầu: C ≥ ngưỡng khóa (4C) đỏ, 2–3C cam, còn lại trung tính — theo mức, không theo màu dòng. */
const abcTone = (r: AbcRating) => (r.grade !== 'C' ? 'neutral' : r.count >= ABC_LOCK.cCount ? 'danger' : r.count >= 2 ? 'warning' : 'neutral');

export function buildColumns({ t, role, status, issues, edit, collapsed, toggle }: ColumnContext) {
  const can = (field: PromotionField) => canEdit(role, status, field);
  // Tiêu đề và ghi chú nguyên văn theo file (tiếng Việt + tiếng Trung), trong namespace `promotion`; tiêu đề dài thì xuống dòng.
  const col = (key: PromotionColumn, width: number, rest: Partial<DataGridColumn<PromotionRow>> & Pick<DataGridColumn<PromotionRow>, 'cell'>): DataGridColumn<PromotionRow> => {
    const note = t(`cols.${key}.note` as 'cols.raise.note', { defaultValue: '' });
    return { key, width, header: t(`cols.${key}.label`), sub: t(`cols.${key}.sub`), note: note || undefined, ...rest };
  };
  const typeLabel = (k: ProposalType | BoardType) => t(`types.${k}.label`);
  const typeHint = (k: ProposalType | BoardType) => t(`types.${k}.hint`);
  const titleOpts = (r: PromotionRow) =>
    titleOptions(r).map((code) => {
      const info = levelInfo(code);
      // Mã + tên hệ thống trên 2 dòng (không cắt chữ); bậc theo sheet Promotion levels ở dòng gợi ý.
      return { key: code, label: code, sub: POSITION_CODES[code]?.cn, hint: info ? t('titleLevel', { level: info.level, name: `${info.en} ${info.cn}` }) : undefined };
    });
  const salaryOf = (r: PromotionRow) => r.salary as SalaryInfo;
  const newMoney = (field: 'newContract' | 'newRating' | 'newAttendance' | 'newLiving'): DataGridColumn<PromotionRow>['cell'] => (r) =>
    can(field) ? (
      <MoneyInput value={salaryOf(r)[field]} onChange={(v) => edit(r, { [field]: v })} ariaLabel={t(`fields.${field}`, { name: r.name })} />
    ) : (
      <Money value={salaryOf(r)[field]} />
    );

  // Định nghĩa từng cột theo key; thứ tự và nhóm lấy từ COLUMN_KEYS trong file cấu hình quyền.
  const defs: Record<PromotionColumn, DataGridColumn<PromotionRow>> = {
    priority: col('priority', 76, { pinned: true, cellClassName: 'font-semibold tabular-nums', cell: (r) => r.priority }),
    unit: col('unit', 72, { pinned: true, cellClassName: 'text-text-secondary', cell: (r) => r.unit }),
    name: col('name', 140, {
      pinned: true,
      cell: (r) => (
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="text-[12.5px] font-semibold">{r.name}</span>
          {r.expat && <Pill tone="brand" className="h-4.5 px-1.5 text-[10px]">{t('expat')}</Pill>}
        </span>
      ),
    }),
    cardNo: col('cardNo', 72, { cellClassName: 'tabular-nums', cell: (r) => r.cardNo }),
    joinDate: col('joinDate', 92, { cellClassName: 'whitespace-nowrap tabular-nums', cell: (r) => formatSlashDate(r.joinDate) }),
    seniority: col('seniority', 92, { align: 'end', cellClassName: 'pr-2.5 tabular-nums', cell: (r) => formatAccounting(seniorityYears(r.joinDate), 1) }),
    contract: col('contract', 100, { cell: (r) => (r.contract ? <TwoLine main={t(`contract.${r.contract}.label`)} sub={t(`contract.${r.contract}.sub`)} /> : <Dash />) }),
    position: col('position', 92, { cell: (r) => <TwoLine main={<span className="font-medium">{r.position}</span>} sub={r.positionName} /> }),
    promotionCount: col('promotionCount', 136, {
      cell: (r) =>
        r.promotionHistory.length ? (
          <HistoryCell title={t('history.promotionTitle')} entries={r.promotionHistory.map((date) => ({ date }))} show="date" />
        ) : (
          <span className="px-0.5 text-placeholder tabular-nums">0</span>
        ),
    }),
    abc: col('abc', 120, {
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-1">
          {parseAbcRatings(r.abc).map((a, i) => (
            <AbcChip key={i} count={a.count} grade={a.grade} tone={abcTone(a)} />
          ))}
        </span>
      ),
    }),
    discipline: col('discipline', 100, { cell: (r) => (r.discipline ? <span className="text-danger-text">{r.discipline}</span> : <Dash />) }),
    status: col('status', 120, { cell: (r) => (r.status === 'active' ? <span className="text-text-secondary">{t('empStatus.active')}</span> : <Pill tone="neutral">{t(`empStatus.${r.status}`)}</Pill>) }),
    leave: col('leave', 180, {
      cellClassName: 'whitespace-nowrap tabular-nums',
      cell: (r) => (r.leave ? t('leaveRange', { from: formatSlashDate(r.leave.from), to: formatSlashDate(r.leave.to) }) : <Dash />),
    }),

    type: col('type', 180, {
      field: true,
      cell: (r) => {
        const lock = proposalLock(r);
        if (!can('type')) return <TwoLine main={<span className="font-medium">{typeLabel(r.type)}</span>} sub={r.type === 'none' ? undefined : typeHint(r.type)} />;
        if (lock === 'locked') return <LockedCell reason={t('issue.locked')}>{t('lockedShort')}</LockedCell>;
        return (
          <span className="flex w-full items-center gap-1">
            {lock === 'reasonRequired' && r.type !== 'none' && (
              <Tooltip content={t('issue.reasonRequired')} side="top" sideOffset={6}>
                <span tabIndex={0} role="img" aria-label={t('issue.reasonRequired')} className="flex flex-none cursor-help rounded-sm text-warning-text outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <TriangleAlert aria-hidden="true" className="size-[15px]" strokeWidth={2.2} />
                </span>
              </Tooltip>
            )}
            <SelectCell
              value={r.type}
              options={PROPOSAL_TYPES.map((k) => ({ key: k, label: typeLabel(k), hint: typeHint(k) }))}
              onPick={(k) => edit(r, typeChange(r, k))}
              ariaLabel={t('fields.type', { name: r.name })}
              placeholder={t('choose')}
            />
          </span>
        );
      },
    }),
    newTitle: col('newTitle', 176, {
      field: true,
      cell: (r) => {
        if (!hasPromotion(r.type)) return <Dash />;
        if (!can('newTitle')) return r.newTitle ? <Position code={r.newTitle} /> : <Dash />;
        const options = titleOpts(r);
        if (!options.length) return <span className="text-[11px] text-muted-foreground">{t('noNextTitle')}</span>;
        return <SelectCell value={r.newTitle} options={options} onPick={(k) => edit(r, { newTitle: k })} ariaLabel={t('fields.newTitle', { name: r.name })} placeholder={t('choose')} footer={t('titleHint')} />;
      },
    }),
    reason: col('reason', 220, {
      cell: (r) =>
        r.type === 'none' ? (
          <Dash />
        ) : (
          <LongTextCell title={t('fields.reason')} who={r.name} value={r.reason} editable={can('reason')} onChange={(v) => edit(r, { reason: v })} invalid={issues.get(r.psk) === 'reasonRequired'} />
        ),
    }),
    jobChange: col('jobChange', 188, {
      cell: (r) =>
        hasPromotion(r.type) ? <LongTextCell title={t('fields.jobChange')} who={r.name} value={r.jobChange} editable={can('jobChange')} onChange={(v) => edit(r, { jobChange: v })} /> : <Dash />,
    }),
    raise: col('raise', 236, {
      field: true,
      align: 'end',
      cell: (r) => {
        if (r.type === 'none') return <Dash />;
        if (!can('raise'))
          return r.raiseMode === 'scale' ? (
            <TwoLine end main={t('raiseMode.scale.label')} sub={t('raiseMode.scale.hint')} />
          ) : (
            <Money value={r.raiseAmount} strong />
          );
        return (
          <span className="flex w-full gap-1">
            <span className="min-w-0 flex-1">
              <SelectCell
                value={r.raiseMode}
                options={(['scale', 'amount'] as const).map((k) => ({ key: k, label: t(`raiseMode.${k}.label`), hint: t(`raiseMode.${k}.hint`), short: t(`raiseMode.short.${k}`) }))}
                onPick={(k) => edit(r, { raiseMode: k })}
                ariaLabel={t('fields.raiseMode', { name: r.name })}
                placeholder={t('choose')}
                minWidth={220}
              />
            </span>
            {r.raiseMode === 'amount' && (
              <MoneyInput className="w-24 flex-none" value={r.raiseAmount} onChange={(v) => edit(r, { raiseAmount: v })} ariaLabel={t('fields.raiseAmount', { name: r.name })} />
            )}
          </span>
        );
      },
    }),

    kpi: col('kpi', 168, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={r.kpi} /> }),

    salaryAdjustments: col('salaryAdjustments', 140, {
      cell: (r) =>
        salaryOf(r).history.length ? (
          <HistoryCell title={t('history.salaryTitle')} entries={salaryOf(r).history} show="date" amountLabel={t('history.amount')} />
        ) : (
          <Dash />
        ),
    }),
    salaryLevels: col('salaryLevels', 136, {
      align: 'end',
      cell: (r) =>
        salaryOf(r).history.length ? (
          <HistoryCell title={t('history.salaryTitle')} entries={salaryOf(r).history} show="amount" amountLabel={t('history.amount')} />
        ) : (
          <TwoLine end main={<Dash />} sub={t('history.contractOnly')} />
        ),
    }),
    currentTitle: col('currentTitle', 92, { cell: (r) => <Position code={r.position} /> }),
    contractSalary: col('contractSalary', 120, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={salaryOf(r).contract} /> }),
    currentRating: col('currentRating', 100, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={salaryOf(r).rating} /> }),
    currentAttendance: col('currentAttendance', 100, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={salaryOf(r).attendance} /> }),
    currentLiving: col('currentLiving', 100, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={salaryOf(r).living} /> }),
    totalCurrent: col('totalCurrent', 120, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={totalCurrent(salaryOf(r))} strong /> }),
    newPosition: col('newPosition', 96, {
      cell: (r) => {
        const type = boardTypeOf(r);
        const next = type === 'reject' ? null : hasPromotion(type) ? (r.board?.title ?? r.newTitle) : null;
        return <Position code={next ?? r.position} highlight={!!next && next !== r.position} />;
      },
    }),
    newContract: col('newContract', 128, { align: 'end', field: true, cell: newMoney('newContract') }),
    newRating: col('newRating', 104, { align: 'end', field: true, cell: newMoney('newRating') }),
    newAttendance: col('newAttendance', 104, { align: 'end', field: true, cell: newMoney('newAttendance') }),
    newLiving: col('newLiving', 104, { align: 'end', field: true, cell: newMoney('newLiving') }),
    totalNew: col('totalNew', 124, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={totalNew(salaryOf(r))} strong /> }),
    diffOldNew: col('diffOldNew', 128, { align: 'end', cellClassName: 'pr-2.5', cell: (r) => <Money value={diffOldNew(salaryOf(r))} strong /> }),

    hrOpinion: col('hrOpinion', 224, {
      cell: (r) => <LongTextCell title={t('fields.hrOpinion')} who={r.name} value={r.hrOpinion ?? ''} editable={can('hrOpinion')} onChange={(v) => edit(r, { hrOpinion: v })} />,
    }),

    boardType: col('boardType', 188, {
      field: true,
      cell: (r) => {
        const type = boardTypeOf(r);
        // "link theo đề xuất của CQ": dòng CQ không đề xuất thì BLĐ không có gì để quyết định.
        if (!type) return <Dash />;
        if (!can('boardType')) return <TwoLine className={cn(type === 'reject' && 'text-danger-text')} main={<span className="font-medium">{typeLabel(type)}</span>} sub={typeHint(type)} />;
        return (
          <SelectCell
            value={type}
            options={BOARD_TYPES.map((k) => ({ key: k, label: typeLabel(k), hint: typeHint(k) }))}
            onPick={(k) => edit(r, boardTypeChange(r, k))}
            ariaLabel={t('fields.boardType', { name: r.name })}
            placeholder={t('choose')}
            danger={type === 'reject'}
          />
        );
      },
    }),
    boardTitle: col('boardTitle', 176, {
      field: true,
      cell: (r) => {
        const type = boardTypeOf(r);
        if (type === 'reject') return <LockedCell danger reason={t('boardRejected')}>—</LockedCell>;
        if (!hasPromotion(type)) return <Dash />;
        const value = r.board?.title ?? r.newTitle;
        if (!can('boardTitle')) return value ? <Position code={value} /> : <Dash />;
        const options = titleOpts(r);
        if (!options.length) return <span className="text-[11px] text-muted-foreground">{t('noNextTitle')}</span>;
        return <SelectCell value={value} options={options} onPick={(k) => edit(r, { boardTitle: k })} ariaLabel={t('fields.boardTitle', { name: r.name })} placeholder={t('choose')} footer={t('titleHint')} />;
      },
    }),
    boardAmount: col('boardAmount', 136, {
      align: 'end',
      field: true,
      cell: (r) => {
        const type = boardTypeOf(r);
        const rejected = type === 'reject';
        if (!type) return <Dash />;
        if (!can('boardAmount')) return <Money value={grantedRaise(r)} strong />;
        return (
          <MoneyInput
            value={rejected ? 0 : (r.board?.amount ?? grantedRaise(r))}
            onChange={(v) => edit(r, { boardAmount: v })}
            ariaLabel={t('fields.boardAmount', { name: r.name })}
            disabled={rejected || !hasRaise(type)}
            danger={rejected}
          />
        );
      },
    }),
    boardDiff: col('boardDiff', 148, {
      align: 'end',
      cellClassName: 'pr-2.5',
      cell: (r) => (boardTypeOf(r) ? <Money value={diffProposedActual(grantedRaise(r), proposedRaise(r))} strong /> : <Dash />),
    }),
    boardDecision: col('boardDecision', 228, {
      field: true,
      cell: (r) => {
        const type = boardTypeOf(r);
        if (!type) return <Dash />;
        const rejected = type === 'reject';
        const missing = issues.get(r.psk) === 'rejectReason';
        return (
          <span className={cn('flex w-full flex-col gap-1', rejected && 'text-danger-text')}>
            {/* Từ chối: bỏ dòng gợi ý tiếng Anh để nhường chỗ cho lý do. */}
            <TwoLine main={<span className="font-semibold">{t(`decision.${type}.label`)}</span>} sub={rejected ? undefined : t(`decision.${type}.hint`)} />
            {rejected &&
              (can('boardReason') ? (
                <AutoTextarea
                  value={r.board?.reason ?? ''}
                  onChange={(e) => edit(r, { boardReason: e.target.value })}
                  placeholder={t('rejectReasonPlaceholder')}
                  aria-label={t('fields.boardReason', { name: r.name })}
                  aria-invalid={missing || undefined}
                  className={cn(fieldClass, 'px-2 py-1.5 leading-[1.35] text-danger-text placeholder:text-danger-text/70', missing ? 'border-danger-text' : 'border-danger-border')}
                />
              ) : (
                <span className="whitespace-pre-line">{r.board?.reason || t('rejectReasonPlaceholder')}</span>
              ))}
          </span>
        );
      },
    }),
  };

  // Chỉ các nhóm vai trò được xem — nhóm khác hoàn toàn không render (dữ liệu cũng không có).
  const shown = COLUMN_GROUPS.filter((g) => canView(role, g));
  const columns: DataGridColumn<PromotionRow>[] = [];
  const groups: DataGridGroup[] = [];
  shown.forEach((g, gi) => {
    const { tone, marker } = GROUP_STYLE[g];
    const cols = COLUMN_KEYS[g].map((k, ci) => ({ ...defs[k], tone, divider: gi > 0 && ci === 0 ? ('start' as const) : undefined }));
    columns.push(...cols);
    const name = t(`groups.${g}.label`);
    const sub = t(`groups.${g}.sub`);
    const isCollapsed = collapsed.has(g);
    groups.push({
      key: g,
      span: cols.length,
      tone,
      marker,
      collapse: {
        collapsed: isCollapsed,
        onToggle: () => toggle(g),
        label: isCollapsed ? t('expand', { name }) : t('collapse', { name }),
        // Cột hẹp khi thu gọn: nhãn dọc tên nhóm + số cột ẩn.
        stub: (
          <>
            <span className="font-semibold text-foreground">{name}</span>
            <span className="flex-none text-muted-foreground tabular-nums">{t('collapsedCount', { count: cols.length })}</span>
          </>
        ),
      },
      subgroups:
        g === 'salary'
          ? SALARY_SUBGROUPS.map((s) => ({
              key: s.key,
              from: s.from,
              span: s.span,
              label: (
                <>
                  {t(`subgroups.${s.key}.label`)} <span className="font-normal text-muted-foreground">{t(`subgroups.${s.key}.sub`)}</span>
                </>
              ),
            }))
          : undefined,
      label: (
        <>
          <span className="flex-none text-[11px] font-semibold">{name}</span>
          {/* Hàng nhóm một dòng (28px): dòng tiếng Trung bị cắt thì rê chuột đọc đủ. */}
          <span title={sub} className="min-w-0 truncate text-[10.5px] font-normal text-muted-foreground">
            {sub}
          </span>
          {/* Quyền xem lương: icon khóa, câu nguyên văn file (Việt + Trung) trong tooltip. */}
          {g === 'salary' && (
            <Tooltip
              content={
                <span className="flex max-w-80 flex-col gap-1 text-left whitespace-normal">
                  <span>{t('salaryLock.text')}</span>
                  <span className="opacity-80">{t('salaryLock.sub')}</span>
                </span>
              }
              side="top"
              sideOffset={6}
            >
              <span
                tabIndex={0}
                role="img"
                aria-label={`${t('salaryLock.label')}: ${t('salaryLock.text')}`}
                className="inline-flex size-4 flex-none cursor-help items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Lock aria-hidden="true" className="size-3" />
              </span>
            </Tooltip>
          )}
        </>
      ),
    });
  });
  return { columns, groups };
}

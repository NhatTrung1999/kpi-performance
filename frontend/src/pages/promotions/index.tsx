import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Lock, Search, TrendingUp, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { ConfirmDialog } from '@/components/ui/dialog';
import { FormAlert } from '@/components/ui/form-alert';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/metric-card';
import { PageBanner, type PageBannerBadge } from '@/components/ui/page-banner';
import { Popover, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { PageShell, TableCard, TableCardBody } from '@/components/ui/table-page';
import { toast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import { HEADCOUNT_RULES, isEditor, type ColumnGroup, type GroupStatus } from '@/config/promotion-proposal';
import { formatPercent, formatSlashDate, formatTime } from '@/lib/format';
import { useCurrentUser } from '@/lib/session';
import { useUnsavedChanges } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import { applyEdit, type PromotionEdit, type PromotionRow } from '@/services/promotionProposal';
import { fieldClass } from './cells';
import { buildColumns } from './columns';
import { boardIssue, boardTypeOf, headcountUsage, managerIssue, type RowIssue } from './logic';
import { OrgChartCard } from './org-charts';
import { useApprovePromotion, usePromotionProposal, useReturnPromotion, useSavePromotionDraft, useSubmitPromotion } from './use-promotion-proposal';

const optionClass =
  'flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50';
const triggerClass =
  'flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 data-popup-open:border-brand';

const STATUS_TONE: Record<GroupStatus, 'neutral' | 'warning' | 'success' | 'danger'> = { draft: 'neutral', submitted: 'warning', approved: 'success', returned: 'danger' };

type ConfirmMode = 'submit' | 'approve' | 'return';

const Promotions = () => {
  const { t } = useTranslation(['promotion', 'common']);
  const user = useCurrentUser();
  const [groupId, setGroupId] = useState<string | null>(null);
  const { data, isPending, isError, refetch } = usePromotionProposal(groupId);
  const save = useSavePromotionDraft();
  const actions = { submit: useSubmitPromotion(), approve: useApprovePromotion(), return: useReturnPromotion() };

  /** Bản nháp cục bộ theo nhóm: chỉ các ô đã sửa, gửi lên khi lưu / gửi / duyệt / trả lại. */
  const [drafts, setDrafts] = useState<Record<string, Record<string, PromotionEdit>>>({});
  const [unit, setUnit] = useState<string | null>(null);
  const [menu, setMenu] = useState<'group' | 'unit' | null>(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<ColumnGroup>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmMode | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const group = data?.group ?? null;
  const status = group?.status ?? 'draft';
  const edits = useMemo(() => (group ? (drafts[group.id] ?? {}) : {}), [drafts, group]);
  const editor = !!group && isEditor(user.role, status);
  const isManager = user.role === 'CQ';
  const dirty = Object.values(drafts).some((d) => Object.keys(d).length > 0);
  useUnsavedChanges(dirty && editor);

  const rows = useMemo(() => (data?.rows ?? []).map((r) => applyEdit(r, edits[r.psk])), [data, edits]);
  // Lỗi chặn gửi/duyệt: CQ kiểm tra quy tắc 4C, BLĐ kiểm tra lý do từ chối.
  const issues = useMemo(() => {
    const m = new Map<string, RowIssue>();
    if (!editor) return m;
    for (const r of rows) {
      const issue = user.role === 'CQ' ? managerIssue(r) : user.role === 'BLD' ? boardIssue(r) : null;
      if (issue) m.set(r.psk, issue);
    }
    return m;
  }, [rows, editor, user.role]);

  const edit = (row: PromotionRow, patch: PromotionEdit) =>
    group && setDrafts((d) => ({ ...d, [group.id]: { ...d[group.id], [row.psk]: { ...d[group.id]?.[row.psk], ...patch } } }));

  /** Bỏ khỏi bản nháp các dòng vừa gửi đi — giữ lại những gì người dùng sửa tiếp trong lúc chờ. */
  const clearSent = (id: string, sent: Record<string, PromotionEdit>) =>
    setDrafts((d) => ({ ...d, [id]: Object.fromEntries(Object.entries(d[id] ?? {}).filter(([k, v]) => sent[k] !== v)) }));

  const toggle = (g: ColumnGroup) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (!next.delete(g)) next.add(g);
      return next;
    });

  const q = query.trim().toLowerCase();
  const visible = rows.filter((r) => (!unit || r.unit === unit) && (!q || r.name.toLowerCase().includes(q) || r.cardNo.toLowerCase().includes(q)));
  const { columns, groups } = buildColumns({ t, role: user.role, status, issues, edit, collapsed, toggle });
  const meters = group ? headcountUsage(rows, group, user.role === 'CQ' ? 'manager' : 'board') : [];
  const orgReady = !!group?.orgCharts.before && !!group?.orgCharts.after;
  const busy = save.isPending || Object.values(actions).some((a) => a.isPending);

  const saveDraft = () => {
    if (!group) return;
    const id = group.id;
    setGroupId(id); // giữ nguyên nhóm đang xem sau khi tải lại
    save.mutate({ groupId: id, edits }, { onSuccess: (_, v) => (clearSent(id, v.edits), toast.success(t('done.save'))), onError: () => toast.error(t('saveError')) });
  };

  const runConfirm = () => {
    if (!confirm || !group) return;
    const mode = confirm;
    const id = group.id;
    setGroupId(id);
    const done = { onSuccess: () => (clearSent(id, edits), toast.success(t(`done.${mode}`))), onError: () => toast.error(t('actionError')) };
    setConfirm(null);
    if (mode === 'return') {
      actions.return.mutate({ groupId: id, edits, reason: returnReason }, done);
      setReturnReason('');
    } else actions[mode].mutate({ groupId: id, edits }, done);
  };

  const proposed = rows.filter((r) => r.type !== 'none').length;
  const badges: PageBannerBadge[] = !group
    ? [{ label: t('status.draft'), value: '', loading: !data }]
    : [
        { label: t(`status.${status}`), value: status === 'draft' && isManager ? t('banner.deadline', { date: formatSlashDate(data!.period.deadline) }) : group.name, dot: status !== 'approved' },
        { label: t('banner.proposed'), value: t('banner.proposedValue', { count: proposed, total: group.headcount }) },
      ];
  const month = data ? data.period.month.split('-').reverse().join('/') : '';
  const approvedGroups = data?.groups.filter((g) => g.status === 'approved').length ?? 0;
  const showGroupPicker = !!data && (!isManager || data.groups.length > 1);
  const issueText = user.role === 'BLD' ? t('rejectIssues', { count: issues.size }) : t('issues', { count: issues.size });

  const submitButton = (
    <Button size="lg" className="px-3.5" onClick={() => setConfirm('submit')} disabled={!orgReady || issues.size > 0 || busy}>
      {!orgReady && <Lock aria-hidden="true" />}
      {t('submit')}
    </Button>
  );

  return (
    <PageShell className="gap-3 lg:flex-none lg:px-5 lg:pt-4 lg:pb-5">
      <PageBanner
        icon={<TrendingUp />}
        title={data ? t('banner.title', { month }) : ' '}
        subtitle={data && t('banner.subtitle', { date: formatSlashDate(data.period.effectiveDate) })}
        badges={badges}
        loadingLabel={t('common:loading')}
      />

      <div className="flex flex-none flex-wrap items-center gap-2">
        {showGroupPicker && (
          <div className="flex items-center gap-2.5">
            <span className="flex flex-col gap-px">
              <span className="text-xs font-medium">{t('groupPicker.label')}</span>
              <span className="text-[11px] text-muted-foreground">{t('groupPicker.sub')}</span>
            </span>
            <Popover open={menu === 'group'} onOpenChange={(o) => setMenu(o ? 'group' : null)}>
              <PopoverTrigger aria-label={t('groupPicker.label')} className={cn(triggerClass, 'w-60 font-semibold')}>
                <span className="min-w-0 truncate">{group?.name}</span>
                {group && <Pill tone={STATUS_TONE[status]} className="ml-auto">{t(`status.${status}`)}</Pill>}
                <ChevronDown aria-hidden="true" className={cn('size-3.5 flex-none opacity-60', !group && 'ml-auto')} />
              </PopoverTrigger>
              <PopoverContent className="min-w-72 p-1" onKeyDown={onListKeyDown}>
                <div role="listbox" aria-label={t('groupPicker.label')} className="flex flex-col gap-0.5 overflow-y-auto">
                  {data.groups.map((g) => {
                    const sel = g.id === group?.id;
                    const pick = () => {
                      setGroupId(g.id);
                      setUnit(null);
                      setMenu(null);
                    };
                    return (
                      <div key={g.id} role="option" aria-selected={sel} tabIndex={-1} onClick={pick} onKeyDown={(e) => e.key === 'Enter' && pick()} className={cn(optionClass, sel && 'bg-accent text-accent-foreground')}>
                        <span className="flex flex-col gap-px">
                          <span className="font-medium">{g.name}</span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{t('groupPicker.option', { headcount: g.headcount, proposed: g.proposed })}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Pill tone={STATUS_TONE[g.status]}>{t(`status.${g.status}`)}</Pill>
                          <Check aria-hidden="true" className={cn('size-3.5 flex-none text-brand-text', !sel && 'invisible')} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            {!isManager && <span className="text-xs text-text-secondary tabular-nums">{t('groupPicker.approvedCount', { approved: approvedGroups, total: data.groups.length })}</span>}
          </div>
        )}
        {isManager && (
          <Popover open={menu === 'unit'} onOpenChange={(o) => setMenu(o ? 'unit' : null)}>
            <PopoverTrigger aria-label={t('unitFilter')} disabled={!data?.units.length} className={cn(triggerClass, 'w-43')}>
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
                    setMenu(null);
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
        )}
        <div className="w-full sm:w-55">
          <Input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')} startIcon={<Search />} className="h-9 pl-9 text-[13px]" />
        </div>
        {/* Hạn mức theo nhóm, cập nhật mỗi lần chọn; vượt thì cảnh báo màu cam, không chặn gửi (HEADCOUNT_RULES.mode). */}
        {meters.map((m) => {
          const limit = formatPercent(m.limit);
          return (
            <div
              key={m.key}
              className={cn('flex h-9 flex-none items-center gap-1.5 rounded-lg border px-2.5 text-xs whitespace-nowrap', m.over ? 'border-warning-text bg-warning-soft' : 'border-border bg-card')}
            >
              {m.over && (
                <Tooltip content={t('meters.over', { limit })} side="top" sideOffset={6}>
                  <span tabIndex={0} role="img" aria-label={t('meters.over', { limit })} className="flex cursor-help rounded-sm text-warning-text outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <TriangleAlert aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
                  </span>
                </Tooltip>
              )}
              <span className="font-medium">{t(`meters.${m.key}`)}</span>
              <span className={cn('font-semibold tabular-nums', m.over ? 'text-warning-text' : 'text-foreground')}>
                {t('meters.value', { count: m.count, base: m.base, percent: formatPercent(m.percent, 1) })}
              </span>
              <span className="text-muted-foreground tabular-nums">{t('meters.limit', { limit })}</span>
            </div>
          );
        })}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {issues.size > 0 && <span className="text-[13px] font-medium text-danger-text">{issueText}</span>}
          {editor ? (
            <>
              {group?.savedAt && !Object.keys(edits).length && <span className="text-[13px] text-muted-foreground">{t('savedAt', { time: formatTime(group.savedAt) })}</span>}
              <Button variant="outline" size="lg" className="px-3.5" onClick={saveDraft} disabled={!Object.keys(edits).length || busy}>
                {save.isPending ? t('saving') : isManager ? t('saveDraft') : t('save')}
              </Button>
              {isManager &&
                (orgReady ? (
                  submitButton
                ) : (
                  <Tooltip content={t('submitBlocked')} side="top" sideOffset={6}>
                    <span tabIndex={0} className="inline-flex cursor-not-allowed rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      {submitButton}
                    </span>
                  </Tooltip>
                ))}
              {user.role === 'BLD' && (
                <>
                  <Button variant="outline" size="lg" className="px-3.5" onClick={() => setConfirm('return')} disabled={busy}>
                    {t('return')}
                  </Button>
                  <Button size="lg" className="px-3.5" onClick={() => setConfirm('approve')} disabled={issues.size > 0 || busy}>
                    {t('approve')}
                  </Button>
                </>
              )}
            </>
          ) : (
            group && <Pill tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Pill>
          )}
        </div>
      </div>

      {isManager && status === 'returned' && group?.returnReason && (
        <FormAlert tone="warning" className="flex-none">
          {t('returnedAlert', { reason: group.returnReason })}
        </FormAlert>
      )}

      {isError ? (
        <FormAlert tone="error" className="flex-none">
          <span className="flex-1">{t('loadError')}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </Button>
        </FormAlert>
      ) : (
        // Bảng cao gần bằng màn hình; các thẻ quy định / sơ đồ tổ chức nằm bên dưới (cuộn trang để xem).
        <TableCard className="lg:h-[max(26rem,calc(100dvh-15rem))] lg:flex-none">
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
                wrapHeaders
                rowAccent={(r) => (boardTypeOf(r) === 'reject' && r.board ? 'bg-danger-text' : r.type !== 'none' ? 'bg-brand' : undefined)}
                rowClassName={(r) => (r.board && boardTypeOf(r) === 'reject' ? 'bg-grid-row-danger text-danger-text' : undefined)}
                empty={
                  !group ? (
                    <span className="flex flex-col gap-1">
                      <strong className="font-semibold text-foreground">{t('noScopeTitle')}</strong>
                      {t('noScopeHint')}
                    </span>
                  ) : (
                    t('noMatch')
                  )
                }
              />
            )}
          </TableCardBody>
        </TableCard>
      )}

      <div className="grid flex-none gap-3 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-xs leading-normal">
          <h2 className="text-[13px] font-semibold">
            {t('rules.title')} <span className="text-[11px] font-normal text-muted-foreground">{t('rules.sub')}</span>
          </h2>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-2">
            <Pill tone="danger">{t('rules.lockedPill')}</Pill>
            <span className="text-pretty text-text-secondary">
              <b className="font-semibold text-foreground">{t('rules.lockedWho')}</b>
              {t('rules.lockedBody')}
            </span>
            <Pill tone="warning">{t('rules.reasonPill')}</Pill>
            <span className="text-pretty text-text-secondary">
              <b className="font-semibold text-foreground">{t('rules.reasonWho')}</b>
              {t('rules.reasonBody')}
            </span>
          </div>
          <p className="m-0 text-text-secondary">
            {t('rules.quota', {
              promotion: formatPercent(HEADCOUNT_RULES.promotion),
              raiseLocal: formatPercent(HEADCOUNT_RULES.raiseLocal),
              raiseExpat: formatPercent(HEADCOUNT_RULES.raiseExpat),
            })}
          </p>
        </section>
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-xs leading-normal">
          <h2 className="text-[13px] font-semibold">
            {t('notes.title')} <span className="text-[11px] font-normal text-muted-foreground">{t('notes.sub')}</span>
          </h2>
          <ol className="m-0 grid list-none gap-1.5 p-0">
            {(['n1', 'n2', 'n3', 'n4'] as const).map((k, i) => (
              <li key={k} className="flex gap-2 text-text-secondary">
                <span className="flex size-4.5 flex-none items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground tabular-nums">{i + 1}</span>
                <span className="text-pretty">{t(`notes.${k}`)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {group && <OrgChartCard group={group} editable={isManager && editor} />}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm && group ? t(`confirm.${confirm}.title`, { group: group.name }) : ''}
        description={confirm ? t(`confirm.${confirm}.description`) : undefined}
        confirmLabel={confirm ? t(`confirm.${confirm}.confirm`) : undefined}
        cancelLabel={t('confirm.cancel')}
        tone={confirm === 'return' ? 'danger' : 'default'}
        confirmDisabled={confirm === 'return' && !returnReason.trim()}
        onConfirm={runConfirm}
      >
        {confirm === 'return' && (
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            <span>
              {t('confirm.return.reasonLabel')} <span className="text-danger-text">*</span>
            </span>
            <textarea
              rows={4}
              autoFocus
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={t('confirm.return.reasonPlaceholder')}
              aria-invalid={!returnReason.trim() || undefined}
              className={cn(fieldClass, 'resize-y px-2.5 py-2 text-[13px] font-normal leading-normal', returnReason.trim() ? 'border-border' : 'border-danger-text')}
            />
            <span className="text-[11px] font-normal text-muted-foreground">{t('confirm.return.reasonHint')}</span>
          </label>
        )}
      </ConfirmDialog>
    </PageShell>
  );
};

export default Promotions;

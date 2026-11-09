import { Building2, Check, ChevronDown, Search } from 'lucide-react';
import { useImperativeHandle, useState, type Ref, type UIEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { unitLabel, unitZh, type Unit } from './data';
import { flattenTree } from './tree';
import { TreeRowView } from './unit-tree';

export type UnitMenuHandle = { open: () => void };

type Props = {
  ref?: Ref<UnitMenuHandle>;
  units: Unit[];
  status: 'pending' | 'error' | 'success';
  onRetry: () => void;
  selected: Unit | undefined;
  onPick: (id: string) => void;
  /** Nhóm (nút lá) đã thuộc phạm vi của ít nhất một chủ quản. */
  covered: Set<string>;
  /** Chỉ hiện nhóm chưa có chủ quản (bật từ huy hiệu trên banner); tự tắt khi đóng menu. */
  orphanOnly: boolean;
  orphanCount: number;
  onOrphanOnlyChange: (on: boolean) => void;
};

/** Menu có thể có hàng trăm đơn vị nhưng chỉ thấy ~10 dòng: vẽ dần từng đợt khi cuộn gần đáy. */
const STEP = 60;

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/**
 * Ô chọn đơn vị dạng cây. Trạng thái mở/đóng, từ khóa và nhánh mở nằm ở đây (không ở trang)
 * để mở menu chỉ vẽ lại menu, không vẽ lại cả bảng nhân viên. Trang mở menu qua `ref.open()`.
 */
export const UnitMenu = ({ ref, units, status, onRetry, selected, onPick, covered, orphanOnly, orphanCount, onOrphanOnlyChange }: Props) => {
  const { t } = useTranslation(['roles', 'common']);
  const [open, setOpen] = useState(false);
  const [mq, setMq] = useState('');
  // null = chưa bấm mở/đóng lần nào → mặc định mở đơn vị đang chọn.
  const [openState, setOpenState] = useState<string[] | null>(null);
  const expanded = openState ?? (selected ? [selected.id] : []);
  const [limit, setLimit] = useState(STEP);

  const changeOpen = (o: boolean) => {
    if (o) {
      setMq('');
      setLimit(STEP);
    }
    setOpen(o);
    if (!o && orphanOnly) onOrphanOnlyChange(false);
  };
  useImperativeHandle(ref, () => ({ open: () => changeOpen(true) }));
  const pick = (id: string) => {
    onPick(id);
    setMq('');
    changeOpen(false);
  };

  // Chỉ dựng danh sách khi menu đang mở.
  const rows = open ? flattenTree(units, mq, expanded, orphanOnly ? (l) => !covered.has(l.id) : undefined) : [];
  // Luôn vẽ tới dòng đang chọn để nó có mặt (và cuộn tới được) khi mở menu.
  const selIndex = selected ? rows.findIndex((r) => r.unit.id === selected.id) : -1;
  const shown = rows.slice(0, Math.max(limit, selIndex + 20));
  const onListScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (rows.length > shown.length && el.scrollTop + el.clientHeight > el.scrollHeight - 200) setLimit(shown.length + STEP);
  };
  const name = selected ? unitLabel(selected.n) : '';
  const zh = selected ? unitZh(selected.n) : '';

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={<Button variant="outline" />}
        className="h-9 w-80 max-w-full justify-start gap-2 text-[13px] font-medium"
      >
        <Building2 className="size-[15px] flex-none text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-left">
          {selected ? (zh ? `${name}-${zh}` : name) : status === 'pending' ? `${t('common:loading')}…` : t('unit')}
        </span>
        <ChevronDown className="size-3.5 flex-none opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-95 min-w-95 p-1.5" onKeyDown={onListKeyDown}>
        <div className="flex-none px-1 pt-1 pb-2">
          <Input value={mq} onChange={(e) => { setMq(e.target.value); setLimit(STEP); }} placeholder={t('searchUnitPlaceholder')} aria-label={t('searchUnit')} startIcon={<Search />} className="h-8.5 pl-9" />
        </div>
        {orphanOnly && (
          <div className="mx-1 mb-1.5 flex flex-none items-center justify-between gap-2 rounded-lg bg-warning-soft px-2.5 py-1.5 text-xs font-medium text-warning-text">
            <span>{t('orphanOnly', { n: formatNumber(orphanCount) })}</span>
            <button type="button" onClick={() => onOrphanOnlyChange(false)} className="text-xs underline">{t('clearFilter')}</button>
          </div>
        )}
        <div role="listbox" aria-label={t('unit')} onScroll={onListScroll} className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto">
          {shown.map((r) => {
            const sel = selected?.id === r.unit.id;
            const toggle = () => setOpenState(toggleIn(expanded, r.unit.id));
            return (
              <div
                key={r.unit.id}
                role="option"
                aria-selected={sel}
                tabIndex={-1}
                onClick={() => pick(r.unit.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter') pick(r.unit.id);
                  else if (e.key === 'ArrowRight' && r.hasKids && !r.open) toggle();
                  else if (e.key === 'ArrowLeft' && r.hasKids && r.open) toggle();
                }}
                className={cn('flex cursor-pointer items-center gap-0.5 rounded-lg py-1.5 pr-2 pl-1 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50', sel && 'bg-accent hover:bg-accent')}
              >
                <TreeRowView row={r} query={mq} onToggle={toggle} />
                {!r.hasKids && !covered.has(r.unit.id) && (
                  <span className="ml-2 flex-none rounded-full bg-warning-soft px-1.5 py-px text-[10.5px] font-medium text-warning-text">{t('noCq')}</span>
                )}
                {r.count !== undefined && <span className="ml-2 flex-none text-[11.5px] text-muted-foreground tabular-nums">{formatNumber(r.count)}</span>}
                {sel ? <Check className="ml-2 size-3.5 flex-none text-brand-text" strokeWidth={2.4} /> : <span className="ml-2 w-3.5 flex-none" />}
              </div>
            );
          })}
          {status === 'pending' && <div className="p-5 text-center text-xs text-muted-foreground">{t('common:loading')}…</div>}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-2 p-5 text-center text-xs text-muted-foreground">
              {t('unitsError')}
              <Button variant="outline" size="sm" onClick={onRetry}>{t('common:retry')}</Button>
            </div>
          )}
          {status === 'success' && rows.length === 0 && (
            <div className="p-5 text-center text-xs text-muted-foreground">{units.length ? t('noUnitMatch') : t('noUnits')}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

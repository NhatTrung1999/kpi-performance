import { useLayoutEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Info, Lock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
import { POSITION_CODES } from '@/config/promotion-proposal';
import { Tooltip } from '@/components/ui/tooltip';
import { formatMoney, formatSlashDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Ô nhập trong bảng: viền nhạt, đậm lên khi rê chuột/focus (giống màn Đề xuất KPI). */
export const fieldClass =
  'box-border w-full min-w-0 rounded-lg border bg-card text-foreground outline-none placeholder:text-placeholder hover:border-brand focus:border-brand focus:ring-3 focus:ring-accent disabled:cursor-not-allowed disabled:bg-transparent disabled:hover:border-border';
const optionClass =
  'flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-brand/50';

/**
 * `short` = nhãn ngắn hiện trên ô khi đã chọn (ô hẹp).
 * `sub` = dòng thứ hai của nhãn (vd. mã chức danh + tên hệ thống), hiện cả trên ô đã chọn lẫn trong danh sách.
 */
export type SelectOption<K extends string> = { key: K; label: string; sub?: string; hint?: string; short?: string };

/** Ô chọn một giá trị (Popover + listbox), mỗi lựa chọn có dòng gợi ý phụ. */
export function SelectCell<K extends string>({
  value,
  options,
  onPick,
  ariaLabel,
  placeholder,
  footer,
  invalid,
  danger,
  minWidth = 240,
}: {
  value: K | null;
  options: SelectOption<K>[];
  onPick: (key: K) => void;
  ariaLabel: string;
  placeholder: string;
  /** Ghi chú dưới danh sách (vd. "Thăng từng bậc theo quy định"). */
  footer?: string;
  invalid?: boolean;
  /** Tô đỏ (vd. BLĐ chọn Từ chối). */
  danger?: boolean;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldClass,
          'flex min-h-8 cursor-pointer items-center gap-1.5 px-2 py-1 text-left leading-[1.3] font-medium data-popup-open:border-brand',
          danger ? 'border-danger-border text-danger-text' : invalid ? 'border-danger-text' : 'border-border'
        )}
      >
        {/* Không cắt chữ: nhãn dài xuống dòng, ô cao theo nội dung. */}
        <span className={cn('flex min-w-0 flex-1 flex-col gap-px break-words', !current && 'font-normal text-placeholder')}>
          <span>{current ? (current.short ?? current.label) : placeholder}</span>
          {current?.sub && <span className="text-[11px] font-normal text-muted-foreground">{current.sub}</span>}
        </span>
        <ChevronDown aria-hidden="true" className="size-3 flex-none text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="p-1" style={{ minWidth }} onKeyDown={onListKeyDown}>
        <div role="listbox" aria-label={ariaLabel} className="flex flex-col gap-0.5 overflow-y-auto">
          {options.map((o) => {
            const sel = o.key === value;
            const pick = () => {
              onPick(o.key);
              setOpen(false);
            };
            return (
              <div key={o.key} role="option" aria-selected={sel} tabIndex={-1} onClick={pick} onKeyDown={(e) => e.key === 'Enter' && pick()} className={cn(optionClass, sel && 'bg-accent text-accent-foreground')}>
                <span className="flex flex-col gap-px">
                  <span className="font-medium">
                    {o.label}
                    {o.sub && <span className="font-normal text-muted-foreground"> · {o.sub}</span>}
                  </span>
                  {o.hint && <span className="text-[11px] text-muted-foreground">{o.hint}</span>}
                </span>
                {sel && <Check aria-hidden="true" className="size-3.5 flex-none text-brand-text" />}
              </div>
            );
          })}
        </div>
        {footer && (
          <div className="mt-0.5 flex items-center gap-1.5 border-t border-border px-2.5 pt-2 pb-1.5 text-[11px] text-muted-foreground">
            <Info aria-hidden="true" className="size-3 flex-none" />
            {footer}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Chữ dài (lý do, ý kiến): hiện tối đa 3 dòng, bấm mở Popover để đọc đủ / nhập. */
export function LongTextCell({
  title,
  who,
  value,
  editable,
  onChange,
  invalid,
  danger,
}: {
  title: string;
  who: string;
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
  invalid?: boolean;
  danger?: boolean;
}) {
  const { t } = useTranslation('promotion');
  const [open, setOpen] = useState(false);
  if (!editable && !value) return <span className="px-0.5 text-placeholder">{t('none')}</span>;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${title} — ${who}`}
        aria-invalid={invalid || undefined}
        className={cn(
          '-mx-1 w-[calc(100%+0.5rem)] cursor-pointer rounded-md px-1 py-0.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
          invalid && 'ring-1 ring-danger-text'
        )}
      >
        <span className={cn('line-clamp-3 whitespace-pre-line', !value && (invalid ? 'text-danger-text' : 'text-placeholder'), danger && 'text-danger-text')}>
          {value || t('placeholder')}
        </span>
      </PopoverTrigger>
      <PopoverContent className="flex-col gap-2 p-2.5" style={{ minWidth: 380 }}>
        <span className="text-xs font-semibold">
          {title} <span className="font-normal text-muted-foreground">· {who}</span>
        </span>
        {editable ? (
          <textarea
            autoFocus
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={t('typing')}
            aria-label={title}
            aria-invalid={invalid || undefined}
            className={cn(fieldClass, 'h-40 resize-y px-2.5 py-2 text-[12.5px] leading-normal', invalid ? 'border-danger-text' : 'border-border')}
          />
        ) : (
          <p className="m-0 text-[12.5px] leading-relaxed whitespace-pre-line text-pretty">{value}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Ô nhập nhiều dòng tự giãn chiều cao theo nội dung (bắt đầu 1 dòng, không che chữ, không thanh cuộn).
 * Dùng CSS `field-sizing: content`; trình duyệt chưa hỗ trợ thì tính chiều cao bằng scrollHeight.
 */
export function AutoTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || (typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content'))) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} className={cn('field-sizing-content resize-none overflow-hidden', className)} />;
}

export type HistoryEntry = { date: string; amount?: number };

/**
 * Ô nhiều giá trị (lịch sử đề xuất, lịch sử lương): 2 lần gần nhất + chip "+N"; bấm mở Popover có đủ bảng Ngày / Mức lương.
 * `show` = phần hiện trong ô (ngày hoặc số tiền).
 */
export function HistoryCell({ title, entries, show, amountLabel }: { title: string; entries: HistoryEntry[]; show: 'date' | 'amount'; amountLabel?: string }) {
  const { t } = useTranslation('promotion');
  const [open, setOpen] = useState(false);
  const desc = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const text = (e: HistoryEntry) => (show === 'date' ? formatSlashDate(e.date) : formatMoney(e.amount ?? 0));
  const more = desc.length - 2;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${title}: ${desc.map(text).join(', ')}`}
        className="-mx-1 flex w-[calc(100%+0.5rem)] cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className={cn('flex min-w-0 flex-1 flex-col gap-px tabular-nums', show === 'amount' ? 'items-end text-right' : 'items-start text-left')}>
          {desc.slice(0, 2).map((e, i) => (
            <span key={e.date} className={cn('whitespace-nowrap', i === 0 ? 'font-medium' : 'text-muted-foreground')}>
              {text(e)}
            </span>
          ))}
        </span>
        {more > 0 && (
          <span title={t('history.more', { count: desc.length })} className="flex h-[18px] flex-none items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-brand-text tabular-nums">
            +{more}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="gap-1.5 p-2" style={{ minWidth: 240 }}>
        <span className="px-1 text-xs font-semibold">{title}</span>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-border text-xs tabular-nums">
          <span className="bg-muted px-2.5 py-1.5 font-medium text-text-secondary">{t('history.date')}</span>
          <span className="bg-muted px-2.5 py-1.5 text-right font-medium text-text-secondary">{amountLabel ?? ''}</span>
          {desc.map((e, i) => (
            <div key={e.date} className="contents">
              <span className="border-t border-border px-2.5 py-1.5">{formatSlashDate(e.date)}</span>
              <span className={cn('border-t border-border px-2.5 py-1.5 text-right', i === 0 && 'font-semibold')}>{e.amount === undefined ? '' : formatMoney(e.amount)}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Ô nhập số tiền: chỉ nhận chữ số, hiện có phẩy nhóm nghìn, căn phải. Rỗng = `null`. */
export function MoneyInput({
  value,
  onChange,
  ariaLabel,
  disabled,
  danger,
  invalid,
  describedBy,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel: string;
  disabled?: boolean;
  danger?: boolean;
  /** Giá trị không hợp lệ (vd. Tăng lương mà = 0): viền đỏ, `aria-invalid`. */
  invalid?: boolean;
  /** id của dòng báo lỗi bên dưới ô. */
  describedBy?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === null ? '' : formatMoney(value)}
      disabled={disabled}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        onChange(digits === '' ? null : Number(digits));
      }}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        fieldClass,
        'h-8 px-2 text-right text-[12.5px] font-semibold tabular-nums',
        invalid ? 'border-danger-text text-danger-text' : danger ? 'border-danger-border text-danger-text' : 'border-border',
        className
      )}
    />
  );
}

/** Ô bị khóa (không chọn được), lý do trong tooltip. */
export function LockedCell({ reason, children, danger }: { reason: string; children: ReactNode; danger?: boolean }) {
  return (
    <Tooltip content={reason} side="top" sideOffset={6}>
      <span
        tabIndex={0}
        role="img"
        aria-label={reason}
        className={cn(
          'flex min-h-8 w-full cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3 [&_svg]:flex-none',
          danger ? 'border-danger-border text-danger-text' : 'border-border-strong bg-muted text-muted-foreground'
        )}
      >
        <Lock aria-hidden="true" />
        {children}
      </span>
    </Tooltip>
  );
}

/** Chữ chính + dòng phụ nhỏ (vd. nhãn tiếng Việt + tiếng Trung, mã chức danh + tên hệ thống). */
export const TwoLine = ({ main, sub, className, end }: { main: ReactNode; sub?: ReactNode; className?: string; end?: boolean }) => (
  <span className={cn('flex min-w-0 flex-col gap-px', end && 'items-end text-right', className)}>
    <span>{main}</span>
    {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
  </span>
);

/** Ô trống. */
export const Dash = () => <span className="px-0.5 text-placeholder">—</span>;

/** Số tiền theo quy ước kế toán; âm trong ngoặc đơn màu đỏ; `null` → "—". */
export const Money = ({ value, strong }: { value: number | null; strong?: boolean }) =>
  value === null ? <Dash /> : <span className={cn('tabular-nums', strong && 'font-semibold', value < 0 && 'text-danger-text')}>{formatMoney(value)}</span>;

/** Mã chức danh + tên hệ thống ("TRP" / "单位主管"). */
export const Position = ({ code, highlight }: { code: string; highlight?: boolean }) => (
  <TwoLine main={<span className={cn('font-medium', highlight && 'text-brand-text')}>{code}</span>} sub={POSITION_CODES[code]?.cn} />
);

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Info, Lock, PenLine, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const NOTES = ['n1', 'n2', 'n3', 'n4'] as const;
/** 2 quy định 4C (A10–B13): khóa chọn (đỏ) / bắt buộc lý do (cam). */
const RULES: readonly { key: 'locked' | 'reason'; icon: LucideIcon; tone: string; chip: string }[] = [
  { key: 'locked', icon: Lock, tone: 'border-l-danger bg-danger-soft/40', chip: 'bg-danger-soft text-danger-text' },
  { key: 'reason', icon: PenLine, tone: 'border-l-warning bg-warning-soft/40', chip: 'bg-warning-soft text-warning-text' },
];

/** Mở / thu gọn dải, nhớ trong localStorage; chưa có giá trị (lần đầu vào trang) thì mở. try/catch: bị chặn lưu trữ thì luôn mở. */
const KEY = 'promotion.guideOpen';

const loadOpen = () => {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
};

const saveOpen = (open: boolean) => {
  try {
    localStorage.setItem(KEY, open ? '1' : '0');
  } catch {
    // Không lưu được thì chỉ mất trạng thái khi tải lại trang.
  }
};

/**
 * Dải "Lưu ý & quy định": Notes của file (B16–B19, "hiển thị ở trang đầu để các Chủ quản lưu ý") bên trái và
 * "Theo quy định Cty:" về 4C (A10–B13) bên phải — câu chữ nguyên văn file.
 * Thu gọn: một dòng tóm tắt; mở rộng: 2 cột, cao tối đa 192px và cuộn bên trong.
 * Màn hình thấp (vd. 1366×768): bảng co trước tới mức tối thiểu 5 dòng (TableCard `fit`), sau đó dải mới co (còn ít nhất dòng tiêu đề).
 */
export function GuideStrip() {
  const { t } = useTranslation('promotion');
  const [open, setOpen] = useState(loadOpen);
  const toggle = () => {
    saveOpen(!open);
    setOpen(!open);
  };

  return (
    <section data-slot="guide-strip" aria-labelledby="promotion-guide-title" className="flex max-h-48 min-h-10 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card px-3.5 py-2 text-xs leading-normal">
      <div className="flex flex-none items-center gap-2">
        <span aria-hidden="true" className="flex size-5.5 flex-none items-center justify-center rounded-md bg-accent text-brand-text">
          <Info className="size-3.5" />
        </span>
        <h2 id="promotion-guide-title" className="text-[13px] font-semibold">
          {t('guide.title')} <span className="text-[11px] font-normal text-muted-foreground">{t('guide.sub')}</span>
        </h2>
        {!open && <span className="truncate text-text-secondary">{t('guide.summary', { notes: NOTES.length, rules: RULES.length })}</span>}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="promotion-guide"
          className="ml-auto flex h-6 flex-none items-center gap-1 rounded-md px-2 text-xs font-medium text-text-secondary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {open ? t('notes.collapse') : t('notes.expand')}
          <ChevronDown aria-hidden="true" className={cn('size-3 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && (
        <div id="promotion-guide" className="grid min-h-0 gap-x-6 gap-y-3 overflow-y-auto lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold">
              {t('notes.title')} <span className="text-[11px] font-normal text-muted-foreground">{t('notes.sub')}</span>
            </h3>
            <ol className="m-0 flex list-none flex-col gap-1 p-0">
              {NOTES.map((k, i) => (
                <li key={k} className="flex gap-2 text-text-secondary">
                  <span className="flex size-4.5 flex-none items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground tabular-nums">{i + 1}</span>
                  <span className="text-pretty">{t(`notes.${k}`)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold">
              {t('rules.title')} <span className="text-[11px] font-normal text-muted-foreground">{t('rules.sub')}</span>
              <span className="ml-2 rounded-full bg-muted px-1.5 py-px text-[11px] font-semibold text-foreground">{t('rules.when')}</span>
            </h3>
            {RULES.map(({ key, icon: Icon, tone, chip }) => (
              <div key={key} className={cn('flex flex-col gap-0.5 rounded-lg border border-l-[3px] border-border px-2.5 py-1.5', tone)}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span aria-hidden="true" className={cn('flex size-4.5 flex-none items-center justify-center rounded', chip)}>
                    <Icon className="size-3" strokeWidth={2.4} />
                  </span>
                  <span className="font-semibold text-foreground">{t(`rules.${key}.who`)}</span>
                  <span className={cn('ml-auto rounded-full px-2 py-px text-[11px] font-semibold whitespace-nowrap', chip)}>{t(`rules.${key}.result`)}</span>
                </div>
                <span className="pl-6.5 text-pretty text-text-secondary">{t(`rules.${key}.effect`)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

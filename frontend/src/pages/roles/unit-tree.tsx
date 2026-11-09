import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { norm } from './data';
import type { TreeRow } from './tree';

export const Highlight = ({ text, query }: { text: string; query: string }) => {
  const q = norm(query.trim());
  const i = q ? norm(text).indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-accent text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
};

type Props = {
  row: TreeRow;
  query: string;
  onToggle: () => void;
  /** Phần đặt giữa nút mở rộng và tên (vd. checkbox). */
  lead?: ReactNode;
};

/** Một dòng cây đơn vị: thụt 20px mỗi cấp, nút mở/đóng, tên + dòng chữ Hán. Phần đuôi (số người, chip) do nơi gọi thêm sau. */
export const TreeRowView = ({ row, query, onToggle, lead }: Props) => {
  const { t } = useTranslation('roles');
  return (
    <>
      {row.level > 0 && <span style={{ width: row.level * 20 }} className="flex-none" />}
      <button
        type="button"
        aria-label={row.open ? t('collapse') : t('expand')}
        tabIndex={row.hasKids ? 0 : -1}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          'flex size-5.5 flex-none items-center justify-center rounded-md text-muted-foreground transition-transform duration-150 hover:bg-border',
          row.open && 'rotate-90',
          !row.hasKids && 'invisible'
        )}
      >
        <ChevronRight className="size-3" strokeWidth={2.4} />
      </button>
      {lead}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className={cn('truncate text-[13px]', row.hasKids ? 'font-semibold' : 'font-medium')}>
          <Highlight text={row.name} query={query} />
        </span>
        {row.zh && <span className="truncate text-[11px] text-muted-foreground">{row.zh}</span>}
      </span>
    </>
  );
};

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
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

export const ZhText = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span lang="zh-Hant" className={cn("font-['Noto_Sans_TC',sans-serif] text-xs font-normal text-muted-foreground", className)}>
    {children}
  </span>
);

type Props = {
  row: TreeRow;
  query: string;
  onToggle: () => void;
  /** Phần đặt giữa nút mở rộng và tên (vd. checkbox). */
  lead?: ReactNode;
  className?: string;
};

export const TreeRowView = ({ row, query, onToggle, lead, className }: Props) => (
  <>
    {Array.from({ length: row.level }, (_, i) => (
      <span key={i} className="w-3.5 flex-none" />
    ))}
    {row.hasKids ? (
      <button
        type="button"
        aria-label={row.open ? 'Thu gọn' : 'Mở rộng'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex size-6 flex-none items-center justify-center rounded-md text-text-secondary hover:bg-border"
      >
        {row.open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>
    ) : (
      <span className="w-6 flex-none" />
    )}
    {lead}
    <span className={cn("flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 leading-snug", className)}>
      <span className={cn("[overflow-wrap:anywhere]", row.hasKids && "font-semibold")}>
        <Highlight text={row.vi} query={query} />
      </span>
      {row.zh && (
        <ZhText className="whitespace-nowrap">
          <Highlight text={row.zh} query={query} />
        </ZhText>
      )}
    </span>
    <span className="flex-none text-xs whitespace-nowrap text-muted-foreground tabular-nums">{row.count} người</span>
  </>
);

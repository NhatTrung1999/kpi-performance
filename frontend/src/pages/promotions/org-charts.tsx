import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileCheck2, FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { ORG_CHART, type OrgChartSlot } from '@/config/promotion-proposal';
import { formatNumber, formatSlashDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { orgChartBlob, orgChartError, type OrgChartFile, type ReviewGroup } from '@/services/promotionProposal';
import { useRemoveOrgChart, useUploadOrgChart } from './use-promotion-proposal';

const sizeText = (bytes: number) =>
  bytes < 1024 * 1024 ? `${formatNumber(Math.max(1, Math.round(bytes / 1024)))} KB` : `${formatNumber(bytes / 1024 / 1024, { maximumFractionDigits: 1 })} MB`;

/** Tải file đã tải lên trong phiên (bản mẫu không có nội dung file mẫu). */
const download = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Sơ đồ tổ chức của nhóm (bắt buộc để hoàn tất): 2 file Trước / Sau đề bạt.
 * `editable` (CQ khi đang lập): kéo thả / chọn file PDF, PNG, JPG ≤ 10MB; vai trò khác chỉ Xem / Tải về.
 */
export function OrgChartCard({ group, editable }: { group: ReviewGroup; editable: boolean }) {
  const { t } = useTranslation('promotion');
  const [viewing, setViewing] = useState<OrgChartSlot | null>(null);
  const files = group.orgCharts;
  const count = ORG_CHART.slots.filter((s) => files[s]).length;
  const viewFile = viewing && files[viewing];
  const viewBlob = viewing && orgChartBlob(group.id, viewing);
  const uploadedOn = files.before?.uploadedAt ?? files.after?.uploadedAt;

  return (
    <section className="flex flex-none flex-col gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h2 className="text-[13px] font-semibold">
          {t('orgChart.title')} {editable && t('orgChart.required')}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {editable ? t('orgChart.uploadSub') : t('orgChart.viewSub', { group: group.name })}
          {!editable && uploadedOn && ` · ${t('orgChart.uploadedOn', { date: formatSlashDate(uploadedOn) })}`}
        </span>
        {editable && (
          <span className={cn('ml-auto text-xs font-medium tabular-nums', count === 2 ? 'text-success-text' : 'text-warning-text')}>{t('orgChart.count', { count })}</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ORG_CHART.slots.map((slot) =>
          editable ? (
            <UploadSlot key={slot} group={group} slot={slot} file={files[slot]} />
          ) : (
            <ViewSlot key={slot} group={group} slot={slot} file={files[slot]} onView={() => setViewing(slot)} />
          )
        )}
      </div>

      <Dialog
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
        title={t('orgChart.previewTitle', { group: group.name })}
        description={viewFile?.name}
        closeLabel={t('confirm.cancel')}
        className="w-[min(900px,90vw)]"
      >
        <OrgPreview file={viewBlob || null} />
        {viewBlob && (
          <div className="flex justify-end">
            <Button variant="outline" size="lg" className="px-3.5" onClick={() => download(viewBlob)}>
              <Download aria-hidden="true" />
              {t('orgChart.download')}
            </Button>
          </div>
        )}
      </Dialog>
    </section>
  );
}

function OrgPreview({ file }: { file: File | null }) {
  const { t } = useTranslation('promotion');
  const [url] = useState(() => (file ? URL.createObjectURL(file) : null));
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  if (!file || !url) return <div className="flex h-[min(520px,60vh)] items-center justify-center rounded-lg border border-border bg-muted p-6 text-center text-[13px] text-muted-foreground">{t('orgChart.noPreview')}</div>;
  return file.type === 'application/pdf' ? (
    <iframe title={file.name} src={url} className="h-[min(520px,60vh)] w-full rounded-lg border border-border" />
  ) : (
    <img src={url} alt={file.name} className="max-h-[60vh] w-full rounded-lg border border-border object-contain" />
  );
}

function SlotIcon({ done }: { done: boolean }) {
  return (
    <span className={cn('flex size-9 flex-none items-center justify-center rounded-[10px] [&_svg]:size-[18px]', done ? 'bg-success-soft text-success-text' : 'bg-accent text-brand-text')}>
      {done ? <FileCheck2 aria-hidden="true" /> : <Upload aria-hidden="true" />}
    </span>
  );
}

function UploadSlot({ group, slot, file }: { group: ReviewGroup; slot: OrgChartSlot; file: OrgChartFile | null }) {
  const { t } = useTranslation('promotion');
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const upload = useUploadOrgChart();
  const remove = useRemoveOrgChart();

  const take = (f: File | undefined) => {
    if (!f) return;
    const error = orgChartError(f);
    if (error) return toast.error(t(`orgChart.errors.${error}`));
    upload.mutate({ groupId: group.id, slot, file: f }, { onError: () => toast.error(t('orgChart.errors.upload')) });
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        take(e.dataTransfer.files[0]);
      }}
      className={cn(
        'flex min-h-15 items-center gap-3 rounded-[10px] border px-3.5 py-2.5',
        file ? 'border-border bg-card' : 'border-dashed border-border-strong bg-grid-group-read',
        drag && 'border-brand bg-accent'
      )}
    >
      <SlotIcon done={!!file} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-semibold">
          {t(`orgChart.slots.${slot}.label`)} <span className="font-normal text-muted-foreground">{t(`orgChart.slots.${slot}.sub`)}</span>
        </span>
        <span className={cn('truncate text-xs', file ? 'text-foreground' : 'text-muted-foreground')}>
          {file ? `${file.name} · ${sizeText(file.size)}` : t('orgChart.drop')}
        </span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={[...ORG_CHART.types, ...ORG_CHART.extensions].join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <Button variant="outline" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()} aria-label={`${file ? t('orgChart.replace') : t('orgChart.choose')} — ${t(`orgChart.slots.${slot}.label`)}`}>
        {file ? t('orgChart.replace') : t('orgChart.choose')}
      </Button>
      {file && (
        <Button variant="ghost" size="icon-sm" disabled={remove.isPending} onClick={() => remove.mutate({ groupId: group.id, slot })} aria-label={`${t('orgChart.remove')} — ${t(`orgChart.slots.${slot}.label`)}`}>
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function ViewSlot({ group, slot, file, onView }: { group: ReviewGroup; slot: OrgChartSlot; file: OrgChartFile | null; onView: () => void }) {
  const { t } = useTranslation('promotion');
  const blob = orgChartBlob(group.id, slot);
  return (
    <div className="flex min-h-15 items-center gap-3 rounded-[10px] border border-border bg-card px-3.5 py-2.5">
      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-accent text-brand-text [&_svg]:size-[18px]">
        <FileText aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-semibold">
          {t(`orgChart.slots.${slot}.label`)} <span className="font-normal text-muted-foreground">{t(`orgChart.slots.${slot}.sub`)}</span>
        </span>
        <span className={cn('truncate text-xs', file ? 'text-text-secondary' : 'text-muted-foreground')}>{file ? `${file.name} · ${sizeText(file.size)}` : t('orgChart.missing')}</span>
      </span>
      {file && (
        <>
          <Button variant="outline" size="sm" onClick={onView} aria-label={`${t('orgChart.view')} — ${file.name}`}>
            {t('orgChart.view')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (blob ? download(blob) : toast.info(t('orgChart.noPreview')))}
            aria-label={`${t('orgChart.download')} — ${file.name}`}
          >
            <Download aria-hidden="true" />
            {t('orgChart.download')}
          </Button>
        </>
      )}
    </div>
  );
}

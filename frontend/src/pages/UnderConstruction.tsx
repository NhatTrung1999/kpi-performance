import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Trang tạm cho các mục đã có trong menu nhưng chưa xây dựng (Kỳ đánh giá, Lịch sử). */
const UnderConstruction = () => {
  const { t } = useTranslation();
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div role="status" className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Construction className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold">{t('underConstruction.heading')}</h2>
        <p className="text-muted-foreground">{t('underConstruction.description')}</p>
      </div>
    </main>
  );
};

export default UnderConstruction;

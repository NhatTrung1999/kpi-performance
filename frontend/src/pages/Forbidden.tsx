import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';

const Forbidden = () => {
  const { t } = useTranslation();
  return (
  <>
    <Header title={t('forbidden.title')} />
    <main className="flex flex-1 items-center justify-center p-6">
      <div role="alert" className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold">{t('forbidden.heading')}</h2>
        <p className="text-muted-foreground">{t('forbidden.description')}</p>
        <Button size="lg" render={<Link to="/dashboard" />} nativeButton={false} className="mt-2 h-10 px-4">
          {t('forbidden.back')}
        </Button>
      </div>
    </main>
  </>
  );
};

export default Forbidden;

import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './routes';

function App() {
  const { t } = useTranslation();
  return (
    <>
      <AppRoutes />
      <Toaster label={t('toaster.label')} closeLabel={t('toaster.close')} />
    </>
  );
}

export default App;

import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '@/components/ui/app-logo';
import { Button } from '@/components/ui/button';

/**
 * Trang 404 (ngoài khung ứng dụng): cùng nền navy + họa tiết của trang đăng nhập (`login-backdrop`) và thẻ kính tối
 * (`login-form-glass`, luôn tông tối nhờ class `dark`). "Về trang chủ" dẫn về `/` — HomeRedirect tự đưa tới trang
 * theo vai trò, chưa đăng nhập thì về trang đăng nhập.
 */
const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="login-backdrop relative isolate flex min-h-dvh flex-col font-login text-foreground">
      <header className="flex items-center gap-2.5 px-6 py-5 text-white">
        <AppLogo />
        <span className="text-[15px] font-bold">{t('appName')}</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div role="alert" className="dark login-form-glass flex w-full max-w-md flex-col items-center gap-3 p-8 text-center text-foreground">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Compass className="size-7" aria-hidden="true" />
          </div>
          <p className="bg-linear-to-b from-white to-white/40 bg-clip-text text-6xl font-bold tracking-tight text-transparent tabular-nums">404</p>
          <h1 className="text-xl font-bold">{t('notFound')}</h1>
          <p className="text-muted-foreground">{t('notFoundDescription')}</p>
          <Button size="lg" render={<Link to="/" />} nativeButton={false} className="mt-2 h-10 px-4">
            {t('forbidden.back')}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;

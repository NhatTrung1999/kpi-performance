import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';
import { AppShell } from '@/components/ui/app-shell';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { useMe } from '@/hooks/use-me';
import { logout } from '@/lib/auth';
import { useCurrentUser } from '@/lib/session';
import { hasUnsavedChanges } from '@/lib/unsaved-changes';
import { SIDEBAR_ROLES } from '@/routes/config';
import { ShellContext, type ShellContextValue } from './shell-context';

const SIDEBAR_KEY = 'kpi-sidebar-collapsed';
const DESKTOP = '(min-width: 1024px)';

const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
};

/** Đang gõ trong ô nhập thì không bắt phím tắt một ký tự (vd. "?"). */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const MainLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Chỉ Admin có sidebar; Chủ quản và BLĐ chỉ có thanh trên.
  const withSidebar = SIDEBAR_ROLES.includes(useCurrentUser().role);
  // Xác nhận phiên với server + cập nhật họ tên/vai trò mới nhất khi vào khu vực đã đăng nhập.
  useMe();

  // Nhớ trạng thái đóng/mở sidebar giữa các lần vào.
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage bị chặn: chỉ nhớ trong phiên hiện tại */
    }
  }, [collapsed]);

  const toggleSidebar = useCallback(() => setCollapsed((c) => !c), []);

  const signOut = useCallback(async () => {
    setConfirmOpen(false);
    await logout();
    // Đăng xuất xong về thẳng trang login, không hiện thông báo.
    navigate('/login', { replace: true });
  }, [navigate]);

  const requestLogout = useCallback(() => {
    if (hasUnsavedChanges()) setConfirmOpen(true);
    else void signOut();
  }, [signOut]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        // Ctrl/⌘+B chỉ có nghĩa ở desktop có sidebar (mobile dùng menu trượt).
        if (!withSidebar || !window.matchMedia(DESKTOP).matches) return;
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar, withSidebar]);

  const shell = useMemo<ShellContextValue>(
    () => ({ collapsed, toggleSidebar, openMobileMenu: () => setMenuOpen(true), openShortcuts: () => setShortcutsOpen(true), requestLogout }),
    [collapsed, toggleSidebar, requestLogout]
  );
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const shortcuts = [
    ...(withSidebar ? [{ label: t('shortcuts.toggleSidebar'), keys: t('shortcuts.keys.toggleSidebar') }] : []),
    { label: t('shortcuts.showShortcuts'), keys: t('shortcuts.keys.showShortcuts') },
    { label: t('shortcuts.closeDialog'), keys: t('shortcuts.keys.close') },
  ];

  return (
    <ShellContext.Provider value={shell}>
      <AppShell
        sidebar={withSidebar ? <Sidebar collapsed={collapsed} /> : undefined}
        mobileSidebar={withSidebar ? <Sidebar onClose={closeMenu} onNavigate={closeMenu} className="w-70 border-r border-border bg-sidebar shadow-toast" /> : undefined}
        mobileSidebarOpen={menuOpen}
        onMobileSidebarClose={closeMenu}
        header={<Header withSidebar={withSidebar} />}
      >
        <Outlet />
      </AppShell>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} title={t('shortcuts.title')} description={t('shortcuts.description')} closeLabel={t('shell.close')}>
        <ul className="flex flex-col">
          {shortcuts.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-4 border-t border-border py-2.5 text-sm first:border-t-0">
              <span>{s.label}</span>
              <Kbd>{s.keys}</Kbd>
            </li>
          ))}
        </ul>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('shell.unsavedTitle')}
        description={t('shell.unsavedDescription')}
        cancelLabel={t('shell.cancel')}
        confirmLabel={t('shell.logout')}
        tone="danger"
        onConfirm={() => void signOut()}
      />
    </ShellContext.Provider>
  );
};

export default MainLayout;

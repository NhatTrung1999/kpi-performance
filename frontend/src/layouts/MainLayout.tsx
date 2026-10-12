import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from '@/components/common/Sidebar';

export type MainLayoutContext = { openMenu: () => void };

const MainLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-page text-foreground lg:h-screen lg:overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <Sidebar
            onClose={() => setMenuOpen(false)}
            className="fixed top-0 bottom-0 left-0 z-41 w-72 shadow-xl lg:hidden"
          />
        </>
      )}
      {/* Từ lg: cột nội dung là vùng cuộn của trang thường; trang bảng (PageShell) vừa khít nên không cuộn. */}
      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:overflow-y-auto">
        <Outlet context={{ openMenu: () => setMenuOpen(true) } satisfies MainLayoutContext} />
      </div>
    </div>
  );
};

export default MainLayout;

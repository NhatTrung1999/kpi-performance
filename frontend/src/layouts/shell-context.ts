import { createContext, useContext } from 'react';

/** Hành động của khung trang trong mà thanh trên / sidebar / trang con cần gọi. */
export type ShellContextValue = {
  collapsed: boolean;
  toggleSidebar: () => void;
  openMobileMenu: () => void;
  openShortcuts: () => void;
  /** Đăng xuất; có thay đổi chưa lưu thì hỏi xác nhận trước. */
  requestLogout: () => void;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

export const useShell = () => useContext(ShellContext);

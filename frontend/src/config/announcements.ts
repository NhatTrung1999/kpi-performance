/**
 * Nội dung công khai của trang đăng nhập (thông báo HR, What's new).
 * Tạm thời lấy từ file này; sau này chuyển sang API do admin quản lý — giữ nguyên các kiểu dưới đây làm hợp đồng dữ liệu.
 * Trang hiển thị TRƯỚC khi đăng nhập: chỉ đưa thông tin công khai, KHÔNG có tên người hay số liệu nội bộ.
 * Văn bản là dữ liệu hệ thống, hiển thị nguyên văn (không qua i18n); ngày dạng ISO `YYYY-MM-DD`.
 */
export type UpdateKind = 'planned' | 'new' | 'improved';
export type UpdateIcon = 'wrench' | 'download' | 'smartphone' | 'mail';

export interface HrAnnouncement {
  id: string;
  title: string;
  description: string;
  pinned?: boolean;
}

export interface UpdateEntry {
  id: string;
  kind: UpdateKind;
  icon: UpdateIcon;
  title: string;
  /** Chi tiết ngắn hiện sau tiêu đề. */
  detail?: string;
  date: string;
  href?: string;
}

/** Thông báo đầu tiên (ưu tiên cái được ghim) được hiển thị. */
export const HR_ANNOUNCEMENTS: HrAnnouncement[] = [
  {
    id: 'q4-self-review',
    title: 'Q4 self-review opens Dec 1',
    description: 'Complete your self-assessment before Dec 15 so your manager can review it.',
    pinned: true,
  },
];

export const UPDATES: UpdateEntry[] = [
  { id: 'maintenance', kind: 'planned', icon: 'wrench', title: 'Scheduled maintenance', detail: 'Sat 10 PM – 11 PM', date: '2026-10-17' },
  { id: 'excel-export', kind: 'new', icon: 'download', title: 'Export your KPI report to Excel', date: '2026-10-09' },
  { id: 'mobile-layout', kind: 'improved', icon: 'smartphone', title: 'Mobile layout improvements', date: '2026-10-06' },
  { id: 'email-reminders', kind: 'new', icon: 'mail', title: 'Check-in reminders by email', date: '2026-10-02' },
];

/** Trang ghi chú phát hành; để trống thì ẩn liên kết "Release notes". */
export const RELEASE_NOTES_URL: string | undefined = undefined;

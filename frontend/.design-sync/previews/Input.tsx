import { Input } from 'frontend';

const Mail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

export const MacDinh = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
    <Input placeholder="Tìm nhân viên…" />
    <Input defaultValue="Nguyễn Văn An" />
    <Input placeholder="Không thể chỉnh sửa" disabled />
    <Input defaultValue="sai-dinh-dang" aria-invalid />
  </div>
);

export const DangNhap = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
    <Input size="lg" startIcon={<Mail />} placeholder="ten@congty.vn" type="email" />
    <Input size="lg" startIcon={<Mail />} defaultValue="khong-hop-le" aria-invalid="true" />
  </div>
);

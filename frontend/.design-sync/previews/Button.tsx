import { Button } from 'frontend';

export const BienThe = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    <Button>Lưu đánh giá</Button>
    <Button variant="outline">Xuất báo cáo</Button>
    <Button variant="secondary">Lưu nháp</Button>
    <Button variant="ghost">Bỏ qua</Button>
    <Button variant="destructive">Xóa phiếu</Button>
    <Button variant="link">Xem chi tiết</Button>
  </div>
);

export const KichCo = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
    <Button size="xs">Nhỏ nhất</Button>
    <Button size="sm">Nhỏ</Button>
    <Button>Mặc định</Button>
    <Button size="lg">Lớn</Button>
    <Button size="xl">Đăng nhập</Button>
  </div>
);

export const TrangThai = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    <Button loading>Đang gửi…</Button>
    <Button disabled>Không khả dụng</Button>
    <Button variant="outline" disabled>Không khả dụng</Button>
  </div>
);

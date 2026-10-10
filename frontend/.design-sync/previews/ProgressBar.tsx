import { ProgressBar } from 'frontend';

export const BaMucNguong = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
    <ProgressBar value={96} label="Doanh thu" showValue />
    <ProgressBar value={72} label="Khách hàng mới" showValue />
    <ProgressBar value={38} label="Tỷ lệ gia hạn" showValue />
  </div>
);

export const VuotChiTieu = () => (
  <div style={{ width: 360 }}>
    <ProgressBar value={118} label="Số cuộc gọi" showValue />
  </div>
);

export const KhongHienSo = () => (
  <div style={{ width: 360 }}>
    <ProgressBar value={64} label="Tiến độ đánh giá" />
  </div>
);

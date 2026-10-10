import { Badge } from 'frontend';

export const TatCaTrangThai = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    <Badge status="dat" />
    <Badge status="canh-bao" />
    <Badge status="chua-dat" />
    <Badge status="nhap" />
    <Badge status="cho-duyet" />
    <Badge status="da-duyet" />
  </div>
);

export const NhanTuyChinh = () => <Badge status="dat">Đạt 96%</Badge>;

export const TrongDong = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
    <span>Phiếu đánh giá Q3/2026 — Nguyễn Văn An</span>
    <Badge status="cho-duyet" />
  </div>
);

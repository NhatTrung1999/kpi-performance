import { StatCard } from 'frontend';

export const Don = () => (
  <div style={{ width: 280 }}>
    <StatCard label="Doanh thu quý" value="12,4" unit="tỷ đồng" trend={{ value: 8.2, caption: 'so với quý trước' }} progress={92} />
  </div>
);

export const LuoiChiSo = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 260px)', gap: 16 }}>
    <StatCard label="Khách hàng mới" value="148" trend={{ value: -3.5, caption: 'so với tháng trước' }} progress={74} />
    <StatCard label="Tỷ lệ lỗi" value="1,8" unit="%" trend={{ value: -0.6, inverse: true, caption: 'so với quý trước' }} progress={55} />
    <StatCard label="Nhân sự đã nộp phiếu" value="42/48" trend={{ value: 0 }} />
  </div>
);

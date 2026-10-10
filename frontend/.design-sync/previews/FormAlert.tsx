import { FormAlert } from 'frontend';

export const MotDong = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460 }}>
    <FormAlert tone="error">Email hoặc mật khẩu không đúng.</FormAlert>
    <FormAlert tone="warning">Phiên đăng nhập sắp hết hạn.</FormAlert>
    <FormAlert tone="success">Đã gửi liên kết đặt lại mật khẩu.</FormAlert>
    <FormAlert tone="info">Bạn có thể chỉnh sửa đến hết ngày 05/10.</FormAlert>
  </div>
);

export const CoTieuDe = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460 }}>
    <FormAlert tone="error" title="Không thể lưu đánh giá">Chỉ tiêu “Doanh thu” chưa có số liệu thực hiện. Vui lòng kiểm tra lại.</FormAlert>
    <FormAlert tone="success" title="Đã gửi duyệt">Phiếu của bạn đang chờ trưởng phòng xác nhận.</FormAlert>
  </div>
);

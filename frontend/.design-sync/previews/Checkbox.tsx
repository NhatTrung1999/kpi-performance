import { Checkbox, Label } from 'frontend';

export const TrangThai = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Label><Checkbox /> Ghi nhớ đăng nhập</Label>
    <Label><Checkbox defaultChecked /> Gửi email nhắc hạn đánh giá</Label>
    <Label><Checkbox disabled /> Chưa được phép chọn</Label>
    <Label><Checkbox defaultChecked disabled /> Bắt buộc theo quy chế</Label>
    <Label><Checkbox aria-invalid /> Tôi xác nhận số liệu là chính xác</Label>
  </div>
);

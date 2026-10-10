import { Input, Label } from 'frontend';

export const VoiOTruong = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 300 }}>
    <Label htmlFor="email">Email công việc</Label>
    <Input id="email" placeholder="ten@congty.vn" />
  </div>
);

export const BatBuoc = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 300 }}>
    <Label htmlFor="ten">Họ và tên *</Label>
    <Input id="ten" defaultValue="Nguyễn Văn An" />
  </div>
);

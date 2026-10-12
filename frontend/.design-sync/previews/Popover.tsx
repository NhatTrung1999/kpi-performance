import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger } from 'frontend';

const Option = ({ children, selected }: { children: string; selected?: boolean }) => (
  <div
    role="option"
    aria-selected={selected}
    style={{ padding: '8px 12px', fontSize: 14, cursor: 'pointer', fontWeight: selected ? 600 : 400, background: selected ? 'var(--accent)' : undefined }}
  >
    {children}
  </div>
);

export const ChonDonVi = () => (
  <div style={{ width: 300, height: 220 }}>
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" style={{ width: 240, justifyContent: 'space-between' }} />}>
        Phòng Kinh doanh
      </PopoverTrigger>
      <PopoverContent>
        <Option selected>Phòng Kinh doanh</Option>
        <Option>Phòng Kế toán</Option>
        <Option>Phòng Nhân sự</Option>
        <Option>Phòng Kỹ thuật</Option>
      </PopoverContent>
    </Popover>
  </div>
);

export const CoNutDong = () => (
  <div style={{ width: 340, height: 200 }}>
    <Popover defaultOpen>
      <PopoverTrigger render={<Button size="sm" />}>Ghi chú</PopoverTrigger>
      <PopoverContent align="start" style={{ padding: 16, gap: 12, minWidth: 260 }}>
        <p style={{ margin: 0, fontSize: 14 }}>Cần bổ sung minh chứng cho chỉ tiêu doanh thu trước ngày 05/10.</p>
        <PopoverClose render={<Button variant="outline" size="sm" />}>Đã hiểu</PopoverClose>
      </PopoverContent>
    </Popover>
  </div>
);

import * as React from 'react';
import { Toaster, toast } from 'frontend';

function Demo({ kind, text, desc }: { kind: 'success' | 'error' | 'warning'; text: string; desc?: string }) {
  React.useEffect(() => {
    toast[kind](text, { description: desc, duration: Infinity });
  }, []);
  return <Toaster position="top-left" />;
}

export const ThanhCong = () => <Demo kind="success" text="Đã lưu đánh giá" desc="Phiếu Q3/2026 đã được cập nhật." />;
export const Loi = () => <Demo kind="error" text="Không thể gửi duyệt" desc="Còn 2 chỉ tiêu chưa có số liệu." />;
export const CanhBao = () => <Demo kind="warning" text="Sắp đến hạn nộp phiếu" desc="Còn 2 ngày." />;

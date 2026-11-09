import { useEffect, useId } from 'react';

/**
 * Sổ đăng ký "có thay đổi chưa lưu" dùng chung: trang/form gọi `useUnsavedChanges(isDirty)`,
 * khung trang hỏi `hasUnsavedChanges()` trước khi đăng xuất để xin xác nhận.
 */
const dirty = new Set<string>();

export const hasUnsavedChanges = () => dirty.size > 0;

export function useUnsavedChanges(isDirty: boolean) {
  const id = useId();
  useEffect(() => {
    if (!isDirty) return;
    dirty.add(id);
    return () => {
      dirty.delete(id);
    };
  }, [id, isDirty]);
}

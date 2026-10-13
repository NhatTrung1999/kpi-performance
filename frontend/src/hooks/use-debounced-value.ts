import { useEffect, useState } from 'react';

/** Trả về `value` sau khi nó ổn định `delay` ms; dùng để lọc khi người dùng gõ tìm kiếm. */
export const useDebouncedValue = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

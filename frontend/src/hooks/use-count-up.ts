import { useEffect, useState } from "react";

/** Đếm từ 0 đến `target` (easeOutCubic). Hiện ngay giá trị cuối nếu người dùng bật giảm chuyển động. */
export function useCountUp(target: number, duration = 1800, delay = 200) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let start: number | null = null;
    const timer = window.setTimeout(() => {
      const tick = (t: number) => {
        start ??= t;
        const x = Math.min(1, (t - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - x, 3))));
        if (x < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay, reduce]);

  return reduce ? target : value;
}

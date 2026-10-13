import { useEffect, useState } from "react";

/** Thời điểm hiện tại, cập nhật đúng lúc sang phút mới (và khi tab quay lại) — đủ cho đồng hồ chỉ hiện giờ:phút. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 60_000 - (Date.now() % 60_000) + 30);
    };
    const refresh = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    schedule();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return now;
}

/**
 * Chế độ nhẹ cho máy yếu: `<html data-perf="lite">` → CSS (index.css, mục "Chế độ nhẹ") cho nền cực quang đứng yên,
 * kính mờ nhẹ hơn; lib/shatter.ts cho vết nứt hiện ngay thay vì lan dần.
 *
 * Bật khi: đã từng đo là máy yếu (nhớ trong localStorage), hoặc máy ít nhân CPU / ít RAM, hoặc đo thực tế trên trang
 * đăng nhập thấy dưới 50 khung hình/giây (`measureFps`). Máy mạnh giữ đủ hiệu ứng.
 */

const KEY = "kpi-perf";

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const write = (v: string) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // Không lưu được thì lần sau đo lại.
  }
};

export const isLite = () => document.documentElement.dataset.perf === "lite";

function enableLite() {
  document.documentElement.dataset.perf = "lite";
  write("lite");
}

/** Gọi một lần lúc khởi động (main.tsx). */
export function initPerf() {
  if (read() === "lite") {
    document.documentElement.dataset.perf = "lite";
    return;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  if (cores <= 2 || memory <= 2) enableLite();
}

/**
 * Đo tốc độ khung hình trong `duration` ms (bắt đầu sau `delay` ms để bỏ qua hiệu ứng vào trang). Dưới 50 fps (khung
 * hình/giây trung bình) thì bật chế độ nhẹ và nhớ lại. Đo một lần mỗi máy (đã nhớ "full"/"lite" thì thôi).
 * Trả về hàm huỷ (khi rời trang trước lúc đo xong).
 */
export function measureFps({ delay = 1500, duration = 2000 } = {}): () => void {
  if (read() || isLite()) return () => {};
  let raf = 0;
  const timer = window.setTimeout(() => {
    const frames: number[] = [];
    let last = performance.now();
    const start = last;
    const tick = (t: number) => {
      frames.push(t - last);
      last = t;
      if (t - start < duration) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (document.visibilityState !== "visible" || frames.length < 10) return; // tab ẩn: không kết luận
      // Trung bình khung hình/giây (tính cả các lần khựng lẻ tẻ — thứ người dùng thấy là "lag").
      const fps = ((frames.length - 1) * 1000) / (last - start);
      if (fps < 50) enableLite();
      else write("full");
    };
    raf = requestAnimationFrame(tick);
  }, delay);
  return () => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
  };
}

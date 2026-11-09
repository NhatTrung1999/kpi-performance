import { useEffect, useRef } from "react";
import { isLite } from "@/lib/perf";
import type { Season } from "@/lib/season";

type Particle = { x: number; y: number; r: number; vy: number; sway: number; phase: number; rot: number; vr: number; color: string; shape: number };

/** Tết: hoa mai vàng (nhiều hơn) + hoa đào hồng. Giáng sinh: tuyết trắng / trắng xanh. */
const COLORS: Record<Season, string[]> = {
  tet: ["#FCD34D", "#FBBF24", "#FDE68A", "#F9A8D4", "#F472B6"],
  xmas: ["#FFFFFF", "#F1F5F9", "#E0F2FE"],
};

/**
 * Vật rơi trang trí theo dịp lễ (canvas phủ màn hình, không chặn thao tác): Tết = hoa mai/đào, Giáng sinh = tuyết.
 * Ít hơn khi máy yếu (chế độ nhẹ); bật "giảm chuyển động" thì chỉ vẽ một lần, đứng yên. Tự dừng khi tab ẩn.
 */
export function SeasonParticles({ season }: { season: Season }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const snow = season === "xmas";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = (snow ? 60 : 26) / (isLite() ? 2 : 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const colors = COLORS[season];
    const make = (top: boolean): Particle => ({
      x: Math.random() * w,
      y: top ? -20 - Math.random() * h * 0.3 : Math.random() * h,
      r: snow ? 1.2 + Math.random() * 3.2 : 4 + Math.random() * 5,
      vy: snow ? 22 + Math.random() * 38 : 18 + Math.random() * 26,
      sway: snow ? 8 + Math.random() * 20 : 14 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * (snow ? 0.6 : 1.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      // Tết: 0 = hoa 5 cánh, 1 = cánh lẻ. Giáng sinh: 0 = bông tuyết 6 nhánh (hạt to), 1 = hạt tuyết tròn.
      shape: snow ? (Math.random() < 0.3 ? 0 : 1) : Math.random() < 0.55 ? 0 : 1,
    });
    const items = Array.from({ length: count }, () => make(false));

    const drawBlossom = (p: Particle) => {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = p.color;
      if (p.shape === 0) {
        for (let i = 0; i < 5; i++) {
          ctx.rotate((Math.PI * 2) / 5);
          ctx.beginPath();
          ctx.ellipse(0, -p.r * 0.62, p.r * 0.42, p.r * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#B45309";
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 0.45, p.r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const drawSnow = (p: Particle) => {
      if (p.shape === 0) {
        const s = p.r * 2.2;
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -s);
          ctx.moveTo(0, -s * 0.55);
          ctx.lineTo(s * 0.25, -s * 0.78);
          ctx.moveTo(0, -s * 0.55);
          ctx.lineTo(-s * 0.25, -s * 0.78);
        }
        ctx.stroke();
      } else {
        ctx.globalAlpha = 0.55 + p.r * 0.1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const draw = (p: Particle, t: number) => {
      ctx.save();
      ctx.translate(p.x + Math.sin(t * 0.0008 + p.phase) * p.sway, p.y);
      ctx.rotate(p.rot);
      if (snow) drawSnow(p);
      else drawBlossom(p);
      ctx.restore();
    };

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < items.length; i++) {
        const p = items[i];
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > h + 20) items[i] = make(true);
        draw(items[i], t);
      }
      raf = requestAnimationFrame(frame);
    };
    if (still) items.forEach((p) => draw(p, 0));
    else raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [season]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 size-full" />;
}

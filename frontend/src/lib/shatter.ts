/**
 * Hiệu ứng kính nứt/vỡ kiểu kính cường lực của trang đăng nhập.
 * - `crack`: rê chuột lên thẻ kính → mạng nứt ô nhỏ bo tròn lan ra từ con trỏ.
 * - `shatter` (đăng nhập thành công): mạng nứt lan nhanh từ nút Đăng nhập, rồi thẻ vỡ thành nhiều mảnh bo tròn (mỗi mảnh
 *   là bản sao thẻ cắt theo một ô — giữ đúng nội dung + chất kính + vết nứt), vỡ lan từ điểm va chạm, các mảnh bật nhẹ ra,
 *   xoay và rơi lả tả xuống, mờ dần. Promise xong khi mảnh cuối biến mất.
 * Bật "giảm chuyển động" thì không có hiệu ứng (shatter xong ngay). Mảnh gắn cạnh thẻ nên tự mất khi trang chuyển đi.
 */

import { isLite } from "@/lib/perf";

type Point = { x: number; y: number };

const SVG_NS = "http://www.w3.org/2000/svg";
/** Cỡ ô nứt (px). */
const CELL = 22;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Mạng nứt kiểu kính cường lực: các ô Voronoi (điểm trên lưới `size` px, lệch ngẫu nhiên) phủ vùng w × h (thêm lề),
 * mỗi ô vẽ bo tròn góc (đường cong qua trung điểm các cạnh) → ô "hạt cuội", chỗ giao nhau thành mấu nứt dày như kính thật.
 * Trả về từng ô: `poly` (đa giác) + `c` (điểm gốc của ô); `roundedPath` vẽ ô bo tròn.
 */
function voronoiCells(w: number, h: number, size: number): { poly: Point[]; c: Point }[] {
  const cols = Math.ceil(w / size) + 2;
  const rows = Math.ceil(h / size) + 2;
  const pts: Point[][] = [];
  for (let r = 0; r < rows; r++) {
    pts.push([]);
    for (let c = 0; c < cols; c++) {
      pts[r].push({ x: (c - 1 + 0.5 + rand(-0.42, 0.42)) * size, y: (r - 1 + 0.5 + rand(-0.42, 0.42)) * size });
    }
  }
  const cells: { poly: Point[]; c: Point }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = pts[r][c];
      // Ô Voronoi của p: cắt hình vuông quanh p bằng nửa mặt phẳng trung trực với các điểm lân cận (Sutherland–Hodgman).
      let poly: Point[] = [
        { x: p.x - 2 * size, y: p.y - 2 * size },
        { x: p.x + 2 * size, y: p.y - 2 * size },
        { x: p.x + 2 * size, y: p.y + 2 * size },
        { x: p.x - 2 * size, y: p.y + 2 * size },
      ];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const q = pts[r + dr]?.[c + dc];
          if (!q || q === p) continue;
          const nx = q.x - p.x;
          const ny = q.y - p.y;
          const k = (nx * (p.x + q.x)) / 2 + (ny * (p.y + q.y)) / 2;
          const side = (v: Point) => nx * v.x + ny * v.y - k; // ≤ 0: cùng phía p
          const next: Point[] = [];
          for (let i = 0; i < poly.length; i++) {
            const A = poly[i];
            const B = poly[(i + 1) % poly.length];
            const sa = side(A);
            const sb = side(B);
            if (sa <= 0) next.push(A);
            if (sa <= 0 !== sb <= 0) {
              const t = sa / (sa - sb);
              next.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });
            }
          }
          poly = next;
        }
      }
      if (poly.length < 3) continue;
      cells.push({ poly, c: p });
    }
  }
  return cells;
}

/** Path ô bo tròn (đường cong qua trung điểm các cạnh), dời (dx, dy). */
function roundedPath(poly: Point[], dx = 0, dy = 0) {
  const f = (n: number) => n.toFixed(1);
  const mid = (i: number) => {
    const A = poly[i % poly.length];
    const B = poly[(i + 1) % poly.length];
    return { x: (A.x + B.x) / 2 + dx, y: (A.y + B.y) / 2 + dy };
  };
  const m0 = mid(poly.length - 1);
  let d = `M${f(m0.x)} ${f(m0.y)}`;
  for (let i = 0; i < poly.length; i++) {
    const m = mid(i);
    d += `Q${f(poly[i].x + dx)} ${f(poly[i].y + dy)} ${f(m.x)} ${f(m.y)}`;
  }
  return d + "Z";
}

/** Các ô nứt gộp thành 3 nhóm `d` để tô sáng khác nhau (mặt kính phản quang không đều). */
function temperedCells(w: number, h: number, size: number): string[] {
  const groups = ["", "", ""];
  for (const { poly } of voronoiCells(w, h, size)) groups[Math.floor(Math.random() * 3)] += roundedPath(poly);
  return groups;
}

let maskSeq = 0;

/**
 * Vết nứt khi rê chuột lên thẻ kính — kiểu kính cường lực (mạng ô nhỏ bo tròn, viền sáng xanh nhạt + nét tối lệch tạo
 * độ dày): lan ra thành vòng từ điểm `point` (toạ độ màn hình) tới hết thẻ, kèm chớp sáng nhẹ ở tâm.
 * `opacity`: độ đậm vết nứt; `exclude`: selector các phần tử bên trong được chừa trống (vd. ô nhập, nút — để chữ gõ vào
 * không bị nét nứt lộ qua nền trong suốt của ô); `spread`: thời gian (ms) lan hết thẻ; `groups`: mạng nứt có sẵn (shatter
 * dùng chung một mạng cho vết nứt và ảnh trên các mảnh).
 * Trả về hàm gỡ: vết nứt mờ dần rồi biến mất. Bật "giảm chuyển động" thì không làm gì.
 */
export function crack(
  el: HTMLElement,
  point: Point,
  { opacity = 0.8, exclude, spread, groups: given }: { opacity?: number; exclude?: string; spread?: number; groups?: string[] } = {}
): () => void {
  if (reducedMotion()) return () => {};
  const rect = el.getBoundingClientRect();
  const o: Point = { x: point.x - rect.left, y: point.y - rect.top };
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    borderRadius: "inherit",
    overflow: "hidden",
    pointerEvents: "none",
    // Nằm dưới nội dung (chữ, icon) nhưng trên nền kính của thẻ — thẻ được `isolate` bên dưới để -1 không lọt ra ngoài.
    zIndex: "-1",
    opacity: String(opacity),
  });

  // Mặt nạ: vòng tròn mép mềm phóng to từ điểm chạm → vết nứt lan dần ra hết thẻ.
  const id = `crack-mask-${++maskSeq}`;
  const reach = Math.max(
    Math.hypot(o.x, o.y),
    Math.hypot(rect.width - o.x, o.y),
    Math.hypot(o.x, rect.height - o.y),
    Math.hypot(rect.width - o.x, rect.height - o.y)
  ) + 40;
  svg.innerHTML = `<defs>
    <radialGradient id="${id}-g"><stop offset="0.82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${rect.width}" height="${rect.height}">
      <circle cx="${o.x}" cy="${o.y}" r="${reach}" fill="url(#${id}-g)"/>
    </mask></defs>`;
  if (exclude) {
    const mask = svg.querySelector("mask") as SVGMaskElement;
    for (const hole of el.querySelectorAll<HTMLElement>(exclude)) {
      const r = hole.getBoundingClientRect();
      const box = document.createElementNS(SVG_NS, "rect");
      const radius = parseFloat(getComputedStyle(hole).borderTopLeftRadius) || 0;
      for (const [k, v] of Object.entries({ x: r.left - rect.left, y: r.top - rect.top, width: r.width, height: r.height, rx: radius })) {
        box.setAttribute(k, String(v));
      }
      box.setAttribute("fill", "#000");
      mask.appendChild(box);
    }
  }
  const circle = svg.querySelector("circle") as SVGCircleElement;
  Object.assign(circle.style, { transformBox: "view-box", transformOrigin: `${o.x}px ${o.y}px` });

  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("mask", `url(#${id})`);
  g.setAttribute("fill-rule", "evenodd");
  const layer = (d: string, attrs: Record<string, string>) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    for (const [k, v] of Object.entries(attrs)) path.setAttribute(k, v);
    g.appendChild(path);
  };
  const groups = given ?? temperedCells(rect.width, rect.height, CELL);
  const all = groups.join("");
  // Nét tối lệch xuống (bề dày mép kính) → mặt ô (sáng không đều) → viền sáng xanh nhạt.
  layer(all, { fill: "none", stroke: "rgb(0 12 28 / 0.32)", "stroke-width": "2", transform: "translate(0.7 0.9)" });
  groups.forEach((d, i) => layer(d, { fill: `rgb(200 230 255 / ${[0.01, 0.025, 0.05][i]})`, stroke: "none" }));
  layer(all, { fill: "none", stroke: "rgb(215 238 255 / 0.7)", "stroke-width": "1", "stroke-linejoin": "round" });
  svg.appendChild(g);

  const flash = document.createElementNS(SVG_NS, "circle");
  flash.setAttribute("cx", String(o.x));
  flash.setAttribute("cy", String(o.y));
  flash.setAttribute("r", "22");
  flash.setAttribute("fill", "rgb(255 255 255 / 0.4)");
  flash.style.filter = "blur(8px)";
  svg.appendChild(flash);

  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.style.isolation = "isolate";
  // `data-cracked`: CSS tăng tương phản nội dung trong lúc thẻ đang nứt (index.css).
  el.dataset.cracked = "";
  el.appendChild(svg);
  // Chế độ nhẹ: vết nứt hiện ngay (mờ vào) — mặt nạ lan dần buộc vẽ lại SVG hàng trăm ô mỗi khung hình.
  if (isLite()) svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
  else circle.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
    duration: spread ?? Math.min(900, 250 + reach * 0.9),
    easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    fill: "forwards",
  });
  flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease-out", fill: "forwards" });
  return () => {
    delete el.dataset.cracked;
    svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: "ease-out", fill: "forwards" }).onfinish = () => svg.remove();
  };
}

export function shatter(card: HTMLElement, origin?: Point): Promise<void> {
  if (reducedMotion()) return Promise.resolve();

  const rect = card.getBoundingClientRect();
  const host = card.parentElement ?? document.body;
  const point = origin ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const o: Point = { x: point.x - rect.left, y: point.y - rect.top };
  card.inert = true;

  // Nền cực quang đứng yên trong lúc vỡ: đỡ phải làm nhòe lại các thẻ kính mỗi khung hình.
  card.closest(".login-backdrop")?.classList.add("login-backdrop-paused");

  // 1. Nứt: mạng ô cường lực lan nhanh khắp thẻ (đè lên vết nứt do rê chuột nếu có).
  const CRACK_MS = 300;
  const groups = temperedCells(rect.width, rect.height, CELL);
  crack(card, point, { opacity: 0.9, spread: CRACK_MS, groups });

  // Ảnh vết nứt cho các mảnh: vẽ cùng mạng nứt bằng canvas (vài ms) — ảnh SVG hàng trăm ô làm trình duyệt đứng ~0.5s lúc vỡ.
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(rect.width * dpr);
  canvas.height = Math.ceil(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  let crackImage = "";
  if (ctx) {
    ctx.scale(dpr, dpr);
    ctx.globalAlpha = 0.9;
    const all = new Path2D(groups.join(""));
    ctx.save();
    ctx.translate(0.7, 0.9);
    ctx.strokeStyle = "rgb(0 12 28 / 0.32)";
    ctx.lineWidth = 2;
    ctx.stroke(all);
    ctx.restore();
    groups.forEach((d, i) => {
      ctx.fillStyle = `rgb(200 230 255 / ${[0.01, 0.025, 0.05][i]})`;
      ctx.fill(new Path2D(d), "evenodd");
    });
    ctx.strokeStyle = "rgb(215 238 255 / 0.7)";
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.stroke(all);
  }

  return new Promise((resolve) => {
    // Ảnh mã hoá trong lúc vết nứt lan (bất đồng bộ).
    canvas.toBlob((blob) => {
      if (blob) crackImage = `url("${URL.createObjectURL(blob)}")`;
    });
    window.setTimeout(() => {
      // 2. Vỡ: mỗi ô lớn (~56px) thành một mảnh — bản sao thẻ (đã có vết nứt) cắt theo ô.
      const radius = getComputedStyle(card).borderRadius;
      const size = 64;
      const cells = voronoiCells(rect.width, rect.height, size).filter(
        ({ c }) => c.x > -size / 2 && c.y > -size / 2 && c.x < rect.width + size / 2 && c.y < rect.height + size / 2
      );
      const maxDist = Math.max(...cells.map(({ c }) => Math.hypot(c.x - o.x, c.y - o.y)), 1);
      let longest = 0;
      // Mảnh = khối kính nhẹ vừa một ô: nền kính + ảnh vết nứt của thẻ, dời đúng chỗ (không nhân bản nội dung thẻ — hàng
      // chục bản sao làm đứng hình gần nửa giây). Nội dung thẻ mờ + nhòe dần tại chỗ trong lúc kính rơi (`.shatter-hollow`).
      const frag = document.createDocumentFragment();
      const anims: { el: HTMLElement; frames: Keyframe[]; opts: KeyframeAnimationOptions }[] = [];
      const background = [crackImage, "var(--shard-glass)"].filter(Boolean).join(", ");
      for (const { poly, c } of cells) {
        const bx = Math.max(0, Math.floor(Math.min(...poly.map((q) => q.x))));
        const by = Math.max(0, Math.floor(Math.min(...poly.map((q) => q.y))));
        const bw = Math.min(rect.width, Math.ceil(Math.max(...poly.map((q) => q.x)))) - bx;
        const bh = Math.min(rect.height, Math.ceil(Math.max(...poly.map((q) => q.y)))) - by;
        if (bw <= 0 || bh <= 0) continue;
        const shard = document.createElement("div");
        shard.className = "shard";
        Object.assign(shard.style, {
          left: `${rect.left + bx}px`,
          top: `${rect.top + by}px`,
          width: `${bw}px`,
          height: `${bh}px`,
          clipPath: `path("${roundedPath(poly, -bx, -by)}")`,
          transformOrigin: `${c.x - bx}px ${c.y - by}px`,
          backgroundImage: background,
          backgroundSize: `${rect.width}px ${rect.height}px`,
          backgroundPosition: `${-bx}px ${-by}px`,
        });
        // Mảnh ở góc bo của thẻ: cắt theo bo góc.
        if (bx === 0 || by === 0 || bx + bw >= rect.width - 1 || by + bh >= rect.height - 1) {
          shard.style.clipPath = "none";
          shard.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="${SVG_NS}" width="${bw}" height="${bh}"><defs><clipPath id="r"><rect x="${-bx}" y="${-by}" width="${rect.width}" height="${rect.height}" rx="${parseFloat(radius) || 0}"/></clipPath></defs><path clip-path="url(#r)" d="${roundedPath(poly, -bx, -by)}"/></svg>`
          )}")`;
        }
        frag.appendChild(shard);
        const dist = Math.hypot(c.x - o.x, c.y - o.y);
        const ux = dist ? (c.x - o.x) / dist : 0;
        const uy = dist ? (c.y - o.y) / dist : 0;
        const pop = rand(8, 26) * (1 - (dist / maxDist) * 0.5);
        const drift = ux * rand(20, 70) + rand(-25, 25);
        const fall = rand(260, 460);
        const rot = rand(-140, 140);
        const delay = (dist / maxDist) * 380 + rand(0, 60);
        const duration = rand(750, 1000);
        longest = Math.max(longest, delay + duration);
        anims.push({
          el: shard,
          frames: [
            { transform: "none", opacity: 1 },
            { transform: `translate(${ux * pop}px, ${uy * pop - 6}px) rotate(${rot * 0.08}deg)`, opacity: 1, offset: 0.18 },
            { transform: `translate(${drift}px, ${fall}px) rotate(${rot}deg) scale(0.75)`, opacity: 0 },
          ],
          opts: { duration, delay, easing: "cubic-bezier(0.45, 0, 0.85, 0.55)", fill: "both" },
        });
      }
      host.appendChild(frag);
      for (const { el, frames, opts } of anims) el.animate(frames, opts);
      // Thẻ gốc chỉ còn nội dung (kính đã thành mảnh): bỏ nền/viền/vết nứt, nội dung tan dần.
      card.querySelectorAll(":scope > svg").forEach((n) => n.remove());
      card.classList.add("shatter-hollow");
      card.animate(
        [
          { opacity: 1, filter: "blur(0)", transform: "none" },
          { opacity: 0, filter: "blur(6px)", transform: "translateY(10px) scale(0.98)" },
        ],
        { duration: 320, easing: "ease-in", fill: "forwards" }
      );
      window.setTimeout(() => {
        if (crackImage) URL.revokeObjectURL(crackImage.slice(5, -2));
        resolve();
      }, longest);
    }, CRACK_MS);
  });
}

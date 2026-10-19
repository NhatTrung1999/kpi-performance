import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

type TokenKind = 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'other';

// Phân loại token theo tên; tên không rõ thì xét giá trị (màu, hoặc var() trỏ tới token đã biết loại).
function kindOf(name: string, value: string, known: Map<string, TokenKind>): TokenKind {
  if (/^--(shimmer-|scroll-fade-|animate-|ease-|blur-|default-transition-)/.test(name)) return 'other';
  if (/^--(color-|chart-|sidebar)/.test(name)) return 'color';
  if (/^--shadow-/.test(name)) return 'shadow';
  if (/^--radius/.test(name)) return 'radius';
  if (/^--(spacing|container-)/.test(name)) return 'spacing';
  if (/^--(font-|text-|tracking-|leading-|default-(mono-)?font-)/.test(name)) return 'font';
  if (/^(#|oklch\(|oklab\(|rgba?\(|hsla?\(|color-mix\(|transparent$|currentcolor$)/i.test(value)) return 'color';
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return (alias && known.get(alias[1])) || 'other';
}

// Hậu kỳ CSS thư viện cho Claude Design (/design-sync), không ảnh hưởng app:
// 1. Bỏ khối dự phòng `*,:before,:after,::backdrop{--tw-*…}` trong @layer properties. Khối này chỉ chạy ở
//    trình duyệt chưa có @property (đã có @supports chặn); trình duyệt hiện đại lấy giá trị khởi tạo từ
//    @property nên giao diện không đổi, còn Claude Design không còn coi ~100 biến nội bộ là biến chưa đăng ký.
// 2. Tách khối token `:root` và `.dark` (nằm ngoài mọi @layer) ra đầu file, dạng không nén, đứng trước mọi
//    @layer của Tailwind. Rule ngoài layer luôn thắng rule trong layer bất kể thứ tự, và không rule ngoài layer
//    nào khác khai báo lại các biến này, nên đổi vị trí không làm đổi giao diện.
// 3. Chỉ token trong hai khối đó được gắn `/* @kind … */` cùng dòng với khai báo. Phần còn lại (kể cả
//    `:root,:host` của @layer theme, rule utility, :where(...), @property) không bị quét; biến --tw-* không gắn @kind.
function designSyncTokens(): Plugin {
  const TOKEN_SCOPE = /^(:root|\.dark)$/;
  const DECL = /^\s*(--[\w-]+)\s*:([\s\S]*)$/;

  // Các rule `selector{body}` ở cấp ngoài cùng (không nằm trong @layer/@media/@supports), bỏ qua chuỗi và chú thích.
  function topLevelRules(css: string) {
    const rules: { selector: string; body: string; start: number; end: number }[] = [];
    let depth = 0;
    let stmtStart = 0;
    let open = -1;
    for (let i = 0; i < css.length; i++) {
      const c = css[i];
      if (c === '\\') {
        i++; // ký tự đã escape trong selector, vd. `.content-\[\'\'\]`
      } else if (c === '/' && css[i + 1] === '*') {
        i = css.indexOf('*/', i + 2) + 1;
        if (depth === 0) stmtStart = i + 1;
      } else if (c === '"' || c === "'") {
        while (++i < css.length && css[i] !== c) if (css[i] === '\\') i++;
      } else if (c === '{') {
        if (depth++ === 0) open = i;
      } else if (c === '}') {
        if (--depth === 0) {
          rules.push({ selector: css.slice(stmtStart, open).trim(), body: css.slice(open + 1, i), start: stmtStart, end: i + 1 });
          stmtStart = i + 1;
        }
      } else if (c === ';' && depth === 0) {
        stmtStart = i + 1;
      }
    }
    return rules;
  }
  return {
    name: 'design-sync-tokens',
    apply: 'build',
    enforce: 'post', // chạy sau vite:css-post, lúc file CSS đã được phát ra
    generateBundle(_, bundle) {
      const asset = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.css'));
      if (!asset || asset.type !== 'asset') return;
      let css = String(asset.source);

      const fallback = /\*,\s*:before,\s*:after,\s*::backdrop\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;?)+\s*\}/g;
      const removed = css.match(fallback)?.length ?? 0;
      if (removed !== 1) this.error(`design-sync-tokens: cần đúng 1 khối dự phòng --tw-*, thấy ${removed}`);
      css = css.replace(fallback, '');

      const tokenRules = topLevelRules(css).filter((r) => TOKEN_SCOPE.test(r.selector));
      const selectors = tokenRules.map((r) => r.selector).join(', ');
      if (selectors !== ':root, .dark') this.error(`design-sync-tokens: cần đúng 1 khối :root và 1 khối .dark ngoài layer, thấy [${selectors}]`);

      const known = new Map<string, TokenKind>();
      const blocks = tokenRules.map(({ selector, body }) => {
        const decls = body
          .split(';')
          .filter((d) => d.trim())
          .map((d) => {
            const m = DECL.exec(d);
            if (!m) return `  ${d.trim()};`;
            const kind = kindOf(m[1], m[2].trim(), known);
            known.set(m[1], kind);
            return `  ${m[1]}: ${m[2].trim()}; /* @kind ${kind} */`;
          });
        return `${selector} {\n${decls.join('\n')}\n}\n`;
      });
      for (const r of [...tokenRules].reverse()) css = css.slice(0, r.start) + css.slice(r.end);
      asset.source = `${blocks.join('\n')}\n${css}`;
    },
  };
}

// Build thư viện design system → dist-lib/ (design-system.js + design-system.css + fonts).
// Chạy: npm run build:lib
export default defineConfig({
  publicDir: false,
  plugins: [react(), tailwindcss(), designSyncTokens()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 0, // giữ font là file riêng, không nhúng base64
    lib: {
      entry: path.resolve(__dirname, 'src/design-system.ts'),
      formats: ['es'],
      fileName: 'design-system',
      cssFileName: 'design-system',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', /^use-sync-external-store(\/|$)/], // CJS gọi require('react'): để converter bundle lại qua shim React
    },
  },
});

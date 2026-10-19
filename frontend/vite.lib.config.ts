import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

type TokenKind = 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'other';

// Phân loại token theo tên; tên không rõ thì xét giá trị (màu, hoặc var() trỏ tới token đã biết loại).
function kindOf(name: string, value: string, known: Map<string, TokenKind>): TokenKind {
  if (/^--(tw-|shimmer-|scroll-fade-|animate-|ease-|blur-|default-transition-)/.test(name)) return 'other';
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
// 2. Gắn `/* @kind … */` sau mỗi biến trong :root/.dark (token thật) và sau mọi biến --tw-*, mỗi biến một dòng.
function designSyncTokens(): Plugin {
  const TOKEN_SCOPE = /^(:root|:root,:host|\.dark)$/;
  const RULE = /([^{};]+)\{([^{}]*)\}/g;
  const DECL = /^\s*(--[\w-]+)\s*:([\s\S]*)$/;
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

      const known = new Map<string, TokenKind>();
      const annotate = (selector: string, body: string) => {
        const tokenScope = TOKEN_SCOPE.test(selector.trim());
        const decls = body.split(';').filter((d) => d.trim());
        if (!decls.some((d) => tokenScope || /^\s*--tw-/.test(d))) return null;
        return decls
          .map((d) => {
            const m = DECL.exec(d);
            if (!m || (!tokenScope && !m[1].startsWith('--tw-'))) return `${d.trim()};`;
            const kind = kindOf(m[1], m[2].trim(), known);
            known.set(m[1], kind);
            return `${m[1]}:${m[2].trim()}; /* @kind ${kind} */`;
          })
          .join('\n');
      };
      css = css.replace(RULE, (rule, selector: string, body: string) => {
        const out = annotate(selector, body);
        return out === null ? rule : `${selector}{\n${out}\n}`;
      });
      asset.source = css;
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

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

type TokenKind = 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'other';

// Phân loại token theo tên; tên không rõ thì xét giá trị (màu, hoặc var() trỏ tới token đã biết loại).
function kindOf(name: string, value: string, known: Map<string, TokenKind>): TokenKind {
  // Hiệu ứng, chuyển động, easing: luôn là `other`.
  if (/^--(shimmer-|scroll-fade-|animate-|ease-|blur-|default-transition-|perspective-|aspect-)/.test(name)) return 'other';
  if (/^--(color-|chart-|sidebar)/.test(name)) return 'color';
  if (/^--shadow-/.test(name)) return 'shadow';
  if (/^--radius/.test(name)) return 'radius';
  if (/^--(spacing|container-)/.test(name)) return 'spacing';
  if (/^--(font-|text-|tracking-|leading-|default-(mono-)?font-)/.test(name)) return 'font';
  if (/^(#|oklch\(|oklab\(|rgba?\(|hsla?\(|color-mix\(|transparent$|currentcolor$)/i.test(value)) return 'color';
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return (alias && known.get(alias[1])) || 'other';
}

// Hậu kỳ CSS thư viện cho Claude Design (/design-sync), không ảnh hưởng app. Quy tắc (xem .design-sync/NOTES.md):
// - Token chỉ gồm các khối `:root,:host` (của @layer theme và @layer properties), `:root` và `.dark`. Các khối này
//   được tách khỏi design-system.css sang dist-lib/tokens/tokens.css (không nén, mỗi khai báo một dòng, `/* @kind … */` cùng dòng). Config design-sync
//   (tokensPkg/tokensGlob) trỏ vào file này, nên bước sync chỉ quét token ở đây, không quét design-system.css.
// - Không biến --tw-* nào, không biến nào dưới selector utility (`:where(.space-y-*)`, `.translate-x-1`…) hay
//   @property được quét/gắn @kind; chúng giữ nguyên trong design-system.css.
// - Token hiệu ứng/easing (--ease-*, --animate-*, --shimmer-*, --default-transition-*, --blur-*…) là `@kind other`.
// Giao diện không đổi: tokens.css mở đầu bằng câu lệnh @layer giữ nguyên thứ tự layer gốc, mỗi khối vẫn nằm trong
// layer/@supports cũ, `:root`/`.dark` vẫn ngoài layer, và styles.css @import tokens.css trước _ds_bundle.css.
// Ngoài ra bỏ khối dự phòng `*,:before,…{--tw-*}` trong @layer properties: nó chỉ chạy ở trình duyệt chưa có
// @property, còn trình duyệt hiện đại lấy giá trị khởi tạo từ chính @property.
function designSyncTokens(): Plugin {
  const DECL = /^\s*(--[\w-]+)\s*:([\s\S]*)$/;

  // Các khối `prelude{body}` ở cấp ngoài cùng, bỏ qua chuỗi, chú thích và ký tự escape.
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

  const declsOf = (body: string) =>
    body
      .split(';')
      .map((d) => DECL.exec(d))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1], m[2].trim()] as const);

  return {
    name: 'design-sync-tokens',
    apply: 'build',
    enforce: 'post', // chạy sau vite:css-post, lúc file CSS đã được phát ra
    generateBundle(_, bundle) {
      const asset = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.css'));
      if (!asset || asset.type !== 'asset') return;
      let css = String(asset.source);
      const fail = (msg: string): never => this.error(`design-sync-tokens: ${msg}`);

      const fallback = /\*,\s*:before,\s*:after,\s*::backdrop\s*\{(?:\s*--[\w-]+\s*:[^;{}]*;?)+\s*\}/g;
      const removed = css.match(fallback)?.length ?? 0;
      if (removed !== 1) fail(`cần đúng 1 khối dự phòng --tw-*, thấy ${removed}`);
      css = css.replace(fallback, '');

      const layerOrder = [...new Set([...css.matchAll(/@layer\s+([\w-]+)/g)].map((m) => m[1]))];
      const rules = topLevelRules(css);
      const one = (selector: string) => {
        const found = rules.filter((r) => r.selector === selector);
        if (found.length !== 1) fail(`cần đúng 1 khối "${selector}" ở cấp ngoài cùng, thấy ${found.length}`);
        return found[0];
      };
      const root = one(':root');
      const dark = one('.dark');
      const themeLayer = one('@layer theme');
      const propsLayer = one('@layer properties');

      const theme = /^\s*:root,\s*:host\s*\{([^{}]*)\}\s*$/.exec(themeLayer.body);
      if (!theme) fail('@layer theme phải chỉ chứa một khối :root,:host');
      const themeDecls = declsOf(theme![1]);
      const props = /^\s*(@supports[^{]*)\{\s*:root,\s*:host\s*\{([^{}]*)\}\s*\}\s*$/.exec(propsLayer.body);
      if (!props) fail('@layer properties phải chỉ còn khối @supports { :root,:host {…} }');

      const known = new Map<string, TokenKind>();
      const block = (selector: string, decls: (readonly [string, string])[], indent = '') =>
        [
          `${indent}${selector} {`,
          ...decls.map(([n, v]) => {
            const kind = kindOf(n, v, known);
            known.set(n, kind);
            return `${indent}  ${n}: ${v}; /* @kind ${kind} */`;
          }),
          `${indent}}`,
        ].join('\n');
      // Phân loại :root trước để alias của theme (vd. --color-page: var(--page)) tra được loại.
      const rootBlock = block(':root', declsOf(root.body));
      const darkBlock = block('.dark', declsOf(dark.body));
      const themeBlock = `@layer theme {\n${block(':root,:host', themeDecls, '  ')}\n}`;
      const propsBlock = `@layer properties {\n  ${props![1].trim()} {\n${block(':root,:host', declsOf(props![2]), '    ')}\n  }\n}`;
      const tokensCss =
        [`@layer ${layerOrder.join(', ')};`, propsBlock, themeBlock, rootBlock, darkBlock].join('\n\n') + '\n';

      for (const r of [root, dark, themeLayer, propsLayer].sort((x, y) => y.start - x.start))
        css = css.slice(0, r.start) + css.slice(r.end);
      asset.source = css;
      this.emitFile({ type: 'asset', fileName: 'tokens/tokens.css', source: tokensCss });
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

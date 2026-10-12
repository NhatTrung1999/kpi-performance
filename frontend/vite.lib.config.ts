import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// Build thư viện design system → dist-lib/ (design-system.js + design-system.css + fonts).
// Chạy: npm run build:lib
export default defineConfig({
  publicDir: false,
  plugins: [react(), tailwindcss()],
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

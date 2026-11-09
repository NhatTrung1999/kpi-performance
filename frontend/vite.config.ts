import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Dev: chuyển /api sang backend NestJS (backend đã đặt global prefix 'api').
  server: {
    proxy: {
      '/api': process.env.VITE_API_PROXY ?? 'http://192.168.18.42:4310',
    },
    host: true,
  },
});

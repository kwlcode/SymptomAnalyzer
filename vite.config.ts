import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src-web'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // Proxy API calls to Express backend during development
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/payment': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});

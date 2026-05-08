import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:8787';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: BACKEND, changeOrigin: true },
      '/build':   { target: BACKEND, changeOrigin: true },
      '/test':    { target: BACKEND, changeOrigin: true },
      '/deploy':  { target: BACKEND, changeOrigin: true },
      '/healthz': { target: BACKEND, changeOrigin: true }
    }
  }
});

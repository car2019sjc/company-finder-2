import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Usar base simples para Netlify
  server: {
    proxy: {
      '/api/apollo': {
        target: 'https://api.apollo.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/apollo/, '/v1'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
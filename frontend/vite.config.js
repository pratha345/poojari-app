// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },

  build: {
    // Target modern browsers — smaller, faster output
    target: 'es2020',

    // CSS code splitting — each chunk gets its own CSS file → better caching
    cssCodeSplit: true,

    // Increase warning threshold slightly
    chunkSizeWarningLimit: 700,

    // Source maps off in production for smaller bundle
    sourcemap: false,

    rollupOptions: {
      output: {
        // Fine-grained manual chunks for optimal caching:
        // Each chunk is cached independently; only changed chunks re-download
        manualChunks(id) {
          // React core — changes rarely, cache forever
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // UI utilities
          if (id.includes('react-hot-toast') || id.includes('react-helmet-async')) {
            return 'vendor-ui';
          }
          // HTTP client
          if (id.includes('node_modules/axios/')) {
            return 'vendor-utils';
          }
          // Heavy astronomy library — split away from main bundle
          if (id.includes('node_modules/suncalc/')) {
            return 'vendor-suncalc';
          }
          // Recharts — only AdminReport uses it, split away from main admin chunk
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }
          // Admin pages — only admins load this
          if (id.includes('/pages/admin/') || id.includes('/pages/superadmin/')) {
            return 'admin';
          }
          // Heavy pages — Panchang + Rashifal use suncalc, split together
          if (id.includes('/pages/Panchang') || id.includes('/pages/Rashifal') ||
              id.includes('/pages/Muhurat')) {
            return 'astro-pages';
          }
          // Map component — leaflet and react-leaflet are heavy
          if (id.includes('leaflet') || id.includes('HallMap')) {
            return 'vendor-map';
          }
        },
      },
    },
  },
});

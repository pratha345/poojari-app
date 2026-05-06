// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':     ['react-hot-toast', 'react-helmet-async'],
          'vendor-utils':  ['axios'],
          'admin':         [
            './src/pages/admin/AdminDashboard.jsx',
            './src/pages/admin/ManagePujaris.jsx',
            './src/pages/admin/ManageBookings.jsx',
            './src/pages/admin/ManagePoojas.jsx',
            './src/pages/admin/KundaliMilan.jsx',
            './src/pages/admin/AdminTheme.jsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

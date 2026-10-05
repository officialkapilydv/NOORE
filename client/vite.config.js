import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.VITE_API_PROXY || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    fs: { allow: [path.resolve(__dirname, '..')] },
    // bind mounts from Windows into Docker do not emit file events — poll instead
    watch: process.env.CHOKIDAR_USEPOLLING ? { usePolling: true, interval: 400 } : undefined,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/images': { target: API, changeOrigin: true },
    },
  },
  preview: {
    host: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/images': { target: API, changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          motion: ['framer-motion'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand', 'lenis'],
        },
      },
    },
  },
});

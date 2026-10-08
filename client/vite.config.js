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
        // Function form so Vite's dynamic-import helper can be pinned to vendor. The object form let
        // it land in r3f, which made every page download three.js + r3f (~1.3 MB) before rendering.
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) return 'vendor';
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three';
          if (/[\\/]node_modules[\\/]@react-three[\\/]/.test(id)) return 'r3f';
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|zustand|lenis)[\\/]/.test(id)) return 'vendor';
          return undefined;
        },
      },
    },
  },
});

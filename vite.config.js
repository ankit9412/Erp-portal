import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          charts: ['chart.js', 'recharts'],
        },
      },
    },
  },
});
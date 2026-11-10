import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { sourcemap: true, reportCompressedSize: true },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    clearMocks: true,
    restoreMocks: true,
    coverage: { provider: 'v8', reporter: ['text', 'html', 'lcov'], all: true, include: ['src/**/*.{js,jsx}'], exclude: ['src/tests/**'] }
  }
});

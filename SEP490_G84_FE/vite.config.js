import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Proxy /api error:', err.message, '- Is backend running on http://localhost:8081?');
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      // @ alias for ./src
      '@': path.resolve(__dirname, './src'),
    },
  },
});

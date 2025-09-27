import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import baseConfig from './src/config/base';

export default defineConfig({
  plugins: [react()],
  server: {
    port: baseConfig.ports.client,
    proxy: {
      '/api': {
        target: `http://localhost:${baseConfig.ports.server}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  assetsInclude: ['**/*.json']
});
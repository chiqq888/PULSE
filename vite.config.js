import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { seoPlugin } from './src/seo/vitePlugin.js';

export default defineConfig({
  plugins: [react(), seoPlugin()],
  server: {
    port: 5173,
  },
});

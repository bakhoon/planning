import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': relative asset paths so the build works under any GitHub Pages repo name
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 900 },
});

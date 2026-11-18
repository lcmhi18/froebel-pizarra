import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

// External configuration only. No file inside app/ is created or changed.
export default defineConfig({
  root: resolve(root, 'app'),
  base: '/app/',
  resolve: { dedupe: ['react', 'react-dom'] },
  build: {
    outDir: resolve(root, 'dist/app'),
    emptyOutDir: false,
    rollupOptions: { input: resolve(root, 'app/index.html') },
  },
});

import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { discoverHtmlEntries } from './config/html-entries.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const entries = discoverHtmlEntries(root);

function htmlRoutes(): Plugin {
  return {
    name: 'froebel-html-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        for (const entry of entries) {
          const path = `/${entry.publicPath.replace(/index\.html$/, '')}`;
          if (entry.key !== 'home' && (url.pathname === path || url.pathname === path.replace(/\/$/, ''))) {
            req.url = `/${entry.input}${url.search}`;
            break;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  resolve: { alias: { '@shared': resolve(root, 'src/shared') } },
  plugins: [htmlRoutes()],
  server: {
    host: '127.0.0.1', port: 5174,
    proxy: { '/api': { target: 'http://127.0.0.1:8787', ws: true } },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(entries.map(entry => [entry.key, resolve(root, entry.input)])),
    },
  },
});

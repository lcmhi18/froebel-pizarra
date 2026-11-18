import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {alias:{'@shared':fileURLToPath(new URL('./src/shared',import.meta.url))}},
  plugins:[cloudflareTest({
    wrangler:{configPath:'worker/wrangler.jsonc'},
    remoteBindings:false,
    miniflare:{bindings:{LOCAL_TEACHER:'true'}},
  })],
  test:{include:['tests/e2/**/*.test.ts','tests/e3/**/*.test.ts','tests/e4/**/*.test.ts'],testTimeout:15000,hookTimeout:15000,fileParallelism:false},
});

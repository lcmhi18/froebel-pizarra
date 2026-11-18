import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { discoverHtmlEntries } from '../config/html-entries.ts';

// Vite preserves source HTML paths; publish clean aliases without breaking those paths.
for (const entry of discoverHtmlEntries(process.cwd())) {
  if (entry.input === entry.publicPath) continue;
  const output = resolve('dist', entry.publicPath);
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(resolve('dist', entry.input), output);
}

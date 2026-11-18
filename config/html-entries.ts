import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export type HtmlEntry = { key: string; input: string; publicPath: string };

/** Explicit HTML inputs, discovered from existing source folders at config load. */
export function discoverHtmlEntries(root: string): HtmlEntry[] {
  const entries: HtmlEntry[] = [];
  if (existsSync(resolve(root, 'index.html'))) {
    entries.push({ key: 'home', input: 'index.html', publicPath: 'index.html' });
  }
  for (const [folder, kind] of [['pages', 'page'], ['boards', 'board']] as const) {
    const parent = resolve(root, 'src', folder);
    if (!existsSync(parent)) continue;
    for (const dir of readdirSync(parent, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!dir.isDirectory() || !existsSync(resolve(parent, dir.name, 'index.html'))) continue;
      entries.push({
        key: `${kind}-${dir.name}`,
        input: `src/${folder}/${dir.name}/index.html`,
        publicPath: `${folder === 'boards' ? 'boards/' : ''}${dir.name}/index.html`,
      });
    }
  }
  return entries;
}

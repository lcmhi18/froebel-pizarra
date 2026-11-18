import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { discoverHtmlEntries } from '../config/html-entries.ts';

test('new standalone pages are discovered without editing the Vite config', () => {
  const root = mkdtempSync(join(tmpdir(), 'froebel-entries-'));
  try {
    for (const path of ['index.html', 'src/pages/profesor/index.html', 'src/pages/alumno/index.html', 'src/boards/otra/index.html', 'src/boards/sin-entrada/readme.md']) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), '<!doctype html>');
    }
    const entries = discoverHtmlEntries(root);
    assert.deepEqual(entries.map(entry => entry.publicPath), ['index.html', 'alumno/index.html', 'profesor/index.html', 'boards/otra/index.html']);
    assert.equal(new Set(entries.map(entry => entry.key)).size, entries.length);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('every source HTML has a built page and a matching clean public alias', () => {
  const entries = discoverHtmlEntries(process.cwd());
  assert(entries.length >= 4);
  for (const entry of entries) {
    const sourceOutput = resolve('dist', entry.input);
    const publicOutput = resolve('dist', entry.publicPath);
    assert(existsSync(sourceOutput), `Missing built HTML: ${sourceOutput}`);
    assert(existsSync(publicOutput), `Missing public HTML: ${publicOutput}`);
    assert.equal(readFileSync(publicOutput, 'utf8'), readFileSync(sourceOutput, 'utf8'));
    assert.match(readFileSync(publicOutput, 'utf8'), /\/assets\/[^" ]+\.js/);
  }
});

test('Cloudflare routes API before assets, while retaining SQLite migrations', () => {
  const config = JSON.parse(readFileSync('worker/wrangler.jsonc', 'utf8'));
  assert.equal(config.assets.directory, '../dist');
  assert.equal(config.assets.binding, 'ASSETS');
  assert.deepEqual(config.assets.run_worker_first, ['/api', '/api/*']);
  assert(config.migrations.some(m => m.new_sqlite_classes?.includes('Registry') && m.new_sqlite_classes?.includes('Room')));
  assert.equal(config.account_id, '373df7d753c05ace8818906faae9377f');
});

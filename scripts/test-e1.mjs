import { spawn } from 'node:child_process';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const workers = [];
const sockets = [];
let logs = '', browser;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function start(args) {
  const child = spawn(process.execPath, args, {
    windowsHide: true, stdio: 'pipe',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: '.e1-test/wrangler.log' },
  });
  workers.push(child);
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  return child;
}
async function waitForServer(url) {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(url); if (r.status < 500) return; } catch {}
    if (workers.some(child => child.exitCode !== null)) throw Error(`Server exited: ${logs}`);
    await pause(200);
  }
  throw Error(`Server timeout: ${logs}`);
}

try {
  await mkdir('.e1-test', { recursive: true });
  await mkdir('dist/api', { recursive: true });
  await writeFile('dist/api/e1-shadow.txt', 'STATIC_ASSET_MUST_NOT_SHADOW_API');
  start(['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--config', 'worker/wrangler.jsonc', '--ip', '127.0.0.1', '--port', '8787', '--var', 'LOCAL_TEACHER:true', '--var', 'ALLOWED_ORIGINS:http://127.0.0.1:5193,http://127.0.0.1:8787', '--persist-to', `.e1-test/state-${Date.now()}`]);
  start(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5193', '--strictPort']);
  await waitForServer('http://127.0.0.1:8787/');
  await waitForServer('http://127.0.0.1:5193/');

  for (const path of ['/', '/profesor/', '/alumno/', '/boards/prueba/', '/src/pages/profesor/index.html']) {
    const response = await fetch(`http://127.0.0.1:8787${path}`);
    assert.equal(response.status, 200, `Worker static route ${path}`);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    const references = [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.(?:js|css|webp))"/g)];
    assert(references.length > 0);
    for (const [, asset] of references) assert.equal((await fetch(`http://127.0.0.1:8787${asset}`)).status, 200, asset);
  }
  assert.equal((await fetch('http://127.0.0.1:8787/not-a-page')).status, 404);
  const shadow = await fetch('http://127.0.0.1:8787/api/e1-shadow.txt');
  assert.equal(shadow.status, 404);
  assert.deepEqual(await shadow.json(), { error: 'NOT_FOUND' });

  const created = await fetch('http://127.0.0.1:5193/api/rooms', { method: 'POST' });
  assert.equal(created.status, 200, 'Vite HTTP proxy');
  const { code, teacherToken } = await created.json();
  const ws = new WebSocket(`ws://127.0.0.1:5193/api/rooms/${code}/ws?role=teacher`);
  sockets.push(ws);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('WebSocket proxy timeout')), 10000);
    ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'auth', teacherToken })));
    ws.addEventListener('error', () => { clearTimeout(timer); reject(Error('WebSocket proxy failed')); });
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.type === 'snapshot') { clearTimeout(timer); resolve(); }
    });
  });
  ws.send(JSON.stringify({ type: 'close' }));
  console.log('PASS E1 HTTP: static HTML/assets and clean URLs from Wrangler; API priority; Vite HTTP + WebSocket proxy.');

  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  for (const origin of ['http://127.0.0.1:8787', 'http://127.0.0.1:5193']) {
    await page.goto(`${origin}/profesor/`);
    await page.getByRole('heading', { name: 'Tu clase, en un mismo lienzo.', exact: true }).waitFor();
    await page.goto(`${origin}/alumno/`);
    await page.getByRole('heading', { name: 'Entra a tu clase.', exact: true }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS E1 browser: professor/student render on built Worker and Vite clean routes; no console errors.');
} catch (error) {
  console.error(error);
  console.error(logs.slice(-8000));
  process.exitCode = 1;
} finally {
  for (const ws of sockets) try { ws.close(); } catch {}
  if (browser) await browser.close();
  for (const child of workers) child.kill();
  await unlink('dist/api/e1-shadow.txt').catch(() => {});
}

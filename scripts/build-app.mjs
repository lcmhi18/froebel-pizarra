import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const appPackage = resolve('app/package.json');
if (!existsSync(appPackage)) {
  console.log('app/ no está disponible: se omite su build; no se crea ni modifica esa carpeta.');
  process.exit(0);
}
const fromApp = createRequire(appPackage);
for (const name of ['react', 'react-dom']) {
  const pkg = JSON.parse(readFileSync(fromApp.resolve(`${name}/package.json`), 'utf8'));
  if (pkg.version !== '18.3.1') {
    console.error(`app/ requiere ${name} 18.3.1 aislado; se encontró ${pkg.version}. No se modifica app/.`);
    process.exit(1);
  }
}
const viteCli = resolve(dirname(fromApp.resolve('vite/package.json')), 'bin/vite.js');
const result = spawnSync(process.execPath, [viteCli, 'build', '--config', resolve('vite.app.config.ts')], {
  stdio: 'inherit', windowsHide: true,
});
process.exit(result.status ?? 1);

import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const fromApp=createRequire(resolve('app-live/package.json'));
for(const name of ['react','react-dom']){
 const pkg=JSON.parse(readFileSync(fromApp.resolve(`${name}/package.json`),'utf8'));
 if(pkg.version!=='18.3.1')throw new Error(`La página Konva requiere ${name} 18.3.1 aislado; se encontró ${pkg.version}.`);
}
const cli=resolve(dirname(fromApp.resolve('vite/package.json')),'bin/vite.js');
const result=spawnSync(process.execPath,[cli,'build','--config','vite.konva.config.ts'],{stdio:'inherit',windowsHide:true});
process.exit(result.status??1);

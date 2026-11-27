import ts from 'typescript';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function compileLiveTests(){
 for(const file of ['course-navigation','boards/manifest','shared/permissions','shared/transport','shared/messages','shared/protocol','shared/operations','live/engine','boards/prueba/adapter','live/connection','live/navigation','boards/recta-numerica/adapter','boards/geometria/adapter','boards/geometria/animation','boards/geometria/validity','boards/geometria/image-source']){
  const out=`.live-test/unit/${file}.js`;mkdirSync(resolve(out,'..'),{recursive:true});
  const text=ts.transpileModule(readFileSync(`src/${file}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(@shared\/[^']+|\.[^']+)'/g,(_all,path)=>`from '${path.startsWith('@shared/')?'../../shared/'+path.slice(8):path}${path.endsWith('.js')?'':'.js'}'`);
  writeFileSync(out,text);
 }
 for(const name of ['engine','config','drawing']){const path=`boards/operaciones-combinadas/${name}.js`;mkdirSync(resolve('.live-test/unit',path,'..'),{recursive:true});writeFileSync(resolve('.live-test/unit',path),readFileSync(resolve('src',path)));}
 for(const path of ['boards/taller-aritmetico/engine.js','boards/fracciones/engine.js','boards/fracciones/model.js','boards/fracciones/drawing-model.js','boards/intervalos/model.js','boards/intervalos/engine.js','boards/intervalos/shapes.js','boards/intervalos/images.js','boards/intervalos/text.js','shared/note-image.js','boards/algebra-completa/engine.js']){mkdirSync(resolve('.live-test/unit',path,'..'),{recursive:true});writeFileSync(resolve('.live-test/unit',path),readFileSync(resolve('src',path)));}
}

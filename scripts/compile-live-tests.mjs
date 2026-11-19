import ts from 'typescript';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function compileLiveTests(){
 for(const file of ['boards/manifest','shared/messages','shared/protocol','shared/operations','live/engine','boards/prueba/adapter','live/connection','live/navigation']){
  const out=`.live-test/unit/${file}.js`;mkdirSync(resolve(out,'..'),{recursive:true});
  const text=ts.transpileModule(readFileSync(`src/${file}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(@shared\/[^']+|\.[^']+)'/g,(_all,path)=>`from '${path.startsWith('@shared/')?'../../shared/'+path.slice(8):path}.js'`);
  writeFileSync(out,text);
 }
}

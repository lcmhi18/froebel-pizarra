import ts from 'typescript';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
for(const file of ['shared/protocol','live/engine']){
  const out=`.live-test/unit/${file}.js`;mkdirSync(resolve(out,'..'),{recursive:true});
  const text=ts.transpileModule(readFileSync(`src/${file}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("'../shared/protocol'","'../shared/protocol.js'");writeFileSync(out,text);
}
const {RoomEngine}=await import(pathToFileURL(resolve('.live-test/unit/live/engine.js')));
const {emptyState,applyOp}=await import(pathToFileURL(resolve('.live-test/unit/shared/protocol.js')));
class Adapter{state=emptyState();localKeys=['tool','color'];listeners=[];getState=()=>this.state;setState=s=>{this.state=structuredClone(s);};onChange=cb=>{this.listeners.push(cb);return()=>{};};change(fn,final=true){fn(this.state);this.listeners.forEach(cb=>cb(final));}}
const a=new Adapter(),b=new Adapter(),queue=[],canonical=emptyState();let seq=0;
const ea=new RoomEngine(a,ops=>queue.push(...ops)),eb=new RoomEngine(b,ops=>queue.push(...ops));ea.identity('teacher');eb.identity('student');
function deliver(){while(queue.length){const op=queue.shift();op.seq=++seq;applyOp(canonical,op);ea.receive([op]);eb.receive([op]);}}
a.change(s=>{s.items['teacher:1']={x:10,y:10,color:'#ff0000'};s.order.push('teacher:1');});deliver();assert.equal(b.state.items['teacher:1'].color,'#ff0000');
// Remote additions during an in-progress drag must never enter the dragger's undo stack.
a.change(s=>{s.items['teacher:1'].x=20;},false);
b.change(s=>{s.items['student:1']={text:'Texto del alumno'};s.order.push('student:1');});deliver();
a.change(s=>{s.items['teacher:1'].x=30;});deliver();ea.undo();deliver();assert.equal(a.state.items['teacher:1'].x,10);assert.equal(a.state.items['student:1'].text,'Texto del alumno');assert.deepEqual(a.state,b.state);
// Undo of one property cannot overwrite a later remote edit of that same property.
a.change(s=>{s.items['teacher:1'].x=40;});deliver();b.change(s=>{s.items['teacher:1'].x=90;});deliver();ea.undo();deliver();assert.equal(a.state.items['teacher:1'].x,90);
// Clearing another user's object is reversible by the user who cleared it.
a.change(s=>{s.items={};s.order=[];});deliver();ea.undo();deliver();assert.equal(Object.values(a.state.items).some(x=>x.text==='Texto del alumno'),true);assert.deepEqual(a.state,b.state);
// UI fields are never transmitted.
a.change(s=>{s.fields.tool='pencil';s.fields.color='#00ff00';});assert.equal(queue.length,0);
ea.dispose();eb.dispose();console.log('PASS engine: concurrent drag/remote addition, per-property undo guard, clear/undo remote objects, convergence, local UI exclusion.');

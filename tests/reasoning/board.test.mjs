import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../public/boards/razonamiento/index.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const data=JSON.parse(source.match(/const DATA=([^\r\n]+);/)[1]);
function harness(){
 const elements=new Map();
 const element=id=>{
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',style:{},scrollHeight:100,clientHeight:560,scrollTop:0,classList:{toggle(){}},addEventListener(){},querySelectorAll:()=>[],setAttribute(){},getScreenCTM:()=>({inverse:()=>({})})});
  return elements.get(id);
 };
 const context=vm.createContext({console,Math,Image:class{decode(){return Promise.resolve()}},setTimeout:()=>0,clearTimeout(){},document:{getElementById:element,body:element('body'),addEventListener(){}},window:{addEventListener(){}},requestAnimationFrame:()=>0});
 vm.runInContext(source,context,{timeout:3000});
 return {run:code=>JSON.parse(vm.runInContext(`JSON.stringify((()=>{${code}})())`,context,{timeout:3000})??'null'),element};
}
test('standalone lesson has 26 exercises, 64 embedded WebP images and no external script',()=>{
 assert.equal(data.ex.length,26);assert.equal(Object.keys(data.im).length,64);
 assert(!/<script[^>]+src=/i.test(html));
 for(const image of Object.values(data.im)){
  const bytes=Buffer.from(image.b64,'base64');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
});
test('all 31 pages render, including every exercise with all solution steps',()=>{
 const h=harness();assert.equal(h.run('return PAGES.length'),31);
 for(let i=0;i<31;i++){
  h.run(`go(${i});if(pg().type==='ex'){pg().step=pg().e.steps.length;content();}return null`);
  assert(h.element('C').innerHTML.length>100);
  if(i>=5)assert(h.element('C').innerHTML.includes('Respuesta:'));
 }
});
test('every correct answer is accepted, incorrect/empty values are rejected, exercise 5 accepts 12',()=>{
 const h=harness();
 for(let i=5;i<31;i++){
  assert(h.run(`go(${i});pg().ans=String(pg().e.val).replace('.',',')+' cm';check();return pg().msg`).includes('Correcto'));
  assert(h.run(`pg().ans=String(pg().e.val+1);check();return pg().msg`).includes('inténtalo'));
  assert(h.run(`pg().ans='';check();return pg().msg`).includes('Escribe'));
 }
 assert.equal(data.ex[4].val,12);
});
test('drawings and undo remain independent across exercise pages',()=>{
 const h=harness();const result=h.run(`go(5);snap();pg().items.push({t:'t',x:20,y:30,s:24,c:'#111111',txt:'Mi solución'});go(6);snap();pg().items.push({t:'t',x:20,y:30,s:24,c:'#111111',txt:'Otra solución'});go(5);const first=pg().items[0].txt;undo();go(6);return {first,second:pg().items[0].txt,firstCount:PAGES[5].items.length}`);
 assert.deepEqual(result,{first:'Mi solución',second:'Otra solución',firstCount:0});
});

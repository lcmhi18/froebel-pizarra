import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function harness(){
 const elements=new Map();let serial=0,width=1000,height=560;
 const element=id=>{
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},dataset:{},classList:{toggle(){}},addEventListener(){},setAttribute(){},getBoundingClientRect(){return {width,height,left:0,top:0}}});
  return elements.get(id);
 };
 const context=vm.createContext({console,Math,structuredClone,crypto:{randomUUID:()=>`test-${++serial}`},window:{addEventListener(){}},document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){},body:element('body'),documentElement:element('html')},putHTML:(el,html)=>el.innerHTML=html});
 const source=readFileSync(new URL('../../src/boards/aritmetica/runtime.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/,'').replace('export const arithmetic=','const arithmetic=');
 vm.runInContext(source,context,{timeout:2000});
 return {resize(w,h){width=w;height=h;vm.runInContext('draw()',context)},run:code=>JSON.parse(vm.runInContext(`JSON.stringify((()=>{${code}})())`,context,{timeout:2000})??'null'),html:id=>element(id).innerHTML};
}

test('el lienzo y el balde cubren pantallas anchas sin deformar las figuras ni cambiar sus datos',()=>{
 const h=harness();const before=h.run(`make('c');V.fl=[{r:0,i:[],c:'#2563eb'}];return V.items`);
 h.resize(1860,530);
 const paper=h.run('return paper');
 assert(Math.abs(paper.w/paper.h-1860/530)<1e-9);
 assert(paper.w>1900);assert(paper.x<0);
 assert(h.html('#vs').includes(`width="${paper.w}" height="${paper.h}"`));
 assert.deepEqual(h.run('return V.items'),before);
 h.run(`act('tab','prod')`);assert.deepEqual(h.run('return paper'),{x:0,y:0,w:1000,h:560});
});

for(const [kind,count] of [['v2',3],['v3',4],['c',1],['r',1],['d',1],['g',1],['x',1],['o',1]])test(`creación y dibujo de ${kind}`,()=>{
 const h=harness();const items=h.run(`make('${kind}');return V.items`);
 assert.equal(items.length,count);assert.equal(new Set(items.map(i=>i.id)).size,count);
 assert(!/NaN|Infinity|undefined/.test(h.html('#vs')));
});

test('el texto admite líneas vacías, conserva el escape y se puede seleccionar por la última línea',()=>{
 const h=harness();const result=h.run(`const text={t:'t',x:300,y:100,s:36,txt:'24 + x = 25\\n\\nx = <1>',c:'#111111'};add(text);draw();return {box:bb(text),hit:hit(text,{x:300,y:190}),context:ctxHTML()}`);
 assert(result.box.h>120);assert.equal(result.hit,true);
 assert.equal((h.html('#vs').match(/<tspan /g)||[]).length,3);
 assert(h.html('#vs').includes('y="190"'));
 assert(h.html('#vs').includes('x = &lt;1&gt;'));
 assert(result.context.includes('<textarea id="txin"'));
});

test('tabla configurable conserva valores horizontales y verticales y completa todos los pares al solicitarlo',()=>{
 const h=harness();const item=h.run(`make('g',{rows:2,cols:3,hLabels:['a','b','c'],vLabels:['1','2'],pairs:false});return V.items[0]`);
 assert.equal(item.rows,2);assert.equal(item.cols,3);assert.equal(item.pairs,false);
 assert(!h.html('#vs').includes('(a; 1)'));
 h.run(`act('pairs');return null`);
 for(const x of ['a','b','c'])for(const y of ['1','2'])assert(h.html('#vs').includes(`(${x}; ${y})`));
 const copied=h.run(`dup();return V.items[1]`);assert.deepEqual(copied.hLabels,['a','b','c']);assert.equal(copied.pairs,true);
});
test('plano cartesiano usa las dimensiones y etiquetas ingresadas sin interpretar HTML',()=>{
 const h=harness();const item=h.run(`make('x',{rows:2,cols:4,hLabels:['2','4','6','<8>'],vLabels:['x','y']});return V.items[0]`);
 assert.equal(item.cols,4);assert.equal(item.rows,2);assert(h.html('#vs').includes('&lt;8&gt;'));
 assert(h.html('#vs').includes('>y</text>'));assert(!/NaN|Infinity/.test(h.html('#vs')));
});

for(const type of ['g','x'])test(`letras de ${type}: tamaño y negrita independientes del grosor del dibujo`,()=>{
 const h=harness();h.run(`make('${type}',{rows:2,cols:2,hLabels:['a','b'],vLabels:['1','2'],pairs:true});return null`);
 assert(h.html('#vs').includes('font-size="30"'));assert(h.html('#vs').includes('font-weight="700"'));
 const result=h.run(`const before=clone(sel());adj('fs:+');act('bold');return {before,after:sel(),controls:ctxHTML()}`);
 assert.equal(result.after.fs,34);assert.equal(result.after.bold,false);assert.equal(result.after.sw,result.before.sw);
 assert.deepEqual(result.after.hLabels,result.before.hLabels);assert(h.html('#vs').includes('font-weight="400"'));
 assert(result.controls.includes('A+ Letra'));assert(result.controls.includes('aria-pressed="false"'));
 h.run(`adj('fs:-');act('bold');return null`);assert(h.html('#vs').includes('font-size="30"'));assert(h.html('#vs').includes('font-weight="700"'));
});
test('completar pares en la vista de tabla rellena encabezados y producto completo',()=>{
 const h=harness();const result=h.run(`P.eA='a;b';P.eB='1;2;3';P.view='tabla';act('prodPairs');return {tb:P.tb,th:P.th,html:cmProd()}`);
 assert.equal(Object.keys(result.tb).length,6);assert.equal(result.tb['1,2'],'(b; 3)');assert.deepEqual(result.th,{a:['a','b'],b:['1','2','3']});
 assert(result.html.includes('Completar pares'));
});
test('duplicar conserva el original y borrar elimina las regiones vinculadas',()=>{
 const h=harness();const result=h.run(`make('c');const first=clone(V.items[0]);V.fl=[{r:0,i:[first.id],c:'#2563eb'}];dup();del();V.sel=first.id;del();return {items:V.items,regions:V.fl}`);
 assert.deepEqual(result,{items:[],regions:[]});
});
test('las cuatro pestañas conservan dibujos y contenido',()=>{
 const h=harness();const result=h.run(`make('c');for(const t of ['prod','dv','rev','v'])act('tab',t);return {count:V.items.length,eA:P.eA,tab}`);
 assert.deepEqual(result,{count:1,eA:'3; 5; 8',tab:'v'});
});
test('producto cartesiano ofrece las cuatro representaciones sin valores no finitos',()=>{
 const h=harness();for(const view of ['lista','tabla','cart','sag']){
  const html=h.run(`P.view='${view}';return cmProd()`);assert(html.length>100);assert(!/NaN|Infinity/.test(html));
 }
 assert.equal(h.run(`P.th={a:['3'],b:['y']};return cellVal(0,0,['3'],['y'])`),'(3; y)');
 assert.equal(h.run(`P.tb['0,0']='respuesta';return cellVal(0,0,['3'],['y'])`),'respuesta');
});
test('intercambio restablece relaciones y conserva los conjuntos escritos',()=>{
 const h=harness();assert.deepEqual(h.run(`P.eA='a;b';P.eB='1;2';P.tb['0,0']='x';act('swap');return {a:P.eA,b:P.eB,tb:P.tb}`),{a:'1;2',b:'a;b',tb:{}});
});
test('divisiones y al revés escapan texto ingresado',()=>{
 const h=harness();assert(h.run(`P.rev='<img src=x onerror=alert(1)>';return cmRev()`).includes('&lt;img'));
 for(const n of [1,4,8])assert(h.run(`P.ds=${n};return cmDv()`).includes('data-f="dv"'));
});

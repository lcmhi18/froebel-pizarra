import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../public/boards/razonamiento/index.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const data=JSON.parse(source.match(/const DATA=([^\r\n]+);/)[1]);
function harness(){
 const elements=new Map(),events=new Map();
 let created=0;const selection={rangeCount:0,anchorNode:{inBoard:true},focusNode:{inBoard:true},removeAllRanges(){this.rangeCount=0;this.cleared=true}};
 const listen=(id,type,fn)=>{const key=id+':'+type;events.set(key,[...(events.get(key)||[]),fn]);};
 const element=id=>{
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',style:{},scrollHeight:100,clientHeight:560,scrollTop:0,classList:{toggle(){}},appendChild(){},remove(){},focus(){},contains:node=>!!node?.inBoard,__emit(type,event){for(const fn of events.get(id+':'+type)||[])fn(event)},addEventListener:(type,fn)=>listen(id,type,fn),setPointerCapture(){throw Error('Capture unavailable in this test')},querySelectorAll:()=>[],setAttribute(){},getScreenCTM:()=>({a:1,d:1,e:0,f:0,inverse:()=>({})})});
  return elements.get(id);
 };
 const context=vm.createContext({console,Math,DOMPoint:class{constructor(x,y){this.x=x;this.y=y}matrixTransform(){return this}},Image:class{decode(){return Promise.resolve()}},setTimeout:()=>0,clearTimeout(){},document:{createElement:type=>type==='canvas'?{getContext:()=>({getImageData:()=>({data:new Uint8ClampedArray(2000*1120*4)})})}:element('created-'+ ++created),getElementById:element,body:element('body'),addEventListener:(type,fn)=>listen('document',type,fn)},window:{getSelection:()=>selection,addEventListener:(type,fn)=>listen('window',type,fn)},requestAnimationFrame:()=>0});
 vm.runInContext(source,context,{timeout:3000});
 return {selection,selectStart(editable=false){const e={target:{closest:selector=>selector.startsWith('input')?editable:true},preventDefault(){this.prevented=true}};for(const fn of events.get('document:selectstart')||[])fn(e);return e},pointer(type,x,y,extra={}){const event={clientX:x,clientY:y,pointerId:7,button:0,shiftKey:false,preventDefault(){this.prevented=true},...extra};for(const fn of events.get((type==='pointerdown'||type==='dragstart'?'sv':'window')+':'+type)||[])fn(event);return event;},run:code=>JSON.parse(vm.runInContext(`JSON.stringify((()=>{${code}})())`,context,{timeout:3000})??'null'),async runAsync(code){return JSON.parse(await vm.runInContext(`(async()=>{${code}})().then(value=>JSON.stringify(value))`,context,{timeout:3000}))},element};
}

test('drawing clears existing board text selection and blocks new selection while answer fields stay editable',()=>{
 const h=harness();h.selection.rangeCount=1;h.pointer('pointerdown',10,20);
 assert.equal(h.selection.cleared,true);assert.equal(h.selectStart().prevented,true);assert(!h.selectStart(true).prevented);
 assert(html.includes('id="drawing-hit-plane"'));assert(html.includes('#C,#C *{pointer-events:none!important'));
});
test('move and eraser act on drawn objects and their gestures can be undone',()=>{
 const h=harness();h.run(`pg().items.push({t:'t',x:50,y:80,s:24,c:'#111111',txt:'Nota'});tool='m';return null`);
 h.pointer('pointerdown',55,75);h.pointer('pointermove',85,105);h.pointer('pointerup',85,105);
 assert.deepEqual(h.run('return [pg().items[0].x,pg().items[0].y]'),[80,110]);
 h.run(`tool='e';return null`);h.pointer('pointerdown',85,105);h.pointer('pointerup',85,105);
 assert.equal(h.run('return pg().items.length'),0);assert.equal(h.run('undo();return pg().items[0].txt'),'Nota');
 assert.deepEqual(h.run('undo();return [pg().items[0].x,pg().items[0].y]'),[50,80]);
});
test('text tool commits with Enter and cancels with Escape',()=>{
 const h=harness();h.run(`tool='t';return null`);h.pointer('pointerdown',50,80);
 assert.equal(h.run(`TI.i.value='Mi texto';TI.i.__emit('keydown',{key:'Enter',stopPropagation(){}});return pg().items[0].txt`),'Mi texto');
 h.pointer('pointerdown',100,120);assert.equal(h.run(`TI.i.value='No guardar';TI.i.__emit('keydown',{key:'Escape',stopPropagation(){}});return pg().items.length`),1);
});
test('paint fills a closed region, replaces its color and paints a line separately; erasing is undoable',async()=>{
 const h=harness();const result=await h.runAsync(`
 const raw=new Uint8Array(CW*CH);for(let i=44;i<=156;i++){raw[44*CW+i]=1;raw[156*CW+i]=1;raw[i*CW+44]=1;raw[i*CW+156]=1}
 BC={raw,dil:dil(raw,2)};CUR={cards:[{x:20,y:20,w:60,h:60}],imgs:[{k:'e1'}]};
 col='#e03e3e';await bucket(50,50);const first=pg().items.length;
 col='#2563eb';await bucket(50,50);const replaced=pg().items.length,color=pg().items[0].c;
 await bucket(50,22);const line=pg().items.some(it=>it.k==='ln'),count=pg().items.length;
 drag={k:'e',s:0};erase(50,50);const erased=pg().items.length;undo();return {first,replaced,color,line,count,erased,restored:pg().items.length};
 `);
 assert.deepEqual(result,{first:1,replaced:1,color:'#2563eb',line:true,count:2,erased:1,restored:2});
});

for(const [tool,highlight] of [['p',false],['h',true]])test(`${tool}: drag draws a continuous stroke even when pointer capture is unavailable`,()=>{
 const h=harness();h.run(`tool='${tool}';return null`);
 assert.equal(h.pointer('pointerdown',10,20).prevented,true);
 h.pointer('pointermove',40,50);h.pointer('pointermove',90,80);
 h.pointer('pointerup',90,80);
 const items=h.run('return pg().items');assert.equal(items.length,1);assert.deepEqual(items[0].pts,[[10,20],[40,50],[90,80]]);assert.equal(items[0].hl,highlight);
 assert(h.element('L').innerHTML.includes('L90.0 80.0'));
 assert(h.run('undo();return pg().items').length===0);
});
test('a second pointer cannot change a stroke; cancel releases it and native image dragging is blocked',()=>{
 const h=harness();h.pointer('pointerdown',10,20);h.pointer('pointermove',30,40,{pointerId:8});h.pointer('pointercancel',10,20);h.pointer('pointermove',90,80);
 assert.deepEqual(h.run('return pg().items[0].pts'),[[10,20]]);
 assert.equal(h.pointer('dragstart',0,0).prevented,true);
 h.pointer('pointerdown',50,60);h.pointer('pointermove',80,90);h.pointer('pointerup',80,90);
 assert.equal(h.run('return pg().items.length'),2);
});
test('line and arrow tools update their endpoint while dragging',()=>{
 for(const tool of ['l','a']){
  const h=harness();h.run(`tool='${tool}';snp=0;return null`);h.pointer('pointerdown',20,30);h.pointer('pointermove',100,80,{shiftKey:true});h.pointer('pointerup',100,80);
  const item=h.run('return pg().items[0]');assert.equal(item.x2,100);assert.equal(item.y2,30);assert.equal(item.ar,tool==='a');
 }
});
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

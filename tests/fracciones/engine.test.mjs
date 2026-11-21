import test from 'node:test';
import assert from 'node:assert/strict';
import {rat,decimalFraction,fractionDecimal,operationLesson,decimalLesson,FIGURES,weightsFor,chooseParts,power} from '../../src/boards/fracciones/engine.js';
import {initialLesson,validFractionLesson} from '../../src/boards/fracciones/model.js';
import {regionsFor} from '../../src/boards/fracciones/figures.js';
import {validFractionDrawing,transformItem,itemBounds} from '../../src/boards/fracciones/drawing-model.js';
const operand=(n,d=1,exp=1)=>({type:'fraction',n,d,exp});
test('exact, pure and mixed repeating decimals produce reduced exact fractions',()=>{
 for(const [text,n,d] of [['0,72',18,25],['0,(35)',35,99],['1,2(3)',37,30],['0,1(6)',1,6],['-1,2(3)',-37,30],['-2',-2,1],['0,(9)',1,1]])assert.deepEqual(decimalFraction(text),rat(n,d));
 assert.throws(()=>decimalFraction('0,(x)'));assert.throws(()=>decimalFraction('1/3'));
});
test('decimal expansion round-trips every denominator supported in the converter',()=>{
 for(let d=1;d<=99;d++)for(const n of [0,1,13,-23,999]){const x=rat(n,d),v=fractionDecimal(x);assert.equal(v.truncated,false);const raw=v.sign+v.whole+(v.nonrepeat||v.repeat?','+v.nonrepeat:'')+(v.repeat?'('+v.repeat+')':'');assert.deepEqual(decimalFraction(raw),x);}
});
test('operations respect powers and multiplication before addition, left-to-right division',()=>{
 assert.deepEqual(operationLesson([operand(1,2),operand(1,3),operand(1,6)],['+','+']).result,rat(1));
 assert.deepEqual(operationLesson([operand(1,2),operand(3,4),operand(2)],['+','*']).result,rat(2));
 assert.deepEqual(operationLesson([operand(8),operand(2),operand(2)],['/','*']).result,rat(8));
 assert.deepEqual(operationLesson([operand(2,3,2),{type:'mixed',n:1,d:2,whole:1,exp:1},{type:'decimal',decimal:'0,(3)',exp:1}],['+','*']).result,rat(17,18));
 assert.deepEqual(power(rat(999,97),8),rat(999n**8n,97n**8n));
 assert.deepEqual(power(rat(2,3),-2),rat(9,4));
});
test('undefined powers and division by zero are reported before showing a result',()=>{
 assert.throws(()=>power(rat(0),0),/no está definido/);assert.throws(()=>operationLesson([operand(1),operand(0)],['/']),/cero/);assert.throws(()=>power(rat(0),-1),/Cero/);
});
test('conversion lessons expose an exact final fraction and identify repeating expansions',()=>{
 for(const decimal of ['0,72','0,(35)','1,2(3)','-1,25','-2']){const l=decimalLesson('toFraction',{decimal});assert.deepEqual(l.result,decimalFraction(decimal));assert.equal(l.steps.at(-1).answer,true);}
 assert.equal(decimalLesson('toDecimal',{n:1,d:6}).steps[1].parts[0].decimal.repeat,'6');
});
test('the ten figures have correct region counts and weighted areas',()=>{
 assert.equal(FIGURES.length,10);
 for(const f of FIGURES){const d=f.d||8,r=regionsFor(f.id,d);assert.equal(r.length,weightsFor(f.id,d).length);assert.equal(r.reduce((n,x)=>n+x.weight,0),d);}
 for(const type of ['pizza','circle','donut'])assert.equal(regionsFor(type,1).length,1);
 const regions=regionsFor('weighted',36),areas=regions.map(r=>r.tag==='rect'?r.attrs.width*r.attrs.height:110*105/2);areas.forEach((area,i)=>assert.ok(Math.abs(area/areas.reduce((a,b)=>a+b,0)-regions[i].weight/36)<1e-10));
});
test('weighted 13/36 can be selected exactly, improper fractions span four whole figures',()=>{
 const weights=weightsFor('weighted',36),choice=chooseParts(weights,13);assert.equal(choice.total,13);assert.equal(choice.indices.reduce((n,i)=>n+weights[i],0),13);assert.equal(chooseParts(weights,1).total,0);assert.equal(chooseParts(Array(4).fill(weights).flat(),143).total,142);
});
test('shared lessons reject inconsistent numerators, out-of-bounds controls and extra payloads',()=>{
 assert.equal(validFractionLesson(initialLesson()),true);
 for(const mutate of [s=>s.parts.n++,s=>s.parts.d=0,s=>s.parts.colors[0]='url(x)',s=>s.parts.scale=20,s=>s.operations.operands[0].exp=9,s=>s.decimal.d=0,s=>s.extra='bad']){const s=initialLesson();mutate(s);assert.equal(validFractionLesson(s),false);}
 const s=initialLesson();s.parts.figure='weighted';s.parts.d=36;s.parts.colors=Array(36).fill(null);const choice=chooseParts(Array(4).fill(weightsFor('weighted',36)).flat(),13);choice.indices.forEach(i=>s.parts.colors[i]='original');s.parts.n=13;assert.equal(validFractionLesson(s),true);
});
test('annotations validate multiline superscripts, images, fractions and reject unsafe bounds',()=>{
 const text={t:'text',runs:[{text:'x',sup:false},{text:'2',sup:true},{text:' ≥ 3\nOtra línea',sup:false}],fontSize:28,c:'#123abc',x1:.1,y1:.1,x2:.6,y2:.8};
 assert.equal(validFractionDrawing([text,{t:'fraction',n:'-3',d:'8',fontSize:30,c:'#123abc',x1:.2,y1:.2,x2:.4,y2:.5}]),true);
 for(const item of [{...text,x2:2},{...text,runs:[{text:'x',sup:'yes'}]},{...text,t:'image',src:'https://example.com/a.png'},{...text,t:'fraction',n:'3',d:'0'}])assert.equal(validFractionDrawing([item]),false);
 const stroke={t:'stroke',p:[[.1,.2],[.3,.4]],c:'#123abc',w:4};assert.deepEqual(itemBounds(transformItem(stroke,{left:.2,top:.3,right:.6,bottom:.8})),{left:.2,top:.3,right:.6,bottom:.8});
});
test('resizing an ascending line preserves its endpoint direction',()=>{
 const line={t:'line',x1:.1,y1:.8,x2:.5,y2:.2,c:'#123abc',w:3},next=transformItem(line,{left:.2,right:.8,top:.1,bottom:.9});assert.equal(next.y1,.9);assert.equal(next.y2,.1);assert.equal(validFractionDrawing([next]),true);
});

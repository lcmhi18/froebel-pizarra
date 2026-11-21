import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkIv,parseIv,parseIneq,ivR,rU,rI,rD,rC,TOP,solve} from '../../src/boards/intervalos/engine.js';
import {validLesson} from '../../src/boards/intervalos/model.js';
const has=(r,x)=>r.some(([a,b])=>x>=a&&x<=b);
for(let topic=0;topic<TOP.length;topic++)for(const example of TOP[topic].ex)test(example,()=>{const result=solve(topic,example);assert.equal(result.length,5);assert.ok(result[2][0].includes('svg')||result[3][0].includes('svg'));});
test('integer interval operations agree with enumerated sets, for all endpoint closures',()=>{
 for(let a=-3;a<=2;a++)for(let b=a;b<=3;b++)for(const left of [false,true])for(const right of [false,true]){
 const A=ivR(mkIv(a,b,left,right)),B=ivR(mkIv(-1,2,false,true));
 for(let n=-6;n<=6;n++){
 const x=n>a&&n<b||left&&n===a&&n<=b||right&&n===b&&n>=a;
 // Equal endpoints require both sides to include their common point.
 const expected=a===b?left&&right&&n===a:x;
 assert.equal(has(A,n),expected);
 assert.equal(has(rU(A,B),n),has(A,n)||has(B,n));assert.equal(has(rI(A,B),n),has(A,n)&&has(B,n));assert.equal(has(rD(A,B),n),has(A,n)&&!has(B,n));assert.equal(has(rC(A),n),!has(A,n));
 }
 }
});
test('infinite bounds, descending inequalities and empty sets',()=>{
 assert.deepEqual(ivR(parseIv('⟨-∞;4]')),[[-Infinity,4]]);
 assert.deepEqual(ivR(parseIneq('6≥x>-3')),[[-2,6]]);
 assert.deepEqual(ivR(parseIv('⟨2;2⟩')),[]);
 assert.deepEqual(rC([[-Infinity,Infinity]]),[]);assert.deepEqual(rC([]),[[-Infinity,Infinity]]);
 assert.throws(()=>parseIv('[∞;3]'));assert.throws(()=>parseIv('[3;-∞]'));
});
for(const invalid of ['<img src=x onerror=alert(1)>','[4;1]','[1.5;4]','[0;999999999999]','A∪B','[1;4','[1;4] , B = [3;8] , A ∪ B ∩ A'])test('rejects '+invalid,()=>assert.throws(()=>solve(0,invalid)));
export const lesson={expression:'[−5; 3⟩',topic:0,shown:3,prof:true,work:'<div>Mi paso</div>',strokes:[{c:'#123abc',w:5,a:1,p:[[.1,.2],[.3,.4]]}],graph:{rows:[{a:-5,b:3,L:'c',R:'o',on:true}],operation:'n'},graphInk:[],formulas:[]};
test('room lesson validates content, bounds and strokes',()=>{
 assert.equal(validLesson(lesson),true);
 for(const mutate of [x=>x.topic=8,x=>x.shown=99,x=>x.work='x'.repeat(8001),x=>x.graph.rows[0].a=100,x=>x.graph.rows[0].b=1.5,x=>x.strokes[0].c='url(x)',x=>x.strokes[0].p=[[Infinity,0]],x=>x.graph.operation='unknown',x=>x.extra=true]){const x=structuredClone(lesson);mutate(x);assert.equal(validLesson(x),false);}
});
test('a named set uses x in its inequality, not the set name as a scalar',()=>{const rows=solve(0,'A = ⟨−3; 6]');assert.ok(rows[1][0].includes('−3 < x ≤ 6'));assert.ok(rows.at(-1)[0].includes('n(A)'));});

import {resolveExercise} from '../../src/boards/intervalos/engine.js';
test('automatically chooses the actual operation from every initial tab',()=>{
 for(let initial=0;initial<3;initial++)for(let topic=0;topic<TOP.length;topic++)for(const example of TOP[topic].ex){const got=resolveExercise(example,initial);assert.equal(got.topic,topic);assert.deepEqual(got.steps,solve(topic,example));}
});
test('undefined operands report their actual cause instead of an unrelated single interval warning',()=>{
 assert.throws(()=>resolveExercise('A ∪ B',0),e=>String(e).includes('Defínelo'));
 assert.throws(()=>resolveExercise("A = [1;4] , A ∪ C",0),e=>String(e).includes('C')&&String(e).includes('Defínelo'));
});
test('bare operations use named active editor graphs; explicit definitions take precedence',()=>{
 const graph={rows:[{a:1,b:4,L:'c',R:'c',on:true},{a:3,b:8,L:'c',R:'c',on:true}]};
 assert.ok(resolveExercise('A ∩ B',0,graph).steps.at(-1)[0].includes('{3; 4}'));
 assert.ok(resolveExercise('A = [0;3] , A ∩ B',0,graph).steps.at(-1)[0].includes('{3}'));
 assert.throws(()=>resolveExercise('A ∪ C',0,graph),e=>String(e).includes('C'));
});
test('the screenshot expression explains reversed bounds instead of changing topics',()=>{
 assert.throws(()=>resolveExercise('[−5;3⟩∪[2,1>',0),e=>String(e).includes('empieza en 2 y termina en 1'));
});

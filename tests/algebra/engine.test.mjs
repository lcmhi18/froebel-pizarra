import {test}from'node:test';
import assert from'node:assert/strict';
import{TOP,solve,norm,toSup,pm,fm}from'../../src/boards/algebra-completa/engine.js';
// Independent numeric parser for test expressions, including implicit multiplication.
function evaluate(raw,values){
 let s=norm(raw.replace(/<span class="fr"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g,'(($1)/($2))').replace(/<[^>]*>/g,'').split('=')[0]);
 const tokens=s.match(/\d+|[a-z]|[()+*/^\-]/g)||[];let at=0;
 function atom(){const t=tokens[at++];if(t==='-')return -atom();if(t==='+')return atom();if(t==='('){const n=sum();assert.equal(tokens[at++],')');return n;}if(/^\d+$/.test(t||''))return Number(t);assert(t in values,'Unknown '+t);return values[t];}
 function power(){let n=atom();if(tokens[at]==='^'){at++;n=n**power();}return n;}
 function product(){let n=power();while(at<tokens.length){const op=tokens[at];if(op==='*'||op==='/'){at++;const b=power();n=op==='*'?n*b:n/b;}else if(op==='('||/^[a-z0-9]+$/.test(op||''))n*=power();else break;}return n;}
 function sum(){let n=product();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++],b=product();n=op==='+'?n+b:n-b;}return n;}
 const n=sum();assert.equal(at,tokens.length);return n;
}
for(let topic=0;topic<TOP.length;topic++)for(const example of TOP[topic].ex)test(TOP[topic].n+': '+example,()=>{
 const steps=solve(topic,example);assert(steps.length>=4);assert(steps.every(row=>row.length===2&&row.every(v=>typeof v==='string')));
 for(const offset of [1,2,3]){const values=Object.fromEntries('abcdefghijklmnopqrstuvwxyz'.split('').map((v,i)=>[v,1+(i+offset)%4]));const original=evaluate(example,values),result=evaluate(steps.at(-1)[0],values);assert(Math.abs(original-result)<=1e-9*Math.max(1,Math.abs(original)),steps.at(-1)[0]);}
});
test('superscripts, zero exponents and the required grouping result are preserved',()=>{assert.equal(norm('a¹² × a³'),'a^12*a^3');assert.equal(toSup('x^12'),'x¹²');assert.equal(fm(pm('x^0')),'1');assert.equal(solve(3,'24m^3+30m^2+20m+25').at(-1)[0],'(4m + 5)(6m^2 + 5)');assert.equal(solve(5,'(4a-5)(4a+5)').at(-1)[0],'16a^2 - 25');assert.equal(solve(1,'(xy)^0').at(-1)[0],'1');});
for(const [topic,input]of[[0,'<img src=x onerror=alert(1)>'],[0,'(a^2'],[0,'a^2*b^3'],[0,'0^2/0^3'],[0,'0^0*0^2'],[1,'(6/0)^2'],[6,'x^2/0'],[4,'(999999999x+999999999)^2'],[0,'1'.repeat(2100)]])test('friendly rejection '+input.slice(0,40),()=>assert.throws(()=>solve(topic,input)));

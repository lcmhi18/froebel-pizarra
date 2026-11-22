import test from 'node:test';
import assert from 'node:assert/strict';
import {mathTokens,mathTextLayout,drawMathText} from '../../src/boards/fracciones/math-text.js';
const measure=(text,size)=>text.length*size*.55;

test('typed fractions become complete atoms without changing their spelling',()=>{
 const raw='4/7 +3/4 = -12 / 35',tokens=mathTokens(raw);
 assert.deepEqual(tokens.filter(t=>t.kind==='fraction').map(t=>[t.n,t.d]),[['4','7'],['3','4'],['-12','35']]);
 assert.equal(tokens.map(t=>t.text).join(''),raw);
 for(const raw of ['https://a/3','1/2/3','a4/7','1.5/2','4/','/2'])assert.equal(mathTokens(raw).some(t=>t.kind==='fraction'),false);
});
test('fractions reserve height and wrap as a single atom; Enter keeps separate lines',()=>{
 const layout=mathTextLayout([{text:'4/7 +3/4\n2/5',sup:false}],100,28,measure);
 assert.equal(layout.lines.flatMap(l=>l.atoms).filter(a=>a.kind==='fraction').length,3);
 assert.ok(layout.lines.length>=2);
 assert.ok(layout.lines.filter(l=>l.fraction).every(l=>l.height===28*2.6));
 const wide=mathTextLayout([{text:'4/7 +3/4\n2/5',sup:false}],1000,28,measure);
 assert.equal(wide.lines.length,2);
 assert.deepEqual(wide.lines[1].atoms.map(a=>a.text),['2/5']);
});
test('normal text and superscripts remain legible alongside fractions',()=>{
 const layout=mathTextLayout([{text:'x',sup:false},{text:'2',sup:true},{text:' = 4/7',sup:false}],400,28,measure);
 assert.equal(layout.lines[0].atoms[1].sup,true);
 assert.equal(layout.lines[0].atoms[1].size,28*.65);
 assert.equal(layout.lines[0].atoms.at(-1).kind,'fraction');
});
test('canvas draws stacked numbers and bars instead of a solidus',()=>{
 const labels=[],lines=[],ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},measureText:t=>({width:measure(t,28)}),fillText:(text,x,y)=>labels.push({text,x,y}),moveTo:(x,y)=>lines.push([x,y]),lineTo:(x,y)=>lines.push([x,y]),stroke(){}};
 drawMathText(ctx,{runs:[{text:'4/7 +3/4',sup:false}],fontSize:28,c:'#123abc',x1:0,y1:0,x2:1,y2:1},500,200);
 assert.equal(labels.map(l=>l.text).join(''),'47 +34');
 assert.ok(labels[0].y<labels[1].y);assert.equal(lines.length,4);
});

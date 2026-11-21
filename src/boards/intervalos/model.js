import {validGraphText} from './text.js';
import {solve} from './engine.js';
import {validGraphShape} from './shapes.js';
import {validGraphImage} from './images.js';
const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const only=(x,keys)=>Object.keys(x).every(k=>keys.includes(k));
export function validStrokes(strokes){
 if(!Array.isArray(strokes)||strokes.length>64)return false;
 let points=0;
 return strokes.every(s=>record(s)&&only(s,['c','w','a','p'])&&/^#[0-9a-f]{6}$/i.test(s.c)&&finite(s.w,1,70)&&[.4,1].includes(s.a)&&Array.isArray(s.p)&&s.p.length>0&&(points+=s.p.length)<=1200&&s.p.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>finite(n,-2,4))));
}
export function validLesson(value){
 if(!record(value)||!only(value,['expression','topic','shown','prof','work','strokes','graph','graphInk','formulas']))return false;
 if(typeof value.expression!=='string'||!Number.isInteger(value.topic)||value.topic<0||value.topic>2||!Number.isInteger(value.shown)||value.shown<1||typeof value.prof!=='boolean'||typeof value.work!=='string'||value.work.length>8000)return false;
 try{if(value.shown>solve(value.topic,value.expression).length)return false;}catch{return false;}
 if(!validStrokes(value.strokes)||!Array.isArray(value.graphInk)||value.graphInk.length>64||!value.graphInk.every(s=>s?.t==='shape'?validGraphShape(s):s?.t==='image'?validGraphImage(s):s?.t==='text'?validGraphText(s):validStrokes([s]))||!validStrokes(value.graphInk.filter(s=>!['shape','image','text'].includes(s?.t))))return false;
 const g=value.graph;
 if(!record(g)||!only(g,['rows','operation'])||!['n','u','i','d','s','c'].includes(g.operation)||!Array.isArray(g.rows)||g.rows.length<1||g.rows.length>8||!g.rows.every(r=>record(r)&&only(r,['a','b','L','R','on'])&&Number.isInteger(r.a)&&finite(r.a,-99,99)&&Number.isInteger(r.b)&&finite(r.b,-99,99)&&['c','o','i'].includes(r.L)&&['c','o','i'].includes(r.R)&&typeof r.on==='boolean'))return false;
 if(!Array.isArray(value.formulas)||value.formulas.length>20||!value.formulas.every(f=>record(f)&&only(f,['html','x','y'])&&typeof f.html==='string'&&f.html.length<=1000&&finite(f.x,0,1)&&finite(f.y,0,1)))return false;
 const imageBytes=value.graphInk.filter(s=>s.t==='image').reduce((n,s)=>n+s.src.length,0);
 return imageBytes<=820000&&JSON.stringify(value).length-imageBytes<=45000;
}

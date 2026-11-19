import type { Item } from '../../shared/protocol';
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e6;
const numbers=(item:Item,keys:string[])=>keys.every(k=>number(item[k]));
const index=(v:unknown,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<max;
function bounded(value:unknown,depth=0):boolean{if(depth>12)return false;if(value==null||typeof value==='boolean')return true;if(typeof value==='number')return Number.isFinite(value)&&Math.abs(value)<=1e15;if(typeof value==='string')return value.length<=8192;if(Array.isArray(value))return value.length<=2000&&value.every(v=>bounded(v,depth+1));return record(value)&&Object.keys(value).length<=2000&&Object.entries(value).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&bounded(v,depth+1));}
const points=(v:unknown,min:number,max:number)=>Array.isArray(v)&&v.length>=min&&v.length<=max&&v.every(p=>record(p)&&number(p.x)&&number(p.y));
/** Rendering validation only: invalid remote objects are retained in shared state, never auto-deleted. */
export function validGeometryItem(item:Item):boolean{
 if(!record(item)||!bounded(item))return false;
 switch(item.t){
  case 'p':return points(item.pts,3,64)&&typeof item.c==='string';
  case 'l':return numbers(item,['x1','y1','x2','y2'])&&typeof item.c==='string';
  case 'd':return points(item.d,1,400)&&typeof item.c==='string';
  case 't':return numbers(item,['x','y','s'])&&typeof item.x_==='string'&&item.x_.length<=2000&&typeof item.c==='string';
  case 'a':return numbers(item,['x','y','a1','a2','l'])&&typeof item.c==='string';
  case 's':return ['sq','rc','sc','cd'].includes(String(item.k))&&numbers(item,['x','y','w','h','rot','ir','bw'])&&typeof item.c==='string';
  case 'c':return numbers(item,['x','y','r'])&&record(item.on)&&record(item.g)&&numbers(item.g,['ra','di','c1','c2','s1','s2','tg','k1','k2'])&&(!item.pc||record(item.pc));
  case 'g':return index(item.k,11)&&numbers(item,['x','y','s','r'])&&Array.isArray(item.on)&&item.on.every(k=>index(k,30));
  case 'n':return index(item.k,7)&&numbers(item,['x','y','s','r'])&&typeof item.c==='string';
  case 'r':return index(item.k,3)&&numbers(item,['x','y','s','ang','un'])&&(!item.on||Array.isArray(item.on)&&item.on.every(k=>index(k,8)))&&(!item.pc||record(item.pc));
  case 'y':return index(item.k,9)&&numbers(item,['x','y','s','yaw','pit','u'])&&['on','co','fc','vc','ec'].every(k=>record(item[k]))&&(!item.tf||record(item.tf));
  case 'f':return index(item.i,78)&&numbers(item,['x','y','s']);
  default:return false;
 }
}
export function safeProtractor(value:unknown){const v=record(value)?value:{};return {on:v.on?1:0,x:number(v.x)?Math.max(-10000,Math.min(10000,v.x as number)):620,y:number(v.y)?Math.max(-10000,Math.min(10000,v.y as number)):450,r:number(v.r)?(v.r as number)%360:0,R:number(v.R)?Math.max(120,Math.min(300,v.R as number)):200};}

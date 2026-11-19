import './board.css';
import circleIcon from '@phosphor-icons/core/assets/regular/circle.svg?raw';
import pencilIcon from '@phosphor-icons/core/assets/regular/pencil-simple.svg?raw';
import textIcon from '@phosphor-icons/core/assets/regular/text-t.svg?raw';
import moveIcon from '@phosphor-icons/core/assets/regular/cursor.svg?raw';
import trashIcon from '@phosphor-icons/core/assets/regular/trash.svg?raw';
import undoIcon from '@phosphor-icons/core/assets/regular/arrow-counter-clockwise.svg?raw';
import expandIcon from '@phosphor-icons/core/assets/regular/arrows-out.svg?raw';
import magnetIcon from '@phosphor-icons/core/assets/regular/magnet.svg?raw';
import { TestBoardAdapter } from './adapter';
import { attachLive,type LiveHandle } from '../../live/attach';
import { button,element,icon,icons } from '../../live/ui/dom';
import type { BoardAdapter } from '../../live/BoardAdapter';

declare global{interface Window{FroebelBoard:{id:string;adapter:BoardAdapter};}}
const adapter=new TestBoardAdapter();window.FroebelBoard={id:'prueba',adapter};
const canvas=document.querySelector<SVGSVGElement>('#board-canvas')!,items=document.getElementById('board-items')!,tools=document.getElementById('tools')!,actions=document.getElementById('board-actions')!;
const notice=document.getElementById('board-notice')!,frame=document.querySelector<HTMLElement>('.canvas-frame')!,text=document.querySelector<HTMLInputElement>('#board-text')!,size=document.querySelector<HTMLInputElement>('#circle-size')!;
let tool='move',color='#064bfb',selection='',snap=false,large=false,live:LiveHandle;
let drag:{id:string;dx:number;dy:number;path:boolean}|null=null;
const NS='http://www.w3.org/2000/svg';
function svgNode(tag:string,attributes:Record<string,string|number>){const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;}
const controls=new Map<string,HTMLButtonElement>();
for(const [id,label,source] of [['move','Mover',moveIcon],['circle','Círculo',circleIcon],['pencil','Lápiz',pencilIcon],['text','Texto',textIcon]] as const){const control=button(label,source,()=>{tool=id;refresh();});control.dataset.tool=id;tools.append(control);controls.set(id,control);}
const twin=button('Gemelo',icons.copy,()=>adapter.change(state=>{const item=state.items[selection];if(!item)return;const id=live.engine.newId();state.items[id]={...structuredClone(item),x:Number(item.x||0)+25,y:Number(item.y||0)+25};state.order.push(id);selection=id;}));
const remove=button('Borrar',trashIcon,()=>adapter.change(state=>{delete state.items[selection];state.order=state.order.filter(id=>id!==selection);selection='';}));tools.append(twin,remove);
const undo=button('Deshacer',undoIcon,()=>live.engine.undo()),clear=button('Limpiar',trashIcon,()=>adapter.change(state=>{state.items={};state.order=[];selection='';}));
const magnet=button('Imán',magnetIcon,()=>{snap=!snap;refresh();});const expand=button('Pizarra grande',expandIcon,()=>{large=!large;document.documentElement.classList.toggle('board-large',large);document.querySelector('.toolbox')!.toggleAttribute('hidden',large);expand.querySelector('span')!.textContent=large?'Ver herramientas':'Pizarra grande';expand.setAttribute('aria-pressed',String(large));});actions.append(undo,magnet,expand,clear);
const palette=document.getElementById('palette')!,swatches=new Map<string,HTMLButtonElement>();
for(const [value,name] of [['#f12b35','Rojo'],['#ff9016','Naranja'],['#ffe120','Amarillo'],['#66c90c','Verde claro'],['#078c38','Verde'],['#00c9ed','Celeste'],['#064bfb','Azul'],['#9821ed','Violeta'],['#ef22d3','Fucsia'],['#fb57a3','Rosado'],['#975529','Marrón'],['#202126','Negro']]){const swatch=button(name);swatch.replaceChildren();swatch.style.setProperty('--swatch',value);swatch.setAttribute('aria-label',name);swatch.addEventListener('click',()=>{color=value;refresh();});swatches.set(value,swatch);palette.append(swatch);}
function refresh(){
 const state=adapter.getState(),item=state.items[selection];canvas.style.touchAction=tool==='move'?'pan-x pan-y':'none';
 for(const [id,control] of controls){control.setAttribute('aria-pressed',String(tool===id));control.disabled=adapter.readOnly;}
 twin.disabled=adapter.readOnly||!item;remove.disabled=adapter.readOnly||!item;undo.disabled=adapter.readOnly;clear.disabled=adapter.readOnly||!state.order.length;text.disabled=adapter.readOnly;size.disabled=adapter.readOnly;
 document.getElementById('text-options')!.hidden=tool!=='text';document.getElementById('size-options')!.hidden=item?.type!=='circle';if(item?.type==='circle')size.value=String(item.r);
 magnet.setAttribute('aria-pressed',String(snap));frame.dataset.readonly=String(adapter.readOnly);canvas.setAttribute('aria-disabled',String(adapter.readOnly));
 for(const [value,control] of swatches){control.setAttribute('aria-pressed',String(value===color));control.replaceChildren(...(value===color?[icon(icons.check)]:[]));}
 const nodes:SVGElement[]=[];
 for(const id of state.order){const item=state.items[id];if(!item)continue;const attrs={'data-item':id,transform:`translate(${Number(item.x)||0},${Number(item.y)||0})`};let node:SVGElement;
  const fill=typeof item.color==='string'?item.color:'#064bfb';
  if(item.type==='circle')node=svgNode('circle',{...attrs,r:Math.max(0,Number(item.r)||40),fill,stroke:selection===id?'var(--ink)':'none','stroke-width':3});
  else if(item.type==='text'){node=svgNode('text',{...attrs,fill,'font-size':30,'font-weight':700});node.textContent=String(item.text||'');}
  else if(item.type==='path'){const points=Array.isArray(item.points)?item.points:[];node=svgNode('path',{...attrs,d:points.filter(p=>p&&typeof p==='object').map((p,i)=>`${i?'L':'M'}${Number(p.x)||0},${Number(p.y)||0}`).join(' '),stroke:fill,'stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'});}else continue;
  node.style.touchAction='none';nodes.push(node);
 }
 items.replaceChildren(...nodes);
}
function point(event:PointerEvent){const p=canvas.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const result=p.matrixTransform(canvas.getScreenCTM()!.inverse());const clamp=(value:number,max:number)=>Math.max(0,Math.min(max,snap?Math.round(value/25)*25:value));return {x:clamp(result.x,1000),y:clamp(result.y,650)};}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||adapter.readOnly)return;const p=point(event),target=(event.target as Element).closest('[data-item]')?.getAttribute('data-item');canvas.setPointerCapture(event.pointerId);
 if(tool==='move'){
  selection=target||'';if(target){const item=adapter.getState().items[target];drag={id:target,dx:p.x-Number(item.x||0),dy:p.y-Number(item.y||0),path:false};}refresh();return;
 }
 const id=live.engine.newId();selection=id;
 adapter.change(state=>{state.items[id]=tool==='circle'?{type:'circle',x:p.x,y:p.y,r:40,color}:tool==='text'?{type:'text',x:p.x,y:p.y,text:text.value.slice(0,200),color}:{type:'path',x:0,y:0,points:[p],color};state.order.push(id);},tool!=='pencil');
 if(tool==='pencil')drag={id,dx:0,dy:0,path:true};
});
canvas.addEventListener('pointermove',event=>{if(!drag||adapter.readOnly)return;const d=drag,p=point(event);adapter.change(state=>{const item=state.items[d.id];if(!item)return;if(d.path){const points=item.points as {x:number;y:number}[];if(points.length<500)points.push(p);}else{item.x=p.x-d.dx;item.y=p.y-d.dy;}},false);});
const finish=()=>{if(drag){adapter.change(()=>{},true);drag=null;}};canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
size.addEventListener('input',()=>{const value=Number(size.value);adapter.change(state=>{if(state.items[selection])state.items[selection].r=value;},false);});const finishSize=()=>adapter.change(()=>{},true);size.addEventListener('pointerup',finishSize);size.addEventListener('keyup',finishSize);size.addEventListener('change',finishSize);
canvas.addEventListener('keydown',event=>{if(adapter.readOnly)return;if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();live.engine.undo();}if((event.key==='Delete'||event.key==='Backspace')&&selection){event.preventDefault();remove.click();}});
adapter.subscribe(refresh);
live=attachLive(adapter,{boardId:'prueba',workspace:document.getElementById('board-workspace')!});
live.subscribe(view=>{
 notice.hidden=view.status==='active';notice.replaceChildren();if(view.status==='active')return;
 const title=view.status==='waiting'?'Esperando que el profesor te acepte…':view.status==='entry'?'Escribe tu nombre para pedir entrada.':view.status==='paused'?'El profesor se desconectó, esperando…':view.status==='ended'?'La conexión a la sala terminó.':'Conectando con tu clase…';notice.append(element('strong',title));if(view.error)notice.append(element('span',view.error));
});refresh();

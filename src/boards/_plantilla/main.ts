// Separate SVG + JS board registered for live-room navigation.
import '../prueba/board.css';
import { TestBoardAdapter } from '../prueba/adapter';
import { attachLive } from '../../live/attach';
const adapter=new TestBoardAdapter();window.FroebelBoard={id:'_plantilla',adapter};
const canvas=document.querySelector<SVGSVGElement>('#template-canvas')!;
function draw(){
 const state=adapter.getState();const nodes=state.order.flatMap(id=>{const item=state.items[id];if(item?.type!=='circle')return [];const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',String(item.x));circle.setAttribute('cy',String(item.y));circle.setAttribute('r',String(item.r));circle.setAttribute('fill',String(item.color));circle.setAttribute('data-item',id);return [circle];});canvas.replaceChildren(...nodes);
}
adapter.subscribe(draw);
const live=attachLive(adapter,{boardId:'_plantilla',workspace:document.getElementById('board-workspace')!});
document.getElementById('add-circle')!.addEventListener('click',()=>adapter.change(state=>{const id=live.engine.newId();state.items[id]={type:'circle',x:150+(state.order.length%10)*75,y:200,r:40,color:'#064bfb'};state.order.push(id);}));
document.getElementById('undo')!.addEventListener('click',()=>live.engine.undo());
function availability(){document.querySelectorAll<HTMLButtonElement>('.tools button').forEach(button=>button.disabled=adapter.readOnly);}
adapter.subscribe(availability);availability();
live.subscribe(view=>{const note=document.getElementById('template-note')!;note.hidden=view.status==='active';note.textContent=view.error||'Esperando conexión con la clase…';availability();});
draw();

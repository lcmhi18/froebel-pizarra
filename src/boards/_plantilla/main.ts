// Minimal SVG + JS contract. This board stays solo until E6 registers its boardId.
import '../prueba/board.css';
import { TestBoardAdapter } from '../prueba/adapter';
import { attachLive } from '../../live/attach';
const adapter=new TestBoardAdapter();window.FroebelBoard={id:'_plantilla',adapter};
const canvas=document.querySelector<SVGSVGElement>('#template-canvas')!;
function draw(){
 const state=adapter.getState();const nodes=state.order.flatMap(id=>{const item=state.items[id];if(item?.type!=='circle')return [];const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',String(item.x));circle.setAttribute('cy',String(item.y));circle.setAttribute('r',String(item.r));circle.setAttribute('fill',String(item.color));circle.setAttribute('data-item',id);return [circle];});canvas.replaceChildren(...nodes);
}
adapter.subscribe(draw);
const query=new URLSearchParams(location.search);
if(query.has('room')){
 // No silent connection to another board's state. Register _plantilla in E6 first.
 adapter.setReadOnly(true);document.querySelectorAll('button').forEach(button=>button.disabled=true);
 const note=document.getElementById('template-note')!;note.hidden=false;note.textContent='Esta pizarra todavía está disponible solo en modo personal. ';
 const link=document.createElement('a');link.textContent='Abrir la pizarra de la sala';link.href=`/boards/prueba/?${query}`;note.append(link);
}else{
 const live=attachLive(adapter);
 document.getElementById('add-circle')!.addEventListener('click',()=>adapter.change(state=>{const id=live.engine.newId();state.items[id]={type:'circle',x:150+state.order.length*75,y:200,r:40,color:'#064bfb'};state.order.push(id);}));
 document.getElementById('undo')!.addEventListener('click',()=>live.engine.undo());
 window.addEventListener('pagehide',event=>{if(!event.persisted)live.destroy();});
}
draw();

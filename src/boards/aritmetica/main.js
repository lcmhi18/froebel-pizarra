import './style.css';
import {arithmetic as board} from './runtime.js';
import {TestBoardAdapter} from '../prueba/adapter';
import {attachLive} from '../../live/attach';
import {emptyState} from '../../shared/protocol';
import {productFields,restoreProduct} from './shared-state.js';
const defaults=structuredClone(board.P),adapter=new TestBoardAdapter();
let applying=false;const events=new WeakMap();
function capture(final=true){
 if(applying||adapter.readOnly)return;
 const state=emptyState();
 for(const item of board.V.items){state.items[item.id]=structuredClone(item);state.order.push(item.id);}
 state.fields.regions=structuredClone(board.V.fl);
 Object.assign(state.fields,productFields(board.P));
 applying=true;try{adapter.change(next=>{next.items=state.items;next.order=state.order;next.fields=state.fields;},final);}finally{applying=false;}
}
function redraw(){
 const state=adapter.getState(),active=document.activeElement;
 const currentItems=Object.fromEntries(board.V.items.map(item=>[item.id,item]));
 const product=restoreProduct(state.fields,defaults);
 if(JSON.stringify(board.V.items.map(item=>item.id))===JSON.stringify(state.order)&&JSON.stringify(currentItems)===JSON.stringify(state.items)&&JSON.stringify(board.V.fl)===JSON.stringify(state.fields.regions||[])&&Object.keys(defaults).every(key=>['view','hold'].includes(key)||JSON.stringify(board.P[key])===JSON.stringify(product[key]))){decorate();return;}
 const selection=board.V.sel;
 board.cancel();board.V.items=state.order.flatMap(id=>state.items[id]?[{...structuredClone(state.items[id]),id}]:[]);board.V.fl=structuredClone(state.fields.regions||[]);
 for(const key of Object.keys(defaults))if(!['view','hold'].includes(key))board.P[key]=product[key];
 board.V.sel=board.V.items.some(item=>item.id===selection)?selection:null;
 applying=true;try{board.resetContext();board.render();decorate();}finally{applying=false;}
 if(active?.isConnected)active.focus({preventScroll:true});
}
function decorate(){
 if(adapter.readOnly)board.cancel();
 document.querySelectorAll('#tools button,#ctx button,#pal button,#pal input,#cm input,#cm textarea,#cm button').forEach(node=>node.disabled=adapter.readOnly);
 document.getElementById('vs').style.pointerEvents=adapter.readOnly?'none':'';
 document.querySelectorAll('[data-a="undo"],[data-a="clear"]').forEach(node=>node.disabled=adapter.readOnly);
 document.querySelectorAll('#cm input,#cm textarea,#ctx input,#pal input').forEach(node=>{if(!node.getAttribute('aria-label'))node.setAttribute('aria-label',node.id==='txin'?'Texto seleccionado':node.id==='cpick'?'Color libre':`${node.dataset.f||'Parámetro'} ${node.dataset.s||''} ${node.dataset.i||node.dataset.k||''}`.trim());});
}
adapter.subscribe(()=>{if(applying)return;redraw();});
window.FroebelBoard={id:'aritmetica',adapter};
const live=attachLive(adapter,{boardId:'aritmetica',workspace:document.getElementById('arithmetic-workspace'),slot:document.getElementById('live-slot')});
board.init({newId:()=>live.engine.newId(),undo:()=>live.engine.undo()});
// Capture before legacy handlers can replace their own event target.
for(const type of ['click','input','change','pointerdown','pointermove','pointerup','pointercancel','keydown'])document.addEventListener(type,event=>{
 const target=event.target;
 const finishingDrag=board.dragging&&['pointermove','pointerup','pointercancel'].includes(type);
 if(!target.closest?.('#arithmetic-workspace,#top')&&!finishingDrag)return;
 const local=target.closest?.('#tabs,#live-slot,#hide-upper,#hide-lower,[data-a="big"],[data-a="snap"],[data-v]');
 if(adapter.readOnly&&!local){event.preventDefault();event.stopImmediatePropagation();return;}
 events.set(event,{local,dragging:board.dragging});
},true);
for(const type of ['click','change','pointerdown','pointermove','pointerup','pointercancel','keydown'])window.addEventListener(type,event=>{
 const info=events.get(event);if(!info||info.local||adapter.readOnly)return;
 if(type==='pointermove'&&!info.dragging&&!board.dragging)return;
 queueMicrotask(()=>{capture(!['pointerdown','pointermove'].includes(type));decorate();});
});
// Preserve native inputs while typing; publish on blur/change, matching the reference.
for(const [id,css,label] of [['hide-upper','hide-upper','superior'],['hide-lower','hide-lower','inferior']])document.getElementById(id).addEventListener('click',()=>{const hidden=document.body.classList.toggle(css);const button=document.getElementById(id);button.textContent=`${hidden?'Mostrar':'Ocultar'} menú ${label}`;button.setAttribute('aria-expanded',String(!hidden));});
live.subscribe(view=>{document.getElementById('room-status').textContent=view.status==='active'?'Conectado':view.error||'Conectando…';decorate();});
if(live.mode==='solo'){const button=document.createElement('button');button.textContent='Clase';button.onclick=()=>location.assign('/profesor/?board=aritmetica');document.getElementById('live-slot').append(button);}
decorate();
new ResizeObserver(()=>board.draw()).observe(document.getElementById('stage'));


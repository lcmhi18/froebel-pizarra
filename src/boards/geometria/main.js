import './geometry.css';
import {geometry} from './runtime';
import {GeometryAdapter,geometryState} from './adapter';
import {sampleMotion,motionRunning} from './animation';
import {validGeometryItem,safeProtractor} from './validity';
import {attachLive} from '../../live/attach';
import {button,icons} from '../../live/ui/dom';
const {S}=geometry,defaultProtractor=structuredClone(S.pr),affectedEvents=new WeakSet();let live,applying=false,lastAction='',motionFrame=0;
const byId=id=>document.getElementById(id);
function stopMotion(){
 if(!S.items.some(item=>item.motion)){geometry.animationFlag=null;return;}
 const now=Date.now();for(const item of S.items)if(item.motion){Object.assign(item,sampleMotion(item,now));delete item.motion;}geometry.animationFlag=null;
}
function startMotion(){
 stopMotion();const item=S.items[S.sel];if(!item)return;
 const action=lastAction.replace(/^y:/,'');item.motion={action,at:Date.now(),base:{u:item.u||0,un:item.un||0,yaw:item.yaw||0,ang:item.ang||0,sp:item.sp||0}};geometry.animationFlag=1;
}

// Rendering samples a shared command clock; animation frames never become network operations.
// The legacy draw closure calls r directly, so the runtime installs this render interceptor.
geometry.init({sample:sampleMotion,valid:validGeometryItem,onInvalid:()=>{byId('st').textContent='Figura incompatible: el resto de la pizarra sigue disponible.';},newId:()=>live?live.engine.newId():`solo:${crypto.randomUUID()}`,start:startMotion,stop:stopMotion});
function renderMotion(){cancelAnimationFrame(motionFrame);geometry.draw();const selected=S.items[S.sel];if(selected?.motion){const frame=sampleMotion(selected,Date.now());for(const input of document.querySelectorAll('[data-sl]')){const key=input.dataset.sl;if(typeof frame[key]==='number')input.value=String(['u','un'].includes(key)?frame[key]*100:frame[key]);}} if(S.items.some(item=>motionRunning(item,Date.now())))motionFrame=requestAnimationFrame(renderMotion);}
function write(state){
 const selected=S.items[S.sel]?.id,active=document.activeElement,focusId=active?.id,start=active?.selectionStart,end=active?.selectionEnd;
 S.items=state.order.flatMap(id=>state.items[id]?[{...state.items[id],id}]:[]);S.pr=safeProtractor(state.fields.protractor||defaultProtractor);S.sel=S.items.findIndex(item=>item.id===selected);if(S.sel<0)S.sd=-1;
 geometry.animationFlag=S.items.some(item=>item.motion)?1:null;
 const keepEditor=active instanceof HTMLInputElement&&active.closest('#geometry-workspace')&&S.sel>=0;
 applying=true;try{if(!keepEditor)geometry.ui();decorate();renderMotion();}catch{S.sel=-1;geometry.ui();decorate();renderMotion();byId('st').textContent='Figura incompatible: puedes seguir usando la pizarra.';}finally{applying=false;}
 const input=focusId&&byId(focusId);if(input&&input instanceof HTMLInputElement){input.focus({preventScroll:true});if(input.type==='text')try{input.setSelectionRange(start,end);}catch{}}
}
function lock(value){geometry.setReadOnly(value);if(value)stopGesture();decorate();}
function stopGesture(){geometry.cancelDrag();}
const adapter=new GeometryAdapter(()=>geometryState(S.items,S.pr),write,lock);
window.FroebelBoard={id:'geometria',adapter};
function decorate(){
 const tools=byId('tools'),choices=[...tools.querySelectorAll(':scope > button[data-c],:scope > button[data-hk],:scope > button[data-rk],:scope > button[data-nk],:scope > button[data-gk],:scope > button[data-cr]')];
 if(choices.length){const details=document.createElement('details');details.className='creation';const summary=document.createElement('summary');summary.textContent=({tri:'Crear triángulo',qua:'Crear cuadrilátero',cir:'Crear círculo',pol:'Crear poliedro',rev:'Crear cuerpo',are:'Crear figura de área',lin:'Crear líneas'})[S.tab]||'Crear figura';details.append(summary,...choices);tools.append(details);}

 for(const button of document.querySelectorAll('#tabs button')){button.setAttribute('aria-pressed',String(button.classList.contains('on')));}
 for(const button of document.querySelectorAll('#tools button,#ctx button,#cols button'))button.disabled=adapter.readOnly;
 for(const input of document.querySelectorAll('#tools input,#ctx input,#cols input')){input.disabled=adapter.readOnly;if(!input.getAttribute('aria-label'))input.setAttribute('aria-label',input.id==='ti'?'Texto para insertar':input.id==='ti2'?'Texto seleccionado':input.type==='color'?'Color '+(input.parentElement.textContent.trim()||'de la figura'):(input.closest('label')?.textContent.trim()||'Parámetro de la figura'));}
 for(const card of document.querySelectorAll('[data-gallery-select]')){card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('aria-pressed',String(card.textContent.includes('✓')));}
 for(const zoom of document.querySelectorAll('[data-gallery-zoom]'))zoom.setAttribute('aria-label','Ampliar fórmula');
 for(const button of document.querySelectorAll('.sw'))button.setAttribute('aria-label',`Color ${button.dataset.col}`);
 byId('bUn').disabled=adapter.readOnly;byId('bCl').disabled=adapter.readOnly;
 byId('sv').setAttribute('aria-disabled',String(adapter.readOnly));
}
// A single capture guard protects native pointer handlers, sliders, color inputs and keyboard.
for(const type of ['pointerdown','pointermove','pointerup','pointercancel','input','change','click','keydown'])document.addEventListener(type,event=>{
 const node=event.target instanceof Element?event.target:null;if(!node)return;
 if(node.closest('#geometry-workspace,#top,#gal'))affectedEvents.add(event);
 const button=node.closest('button');if(button?.dataset.x)lastAction=button.dataset.x;
 const board=node.closest('#geometry-workspace'),mutating=board&&!node.closest('#tabs')&&!['bGa','bBig','bOp'].includes(button?.id);
 if(adapter.readOnly&&mutating){event.preventDefault();event.stopImmediatePropagation();return;}
 if(type==='keydown'&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!node.closest('input')){event.preventDefault();event.stopImmediatePropagation();live.engine.undo();}
},true);
for(const type of ['click','input','change','pointermove','pointerup','pointercancel','keydown'])document.addEventListener(type,event=>{
 if(applying||adapter.readOnly)return;
 if(type==='pointermove'&&!geometry.dragging)return;
 if(!affectedEvents.has(event)&&!event.target.closest?.('#geometry-workspace,#top,#gal'))return;
 queueMicrotask(()=>{if(!applying&&!adapter.readOnly){adapter.capture(!['pointermove','input'].includes(type));decorate();renderMotion();}});
});
document.addEventListener('click',event=>{const target=event.target.closest?.('[data-gallery-close],[data-gallery-place],[data-gallery-zoom],[data-gallery-select]');if(!target)return;if(target.hasAttribute('data-gallery-close'))byId('gal').style.display='none';else if(target.hasAttribute('data-gallery-zoom'))geometry.galleryZoom(Number(target.dataset.galleryZoom));else if(target.hasAttribute('data-gallery-select'))geometry.gallerySelect(Number(target.dataset.gallerySelect));else if(!adapter.readOnly){geometry.galleryPlace();adapter.capture(true);renderMotion();}decorate();});
document.addEventListener('keydown',event=>{const card=event.target.closest?.('[data-gallery-select]');if(card&&(event.key==='Enter'||event.key===' ')){event.preventDefault();card.click();}});
byId('bUn').onclick=()=>{if(!adapter.readOnly)live.engine.undo();};
byId('bCls').remove();
live=attachLive(adapter,{boardId:'geometria',workspace:byId('geometry-workspace'),slot:byId('live-slot')});
live.subscribe(view=>{byId('st').textContent=view.status==='active'?'Conectado':view.error||'Esperando conexión…';});
if(live.mode==='solo'){byId('st').textContent='Modo personal';byId('live-slot').append(button('Clase',icons.users,()=>location.assign('/profesor/?board=geometria')));}
geometry.ui();decorate();
export {adapter};

// Keep geometric proportions while extending the visible paper to fill its frame.
new ResizeObserver(()=>{const svg=byId('sv'),width=svg.clientWidth,height=svg.clientHeight;if(!width||!height)return;const ratio=width/height,w=Math.max(1000,560*ratio),h=w/ratio,x=(1000-w)/2,y=(560-h)/2;svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);const paper=svg.querySelector(':scope > rect');for(const [key,value] of Object.entries({x,y,width:w,height:h}))paper.setAttribute(key,String(value));}).observe(byId('bd'));

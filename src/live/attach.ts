import type { BoardAdapter } from './BoardAdapter';
import { RoomEngine } from './engine';
import { RoomConnection,type RoomOptions,type RoomView } from './connection';
import { type BoardId } from '../shared/protocol';
import { TeacherPanel } from './ui/TeacherPanel';
import { StatusChip } from './ui/StatusChip';
import { element } from './ui/dom';
import { boardUrl,rememberRoom } from './navigation';
export type LiveHandle={engine:RoomEngine;mode:'solo'|'room';subscribe:(listener:(view:RoomView)=>void)=>()=>void;destroy:()=>void};
type AttachOptions={boardId?:BoardId;workspace?:HTMLElement;slot?:HTMLElement;name?:string};
/** No board-specific rules: only the adapter, an optional slot, and a layout mount. */
export function attachLive(adapter:BoardAdapter,options:AttachOptions={}):LiveHandle{
 const query=new URLSearchParams(location.search),code=query.get('room')?.toUpperCase();
 if(!code){
  let seq=0;const engine=new RoomEngine(adapter,ops=>ops.forEach(op=>engine.receive([{...op,seq:++seq}])) ,{boardId:options.boardId});engine.identity(`solo-${crypto.randomUUID()}`);engine.snapshot(adapter.getState(),0);engine.setReadOnly(false);
  const slot=options.slot||document.getElementById('live-slot');const note=element('span','Modo personal');note.className='solo-label';slot?.append(note);
  return {engine,mode:'solo',subscribe:()=>()=>{},destroy:()=>{engine.dispose();note.remove();}};
 }
 const role=query.get('role')==='teacher'?'teacher':'student';
 const roomOptions:RoomOptions={code,role,name:options.name,boardId:options.boardId};const connection=new RoomConnection(adapter,roomOptions);
 const slot=options.slot||document.getElementById('live-slot')||element('div');const fallback=!slot.isConnected;if(fallback){slot.className='froebel-live-floating';document.body.prepend(slot);}
 const style=element('style');style.textContent=`.froebel-live-layout{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:12px}.froebel-live-layout>main{min-width:0}.froebel-live-layout[data-open=false]{grid-template-columns:minmax(0,1fr)}.froebel-live-floating{position:sticky;top:0;z-index:20;background:Canvas;padding:8px}@media(max-width:850px){.froebel-live-layout{grid-template-columns:minmax(0,1fr)}.froebel-live-layout>aside{grid-row:1}}`;document.head.append(style);
 let theme:'light'|'dark'=localStorage.getItem('froebel:room-theme')==='dark'?'dark':localStorage.getItem('froebel:room-theme')==='light'?'light':matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
 let panel:TeacherPanel|undefined,chip:StatusChip|undefined,layout:HTMLElement|undefined;
 const setTheme=(next:'light'|'dark')=>{theme=next;document.documentElement.dataset.theme=theme;localStorage.setItem('froebel:room-theme',theme);panel?.setTheme(theme);chip?.setTheme(theme);};
 if(role==='teacher'){
  const workspace=options.workspace||document.querySelector('main');
  panel=new TeacherPanel(slot,connection,open=>{if(layout)layout.dataset.open=String(open);},setTheme);
  if(workspace?.parentNode){layout=element('div',undefined,'froebel-live-layout');workspace.before(layout);layout.append(workspace,panel.rail);}else document.body.append(panel.rail);
 }else chip=new StatusChip(slot,connection,()=>setTheme(theme==='dark'?'light':'dark'));
 setTheme(theme);const listeners=new Set<(view:RoomView)=>void>();
 let navigating=false;
 const update=()=>{const view=connection.getSnapshot();if(view.status==='active'){if(role==='teacher')rememberRoom(code,view.boardId);if(view.boardId!==(options.boardId||'prueba')&&!navigating){navigating=true;connection.engine.setReadOnly(true);location.replace(boardUrl(view.boardId,code,role));}}panel?.update(view);chip?.update(view);listeners.forEach(listener=>listener(view));};const unsubscribe=connection.subscribe(update);update();connection.start();
 const pagehide=(event:PageTransitionEvent)=>event.persisted?connection.suspend():connection.stop();const pageshow=(event:PageTransitionEvent)=>{if(event.persisted)connection.retry();};window.addEventListener('pagehide',pagehide);window.addEventListener('pageshow',pageshow);
 return {engine:connection.engine,mode:'room',subscribe:listener=>{listeners.add(listener);listener(connection.getSnapshot());return()=>{listeners.delete(listener);};},destroy:()=>{window.removeEventListener('pagehide',pagehide);window.removeEventListener('pageshow',pageshow);unsubscribe();connection.stop();panel?.destroy();chip?.destroy();if(layout){const workspace=layout.querySelector('main');if(workspace)layout.before(workspace);layout.remove();}style.remove();if(fallback)slot.remove();listeners.clear();}};
}

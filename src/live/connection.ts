import type { BoardAdapter } from './BoardAdapter';
import { RoomEngine } from './engine';
import { isRoomCode,sanitizeFirstName,type BoardId,type BoardState,type Op,type ServerMessage,type Student } from '../shared/protocol';
import {operationFrames} from '../shared/transport';

export const API=(import.meta.env?.VITE_ROOM_API_URL||'').replace(/\/$/,'');
export type RoomOptions={code:string;role:'teacher'|'student';name?:string;teacherToken?:string;boardId?:BoardId};
export type RoomStatus='idle'|'entry'|'connecting'|'waiting'|'active'|'paused'|'reconnecting'|'ended';
export type RoomView={status:RoomStatus;error:string;students:Student[];author:string;name:string;boardId:BoardId};
export const messages:Record<string,string>={ROOM_FULL:'La sala ya tiene 5 alumnos activos.',PENDING_FULL:'Hay diez solicitudes pendientes. Intenta más tarde.',REMOVED:'El profesor te retiró.',REJECTED:'El profesor rechazó tu solicitud.',ROOM_CLOSED:'El profesor cerró la sala.',NOT_FOUND:'La sala no existe o está cerrada.',BAD_AUTH:'No se pudo validar tu acceso.',FORBIDDEN:'No tienes permiso para realizar esta acción.',RATE_LIMITED:'Demasiadas solicitudes o cambios. Espera un momento e intenta de nuevo.',STATE_TOO_LARGE:'La pizarra alcanzó su tamaño máximo.',NOT_ACTIVE:'Espera la aceptación del profesor.',PAUSED:'El profesor se desconectó, esperando…',REPLACED_SESSION:'Abriste la sala en otra pestaña.',AUTH_TIMEOUT:'Se agotó el tiempo para identificar la conexión.',PROTOCOL_VERSION:'Actualiza la página para conectarte.'};
type Chunk={total:number;parts:string[];seq:number;boardId:BoardId};
/** Browser transport shared by React and SVG pages. Room rules remain in the Worker. */
export class RoomConnection{
 readonly engine:RoomEngine;private ws:WebSocket|null=null;private view:RoomView;
 private listeners=new Set<()=>void>();private stopped=true;private ready=false;private paused=false;
 private generation=0;private reconnect:ReturnType<typeof setTimeout>|undefined;private heartbeat:ReturnType<typeof setInterval>|undefined;private pump:ReturnType<typeof setInterval>|undefined;private lastPong=0;
 private outgoing=new Map<string,Op>();private chunks=new Map<string,Chunk>();
 constructor(adapter:BoardAdapter,readonly options:RoomOptions){
  this.view={status:'idle',error:'',students:[],author:'',name:options.name||'',boardId:options.boardId||'prueba'};
  this.engine=new RoomEngine(adapter,ops=>{if(this.ready&&!this.paused&&this.ws?.readyState===WebSocket.OPEN)ops.forEach(op=>this.outgoing.set(op.opId,op));},{boardId:this.view.boardId,requestResync:fromSeq=>{this.ready=false;this.outgoing.clear();if(!this.paused)this.update({status:'reconnecting'});this.send({type:'resync_request',fromSeq});}});
  this.engine.setReadOnly(true);
 }
 getSnapshot=()=>this.view;
 subscribe=(callback:()=>void)=>{this.listeners.add(callback);return()=>{this.listeners.delete(callback);};};
 private update(patch:Partial<RoomView>){this.view={...this.view,...patch};this.listeners.forEach(callback=>callback());}
 private studentId(){const key=`room:${this.options.code}:student`,value=sessionStorage.getItem(key);if(value&&!/^[a-f0-9-]{36}$/i.test(value)){sessionStorage.removeItem(key);return undefined;}return value||undefined;}
 private teacherToken(){return this.options.teacherToken||localStorage.getItem(`room:${this.options.code}:teacher`)||undefined;}
 private send(data:unknown){if(this.ws?.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify(data));}
 start(){
  if(!this.stopped)return;this.stopped=false;
  if(!isRoomCode(this.options.code)){this.update({status:'ended',error:'Escribe un código de seis caracteres válido.'});return;}
  if(this.options.role==='student'&&!this.studentId()&&!this.options.name?.trim()){this.update({status:'entry'});return;}
  if(this.options.role==='teacher'&&!this.teacherToken()){this.update({status:'ended',error:'Abre esta sala desde la pantalla del profesor para recuperar tu acceso.'});return;}
  this.pump=setInterval(()=>this.flush(),40);void this.connect();
 }
 join(name:string){const clean=sanitizeFirstName(name);if(!clean){this.update({error:'Escribe tu nombre para pedir entrada.'});return;}this.options.name=clean;this.update({name:this.options.name,error:''});this.retry();}
 private flush(){
  if(!this.ready||this.paused||this.ws?.readyState!==WebSocket.OPEN)return;
  const batch:Op[]=[];
  for(const op of this.outgoing.values()){
   if(new TextEncoder().encode(JSON.stringify({type:'ops',ops:[...batch,op]})).length>64000){if(!batch.length){this.outgoing.delete(op.opId);try{if(this.options.role!=='teacher')throw Error();for(const frame of operationFrames(op))this.send(frame);}catch{this.engine.reject();this.update({error:'El cambio es demasiado grande para enviarlo.'});}}break;}
   batch.push(op);if(batch.length>=2)break;
  }
  if(batch.length){batch.forEach(op=>this.outgoing.delete(op.opId));this.send({type:'ops',ops:batch});}
 }
 private handle(message:ServerMessage){
  switch(message.type){
   case 'joined':this.engine.identity(message.author);this.update({author:message.author,...(message.name?{name:message.name}:{})});if(message.studentId)sessionStorage.setItem(`room:${this.options.code}:student`,message.studentId);break;
   case 'waiting':this.ready=false;this.engine.setReadOnly(true);this.update({status:'waiting'});break;
   case 'roster':this.update({students:[...message.pending.map(s=>({id:s.studentId,name:s.name,status:'pending' as const,last_seen:0})),...message.active.map(s=>({id:s.studentId,name:s.name,status:'active' as const,last_seen:0}))]});break;
   case 'error':this.update({error:messages[message.code]||message.code});if(this.engine.pendingCount||message.ref){this.outgoing.clear();this.engine.reject();}break;
   case 'paused':this.paused=true;this.ready=false;this.outgoing.clear();this.engine.setReadOnly(true);this.update({status:'paused',error:messages.PAUSED});break;
   case 'resumed':if(this.paused){this.paused=false;this.send({type:'resync_request',fromSeq:this.engine.sequence});}break;
   case 'board_changed':this.ready=false;this.outgoing.clear();this.chunks.clear();this.engine.setReadOnly(true);this.update({boardId:message.boardId,status:'reconnecting'});break;
   case 'snapshot_start':if(message.chunks>0&&message.chunks<=1024)this.chunks.set(message.snapshotId,{total:message.chunks,parts:[],seq:message.seq,boardId:message.boardId});break;
   case 'snapshot_chunk':{const entry=this.chunks.get(message.snapshotId);if(entry&&message.index>=0&&message.index<entry.total)entry.parts[message.index]=message.data;break;}
   case 'snapshot_end':{
    const entry=this.chunks.get(message.snapshotId);if(!entry||entry.seq!==message.seq||entry.boardId!==message.boardId||entry.parts.filter(p=>typeof p==='string').length!==entry.total)return;
    this.chunks.delete(message.snapshotId);this.engine.snapshot(JSON.parse(entry.parts.join('')) as BoardState,entry.seq,entry.boardId);this.ready=!this.paused;this.engine.setReadOnly(!this.ready);
    this.update({boardId:entry.boardId,...(this.ready?{status:'active',error:''}:{})});if(this.ready)this.engine.resend();break;
   }
   case 'ops':message.ops.forEach(op=>this.outgoing.delete(op.opId));this.engine.receive(message.ops);break;
   case 'closed':this.ready=false;this.engine.setReadOnly(true);this.update({status:'ended',error:messages.ROOM_CLOSED});break;
   case 'kicked':this.update({error:messages[message.reason]});break;
  }
 }
 private async connect(){
  const generation=++this.generation;this.ready=false;this.paused=false;this.chunks.clear();this.outgoing.clear();this.engine.setReadOnly(true);this.update({status:'connecting'});
  try{
   const response=await fetch(`${API}/api/rooms/${this.options.code}`);const data=await response.json() as {open?:boolean;error?:string};
   if(this.stopped||generation!==this.generation)return;
   if(!response.ok||!data.open){this.update({status:'ended',error:messages[data.error||'NOT_FOUND']||'No se pudo conectar.'});return;}
   const url=new URL(`${API}/api/rooms/${this.options.code}/ws`,location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('role',this.options.role);
   const ws=new WebSocket(url);this.ws=ws;
   ws.onopen=()=>{
    if(this.stopped||this.ws!==ws){ws.close();return;}
    this.lastPong=Date.now();const studentId=this.studentId();
    this.send(this.options.role==='teacher'?{type:'hello',v:1,role:'teacher',token:this.teacherToken()}:{type:'hello',v:1,role:'student',...(studentId?{studentId}:{name:this.options.name})});
    clearInterval(this.heartbeat);this.heartbeat=setInterval(()=>{if(Date.now()-this.lastPong>60000){ws.close();return;}if(ws.readyState===WebSocket.OPEN)ws.send('ping');},25000);
   };
   ws.onmessage=event=>{if(this.stopped||this.ws!==ws)return;if(event.data==='pong'){this.lastPong=Date.now();return;}try{this.handle(JSON.parse(event.data) as ServerMessage);}catch{this.update({error:'No se pudo leer un cambio de la sala.'});}};
   ws.onclose=event=>{
    if(this.stopped||this.ws!==ws)return;clearInterval(this.heartbeat);this.ready=false;this.outgoing.clear();this.engine.setReadOnly(true);
    if([4001,4002,4003,4005,4006,4007,4008,4009].includes(event.code)){
     if(event.code===4006&&this.options.role==='student')sessionStorage.removeItem(`room:${this.options.code}:student`);
     this.update({status:'ended',error:messages[event.reason]||'La conexión se cerró.'});return;
    }
    this.update({status:'reconnecting'});this.reconnect=setTimeout(()=>void this.connect(),1500);
   };
   ws.onerror=()=>{if(!this.stopped&&this.ws===ws)this.update({error:'Se perdió la conexión. Intentando recuperar la sala…'});};
  }catch{if(!this.stopped&&generation===this.generation){this.update({status:'reconnecting'});this.reconnect=setTimeout(()=>void this.connect(),2000);}}
 }
 setBoard(boardId:BoardId){if(this.options.role==='teacher'&&this.view.status==='active')this.send({type:'set_board',boardId});}
 action(type:string,studentId?:string){this.send({type:({remove:'kick',close:'close_room'} as Record<string,string>)[type]||type,...(studentId?{studentId}:{})});}
 retry(){this.disconnect();this.update({error:''});this.start();}
 async reopen(){
  try{const response=await fetch(`${API}/api/rooms/${this.options.code}/reopen`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teacherToken:this.teacherToken()})});
  if(!response.ok){this.update({error:'No se pudo reabrir; el código puede haber caducado.'});return;}this.retry();}catch{this.update({error:'No se pudo conectar para reabrir. Intenta nuevamente.'});}
 }
 private disconnect(){this.stopped=true;this.generation++;this.ready=false;clearTimeout(this.reconnect);clearInterval(this.heartbeat);clearInterval(this.pump);this.outgoing.clear();this.ws?.close();this.ws=null;this.engine.setReadOnly(true);}
 suspend(){this.disconnect();}
 stop(){this.disconnect();this.engine.dispose();this.listeners.clear();}
}

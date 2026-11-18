import { useEffect, useRef, useState } from 'react';
import { RoomEngine } from './engine';
import type { BoardAdapter } from './BoardAdapter';
import { clone, emptyState, type Student, type LegacyOp, type Op, type BoardState } from '../shared/protocol';
import { applyOperation } from '../shared/operations';
export const API=(import.meta.env.VITE_ROOM_API_URL || '').replace(/\/$/,'');
export type RoomOptions={code:string;role:'teacher'|'student';name?:string;teacherToken?:string};
export const messages:Record<string,string>={ROOM_FULL:'La sala ya tiene 5 alumnos activos.',PENDING_FULL:'Hay diez solicitudes pendientes. Intenta más tarde.',REMOVED:'El profesor te retiró.',REJECTED:'El profesor rechazó tu solicitud.',ROOM_CLOSED:'El profesor cerró la sala.',NOT_FOUND:'La sala no está disponible.',BAD_AUTH:'No se pudo validar tu acceso.',FORBIDDEN:'No tienes permiso para realizar esta acción.',RATE_LIMITED:'Demasiados cambios. Sincronizando de nuevo…',STATE_TOO_LARGE:'La pizarra alcanzó su tamaño máximo.',NOT_ACTIVE:'Espera la aceptación del profesor.',PAUSED:'El profesor se desconectó. La pizarra está en pausa.',REPLACED_SESSION:'Esta sesión se abrió en otra pestaña.',AUTH_TIMEOUT:'Se agotó el tiempo para identificar la conexión.',PROTOCOL_VERSION:'Actualiza la página para conectarte.'};
export function useRoom(adapter:BoardAdapter,options:RoomOptions|null){
  const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[students,setStudents]=useState<Student[]>([]),[author,setAuthor]=useState('');
  const socket=useRef<WebSocket|null>(null),engine=useRef<RoomEngine|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!options)return;
    let stopped=false,reconnect:ReturnType<typeof setTimeout>,heartbeat:ReturnType<typeof setInterval>,lastPong=Date.now(),ready=false,paused=false,wireState=emptyState(),lastSeq=0;
    const {code,role}=options;
    const chunks=new Map<string,{total:number;parts:string[];seq:number}>();
    const outgoing=new Map<string,Op>(),pending=new Set<string>();
    // Temporary compatibility boundary: E4 replaces the legacy engine, not the board UI.
    const sendOps=(ops:LegacyOp[])=>{
      if(!ready||paused||socket.current?.readyState!==WebSocket.OPEN)return;
      for(const op of ops){
        const base={opId:op.opId,author:op.author,boardId:'prueba' as const,gestureId:op.opId};
        if(op.kind==='order'){
          const ids=op.value as string[];ids.forEach((id,index)=>{const child:Op={...base,opId:`${op.author}:${crypto.randomUUID()}`,kind:'order',id,after:index?ids[index-1]:null};outgoing.set(child.opId,child);});sync.ignored([op.opId]);continue;
        }
        const wire:Op=op.kind==='field'?{...base,kind:'field',field:op.field!,value:op.value}:op.kind==='remove'?{...base,kind:'remove',id:op.id!}:{...base,kind:op.kind,id:op.id!,patch:op.patch!};
        outgoing.set(wire.opId,wire);pending.add(op.opId);
      }
    };
    const pump=setInterval(()=>{
      if(!ready||paused||socket.current?.readyState!==WebSocket.OPEN)return;
      const batch:Op[]=[];
      for(const op of outgoing.values()){
        if(new TextEncoder().encode(JSON.stringify({type:'ops',ops:[...batch,op]})).length>64000){if(!batch.length){outgoing.delete(op.opId);pending.delete(op.opId);sync.ignored([op.opId]);setError('El cambio es demasiado grande.');}break;}
        batch.push(op);if(batch.length>=2)break;
      }
      if(batch.length){batch.forEach(op=>outgoing.delete(op.opId));socket.current.send(JSON.stringify({type:'ops',ops:batch}));}
    },40);
    const sync=new RoomEngine(adapter,sendOps);engine.current=sync;
    const handle=(m:any)=>{
      if(m.type==='joined'){sync.identity(m.author);setAuthor(m.author);if(m.studentId)sessionStorage.setItem(`room:${code}:student`,m.studentId);}
      if(m.type==='waiting'){setStatus('waiting');ready=false;}
      if(m.type==='roster')setStudents([...m.pending.map((s:any)=>({id:s.studentId,name:s.name,status:'pending',last_seen:0})),...m.active.map((s:any)=>({id:s.studentId,name:s.name,status:'active',last_seen:0}))]);
      if(m.type==='error'){
        setError(messages[m.code]||m.code);
        if(pending.size){outgoing.clear();sync.ignored([...pending]);pending.clear();socket.current?.send(JSON.stringify({type:'resync_request',fromSeq:lastSeq}));}
      }
      if(m.type==='paused'){paused=true;ready=false;outgoing.clear();sync.ignored([...pending]);pending.clear();setStatus('paused');setError(messages.PAUSED);}
      if(m.type==='resumed'){if(paused){paused=false;socket.current?.send(JSON.stringify({type:'resync_request',fromSeq:lastSeq}));}}
      if(m.type==='snapshot_start')chunks.set(m.snapshotId,{total:m.chunks,parts:[],seq:m.seq});
      if(m.type==='snapshot_chunk'){const entry=chunks.get(m.snapshotId);if(entry)entry.parts[m.index]=m.data;}
      if(m.type==='snapshot_end'){
        const entry=chunks.get(m.snapshotId);if(!entry||entry.parts.filter(p=>typeof p==='string').length!==entry.total)return;chunks.delete(m.snapshotId);
        wireState=JSON.parse(entry.parts.join('')) as BoardState;lastSeq=entry.seq;sync.snapshot(wireState,lastSeq);ready=!paused;if(ready){sync.resend();setStatus('active');setError('');}
      }
      if(m.type==='ops')for(const op of m.ops as Op[]){
        pending.delete(op.opId);if((op.seq||0)>lastSeq){applyOperation(wireState,op);lastSeq=op.seq!;}
        const legacy:LegacyOp=op.kind==='order'?{...op,value:clone(wireState.order)}:op;sync.receive([legacy]);
      }
    };
    const connect=async()=>{
      setStatus('connecting');ready=false;paused=false;chunks.clear();
      try{
        const check=await fetch(`${API}/api/rooms/${code}`);const data=await check.json();
        if(!check.ok||!data.open){setError(messages[data.error||'ROOM_CLOSED']||'No se pudo conectar.');setStatus('ended');return;}
        if(stopped)return;
        const url=new URL(`${API}/api/rooms/${code}/ws`,location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('role',role);
        const ws=new WebSocket(url);socket.current=ws;
        ws.onopen=()=>{
          lastPong=Date.now();let studentId=sessionStorage.getItem(`room:${code}:student`)||undefined;
          if(studentId&&!/^[a-f0-9-]{36}$/i.test(studentId)){sessionStorage.removeItem(`room:${code}:student`);studentId=undefined;}
          ws.send(JSON.stringify(role==='teacher'?{type:'hello',v:1,role,token:options.teacherToken}:{type:'hello',v:1,role,...(studentId?{studentId}:{name:options.name})}));
          clearInterval(heartbeat);heartbeat=setInterval(()=>{if(Date.now()-lastPong>60000){ws.close();return;}if(ws.readyState===WebSocket.OPEN)ws.send('ping');},25000);
        };
        ws.onmessage=e=>{if(e.data==='pong'){lastPong=Date.now();return;}try{handle(JSON.parse(e.data));}catch{setError('No se pudo leer un cambio de la sala.');}};
        ws.onclose=e=>{clearInterval(heartbeat);ready=false;if(stopped)return;if([4001,4002,4003,4005,4006,4007,4008,4009].includes(e.code)){setError(messages[e.reason]||'La conexión se cerró.');setStatus('ended');return;}setStatus('reconnecting');reconnect=setTimeout(connect,1500);};
        ws.onerror=()=>setError('Se perdió la conexión. Intentando recuperar la sala…');
      }catch{if(!stopped){setStatus('reconnecting');reconnect=setTimeout(connect,2000);}}
    };
    connect();return()=>{stopped=true;clearTimeout(reconnect);clearInterval(heartbeat);clearInterval(pump);socket.current?.close();sync.dispose();};
  },[adapter,options,retry]);
  return {status,error,students,author,undo:()=>engine.current?.undo(),action:(type:string,studentId?:string)=>socket.current?.readyState===WebSocket.OPEN&&socket.current.send(JSON.stringify({type:({remove:'kick',close:'close_room'} as Record<string,string>)[type]||type,...(studentId?{studentId}:{})})),retry:()=>{setError('');setRetry(n=>n+1);}};
}

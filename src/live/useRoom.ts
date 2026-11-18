import { useEffect, useRef, useState } from 'react';
import { RoomEngine } from './engine';
import type { BoardAdapter } from './BoardAdapter';
import type { Student, Op } from '../shared/protocol';
export const API=(import.meta.env.VITE_ROOM_API_URL || '').replace(/\/$/,'');
export type RoomOptions={code:string;role:'teacher'|'student';name?:string;teacherToken?:string};
export const messages:Record<string,string>={ROOM_FULL:'La sala ya tiene 5 alumnos activos.',REMOVED:'El profesor te retiró.',REJECTED:'El profesor rechazó tu solicitud.',ROOM_CLOSED:'El profesor cerró la sala.',NOT_FOUND:'La sala no existe.',UNAUTHORIZED:'No se pudo validar tu acceso.',FORBIDDEN:'Solo el profesor puede realizar esta acción.',RATE_LIMIT:'Demasiados cambios. Sincronizando de nuevo…',MESSAGE_TOO_LARGE:'El cambio es demasiado grande.',WAITING_APPROVAL:'Espera la aceptación del profesor.'};
export function useRoom(adapter:BoardAdapter,options:RoomOptions|null){
  const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[students,setStudents]=useState<Student[]>([]);
  const socket=useRef<WebSocket|null>(null),engine=useRef<RoomEngine|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!options)return;
    let stopped=false,reconnect:ReturnType<typeof setTimeout>,heartbeat:ReturnType<typeof setInterval>,lastPong=Date.now(),ready=false;
    const {code,role}=options;
    const chunks=new Map<string,{total:number;parts:string[]}>();
    const outgoing=new Map<string,Op>();
    const sendOps=(ops:Op[])=>{
      if(!ready||socket.current?.readyState!==WebSocket.OPEN)return;
      ops.forEach(op=>outgoing.set(op.opId,op));
    };
    const pump=setInterval(()=>{
      if(!ready||socket.current?.readyState!==WebSocket.OPEN)return;
      const batch:Op[]=[];
      for(const op of outgoing.values()){
        if(new TextEncoder().encode(JSON.stringify({type:'ops',ops:[...batch,op]})).length>64000){if(!batch.length){outgoing.delete(op.opId);engine.current?.ignored([op.opId]);setError(messages.MESSAGE_TOO_LARGE);}break;}
        batch.push(op);if(batch.length>=2)break;
      }
      if(batch.length){batch.forEach(op=>outgoing.delete(op.opId));socket.current.send(JSON.stringify({type:'ops',ops:batch}));}
    },40);
    const sync=new RoomEngine(adapter,sendOps);engine.current=sync;
    const handle=(m:any)=>{
      if(m.type==='identity'){sync.identity(m.author);if(m.studentId)sessionStorage.setItem(`room:${code}:student`,m.studentId);}
      if(m.type==='waiting'){setStatus('waiting');ready=false;}
      if(m.type==='roster')setStudents(m.students);
      if(m.type==='error'){setError(messages[m.error]||m.error);if(m.opIds)sync.ignored(m.opIds);}
      if(m.type==='ignored')sync.ignored(m.opIds);
      if(m.type==='snapshot'){ready=true;sync.snapshot(m.state,m.seq);sync.resend();setStatus('active');setError('');}
      if(m.type==='ops')sync.receive(m.ops);
      if(m.type==='snapshot-chunk'){
        const entry=chunks.get(m.id)||{total:m.total,parts:[]};entry.parts[m.index]=m.data;chunks.set(m.id,entry);
        if(entry.parts.filter(Boolean).length===entry.total){chunks.delete(m.id);handle(JSON.parse(entry.parts.join('')));}
      }
    };
    const connect=async()=>{
      setStatus('connecting');ready=false;
      try{
        const check=await fetch(`${API}/api/rooms/${code}`);const data=await check.json();
        if(!check.ok||!data.open){setError(messages[data.error||'ROOM_CLOSED']||'No se pudo conectar.');setStatus('ended');return;}
        if(stopped)return;
        const url=new URL(`${API}/api/rooms/${code}/ws`,location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('role',role);
        const ws=new WebSocket(url);socket.current=ws;
        ws.onopen=()=>{lastPong=Date.now();ws.send(JSON.stringify({type:'auth',teacherToken:options.teacherToken,name:options.name,studentId:sessionStorage.getItem(`room:${code}:student`)}));clearInterval(heartbeat);heartbeat=setInterval(()=>{if(Date.now()-lastPong>60000){ws.close();return;}if(ws.readyState===WebSocket.OPEN)ws.send('ping');},25000);};
        ws.onmessage=e=>{if(e.data==='pong'){lastPong=Date.now();return;}try{handle(JSON.parse(e.data));}catch{setError('No se pudo leer un cambio de la sala.');}};
        ws.onclose=e=>{clearInterval(heartbeat);ready=false;if(stopped)return;if([4001,4002,4003].includes(e.code)){setError(messages[e.reason]||'La conexión se cerró.');setStatus('ended');return;}setStatus('reconnecting');reconnect=setTimeout(connect,1500);};
        ws.onerror=()=>setError('Se perdió la conexión. Intentando recuperar la sala…');
      }catch{if(!stopped){setStatus('reconnecting');reconnect=setTimeout(connect,2000);}}
    };
    connect();return()=>{stopped=true;clearTimeout(reconnect);clearInterval(heartbeat);clearInterval(pump);socket.current?.close();sync.dispose();};
  },[adapter,options,retry]);
  return {status,error,students,undo:()=>engine.current?.undo(),action:(type:string,studentId?:string)=>socket.current?.readyState===WebSocket.OPEN&&socket.current.send(JSON.stringify({type,studentId})),retry:()=>{setError('');setRetry(n=>n+1);}};
}

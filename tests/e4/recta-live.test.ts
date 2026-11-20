import {SELF} from 'cloudflare:test';
import {expect,it} from 'vitest';
import {NumberLineAdapter} from '../../src/boards/recta-numerica/adapter';
import {RoomEngine} from '../../src/live/engine';
import {operationFrames} from '../../src/shared/transport';
import type {BoardId,Op} from '../../src/shared/protocol';
const origin='http://localhost:5174';let serial=0;
async function until(check:()=>boolean){for(let i=0;i<300;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5))}throw Error('Number line integration timeout')}
class Peer{
 readonly adapter:NumberLineAdapter;readonly engine:RoomEngine;author='';id='';snapshots=0;errors:string[]=[];
 constructor(readonly ws:WebSocket,role:'teacher'|'student'){
  ws.accept();this.adapter=new NumberLineAdapter(role);
  this.engine=new RoomEngine(this.adapter,ops=>{for(const op of ops)for(const frame of operationFrames(op))this.send(frame)},{boardId:'recta-numerica'});this.engine.setReadOnly(true);
  let data:string[]=[],seq=0,boardId:BoardId='recta-numerica';
  ws.addEventListener('message',event=>{
   if(event.data==='pong')return;const m=JSON.parse(event.data as string);
   if(m.type==='joined'){this.author=m.author;this.id=m.studentId;this.engine.identity(m.author)}
   if(m.type==='snapshot_start'){data=[];seq=m.seq;boardId=m.boardId}
   if(m.type==='snapshot_chunk')data[m.index]=m.data;
   if(m.type==='snapshot_end'){this.engine.snapshot(JSON.parse(data.join('')),seq,boardId);this.engine.setReadOnly(false);this.snapshots++}
   if(m.type==='ops')this.engine.receive(m.ops as Op[]);
   if(m.type==='error')this.errors.push(m.code);
   if(m.type==='paused'||m.type==='closed')this.engine.setReadOnly(true);
  });
 }
 send(value:unknown){this.ws.send(JSON.stringify(value))}
 dispose(){this.engine.dispose();try{this.ws.close()}catch{}}
}
async function room(){
 const response=await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':`198.18.30.${++serial}`},body:JSON.stringify({boardId:'recta-numerica'})});expect(response.status).toBe(200);
 const {code,teacherToken}=await response.json() as {code:string;teacherToken:string};
 async function connect(role:'teacher'|'student'){
  const response=await SELF.fetch(`http://localhost/api/rooms/${code}/ws`,{headers:{Origin:origin,Upgrade:'websocket','CF-Connecting-IP':`198.18.30.${++serial}`}});expect(response.status).toBe(101);
  const peer=new Peer(response.webSocket!,role);peer.send(role==='teacher'?{type:'hello',v:1,role,token:teacherToken}:{type:'hello',v:1,role,name:'Alumno'});await until(()=>!!peer.author);return peer;
 }
 const teacher=await connect('teacher');await until(()=>!teacher.engine.isReadOnly);const student=await connect('student');teacher.send({type:'accept',studentId:student.id});await until(()=>!student.engine.isReadOnly);return {teacher,student};
}
it('real number line adapters share notes, moving pins, clear, board restoration and disconnect pause',async()=>{
 const {teacher:t,student:s}=await room();
 try{
  const note=[{k:'t' as const,v:'Notas del profesor 🐸'}];t.adapter.commit({...t.adapter.getModel(),note,fs:26});
  await until(()=>s.adapter.getModel().fs===26&&t.engine.pendingCount===0);expect(s.adapter.getModel().note).toEqual(note);
  expect(s.adapter.commit({...s.adapter.getModel(),fs:30})).toBe(false);
  const id=s.engine.newId();s.adapter.commit({...s.adapter.getModel(),pins:[{id,t:'pin',n:-3,v:3}]});
  await until(()=>t.adapter.getModel().pins.length===1&&s.engine.pendingCount===0);
  s.adapter.commit({...s.adapter.getModel(),pins:[{id,t:'pin',n:-3,v:-4}]},false);
  await until(()=>t.adapter.getModel().pins[0].v===-4&&s.engine.pendingCount===0);
  s.adapter.commit(s.adapter.getModel(),true);await until(()=>s.engine.pendingCount===0);
  t.adapter.commit({...t.adapter.getModel(),pins:[{id,t:'pin',n:-3,v:2}]});await until(()=>s.adapter.getModel().pins[0].v===2&&t.engine.pendingCount===0);
  t.send({type:'set_board',boardId:'geometria'});await until(()=>t.snapshots===2&&s.snapshots===2);
  t.send({type:'set_board',boardId:'recta-numerica'});await until(()=>t.snapshots===3&&s.snapshots===3);expect(s.adapter.getModel().pins[0]).toEqual({id,t:'pin',n:-3,v:2});expect(s.adapter.getModel().note).toEqual(note);
  s.adapter.commit({...s.adapter.getModel(),pins:[],a:10,b:10});await until(()=>t.adapter.getModel().pins.length===0&&s.engine.pendingCount===0);
  expect(t.adapter.getState()).toEqual(s.adapter.getState());expect(t.adapter.getModel().note).toEqual(note);expect(t.adapter.getModel().fs).toBe(26);
  t.ws.close();await until(()=>s.engine.isReadOnly);expect(s.adapter.commit({...s.adapter.getModel(),a:9})).toBe(false);expect(s.adapter.getModel().a).toBe(10);
  expect([...t.errors,...s.errors]).toEqual([]);
 }finally{t.dispose();s.dispose()}
});

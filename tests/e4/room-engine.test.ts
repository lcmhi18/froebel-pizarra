import { SELF } from 'cloudflare:test';
import { expect,it } from 'vitest';
import { RoomEngine } from '../../src/live/engine';
import { TestBoardAdapter } from '../../src/boards/prueba/adapter';
import type { Op,BoardState,BoardId } from '../../src/shared/protocol';
let ip=0;
const origin='http://localhost:5174';
async function waitFor(check:()=>boolean){for(let i=0;i<300;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Room/engine condition timed out');}
class Peer{
 readonly adapter=new TestBoardAdapter();readonly engine:RoomEngine;frames:any[]=[];id='';author='';
 constructor(readonly ws:WebSocket){
  ws.accept();this.engine=new RoomEngine(this.adapter,ops=>this.send({type:'ops',ops}),{requestResync:fromSeq=>this.send({type:'resync_request',fromSeq})});this.engine.setReadOnly(true);
  const snapshots=new Map<string,{parts:string[];seq:number;boardId:BoardId}>();
  ws.addEventListener('message',event=>{
   if(event.data==='pong')return;const m=JSON.parse(event.data as string);this.frames.push(m);
   if(m.type==='joined'){this.id=m.studentId||'';this.author=m.author;this.engine.identity(m.author);}
   if(m.type==='snapshot_start')snapshots.set(m.snapshotId,{parts:[],seq:m.seq,boardId:m.boardId});
   if(m.type==='snapshot_chunk')snapshots.get(m.snapshotId)!.parts[m.index]=m.data;
   if(m.type==='snapshot_end'){const snapshot=snapshots.get(m.snapshotId)!;this.engine.snapshot(JSON.parse(snapshot.parts.join('')) as BoardState,snapshot.seq,snapshot.boardId);this.engine.setReadOnly(false);snapshots.delete(m.snapshotId);}
   if(m.type==='ops')this.engine.receive(m.ops as Op[]);
   if(m.type==='error'&&this.engine.pendingCount)this.engine.reject();
   if(m.type==='paused'||m.type==='closed')this.engine.setReadOnly(true);
  });
 }
 send(data:unknown){this.ws.send(JSON.stringify(data));}
 dispose(){this.engine.dispose();try{this.ws.close();}catch{}}
}
async function room(){
 const created=await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':`198.19.0.${++ip}`}});expect(created.status).toBe(200);const {code,teacherToken}=await created.json() as {code:string;teacherToken:string};
 async function connect(hello:unknown){const response=await SELF.fetch(`http://localhost/api/rooms/${code}/ws`,{headers:{Origin:origin,Upgrade:'websocket','CF-Connecting-IP':`198.19.0.${++ip}`}});expect(response.status).toBe(101);const peer=new Peer(response.webSocket!);peer.send(hello);await waitFor(()=>!!peer.author);return peer;}
 const teacher=await connect({type:'hello',v:1,role:'teacher',token:teacherToken});await waitFor(()=>!teacher.engine.isReadOnly);
 const student=await connect({type:'hello',v:1,role:'student',name:'Alumno'});teacher.send({type:'accept',studentId:student.id});await waitFor(()=>!student.engine.isReadOnly);
 return {teacher,student};
}
it('generic engines converge through the real Room and undo a remote deletion with its original ID',async()=>{
 const {teacher:t,student:s}=await room();
 try{
  const id=s.engine.newId();s.adapter.change(state=>{state.items[id]={x:1,y:2,fill:'red'};state.order.push(id);});await waitFor(()=>!!t.adapter.getState().items[id]&&s.engine.pendingCount===0);
  t.adapter.change(state=>{state.items[id].x=20;});await waitFor(()=>s.adapter.getState().items[id].x===20&&t.engine.pendingCount===0);
  s.adapter.change(state=>{state.items[id].y=30;});await waitFor(()=>t.adapter.getState().items[id].y===30&&s.engine.pendingCount===0);
  t.engine.undo();await waitFor(()=>s.adapter.getState().items[id].x===1&&t.engine.pendingCount===0);expect(t.adapter.getState().items[id].y).toBe(30);
  t.adapter.change(state=>{state.items={};state.order=[];});await waitFor(()=>!s.adapter.getState().items[id]&&t.engine.pendingCount===0);
  t.engine.undo();await waitFor(()=>!!s.adapter.getState().items[id]&&t.engine.pendingCount===0);
  expect(t.adapter.getState()).toEqual(s.adapter.getState());expect(Object.keys(s.adapter.getState().items)).toEqual([id]);expect(s.adapter.getState().items[id]).toEqual({x:1,y:30,fill:'red'});
  const restore=t.frames.filter(m=>m.type==='ops').flatMap(m=>m.ops as Op[]).find(op=>op.kind==='add'&&op.id===id&&op.author==='teacher');expect(restore).toBeDefined();
 }finally{t.dispose();s.dispose();}
});
it('a real teacher disconnect freezes the student engine without losing canonical state',async()=>{
 const {teacher:t,student:s}=await room();
 try{
  const id=s.engine.newId();s.adapter.change(state=>{state.items[id]={x:3};state.order.push(id);});await waitFor(()=>s.engine.pendingCount===0&&!!t.adapter.getState().items[id]);
  t.ws.close();await waitFor(()=>s.engine.isReadOnly);s.adapter.change(state=>{state.items[id].x=99;});expect(s.adapter.getState().items[id].x).toBe(3);expect(s.engine.pendingCount).toBe(0);
 }finally{t.dispose();s.dispose();}
});

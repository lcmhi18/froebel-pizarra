import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomConnection } from '../../.live-test/unit/live/connection.js';
import { TestBoardAdapter } from '../../.live-test/unit/boards/prueba/adapter.js';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check){for(let i=0;i<100;i++){if(check())return;await pause(5);}throw Error('Transport condition timeout');}
function harness(t,options={}){
 const saved=new Map();for(const key of ['WebSocket','fetch','location','sessionStorage','localStorage'])saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
 const memory=()=>{const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};};
 const sockets=[],requests=[];
 class FakeSocket{
  static OPEN=1;readyState=0;sent=[];
  constructor(url){this.url=String(url);sockets.push(this);}
  open(){this.readyState=1;this.onopen?.();}
  send(frame){this.sent.push(frame==='ping'?'ping':JSON.parse(frame));}
  receive(message){this.onmessage?.({data:JSON.stringify(message)});}
  close(code=1000,reason=''){this.readyState=3;queueMicrotask(()=>this.onclose?.({code,reason}));}
 }
 const mocks={WebSocket:FakeSocket,fetch:async(url,init)=>{requests.push({url:String(url),init});return Response.json({open:true});},location:{origin:'http://localhost:5174',pathname:'/boards/prueba/'},sessionStorage:memory(),localStorage:memory()};
 for(const [key,value] of Object.entries(mocks))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 const adapter=new TestBoardAdapter(),connection=new RoomConnection(adapter,{code:'ABC234',role:'teacher',teacherToken:'a'.repeat(64),...options});
 t.after(()=>{connection.stop();for(const [key,descriptor] of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];});
 const snapshot=(ws,state={items:{},order:[],fields:{}},seq=0)=>{const data=JSON.stringify(state);ws.receive({type:'snapshot_start',snapshotId:'snapshot',boardId:'prueba',seq,chunks:2});ws.receive({type:'snapshot_chunk',snapshotId:'snapshot',index:0,data:data.slice(0,10)});ws.receive({type:'snapshot_chunk',snapshotId:'snapshot',index:1,data:data.slice(10)});ws.receive({type:'snapshot_end',snapshotId:'snapshot',boardId:'prueba',seq});};
 async function ready(){connection.start();await until(()=>sockets.length===1);const ws=sockets[0];ws.open();ws.receive({type:'joined',author:'teacher',status:'active'});snapshot(ws);return ws;}
 return {adapter,connection,sockets,requests,mocks,snapshot,ready};
}
test('teacher authenticates only in hello, sends v1 changes and reconciles echo without DOM',async t=>{
 const {connection,adapter,sockets,ready}=harness(t);const ws=await ready();assert.equal(connection.getSnapshot().status,'active');assert(!ws.url.includes('aaaa'));assert.deepEqual(ws.sent[0],{type:'hello',v:1,role:'teacher',token:'a'.repeat(64)});
 const id=connection.engine.newId();adapter.change(state=>{state.items[id]={x:1};state.order.push(id);});await until(()=>ws.sent.some(m=>m.type==='ops'));const sent=ws.sent.find(m=>m.type==='ops').ops[0];assert.equal(sent.boardId,'prueba');assert(sent.gestureId);ws.receive({type:'ops',ops:[{...sent,seq:1}]});assert.equal(connection.engine.pendingCount,0);assert.equal(sockets.length,1);
});
test('student without a credential asks for a name before opening the network, then waits read-only',async t=>{
 const {connection,adapter,sockets,requests}=harness(t,{role:'student',teacherToken:undefined});connection.start();assert.equal(connection.getSnapshot().status,'entry');assert.equal(requests.length,0);assert.equal(sockets.length,0);
 connection.join('Ana');await until(()=>sockets.length===1);const ws=sockets[0];ws.open();assert.deepEqual(ws.sent[0],{type:'hello',v:1,role:'student',name:'Ana'});ws.receive({type:'joined',studentId:'12345678-1234-4234-8234-123456789012',author:'u-public',name:'Ana',status:'pending'});ws.receive({type:'waiting'});adapter.change(state=>{state.items['u-public:blocked']={};});assert.equal(connection.getSnapshot().status,'waiting');assert.equal(adapter.readOnly,true);assert.equal(Object.keys(adapter.getState().items).length,0);
});
test('existing UUID is resumed without exposing it as author or putting it in the URL',async t=>{
 const {connection,sockets,mocks}=harness(t,{role:'student',teacherToken:undefined});const id='12345678-1234-4234-8234-123456789012';mocks.sessionStorage.setItem('room:ABC234:student',id);connection.start();await until(()=>sockets.length===1);const ws=sockets[0];ws.open();assert.equal(ws.sent[0].studentId,id);assert(!ws.url.includes(id));ws.receive({type:'joined',studentId:id,author:'u-public',name:'Ana (2)',status:'active'});assert.equal(connection.getSnapshot().name,'Ana (2)');assert.equal(connection.getSnapshot().author,'u-public');
});
test('incomplete snapshots cannot enable editing; complete snapshots preserve text safely',async t=>{
 const {connection,adapter,sockets}=harness(t);connection.start();await until(()=>sockets.length===1);const ws=sockets[0];ws.open();ws.receive({type:'joined',author:'teacher',status:'active'});
 const state={items:{'teacher:text':{type:'text',text:'<img onerror=alert(1)>😀'}},order:['teacher:text'],fields:{}};const data=JSON.stringify(state);ws.receive({type:'snapshot_start',snapshotId:'x',boardId:'prueba',seq:4,chunks:2});ws.receive({type:'snapshot_chunk',snapshotId:'x',index:0,data:data.slice(0,30)});ws.receive({type:'snapshot_end',snapshotId:'x',boardId:'prueba',seq:4});assert.equal(adapter.readOnly,true);ws.receive({type:'snapshot_chunk',snapshotId:'x',index:1,data:data.slice(30)});ws.receive({type:'snapshot_end',snapshotId:'x',boardId:'prueba',seq:4});assert.equal(adapter.readOnly,false);assert.equal(adapter.getState().items['teacher:text'].text,state.items['teacher:text'].text);
});
test('rejected ops request resync, discard pending edits and resume from the authoritative snapshot',async t=>{
 const {connection,adapter,ready,snapshot}=harness(t);const ws=await ready();const id=connection.engine.newId();adapter.change(state=>{state.items[id]={x:9};state.order.push(id);});await until(()=>ws.sent.some(m=>m.type==='ops'));const op=ws.sent.find(m=>m.type==='ops').ops[0];ws.receive({type:'error',code:'STATE_TOO_LARGE',ref:op.opId});assert.equal(connection.getSnapshot().status,'reconnecting');assert.equal(connection.engine.pendingCount,0);assert(ws.sent.some(m=>m.type==='resync_request'));snapshot(ws);assert.equal(connection.getSnapshot().status,'active');assert.equal(adapter.getState().items[id],undefined);
});
test('pause blocks edits, resume resyncs, and a replaced socket ends clearly',async t=>{
 const {connection,adapter,ready,snapshot}=harness(t);const ws=await ready();ws.receive({type:'paused',reason:'teacher_disconnected'});assert.equal(adapter.readOnly,true);assert.equal(connection.getSnapshot().status,'paused');ws.receive({type:'resumed'});assert(ws.sent.some(m=>m.type==='resync_request'));snapshot(ws);assert.equal(adapter.readOnly,false);ws.close(4005,'REPLACED_SESSION');await until(()=>connection.getSnapshot().status==='ended');assert.match(connection.getSnapshot().error,/otra pestaña/);
});
test('stop discards late HTTP completions and retry ignores messages from the previous socket',async t=>{
 const h=harness(t);const first=await h.ready();h.connection.retry();await until(()=>h.sockets.length===2);const second=h.sockets[1];second.open();second.receive({type:'joined',author:'teacher',status:'active'});h.snapshot(second);first.receive({type:'closed'});assert.equal(h.connection.getSnapshot().status,'active');h.connection.stop();second.receive({type:'waiting'});assert.equal(h.adapter.readOnly,true);
});
test('HTTP completion after stop never opens a socket',async t=>{
 const {connection,sockets}=harness(t);let resolve;globalThis.fetch=()=>new Promise(r=>resolve=r);connection.start();connection.stop();resolve(Response.json({open:true}));await pause(5);assert.equal(sockets.length,0);
});
test('invalid code or missing teacher credential never opens a network session',t=>{
 const h=harness(t,{code:'INVALID'});h.connection.start();assert.equal(h.connection.getSnapshot().status,'ended');assert.equal(h.requests.length,0);assert.equal(h.sockets.length,0);
});

test('missing teacher credentials and blank sanitized names never start authentication',t=>{
 const h=harness(t,{role:'teacher',teacherToken:undefined});h.connection.start();assert.equal(h.connection.getSnapshot().status,'ended');assert.equal(h.requests.length,0);h.connection.join('<b></b>');assert.match(h.connection.getSnapshot().error,/nombre/);assert.equal(h.requests.length,0);
});

test('network failure during reopen is reported without leaking the teacher token into the URL',async t=>{
 const h=harness(t);let target;globalThis.fetch=async url=>{target=String(url);throw Error('offline');};await h.connection.reopen();assert.match(h.connection.getSnapshot().error,/reabrir/);assert(!target.includes('aaaa'));
});

test('an expired student credential is cleared so the next attempt can request a new admission',async t=>{
 const h=harness(t,{role:'student',teacherToken:undefined});h.mocks.sessionStorage.setItem('room:ABC234:student','12345678-1234-4234-8234-123456789012');h.connection.start();await until(()=>h.sockets.length===1);h.sockets[0].open();h.sockets[0].close(4006,'BAD_AUTH');await until(()=>h.connection.getSnapshot().status==='ended');assert.equal(h.mocks.sessionStorage.getItem('room:ABC234:student'),null);h.connection.retry();assert.equal(h.connection.getSnapshot().status,'entry');assert.equal(h.sockets.length,1);
});

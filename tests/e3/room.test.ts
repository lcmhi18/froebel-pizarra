import { SELF,runInDurableObject,runDurableObjectAlarm,evictDurableObject } from 'cloudflare:test';
import { env as bindings } from 'cloudflare:workers';
import { describe,it,expect } from 'vitest';
import type { Env } from '../../worker/protocol';
import type { Room } from '../../worker/room';
const env=bindings as Env,origin='http://localhost:5174';let serial=0;
const freshIP=()=>`203.0.${Math.floor(serial/250)}.${++serial%250}`;
class Client{
  frames:any[]=[];closeCode:number|undefined;ws:WebSocket;
  constructor(ws:WebSocket){this.ws=ws;ws.accept();ws.addEventListener('message',e=>{if(e.data!=='pong')this.frames.push(JSON.parse(e.data as string));});ws.addEventListener('close',e=>{this.closeCode=e.code;});}
  send(message:unknown){this.ws.send(JSON.stringify(message));}
  async until(type:string,predicate:(m:any)=>boolean=()=>true){for(let i=0;i<200;i++){const at=this.frames.findIndex(m=>m.type===type&&predicate(m));if(at>=0)return this.frames.splice(at,1)[0];await new Promise(r=>setTimeout(r,5));}throw Error(`Missing ${type}: ${JSON.stringify(this.frames)}`);}
  async closed(code:number){for(let i=0;i<200&&this.closeCode===undefined;i++)await new Promise(r=>setTimeout(r,5));expect(this.closeCode).toBe(code);}
}
async function fixture(){
 const response=await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':freshIP()}});expect(response.status).toBe(200);const data=await response.json() as {code:string;teacherToken:string};
 const lookup=await env.REGISTRY.get(env.REGISTRY.idFromName('registry')).fetch('https://registry/lookup',{method:'POST',body:JSON.stringify({code:data.code})});const {room}=await lookup.json() as {room:string};
 const stub=env.ROOM.get(env.ROOM.idFromName(room)) as DurableObjectStub<Room>;
 async function connect(role='student',hello?:unknown,ip=freshIP()){
  const r=await SELF.fetch(`http://localhost/api/rooms/${data.code}/ws?role=${role}`,{headers:{Origin:origin,Upgrade:'websocket','CF-Connecting-IP':ip}});expect(r.status).toBe(101);const c=new Client(r.webSocket!);if(hello)c.send(hello);return c;
 }
 async function teacher(){const c=await connect('student',{type:'hello',v:1,role:'teacher',token:data.teacherToken});await c.until('snapshot_end');c.frames=[];return c;}
 async function student(name='Ana'){const c=await connect('teacher',{type:'hello',v:1,role:'student',name});const joined=await c.until('joined');await c.until('waiting');return {c,...joined};}
 return {...data,stub,connect,teacher,student};
}
const add=(author:string,id=`${author}:${crypto.randomUUID()}`,patch:Record<string,unknown>={x:1})=>({opId:`${author}:${crypto.randomUUID()}`,author,boardId:'prueba',gestureId:'gesture',kind:'add',id,patch});
async function active(f:Awaited<ReturnType<typeof fixture>>,t:Client){const s=await f.student();t.send({type:'accept',studentId:s.studentId});await s.c.until('snapshot_end');s.c.frames=[];return s;}
describe('E3 room authority and lifecycle',()=>{
 it('requires an allowed Origin for POST and upgrade, including missing Origin',async()=>{
  for(const headers of [{} as Record<string,string>,{Origin:'https://evil.example'}])expect((await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers})).status).toBe(403);
  const f=await fixture();expect((await SELF.fetch(`http://localhost/api/rooms/${f.code}/ws`,{headers:{Upgrade:'websocket'}})).status).toBe(403);
  expect(await (await SELF.fetch('http://localhost/api/rooms/ZZZZZ2',{headers:{'CF-Connecting-IP':freshIP()}})).json()).toEqual({open:false});
 });
 it('authenticates role from hello, keeps UUID credential private, sanitizes duplicate names',async()=>{
  const f=await fixture(),t=await f.teacher(),s=await f.student('<b>Ana</b>'),s2=await f.student('Ana');
  expect(s.studentId).toMatch(/^[0-9a-f-]{36}$/);expect(s.author).not.toContain(s.studentId);
  const roster=await t.until('roster',m=>m.pending.length===2);expect(roster.pending.map((r:any)=>r.name)).toEqual(['Ana','Ana (2)']);
  expect(s.c.frames.some((m:any)=>m.type.startsWith('snapshot')||m.type==='roster')).toBe(false);
  s.c.send({type:'accept',studentId:s2.studentId});expect((await s.c.until('error')).code).toBe('FORBIDDEN');
  s.c.send({type:'ops',ops:[add(s.author)]});expect((await s.c.until('error')).code).toBe('NOT_ACTIVE');
  t.send({type:'accept',studentId:s.studentId});await s.c.until('snapshot_end');const op=add(s.author);s.c.send({type:'ops',ops:[op]});expect(JSON.stringify(await t.until('ops'))).not.toContain(s.studentId);
 });
 it('rejects bad credentials/version and expires unauthenticated sockets from SQLite alarm',async()=>{
  const f=await fixture();const bad=await f.connect('teacher',{type:'hello',v:1,role:'teacher',token:'0'.repeat(64)});await bad.closed(4006);
  const version=await f.connect('student',{type:'hello',v:2,role:'student',name:'Ana'});await version.closed(4009);
  const idle=await f.connect();await runInDurableObject(f.stub,(_r,state)=>{state.storage.sql.exec('UPDATE auth_deadlines SET deadline=?',Date.now()-1);});await runDurableObjectAlarm(f.stub);await idle.closed(4008);
 });
 it('caps pending at ten, active at five, and immediately releases a kicked slot',async()=>{
  const f=await fixture(),t=await f.teacher(),students=[];
  for(let i=0;i<10;i++)students.push(await f.student(`Alumno ${i}`));
  const overflow=await f.connect('student',{type:'hello',v:1,role:'student',name:'Once'});expect((await overflow.until('error')).code).toBe('PENDING_FULL');
  for(const s of students.slice(0,5)){t.send({type:'accept',studentId:s.studentId});await s.c.until('snapshot_end');}
  t.send({type:'accept',studentId:students[5].studentId});expect((await t.until('error')).code).toBe('ROOM_FULL');
  t.send({type:'kick',studentId:students[0].studentId});await students[0].c.closed(4001);
  t.send({type:'accept',studentId:students[5].studentId});await students[5].c.until('snapshot_end');
  t.send({type:'reject',studentId:students[6].studentId});await students[6].c.closed(4003);
 });
 it('replaces both teacher and student sessions; a removed student returns pending',async()=>{
  const f=await fixture(),t=await f.teacher(),s=await active(f,t);const t2=await f.teacher();await t.closed(4005);
  const resumed=await f.connect('student',{type:'hello',v:1,role:'student',studentId:s.studentId});expect((await resumed.until('joined')).author).toBe(s.author);await resumed.until('snapshot_end');await s.c.closed(4005);
  t2.send({type:'kick',studentId:s.studentId});await resumed.closed(4001);
  const returned=await f.connect('student',{type:'hello',v:1,role:'student',studentId:s.studentId});expect((await returned.until('joined')).status).toBe('pending');await returned.until('waiting');
 });
 it('pauses immediately, blocks edits, cancels grace on teacher return, and closes after expiry',async()=>{
  const f=await fixture(),t=await f.teacher(),s=await active(f,t);t.ws.close();await s.c.until('paused');
  s.c.send({type:'ops',ops:[add(s.author)]});expect((await s.c.until('error')).code).toBe('PAUSED');
  const grace=await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{grace_at:number}>('SELECT grace_at FROM meta').toArray()[0].grace_at);expect(grace-Date.now()).toBeGreaterThan(55000);
  const t2=await f.teacher();await s.c.until('resumed');expect(await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{grace_at:number|null}>('SELECT grace_at FROM meta').toArray()[0].grace_at)).toBeNull();
  t2.ws.close();await s.c.until('paused');await runInDurableObject(f.stub,(_r,state)=>{state.storage.sql.exec('UPDATE meta SET grace_at=?',Date.now()-1);});await runDurableObjectAlarm(f.stub);await s.c.closed(4002);
  expect(await(await SELF.fetch(`http://localhost/api/rooms/${f.code}`,{headers:{'CF-Connecting-IP':freshIP()}})).json()).toEqual({open:false});
 });
 it('retains closed state, allows owner reopening, then purges all SQLite tables after 24h',async()=>{
  const f=await fixture(),t=await f.teacher();t.send({type:'ops',ops:[add('teacher')]});await t.until('ops');t.send({type:'close_room'});await t.closed(4002);
  const expiry=await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{purge_at:number}>('SELECT purge_at FROM meta').toArray()[0].purge_at);expect(expiry-Date.now()).toBeGreaterThan(86390000);
  const r=await SELF.fetch(`http://localhost/api/rooms/${f.code}/reopen`,{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':freshIP()},body:JSON.stringify({teacherToken:f.teacherToken})});expect(r.status).toBe(200);
  const t2=await f.teacher();t2.send({type:'close_room'});await t2.closed(4002);
  await runInDurableObject(f.stub,(_r,state)=>{state.storage.sql.exec('UPDATE meta SET purge_at=?',Date.now()-1);});await runDurableObjectAlarm(f.stub);
  expect(await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%'").toArray())).toEqual([]);
 });
 it('merges independent patches, ignores deleted updates, deduplicates operations and bounds snapshot frames',async()=>{
  const f=await fixture(),t=await f.teacher(),s=await active(f,t),op=add('teacher');t.send({type:'ops',ops:[op]});await t.until('ops');await s.c.until('ops');
  const patch=(author:string,patch:Record<string,unknown>)=>({...add(author),kind:'update',id:op.id,patch});
  t.send({type:'ops',ops:[patch('teacher',{x:8})]});s.c.send({type:'ops',ops:[patch(s.author,{fill:'red'})]});await t.until('ops',m=>m.ops[0].author===s.author);
  t.send({type:'resync_request',fromSeq:0});const start=await t.until('snapshot_start');const chunk=await t.until('snapshot_chunk',m=>m.snapshotId===start.snapshotId);const state=JSON.parse(chunk.data);expect(state.items[op.id]).toEqual({x:8,fill:'red'});
  t.send({type:'ops',ops:[op]});const dup=await t.until('ops',m=>m.ops[0].opId===op.opId);expect(dup.ops[0].seq).toBe(1);
  const remove={...add('teacher'),kind:'remove',id:op.id};delete (remove as any).patch;t.send({type:'ops',ops:[remove]});await t.until('ops',m=>m.ops[0].kind==='remove');
  s.c.send({type:'ops',ops:[patch(s.author,{x:99})]});expect((await s.c.until('error')).code).toBe('NOT_FOUND');
  const field={opId:`teacher:${crypto.randomUUID()}`,author:'teacher',boardId:'prueba',gestureId:'g',kind:'field',field:'unicode',value:'😀\n"'.repeat(4000)};t.send({type:'ops',ops:[field]});await t.until('ops',m=>m.ops[0].kind==='field');t.send({type:'resync_request',fromSeq:0});const large=await t.until('snapshot_start');for(let i=0;i<large.chunks;i++){const c=await t.until('snapshot_chunk',m=>m.snapshotId===large.snapshotId);expect(new TextEncoder().encode(JSON.stringify(c)).length).toBeLessThanOrEqual(32768);}
 });
 it('recovers authenticated sockets and canonical state after actual hibernation',async()=>{
  const f=await fixture(),t=await f.teacher(),student=await active(f,t),op=add('teacher');t.send({type:'ops',ops:[op]});await t.until('ops');await student.c.until('ops');await evictDurableObject(f.stub);
  t.send({type:'resync_request',fromSeq:0});const start=await t.until('snapshot_start');const c=await t.until('snapshot_chunk',m=>m.snapshotId===start.snapshotId);expect(JSON.parse(c.data).items[op.id]).toEqual({x:1});
  const update={...add(student.author),kind:'update',id:op.id,patch:{y:9}};student.c.send({type:'ops',ops:[update]});expect((await t.until('ops')).ops[0].author).toBe(student.author);
 });
 it('enforces burst rate and rejects malformed or forged-author frames without crashing',async()=>{
  const f=await fixture(),t=await f.teacher();t.ws.send('{');expect((await t.until('error')).code).toBe('BAD_MESSAGE');
  t.send({type:'ops',ops:[add('intruder')]});expect((await t.until('error')).code).toBe('FORBIDDEN');
  t.send({type:'ops',ops:Array.from({length:119},()=>add('teacher'))});await t.until('ops');t.send({type:'ops',ops:Array.from({length:120},()=>add('teacher'))});expect((await t.until('error')).code).toBe('RATE_LIMITED');
 });
 it('rolls back an oversized state atomically and keeps the room usable',async()=>{
  const f=await fixture(),t=await f.teacher();
  await runInDurableObject(f.stub,(_r,state)=>{state.storage.sql.exec('UPDATE state SET json=?',JSON.stringify({items:{},order:[],fields:{large:'x'.repeat(1048000)}}));});
  const op={opId:'teacher:large',author:'teacher',boardId:'prueba',gestureId:'g',kind:'field',field:'extra',value:'x'.repeat(1000)};
  t.send({type:'ops',ops:[op]});expect((await t.until('error')).code).toBe('STATE_TOO_LARGE');
  expect(await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{seq:number}>('SELECT seq FROM meta').toArray()[0].seq)).toBe(0);
  t.send({type:'ops',ops:[{...op,opId:'teacher:small',value:'ok'}]});await t.until('ops');
 });
 it('uses the shorter ten-second grace for an explicit teacher departure',async()=>{
  const f=await fixture(),t=await f.teacher(),s=await active(f,t);t.send({type:'teacher_leaving'});await s.c.until('paused');
  const grace=await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{grace_at:number}>('SELECT grace_at FROM meta').toArray()[0].grace_at);
  expect(grace-Date.now()).toBeGreaterThan(8000);expect(grace-Date.now()).toBeLessThanOrEqual(10000);
 });
 it('limits student admission to one per three seconds per hashed IP',async()=>{
  const f=await fixture(),ip=freshIP();const first=await f.connect('student',{type:'hello',v:1,role:'student',name:'Uno'},ip);await first.until('joined');
  const second=await f.connect('student',{type:'hello',v:1,role:'student',name:'Dos'},ip);expect((await second.until('error')).code).toBe('RATE_LIMITED');await second.closed(4007);
 });

 it('migrates the legacy snapshot and journal without retaining legacy student authority',async()=>{
  const f=await fixture(),oldSocket=await f.connect();
  await runInDurableObject(f.stub,(_r,state)=>{
    state.getWebSockets()[0].serializeAttachment({role:'student',ready:true,id:'a'.repeat(64)});
    const sql=state.storage.sql,m=sql.exec<{code:string;room:string;teacher_token_hash:string}>('SELECT * FROM meta').toArray()[0];
    for(const table of ['meta','students','state','ops','tombstones','sessions','auth_deadlines'])sql.exec('DROP TABLE '+table);
    sql.exec('CREATE TABLE meta(code TEXT,room TEXT,teacher_token_hash TEXT,closed INTEGER,created_at INTEGER)');
    sql.exec('INSERT INTO meta VALUES(?,?,?,0,?)',m.code,m.room,m.teacher_token_hash,Date.now());
    sql.exec('CREATE TABLE state(json TEXT,seq INTEGER)');sql.exec('INSERT INTO state VALUES(?,0)',JSON.stringify({items:{},order:[],fields:{}}));
    sql.exec('CREATE TABLE ops(seq INTEGER PRIMARY KEY,author TEXT,json TEXT,op_id TEXT UNIQUE)');
    sql.exec('INSERT INTO ops VALUES(1,?,?,?)','teacher',JSON.stringify({opId:'teacher:legacy',author:'teacher',kind:'add',id:'teacher:old',patch:{x:7}}),'teacher:legacy');
    sql.exec('CREATE TABLE students(id TEXT PRIMARY KEY,name TEXT,status TEXT,last_seen INTEGER)');sql.exec('INSERT INTO students VALUES(?,?,?,?)','a'.repeat(64),'Anterior','active',Date.now());
    sql.exec('CREATE TABLE tombstones(id TEXT PRIMARY KEY)');
  });
  await evictDurableObject(f.stub);
  const t=await f.connect('teacher',{type:'hello',v:1,role:'teacher',token:f.teacherToken});const start=await t.until('snapshot_start');const chunk=await t.until('snapshot_chunk',m=>m.snapshotId===start.snapshotId);
  await oldSocket.closed(4009);expect(start.seq).toBe(1);expect(JSON.parse(chunk.data).items['teacher:old']).toEqual({x:7});
  expect(await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{n:number}>('SELECT count(*) AS n FROM students').toArray()[0].n)).toBe(0);
 });
 it('compacts the snapshot at the 200-operation boundary',async()=>{
  const f=await fixture(),t=await f.teacher();await runInDurableObject(f.stub,(_r,state)=>{state.storage.sql.exec('UPDATE meta SET seq=199');});
  const op=add('teacher');t.send({type:'ops',ops:[op]});expect((await t.until('ops')).ops[0].seq).toBe(200);
  const compact=await runInDurableObject(f.stub,(_r,state)=>state.storage.sql.exec<{json:string;seq:number}>('SELECT json,seq FROM state').toArray()[0]);expect(compact.seq).toBe(200);expect(JSON.parse(compact.json).items[op.id]).toEqual({x:1});
 });

});



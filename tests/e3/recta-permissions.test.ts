import {SELF,runInDurableObject,evictDurableObject,runDurableObjectAlarm} from 'cloudflare:test';
import {env as bindings} from 'cloudflare:workers';
import {afterEach,expect,it} from 'vitest';
import type {Env} from '../../worker/protocol';
import type {Room} from '../../worker/room';
import type {BoardState,Op} from '../../src/shared/protocol';
import {operationFrames} from '../../src/shared/transport';
const env=bindings as Env,origin='http://localhost:5174';let serial=0;
const clients:Client[]=[];
class Client{
 frames:any[]=[];author='';id='';
 constructor(readonly ws:WebSocket){ws.accept();clients.push(this);ws.addEventListener('message',event=>{if(event.data!=='pong')this.frames.push(JSON.parse(event.data as string))});}
 send(value:unknown){this.ws.send(JSON.stringify(value))}
 async next(type:string,predicate:(frame:any)=>boolean=()=>true){for(let i=0;i<300;i++){const at=this.frames.findIndex(frame=>frame.type===type&&predicate(frame));if(at>=0)return this.frames.splice(at,1)[0];await new Promise(resolve=>setTimeout(resolve,5))}throw Error('Missing '+type)}
 operation(data:Record<string,unknown>){return {opId:this.author+':'+crypto.randomUUID(),author:this.author,boardId:'recta-numerica',gestureId:'g',...data}}
 async accepted(data:Record<string,unknown>){const operation=this.operation(data);this.send({type:'ops',ops:[operation]});return this.next('ops',frame=>frame.ops[0].opId===operation.opId)}
 async rejected(data:Record<string,unknown>,code:string){const operation=this.operation(data);this.send({type:'ops',ops:[operation]});expect((await this.next('error',frame=>frame.ref===operation.opId)).code).toBe(code)}
 async snapshot(){this.send({type:'resync_request',fromSeq:0});const start=await this.next('snapshot_start');let text='';for(let i=0;i<start.chunks;i++)text+=(await this.next('snapshot_chunk',frame=>frame.snapshotId===start.snapshotId&&frame.index===i)).data;await this.next('snapshot_end',frame=>frame.snapshotId===start.snapshotId);return {state:JSON.parse(text) as BoardState,seq:start.seq}}
}
afterEach(()=>{for(const client of clients.splice(0))try{client.ws.close()}catch{}});
it('combined operations shares the teacher lesson and rejects pupil control and invalid lessons',async()=>{
 const {teacher,student}=await fixture();teacher.send({type:'set_board',boardId:'operaciones-combinadas'});await student.next('snapshot_end');await teacher.next('snapshot_end');teacher.frames=[];student.frames=[];
 const operation=(client:Client,value:unknown)=>({...client.operation({kind:'field',field:'lesson',value}),boardId:'operaciones-combinadas'});
 const initial=operation(teacher,{expression:'30-[12-(5*3-20)]',step:2});teacher.send({type:'ops',ops:[initial]});
 expect((await student.next('ops',m=>m.ops[0].opId===initial.opId)).ops[0].value).toEqual({expression:'30-[12-(5*3-20)]',step:2});
 const forbidden=operation(student,{expression:'1+2',step:1});student.send({type:'ops',ops:[forbidden]});expect((await student.next('error')).code).toBe('FORBIDDEN');
 const stroke={...teacher.operation({kind:'add',id:'teacher:drawing',patch:{t:'stroke',c:'#fff02b',w:5,a:1,p:[[.1,.2],[.6,.25]]}}),boardId:'operaciones-combinadas'};teacher.send({type:'ops',ops:[stroke]});expect((await student.next('ops',m=>m.ops[0].opId===stroke.opId)).ops[0].patch.t).toBe('stroke');
 const erase={...student.operation({kind:'remove',id:'teacher:drawing'}),boardId:'operaciones-combinadas'};student.send({type:'ops',ops:[erase]});expect((await student.next('error')).code).toBe('FORBIDDEN');
 const shape={...teacher.operation({kind:'add',id:'teacher:rectangle',patch:{t:'shape',kind:'rect',c:'#123abc',w:9,a:1,x1:.1,y1:.2,x2:.5,y2:.4}}),boardId:'operaciones-combinadas'};teacher.send({type:'ops',ops:[shape]});expect((await student.next('ops',m=>m.ops[0].opId===shape.opId)).ops[0].patch.kind).toBe('rect');
 const resize={...teacher.operation({kind:'update',id:'teacher:rectangle',patch:{x2:.8,y2:.6,c:'#ab1234',w:12}}),boardId:'operaciones-combinadas'};teacher.send({type:'ops',ops:[resize]});await student.next('ops',m=>m.ops[0].opId===resize.opId);
 const badColor={...teacher.operation({kind:'update',id:'teacher:rectangle',patch:{c:'url(unsafe)'}}),boardId:'operaciones-combinadas'};teacher.send({type:'ops',ops:[badColor]});expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');
 expect((await teacher.snapshot()).state.items['teacher:rectangle']).toEqual({t:'shape',kind:'rect',c:'#ab1234',w:12,a:1,x1:.1,y1:.2,x2:.8,y2:.6});
 for(const value of [{expression:'7/2',step:0},{expression:'1+2',step:60},{expression:'1+2',step:0,unexpected:true}]){const invalid=operation(teacher,value);teacher.send({type:'ops',ops:[invalid]});expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');}
 expect((await teacher.snapshot()).state.fields.lesson).toEqual({expression:'30-[12-(5*3-20)]',step:2});
});
async function fixture(){
 const headers={Origin:origin,'CF-Connecting-IP':`198.18.20.${++serial}`};
 const response=await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers,body:JSON.stringify({boardId:'recta-numerica'})});expect(response.status).toBe(200);
 const {code,teacherToken}=await response.json() as {code:string;teacherToken:string};
 const lookup=await env.REGISTRY.get(env.REGISTRY.idFromName('registry')).fetch('https://registry/lookup',{method:'POST',body:JSON.stringify({code})});const {room}=await lookup.json() as {room:string};
 const stub=env.ROOM.get(env.ROOM.idFromName(room)) as DurableObjectStub<Room>;
 async function connect(role:'teacher'|'student'){
  const response=await SELF.fetch(`http://localhost/api/rooms/${code}/ws`,{headers:{...headers,'CF-Connecting-IP':`198.18.20.${++serial}`,Upgrade:'websocket'}});expect(response.status).toBe(101);
  const client=new Client(response.webSocket!);client.send(role==='teacher'?{type:'hello',v:1,role,token:teacherToken}:{type:'hello',v:1,role,name:'Alumno'});
  const joined=await client.next('joined');client.author=joined.author;client.id=joined.studentId;
  if(role==='teacher')await client.next('snapshot_end');else await client.next('waiting');client.frames=[];return client;
 }
 const teacher=await connect('teacher'),student=await connect('student');teacher.send({type:'accept',studentId:student.id});await student.next('snapshot_end');student.frames=[];
 return {teacher,student,connect,stub};
}
for(const field of ['note','fs'])it(`server refuses student ${field} changes without changing state`,async()=>{
 const {teacher,student}=await fixture();const before=await teacher.snapshot();
 await student.rejected({kind:'field',field,value:field==='fs'?24:[{k:'t',v:'No permitido'}]},'FORBIDDEN');
 expect(await teacher.snapshot()).toEqual(before);
});
it('large Unicode notes survive fragment upload and Durable Object hibernation',async()=>{
 const {teacher,student,stub}=await fixture();
 const note=[{k:'t',v:'Álgebra 🐸\n'.repeat(12000)}],operation=teacher.operation({kind:'field',field:'note',value:note}) as Op;
 const frames=operationFrames(operation);expect(frames.length).toBeGreaterThan(1);teacher.send(frames[0]);
 // A ping follows the first fragment on the same ordered WebSocket.
 await teacher.snapshot();
 await runInDurableObject(stub,(_room,state)=>{expect(state.storage.sql.exec<{received:number}>('SELECT received FROM op_uploads').toArray()[0].received).toBe(1)});
 await evictDurableObject(stub);
 for(const frame of frames.slice(1))teacher.send(frame);
 expect((await student.next('ops',frame=>frame.ops[0].opId===operation.opId)).ops[0].value).toEqual(note);
 expect((await teacher.snapshot()).state.fields.note).toEqual(note);
 await runInDurableObject(stub,(_room,state)=>{expect(state.storage.sql.exec('SELECT * FROM op_upload_parts').toArray()).toHaveLength(0)});
});
it('fragment uploads forbid students, reject missing parts, and expire without changing state',async()=>{
 const {teacher,student,stub}=await fixture(),before=await teacher.snapshot();
 const operation=teacher.operation({kind:'field',field:'note',value:[{k:'t',v:'x'.repeat(70000)}]}) as Op,frames=operationFrames(operation);
 student.send(frames[0]);expect((await student.next('error')).code).toBe('FORBIDDEN');
 teacher.send(frames[1]);expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');
 teacher.send(frames[0]);await teacher.snapshot();
 await runInDurableObject(stub,(_room,state)=>{state.storage.sql.exec('UPDATE op_uploads SET expires=?',Date.now()-1)});await runDurableObjectAlarm(stub);
 teacher.send(frames[1]);expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');
 expect(await teacher.snapshot()).toEqual(before);
});
it('a 300 KB image reaches students in bounded frames; invalid assembled notes are rejected',async()=>{
 const {teacher,student}=await fixture();
 const image='data:image/png;base64,'+btoa('\x89PNG\r\n\x1a\n'+'x'.repeat(300*1024-8));
 const operation=teacher.operation({kind:'field',field:'note',value:[{k:'i',src:image}]}) as Op;
 for(const frame of operationFrames(operation))teacher.send(frame);
 expect((await student.next('ops',frame=>frame.ops[0].opId===operation.opId)).ops[0].value).toEqual([{k:'i',src:image}]);
 const before=await teacher.snapshot(),invalid=teacher.operation({kind:'field',field:'note',value:[{k:'i',src:'data:image/png;base64,'+btoa('x'.repeat(70000))}]}) as Op;
 for(const frame of operationFrames(invalid))teacher.send(frame);
 expect((await teacher.next('error',frame=>frame.ref===invalid.opId)).code).toBe('BAD_MESSAGE');expect(await teacher.snapshot()).toEqual(before);
});
it('server rejects pin number edits and out-of-range pin positions',async()=>{
 const {teacher,student}=await fixture(),id=teacher.author+':pin';
 await teacher.accepted({kind:'add',id,patch:{t:'pin',n:3,v:3}});
 await student.rejected({kind:'update',id,patch:{n:5}},'BAD_MESSAGE');
 await student.rejected({kind:'add',id:student.author+':bad',patch:{t:'pin',n:5,v:99}},'BAD_MESSAGE');
 expect((await teacher.snapshot()).state.items[id]).toEqual({t:'pin',n:3,v:3});
});
it('student mark changes and moves to another author pin reach the teacher',async()=>{
 const {teacher,student}=await fixture(),id=teacher.author+':pin';
 await teacher.accepted({kind:'add',id,patch:{t:'pin',n:3,v:3}});
 await student.accepted({kind:'field',field:'a',value:3});await teacher.next('ops',frame=>frame.ops[0].field==='a');
 await student.accepted({kind:'update',id,patch:{v:5}});await teacher.next('ops',frame=>frame.ops[0].kind==='update');
 expect((await teacher.snapshot()).state.fields.a).toBe(3);expect((await teacher.snapshot()).state.items[id]).toEqual({t:'pin',n:3,v:5});
});
it('zero/zero marks reject the entire transaction, but a valid final batch can pass through transient zero',async()=>{
 const {teacher,student}=await fixture();const before=await teacher.snapshot();
 const a=student.operation({kind:'field',field:'a',value:0}),b=student.operation({kind:'field',field:'b',value:0});student.send({type:'ops',ops:[a,b]});
 expect((await student.next('error')).code).toBe('BAD_MESSAGE');expect(await teacher.snapshot()).toEqual(before);
 await teacher.accepted({kind:'field',field:'a',value:1});await teacher.accepted({kind:'field',field:'b',value:0});
 const next=[student.operation({kind:'field',field:'a',value:0}),student.operation({kind:'field',field:'b',value:1})];student.send({type:'ops',ops:next});await student.next('ops',frame=>frame.ops[0].opId===next[1].opId);
 expect((await teacher.snapshot()).state.fields).toEqual({a:0,b:1});
});
it('teacher notes reach active students but are never sent to pending students',async()=>{
 const {teacher,student,connect}=await fixture(),pending=await connect('student');
 const note=[{k:'t',v:'Explicación <b>en texto plano</b>'}];await teacher.accepted({kind:'field',field:'note',value:note});
 const frame=await student.next('ops',frame=>frame.ops[0].field==='note');expect(frame.ops[0].value).toEqual(note);
 expect(pending.frames.some(frame=>['ops','snapshot_start','snapshot_chunk','snapshot_end'].includes(frame.type))).toBe(false);
});
it('unsafe image types and oversized image frames are rejected without altering notes',async()=>{
 const {teacher}=await fixture();const before=await teacher.snapshot();
 for(const src of ['data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,'+btoa('x'.repeat(400*1024))]){
  const operation=teacher.operation({kind:'field',field:'note',value:[{k:'i',src}]});teacher.send({type:'ops',ops:[operation]});expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');
 }
 expect(await teacher.snapshot()).toEqual(before);
});
it('the 201st pin and a multi-op over-limit transaction are rolled back',async()=>{
 const {teacher,student,stub}=await fixture();
 await runInDurableObject(stub,(_room,state)=>{
  const board:BoardState={items:{},order:[],fields:{a:10,b:10}};
  for(let i=0;i<200;i++){const id='teacher:p'+i;board.items[id]={t:'pin',n:1,v:1};board.order.push(id)}
  state.storage.sql.exec('INSERT OR REPLACE INTO state(board_id,json,seq) VALUES(?,?,?)','recta-numerica',JSON.stringify(board),0);
 });
 await student.rejected({kind:'add',id:student.author+':extra',patch:{t:'pin',n:1,v:1}},'STATE_TOO_LARGE');
 const ops=[student.operation({kind:'remove',id:'teacher:p0'}),...['a','b'].map(suffix=>student.operation({kind:'add',id:student.author+':'+suffix,patch:{t:'pin',n:1,v:1}}))];student.send({type:'ops',ops});
 expect((await student.next('error')).code).toBe('STATE_TOO_LARGE');const snapshot=await teacher.snapshot();expect(Object.keys(snapshot.state.items)).toHaveLength(200);expect(snapshot.state.items['teacher:p0']).toBeDefined();expect(snapshot.seq).toBe(0);
});
it('interval lessons share graphs, professor notes and strokes; student writes and malformed states are refused',async()=>{
 const {teacher,student}=await fixture();teacher.send({type:'set_board',boardId:'intervalos'});await student.next('snapshot_end');await teacher.next('snapshot_end');teacher.frames=[];student.frames=[];
 const lesson={expression:'A = [−5; 3⟩ , B = [1; 7] , A ∪ B',topic:1,shown:4,prof:true,work:'<div>Mi resolución</div><div>Segunda línea</div>',strokes:[{c:'#123abc',w:5,a:1,p:[[.1,.2],[.3,.4]]}],graph:{rows:[{a:-5,b:3,L:'c',R:'o',on:true},{a:1,b:7,L:'c',R:'c',on:true}],operation:'u'},graphInk:[{c:'#aabbcc',w:24,a:.4,p:[[.2,.3],[.5,.6]]},{t:'shape',kind:'ellipse',c:'#082783',w:5,a:1,fill:'#7fd4ff',opacity:.35,x1:.1,y1:.2,x2:.6,y2:.8}],formulas:[]};
 const operation=(client:Client,value:unknown)=>({...client.operation({kind:'field',field:'lesson',value}),boardId:'intervalos'});
 const initial=operation(teacher,lesson);teacher.send({type:'ops',ops:[initial]});expect((await student.next('ops',m=>m.ops[0].opId===initial.opId)).ops[0].value).toEqual(lesson);
 const image='data:image/png;base64,'+btoa('\x89PNG\r\n\x1a\n'+'x'.repeat(100000));
 const imageLesson={...lesson,graphInk:[...lesson.graphInk,{t:'image',src:image,x1:.1,y1:.2,x2:.6,y2:.8},{t:'text',runs:[{text:'x',sup:false},{text:'2',sup:true},{text:' ≥ 4\nx ≤ 8',sup:false}],fontSize:28,c:'#082783',x1:.1,y1:.1,x2:.9,y2:.9}]};
 const pasted=operation(teacher,imageLesson) as Op;for(const frame of operationFrames(pasted))teacher.send(frame);expect((await student.next('ops',m=>m.ops[0].opId===pasted.opId)).ops[0].value).toEqual(imageLesson);
 const pupil=operation(student,{...lesson,shown:5});student.send({type:'ops',ops:[pupil]});expect((await student.next('error')).code).toBe('FORBIDDEN');
 for(const value of [{...lesson,shown:99},{...lesson,topic:8},{...lesson,graph:{rows:[],operation:'u'}},{...lesson,strokes:[{c:'url(x)',w:5,a:1,p:[[0,0]]}]}]){const bad=operation(teacher,value);teacher.send({type:'ops',ops:[bad]});expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');}
 expect((await teacher.snapshot()).state.fields.lesson).toEqual(imageLesson);
});
import {initialLesson as fractionLesson} from '../../src/boards/fracciones/model.js';
it('fractions lessons and annotation images reach pupils; only the teacher can edit them',async()=>{
 const {teacher,student}=await fixture();teacher.send({type:'set_board',boardId:'fracciones'});await student.next('snapshot_end');await teacher.next('snapshot_end');teacher.frames=[];student.frames=[];
 const lesson=fractionLesson(),op=(client:Client,field:string,value:unknown)=>({...client.operation({kind:'field',field,value}),boardId:'fracciones'});
 const shared=op(teacher,'lesson',lesson);teacher.send({type:'ops',ops:[shared]});expect((await student.next('ops',f=>f.ops[0].opId===shared.opId)).ops[0].value).toEqual(lesson);
 const drawing=[{t:'stroke',p:[[.1,.2],[.4,.6]],c:'#123abc',w:4},{t:'text',runs:[{text:'x',sup:false},{text:'2',sup:true},{text:' ≥ 2\nOtra línea',sup:false}],fontSize:28,c:'#123abc',x1:.1,y1:.1,x2:.8,y2:.7},{t:'image',src:'data:image/png;base64,'+btoa('\x89PNG\r\n\x1a\n'+'x'.repeat(100000)),x1:.1,y1:.2,x2:.6,y2:.8}];
 const pasted=op(teacher,'drawing',drawing) as Op;for(const frame of operationFrames(pasted))teacher.send(frame);expect((await student.next('ops',f=>f.ops[0].opId===pasted.opId)).ops[0].value).toEqual(drawing);
 const before=await teacher.snapshot();for(const field of ['lesson','drawing']){student.send({type:'ops',ops:[op(student,field,field==='lesson'?lesson:[])]});expect((await student.next('error')).code).toBe('FORBIDDEN');}
 for(const [field,value]of [['lesson',{...lesson,parts:{...lesson.parts,d:0}}],['lesson',{...lesson,parts:{...lesson.parts,n:4}}],['drawing',[{...drawing[0],w:400}]],['unknown',{}]] as const){teacher.send({type:'ops',ops:[op(teacher,field,value)]});expect((await teacher.next('error')).code).toBe('BAD_MESSAGE');}expect(await teacher.snapshot()).toEqual(before);
});

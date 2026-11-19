import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { WebSocket } from 'undici';

// Self-contained local simulation: no remote service, login, browser or paid resource.
const origin='http://127.0.0.1:8791',pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const sockets:Peer[]=[];let serial=0,logs='';
class Peer{
 ws:WebSocket;frames:Record<string,any>[]=[];closed:number|undefined;
 constructor(code:string){
  this.ws=new WebSocket(`${origin.replace('http:','ws:')}/api/rooms/${code}/ws`,{headers:{Origin:origin,'CF-Connecting-IP':`198.18.8.${++serial}`}});sockets.push(this);
  this.ws.addEventListener('message',event=>{if(event.data!=='pong')this.frames.push(JSON.parse(String(event.data)));});
  this.ws.addEventListener('close',event=>{this.closed=event.code;});
 }
 async open(hello:unknown){await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('WebSocket open timeout')),5000);this.ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});this.ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('WebSocket connection failed'));},{once:true});});this.send(hello);return this;}
 send(frame:unknown){this.ws.send(JSON.stringify(frame));}
 async next(type:string,match:(frame:Record<string,any>)=>boolean=()=>true){for(let i=0;i<250;i++){const index=this.frames.findIndex(frame=>frame.type===type&&match(frame));if(index>=0)return this.frames.splice(index,1)[0];await pause(10);}throw Error(`Missing frame: ${type}`);}
 async closeCode(expected:number){for(let i=0;i<250&&this.closed===undefined;i++)await pause(10);assert.equal(this.closed,expected);}
 snapshot(){const chunks=this.frames.filter(frame=>frame.type==='snapshot_chunk');return JSON.parse(chunks.at(-1)!.data);}
}
await mkdir('.e8-test',{recursive:true});
const server=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--local','--config','worker/wrangler.jsonc','--port','8791','--ip','127.0.0.1','--var',`ALLOWED_ORIGINS:${origin}`,'--var','LOCAL_TEACHER:true','--persist-to',`.e8-test/state-${Date.now()}`],{windowsHide:true,stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:'.e8-test/sim-worker.log'}});
server.stdout.on('data',data=>{logs=(logs+data).slice(-6000);});server.stderr.on('data',data=>{logs=(logs+data).slice(-6000);});
try{
 let ready=false;for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error('Local Worker exited');try{if((await fetch(origin+'/api/rooms/ABC234')).ok){ready=true;break;}}catch{}await pause(200);}assert(ready,'Local Worker startup timeout');
 const created=await fetch(origin+'/api/rooms',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({boardId:'prueba'})});assert.equal(created.status,200);const {code,teacherToken}=await created.json() as {code:string;teacherToken:string};
 const teacherHello={type:'hello',v:1,role:'teacher',token:teacherToken};let teacher=await new Peer(code).open(teacherHello);await teacher.next('snapshot_end');
 const pupils:{peer:Peer;studentId:string;author:string}[]=[];
 for(let i=0;i<6;i++){const peer=await new Peer(code).open({type:'hello',v:1,role:'student',name:`Alumno ${i+1}`});const joined=await peer.next('joined');await peer.next('waiting');assert(!peer.frames.some(frame=>frame.type.startsWith('snapshot')));pupils.push({peer,studentId:joined.studentId,author:joined.author});}
 pupils[0].peer.send({type:'set_board',boardId:'_plantilla'});assert.equal((await pupils[0].peer.next('error')).code,'FORBIDDEN');
 for(const pupil of pupils.slice(0,5)){teacher.send({type:'accept',studentId:pupil.studentId});await pupil.peer.next('snapshot_end');}
 const sixth=pupils[5];teacher.send({type:'accept',studentId:sixth.studentId});assert.equal((await teacher.next('error')).code,'ROOM_FULL');assert(!sixth.peer.frames.some(frame=>frame.type.startsWith('snapshot')));
 teacher.send({type:'reject',studentId:sixth.studentId});await sixth.peer.closeCode(4003);
 await pause(3100);sixth.peer=await new Peer(code).open({type:'hello',v:1,role:'student',studentId:sixth.studentId});await sixth.peer.next('waiting');
 const first=pupils[0];teacher.send({type:'kick',studentId:first.studentId});await first.peer.closeCode(4001);teacher.send({type:'accept',studentId:sixth.studentId});await sixth.peer.next('snapshot_end');
 await pause(3100);first.peer=await new Peer(code).open({type:'hello',v:1,role:'student',studentId:first.studentId});await first.peer.next('waiting');teacher.send({type:'reject',studentId:first.studentId});await first.peer.closeCode(4003);
 const active=pupils.slice(1),author=sixth.author,id=`${author}:${crypto.randomUUID()}`;
 sixth.peer.send({type:'ops',ops:[{opId:`${author}:${crypto.randomUUID()}`,author,boardId:'prueba',gestureId:'sim',kind:'add',id,patch:{type:'circle',x:120,y:180,r:40,color:'#064bfb'}}]});await teacher.next('ops',frame=>frame.ops.some((op:any)=>op.id===id));
 teacher.ws.close();for(const pupil of active)await pupil.peer.next('paused');teacher=await new Peer(code).open(teacherHello);await teacher.next('snapshot_end');for(const pupil of active)await pupil.peer.next('resumed');assert(teacher.snapshot().items[id]);
 // Every accepted editor follows the server's board; old content is retained separately.
 for(const boardId of ['_plantilla','prueba']){teacher.send({type:'set_board',boardId});await teacher.next('board_changed',frame=>frame.boardId===boardId);await teacher.next('snapshot_end',frame=>frame.boardId===boardId);for(const pupil of active){await pupil.peer.next('board_changed',frame=>frame.boardId===boardId);await pupil.peer.next('snapshot_end',frame=>frame.boardId===boardId);}assert.equal(!!teacher.snapshot().items[id],boardId==='prueba');}
 teacher.send({type:'close_room'});await teacher.closeCode(4002);for(const pupil of active)await pupil.peer.closeCode(4002);
 console.log('PASS E8: 1 profesor + 6 alumnos; privacidad pendiente, permisos, cupo 5, rechazo, expulsión, reentrada, pausa/reconexión, dos pizarras con estado independiente y cierre.');
}catch(error){console.error(error);console.error(logs);process.exitCode=1;}finally{for(const peer of sockets)try{peer.ws.close();}catch{}server.kill();}

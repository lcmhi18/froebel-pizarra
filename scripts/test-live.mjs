import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const children=[],sockets=[];let logs='';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function start(args){const child=spawn(process.execPath,args,{windowsHide:true,stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:'.live-test/wrangler.log'}});children.push(child);child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);return child;}
async function waitHTTP(url){for(let i=0;i<100;i++){try{if((await fetch(url)).status<500)return;}catch{}await pause(200);}throw Error('Server failed: '+logs);}
class Client{
  constructor(url){this.ws=new WebSocket(url);sockets.push(this.ws);this.messages=[];this.ws.addEventListener('message',e=>{if(e.data==='pong')return;this.messages.push(JSON.parse(e.data));});this.closed=new Promise(resolve=>this.ws.addEventListener('close',e=>resolve(e)));}
  async open(auth){await new Promise((ok,bad)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',bad,{once:true});});this.send({type:'auth',...auth});return this;}
  send(data){this.ws.send(JSON.stringify(data));}
  async next(type,predicate=()=>true){for(let i=0;i<200;i++){const index=this.messages.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return this.messages.splice(index,1)[0];await pause(20);}throw Error(`Timeout ${type}: ${JSON.stringify(this.messages).slice(-1200)}\n${logs.slice(-3000)}`);}
}
const api='http://127.0.0.1:8787';
async function create(){const response=await fetch(api+'/api/rooms',{method:'POST'});assert.equal(response.status,200);return response.json();}
async function client(code,role,auth){return new Client(`ws://127.0.0.1:8787/api/rooms/${code}/ws?role=${role}`).open(auth);}
let browser;
try{
  await mkdir('.live-test',{recursive:true});
  start(['node_modules/wrangler/bin/wrangler.js','dev','--local','--var','ALLOWED_ORIGINS:http://127.0.0.1:5190','--config','worker/wrangler.jsonc','--port','8787','--ip','127.0.0.1','--persist-to',`.live-test/state-${Date.now()}`]);
  start(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5190','--strictPort']);
  await waitHTTP(api+'/api/rooms/ABC234');await waitHTTP('http://127.0.0.1:5190');
  const room=await create();assert.match(room.code,/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);assert.equal(room.teacherToken.length,64);
  assert.equal((await fetch(api+'/api/rooms/ABC234')).status,404);
  assert.equal((await fetch(api+'/api/rooms',{method:'POST',headers:{Origin:'https://malicious.invalid'}})).status,403);
  const bad=await client(room.code,'teacher',{teacherToken:'wrong'});assert.equal((await bad.closed).code,4003);
  const teacher=await client(room.code,'teacher',{teacherToken:room.teacherToken});await teacher.next('snapshot');
  const student=await client(room.code,'student',{name:'<Luz>'});const identity=await student.next('identity');await student.next('waiting');assert(!student.messages.some(m=>m.type==='snapshot'));
  student.send({type:'accept',studentId:identity.studentId});assert.equal((await student.next('error')).error,'FORBIDDEN');
  student.send({type:'ops',ops:[{opId:'bad',author:'teacher',kind:'field',field:'private',value:1}]});assert.equal((await student.next('error')).error,'WAITING_APPROVAL');
  teacher.send({type:'accept',studentId:identity.studentId});await student.next('snapshot');
  const peers=[{socket:student,id:identity.studentId}];
  for(let i=1;i<6;i++){const socket=await client(room.code,'student',{name:`Alumno ${i}`});const {studentId}=await socket.next('identity');await socket.next('waiting');teacher.send({type:'accept',studentId});if(i<5){await socket.next('snapshot');peers.push({socket,id:studentId});}else{assert.equal((await teacher.next('error')).error,'ROOM_FULL');teacher.send({type:'reject',studentId});assert.equal((await socket.closed).code,4003);}}
  const id=`${identity.studentId}:circle`,add={opId:`${identity.studentId}:add`,author:'spoof',kind:'add',id,patch:{type:'circle',x:20,y:40,r:30,color:'#1674d1'}};
  student.send({type:'ops',ops:[add]});const event=await teacher.next('ops',m=>m.ops[0].id===id);assert.equal(event.ops[0].author,identity.studentId);assert.equal(event.ops[0].seq,1);
  student.send({type:'ops',ops:[add]});await student.next('ignored');await student.next('snapshot');
  teacher.send({type:'ops',ops:[{opId:'teacher:remove',author:'teacher',kind:'remove',id}]});await teacher.next('ops',m=>m.ops[0].kind==='remove');
  student.send({type:'ops',ops:[{opId:`${identity.studentId}:stale`,author:identity.studentId,kind:'update',id,patch:{x:999}}]});await student.next('ignored');assert.equal((await student.next('snapshot')).state.items[id],undefined);
  // Persist enough operations to force a compacted snapshot, while respecting the rate limit.
  for(let batch=0;batch<5;batch++){const ops=Array.from({length:45},(_,i)=>({opId:`teacher:b${batch}-${i}`,author:'teacher',kind:'field',field:'counter',value:batch*45+i}));teacher.send({type:'ops',ops});await teacher.next('ops',m=>m.ops[0].opId===ops.at(-1).opId);await pause(1050);}
  teacher.send({type:'ops',ops:Array.from({length:61},(_,i)=>({opId:`teacher:rate-${i}`,author:'teacher',kind:'field',field:'counter',value:0}))});assert.equal((await teacher.next('error')).error,'RATE_LIMIT');
  student.ws.send('x'.repeat(65537));assert.equal((await student.next('error')).error,'MESSAGE_TOO_LARGE');
  student.ws.close();await student.closed;const resumed=await client(room.code,'student',{name:'Luz',studentId:identity.studentId});const resumedState=await resumed.next('snapshot');assert.equal(resumedState.state.fields.counter,224);assert.equal(resumedState.state.items[id],undefined);
  teacher.send({type:'remove',studentId:identity.studentId});assert.equal((await resumed.closed).code,4001);
  const reentry=await client(room.code,'student',{name:'Luz',studentId:identity.studentId});await reentry.next('waiting');teacher.send({type:'accept',studentId:identity.studentId});await reentry.next('snapshot');
  teacher.send({type:'close'});assert.equal((await reentry.closed).code,4002);assert.equal((await teacher.closed).code,4002);assert.equal((await (await fetch(`${api}/api/rooms/${room.code}`)).json()).open,false);
  assert.equal((await fetch(`${api}/api/rooms/${room.code}/reopen`,{method:'POST',body:JSON.stringify({teacherToken:'wrong'})})).status,403);
  assert.equal((await fetch(`${api}/api/rooms/${room.code}/reopen`,{method:'POST',body:JSON.stringify({teacherToken:room.teacherToken})})).status,200);
  const reopened=await client(room.code,'teacher',{teacherToken:room.teacherToken});assert.equal((await reopened.next('snapshot')).state.fields.counter,224);
  console.log('PASS server: roles, pending privacy, 5-seat cap, reject/remove/reentry, unique identity, forged author, stale update, dedup, persistence/compaction, rate/size, close/reopen.');
  browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext();const t=await context.newPage(),s=await context.newPage();const errors=[];for(const page of [t,s]){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
  await t.goto('http://127.0.0.1:5190/src/pages/profesor/index.html');await t.getByRole('button',{name:'Crear sala de prueba local',exact:true}).click();await t.locator('.room-code').waitFor();const code=(await t.locator('.room-code').textContent()).trim();
  await s.goto(`http://127.0.0.1:5190/src/pages/alumno/index.html?code=${code}`);await s.getByPlaceholder('¿Cómo te llamas?').fill('Fátima');await s.getByRole('button',{name:'Pedir entrada',exact:true}).click();await s.getByText('Esperando que el profesor te acepte…').waitFor();await t.getByLabel('Aceptar a Fátima',{exact:true}).click();await s.locator('svg[aria-label^="Lienzo"]').waitFor();
  const canvas=t.locator('svg[aria-label^="Lienzo"]');await t.getByRole('button',{name:'Círculo',exact:true}).click();await canvas.click({position:{x:180,y:160}});await s.locator('circle[data-item]').waitFor();
  await s.getByRole('button',{name:'Texto',exact:true}).click();await s.getByLabel('Texto para la pizarra').fill('Juntos');await s.locator('svg[aria-label^="Lienzo"]').click({position:{x:250,y:200}});await t.locator('text[data-item]').filter({hasText:'Juntos'}).waitFor();
  await t.getByRole('button',{name:'Deshacer lo mío',exact:true}).click();await s.locator('circle[data-item]').waitFor({state:'detached'});assert.equal(await t.locator('text[data-item]').count(),1);
  await s.getByRole('button',{name:'Limpiar',exact:true}).click();await t.locator('text[data-item]').waitFor({state:'detached'});await s.getByRole('button',{name:'Deshacer lo mío',exact:true}).click();await t.locator('text[data-item]').filter({hasText:'Juntos'}).waitFor();
  for(const width of [1440,768,390]){await t.setViewportSize({width,height:960});await t.locator('.room-code').waitFor();await t.evaluate(()=>document.fonts.ready);await t.screenshot({path:`.live-test/profesor-${width}.png`,fullPage:true});await s.setViewportSize({width,height:960});await s.screenshot({path:`.live-test/alumno-${width}.png`,fullPage:true});assert.equal(await t.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await t.getByLabel('Tema oscuro').click();await t.screenshot({path:'.live-test/profesor-dark.png',fullPage:true});await t.getByLabel('Botar a Fátima',{exact:true}).click();await s.getByText('El profesor te retiró.',{exact:true}).waitFor();await s.getByRole('button',{name:'Volver a pedir entrada'}).click();await t.getByLabel('Aceptar a Fátima',{exact:true}).click();await s.locator('svg[aria-label^="Lienzo"]').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS browser: real WebSockets, approval, two-way drawing, per-user undo, clear/undo, reentry, three widths, dark mode, no console exceptions.');
}catch(error){console.error(error);console.error(logs.slice(-7000));process.exitCode=1;}finally{for(const ws of sockets)try{ws.close();}catch{}if(browser)await browser.close();for(const child of children)child.kill();}

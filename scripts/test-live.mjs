import { WebSocket } from 'undici';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const children=[],sockets=[];let logs='',clientNumber=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function start(args){const child=spawn(process.execPath,args,{windowsHide:true,stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:'.live-test/wrangler.log'}});children.push(child);child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);return child;}
async function waitHTTP(url){for(let i=0;i<100;i++){try{if((await fetch(url)).status<500)return;}catch{}await pause(200);}throw Error('Server failed: '+logs);}
class Client{
  constructor(url){this.ws=new WebSocket(url,{headers:{Origin:'http://127.0.0.1:5190','CF-Connecting-IP':`198.51.100.${++clientNumber}`}});sockets.push(this.ws);this.messages=[];this.ws.addEventListener('message',e=>{if(e.data==='pong')return;this.messages.push(JSON.parse(e.data));});this.closed=new Promise(resolve=>this.ws.addEventListener('close',e=>resolve(e)));}
  async open(auth){await new Promise((ok,bad)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',bad,{once:true});});this.send(auth.teacherToken?{type:'hello',v:1,role:'teacher',token:auth.teacherToken}:{type:'hello',v:1,role:'student',...auth});return this;}
  send(data){this.ws.send(JSON.stringify(data));}
  async next(type,predicate=()=>true){for(let i=0;i<200;i++){const index=this.messages.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return this.messages.splice(index,1)[0];await pause(20);}throw Error(`Timeout ${type}: ${JSON.stringify(this.messages).slice(-1200)}\n${logs.slice(-3000)}`);}
}
const api='http://127.0.0.1:8787';
async function create(){const response=await fetch(api+'/api/rooms',{method:'POST',headers:{Origin:'http://127.0.0.1:5190'}});assert.equal(response.status,200);return response.json();}
async function client(code,role,auth){return new Client(`ws://127.0.0.1:8787/api/rooms/${code}/ws?role=${role}`).open(auth);}
let browser;
try{
  await mkdir('.live-test',{recursive:true});
  start(['node_modules/wrangler/bin/wrangler.js','dev','--local','--var','ALLOWED_ORIGINS:http://127.0.0.1:5190','--config','worker/wrangler.jsonc','--port','8787','--ip','127.0.0.1','--persist-to',`.live-test/state-${Date.now()}`]);
  start(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5190','--strictPort']);
  await waitHTTP(api+'/api/rooms/ABC234');await waitHTTP('http://127.0.0.1:5190');
  const room=await create();assert.match(room.code,/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  const teacher=await client(room.code,'teacher',{teacherToken:room.teacherToken});await teacher.next('snapshot_end');
  const student=await client(room.code,'student',{name:'Luz'});const identity=await student.next('joined');await student.next('waiting');
  assert(!student.messages.some(m=>m.type.startsWith('snapshot')));
  student.send({type:'accept',studentId:identity.studentId});assert.equal((await student.next('error')).code,'FORBIDDEN');
  teacher.send({type:'accept',studentId:identity.studentId});await student.next('snapshot_end');
  const op={opId:identity.author+':add',author:identity.author,boardId:'prueba',gestureId:'g',kind:'add',id:identity.author+':circle',patch:{type:'circle',x:20,y:40,r:30,color:'#1674d1'}};
  student.send({type:'ops',ops:[op]});const event=await teacher.next('ops');assert.equal(event.ops[0].author,identity.author);assert(!JSON.stringify(event).includes(identity.studentId));
  teacher.send({type:'close_room'});assert.equal((await student.closed).code,4002);assert.equal((await teacher.closed).code,4002);
  console.log('PASS v1 real sockets: hello, pending privacy, teacher approval, role enforcement, public author and manual close.');
  browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({extraHTTPHeaders:{'CF-Connecting-IP':'203.0.113.50'}});const t=await context.newPage(),s=await context.newPage();const errors=[];for(const page of [t,s]){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
  await t.goto('http://127.0.0.1:5190/src/pages/profesor/index.html');await t.getByRole('button',{name:'Crear sala de prueba local',exact:true}).click();await t.locator('.room-code').waitFor();const code=(await t.locator('.room-code').textContent()).trim();
  await s.goto(`http://127.0.0.1:5190/src/pages/alumno/index.html?code=${code}`);await s.getByPlaceholder('¿Cómo te llamas?').fill('Fátima');await s.getByRole('button',{name:'Pedir entrada',exact:true}).click();await s.getByText('Esperando que el profesor te acepte…').waitFor();await t.getByLabel('Aceptar a Fátima',{exact:true}).click();await s.locator('svg[aria-label^="Lienzo"]').waitFor();
  const canvas=t.locator('svg[aria-label^="Lienzo"]');await t.getByRole('button',{name:'Círculo',exact:true}).click();await canvas.click({position:{x:180,y:160}});await s.locator('circle[data-item]').waitFor();
  await s.getByRole('button',{name:'Texto',exact:true}).click();await s.getByLabel('Texto para la pizarra').fill('Juntos');await s.locator('svg[aria-label^="Lienzo"]').click({position:{x:250,y:200}});await t.locator('text[data-item]').filter({hasText:'Juntos'}).waitFor();

  const circle=t.locator('circle[data-item]'),circleId=await circle.getAttribute('data-item'),original=await circle.getAttribute('transform');
  await t.getByRole('button',{name:'Mover',exact:true}).click();const bounds=await circle.boundingBox();assert(bounds);
  await t.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await t.mouse.down();
  await t.mouse.move(bounds.x+bounds.width/2+50,bounds.y+bounds.height/2+25,{steps:8});await pause(100);
  await t.mouse.move(bounds.x+bounds.width/2+90,bounds.y+bounds.height/2+40,{steps:8});await t.mouse.up();
  await pause(200);const moved=await circle.getAttribute('transform');assert.notEqual(moved,original);assert.equal(await s.locator('circle[data-item]').getAttribute('transform'),moved);
  await t.getByRole('button',{name:'Deshacer lo mío',exact:true}).click();await pause(150);assert.equal(await circle.getAttribute('transform'),original);assert.equal(await circle.getAttribute('data-item'),circleId);
  await circle.click();const slider=t.getByLabel('Tamaño del círculo');await slider.focus();await slider.press('ArrowRight');await pause(150);assert.equal(await circle.getAttribute('r'),'41');
  await t.getByRole('button',{name:'Deshacer lo mío',exact:true}).click();await pause(150);assert.equal(await circle.getAttribute('r'),'40');
  await t.getByRole('button',{name:'Deshacer lo mío',exact:true}).click();await s.locator('circle[data-item]').waitFor({state:'detached'});assert.equal(await t.locator('text[data-item]').count(),1);
  const textId=await t.locator('text[data-item]').getAttribute('data-item');await s.getByRole('button',{name:'Limpiar',exact:true}).click();await t.locator('text[data-item]').waitFor({state:'detached'});await s.getByRole('button',{name:'Deshacer lo mío',exact:true}).click();await t.locator('text[data-item]').filter({hasText:'Juntos'}).waitFor();
  assert.equal(await t.locator('text[data-item]').getAttribute('data-item'),textId);await t.reload();await t.locator('text[data-item]').filter({hasText:'Juntos'}).waitFor();await s.locator('svg[aria-label^="Lienzo"]').waitFor();
  for(const width of [1440,768,390]){await t.setViewportSize({width,height:960});await t.locator('.room-code').waitFor();await t.evaluate(()=>document.fonts.ready);await t.screenshot({path:`.live-test/profesor-${width}.png`,fullPage:true});await s.setViewportSize({width,height:960});await s.screenshot({path:`.live-test/alumno-${width}.png`,fullPage:true});assert.equal(await t.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await t.getByLabel('Tema oscuro').click();await t.screenshot({path:'.live-test/profesor-dark.png',fullPage:true});await t.getByLabel('Botar a Fátima',{exact:true}).click();await s.getByText('El profesor te retiró.',{exact:true}).waitFor();await pause(3100);await s.getByRole('button',{name:'Volver a pedir entrada'}).click();await t.getByLabel('Aceptar a Fátima',{exact:true}).click();await s.locator('svg[aria-label^="Lienzo"]').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS browser: real WebSockets, approval, two-way drawing, drag/slider gestures, per-user undo, stable IDs after clear/undo, reload, reentry, three widths, dark mode, no console exceptions.');
}catch(error){console.error(error);console.error(logs.slice(-7000));process.exitCode=1;}finally{for(const ws of sockets)try{ws.close();}catch{}if(browser)await browser.close();for(const child of children)child.kill();}

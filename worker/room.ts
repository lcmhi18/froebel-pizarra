import { DurableObject } from 'cloudflare:workers';
import { applyOp, emptyState, matches, json, hash, parseClientFrame, LIMITS, CLOSE_CODES, sanitizeFirstName, isBoardId, type Env, type LegacyOp, type BoardState, type Op, type BoardId, type ErrorCode } from './protocol';
import { applyOperation } from '../src/shared/operations';

type Attachment={socketId:string;authed:boolean;role?:'teacher'|'student';studentId?:string;ipHash:string};
type Meta={code:string;room:string;teacher_token_hash:string;closed:number;created_at:number;board_id:BoardId;seq:number;grace_at:number|null;purge_at:number|null;notify_at:number|null;next_alarm_kind:string|null;next_alarm_at:number|null};
type Student={id:string;author:string;name:string;status:'pending'|'active'|'removed';last_seen:number};
const bytes=(s:string)=>new TextEncoder().encode(s).length;
export class Room extends DurableObject<Env>{
  private buckets=new Map<string,{tokens:number;at:number}>();
  private purged=false;
  constructor(ctx:DurableObjectState,env:Env){
    super(ctx,env);
    ctx.blockConcurrencyWhile(async()=>{
      const sql=ctx.storage.sql;
      sql.exec('CREATE TABLE IF NOT EXISTS meta(code TEXT,room TEXT,teacher_token_hash TEXT,closed INTEGER,created_at INTEGER)');
      const columns=new Set(sql.exec<{name:string}>('PRAGMA table_info(meta)').toArray().map(r=>r.name));
      for(const [name,type] of Object.entries({board_id:"TEXT DEFAULT 'prueba'",seq:'INTEGER DEFAULT 0',grace_at:'INTEGER',purge_at:'INTEGER',notify_at:'INTEGER',next_alarm_kind:'TEXT',next_alarm_at:'INTEGER'}))if(!columns.has(name))sql.exec(`ALTER TABLE meta ADD COLUMN ${name} ${type}`);
      const tables=new Set(sql.exec<{name:string}>("SELECT name FROM sqlite_master WHERE type='table'").toArray().map(r=>r.name));
      if(tables.has('state')&&!sql.exec<{name:string}>('PRAGMA table_info(state)').toArray().some(r=>r.name==='board_id')){
        const row=sql.exec<{json:string;seq:number}>('SELECT * FROM state').toArray()[0];
        const state:BoardState=row?JSON.parse(row.json):emptyState();let seq=row?.seq||0;
        if(tables.has('ops'))for(const op of sql.exec<{json:string;seq:number}>('SELECT json,seq FROM ops WHERE seq>? ORDER BY seq',seq)){applyOp(state,JSON.parse(op.json) as LegacyOp);seq=op.seq;}
        for(const table of ['state','ops','students','tombstones'])if(tables.has(table))sql.exec(`ALTER TABLE ${table} RENAME TO legacy_${table}`);
        this.schema();sql.exec('INSERT INTO state VALUES(?,?,?)','prueba',JSON.stringify(state),seq);sql.exec('UPDATE meta SET seq=?',seq);
        // Legacy student secrets were exposed as authors. They must not be reused as v1 credentials.
      }else this.schema();
      ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
      for(const ws of ctx.getWebSockets())if(!this.attachment(ws)?.socketId)try{ws.close(CLOSE_CODES.PROTOCOL_VERSION,'PROTOCOL_VERSION');}catch{}
      const live=new Set(ctx.getWebSockets().map(ws=>this.attachment(ws)?.socketId));
      for(const row of sql.exec<{socket_id:string}>('SELECT socket_id FROM sessions'))if(!live.has(row.socket_id))sql.exec('DELETE FROM sessions WHERE socket_id=?',row.socket_id);
      const meta=this.meta();
      if(meta?.closed&&!meta.purge_at)sql.exec('UPDATE meta SET purge_at=?,notify_at=?',Date.now()+this.retention(),Date.now());
      if(meta&&!meta.closed&&!this.teacherPresent()&&!meta.grace_at)sql.exec('UPDATE meta SET grace_at=?',Date.now()+LIMITS.teacherGraceMs);
      await this.schedule();
    });
  }
  get sql(){return this.ctx.storage.sql;}
  private retention(){const hours=Number(this.env.RETENTION_HOURS||24);return (Number.isFinite(hours)&&hours>0?hours:24)*3600000;}
  private schema(){
    this.sql.exec('CREATE TABLE IF NOT EXISTS state(board_id TEXT PRIMARY KEY,json TEXT,seq INTEGER)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS ops(seq INTEGER PRIMARY KEY,board_id TEXT,json TEXT,op_id TEXT UNIQUE)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS students(id TEXT PRIMARY KEY,author TEXT UNIQUE,name TEXT,status TEXT,last_seen INTEGER)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS tombstones(board_id TEXT,id TEXT,PRIMARY KEY(board_id,id))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS sessions(socket_id TEXT PRIMARY KEY,role TEXT,student_id TEXT)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS auth_deadlines(socket_id TEXT PRIMARY KEY,deadline INTEGER,busy INTEGER DEFAULT 0)');
  }
  meta(){return this.purged?undefined:this.sql.exec<Meta>('SELECT * FROM meta').toArray()[0];}
  attachment(ws:WebSocket){try{return ws.deserializeAttachment() as Attachment|undefined;}catch{return undefined;}}
  send(ws:WebSocket,data:unknown){try{ws.send(JSON.stringify(data));}catch{}}
  error(ws:WebSocket,code:ErrorCode,ref?:string){this.send(ws,{type:'error',code,...(ref?{ref}:{})});}
  private student(id?:string){return id?this.sql.exec<Student>('SELECT * FROM students WHERE id=?',id).toArray()[0]:undefined;}
  private teacherPresent(){return !!this.sql.exec("SELECT socket_id FROM sessions WHERE role='teacher' LIMIT 1").toArray().length;}
  private current(a:Attachment){return !!this.sql.exec('SELECT socket_id FROM sessions WHERE socket_id=?',a.socketId).toArray().length;}
  private editable(a:Attachment){return a.authed&&this.current(a)&&(a.role==='teacher'||this.student(a.studentId)?.status==='active');}
  private eachEditor(fn:(ws:WebSocket)=>void){for(const ws of this.ctx.getWebSockets()){const a=this.attachment(ws);if(a&&this.editable(a))fn(ws);}}
  private retire(ws:WebSocket,code:number,reason:string){const a=this.attachment(ws);if(a?.socketId){this.sql.exec('DELETE FROM sessions WHERE socket_id=?',a.socketId);this.sql.exec('DELETE FROM auth_deadlines WHERE socket_id=?',a.socketId);a.authed=false;ws.serializeAttachment(a);this.buckets.delete(a.socketId);}try{ws.close(code,reason);}catch{}}
  private load(boardId:BoardId){
    const row=this.sql.exec<{json:string;seq:number}>('SELECT json,seq FROM state WHERE board_id=?',boardId).toArray()[0];
    const state:BoardState=row?JSON.parse(row.json):emptyState();
    for(const op of this.sql.exec<{json:string}>('SELECT json FROM ops WHERE board_id=? AND seq>? ORDER BY seq',boardId,row?.seq||0))applyOperation(state,JSON.parse(op.json));
    return {state,seq:this.meta()?.seq||0};
  }
  snapshot(ws:WebSocket){
    const meta=this.meta();if(!meta)return;
    const {state,seq}=this.load(meta.board_id),text=JSON.stringify(state),chunks:string[]=[];
    // A UTF-16 unit needs at most six escaped JSON bytes. 4096 units + metadata
    // stays below 32 KB, without encoding/stringifying a megabyte character by character.
    for(let offset=0;offset<text.length;){let end=Math.min(offset+4096,text.length);const last=text.charCodeAt(end-1);if(end<text.length&&last>=0xd800&&last<=0xdbff)end--;chunks.push(text.slice(offset,end));offset=end;}
    const snapshotId=crypto.randomUUID();
    this.send(ws,{type:'snapshot_start',snapshotId,boardId:meta.board_id,seq,chunks:chunks.length});
    chunks.forEach((data,index)=>this.send(ws,{type:'snapshot_chunk',snapshotId,index,data}));
    this.send(ws,{type:'snapshot_end',snapshotId,boardId:meta.board_id,seq});
    if(!this.teacherPresent())this.send(ws,{type:'paused',reason:'teacher_disconnected'});
  }
  roster(){
    const students=this.sql.exec<Student>("SELECT * FROM students WHERE status!='removed' ORDER BY last_seen,id").toArray();
    const list=(status:string)=>students.filter(s=>s.status===status).map(s=>({studentId:s.id,name:s.name}));
    for(const ws of this.ctx.getWebSockets()){const a=this.attachment(ws);if(a?.authed&&a.role==='teacher'&&this.current(a))this.send(ws,{type:'roster',pending:list('pending'),active:list('active'),count:list('active').length});}
  }
  private async schedule(){
    const m=this.meta();if(!m)return;
    const auth=this.sql.exec<{at:number|null}>('SELECT min(deadline) AS at FROM auth_deadlines').toArray()[0]?.at;
    const candidates=[{kind:'auth',at:auth},{kind:'grace',at:m.closed?null:m.grace_at},{kind:'purge',at:m.purge_at},{kind:'notify',at:m.notify_at}].filter((r):r is {kind:string;at:number}=>typeof r.at==='number').sort((a,b)=>a.at-b.at);
    const next=candidates[0];this.sql.exec('UPDATE meta SET next_alarm_kind=?,next_alarm_at=?',next?.kind||null,next?.at||null);
    if(next)await this.ctx.storage.setAlarm(next.at);else await this.ctx.storage.deleteAlarm();
  }
  private async notify(){
    const m=this.meta();if(!m)return;
    try{const r=await this.env.REGISTRY.get(this.env.REGISTRY.idFromName('registry')).fetch('https://registry/status',{method:'POST',body:JSON.stringify({code:m.code,room:m.room,closed:!!m.closed})});await r.arrayBuffer();if(!r.ok&&r.status!==404)throw Error();this.sql.exec('UPDATE meta SET notify_at=NULL');}catch{this.sql.exec('UPDATE meta SET notify_at=?',Date.now()+10000);}
  }
  private async closeRoom(){
    const m=this.meta();if(!m||m.closed)return;
    this.sql.exec('UPDATE meta SET closed=1,grace_at=NULL,purge_at=?,notify_at=?',Date.now()+this.retention(),Date.now());
    for(const ws of this.ctx.getWebSockets()){this.send(ws,{type:'closed'});this.retire(ws,CLOSE_CODES.ROOM_CLOSED,'ROOM_CLOSED');}
    await this.notify();await this.schedule();
  }
  async alarm(){
    const m=this.meta();if(!m)return;const now=Date.now();
    if(m.closed&&m.purge_at&&m.purge_at<=now){await this.ctx.storage.deleteAlarm();await this.ctx.storage.deleteAll();this.purged=true;this.buckets.clear();return;}
    for(const row of this.sql.exec<{socket_id:string}>('SELECT socket_id FROM auth_deadlines WHERE deadline<=?',now)){
      const ws=this.ctx.getWebSockets().find(ws=>this.attachment(ws)?.socketId===row.socket_id);
      if(ws)this.retire(ws,CLOSE_CODES.AUTH_TIMEOUT,'AUTH_TIMEOUT');else this.sql.exec('DELETE FROM auth_deadlines WHERE socket_id=?',row.socket_id);
    }
    if(!m.closed&&m.grace_at&&m.grace_at<=now&&!this.teacherPresent())await this.closeRoom();
    const notifyAt=this.meta()?.notify_at;if(notifyAt&&notifyAt<=now)await this.notify();
    await this.schedule();
  }
  async fetch(req:Request){
    const url=new URL(req.url);
    if(url.pathname==='/init'&&req.method==='POST'){
      if(this.meta())return json({error:'EXISTS'},409);
      const {code,room,teacherHash,boardId='prueba'}=await req.json() as {code:string;room:string;teacherHash:string;boardId?:BoardId};
      if(!isBoardId(boardId))return json({error:'UNKNOWN_BOARD'},400);
      this.sql.exec('INSERT INTO meta(code,room,teacher_token_hash,closed,created_at,board_id,seq,grace_at) VALUES(?,?,?,0,?,?,0,?)',code,room,teacherHash,Date.now(),boardId,Date.now()+LIMITS.teacherGraceMs);
      this.sql.exec('INSERT INTO state VALUES(?,?,0)',boardId,JSON.stringify(emptyState()));await this.schedule();return json({ok:true});
    }
    const m=this.meta();if(!m)return req.method==='GET'&&!url.pathname.endsWith('/ws')?json({open:false}):json({error:'NOT_FOUND'},404);
    if(url.pathname.endsWith('/reopen')&&req.method==='POST'){
      let token:unknown;try{const text=await req.text();if(bytes(text)>1024)throw Error();token=(JSON.parse(text) as {teacherToken?:unknown}).teacherToken;}catch{return json({error:'BAD_MESSAGE'},400);}
      if(!await matches(token,m.teacher_token_hash))return json({error:'FORBIDDEN'},403);
      if(m.purge_at&&m.purge_at<=Date.now())return json({error:'NOT_FOUND'},404);
      this.sql.exec('UPDATE meta SET closed=0,purge_at=NULL,grace_at=?,notify_at=?',Date.now()+LIMITS.teacherGraceMs,Date.now());await this.notify();await this.schedule();return json({ok:true});
    }
    if(!url.pathname.endsWith('/ws'))return req.method==='GET'?json({open:!m.closed}):json({error:'BAD_MESSAGE'},405);
    if(m.closed)return json({error:'NOT_FOUND'},404);
    if(req.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'BAD_MESSAGE'},426);
    if(this.ctx.getWebSockets().length>=100)return json({error:'RATE_LIMITED'},429);
    const ipHash=req.headers.get('X-Room-Client-IP-Hash');if(!ipHash||!/^[a-f0-9]{64}$/.test(ipHash))return json({error:'BAD_AUTH'},403);
    const [client,server]=Object.values(new WebSocketPair());const socketId=crypto.randomUUID();
    this.ctx.acceptWebSocket(server);server.serializeAttachment({socketId,authed:false,ipHash} satisfies Attachment);
    this.sql.exec('INSERT INTO auth_deadlines(socket_id,deadline) VALUES(?,?)',socketId,Date.now()+LIMITS.authTimeoutMs);await this.schedule();
    return new Response(null,{status:101,webSocket:client});
  }
  private async hello(ws:WebSocket,a:Attachment,message:Extract<import('./protocol').ClientMessage,{type:'hello'}>){
    const deadline=this.sql.exec<{deadline:number;busy:number}>('SELECT deadline,busy FROM auth_deadlines WHERE socket_id=?',a.socketId).toArray()[0];
    if(!deadline||deadline.busy||deadline.deadline<=Date.now()){this.retire(ws,CLOSE_CODES.BAD_AUTH,'BAD_AUTH');return;}
    this.sql.exec('UPDATE auth_deadlines SET busy=1 WHERE socket_id=?',a.socketId);
    const m=this.meta()!;
    if(message.role==='teacher'){
      if(!await matches(message.token,m.teacher_token_hash)){this.retire(ws,CLOSE_CODES.BAD_AUTH,'BAD_AUTH');await this.schedule();return;}
    }else{
      const previous=this.student(message.studentId);
      if(message.studentId&&!previous){this.retire(ws,CLOSE_CODES.BAD_AUTH,'BAD_AUTH');return;}
      // An authenticated resume is not a new admission request. Page-to-board navigation
      // must not consume another three-second quota; removed identities still do.
      if(!previous||previous.status==='removed'){
        const entry=await this.env.REGISTRY.get(this.env.REGISTRY.idFromName('registry')).fetch('https://registry/entry',{method:'POST',body:JSON.stringify({ipHash:a.ipHash,...(previous?{subjectHash:await hash(previous.id),returningRemoved:true}:{})})});
        if(!entry.ok){this.error(ws,'RATE_LIMITED');this.retire(ws,CLOSE_CODES.ABUSE,'RATE_LIMITED');return;}
      }
    }
    // Authentication can yield to alarms/other sockets. Re-check durable authority afterwards.
    if(this.meta()?.closed||!this.sql.exec('SELECT socket_id FROM auth_deadlines WHERE socket_id=? AND deadline>?',a.socketId,Date.now()).toArray().length){this.retire(ws,CLOSE_CODES.AUTH_TIMEOUT,'AUTH_TIMEOUT');return;}
    if(message.role==='teacher'){
      for(const other of this.ctx.getWebSockets()){const old=this.attachment(other);if(other!==ws&&old?.authed&&old.role==='teacher')this.retire(other,CLOSE_CODES.REPLACED_SESSION,'REPLACED_SESSION');}
      a.role='teacher';a.authed=true;this.sql.exec('UPDATE meta SET grace_at=NULL');
    }else{
      let s=this.student(message.studentId);
      if(!s||s.status==='removed'){
        const count=this.sql.exec<{n:number}>("SELECT count(*) AS n FROM students WHERE status='pending'").toArray()[0].n;
        if(count>=LIMITS.pending){this.error(ws,'PENDING_FULL');this.retire(ws,CLOSE_CODES.ABUSE,'PENDING_FULL');return;}
        if(s)this.sql.exec("UPDATE students SET status='pending',last_seen=? WHERE id=?",Date.now(),s.id);
        else{
          const base=sanitizeFirstName(message.name||'');if(!base){this.retire(ws,CLOSE_CODES.BAD_AUTH,'BAD_AUTH');return;}
          let name=base,n=1;while(this.sql.exec("SELECT id FROM students WHERE name=? AND status!='removed'",name).toArray().length)name=`${base} (${++n})`;
          const id=crypto.randomUUID();this.sql.exec('INSERT INTO students VALUES(?,?,?,\'pending\',?)',id,`u-${crypto.randomUUID()}`,name,Date.now());s=this.student(id)!;
        }
      }
      for(const other of this.ctx.getWebSockets()){const old=this.attachment(other);if(other!==ws&&old?.authed&&old.studentId===s.id)this.retire(other,CLOSE_CODES.REPLACED_SESSION,'REPLACED_SESSION');}
      a.role='student';a.studentId=s.id;a.authed=true;
    }
    ws.serializeAttachment(a);this.sql.exec('INSERT INTO sessions VALUES(?,?,?)',a.socketId,a.role,a.studentId||null);this.sql.exec('DELETE FROM auth_deadlines WHERE socket_id=?',a.socketId);
    const s=this.student(a.studentId);this.send(ws,{type:'joined',...(s?{studentId:s.id,name:s.name}:{}),status:s?.status||'active',author:s?.author||'teacher'});
    if(s?.status==='pending')this.send(ws,{type:'waiting'});else this.snapshot(ws);
    if(a.role==='teacher')this.eachEditor(socket=>this.send(socket,{type:'resumed'}));
    this.roster();await this.schedule();
  }
  async webSocketMessage(ws:WebSocket,frame:string|ArrayBuffer){
    const a=this.attachment(ws),m=this.meta();if(!a?.socketId||!m||m.closed){this.retire(ws,CLOSE_CODES.ROOM_CLOSED,'ROOM_CLOSED');return;}
    const result=parseClientFrame(frame);if(!result.ok){this.error(ws,result.code);if(result.code==='PROTOCOL_VERSION')this.retire(ws,CLOSE_CODES.PROTOCOL_VERSION,'PROTOCOL_VERSION');return;}
    const msg=result.value;if(msg.type==='ping'){if(a.authed)try{ws.send('pong');}catch{}return;}
    if(!a.authed){if(msg.type!=='hello'){this.error(ws,'BAD_AUTH');return;}await this.hello(ws,a,msg);return;}
    if(!this.current(a)){this.retire(ws,CLOSE_CODES.REPLACED_SESSION,'REPLACED_SESSION');return;}
    if(['accept','reject','kick','set_board','close_room','teacher_leaving'].includes(msg.type)){
      if(a.role!=='teacher'){this.error(ws,'FORBIDDEN');return;}
      if(msg.type==='close_room'){await this.closeRoom();return;}
      if(msg.type==='teacher_leaving'){this.retire(ws,1000,'TEACHER_LEAVING');this.sql.exec('UPDATE meta SET grace_at=?',Date.now()+10000);this.eachEditor(socket=>this.send(socket,{type:'paused',reason:'teacher_disconnected'}));await this.schedule();return;}
      if(msg.type==='set_board'){
        this.sql.exec('UPDATE meta SET board_id=?',msg.boardId);this.sql.exec('INSERT OR IGNORE INTO state VALUES(?,?,0)',msg.boardId,JSON.stringify(emptyState()));
        this.eachEditor(socket=>{this.send(socket,{type:'board_changed',boardId:msg.boardId});this.snapshot(socket);});return;
      }
      if(msg.type==='accept'||msg.type==='reject'||msg.type==='kick'){
        const student=this.student(msg.studentId);if(!student){this.error(ws,'NOT_FOUND');return;}
        if(msg.type==='accept'){
          if(student.status!=='pending'){this.error(ws,'NOT_ACTIVE');return;}
          if(this.sql.exec<{n:number}>("SELECT count(*) AS n FROM students WHERE status='active'").toArray()[0].n>=LIMITS.active){this.error(ws,'ROOM_FULL');return;}
          this.sql.exec("UPDATE students SET status='active' WHERE id=?",student.id);
        }else this.sql.exec("UPDATE students SET status='removed' WHERE id=?",student.id);
        for(const socket of this.ctx.getWebSockets())if(this.attachment(socket)?.studentId===student.id){if(msg.type==='accept')this.snapshot(socket);else{this.send(socket,{type:'kicked',reason:msg.type==='reject'?'REJECTED':'REMOVED'});this.retire(socket,msg.type==='reject'?CLOSE_CODES.REJECTED:CLOSE_CODES.REMOVED,msg.type==='reject'?'REJECTED':'REMOVED');}}
        this.roster();return;
      }
    }
    if(!this.editable(a)){this.error(ws,'NOT_ACTIVE');return;}
    if(msg.type==='resync_request'){this.snapshot(ws);return;}
    if(msg.type!=='ops'){this.error(ws,'BAD_MESSAGE');return;}
    if(!this.teacherPresent()){this.error(ws,'PAUSED');return;}
    const now=Date.now(),bucket=this.buckets.get(a.socketId)||{tokens:LIMITS.opsBurst,at:now};bucket.tokens=Math.min(LIMITS.opsBurst,bucket.tokens+(now-bucket.at)*LIMITS.opsPerSecond/1000);bucket.at=now;this.buckets.set(a.socketId,bucket);
    if(bucket.tokens<msg.ops.length){this.error(ws,'RATE_LIMITED',msg.ops[0].opId);return;}bucket.tokens-=msg.ops.length;
    const author=a.role==='teacher'?'teacher':this.student(a.studentId)!.author;
    if(msg.ops.some(op=>op.author!==author||!op.opId.startsWith(`${author}:`)||op.boardId!==m.board_id)){this.error(ws,'FORBIDDEN',msg.ops[0].opId);return;}
    const {state}=this.load(m.board_id);let seq=m.seq;const accepted:Op[]=[],duplicates:Op[]=[],ignored:string[]=[];
    try{this.ctx.storage.transactionSync(()=>{
      for(const input of msg.ops){
        const duplicate=this.sql.exec<{json:string}>('SELECT json FROM ops WHERE op_id=?',input.opId).toArray()[0];if(duplicate){duplicates.push(JSON.parse(duplicate.json));continue;}
        if(input.kind==='add'&&!input.id.startsWith(`${author}:`)&&!this.sql.exec('SELECT id FROM tombstones WHERE board_id=? AND id=?',m.board_id,input.id).toArray().length)throw Error('FORBIDDEN');
        if(!applyOperation(state,input)){ignored.push(input.opId);continue;}
        const op={...input,seq:++seq};this.sql.exec('INSERT INTO ops VALUES(?,?,?,?)',seq,m.board_id,JSON.stringify(op),op.opId);accepted.push(op);
        if(op.kind==='remove')this.sql.exec('INSERT OR IGNORE INTO tombstones VALUES(?,?)',m.board_id,op.id);
      }
      const text=JSON.stringify(state);if(bytes(text)>LIMITS.stateBytes)throw Error('STATE_TOO_LARGE');
      if(Math.floor(seq/200)>Math.floor(m.seq/200))this.sql.exec('UPDATE state SET json=?,seq=? WHERE board_id=?',text,seq,m.board_id);
      this.sql.exec('UPDATE meta SET seq=?',seq);
    });}catch(error){this.error(ws,(error as Error).message==='FORBIDDEN'?'FORBIDDEN':'STATE_TOO_LARGE',msg.ops[0].opId);return;}
    // Send separately so a multi-op input never creates a >64KB broadcast frame.
    for(const op of accepted)this.eachEditor(socket=>this.send(socket,{type:'ops',ops:[op]}));
    for(const op of duplicates)this.send(ws,{type:'ops',ops:[op]});
    for(const ref of ignored)this.error(ws,'NOT_FOUND',ref);
    if(ignored.length)this.snapshot(ws);
  }
  async webSocketClose(ws:WebSocket){
    if(this.purged)return;const a=this.attachment(ws);if(!a?.socketId)return;const wasCurrent=this.current(a);
    this.sql.exec('DELETE FROM sessions WHERE socket_id=?',a.socketId);this.sql.exec('DELETE FROM auth_deadlines WHERE socket_id=?',a.socketId);this.buckets.delete(a.socketId);
    if(a.studentId)this.sql.exec('UPDATE students SET last_seen=? WHERE id=?',Date.now(),a.studentId);
    const m=this.meta();if(wasCurrent&&a.role==='teacher'&&m&&!m.closed&&!this.teacherPresent()){
      this.sql.exec('UPDATE meta SET grace_at=?',Date.now()+LIMITS.teacherGraceMs);this.eachEditor(socket=>this.send(socket,{type:'paused',reason:'teacher_disconnected'}));
    }
    this.roster();await this.schedule();
  }
  async webSocketError(ws:WebSocket){try{ws.close(1011,'CONNECTION_ERROR');}catch{}await this.webSocketClose(ws);}
}

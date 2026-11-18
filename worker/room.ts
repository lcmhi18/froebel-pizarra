import { DurableObject } from 'cloudflare:workers';
import { applyOp, emptyState, validOp, hash, matches, randomToken, json, type Env, type LegacyOp, type BoardState, type Student } from './protocol';
type Attachment = { role:'teacher'|'student'; ready:boolean; id:string; window:number; count:number };
type Meta = {code:string; room:string; teacher_token_hash:string; closed:number; created_at:number};
export class Room extends DurableObject<Env> {
  constructor(ctx:DurableObjectState,env:Env) {
    super(ctx,env);
    const sql=ctx.storage.sql;
    sql.exec('CREATE TABLE IF NOT EXISTS meta(code TEXT, room TEXT, teacher_token_hash TEXT, closed INTEGER, created_at INTEGER)');
    sql.exec("CREATE TABLE IF NOT EXISTS students(id TEXT PRIMARY KEY,name TEXT,status TEXT CHECK(status IN ('pending','active','removed')),last_seen INTEGER)");
    sql.exec('CREATE TABLE IF NOT EXISTS state(json TEXT,seq INTEGER)');
    sql.exec('CREATE TABLE IF NOT EXISTS ops(seq INTEGER PRIMARY KEY,author TEXT,json TEXT,op_id TEXT UNIQUE)');
    sql.exec('CREATE TABLE IF NOT EXISTS tombstones(id TEXT PRIMARY KEY)');
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
  }
  get sql(){ return this.ctx.storage.sql; }
  meta(){return this.sql.exec<Meta>('SELECT * FROM meta').toArray()[0];}
  send(ws:WebSocket,data:unknown){ try{ws.send(JSON.stringify(data));}catch{} }
  error(ws:WebSocket,error:string){this.send(ws,{type:'error',error});}
  attachment(ws:WebSocket){return ws.deserializeAttachment() as Attachment;}
  snapshot(ws:WebSocket) {
    const {state,seq}=this.load();const text=JSON.stringify({type:'snapshot',state,seq});
    if(new TextEncoder().encode(text).length<=60000) this.send(ws,{type:'snapshot',state,seq});
    else {const id=crypto.randomUUID(), chunks=text.match(/[\s\S]{1,12000}/g)!;chunks.forEach((data,index)=>this.send(ws,{type:'snapshot-chunk',id,index,total:chunks.length,data}));}
  }
  roster(){const students=this.sql.exec<Student>('SELECT * FROM students WHERE status != ? ORDER BY last_seen','removed').toArray();for(const ws of this.ctx.getWebSockets()){const a=this.attachment(ws);if(a.ready&&a.role==='teacher')this.send(ws,{type:'roster',students});}}
  load(){const row=this.sql.exec<{json:string;seq:number}>('SELECT * FROM state').toArray()[0];const state:BoardState=row?JSON.parse(row.json):emptyState();let seq=row?.seq || 0;for(const row of this.sql.exec<{seq:number;json:string}>('SELECT seq,json FROM ops WHERE seq>? ORDER BY seq',seq)){applyOp(state,JSON.parse(row.json));seq=row.seq;}return {state,seq};}
  async fetch(req:Request) {
    const url=new URL(req.url);
    if(url.pathname==='/init'&&req.method==='POST'){
      if(this.meta())return json({error:'EXISTS'},409);
      const {code,room,teacherHash}=await req.json() as {code:string;room:string;teacherHash:string};
      this.sql.exec('INSERT INTO meta VALUES(?,?,?,0,?)',code,room,teacherHash,Date.now());
      this.sql.exec('INSERT INTO state VALUES(?,0)',JSON.stringify(emptyState()));return json({ok:true});
    }
    const meta=this.meta();if(!meta)return json({error:'NOT_FOUND'},404);
    if(url.pathname.endsWith('/reopen')&&req.method==='POST'){
      const {teacherToken}=await req.json() as {teacherToken:string};
      if(!await matches(teacherToken,meta.teacher_token_hash))return json({error:'FORBIDDEN'},403);
      await this.env.REGISTRY.get(this.env.REGISTRY.idFromName('singleton')).fetch('https://registry/status',{method:'POST',body:JSON.stringify({code:meta.code,room:meta.room,closed:false})});
      this.sql.exec('UPDATE meta SET closed=0');return json({ok:true});
    }
    if(!url.pathname.endsWith('/ws'))return req.method==='GET'?json({code:meta.code,open:!meta.closed}):json({error:'METHOD_NOT_ALLOWED'},405);
    if(meta.closed)return json({error:'ROOM_CLOSED'},410);
    if(req.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'UPGRADE_REQUIRED'},426);
    const role=url.searchParams.get('role');if(role!=='teacher'&&role!=='student')return json({error:'INVALID_ROLE'},400);
    if(this.ctx.getWebSockets().length>=100)return json({error:'ROOM_BUSY'},429);
    const [client,server]=Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);server.serializeAttachment({role,ready:false,id:'',window:Date.now(),count:0} satisfies Attachment);
    return new Response(null,{status:101,webSocket:client});
  }
  async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer) {
    if(typeof message!=='string'||new TextEncoder().encode(message).length>65536){this.error(ws,'MESSAGE_TOO_LARGE');return;}
    let m:any;try{m=JSON.parse(message);}catch{this.error(ws,'INVALID_MESSAGE');return;}
    if(!m||typeof m!=='object'){this.error(ws,'INVALID_MESSAGE');return;}
    const a=this.attachment(ws),meta=this.meta();
    if(meta.closed){ws.close(4002,'ROOM_CLOSED');return;}
    if(!a.ready){
      if(m.type!=='auth'){this.error(ws,'AUTH_REQUIRED');return;}
      if(a.role==='teacher'){
        if(!await matches(m.teacherToken,meta.teacher_token_hash)){ws.close(4003,'UNAUTHORIZED');return;}
        a.id='teacher';a.ready=true;ws.serializeAttachment(a);this.send(ws,{type:'identity',author:'teacher'});this.snapshot(ws);this.roster();return;
      }
      const previous=typeof m.studentId==='string'?this.sql.exec<Student>('SELECT * FROM students WHERE id=?',m.studentId).toArray()[0]:undefined;
      const name=(typeof m.name==='string'?m.name.replace(/[\p{C}<>]/gu,'').trim().slice(0,24):'')||previous?.name;
      if(!name){this.error(ws,'INVALID_NAME');return;}
      a.id=previous?.id || randomToken();a.ready=true;
      if(!previous)this.sql.exec('INSERT INTO students VALUES(?,?,?,?)',a.id,name,'pending',Date.now());
      else this.sql.exec('UPDATE students SET status=?,last_seen=? WHERE id=?',previous.status==='removed'?'pending':previous.status,Date.now(),a.id);
      // A resumed identity has one live socket; an old tab cannot retain a hidden editing connection.
      for(const other of this.ctx.getWebSockets())if(other!==ws&&this.attachment(other).id===a.id)other.close(4000,'RECONNECTED');
      ws.serializeAttachment(a);this.send(ws,{type:'identity',studentId:a.id,author:a.id});
      const student=this.sql.exec<Student>('SELECT * FROM students WHERE id=?',a.id).toArray()[0];
      if(student.status==='active')this.snapshot(ws);else this.send(ws,{type:'waiting'});
      this.roster();return;
    }
    if(['accept','reject','remove','close'].includes(m.type)){
      if(a.role!=='teacher'){this.error(ws,'FORBIDDEN');return;}
      if(m.type==='close'){
        this.sql.exec('UPDATE meta SET closed=1');
        for(const socket of this.ctx.getWebSockets())socket.close(4002,'ROOM_CLOSED');
        await this.env.REGISTRY.get(this.env.REGISTRY.idFromName('singleton')).fetch('https://registry/status',{method:'POST',body:JSON.stringify({code:meta.code,room:meta.room,closed:true})});return;
      }
      const student=this.sql.exec<Student>('SELECT * FROM students WHERE id=?',String(m.studentId)).toArray()[0];
      if(!student){this.error(ws,'NOT_FOUND');return;}
      if(m.type==='accept'){
        if(student.status!=='pending'){this.error(ws,'NOT_PENDING');return;}
        const count=this.sql.exec<{n:number}>("SELECT count(*) AS n FROM students WHERE status='active'").toArray()[0].n;
        if(count>=5){this.error(ws,'ROOM_FULL');return;}
        this.sql.exec("UPDATE students SET status='active' WHERE id=?",student.id);
      }else this.sql.exec("UPDATE students SET status='removed' WHERE id=?",student.id);
      for(const socket of this.ctx.getWebSockets())if(this.attachment(socket).id===student.id){if(m.type==='accept')this.snapshot(socket);else socket.close(m.type==='reject'?4003:4001,m.type==='reject'?'REJECTED':'REMOVED');}
      this.roster();return;
    }
    const student=a.role==='student'?this.sql.exec<Student>('SELECT * FROM students WHERE id=?',a.id).toArray()[0]:null;
    if(a.role==='student'&&student?.status!=='active'){this.error(ws,'WAITING_APPROVAL');return;}
    if(m.type==='resync'){this.snapshot(ws);return;}
    if(m.type!=='ops'||!Array.isArray(m.ops)||!m.ops.length){this.error(ws,'INVALID_MESSAGE');return;}
    if(Date.now()-a.window>=1000){a.window=Date.now();a.count=0;}
    a.count+=m.ops.length;ws.serializeAttachment(a);
    if(a.count>60){this.send(ws,{type:'error',error:'RATE_LIMIT',opIds:m.ops.map((op:any)=>op?.opId)});return;}
    if(!m.ops.every(validOp)){this.error(ws,'INVALID_OP');this.snapshot(ws);return;}
    const {state,seq:initial}=this.load();let seq=initial;const accepted:LegacyOp[]=[];const ignored:string[]=[];
    try { this.ctx.storage.transactionSync(()=>{
      for(const input of m.ops as LegacyOp[]){
        const op:LegacyOp={...input,author:a.id};
        if(!op.opId.startsWith(`${a.id}:`)||this.sql.exec('SELECT seq FROM ops WHERE op_id=?',op.opId).toArray().length){ignored.push(op.opId);continue;}
        if((op.kind==='update'&& !state.items[op.id!]) || (op.kind==='add'&&(!op.id!.startsWith(`${a.id}:`) || !!state.items[op.id!]))){ignored.push(op.opId);continue;}
        op.seq=++seq;applyOp(state,op);
        this.sql.exec('INSERT INTO ops VALUES(?,?,?,?)',seq,a.id,JSON.stringify(op),op.opId);accepted.push(op);
        if(op.kind==='remove')this.sql.exec('INSERT OR IGNORE INTO tombstones VALUES(?)',op.id!);
      }
      if(Object.keys(state.items).length>2000||new TextEncoder().encode(JSON.stringify(state)).length>2000000)throw Error('BOARD_FULL');
      if(Math.floor(seq/200)>Math.floor(initial/200))this.sql.exec('UPDATE state SET json=?,seq=?',JSON.stringify(state),seq);
    }); } catch { this.send(ws,{type:'error',error:'BOARD_FULL',opIds:m.ops.map((op:LegacyOp)=>op.opId)});return; }
    // Send the same ordered operations to every editor, including the author, for canonical reconciliation.
    for(const socket of this.ctx.getWebSockets()){
      const target=this.attachment(socket);if(!target.ready)continue;
      if(target.role==='student'&&!this.sql.exec("SELECT id FROM students WHERE id=? AND status='active'",target.id).toArray().length)continue;
      for(const op of accepted)this.send(socket,{type:'ops',ops:[op]});
    }
    if(ignored.length){this.send(ws,{type:'ignored',opIds:ignored});this.snapshot(ws);}
  }
  webSocketClose(ws:WebSocket){const a=this.attachment(ws);if(a.id&&a.role==='student')this.sql.exec('UPDATE students SET last_seen=? WHERE id=?',Date.now(),a.id);this.roster();}
  webSocketError(ws:WebSocket){try{ws.close(1011,'CONNECTION_ERROR');}catch{}}
}

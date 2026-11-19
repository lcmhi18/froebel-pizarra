import { DurableObject } from 'cloudflare:workers';
import { CODE_ALPHABET, isRoomCode, json, randomToken, hash, type Env } from './protocol';

const HOUR = 3600000, MINUTE = 60000;
const isHash = (value:unknown):value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
type RoomRow = {code:string;room:string|null;status:'open'|'closed'|'free';closed_at:number|null;release_at:number|null};
type ClientRow = {failures:number;blocked_until:number;next_entry_at:number};

export class Registry extends DurableObject<Env> {
  private canonical:boolean;
  constructor(ctx:DurableObjectState,env:Env) {
    super(ctx,env);
    this.canonical=ctx.id.equals(env.REGISTRY.idFromName('registry'));
    this.sql.exec('CREATE TABLE IF NOT EXISTS registry_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS legacy_room_wake(room TEXT PRIMARY KEY,due INTEGER NOT NULL)');
    this.sql.exec("CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY,room TEXT,status TEXT NOT NULL CHECK(status IN ('open','closed','free')),closed_at INTEGER,release_at INTEGER)");
    this.sql.exec('CREATE TABLE IF NOT EXISTS counters(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS clients(ip_hash TEXT PRIMARY KEY,failures INTEGER NOT NULL DEFAULT 0,blocked_until INTEGER NOT NULL DEFAULT 0,next_entry_at INTEGER NOT NULL DEFAULT 0,expires_at INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS reentries(key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,paused_until INTEGER NOT NULL,expires_at INTEGER NOT NULL)');
    if(!this.setting('ip_salt'))this.sql.exec('INSERT INTO registry_settings VALUES(?,?)','ip_salt',randomToken());
    if(this.canonical)ctx.blockConcurrencyWhile(async()=>{await this.bootstrapLegacy();await this.schedule();});
  }
  get sql(){return this.ctx.storage.sql;}
  private setting(key:string){return this.sql.exec<{value:string}>('SELECT value FROM registry_settings WHERE key=?',key).toArray()[0]?.value;}
  private retention(){const hours=Number(this.env.RETENTION_HOURS||24);return (Number.isFinite(hours)&&hours>0?hours:24)*HOUR;}
  private globalCap(){const value=Number(this.env.MAX_ROOMS_PER_HOUR||100);return Number.isInteger(value)&&value>0?value:100;}
  async hashIp(ip:string){return hash(`${this.setting('ip_salt')}\0${ip}`);}
  private migrateLocalCodes(){
    if(!this.sql.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='codes'").toArray().length)return;
    this.sql.exec("INSERT OR IGNORE INTO rooms(code,room,status,closed_at,release_at) SELECT code,room,CASE WHEN expires IS NULL THEN 'open' ELSE 'closed' END,CASE WHEN expires IS NULL THEN NULL ELSE expires-? END,expires FROM codes",this.retention());
  }
  async bootstrapLegacy(){
    if(this.setting('legacy_imported'))return;
    const legacy=this.env.REGISTRY.get(this.env.REGISTRY.idFromName('singleton'));
    const response=await legacy.fetch('https://registry/internal/export',{method:'POST'});
    if(!response.ok)throw Error('REGISTRY_MIGRATION_FAILED');
    const rows=await response.json() as RoomRow[];
    this.ctx.storage.transactionSync(()=>{
      for(const row of rows)this.sql.exec('INSERT OR IGNORE INTO rooms VALUES(?,?,?,?,?)',row.code,row.room,row.status,row.closed_at,row.release_at);
      // Preserve the Room identities before expired codes are released by clean().
      // Wake closed legacy objects in bounded alarm batches so their constructor
      // installs retention. Never delete student data from this Registry.
      for(const row of rows)if(row.status==='closed'&&row.room)this.sql.exec('INSERT OR IGNORE INTO legacy_room_wake VALUES(?,?)',row.room,Date.now());
      this.sql.exec('INSERT OR REPLACE INTO registry_settings VALUES(?,?)','legacy_imported','1');
    });
    this.clean();
    await this.schedule();
  }
  private clean(){
    const now=Date.now();
    this.sql.exec("UPDATE rooms SET status='free',room=NULL,closed_at=NULL,release_at=NULL WHERE status='closed' AND release_at<=?",now);
    for(const table of ['counters','clients','reentries'])this.sql.exec(`DELETE FROM ${table} WHERE expires_at<=?`,now);
  }
  private async schedule(){
    const row=this.sql.exec<{due:number|null}>("SELECT min(due) AS due FROM (SELECT release_at AS due FROM rooms WHERE status='closed' UNION ALL SELECT expires_at FROM counters UNION ALL SELECT expires_at FROM clients UNION ALL SELECT expires_at FROM reentries UNION ALL SELECT due FROM legacy_room_wake)").toArray()[0];
    if(row?.due!==null&&row?.due!==undefined)await this.ctx.storage.setAlarm(Math.max(Date.now()+1,row.due));
    else await this.ctx.storage.deleteAlarm();
  }
  async alarm(){if(this.canonical){
    for(const row of this.sql.exec<{room:string}>('SELECT room FROM legacy_room_wake WHERE due<=? ORDER BY due LIMIT 3',Date.now()).toArray()){
      try{const response=await this.env.ROOM.get(this.env.ROOM.idFromName(row.room)).fetch('https://room/internal/retention-check');if(!response.ok)throw Error();await response.arrayBuffer();this.sql.exec('DELETE FROM legacy_room_wake WHERE room=?',row.room);}
      catch{this.sql.exec('UPDATE legacy_room_wake SET due=? WHERE room=?',Date.now()+10000,row.room);}
    }
    this.clean();await this.schedule();
  }}
  private limited(retryMs:number){return Response.json({error:'RATE_LIMITED'},{status:429,headers:{'Retry-After':String(Math.max(1,Math.ceil(retryMs/1000)))}});}
  private blocked(ipHash:string){const row=this.sql.exec<ClientRow>('SELECT * FROM clients WHERE ip_hash=?',ipHash).toArray()[0];return row&&row.blocked_until>Date.now()?this.limited(row.blocked_until-Date.now()):null;}
  private bump(key:string,expires:number){this.sql.exec('INSERT INTO counters VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',key,expires);}
  private count(key:string){return this.sql.exec<{count:number}>('SELECT count FROM counters WHERE key=?',key).toArray()[0]?.count||0;}
  private touchClient(ipHash:string){this.sql.exec('INSERT INTO clients(ip_hash,expires_at) VALUES(?,?) ON CONFLICT(ip_hash) DO UPDATE SET expires_at=excluded.expires_at',ipHash,Date.now()+HOUR);}
  private allocate(ipHash:string){
    const blocked=this.blocked(ipHash);if(blocked)return blocked;
    const now=Date.now(),window=Math.floor(now/HOUR),end=(window+1)*HOUR,personal=`create:${window}:${ipHash}`,global=`create:${window}:global`;
    if(this.count(personal)>=5||this.count(global)>=this.globalCap())return this.limited(end-now);
    return this.ctx.storage.transactionSync(()=>{
      const reusable=this.sql.exec<{code:string}>("SELECT code FROM rooms WHERE status='free' ORDER BY code LIMIT 1").toArray()[0];
      let code=reusable?.code;
      if(!code)for(let i=0;i<100;i++){
        const candidate=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>CODE_ALPHABET[n%CODE_ALPHABET.length]).join('');
        if(!this.sql.exec('SELECT code FROM rooms WHERE code=?',candidate).toArray().length){code=candidate;break;}
      }
      if(!code)return json({error:'RATE_LIMITED'},503);
      const room=`${code}:${crypto.randomUUID()}`;
      this.sql.exec("INSERT INTO rooms VALUES(?,?,'open',NULL,NULL) ON CONFLICT(code) DO UPDATE SET room=excluded.room,status='open',closed_at=NULL,release_at=NULL",code,room);
      this.bump(personal,end);this.bump(global,end);
      return json({code,room});
    });
  }
  private lookup(code:string,ipHash?:string){
    if(ipHash){
      const blocked=this.blocked(ipHash);if(blocked)return blocked;
      const now=Date.now(),minute=Math.floor(now/MINUTE),key=`query:${minute}:${ipHash}`;
      if(this.count(key)>=20)return this.limited((minute+1)*MINUTE-now);
      this.bump(key,(minute+1)*MINUTE);
    }
    const row=this.sql.exec<RoomRow>("SELECT * FROM rooms WHERE code=? AND status!='free'",code).toArray()[0];
    if(ipHash){
      this.touchClient(ipHash);
      if(row)this.sql.exec('UPDATE clients SET failures=0 WHERE ip_hash=?',ipHash);
      else {
        this.sql.exec('UPDATE clients SET failures=failures+1 WHERE ip_hash=?',ipHash);
        const state=this.sql.exec<ClientRow>('SELECT * FROM clients WHERE ip_hash=?',ipHash).toArray()[0];
        if(state.failures>=10){this.sql.exec('UPDATE clients SET blocked_until=?,failures=0 WHERE ip_hash=?',Date.now()+10*MINUTE,ipHash);return this.limited(10*MINUTE);}
      }
    }
    return json(row?{room:row.room,status:row.status}:{error:'NOT_FOUND'});
  }
  private status(code:string,room:string,closed:boolean){
    const row=this.sql.exec<RoomRow>('SELECT * FROM rooms WHERE code=? AND room=?',code,room).toArray()[0];
    if(!row||row.status==='free')return json({error:'NOT_FOUND'},404);
    if(closed&&row.status!=='closed')this.sql.exec("UPDATE rooms SET status='closed',closed_at=?,release_at=? WHERE code=?",Date.now(),Date.now()+this.retention(),code);
    if(!closed)this.sql.exec("UPDATE rooms SET status='open',closed_at=NULL,release_at=NULL WHERE code=?",code);
    return json({ok:true});
  }
  private entry(ipHash:string,subjectHash?:string,returningRemoved=false){
    const blocked=this.blocked(ipHash);if(blocked)return blocked;
    this.touchClient(ipHash);
    const now=Date.now(),client=this.sql.exec<ClientRow>('SELECT * FROM clients WHERE ip_hash=?',ipHash).toArray()[0];
    if(client.next_entry_at>now)return this.limited(client.next_entry_at-now);
    const key=subjectHash?`${ipHash}:${subjectHash}`:undefined;
    if(key&&returningRemoved){
      const prior=this.sql.exec<{attempts:number;paused_until:number}>('SELECT * FROM reentries WHERE key=?',key).toArray()[0];
      if(prior&&prior.paused_until>now)return this.limited(prior.paused_until-now);
      const attempts=prior?.paused_until?1:(prior?.attempts||0)+1;
      this.sql.exec('INSERT OR REPLACE INTO reentries VALUES(?,?,?,?)',key,attempts,attempts>=5?now+MINUTE:0,now+HOUR);
    }
    this.sql.exec('UPDATE clients SET next_entry_at=? WHERE ip_hash=?',now+3000,ipHash);
    return json({ok:true});
  }
  async fetch(req:Request):Promise<Response>{
    const path=new URL(req.url).pathname;
    // Private DO endpoint, not routed by the public Worker. Keeps the old Registry recoverable.
    if(path==='/internal/export'){
      this.migrateLocalCodes();return json(this.sql.exec<RoomRow>('SELECT * FROM rooms').toArray());
    }
    // Old Room instances can still notify singleton; all writes go to registry now.
    if(!this.canonical)return this.env.REGISTRY.get(this.env.REGISTRY.idFromName('registry')).fetch(req);
    if(req.method!=='POST')return json({error:'BAD_MESSAGE'},405);
    this.clean();
    let body:Record<string,unknown>;
    try{const text=await req.text();if(new TextEncoder().encode(text).length>65536)return json({error:'BAD_MESSAGE'},400);body=text?JSON.parse(text):{};if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return json({error:'BAD_MESSAGE'},400);}
    let response:Response;
    if(path==='/identity'&&typeof body.ip==='string'&&body.ip.length<=64)response=json({ipHash:await this.hashIp(body.ip)});
    else if(path==='/allocate'&&isHash(body.ipHash))response=this.allocate(body.ipHash);
    else if(path==='/lookup'&&isRoomCode(body.code)&&(body.ipHash===undefined||isHash(body.ipHash)))response=this.lookup(body.code,body.ipHash as string|undefined);
    else if(path==='/status'&&isRoomCode(body.code)&&typeof body.room==='string'&&typeof body.closed==='boolean')response=this.status(body.code,body.room,body.closed);
    else if(path==='/entry'&&isHash(body.ipHash)&&(body.subjectHash===undefined||isHash(body.subjectHash))&&(body.returningRemoved===undefined||typeof body.returningRemoved==='boolean')&&(!body.returningRemoved||isHash(body.subjectHash)))response=this.entry(body.ipHash,body.subjectHash as string|undefined,body.returningRemoved as boolean|undefined);
    else response=json({error:'BAD_MESSAGE'},400);
    await this.schedule();return response;
  }
}

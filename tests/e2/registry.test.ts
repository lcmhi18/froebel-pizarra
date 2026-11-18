import { env as bindings } from 'cloudflare:workers';
import { runInDurableObject,runDurableObjectAlarm } from 'cloudflare:test';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import type { Env } from '../../worker/protocol';
import type { Registry } from '../../worker/registry';

const env=bindings as Env;
const registry=()=>env.REGISTRY.get(env.REGISTRY.idFromName('registry')) as DurableObjectStub<Registry>;
const legacy=()=>env.REGISTRY.get(env.REGISTRY.idFromName('singleton')) as DurableObjectStub<Registry>;
const digest=(n:number)=>n.toString(16).padStart(64,'0');
const call=(path:string,body:unknown,stub=registry())=>stub.fetch(`https://registry${path}`,{method:'POST',body:JSON.stringify(body)});
const allocate=async(n=1)=>{const r=await call('/allocate',{ipHash:digest(n)});expect(r.status).toBe(200);return r.json() as Promise<{code:string;room:string}>;};
let now:number;

describe.sequential('Registry with real Durable Object SQLite',()=>{
  beforeEach(async()=>{
    now=Date.now()+365*86400000;
    vi.spyOn(Date,'now').mockImplementation(()=>now);
    for(const stub of [registry(),legacy()])await runInDurableObject(stub,async(_instance,state)=>{
      for(const table of ['rooms','counters','clients','reentries'])state.storage.sql.exec(`DELETE FROM ${table}`);
      if(state.storage.sql.exec("SELECT name FROM sqlite_master WHERE name='codes'").toArray().length)state.storage.sql.exec('DELETE FROM codes');
      await state.storage.deleteAlarm();
    });
  });
  afterEach(()=>vi.restoreAllMocks());

  it('allocates unique six-character codes across concurrent callers',async()=>{
    const rooms=await Promise.all(Array.from({length:30},(_,n)=>allocate(n+1)));
    expect(new Set(rooms.map(r=>r.code)).size).toBe(30);
    for(const room of rooms)expect(room.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  });
  it('enforces five creations per IP/hour and resets at the next hour',async()=>{
    for(let i=0;i<5;i++)await allocate();
    const denied=await call('/allocate',{ipHash:digest(1)});expect(denied.status).toBe(429);expect(Number(denied.headers.get('Retry-After'))).toBeGreaterThan(0);
    now+=3600000;await allocate();
  });
  it('enforces the global quota without partially charging a client',async()=>{
    await runInDurableObject(registry(),(_instance,state)=>{const hour=Math.floor(now/3600000);state.storage.sql.exec('INSERT INTO counters VALUES(?,?,?)',`create:${hour}:global`,100,(hour+1)*3600000);});
    expect((await call('/allocate',{ipHash:digest(3)})).status).toBe(429);
    const counts=await runInDurableObject(registry(),(_instance,state)=>state.storage.sql.exec('SELECT * FROM counters').toArray());expect(counts).toHaveLength(1);
  });
  it('limits successful code queries to twenty per minute',async()=>{
    const {code}=await allocate();for(let i=0;i<20;i++)expect((await call('/lookup',{code,ipHash:digest(2)})).status).toBe(200);
    expect((await call('/lookup',{code,ipHash:digest(2)})).status).toBe(429);
    now+=60001;expect((await call('/lookup',{code,ipHash:digest(2)})).status).toBe(200);
  });
  it('blocks ten missing codes for ten minutes, with successful queries resetting the streak',async()=>{
    const {code}=await allocate();
    for(let i=0;i<9;i++)expect((await call('/lookup',{code:'AAAAA2',ipHash:digest(2)})).status).toBe(200);
    await call('/lookup',{code,ipHash:digest(2)});
    for(let i=0;i<9;i++)await call('/lookup',{code:'AAAAA2',ipHash:digest(2)});
    expect((await call('/lookup',{code:'AAAAA2',ipHash:digest(2)})).status).toBe(429);
    expect((await call('/allocate',{ipHash:digest(2)})).status).toBe(429);
    now+=600001;expect((await call('/lookup',{code,ipHash:digest(2)})).status).toBe(200);
  });
  it('spaces entry requests by three seconds and pauses repeated removed students',async()=>{
    expect((await call('/entry',{ipHash:digest(1)})).status).toBe(200);
    expect((await call('/entry',{ipHash:digest(1)})).status).toBe(429);
    now+=3000;
    for(let i=0;i<5;i++){expect((await call('/entry',{ipHash:digest(1),subjectHash:digest(99),returningRemoved:true})).status).toBe(200);now+=3000;}
    expect((await call('/entry',{ipHash:digest(1),subjectHash:digest(99),returningRemoved:true})).status).toBe(429);
    now+=60001;expect((await call('/entry',{ipHash:digest(1),subjectHash:digest(99),returningRemoved:true})).status).toBe(200);
  });
  it('retains closed codes for 24h, then reuses them with a fresh Room identity',async()=>{
    const first=await allocate();await call('/status',{...first,closed:true});
    expect(await runInDurableObject(registry(),(_i,s)=>s.storage.getAlarm())).not.toBeNull();
    now+=24*3600000-1;await runDurableObjectAlarm(registry());
    expect(await (await call('/lookup',{code:first.code})).json()).toMatchObject({room:first.room,status:'closed'});
    now+=1;await runDurableObjectAlarm(registry());
    expect(await (await call('/lookup',{code:first.code})).json()).toEqual({error:'NOT_FOUND'});
    const next=await allocate(2);expect(next.code).toBe(first.code);expect(next.room).not.toBe(first.room);
    expect((await call('/status',{...first,closed:true})).status).toBe(404);
  });
  it('supports reopening during retention and repeated close does not extend expiry',async()=>{
    const room=await allocate();await call('/status',{...room,closed:true});now+=3600000;await call('/status',{...room,closed:true});
    const expiry=await runInDurableObject(registry(),(_i,s)=>s.storage.sql.exec<{release_at:number}>('SELECT release_at FROM rooms').toArray()[0].release_at);expect(expiry).toBe(now+23*3600000);
    await call('/status',{...room,closed:false});expect(await(await call('/lookup',{code:room.code})).json()).toMatchObject({status:'open'});
  });
  it('imports legacy codes and forwards old singleton status notifications',async()=>{
    await runInDurableObject(legacy(),(_i,s)=>{s.storage.sql.exec('CREATE TABLE IF NOT EXISTS codes(code TEXT PRIMARY KEY,room TEXT,expires INTEGER)');s.storage.sql.exec('INSERT INTO codes VALUES(?,?,NULL)','ABCD23','legacy-room-id');});
    await runInDurableObject(registry(),async(instance:Registry,s)=>{s.storage.sql.exec("DELETE FROM registry_settings WHERE key='legacy_imported'");await instance.bootstrapLegacy();});
    expect(await(await call('/lookup',{code:'ABCD23'})).json()).toMatchObject({room:'legacy-room-id',status:'open'});
    await call('/status',{code:'ABCD23',room:'legacy-room-id',closed:true},legacy());
    expect(await(await call('/lookup',{code:'ABCD23'})).json()).toMatchObject({status:'closed'});
  });
  it('uses a persistent random salt and stores no clear IP in quota tables',async()=>{
    const ip='192.0.2.123';const first=await(await call('/identity',{ip})).json() as {ipHash:string};
    expect(first.ipHash).toMatch(/^[0-9a-f]{64}$/);expect(await(await call('/identity',{ip})).json()).toEqual(first);
    await call('/allocate',first);await call('/entry',first);
    const stored=await runInDurableObject(registry(),(_i,s)=>['rooms','counters','clients','reentries'].flatMap(table=>s.storage.sql.exec(`SELECT * FROM ${table}`).toArray()));
    expect(JSON.stringify(stored)).not.toContain(ip);
    const salt=await runInDurableObject(registry(),(_i,s)=>s.storage.sql.exec<{value:string}>("SELECT value FROM registry_settings WHERE key='ip_salt'").toArray()[0].value);expect(salt).toMatch(/^[0-9a-f]{64}$/);
  });
  it('cleans expired counters and clients through its alarm',async()=>{
    await allocate();await call('/entry',{ipHash:digest(1)});now+=3600001;
    expect(await runDurableObjectAlarm(registry())).toBe(true);
    const remaining=await runInDurableObject(registry(),(_i,s)=>['counters','clients','reentries'].map(table=>s.storage.sql.exec(`SELECT * FROM ${table}`).toArray().length));expect(remaining).toEqual([0,0,0]);
  });
  it('rejects malformed internal inputs without exceptions',async()=>{
    for(const body of [null,[],{ipHash:'raw-ip'},{ipHash:digest(1),returningRemoved:true}])expect((await call('/entry',body)).status).toBe(400);
  });
});

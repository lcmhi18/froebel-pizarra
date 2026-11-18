import { DurableObject } from 'cloudflare:workers';
import { json, type Env } from './protocol';
export class Registry extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) { super(ctx,env); ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS codes(code TEXT PRIMARY KEY, room TEXT NOT NULL, expires INTEGER)'); }
  async fetch(req: Request) {
    const sql = this.ctx.storage.sql, path = new URL(req.url).pathname;
    sql.exec('DELETE FROM codes WHERE expires IS NOT NULL AND expires <= ?', Date.now());
    if (path === '/allocate') {
      const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
      for (let attempt=0;attempt<100;attempt++) {
        const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
        if (sql.exec('SELECT code FROM codes WHERE code=?',code).toArray().length) continue;
        const room = `${code}:${crypto.randomUUID()}`;
        sql.exec('INSERT INTO codes VALUES(?,?,NULL)',code,room); return json({code,room});
      }
      return json({error:'REGISTRY_BUSY'},503);
    }
    const {code,room,closed} = await req.json() as {code:string;room?:string;closed?:boolean};
    if(path === '/status') { sql.exec('UPDATE codes SET expires=? WHERE code=? AND room=?',closed ? Date.now()+86400000 : null,code,room!); return json({ok:true}); }
    return json(sql.exec('SELECT room FROM codes WHERE code=?',code).toArray()[0] || {error:'NOT_FOUND'});
  }
}

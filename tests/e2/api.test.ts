import { SELF } from 'cloudflare:test';
import { env as bindings } from 'cloudflare:workers';
import type { Env } from '../../worker/protocol';
import { describe,it,expect,vi } from 'vitest';

describe('Registry quota integration at the Worker boundary',()=>{
  it('rate-limits creation before any external authentication request',async()=>{
    const env=bindings as Env;
    const registry=env.REGISTRY.get(env.REGISTRY.idFromName('registry'));
    const identity=await registry.fetch('https://registry/identity',{method:'POST',body:JSON.stringify({ip:'198.51.100.213'})});
    const {ipHash}=await identity.json() as {ipHash:string};
    for(let i=0;i<20;i++)await env.ROOM_RATE_LIMITER.limit({key:`create:${ipHash}`});
    const authFetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('External fetch disabled for this test'));
    try{
      const denied=await SELF.fetch('https://public.example/api/rooms',{method:'POST',headers:{'CF-Connecting-IP':'198.51.100.213'}});
      expect(denied.status).toBe(429);expect(await denied.json()).toEqual({error:'RATE_LIMITED'});
      expect(authFetch).not.toHaveBeenCalled();
    }finally{authFetch.mockRestore();}
  });
  it('returns 429 and Retry-After on the sixth creation from one IP',async()=>{
    const codes=[];
    for(let i=0;i<5;i++){
      const response=await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers:{'CF-Connecting-IP':'198.51.100.211'}});
      expect(response.status).toBe(200);const data=await response.json() as {code:string;teacherToken:string};codes.push(data.code);expect(data.teacherToken).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(new Set(codes).size).toBe(5);
    const denied=await SELF.fetch('http://localhost/api/rooms',{method:'POST',headers:{'CF-Connecting-IP':'198.51.100.211'}});
    expect(denied.status).toBe(429);expect(await denied.json()).toEqual({error:'RATE_LIMITED'});expect(Number(denied.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
  it('blocks an IP after ten missing codes without exposing its digest',async()=>{
    for(let i=0;i<9;i++){
      const response=await SELF.fetch('http://localhost/api/rooms/ZZZZZ2',{headers:{'CF-Connecting-IP':'198.51.100.212'}});expect(response.status).toBe(404);
    }
    const denied=await SELF.fetch('http://localhost/api/rooms/ZZZZZ2',{headers:{'CF-Connecting-IP':'198.51.100.212'}});
    expect(denied.status).toBe(429);expect(await denied.json()).toEqual({error:'RATE_LIMITED'});
  });
});

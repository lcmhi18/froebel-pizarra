import { json, randomToken, hash, type Env } from './protocol';
export { Registry } from './registry';
export { Room } from './room';
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), origin = req.headers.get('Origin');
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(req);
    }
    const allowed = env.ALLOWED_ORIGINS.split(',').map(s=>s.trim());
    if (origin && !allowed.includes(origin)) return json({error:'ORIGIN_DENIED'},403);
    const cors = { 'Access-Control-Allow-Origin': origin || allowed[0], 'Access-Control-Allow-Headers':'Authorization, Content-Type', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', Vary:'Origin' };
    if(req.method === 'OPTIONS') return new Response(null,{headers:cors});
    const registry = env.REGISTRY.get(env.REGISTRY.idFromName('singleton'));
    let response: Response;
    try {
      if(url.pathname === '/api/rooms' && req.method === 'POST') {
        const local = ['localhost','127.0.0.1'].includes(url.hostname) && env.LOCAL_TEACHER === 'true';
        if (!local) {
          const headers = {apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:req.headers.get('Authorization') || ''};
          const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers});
          if(!userResponse.ok) return new Response(JSON.stringify({error:'UNAUTHORIZED'}),{status:401,headers:{...cors,'Content-Type':'application/json'}});
          const user = await userResponse.json() as {id:string};
          const access = await fetch(`${env.SUPABASE_URL}/rest/v1/account_access?user_id=eq.${encodeURIComponent(user.id)}&select=role,status`,{headers});
          const rows = access.ok ? await access.json() as {role:string;status:string}[] : [];
          if(!rows.some(r=>r.status === 'active' && ['teacher','owner'].includes(r.role))) return new Response(JSON.stringify({error:'FORBIDDEN'}),{status:403,headers:{...cors,'Content-Type':'application/json'}});
        }
        const allocation = await registry.fetch('https://registry/allocate',{method:'POST'});
        if(!allocation.ok) throw Error('REGISTRY_BUSY');
        const {code,room} = await allocation.json() as {code:string;room:string};
        const teacherToken = randomToken();
        await env.ROOM.get(env.ROOM.idFromName(room)).fetch('https://room/init',{method:'POST',body:JSON.stringify({code,room,teacherHash:await hash(teacherToken)})});
        response = json({code,teacherToken});
      } else {
        const match = url.pathname.match(/^\/api\/rooms\/([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6})(\/ws|\/reopen)?$/);
        if (!match) response = json({error:'NOT_FOUND'},404);
        else {
          const found = await registry.fetch('https://registry/lookup',{method:'POST',body:JSON.stringify({code:match[1]})});
          const {room} = await found.json() as {room?:string};
          if(!room) response = json({error:'NOT_FOUND'},404);
          else response = await env.ROOM.get(env.ROOM.idFromName(room)).fetch(req);
        }
      }
    } catch { response = json({error:'SERVER_ERROR'},500); }
    if(response.status === 101) return response;
    const headers = new Headers(response.headers); Object.entries(cors).forEach(([k,v])=>headers.set(k,v));
    return new Response(response.body,{status:response.status,headers});
  }
};

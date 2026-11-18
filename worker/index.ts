import { json, randomToken, hash, isBoardId, API_HEADERS, type Env } from './protocol';
export { Registry } from './registry';
export { Room } from './room';
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), origin = req.headers.get('Origin');
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(req);
    }
    const allowed = env.ALLOWED_ORIGINS.split(',').map(s=>s.trim());
    if ((origin && !allowed.includes(origin)) || ((!origin) && (req.method==='POST'||req.headers.get('Upgrade')?.toLowerCase()==='websocket'))) return json({error:'ORIGIN_DENIED'},403);
    const cors = { ...API_HEADERS,'Access-Control-Allow-Origin': origin || allowed[0], 'Access-Control-Allow-Headers':'Authorization, Content-Type', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', Vary:'Origin' };
    if(req.method === 'OPTIONS') return new Response(null,{headers:cors});
    const registry = env.REGISTRY.get(env.REGISTRY.idFromName('registry'));
    const client = async () => {
      const result = await registry.fetch('https://registry/identity',{method:'POST',body:JSON.stringify({ip:req.headers.get('CF-Connecting-IP')||'unknown'})});
      if(!result.ok)throw Error('CLIENT_IDENTITY_FAILED');
      const {ipHash}=await result.json() as {ipHash:string};
      if(typeof ipHash!=='string'||!/^[0-9a-f]{64}$/.test(ipHash))throw Error('CLIENT_IDENTITY_FAILED');
      return ipHash;
    };
    let response: Response;
    try {
      if(url.pathname === '/api/rooms' && req.method === 'POST') {
        let boardId='prueba';
        try{const text=await req.text();if(new TextEncoder().encode(text).length>1024)throw Error();const body=text?JSON.parse(text):{};if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='boardId'))throw Error();if(body.boardId!==undefined){if(!isBoardId(body.boardId))return json({error:'UNKNOWN_BOARD'},400);boardId=body.boardId;}}catch{return json({error:'BAD_MESSAGE'},400);}
        const ipHash=await client();
        if(!(await env.ROOM_RATE_LIMITER.limit({key:`create:${ipHash}`})).success) return new Response(JSON.stringify({error:'RATE_LIMITED'}),{status:429,headers:{...cors,'Content-Type':'application/json','Retry-After':'60'}});
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
        const allocation = await registry.fetch('https://registry/allocate',{method:'POST',body:JSON.stringify({ipHash})});
        if(!allocation.ok) return new Response(allocation.body,{status:allocation.status,headers:{...cors,'Content-Type':'application/json','Retry-After':allocation.headers.get('Retry-After')||'60'}});
        const {code,room} = await allocation.json() as {code:string;room:string};
        const teacherToken = randomToken();
        const initialized=await env.ROOM.get(env.ROOM.idFromName(room)).fetch('https://room/init',{method:'POST',body:JSON.stringify({code,room,teacherHash:await hash(teacherToken),boardId})});
        if(!initialized.ok)throw Error('INIT_FAILED');
        response = json({code,teacherToken});
      } else {
        const match = url.pathname.match(/^\/api\/rooms\/([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6})(\/ws|\/reopen)?$/);
        if (!match) response = json({error:'NOT_FOUND'},404);
        else {
          const ipHash=await client();
          if(!(await env.ROOM_RATE_LIMITER.limit({key:`lookup:${ipHash}`})).success)return new Response(JSON.stringify({error:'RATE_LIMITED'}),{status:429,headers:{...cors,'Content-Type':'application/json','Retry-After':'60'}});
          const found = await registry.fetch('https://registry/lookup',{method:'POST',body:JSON.stringify({code:match[1],ipHash})});
          if(!found.ok)return new Response(found.body,{status:found.status,headers:{...cors,'Content-Type':'application/json','Retry-After':found.headers.get('Retry-After')||'60'}});
          const {room} = await found.json() as {room?:string};
          if(!room) response = !match[2]&&req.method==='GET'?json({open:false}):json({error:'NOT_FOUND'},404);
          else {
            const trusted=new Request(req);trusted.headers.set('X-Room-Client-IP-Hash',ipHash);
            response = await env.ROOM.get(env.ROOM.idFromName(room)).fetch(trusted);
          }
        }
      }
    } catch { response = json({error:'SERVER_ERROR'},500); }
    if(response.status === 101) return response;
    const headers = new Headers(response.headers); Object.entries(cors).forEach(([k,v])=>headers.set(k,v));
    return new Response(response.body,{status:response.status,headers});
  }
};

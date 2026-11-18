export * from '@shared/protocol';
export type Env = { ASSETS: Fetcher; REGISTRY: DurableObjectNamespace; ROOM: DurableObjectNamespace; ROOM_RATE_LIMITER: RateLimit; RETENTION_HOURS?:string; MAX_ROOMS_PER_HOUR?:string; ALLOWED_ORIGINS: string; SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string; LOCAL_TEACHER?: string; CLOUDFLARE_ACCOUNT_ID?: string };
export const json = (value: unknown, status = 200) => Response.json(value, { status });
export const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,'0')).join('');
export async function hash(token: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), n => n.toString(16).padStart(2,'0')).join(''); }
export async function matches(token: unknown, expected: string) { const actual = await hash(typeof token === 'string' ? token : ''); let diff = actual.length ^ expected.length; for (let i=0;i<64;i++) diff |= actual.charCodeAt(i) ^ (expected.charCodeAt(i) || 0); return diff === 0; }

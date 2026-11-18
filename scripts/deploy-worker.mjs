import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const cli='node_modules/wrangler/bin/wrangler.js';
const profile=['--profile','froebel-fatima'];
const activation=spawnSync(process.execPath,[cli,'auth','activate','froebel-fatima','.'],{encoding:'utf8',windowsHide:true});
if(activation.status!==0){console.error('No se pudo activar el perfil froebel-fatima. No se desplegó nada.');process.exit(1);}
const result=spawnSync(process.execPath,[cli,'whoami','--json'],{encoding:'utf8',windowsHide:true});
if(result.status!==0){console.error('Conecta el perfil de fatimamendo7@gmail.com antes de desplegar: npx wrangler auth create froebel-fatima');process.exit(1);}
let identity;try{identity=JSON.parse(result.stdout);}catch{console.error('No se pudo verificar la identidad de Cloudflare. No se desplegó nada.');process.exit(1);}
const email=identity.email||identity.user?.email;
if(email!=='fatimamendo7@gmail.com'){console.error(`Cuenta incorrecta (${email||'sin correo verificable'}). Solo se permite fatimamendo7@gmail.com. No se desplegó nada.`);process.exit(1);}
const config=JSON.parse(readFileSync('worker/wrangler.jsonc','utf8'));
if(!config.account_id){console.error('Falta account_id en worker/wrangler.jsonc. Usa un ID de cuenta de fatimamendo7@gmail.com mostrado por wrangler whoami.');process.exit(1);}
if(!(identity.accounts||[]).some(account=>account.id===config.account_id)){console.error('El account_id configurado no pertenece a la sesión verificada.');process.exit(1);}
if(config.vars?.LOCAL_TEACHER){console.error('LOCAL_TEACHER solo se permite en .dev.vars local.');process.exit(1);}
const deploy=spawnSync(process.execPath,[cli,'deploy','--config','worker/wrangler.jsonc',...profile],{stdio:'inherit',windowsHide:true});process.exit(deploy.status??1);

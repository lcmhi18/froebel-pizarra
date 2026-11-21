import {build} from 'vite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.cwd();
const result=await build({configFile:false,root,resolve:{alias:{'@shared':resolve(root,'src/shared')}},logLevel:'warn',build:{write:false,lib:{entry:resolve(root,'src/boards/fracciones/main.js'),name:'FroebelFractions',formats:['iife']},cssCodeSplit:false,rollupOptions:{output:{inlineDynamicImports:true}}}});
const output=(Array.isArray(result)?result[0]:result).output,js=output.find(x=>x.type==='chunk').code,css=output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>x.source).join('\n');
let bundle=js;
for(const name of ['pizza','donut','chocolate','chicken'])bundle=bundle.replaceAll(`/assets/fracciones/${name}.png`,'data:image/png;base64,'+readFileSync(resolve(root,'public/assets/fracciones',name+'.png')).toString('base64'));
// The runtime builds food URLs dynamically; replace that expression with offline assets.
const foods=Object.fromEntries(['pizza','donut','chocolate','chicken'].map(name=>[name,'data:image/png;base64,'+readFileSync(resolve(root,'public/assets/fracciones',name+'.png')).toString('base64')]));
// Vite minifies template-literal interpolation; replace the whole URL template.
bundle=bundle.replace(/`\/assets\/fracciones\/\$\{([^}]+)\}\.png`/g,(_,variable)=>`(${JSON.stringify(foods)})[${variable}]`);
let html=readFileSync(resolve(root,'src/boards/fracciones/index.html'),'utf8').replace(/<script type="module"[^>]*><\/script>/,'').replace('</head>',`<style>${css}</style></head>`).replace('</body>',`<script>${bundle.replaceAll('</script','<\\/script')}</script></body>`);
mkdirSync(resolve(root,'dist/downloads'),{recursive:true});writeFileSync(resolve(root,'dist/downloads/Pizarra_de_Fracciones.html'),html);
console.log('HTML autónomo de fracciones: '+Math.round(Buffer.byteLength(html)/1024)+' KB');

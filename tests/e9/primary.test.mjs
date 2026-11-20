import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {geometryDestination} from '../../.live-test/unit/course-navigation.js';
import {isGeometryImageUrl} from '../../.live-test/unit/boards/geometria/image-source.js';

// Exercise the real portal's click handlers offline, with an explicit fake auth
// provider. This does not bypass or change production authentication.
async function portal(signedIn=true){
 const elements=new Map();
 const make=(dataset={})=>({dataset,hidden:false,value:'',classList:{add(){},remove(){}},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(key,value){this[key]=value;},removeAttribute(key){delete this[key];},focus(){}});
 const element=selector=>{if(!elements.has(selector))elements.set(selector,make());return elements.get(selector);};
 const levels=[make({level:'primaria'}),make({level:'secundaria'})],subjects=[make({subject:'geometria'}),make({subject:'aritmetica'})],destinations=[];
 const auth={onAuthStateChange(){},getSession:async()=>({data:{session:signedIn?{user:{id:'offline-teacher'}}:null}})};
 const supabase={auth,from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{role:'teacher',status:'active'}})})})})};
 const context=vm.createContext({createClient:()=>supabase,geometryDestination,document:{querySelector:element,querySelectorAll:selector=>selector==='[data-level]'?levels:selector==='[data-subject]'?subjects:[],addEventListener(){}},location:{assign:url=>destinations.push(url)},setTimeout,homeHeader:'home',courseHeader:'course',primaryDesktop:'p',secondaryDesktop:'s',primaryTitle:'pt',secondaryTitle:'st',primaryGeometry:'pg',secondaryGeometry:'sg',primaryArithmetic:'pa',secondaryArithmetic:'sa'});
 const source=readFileSync('src/main.js','utf8').replace(/^import .*;\r?$/gm,'').replaceAll('import.meta.env.VITE_SUPABASE_URL','"https://offline.invalid"').replaceAll('import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY','"offline-public"');
 new vm.Script(source).runInContext(context);await new Promise(resolve=>setImmediate(resolve));
 return {elements,levels,subjects,destinations};
}
test('el recorrido real Primaria → Geometría abre la pizarra Konva completa',async()=>{const p=await portal();p.levels[0].listeners.click();p.subjects[0].listeners.click();assert.deepEqual(p.destinations,['/app-live/']);assert.equal(p.elements.get('.geometry-choice')['aria-label'],'Geometría · Primaria');});
test('Secundaria conserva su propia entrada de geometría',async()=>{const p=await portal();p.levels[1].listeners.click();p.subjects[0].listeners.click();assert.deepEqual(p.destinations,['/boards/geometria/']);assert.equal(p.elements.get('.geometry-choice')['aria-label'],'Geometría · Secundaria');});
test('el acceso de cursos sigue requiriendo una sesión autorizada',async()=>{const p=await portal(false);p.levels[0].listeners.click();p.subjects[0].listeners.click();assert.deepEqual(p.destinations,[]);});

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=';
test('las regiones PNG del balde y las cinco fórmulas locales son representables',()=>{assert(isGeometryImageUrl(png));for(let i=1;i<=5;i++)assert(isGeometryImageUrl(`/geometry-assets/formula-${i}.jpg`));});
test('no se admiten imágenes externas, SVG ejecutable ni rutas que escapen de assets',()=>{for(const value of ['https://example.com/a.png','data:image/svg+xml,<svg onload="alert(1)"/>','javascript:alert(1)','/geometry-assets/../secret','data:image/png;base64,bad','/geometry-assets/formula-6.jpg'])assert(!isGeometryImageUrl(value),value);});
test('un PNG con dimensiones desmesuradas se rechaza antes de decodificarlo',()=>{const bytes=Buffer.from(png.split(',')[1],'base64');bytes.writeUInt32BE(100000,16);assert(!isGeometryImageUrl('data:image/png;base64,'+bytes.toString('base64')));assert(!isGeometryImageUrl(png+'A'.repeat(8_000_000)));});

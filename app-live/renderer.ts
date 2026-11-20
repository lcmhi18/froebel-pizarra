import Konva from 'konva';
import {isGeometryImageUrl} from '../src/boards/geometria/image-source';

type Tile={node:Konva.Image;key:string;revision:number};
const NS='http://www.w3.org/2000/svg';
const formulaImages=new Map<string,Promise<string>>();
async function localImage(path:string){
 if(path.startsWith('data:')&&isGeometryImageUrl(path))return path;
 if(!/^\/geometry-assets\/formula-[1-5]\.jpg$/.test(path))throw new Error('Unsupported formula image');
 if(!formulaImages.has(path))formulaImages.set(path,fetch(path).then(async response=>{
  if(!response.ok)throw new Error('Formula image unavailable');
  const blob=await response.blob();return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});
 }));
 return formulaImages.get(path)!;
}

/** Konva owns the visible canvas and one independently cached image node per
 * mathematical object. SVG is an internal, sanitized geometry representation;
 * it also supplies the existing precise hit-testing/vertex/region controls.
 * This avoids replacing the proven mathematics with an approximate rewrite.
 * No rendered bitmap or Konva scene JSON is sent over the room protocol.
 */
export function mountKonva(svg:SVGSVGElement){
 const frame=svg.parentElement!,surface=document.createElement('div');surface.id='konva-surface';surface.setAttribute('aria-hidden','true');frame.prepend(surface);
 const summary=document.createElement('p');summary.id='konva-summary';summary.setAttribute('aria-live','polite');frame.append(summary);svg.setAttribute('aria-describedby',summary.id);
 const stage=new Konva.Stage({container:surface,width:1,height:1,listening:false});
 const paper=new Konva.Layer({listening:false}),content=new Konva.Layer({listening:false});stage.add(paper,content);
 const backdrop=new Konva.Rect({fill:'#fff'}),grid=new Konva.Shape({listening:false,sceneFunc(context){const box=svg.viewBox.baseVal;context.beginPath();for(let x=Math.floor(box.x/20)*20;x<box.x+box.width;x+=20){context.moveTo(x,box.y);context.lineTo(x,box.y+box.height);}for(let y=Math.floor(box.y/20)*20;y<box.y+box.height;y+=20){context.moveTo(box.x,y);context.lineTo(box.x+box.width,y);}context.setAttr('strokeStyle','rgba(154,168,196,.35)');context.setAttr('lineWidth',.6);context.stroke();}});paper.add(backdrop,grid);
 const tiles=new Map<string,Tile>();let disposed=false,queued=0,rendered=0,images=0,failures=0;
 const colors=()=>{const style=getComputedStyle(svg);return ['--cd','--tx','--pr','--mu','--bd'].map(key=>`${key}:${style.getPropertyValue(key)};`).join('')+`font-family:${style.fontFamily};`;};
 async function update(id:string,source:SVGGraphicsElement,key:string){
  let tile=tiles.get(id);if(tile?.key===key)return;
  if(!tile){tile={node:new Konva.Image({image:undefined,name:'geometry-object',id,listening:false}),key:'',revision:0};tiles.set(id,tile);content.add(tile.node);}
  tile.key=key;const revision=++tile.revision;images++;
  try{
   const box=source.getBBox(),padding=18;
   if(![box.x,box.y,box.width,box.height].every(Number.isFinite))throw new Error('Invalid bounds');
   const x=box.x-padding,y=box.y-padding,width=Math.max(1,box.width+padding*2),height=Math.max(1,box.height+padding*2);
   const clone=source.cloneNode(true) as SVGElement;
   // Embed the five local formulas. Bounded PNG paint regions are already inline.
   await Promise.all([...clone.querySelectorAll('image')].map(async image=>{const path=image.getAttribute('href');if(path)image.setAttribute('href',await localImage(path));}));
   if(disposed||tiles.get(id)!==tile||tile.revision!==revision)return;
   const root=document.createElementNS(NS,'svg');root.setAttribute('xmlns',NS);root.setAttribute('viewBox',`${x} ${y} ${width} ${height}`);
   const ratio=Math.min(2*devicePixelRatio,4096/Math.max(width,height));root.setAttribute('width',String(Math.ceil(width*ratio)));root.setAttribute('height',String(Math.ceil(height*ratio)));
   const style=document.createElementNS(NS,'style');style.textContent=`svg{${colors()}color:#082783}`;root.append(style,clone);
   const image=new Image();image.decoding='async';
   await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Geometry image unavailable'));image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(root));});
   if(disposed||tiles.get(id)!==tile||tile.revision!==revision)return;
   tile.node.setAttrs({image,x,y,width,height});content.batchDraw();rendered++;surface.dataset.rendered=String(rendered);
  }catch{if(!disposed&&tiles.get(id)===tile&&tile.revision===revision){tile.key='';failures++;surface.dataset.failures=String(failures);summary.textContent='Una figura no se pudo representar. Vuelve a seleccionarla para reintentar.';}}
  finally{images--;surface.dataset.pending=String(images);}
 }
 function sync(){
  queued=0;if(disposed)return;
  const rect=svg.getBoundingClientRect(),box=svg.viewBox.baseVal;if(!rect.width||!rect.height||!box.width)return;
  const width=svg.clientWidth,height=svg.clientHeight;stage.size({width,height});
  // ResizeObserver in the shared editor makes the viewBox match this ratio.
  const scale=width/box.width;for(const layer of [paper,content]){layer.scale({x:scale,y:scale});layer.position({x:-box.x*scale,y:-box.y*scale});}
  backdrop.setAttrs({x:box.x,y:box.y,width:box.width,height:box.height});paper.batchDraw();
  const sources=[...svg.querySelectorAll<SVGGraphicsElement>('#L > g[data-geometry-item]')];
  const overlay=document.createElementNS(NS,'g');
  // Shared protractor is outside the per-item groups; local pointer has its own group.
  for(const node of svg.querySelector('#L')!.children)if(!node.hasAttribute('data-geometry-item'))overlay.append(node.cloneNode(true));
  const pointer=svg.querySelector('#P')!;
  const seen=new Set<string>();
  for(const source of [...sources,overlay,pointer] as SVGGraphicsElement[]){
   const id=source===overlay?'@protractor':source===pointer?'@pointer':source.getAttribute('data-geometry-item')!;seen.add(id);
   if(source===overlay){svg.append(overlay);overlay.setAttribute('visibility','hidden');}
   const cloneKey=source.innerHTML+colors();
   // getBBox of the overlay needs a connected SVG node. Visibility is removed
   // from its serialized clone; the original transparent plane stays interactive.
   if(source===overlay)overlay.removeAttribute('visibility');
   void update(id,source,cloneKey);
   tiles.get(id)?.node.moveToTop();
   if(source===overlay)overlay.remove();
  }
  for(const [id,tile] of tiles)if(!seen.has(id)){tile.revision++;tile.node.destroy();tiles.delete(id);}
  surface.dataset.objects=String(sources.length);surface.dataset.nodes=String(tiles.size);surface.dataset.pending=String(images);surface.dataset.failures=String(failures);
  if(!failures)summary.textContent=`${sources.length} figura${sources.length===1?'':'s'} en la pizarra. Usa Mover para editar vértices; Deshacer revierte tus cambios.`;
  content.batchDraw();
 }
 const schedule=()=>{if(!disposed&&!queued)queued=requestAnimationFrame(sync);};
 const observer=new MutationObserver(schedule);observer.observe(svg.querySelector('#L')!,{childList:true,subtree:true,attributes:true,characterData:true});observer.observe(pointerNode(svg),{childList:true,subtree:true,attributes:true});observer.observe(svg,{attributes:true,attributeFilter:['viewBox']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 const resize=new ResizeObserver(schedule);resize.observe(svg);frame.classList.add('konva-mounted');schedule();
 return()=>{disposed=true;cancelAnimationFrame(queued);observer.disconnect();resize.disconnect();stage.destroy();surface.remove();summary.remove();frame.classList.remove('konva-mounted');};
}
function pointerNode(svg:SVGSVGElement){return svg.querySelector('#P')!;}

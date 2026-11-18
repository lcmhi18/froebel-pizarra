import { useRef, useState, useSyncExternalStore } from 'react';
import { Circle, PencilSimple, TextT, Cursor, Trash, Copy, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { TestBoardAdapter } from './adapter';
export function Board({adapter,author,undo}:{adapter:TestBoardAdapter;author:string;undo:()=>void}){
  const state=useSyncExternalStore(adapter.subscribe,adapter.getState);
  const [tool,setTool]=useState('move'),[color,setColor]=useState('#1674d1'),[selection,setSelection]=useState(''),[text,setText]=useState('Hola, clase');
  const drag=useRef<{id:string;dx:number;dy:number;path:boolean}|null>(null),svg=useRef<SVGSVGElement>(null);
  const point=(e:React.PointerEvent)=>{const p=svg.current!.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const result=p.matrixTransform(svg.current!.getScreenCTM()!.inverse());return {x:Math.max(0,Math.min(1000,result.x)),y:Math.max(0,Math.min(650,result.y))};};
  const start=(e:React.PointerEvent)=>{
    if(e.button!==0)return;const p=point(e),target=(e.target as Element).closest('[data-item]')?.getAttribute('data-item');
    e.currentTarget.setPointerCapture(e.pointerId);
    if(tool==='move'&&target){setSelection(target);const item=state.items[target];drag.current={id:target,dx:p.x-Number(item.x||0),dy:p.y-Number(item.y||0),path:false};return;}
    if(tool==='move'){setSelection('');return;}
    const id=`${author}:${crypto.randomUUID()}`;setSelection(id);
    adapter.change(s=>{s.items[id]=tool==='circle'?{type:'circle',x:p.x,y:p.y,r:40,color}:tool==='text'?{type:'text',x:p.x,y:p.y,text:text.slice(0,200),color}:{type:'path',x:0,y:0,points:[p],color};s.order.push(id);},tool!=='pencil');
    if(tool==='pencil')drag.current={id,dx:0,dy:0,path:true};
  };
  const move=(e:React.PointerEvent)=>{const d=drag.current;if(!d)return;const p=point(e);adapter.change(s=>{const item=s.items[d.id];if(!item)return;if(d.path){const points=item.points as {x:number;y:number}[];if(points.length<500)points.push(p);}else{item.x=p.x-d.dx;item.y=p.y-d.dy;}},false);};
  const finish=()=>{if(drag.current){adapter.change(()=>{},true);drag.current=null;}};
  return <section className="board-work" aria-label="Pizarra compartida de prueba">
    <div className="board-tools" role="toolbar" aria-label="Herramientas de la pizarra">
      {([['move','Mover',Cursor],['circle','Círculo',Circle],['pencil','Lápiz',PencilSimple],['text','Texto',TextT]] as const).map(([id,label,Icon])=><button key={id} aria-pressed={tool===id} onClick={()=>setTool(id)}><Icon size={20}/>{label}</button>)}
      <label className="color-control">Color<input aria-label="Color de dibujo" type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>
      <button onClick={undo}><ArrowCounterClockwise size={20}/>Deshacer lo mío</button>
      <button disabled={!selection||!state.items[selection]} onClick={()=>adapter.change(s=>{const item=s.items[selection];if(!item)return;const id=`${author}:${crypto.randomUUID()}`;s.items[id]={...structuredClone(item),x:Number(item.x||0)+25,y:Number(item.y||0)+25};s.order.push(id);})}><Copy size={20}/>Gemelo</button>
      <button disabled={!selection} onClick={()=>adapter.change(s=>{delete s.items[selection];s.order=s.order.filter(id=>id!==selection);})}><Trash size={20}/>Borrar</button>
      <button onClick={()=>adapter.change(s=>{s.items={};s.order=[];})}>Limpiar</button>
      {tool==='text'&&<label>Texto<input aria-label="Texto para la pizarra" value={text} maxLength={200} onChange={e=>setText(e.target.value)}/></label>}
      {state.items[selection]?.type==='circle'&&<label>Tamaño<input type="range" aria-label="Tamaño del círculo" min="10" max="160" value={Number(state.items[selection].r)} onChange={e=>{const r=Number(e.target.value);adapter.change(s=>{if(s.items[selection])s.items[selection].r=r;},false);}} onPointerUp={finishSize} onKeyUp={finishSize}/></label>}
    </div>
    <div className="canvas-wrap"><svg ref={svg} viewBox="0 0 1000 650" aria-label="Lienzo: elige una herramienta y dibuja" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
      {state.order.map(id=>{const item=state.items[id];if(!item)return null;const common={'data-item':id,transform:`translate(${Number(item.x)||0},${Number(item.y)||0})`,style:{cursor:tool==='move'?'grab':'crosshair'}};const fill=typeof item.color==='string'?item.color:'#1674d1';return item.type==='circle'?<circle key={id} {...common} r={Math.max(0,Number(item.r)||40)} fill={fill} stroke={selection===id?'#173b57':'none'} strokeWidth="3"/>:item.type==='text'?<text key={id} {...common} fill={fill} fontSize="30">{String(item.text||'')}</text>:item.type==='path'?<path key={id} {...common} d={(Array.isArray(item.points)?item.points:[]).filter(p=>p&&typeof p==='object').map((p,i)=>`${i?'L':'M'}${Number(p.x)||0},${Number(p.y)||0}`).join(' ')} stroke={fill} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>:null;})}
    </svg>{state.order.length===0&&<p className="canvas-hint">Un mismo lienzo para toda la clase.<br/>Elige Círculo, Lápiz o Texto para comenzar.</p>}</div>
  </section>;
  function finishSize(){adapter.change(()=>{},true);}
}

const clone=value=>structuredClone(value),clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function bounds(s){return {left:Math.min(s.x1,s.x2),top:Math.min(s.y1,s.y2),right:Math.max(s.x1,s.x2),bottom:Math.max(s.y1,s.y2)};}
export function handles(s){return s.kind==='line'?[[s.x1,s.y1],[s.x2,s.y2]]:[[s.x1,s.y1],[s.x2,s.y1],[s.x2,s.y2],[s.x1,s.y2]];}
export function hitShape(s,p,width){
 const b=bounds(s),tol=Math.max(8,s.w/2+4)/width;
 if(s.kind==='line'){const dx=s.x2-s.x1,dy=s.y2-s.y1,len=dx*dx+dy*dy,t=len?clamp(((p[0]-s.x1)*dx+(p[1]-s.y1)*dy)/len,0,1):0;return Math.hypot(p[0]-s.x1-t*dx,p[1]-s.y1-t*dy)<=tol;}
 return p[0]>=b.left-tol&&p[0]<=b.right+tol&&p[1]>=b.top-tol&&p[1]<=b.bottom+tol;
}
export function moveShape(s,dx,dy){dx=clamp(dx,-Math.min(s.x1,s.x2),1-Math.max(s.x1,s.x2));dy=clamp(dy,-Math.min(s.y1,s.y2),100-Math.max(s.y1,s.y2));return {...s,x1:s.x1+dx,x2:s.x2+dx,y1:s.y1+dy,y2:s.y2+dy};}
export function resizeShape(s,index,p){
 const [x,y]=[clamp(p[0],0,1),clamp(p[1],0,100)];
 if(s.kind==='line')return index===0?{...s,x1:x,y1:y}:{...s,x2:x,y2:y};
 const anchor=handles(s)[(index+2)%4];return {...s,x1:Math.min(x,anchor[0]),y1:Math.min(y,anchor[1]),x2:Math.max(x,anchor[0]),y2:Math.max(y,anchor[1])};
}
export function validDrawingItem(s){
 if(!s||typeof s!=='object'||Array.isArray(s)||!/^#[\da-f]{6}$/i.test(s.c)||!Number.isFinite(s.w)||s.w<1||s.w>80||![1,.4].includes(s.a))return false;
 if(s.t==='stroke')return Object.keys(s).every(k=>['t','c','w','a','p'].includes(k))&&Array.isArray(s.p)&&s.p.length>0&&s.p.length<=4000&&s.p.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100));
 return s.t==='shape'&&s.a===1&&['line','rect','ellipse'].includes(s.kind)&&Object.keys(s).every(k=>['t','kind','c','w','a','x1','y1','x2','y2'].includes(k))&&['x1','y1','x2','y2'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=(k[0]==='x'?1:100));
}
/** Drawing state is shared; handles, selection and active gestures remain local. */
export function createDrawing({canvas,adapter,newId,laser,colors,picker,widthInput,deleteButton,undoButton,clearButton,toolButtons,defaultExpression}){
 const ctx=canvas.getContext('2d');let tool='none',color='#082783',lineWidth=5,selected=null,gesture=null,history=[],lastExpression;
 const editable=()=>adapter.canEdit;
 const selectedItem=()=>adapter.getState().items[selected];
 function commit(change){if(!editable())return;const state=adapter.getState(),before={items:clone(state.items),order:[...state.order]};if(adapter.commit(change)){history.push(before);if(history.length>60)history.shift();}refresh();}
 function selectionControls(){const item=selectedItem();if(item?.t==='shape'){color=item.c;lineWidth=item.w;}picker.value=color;widthInput.value=lineWidth;colors.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===color)));deleteButton.disabled=!editable()||!selectedItem();}
 function paint(){
  const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;const ratio=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
  const state=adapter.getState(),entries=state.order.map(id=>[id,state.items[id]]).filter(([,s])=>s);
  if(gesture?.preview){if(gesture.id){const index=entries.findIndex(([id])=>id===gesture.id);if(index>=0)entries[index]=[gesture.id,gesture.preview];}else entries.push(['',gesture.preview]);}
  for(const [,s]of entries){ctx.strokeStyle=s.c;ctx.lineWidth=s.w;ctx.globalAlpha=s.a;ctx.beginPath();if(s.t==='stroke'){s.p.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*w):ctx.moveTo(x*w,y*w));if(s.p.length===1)ctx.lineTo(s.p[0][0]*w+.1,s.p[0][1]*w);}else if(s.kind==='line'){ctx.moveTo(s.x1*w,s.y1*w);ctx.lineTo(s.x2*w,s.y2*w);}else{const b=bounds(s);if(s.kind==='rect')ctx.rect(b.left*w,b.top*w,(b.right-b.left)*w,(b.bottom-b.top)*w);else ctx.ellipse((b.left+b.right)*w/2,(b.top+b.bottom)*w/2,(b.right-b.left)*w/2,(b.bottom-b.top)*w/2,0,0,2*Math.PI);}ctx.stroke();}
  ctx.globalAlpha=1;const s=gesture?.id===selected?gesture.preview:selectedItem();if(s?.t==='shape'&&editable()&&tool==='select'){const b=bounds(s);ctx.strokeStyle='#1263f5';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.strokeRect(b.left*w-5,b.top*w-5,(b.right-b.left)*w+10,(b.bottom-b.top)*w+10);ctx.setLineDash([]);for(const [x,y]of handles(s)){ctx.fillStyle='white';ctx.fillRect(x*w-6,y*w-6,12,12);ctx.strokeRect(x*w-6,y*w-6,12,12);}}
 }
 function refresh(){const state=adapter.getState(),expression=state.fields.lesson?.expression??defaultExpression;if(lastExpression!==expression){lastExpression=expression;history=[];selected=null;gesture=null;}if(selected&&!state.items[selected])selected=null;if(!editable()){gesture=null;laser.hidden=true;}canvas.style.pointerEvents=editable()&&tool!=='none'?'auto':'none';picker.disabled=widthInput.disabled=!editable();toolButtons.forEach(b=>b.disabled=!editable());undoButton.disabled=!editable()||!history.length;clearButton.disabled=!editable()||!state.order.length;selectionControls();paint();}
 function setTool(value){if(!editable())return;tool=value===tool?'none':value;gesture=null;laser.hidden=true;toolButtons.forEach(b=>{const on=b.dataset.tool===tool;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});canvas.style.cursor=tool==='cursor'?'none':tool==='select'?'default':'crosshair';if(tool!=='select')selected=null;refresh();}
 const point=e=>{const r=canvas.getBoundingClientRect();return [clamp((e.clientX-r.left)/r.width,0,1),clamp((e.clientY-r.top)/r.width,0,100)];};
 canvas.addEventListener('pointerdown',e=>{if(!editable()||e.button>0||tool==='none')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=point(e),w=canvas.getBoundingClientRect().width;if(tool==='cursor')return;
  if(tool==='select'){const old=selectedItem(),handle=old?.t==='shape'?handles(old).findIndex(q=>Math.hypot(q[0]-p[0],q[1]-p[1])*w<=12):-1;let id=selected;if(handle<0){id=[...adapter.getState().order].reverse().find(id=>{const s=adapter.getState().items[id];return s.t==='shape'&&hitShape(s,p,w);});}selected=id||null;const s=selectedItem();if(s)gesture={pointerId:e.pointerId,id:selected,original:clone(s),start:p,handle,preview:clone(s)};selectionControls();paint();return;}
  const preview=['line','rect','ellipse'].includes(tool)?{t:'shape',kind:tool,c:color,w:lineWidth,a:1,x1:p[0],y1:p[1],x2:p[0],y2:p[1]}:{t:'stroke',c:color,w:tool==='highlighter'?24:lineWidth,a:tool==='highlighter'?.4:1,p:[p]};gesture={pointerId:e.pointerId,start:p,preview};paint();
 });
 canvas.addEventListener('pointermove',e=>{if(!editable())return;if(tool==='cursor'){const r=canvas.getBoundingClientRect();laser.hidden=false;laser.style.left=e.clientX-r.left+'px';laser.style.top=e.clientY-r.top+'px';}if(!gesture||gesture.pointerId!==e.pointerId)return;const p=point(e);if(gesture.id)gesture.preview=gesture.handle>=0?resizeShape(gesture.original,gesture.handle,p):moveShape(gesture.original,p[0]-gesture.start[0],p[1]-gesture.start[1]);else if(gesture.preview.t==='shape'){gesture.preview.x2=p[0];gesture.preview.y2=p[1];}else{const samples=e.getCoalescedEvents?.();for(const sample of samples?.length?samples:[e])if(gesture.preview.p.length<4000)gesture.preview.p.push(point(sample));}paint();});
 canvas.addEventListener('pointerup',e=>{if(!gesture||gesture.pointerId!==e.pointerId)return;const g=gesture;gesture=null;if(!editable()){paint();return;}const s=g.preview;if(!g.id&&s.t==='shape'){const w=canvas.getBoundingClientRect().width;if(Math.hypot(s.x2-s.x1,s.y2-s.y1)*w<4){s.x2=clamp(s.x1+120/w,0,1);s.y2=s.y1+(s.kind==='line'?0:80/w);}if(s.kind!=='line'){const b=bounds(s);Object.assign(s,{x1:b.left,y1:b.top,x2:b.right,y2:b.bottom});}}
  const id=g.id||newId();if(!g.id||JSON.stringify(s)!==JSON.stringify(g.original))commit(state=>{state.items[id]=s;if(!state.order.includes(id))state.order.push(id);});if(s.t==='shape'){selected=id;tool='select';toolButtons.forEach(b=>{b.classList.toggle('active',b.dataset.tool==='select');b.setAttribute('aria-pressed',String(b.dataset.tool==='select'));});}refresh();});
 canvas.addEventListener('pointercancel',()=>{gesture=null;paint();});canvas.addEventListener('pointerleave',()=>{laser.hidden=true;});window.addEventListener('blur',()=>{gesture=null;laser.hidden=true;paint();});
 toolButtons.forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
 function setColor(value){if(!editable()||!/^#[\da-f]{6}$/i.test(value))return;color=value;const item=selectedItem();if(item?.t==='shape')commit(state=>{state.items[selected]={...state.items[selected],c:color};});selectionControls();}
 colors.querySelectorAll('button').forEach(b=>b.onclick=()=>setColor(b.dataset.color));picker.addEventListener('input',()=>setColor(picker.value));
 function updateWidth(){if(!editable())return;const nextWidth=clamp(Number(widthInput.value)||1,1,80);lineWidth=nextWidth;const item=selectedItem();if(item?.t==='shape'&&item.w!==nextWidth)commit(state=>{state.items[selected]={...state.items[selected],w:nextWidth};});selectionControls();}
 widthInput.addEventListener('input',updateWidth);widthInput.addEventListener('change',updateWidth);
 deleteButton.onclick=()=>{if(!selectedItem())return;const id=selected;commit(state=>{delete state.items[id];state.order=state.order.filter(key=>key!==id);});selected=null;refresh();};
 undoButton.onclick=()=>{if(!editable()||!history.length)return;const previous=history.pop();adapter.commit(state=>{state.items=previous.items;state.order=previous.order;});selected=null;refresh();};
 clearButton.onclick=()=>{gesture=null;commit(state=>{state.items={};state.order=[];});selected=null;refresh();};
 document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,button,a,[contenteditable=true]'))return;if((e.key==='Delete'||e.key==='Backspace')&&selectedItem()&&editable()){e.preventDefault();deleteButton.click();}});
 new ResizeObserver(paint).observe(canvas.parentElement);adapter.subscribe(refresh);refresh();return {paint,refresh};
}

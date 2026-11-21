import {shapeBounds,shapeHandles,hitGraphShape,moveGraphShape,resizeGraphShape,validGraphShape} from './shapes.js';
export function createGraphDrawing({canvas,laser,cursorButton,penButton,highlighterButton,colors,widthInput,preview,undoButton,clearButton,shapeButtons,borderInput,fillInput,opacityInput,opacityOutput,shapeWidth,shapeHeight,deleteButton}){
 const ctx=canvas.getContext('2d');let items=[],gesture=null,tool='none',selection=-1,history=[];
 const ink={pen:'#ffd84d',highlighter:'#ffd84d'},width={pen:5,highlighter:24};
 const active=()=>tool==='highlighter'?'highlighter':'pen',selected=()=>items[selection]?.t==='shape'?items[selection]:null;
 const checkpoint=()=>{history.push(structuredClone(items));if(history.length>60)history.shift();};
 const point=e=>{const r=canvas.getBoundingClientRect();return[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
 function paint(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.lineCap='round';ctx.lineJoin='round';
  for(const item of items){ctx.strokeStyle=ctx.fillStyle=item.c;ctx.lineWidth=item.w;ctx.globalAlpha=item.a;ctx.beginPath();
   if(item.t==='shape'){const b=shapeBounds(item),x=b.left*canvas.width,y=b.top*canvas.height,w=(b.right-b.left)*canvas.width,h=(b.bottom-b.top)*canvas.height;if(item.kind==='rect')ctx.rect(x,y,w,h);else ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,2*Math.PI);if(item.opacity>0){ctx.globalAlpha=item.opacity;ctx.fillStyle=item.fill;ctx.fill();}ctx.globalAlpha=1;ctx.stroke();}
   else{const points=item.p.map(([x,y])=>[x*canvas.width,y*canvas.height]);if(points.length===1){ctx.arc(...points[0],item.w/2,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();}}
  }ctx.globalAlpha=1;
  const s=selected();if(s&&tool==='select'){const b=shapeBounds(s);ctx.strokeStyle='#1263f5';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.strokeRect(b.left*canvas.width,b.top*canvas.height,(b.right-b.left)*canvas.width,(b.bottom-b.top)*canvas.height);ctx.setLineDash([]);for(const [x,y]of shapeHandles(s)){ctx.fillStyle='white';ctx.fillRect(x*canvas.width-5,y*canvas.height-5,10,10);ctx.strokeRect(x*canvas.width-5,y*canvas.height-5,10,10);}}
 }
 function controls(){const s=selected();if(s){borderInput.value=s.c;fillInput.value=s.fill;opacityInput.value=Math.round(s.opacity*100);if(document.activeElement!==shapeWidth)shapeWidth.value=Math.round((s.x2-s.x1)*canvas.width);if(document.activeElement!==shapeHeight)shapeHeight.value=Math.round((s.y2-s.y1)*canvas.height);}opacityOutput.textContent=opacityInput.value+'%'+(Number(opacityInput.value)===0?' · transparente':'');deleteButton.disabled=!s;}
 function refresh(){
  const k=active();for(const [button,value]of[[cursorButton,'cursor'],[penButton,'pen'],[highlighterButton,'highlighter'],...shapeButtons.map(b=>[b,b.dataset.graphShape])]){button.classList.toggle('act',tool===value);button.setAttribute('aria-pressed',String(tool===value));}
  for(const button of colors){const on=button.dataset.c===ink[k];button.classList.toggle('sel',on);button.setAttribute('aria-pressed',String(on));}
  widthInput.min=k==='highlighter'?8:1;widthInput.max=k==='highlighter'?70:24;widthInput.value=selected()?.w||width[k];preview.style.width=preview.style.height=Math.min(Number(widthInput.value),40)+'px';preview.style.background=ink[k];preview.style.opacity=k==='highlighter'?'.6':'1';
  canvas.style.pointerEvents=tool==='none'?'none':'auto';canvas.style.cursor=tool==='cursor'?'none':tool==='select'?'default':'crosshair';laser.hidden=true;controls();paint();
 }
 function choose(next){gesture=null;tool=tool===next?'none':next;if(tool!=='select')selection=-1;refresh();}
 cursorButton.onclick=()=>choose('cursor');penButton.onclick=()=>choose('pen');highlighterButton.onclick=()=>choose('highlighter');shapeButtons.forEach(b=>b.onclick=()=>choose(b.dataset.graphShape));
 colors.forEach(button=>button.onclick=()=>{if(selected()){checkpoint();selected().c=button.dataset.c;}else{if(tool==='none'||tool==='cursor')tool='pen';ink[active()]=button.dataset.c;}refresh();});
 widthInput.oninput=()=>{if(selected()){checkpoint();selected().w=Number(widthInput.value);}else width[active()]=Number(widthInput.value);refresh();};
 for(const input of [borderInput,fillInput,opacityInput])input.addEventListener('input',()=>{const s=selected();if(s){checkpoint();s.c=borderInput.value;s.fill=fillInput.value;s.opacity=Number(opacityInput.value)/100;}controls();paint();});
 for(const input of [shapeWidth,shapeHeight])input.addEventListener('input',()=>{const s=selected();if(!s||!input.value||Number(input.value)<=0)return;checkpoint();const w=Math.max(4,Math.min(canvas.width,Number(shapeWidth.value)||4))/canvas.width,h=Math.max(4,Math.min(canvas.height,Number(shapeHeight.value)||4))/canvas.height;s.x1=Math.min(s.x1,1-w);s.y1=Math.min(s.y1,1-h);s.x2=s.x1+w;s.y2=s.y1+h;refresh();});
 deleteButton.onclick=()=>{if(!selected())return;checkpoint();items.splice(selection,1);selection=-1;refresh();};
 undoButton.onclick=()=>{gesture=null;if(history.length)items=history.pop();selection=-1;refresh();};clearButton.onclick=()=>{gesture=null;checkpoint();items=[];selection=-1;refresh();};
 canvas.style.touchAction='none';canvas.addEventListener('pointerdown',e=>{
  if(tool==='none'||tool==='cursor'||e.button>0)return;e.preventDefault();const p=point(e);canvas.setPointerCapture(e.pointerId);
  if(tool==='select'){const old=selected();let handle=old?shapeHandles(old).findIndex(([x,y])=>Math.hypot((x-p[0])*canvas.width,(y-p[1])*canvas.height)<=12):-1;if(handle<0)selection=items.findLastIndex(s=>s.t==='shape'&&hitGraphShape(s,p,canvas.width,canvas.height));if(selected()){checkpoint();gesture={pointer:e.pointerId,type:'edit',start:p,original:structuredClone(selected()),handle};}refresh();return;}
  checkpoint();if(['square','rect','circle'].includes(tool)){const item={t:'shape',kind:tool==='circle'?'ellipse':'rect',c:borderInput.value,w:width.pen,a:1,fill:fillInput.value,opacity:Number(opacityInput.value)/100,x1:p[0],y1:p[1],x2:p[0],y2:p[1]};items.push(item);selection=items.length-1;gesture={pointer:e.pointerId,type:'shape',start:p,constrain:tool!=='rect'};}
  else{const k=active();items.push({c:ink[k],w:width[k],a:k==='highlighter'?.4:1,p:[p]});gesture={pointer:e.pointerId,type:'stroke'};}paint();
 });
 function update(e){const p=point(e);if(gesture.type==='stroke'){const events=e.getCoalescedEvents?.()||[];for(const ev of events.length?events:[e])items.at(-1).p.push(point(ev));}
  else if(gesture.type==='edit')items[selection]=gesture.handle>=0?resizeGraphShape(gesture.original,gesture.handle,p):moveGraphShape(gesture.original,p[0]-gesture.start[0],p[1]-gesture.start[1]);
  else{let [x,y]=p;const [sx,sy]=gesture.start;if(gesture.constrain){const size=Math.min(Math.abs(x-sx)*canvas.width,Math.abs(y-sy)*canvas.height);x=sx+Math.sign(x-sx)*size/canvas.width;y=sy+Math.sign(y-sy)*size/canvas.height;}Object.assign(items[selection],{x1:Math.min(gesture.start[0],x),x2:Math.max(gesture.start[0],x),y1:Math.min(gesture.start[1],y),y2:Math.max(gesture.start[1],y)});}paint();}
 canvas.addEventListener('pointermove',e=>{if(tool==='cursor'){const r=canvas.getBoundingClientRect();laser.hidden=false;laser.style.left=e.clientX-r.left+'px';laser.style.top=e.clientY-r.top+'px';}if(gesture?.pointer===e.pointerId)update(e);});
 canvas.addEventListener('pointerup',e=>{if(gesture?.pointer!==e.pointerId)return;update(e);if(gesture.type==='shape'&&!validGraphShape(selected())){const s=selected(),w=Math.min(canvas.width,Math.max(4,Number(shapeWidth.value)||120)),h=gesture.constrain?w:Math.min(canvas.height,Math.max(4,Number(shapeHeight.value)||120)),size=Math.min(w,h,canvas.height),dx=(gesture.constrain?size:w)/canvas.width,dy=(gesture.constrain?size:h)/canvas.height;s.x1=Math.min(gesture.start[0],1-dx);s.y1=Math.min(gesture.start[1],1-dy);s.x2=s.x1+dx;s.y2=s.y1+dy;}if(gesture.type==='shape'||gesture.type==='edit'){if(!validGraphShape(selected())){items=history.pop()||[];selection=-1;}tool='select';}gesture=null;refresh();});
 canvas.addEventListener('pointercancel',()=>{if(gesture)items=history.pop()||[];gesture=null;selection=-1;refresh();});canvas.addEventListener('pointerleave',()=>{laser.hidden=true;});
 new ResizeObserver(()=>{const r=canvas.parentElement;canvas.width=r.clientWidth;canvas.height=r.clientHeight;paint();controls();}).observe(canvas.parentElement);
 refresh();return {get:()=>structuredClone(items).map(item=>item.t==='shape'?item:{...item,p:item.p.map(p=>p.map(n=>Math.round(n*1000)/1000))}),set:value=>{gesture=null;selection=-1;history=[];items=structuredClone(value);refresh();}};
}

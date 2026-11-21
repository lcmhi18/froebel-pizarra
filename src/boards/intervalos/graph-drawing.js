export function createGraphDrawing({canvas,laser,cursorButton,penButton,highlighterButton,colors,widthInput,preview,undoButton,clearButton}){
 const ctx=canvas.getContext('2d');let strokes=[],current=null,tool='none';
 const ink={pen:'#ffd84d',highlighter:'#ffd84d'},width={pen:5,highlighter:24};
 const active=()=>tool==='highlighter'?'highlighter':'pen';
 function paint(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.lineCap='round';ctx.lineJoin='round';
  for(const stroke of strokes){const points=stroke.p.map(([x,y])=>[x*canvas.width,y*canvas.height]);ctx.strokeStyle=ctx.fillStyle=stroke.c;ctx.lineWidth=stroke.w;ctx.globalAlpha=stroke.a;
   ctx.beginPath();if(points.length===1){ctx.arc(...points[0],stroke.w/2,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();}
  }ctx.globalAlpha=1;
 }
 function refresh(){
  const k=active();for(const [button,value]of[[cursorButton,'cursor'],[penButton,'pen'],[highlighterButton,'highlighter']]){button.classList.toggle('act',tool===value);button.setAttribute('aria-pressed',String(tool===value));}
  for(const button of colors){const selected=button.dataset.c===ink[k];button.classList.toggle('sel',selected);button.setAttribute('aria-pressed',String(selected));}
  widthInput.min=k==='highlighter'?8:1;widthInput.max=k==='highlighter'?70:24;widthInput.value=width[k];preview.style.width=preview.style.height=Math.min(width[k],40)+'px';preview.style.background=ink[k];preview.style.opacity=k==='highlighter'?'.6':'1';
  canvas.style.pointerEvents=tool==='none'?'none':'auto';canvas.style.cursor=tool==='cursor'?'none':'crosshair';laser.hidden=true;
 }
 function choose(next){current=null;tool=tool===next?'none':next;refresh();}
 cursorButton.onclick=()=>choose('cursor');penButton.onclick=()=>choose('pen');highlighterButton.onclick=()=>choose('highlighter');
 colors.forEach(button=>button.onclick=()=>{if(tool==='none'||tool==='cursor')tool='pen';ink[active()]=button.dataset.c;refresh();});
 widthInput.oninput=()=>{width[active()]=Number(widthInput.value);refresh();};
 undoButton.onclick=()=>{current=null;strokes.pop();paint();};clearButton.onclick=()=>{current=null;strokes=[];paint();};
 const point=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
 canvas.style.touchAction='none';canvas.addEventListener('pointerdown',e=>{if(!['pen','highlighter'].includes(tool)||e.button>0)return;e.preventDefault();const k=active();current={c:ink[k],w:width[k],a:k==='highlighter'?.4:1,p:[point(e)],pointer:e.pointerId};strokes.push(current);canvas.setPointerCapture(e.pointerId);paint();});
 canvas.addEventListener('pointermove',e=>{if(tool==='cursor'){const r=canvas.getBoundingClientRect();laser.hidden=false;laser.style.left=e.clientX-r.left+'px';laser.style.top=e.clientY-r.top+'px';}if(current?.pointer===e.pointerId){const events=e.getCoalescedEvents?.()||[];for(const ev of events.length?events:[e])current.p.push(point(ev));paint();}});
 for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,e=>{if(current?.pointer===e.pointerId){if(name==='pointerup')current.p.push(point(e));current=null;paint();}});
 canvas.addEventListener('pointerleave',()=>{laser.hidden=true;});
 new ResizeObserver(()=>{const r=canvas.parentElement;canvas.width=r.clientWidth;canvas.height=r.clientHeight;paint();}).observe(canvas.parentElement);
 refresh();return {get:()=>strokes.map(({c,w,a,p})=>({c,w,a,p:structuredClone(p)})),set:value=>{current=null;strokes=structuredClone(value);paint();}};
}

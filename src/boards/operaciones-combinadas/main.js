import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/patrick-hand/latin-400.css';
import './style.css';
import './geometry-theme.css';
import {CONFIG} from './config.js';
import {buildSteps,tokenText,priority} from './engine.js';
import {CombinedAdapter} from './adapter';
import {attachLive} from '../../live/attach';
import homeIcon from '@phosphor-icons/core/assets/regular/house.svg';
import playIcon from '@phosphor-icons/core/assets/regular/play.svg';
import cursorIcon from '@phosphor-icons/core/assets/regular/cursor.svg';
import pencilIcon from '@phosphor-icons/core/assets/regular/pencil.svg';
import highlighterIcon from '@phosphor-icons/core/assets/regular/highlighter.svg';
import undoIcon from '@phosphor-icons/core/assets/regular/arrow-counter-clockwise.svg';
import eraserIcon from '@phosphor-icons/core/assets/regular/eraser.svg';
import leftIcon from '@phosphor-icons/core/assets/regular/arrow-left.svg';
import rightIcon from '@phosphor-icons/core/assets/regular/arrow-right.svg';
import sunIcon from '@phosphor-icons/core/assets/regular/sun.svg';
import caretIcon from '@phosphor-icons/core/assets/regular/caret-up.svg';
import closeIcon from '@phosphor-icons/core/assets/regular/x.svg';
const $=id=>document.getElementById(id),element=(tag,text,css)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(css)el.className=css;return el;};
const icons={house:homeIcon,play:playIcon,cursor:cursorIcon,pencil:pencilIcon,highlighter:highlighterIcon,'arrow-counter-clockwise':undoIcon,eraser:eraserIcon,'arrow-left':leftIcon,'arrow-right':rightIcon,sun:sunIcon,'caret-up':caretIcon,x:closeIcon};
document.querySelectorAll('[data-icon]').forEach(el=>{const img=element('img');img.src=icons[el.dataset.icon];img.alt='';el.append(img);});
for(const [name,color] of Object.entries(CONFIG.colors))document.documentElement.style.setProperty('--'+name,color);
const query=new URLSearchParams(location.search),role=query.get('room')&&query.get('role')!=='teacher'?'student':'teacher';
const adapter=new CombinedAdapter(role);let live,compiled=null,expression='',step=0,lessonKey='',tool='none',color='#fff02b',current=null;
const canvas=$('ink'),context=canvas.getContext('2d'),editable=()=>adapter.canEdit;
const lesson=()=>adapter.getState().fields.lesson||{expression:CONFIG.examples[0],step:0};
function error(message){$('error').hidden=!message;$('error').textContent=message;}
function solve(value){if(!editable())return;try{buildSteps(value);error('');adapter.commit(state=>{state.fields.lesson={expression:value,step:0};state.items={};state.order=[];});}catch(cause){error(cause.message);}}
function navigate(value){if(!editable()||!compiled)return;const next=Math.max(0,Math.min(compiled.steps.length-1,value));adapter.commit(state=>{state.fields.lesson={expression,step:next};});}
function renderExpression(tokens,focus=[],highlight=[]){
 const span=element('span',undefined,'expression');
 tokens.forEach((token,i)=>{const tokenNode=element('span',tokenText(token,tokens[i-1]));
  if(token.k)tokenNode.className={'(':'parenthesis','[':'bracket','{':'brace'}[token.k];
  if(highlight.includes(i))tokenNode.classList.add('result');
  if(focus.some(([a,b])=>i>=a&&i<=b))tokenNode.classList.add('focus');
  span.append(tokenNode);
 });return span;
}
function drawLesson(){
 const fragment=document.createDocumentFragment();
 compiled.steps.slice(0,step+1).forEach((entry,i)=>{const row=element('div',undefined,'procedure-line');row.append(element('span',i===0?'Ejercicio:':'Paso '+i+':','tag'),renderExpression(entry.tokens,i===step-1?entry.focus:[],i===step?entry.highlight:[]));fragment.append(row);});
 const finished=step===compiled.steps.length-1;
 if(finished){const row=element('div',undefined,'procedure-line answer');row.append(element('span','Rpta:','tag'),element('span',String(compiled.result),'answer-number'));fragment.append(row);}
 $('board').replaceChildren(fragment);
 $('say').textContent=finished?`${CONFIG.text.finished} ${compiled.result}.`:compiled.steps[step].message;
 $('count').textContent=`Paso ${step} de ${compiled.steps.length-1}`;
 $('previous').disabled=!editable()||step===0;$('next').disabled=!editable()||finished;$('reset').disabled=!editable()||step===0;
}
function updateRules(){const info=priority(compiled.steps[0].tokens);info.active.sign ||= compiled.steps.some(entry=>entry.tokens.some(token=>(token.t==='n'&&token.v<0n)||token.t==='neg'));$('start').textContent=info.message;const fragment=document.createDocumentFragment();
 CONFIG.rules.forEach((rule,i)=>{const item=element('div',undefined,'rule rule-'+i+(info.active[rule.key]?' active':'')),number=element('span',i===5?'±':String(i+1),'rule-number'),content=element('div'),heading=element('h2',rule.title),symbol=element('span',rule.symbol,'rule-symbol');heading.append(symbol);content.append(heading,element('p','CUÁNDO: '+rule.when),element('p','Ejemplo: '+rule.example,'example'));item.append(number,content,element('span',info.active[rule.key]?'✓ Aparece en tu ejercicio':'No hace falta aquí','rule-status'));fragment.append(item);});$('rules').replaceChildren(fragment);
}
function paint(){const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;const ratio=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,w,h);context.lineCap='round';context.lineJoin='round';
 const state=adapter.getState(),strokes=state.order.map(id=>state.items[id]).filter(Boolean);if(current)strokes.push(current);
 for(const stroke of strokes){context.strokeStyle=stroke.c;context.lineWidth=stroke.w;context.globalAlpha=stroke.a;context.beginPath();stroke.p.forEach(([x,y],i)=>i?context.lineTo(x*w,y*w):context.moveTo(x*w,y*w));if(stroke.p.length===1)context.lineTo(stroke.p[0][0]*w+.1,stroke.p[0][1]*w);context.stroke();}context.globalAlpha=1;
}
function sync(){const next=lesson(),newExpression=next.expression!==expression;try{if(newExpression||!compiled){compiled=buildSteps(next.expression);expression=next.expression;$('exercise').value=expression;updateRules();}step=Math.max(0,Math.min(compiled.steps.length-1,next.step));}catch{error('No se pudo cargar este ejercicio.');return;}
 const key=expression+'|'+step;if(key!==lessonKey){lessonKey=key;current=null;drawLesson();}
 if(!editable()){current=null;$('laser').hidden=true;}canvas.style.pointerEvents=editable()&&tool!=='none'?'auto':'none';$('exercise').readOnly=!editable();$('solve').disabled=!editable();document.querySelectorAll('[data-tool],#undo,#clear,#examples button').forEach(button=>button.disabled=!editable());
 $('previous').disabled=!editable()||step===0;$('next').disabled=!editable()||step===compiled.steps.length-1;$('reset').disabled=!editable()||step===0;paint();
}
function setTool(value){if(!editable())return;tool=value===tool?'none':value;current=null;$('laser').hidden=true;document.querySelectorAll('[data-tool]').forEach(button=>{const on=button.dataset.tool===tool;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});canvas.style.pointerEvents=tool==='none'?'none':'auto';canvas.style.cursor=tool==='cursor'?'none':'crosshair';paint();}
const point=event=>{const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),Math.max(0,(event.clientY-rect.top)/rect.width)];};
canvas.addEventListener('pointerdown',event=>{if(!editable()||event.button>0)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);if(tool==='cursor')return;if(!['pen','highlighter'].includes(tool))return;const preset=CONFIG.drawing[tool];current={t:'stroke',c:color,w:preset.width,a:preset.opacity,p:[point(event)],pointerId:event.pointerId};paint();});
canvas.addEventListener('pointermove',event=>{if(!editable())return;if(tool==='cursor'){const rect=canvas.getBoundingClientRect();$('laser').hidden=false;$('laser').style.left=event.clientX-rect.left+'px';$('laser').style.top=event.clientY-rect.top+'px';}if(current&&event.pointerId===current.pointerId){const samples=event.getCoalescedEvents?.();for(const sample of samples?.length?samples:[event]){if(current.p.length<4000)current.p.push(point(sample));}paint();}});
function endStroke(event){if(!current||current.pointerId!==event.pointerId)return;const {pointerId,...stroke}=current;current=null;if(editable()){const id=live.engine.newId();adapter.commit(state=>{state.items[id]=stroke;state.order.push(id);});}paint();}
canvas.addEventListener('pointerup',endStroke);canvas.addEventListener('pointercancel',endStroke);canvas.addEventListener('pointerleave',()=>{$('laser').hidden=true;});
document.querySelectorAll('[data-tool]').forEach(button=>button.onclick=()=>setTool(button.dataset.tool));
for(const [name,value]of[['Amarillo','#fff02b'],['Rosado','#ff8fb8'],['Celeste','#7fd4ff'],['Blanco','#ffffff']]){const button=element('button');button.style.background=value;button.setAttribute('aria-label',name);button.setAttribute('aria-pressed',String(value===color));button.onclick=()=>{color=value;document.querySelectorAll('#colors button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};$('colors').append(button);}
$('undo').onclick=()=>{if(editable())adapter.commit(state=>{const id=state.order.pop();if(id)delete state.items[id];});};$('clear').onclick=()=>{current=null;if(editable())adapter.commit(state=>{state.items={};state.order=[];});};
CONFIG.examples.forEach(example=>{const button=element('button',example);button.type='button';button.onclick=()=>solve(example);$('examples').append(button);});
$('exercise-form').onsubmit=event=>{event.preventDefault();solve($('exercise').value);};$('previous').onclick=()=>navigate(step-1);$('next').onclick=()=>navigate(step+1);$('reset').onclick=()=>navigate(0);
document.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,button,a,[contenteditable=true]')||event.ctrlKey||event.altKey||event.metaKey)return;if(event.key==='ArrowRight'||event.key===' '){event.preventDefault();navigate(step+1);}if(event.key==='ArrowLeft'){event.preventDefault();navigate(step-1);}});
$('theme').onclick=()=>{const root=document.documentElement;root.dataset.theme=(root.dataset.theme|| (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))==='dark'?'light':'dark';};
let orderCollapsed=false;
function setOrderCollapsed(collapsed){orderCollapsed=collapsed;$('order-content').hidden=collapsed;$('lesson-layout').classList.toggle('order-collapsed',collapsed);$('collapse-order').setAttribute('aria-expanded',String(!collapsed));$('collapse-order').setAttribute('aria-label',collapsed?'Mostrar explicación':'Reducir explicación');}
$('collapse-order').onclick=()=>setOrderCollapsed(!orderCollapsed);
$('close-order').onclick=()=>{$('order-panel').hidden=true;$('lesson-layout').classList.add('order-hidden');$('show-order').hidden=false;$('show-order').setAttribute('aria-expanded','false');$('show-order').focus();};
$('show-order').onclick=()=>{$('order-panel').hidden=false;$('lesson-layout').classList.remove('order-hidden');$('show-order').hidden=true;$('show-order').setAttribute('aria-expanded','true');setOrderCollapsed(false);$('collapse-order').focus();};
new ResizeObserver(paint).observe($('board-wrap'));
adapter.subscribe(sync);live=attachLive(adapter,{boardId:'operaciones-combinadas',workspace:$('workspace'),slot:$('live-slot')});
live.subscribe(view=>{$('status').hidden=view.status==='active'&&!view.error;$('status').textContent=view.error||(view.status==='paused'?'El profesor se desconectó. La pizarra está en pausa.':view.status==='waiting'?'Esperando la aceptación del profesor…':'Conectando a la sala…');});
if(live.mode==='solo'){const button=element('button','Clase');button.onclick=()=>location.assign('/profesor/?board=operaciones-combinadas');$('live-slot').append(button);}
sync();

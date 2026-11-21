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
import {createDrawing} from './drawing.js';
import lineIcon from '@phosphor-icons/core/assets/regular/line-segment.svg';
import rectangleIcon from '@phosphor-icons/core/assets/regular/rectangle.svg';
import circleIcon from '@phosphor-icons/core/assets/regular/circle.svg';
import moveIcon from '@phosphor-icons/core/assets/regular/arrows-out-cardinal.svg';
import caretIcon from '@phosphor-icons/core/assets/regular/caret-up.svg';
import closeIcon from '@phosphor-icons/core/assets/regular/x.svg';
const $=id=>document.getElementById(id),element=(tag,text,css)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(css)el.className=css;return el;};
const icons={house:homeIcon,play:playIcon,cursor:cursorIcon,pencil:pencilIcon,highlighter:highlighterIcon,'arrow-counter-clockwise':undoIcon,eraser:eraserIcon,'arrow-left':leftIcon,'arrow-right':rightIcon,line:lineIcon,rectangle:rectangleIcon,circle:circleIcon,move:moveIcon,'caret-up':caretIcon,x:closeIcon};
document.querySelectorAll('[data-icon]').forEach(el=>{const img=element('img');img.src=icons[el.dataset.icon];img.alt='';el.append(img);});
for(const [name,color] of Object.entries(CONFIG.colors))document.documentElement.style.setProperty('--'+name,color);
const query=new URLSearchParams(location.search),role=query.get('room')&&query.get('role')!=='teacher'?'student':'teacher';
document.documentElement.dataset.theme='light';
const adapter=new CombinedAdapter(role);let live,drawing,compiled=null,expression='',step=0,lessonKey='';
const canvas=$('ink'),editable=()=>adapter.canEdit;
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
function sync(){const next=lesson(),newExpression=next.expression!==expression;try{if(newExpression||!compiled){compiled=buildSteps(next.expression);expression=next.expression;$('exercise').value=expression;updateRules();}step=Math.max(0,Math.min(compiled.steps.length-1,next.step));}catch{error('No se pudo cargar este ejercicio.');return;}
 const key=expression+'|'+step;if(key!==lessonKey){lessonKey=key;drawLesson();}
 $('exercise').readOnly=!editable();$('solve').disabled=!editable();document.querySelectorAll('#examples button').forEach(button=>button.disabled=!editable());
 $('previous').disabled=!editable()||step===0;$('next').disabled=!editable()||step===compiled.steps.length-1;$('reset').disabled=!editable()||step===0;drawing?.refresh();
}
for(const [name,value]of[['Amarillo','#fff02b'],['Rosado','#ff8fb8'],['Celeste','#7fd4ff'],['Blanco','#ffffff']]){const button=element('button');button.dataset.color=value;button.style.background=value;button.setAttribute('aria-label',name);button.setAttribute('aria-pressed','false');$('colors').append(button);}
drawing=createDrawing({canvas,adapter,newId:()=>live.engine.newId(),laser:$('laser'),colors:$('colors'),picker:$('drawing-color'),widthInput:$('drawing-width'),deleteButton:$('delete-shape'),undoButton:$('undo'),clearButton:$('clear'),toolButtons:[...document.querySelectorAll('[data-tool]')],defaultExpression:CONFIG.examples[0]});
CONFIG.examples.forEach(example=>{const button=element('button',example);button.type='button';button.onclick=()=>solve(example);$('examples').append(button);});
$('exercise-form').onsubmit=event=>{event.preventDefault();solve($('exercise').value);};$('previous').onclick=()=>navigate(step-1);$('next').onclick=()=>navigate(step+1);$('reset').onclick=()=>navigate(0);
document.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,button,a,[contenteditable=true]')||event.ctrlKey||event.altKey||event.metaKey)return;if(event.key==='ArrowRight'||event.key===' '){event.preventDefault();navigate(step+1);}if(event.key==='ArrowLeft'){event.preventDefault();navigate(step-1);}});
let orderCollapsed=false;
function setOrderCollapsed(collapsed){orderCollapsed=collapsed;$('order-content').hidden=collapsed;$('lesson-layout').classList.toggle('order-collapsed',collapsed);$('collapse-order').setAttribute('aria-expanded',String(!collapsed));$('collapse-order').setAttribute('aria-label',collapsed?'Mostrar explicación':'Reducir explicación');}
$('collapse-order').onclick=()=>setOrderCollapsed(!orderCollapsed);
$('close-order').onclick=()=>{$('order-panel').hidden=true;$('lesson-layout').classList.add('order-hidden');$('show-order').hidden=false;$('show-order').setAttribute('aria-expanded','false');$('show-order').focus();};
$('show-order').onclick=()=>{$('order-panel').hidden=false;$('lesson-layout').classList.remove('order-hidden');$('show-order').hidden=true;$('show-order').setAttribute('aria-expanded','true');setOrderCollapsed(false);$('collapse-order').focus();};
adapter.subscribe(sync);live=attachLive(adapter,{boardId:'operaciones-combinadas',workspace:$('workspace'),slot:$('live-slot')});
live.subscribe(view=>{$('status').hidden=view.status==='active'&&!view.error;$('status').textContent=view.error||(view.status==='paused'?'El profesor se desconectó. La pizarra está en pausa.':view.status==='waiting'?'Esperando la aceptación del profesor…':'Conectando a la sala…');});
if(live.mode==='solo'){const button=element('button','Clase');button.onclick=()=>location.assign('/profesor/?board=operaciones-combinadas');$('live-slot').append(button);}
sync();

import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '../geometria/geometry.css';
import './style.css';
import {initialState,formatNumber,adjustMarks,addPin,movePin,removePin,clearLine,adjustFont,columnAt,inside,placementMessage} from './model.js';

const byId=id=>document.getElementById(id);
const node=(tag,text,css)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(css)el.className=css;return el};
const line=byId('integer-line'),pad=byId('number-pad'),note=byId('number-note');
let state=initialState(),sign=null,digits='',message='Forma un número con el signo + o − y los dígitos. 🐸',drag=null,ignoreClickUntil=0;
const readOnly=new URLSearchParams(location.search).has('room');
const ready=()=>digits!==''&&(sign!==null||Number(digits)===0);
const formed=()=>Number(digits)*(sign==='−'?-1:1);

function renderLine(){
 const fragment=document.createDocumentFragment(),count=state.a+state.b+1,levels=count<=11?1:count<=21?2:4;
 fragment.append(node('div',undefined,'number-axis'));
 for(let value=-state.a;value<=state.b;value++){
  const column=node('div',undefined,'number-column '+(value<0?'negative':value>0?'positive':'zero'));column.dataset.value=String(value);
  column.append(node('div',undefined,'number-tick'));
  if(value===0)column.append(node('span','0','zero-label'));
  state.pins.filter(pin=>pin.v===value).forEach((pin,index)=>{
   const button=node('button',formatNumber(pin.n),'number-pin '+(pin.n<0?'negative-pin':pin.n===0?'zero-pin':''));
   button.type='button';button.dataset.pin=pin.id;button.style.setProperty('--level',String((value+state.a+index)%levels));
   button.setAttribute('aria-label',`${formatNumber(pin.n)}, marca ${formatNumber(value)}. Toca para quitar o arrastra para mover.`);button.disabled=readOnly;
   column.append(button);
  });fragment.append(column);
 }
 line.style.minWidth=Math.max(560,count*28)+'px';line.replaceChildren(fragment);
 byId('negative-count').textContent=String(state.a);byId('positive-count').textContent=String(state.b);
}
function renderDisplay(){
 const display=byId('number-display');
 if(ready()){
  const token=node('button',formatNumber(formed()),'formed-number');token.id='formed-token';token.type='button';token.disabled=readOnly;
  token.setAttribute('aria-label',`${formatNumber(formed())}. Arrastra a la recta o toca y elige una marca.`);display.replaceChildren(token);
 }else display.replaceChildren(node('span',(sign||'')+digits||'Elige + o − y los dígitos',digits?'partial-number':''));
 document.querySelectorAll('[data-sign]').forEach(button=>{const selected=button.dataset.sign===sign;button.classList.toggle('on',selected);button.setAttribute('aria-pressed',String(selected));});
 byId('frog-message').textContent=message;
}
function render(){renderLine();renderDisplay();note.style.fontSize=state.fs+'px';byId('font-size').textContent='Letra '+state.fs;}
function resetForm(){sign=null;digits='';}
function place(value){
 if(readOnly||!ready())return;
 const number=formed(),next=addPin(state,number,value,crypto.randomUUID());
 if(next===state){message='La recta admite hasta 200 pines. Quita alguno antes de agregar más.';renderDisplay();return;}
 state=next;resetForm();message=placementMessage(number,value,state.a,state.b);render();
}
for(const [label,action,value] of [['+','sign','+'],['−','sign','−'],['⌫','delete',''],...[7,8,9,4,5,6,1,2,3,0].map(value=>[String(value),'digit',String(value)])]){
 const button=node('button',label,action==='digit'&&value==='0'?'key-zero':'');button.type='button';button.dataset.action=action;
 if(action==='sign')button.dataset.sign=value;else button.dataset.key=value;
 button.setAttribute('aria-label',action==='delete'?'Borrar último dígito':action==='sign'?(value==='+'?'Signo positivo':'Signo negativo'):'Dígito '+value);
 byId('number-keys').append(button);
}
byId('number-keys').addEventListener('click',event=>{
 if(readOnly)return;const button=event.target.closest('button');if(!button)return;
 if(button.dataset.action==='sign')sign=sign===button.dataset.sign?null:button.dataset.sign;
 if(button.dataset.action==='digit'&&digits.length<2)digits=digits==='0'?button.dataset.key:digits+button.dataset.key;
 if(button.dataset.action==='delete'){if(digits)digits=digits.slice(0,-1);else sign=null;}
 renderDisplay();
});
byId('number-controls').addEventListener('click',event=>{
 if(readOnly)return;const button=event.target.closest('[data-mark]');if(!button)return;
 state=adjustMarks(state,button.dataset.mark,Number(button.dataset.delta));render();
});
function highlight(value){line.querySelectorAll('.number-column').forEach(column=>column.classList.toggle('hot',Number(column.dataset.value)===value));}
function finishDrag(cancel=false,event){
 if(!drag)return;const current=drag;drag=null;current.ghost?.remove();highlight(null);pad.classList.remove('drop-target');
 if(current.moved){
  ignoreClickUntil=Date.now()+500;
  const value=event?columnAt(line.getBoundingClientRect(),state.a,state.b,event.clientX,event.clientY):null;
  if(current.pin){
   if(!cancel&&event&&inside(pad.getBoundingClientRect(),event.clientX,event.clientY))state=removePin(state,current.pin.id);
   else if(cancel||value===null)state=movePin(state,current.pin.id,current.pin.v);
   else state=movePin(state,current.pin.id,value);
   message='Puedes mover otro pin o formar un nuevo número. 🐸';render();
  }else if(!cancel&&value!==null)place(value);
  else{message='Suelta el número sobre una marca de la recta. 🐸';renderDisplay();}
 }else if(!cancel){
  if(current.pin){state=removePin(state,current.pin.id);ignoreClickUntil=Date.now()+500;render();}
  else{message='Ahora toca en la recta el lugar donde va '+formatNumber(formed())+'. 👆';renderDisplay();}
 }
}
byId('number-layout').addEventListener('pointerdown',event=>{
 if(readOnly||drag||event.button>0)return;
 const pinElement=event.target.closest('[data-pin]'),token=event.target.closest('#formed-token');
 if(!pinElement&&!token)return;
 event.preventDefault();window.getSelection()?.removeAllRanges();
 const pin=pinElement?state.pins.find(item=>item.id===pinElement.dataset.pin):null;
 if(pinElement&&!pin)return;
 drag={pointerId:event.pointerId,pin:pin?{...pin}:null,x:event.clientX,y:event.clientY,moved:false,ghost:null};
 try{byId('number-layout').setPointerCapture(event.pointerId)}catch{}
});
window.addEventListener('pointermove',event=>{
 if(!drag||drag.pointerId!==event.pointerId)return;event.preventDefault();
 if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6){
  drag.moved=true;drag.ghost=node('div',formatNumber(drag.pin?.n??formed()),'formed-number number-ghost');document.body.append(drag.ghost);
 }
 if(!drag.moved)return;
 drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
 const value=columnAt(line.getBoundingClientRect(),state.a,state.b,event.clientX,event.clientY);highlight(value);
 pad.classList.toggle('drop-target',!!drag.pin&&inside(pad.getBoundingClientRect(),event.clientX,event.clientY));
 if(drag.pin&&value!==null){state=movePin(state,drag.pin.id,value);renderLine();highlight(value);}
});
window.addEventListener('pointerup',event=>{if(drag?.pointerId===event.pointerId)finishDrag(false,event);});
window.addEventListener('pointercancel',event=>{if(drag?.pointerId===event.pointerId)finishDrag(true,event);});
window.addEventListener('blur',()=>finishDrag(true));
line.addEventListener('click',event=>{
 if(readOnly||Date.now()<ignoreClickUntil)return;
 const pin=event.target.closest('[data-pin]');if(pin){state=removePin(state,pin.dataset.pin);render();return;}
 const column=event.target.closest('[data-value]');if(!column)return;
 if(ready())place(Number(column.dataset.value));else{message='Primero forma un número con los botones. 🐸';renderDisplay();}
});
byId('number-layout').addEventListener('dragstart',event=>{if(!event.target.closest('#number-note'))event.preventDefault();});
byId('number-help').onclick=()=>{message='💡 Los positivos van a la derecha del 0 y los negativos a la izquierda. Puedes colocar un número en cualquier marca y la rana te orientará.';renderDisplay();};
for(const [id,delta] of [['font-smaller',-2],['font-larger',2]])byId(id).onclick=()=>{if(!readOnly){state=adjustFont(state,delta);render();}};
byId('clear-line').onclick=()=>{if(!readOnly)byId('clear-dialog').showModal();};
byId('cancel-clear').onclick=()=>byId('clear-dialog').close();
byId('confirm-clear').onclick=()=>{if(readOnly)return;finishDrag(true);state=clearLine(state);resetForm();message='Recta limpia. Forma un nuevo número. 🐸';byId('clear-dialog').close();render();};
for(const [id,css,controls,label] of [['hide-upper','hide-number-upper','number-controls','superior'],['hide-lower','hide-number-lower','number-notes','inferior']])byId(id).onclick=()=>{
 const hidden=document.body.classList.toggle(css);byId(id).textContent=`${hidden?'Mostrar':'Ocultar'} menú ${label}`;byId(id).setAttribute('aria-expanded',String(!hidden));
};
byId('large-board').onclick=()=>{const large=document.body.classList.toggle('number-big');byId('large-board').textContent=large?'Salir de pizarra grande':'Pizarra grande';};

function noteBlocks(){
 const blocks=[];let text='';const flush=()=>{if(text){blocks.push({k:'t',v:text});text='';}};
 const visit=element=>{
  if(element.nodeType===3){text+=element.textContent;return;}
  if(element.nodeName==='IMG'){flush();if(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(element.src))blocks.push({k:'i',src:element.src});return;}
  if(element.nodeName==='BR'){text+='\n';return;}
  for(const child of element.childNodes||[])visit(child);
  if(['DIV','P'].includes(element.nodeName)&&element!==note)text+='\n';
 };
 visit(note);flush();return blocks;
}
note.addEventListener('input',()=>{if(!readOnly)state={...state,note:noteBlocks()};});
note.addEventListener('drop',event=>event.preventDefault());
note.addEventListener('paste',async event=>{
 event.preventDefault();if(readOnly)return;const clipboard=event.clipboardData;if(!clipboard)return;
 const files=Array.from(clipboard.files||[]);
 if(files.length){
  for(const file of files){
   if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>300*1024){message='Pega una imagen PNG, JPEG, WebP o GIF de hasta 300 KB.';renderDisplay();continue;}
   const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   const image=node('img');image.src=src;image.alt='Imagen pegada en las notas';note.append(image);state={...state,note:noteBlocks()};
  }return;
 }
 const text=clipboard.getData('text/plain');if(text){
  note.focus();if(!document.execCommand('insertText',false,text))note.append(document.createTextNode(text));state={...state,note:noteBlocks()};
 }
});
if(readOnly){byId('number-status').hidden=false;byId('number-status').textContent='La conexión de esta pizarra a la sala se prepara en la siguiente etapa.';note.contentEditable='false';document.querySelectorAll('#number-controls button,#number-layout button').forEach(button=>button.disabled=true);}
render();

import {readTextRuns,writeTextRuns} from './text.js';
export function createGraphTextEditor(ui,{canEdit,container,activate,finish,update}){
 let range=null,sup=false,editing=false;
 container.append(ui.editor);ui.editor.classList.add('graph-inline-text');ui.editor.hidden=true;ui.apply?.remove();ui.newButton?.remove();
 const save=()=>{const selection=getSelection();if(selection.rangeCount&&ui.editor.contains(selection.anchorNode))range=selection.getRangeAt(0).cloneRange();};
 const focus=()=>{ui.editor.focus();if(range&&ui.editor.contains(range.startContainer)){const sel=getSelection();sel.removeAllRanges();sel.addRange(range);}};
 function exponent(value){
  sup=value;focus();const sel=getSelection();const current=sel.rangeCount?sel.getRangeAt(0):null;const node=sel.anchorNode,element=node?.nodeType===1?node:node?.parentElement,raised=element?.closest('sup');
  if(!value&&raised&&current?.collapsed){const tail=document.createRange();tail.setStart(current.startContainer,current.startOffset);tail.setEnd(raised,raised.childNodes.length);const fragment=tail.extractContents(),plain=document.createTextNode('\u200b');raised.after(plain);if(fragment.textContent){const rest=document.createElement('sup');rest.append(fragment);plain.after(rest);}const caret=document.createRange();caret.setStart(plain,plain.length);caret.collapse(true);sel.removeAllRanges();sel.addRange(caret);if(!raised.textContent)raised.remove();}
  if(document.queryCommandState('superscript')!==value)document.execCommand('superscript');
  ui.up.classList.toggle('act',value);ui.down.classList.toggle('act',!value);ui.up.setAttribute('aria-pressed',String(value));ui.down.setAttribute('aria-pressed',String(!value));save();
 }

 function sync(){if(!editing||!canEdit())return;const runs=readTextRuns(ui.editor),fontSize=Number(ui.size.value);if(runs.length>400||runs.reduce((n,r)=>n+r.text.length,0)>4000||!Number.isInteger(fontSize)||fontSize<12||fontSize>96){ui.error.hidden=false;ui.error.textContent='Usa hasta 4000 caracteres y tamaño entre 12 y 96.';return;}ui.error.hidden=true;ui.editor.style.fontSize=fontSize+'px';ui.editor.style.color=ui.color.value;update({runs:runs.length?runs:[{text:'',sup:false}],fontSize,c:ui.color.value,height:ui.editor.scrollHeight});}
 function position(item){ui.editor.style.left=item.x1*100+'%';ui.editor.style.top=item.y1*100+'%';ui.editor.style.width=(item.x2-item.x1)*100+'%';}
 function openAt(item){if(!canEdit())return;editing=true;ui.panel.hidden=false;ui.editor.hidden=false;ui.error.hidden=true;range=null;writeTextRuns(ui.editor,item.runs||[]);ui.size.value=item.fontSize||28;ui.color.value=item.c||'#082783';ui.editor.style.fontSize=ui.size.value+'px';ui.editor.style.color=ui.color.value;position(item);exponent(false);}
 function close(){if(!editing)return;sync();editing=false;ui.editor.hidden=true;range=null;finish();}
 ui.button.onclick=()=>{if(!canEdit())return;close();ui.panel.hidden=false;activate();};ui.close.textContent='Terminar texto';ui.close.onclick=()=>{close();activate(false);};
 for(const button of [ui.up,ui.down,...ui.signs])button.addEventListener('mousedown',event=>event.preventDefault());
 ui.up.onclick=()=>{if(editing)exponent(true);};ui.down.onclick=()=>{if(editing)exponent(false);};
 ui.signs.forEach(button=>button.onclick=()=>{if(!editing)return;focus();document.execCommand('insertText',false,button.dataset.textSign);save();sync();});
 for(const event of ['keyup','mouseup','input'])ui.editor.addEventListener(event,()=>{save();if(event==='input')sync();});
 ui.editor.addEventListener('keydown',event=>{if(event.key==='Enter'){exponent(false);}else if(event.key==='Escape'){event.preventDefault();close();activate(false);}else if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();exponent(event.key==='ArrowUp');}});
 ui.editor.addEventListener('paste',event=>{if([...event.clipboardData.items].some(x=>x.type.startsWith('image/')))return;event.preventDefault();document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));});
 ui.size.addEventListener('input',sync);ui.color.addEventListener('input',sync);
 document.addEventListener('pointerdown',event=>{if(!editing||ui.editor.contains(event.target)||ui.panel.contains(event.target)||event.target===ui.button)return;close();},true);
 return {openAt,close,position,isEditing:()=>editing};
}

import {readTextRuns,writeTextRuns} from './text.js';
export function createGraphTextEditor(ui,{canEdit,getSelected,apply}){
 let range=null,sup=false,editing=false;
 const save=()=>{const selection=getSelection();if(selection.rangeCount&&ui.editor.contains(selection.anchorNode))range=selection.getRangeAt(0).cloneRange();};
 const focus=()=>{ui.editor.focus();if(range&&ui.editor.contains(range.startContainer)){const sel=getSelection();sel.removeAllRanges();sel.addRange(range);}};
 function exponent(value){
  sup=value;focus();const sel=getSelection();const current=sel.rangeCount?sel.getRangeAt(0):null;const node=sel.anchorNode,element=node?.nodeType===1?node:node?.parentElement,raised=element?.closest('sup');
  if(!value&&raised&&current?.collapsed){const tail=document.createRange();tail.setStart(current.startContainer,current.startOffset);tail.setEnd(raised,raised.childNodes.length);const fragment=tail.extractContents(),plain=document.createTextNode('\u200b');raised.after(plain);if(fragment.textContent){const rest=document.createElement('sup');rest.append(fragment);plain.after(rest);}const caret=document.createRange();caret.setStart(plain,plain.length);caret.collapse(true);sel.removeAllRanges();sel.addRange(caret);if(!raised.textContent)raised.remove();}
  if(document.queryCommandState('superscript')!==value)document.execCommand('superscript');
  ui.up.classList.toggle('act',value);ui.down.classList.toggle('act',!value);ui.up.setAttribute('aria-pressed',String(value));ui.down.setAttribute('aria-pressed',String(!value));save();
 }

 function open(fresh=false){if(!canEdit())return;const item=fresh?null:getSelected();editing=item?.t==='text';ui.panel.hidden=false;ui.error.hidden=true;range=null;writeTextRuns(ui.editor,editing?item.runs:[]);ui.size.value=editing?item.fontSize:28;ui.color.value=editing?item.c:'#082783';ui.apply.textContent=editing?'Aplicar cambios al texto':'Añadir texto al gráfico';exponent(false);}
 ui.button.onclick=()=>open();ui.newButton.onclick=()=>open(true);ui.close.onclick=()=>{ui.panel.hidden=true;};
 for(const button of [ui.up,ui.down,...ui.signs])button.addEventListener('mousedown',event=>event.preventDefault());
 ui.up.onclick=()=>exponent(true);ui.down.onclick=()=>exponent(false);
 ui.signs.forEach(button=>button.onclick=()=>{focus();document.execCommand('insertText',false,button.dataset.textSign);save();});
 for(const event of ['keyup','mouseup','input'])ui.editor.addEventListener(event,save);
 ui.editor.addEventListener('keydown',event=>{if(event.key==='Enter'){exponent(false);}else if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();exponent(event.key==='ArrowUp');}});
 ui.editor.addEventListener('paste',event=>{if([...event.clipboardData.items].some(x=>x.type.startsWith('image/')))return;event.preventDefault();document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));});
 ui.apply.onclick=()=>{if(!canEdit())return;const runs=readTextRuns(ui.editor),fontSize=Number(ui.size.value);if(!runs.some(r=>r.text.trim())){ui.error.hidden=false;ui.error.textContent='Escribe el texto que quieres añadir.';return;}if(runs.length>400||runs.reduce((n,r)=>n+r.text.length,0)>4000||!Number.isInteger(fontSize)||fontSize<12||fontSize>96){ui.error.hidden=false;ui.error.textContent='Usa hasta 4000 caracteres y tamaño entre 12 y 96.';return;}apply({runs,fontSize,c:ui.color.value},editing);editing=true;ui.apply.textContent='Aplicar cambios al texto';ui.error.hidden=true;};
 return {open};
}

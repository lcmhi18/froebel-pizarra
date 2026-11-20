import './creation-dialog.css';
import {putHTML} from './sanitize';

export function creationDialog(board,canEdit,commit){
 const dialog=document.createElement('dialog');dialog.id='creation-dialog';
 putHTML(dialog,`<form><h2 id="creation-title">Crear tabla</h2>
 <div class="creation-counts"><label>Columnas (horizontal)<input name="cols" type="number" min="1" max="10" value="3" required></label><label>Filas (vertical)<input name="rows" type="number" min="1" max="10" value="3" required></label></div>
 <label>Valores en horizontal<textarea name="horizontal" rows="2" maxlength="250" required>1; 2; 3</textarea></label>
 <label>Valores en vertical<textarea name="vertical" rows="2" maxlength="250" required>1; 2; 3</textarea></label>
 <p>Separa los valores con punto y coma. Ejemplo: a; b; c. Máximo 24 caracteres por valor.</p>
 <label class="creation-pairs"><input name="pairs" type="checkbox"> Completar pares automáticamente (horizontal; vertical)</label>
 <p class="creation-error" role="alert"></p><div class="creation-actions"><button type="button" name="cancel">Cancelar</button><button type="submit">Crear</button></div></form>`);
 dialog.setAttribute('aria-labelledby','creation-title');
 document.getElementById('arithmetic-workspace').append(dialog);
 const form=dialog.querySelector('form'),field=name=>form.elements.namedItem(name);
 let kind='g';
 const parse=value=>value.split(/[;\n]/).map(x=>x.trim()).filter(Boolean);
 for(const [count,name] of [['cols','horizontal'],['rows','vertical']])field(count).addEventListener('change',()=>{
  if(!field(count).checkValidity())return;
  const old=parse(field(name).value);
  field(name).value=Array.from({length:Number(field(count).value)},(_,i)=>old[i]??String(i+1)).join('; ');
 });
 field('cancel').onclick=()=>dialog.close();
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!canEdit()||!form.reportValidity())return;
  const cols=Number(field('cols').value),rows=Number(field('rows').value),hLabels=parse(field('horizontal').value),vLabels=parse(field('vertical').value);
  const error=dialog.querySelector('.creation-error');
  if(hLabels.length!==cols||vLabels.length!==rows){error.textContent=`Escribe ${cols} valores horizontales y ${rows} valores verticales.`;return;}
  if([...hLabels,...vLabels].some(x=>x.length>24)){error.textContent='Cada valor puede tener hasta 24 caracteres.';return;}
  board.make(kind,{rows,cols,hLabels,vLabels,pairs:kind==='g'&&field('pairs').checked});
  commit();dialog.close();
 });
 return type=>{
  if(!canEdit())return;
  kind=type;form.reset();dialog.querySelector('.creation-error').textContent='';
  dialog.querySelector('h2').textContent=type==='g'?'Crear tabla del producto':'Crear plano cartesiano';
  dialog.querySelector('.creation-pairs').hidden=type!=='g';
  dialog.showModal();field('cols').focus();
 };
}

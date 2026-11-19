import type { RoomConnection,RoomView } from '../connection';
import { button,element,icons,labels } from './dom';
import { roomFont,uiStyle } from './styles';
export class StatusChip{
 readonly host=element('div');private state=element('span');private message=element('p','','feedback');private entry=element('form');private input=element('input');private retry:HTMLButtonElement;private themeButton:HTMLButtonElement;
 constructor(slot:HTMLElement,connection:RoomConnection,theme:()=>void){
  roomFont();const root=this.host.attachShadow({mode:'open'}),style=element('style');style.textContent=uiStyle+`:host{display:block;max-width:100%}.chip{background:var(--room-bg);border:1px solid var(--room-line);border-radius:14px;padding:8px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.state{font-size:14px;font-weight:700}.feedback{margin:0;width:100%}form{display:flex;gap:8px;align-items:center;flex-wrap:wrap}input{width:150px;min-width:100px}button{min-height:44px}.theme span{display:none}`;
  const chip=element('div',undefined,'chip');this.state.className='state';this.state.setAttribute('role','status');this.message.setAttribute('role','status');this.input.placeholder='Tu nombre';this.input.setAttribute('aria-label','Tu nombre');this.input.required=true;this.input.maxLength=24;
  const submit=button('Pedir entrada');submit.type='submit';this.entry.append(this.input,submit);this.entry.addEventListener('submit',event=>{event.preventDefault();connection.join(this.input.value);});
  this.retry=button('Volver a pedir entrada',undefined,()=>connection.retry());this.themeButton=button('Cambiar tema',icons.moon,theme);this.themeButton.className='theme';this.themeButton.setAttribute('aria-label','Cambiar tema');
  const leave=button('Salir',icons.leave,()=>location.assign('/alumno/'));chip.append(this.state,this.entry,this.retry,this.themeButton,leave,this.message);root.append(style,chip);slot.append(this.host);
 }
 update(view:RoomView){this.state.textContent=`${view.name||'Alumno'} · ${labels[view.status]}`;this.entry.hidden=view.status!=='entry';this.retry.hidden=view.status!=='ended';this.message.textContent=view.status==='waiting'?'Esperando que el profesor te acepte…':view.error;}
 setTheme(theme:'light'|'dark'){this.host.dataset.theme=theme;}
 destroy(){this.host.remove();}
}

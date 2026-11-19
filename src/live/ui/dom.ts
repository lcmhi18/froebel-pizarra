import users from '@phosphor-icons/core/assets/regular/users-three.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import x from '@phosphor-icons/core/assets/regular/x.svg?raw';
import copy from '@phosphor-icons/core/assets/regular/copy.svg?raw';
import leave from '@phosphor-icons/core/assets/regular/sign-out.svg?raw';
import lock from '@phosphor-icons/core/assets/regular/lock-key.svg?raw';
import moon from '@phosphor-icons/core/assets/regular/moon.svg?raw';
import sun from '@phosphor-icons/core/assets/regular/sun.svg?raw';
export const icons={users,check,x,copy,leave,lock,moon,sun};
export function icon(source:string){const node=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;const svg=document.importNode(node,true);svg.setAttribute('aria-hidden','true');svg.setAttribute('width','22');svg.setAttribute('height','22');return svg;}
export function element<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string,className?:string){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
export function button(label:string,source?:string,callback?:()=>void){const node=element('button');node.type='button';if(source)node.append(icon(source));node.append(element('span',label));if(callback)node.addEventListener('click',callback);return node;}
export const labels={idle:'Sin conexión',entry:'Pide entrada',connecting:'Conectando',waiting:'En espera',active:'Conectado',paused:'En pausa',reconnecting:'Reconectando',ended:'Sala desconectada'};

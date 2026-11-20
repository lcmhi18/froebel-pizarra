import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as model from '../../src/boards/recta-numerica/model.js';

// Explicit in-memory DOM for event/gesture tests. This does not launch a browser
// or claim to verify CSS layout, image decoding or native clipboard behavior.
export function uiHarness(){
 const ids=new Map();let serial=0,time=1000;
 class Element{
  constructor(tag='div',id=''){
   this.tagName=tag.toUpperCase();this.nodeName=this.tagName;this.nodeType=1;this.id=id;this.dataset={};this.attrs={};this.childNodes=[];this.events={};this.classes=new Set();this.disabled=false;
   this.style={setProperty(key,value){this[key]=value}};
   this.classList={toggle:(name,force)=>{const on=force??!this.classes.has(name);if(on)this.classes.add(name);else this.classes.delete(name);return on},remove:name=>this.classes.delete(name)};
   if(id)ids.set(id,this);
  }
  set className(value){this.classes=new Set(value.split(' ').filter(Boolean))}get className(){return [...this.classes].join(' ')}
  set textContent(value){this.childNodes=[];this.text=String(value)}get textContent(){return (this.text||'')+this.childNodes.map(node=>node.textContent).join('')}
  append(...children){for(const child of children){if(child.tagName==='#FRAGMENT'){this.append(...child.childNodes);continue;}child.parentElement=this;this.childNodes.push(child)}}
  replaceChildren(...children){this.childNodes=[];this.text='';this.append(...children)}
  remove(){if(this.parentElement)this.parentElement.childNodes=this.parentElement.childNodes.filter(node=>node!==this)}
  setAttribute(key,value){this.attrs[key]=String(value)}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn)}
  matches(selector){
   if(selector.startsWith('#'))return this.id===selector.slice(1);
   if(selector.startsWith('.'))return this.classes.has(selector.slice(1));
   const data=/^\[data-([\w-]+)(?:="([^"]*)")?\]$/.exec(selector);
   if(data){const key=data[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return data[2]===undefined?key in this.dataset:this.dataset[key]===data[2]}
   return this.tagName===selector.toUpperCase();
  }
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null}
  querySelectorAll(selector){const result=[];for(const child of this.childNodes){if(child.matches?.(selector))result.push(child);result.push(...(child.querySelectorAll?.(selector)||[]))}return result}
  getBoundingClientRect(){return this.id==='number-pad'?{left:1300,right:1600,top:100,bottom:600,width:300}:{left:100,right:1200,top:100,bottom:440,width:1100}}
  focus(){}setPointerCapture(){throw Error('No native capture in mock DOM')}showModal(){this.open=true}close(){this.open=false}
 }
 const body=new Element('body');
 const make=(id,parent=body,tag='div')=>{const element=new Element(tag,id);parent.append(element);return element};
 const top=make('top'),main=make('number-line-workspace'),controls=make('number-controls',main),layout=make('number-layout',main),board=make('number-board',layout),pad=make('number-pad',layout),notes=make('number-notes',board),dialog=make('clear-dialog');
 make('integer-line',board);make('number-note',notes);make('number-display',pad);make('number-keys',pad);make('number-status',main);make('frog-message',layout);make('font-size',notes);make('negative-count',controls);make('positive-count',controls);
 for(const id of ['hide-upper','hide-lower','large-board'])make(id,top,'button');
 for(const id of ['font-smaller','font-larger','clear-line'])make(id,notes,'button');
 make('number-help',layout,'button');make('cancel-clear',dialog,'button');make('confirm-clear',dialog,'button');
 for(const side of ['a','b'])for(const delta of [-1,1]){const button=make(side+delta,controls,'button');button.dataset={mark:side,delta:String(delta)}}
 const windowEvents=new Map();
 const context=vm.createContext({...model,URLSearchParams,structuredClone,Date:class extends Date{static now(){return time}},crypto:{randomUUID:()=>`solo-${++serial}`},location:{search:''},document:{body,getElementById:id=>ids.get(id)||body.querySelectorAll('#'+id)[0],createElement:tag=>new Element(tag),createDocumentFragment:()=>new Element('#fragment'),createTextNode:text=>({nodeType:3,textContent:text}),querySelectorAll:selector=>body.querySelectorAll(selector)},window:{getSelection:()=>({removeAllRanges(){}}),addEventListener:(type,fn)=>{const callbacks=windowEvents.get(type)||[];callbacks.push(fn);windowEvents.set(type,callbacks)}}});
 const source=readFileSync('src/boards/recta-numerica/main.js','utf8').replace(/^import .*;\r?$/gm,'');
 vm.runInContext(source+'\nthis.inspect=()=>structuredClone({state,sign,digits,message});',context,{timeout:2000});
 const dispatch=(target,type,extra={})=>{
  const event={target,button:0,pointerId:7,clientX:450,clientY:200,preventDefault(){},...extra};
  const ancestors=[];for(let el=target;el;el=el.parentElement)ancestors.push(el);
  for(const el of ancestors){for(const callback of el.events[type]||[])callback(event);el['on'+type]?.(event)}
  for(const callback of windowEvents.get(type)||[])callback(event);
 };
 return {id:id=>ids.get(id)||body.querySelectorAll('#'+id)[0],find:selector=>body.querySelectorAll(selector)[0],click(target){dispatch(target,'click')},pointer(type,target,x,y){dispatch(target,type,{clientX:x,clientY:y})},inspect:()=>context.inspect(),tick(n=600){time+=n},input(text){const note=ids.get('number-note');note.replaceChildren({nodeType:3,textContent:text});dispatch(note,'input')}};
}

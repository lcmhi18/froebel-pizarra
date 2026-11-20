import type {BoardAdapter} from '../../live/BoardAdapter';
import {emptyState,LIMITS,type BoardState,type Op} from '../../shared/protocol';
import {applyOperation} from '../../shared/operations';
import {structurallyEqual} from '../../live/engine';
import {validNote} from '../../shared/permissions';
export type NoteBlock={k:'t';v:string}|{k:'i';src:string};
export type NumberLineModel={a:number;b:number;fs:number;note:NoteBlock[];pins:{id:string;t:string;n:number;v:number}[]};
const defaults={a:10,b:10,fs:18,note:[] as NoteBlock[]};
export class NumberLineAdapter implements BoardAdapter{
 localKeys=['sg','dg','msg','drag','hot','nc'];readOnly=true;
 private state:BoardState=emptyState();private renders=new Set<()=>void>();private changes=new Set<(final?:boolean)=>void>();
 constructor(readonly role:'teacher'|'student'='teacher'){}
 get canEditNotes(){return !this.readOnly&&this.role==='teacher';}
 getState=()=>this.state;
 getModel=():NumberLineModel=>({a:(this.state.fields.a??defaults.a) as number,b:(this.state.fields.b??defaults.b) as number,fs:(this.state.fields.fs??defaults.fs) as number,note:structuredClone((this.state.fields.note??defaults.note) as NoteBlock[]),pins:this.state.order.flatMap(id=>this.state.items[id]?.t==='pin'?[{id,t:'pin',n:this.state.items[id].n as number,v:this.state.items[id].v as number}]:[])});
 setState=(state:BoardState)=>{this.state=state;this.renders.forEach(callback=>callback());};
 applyRemote=(ops:Op[])=>{const next={...this.state};ops.forEach(op=>applyOperation(next,op));this.setState(next);};
 setReadOnly=(value:boolean)=>{this.readOnly=value;this.renders.forEach(callback=>callback());};
 onChange=(callback:(final?:boolean)=>void)=>{this.changes.add(callback);return()=>{this.changes.delete(callback);};};
 subscribe=(callback:()=>void)=>{this.renders.add(callback);return()=>{this.renders.delete(callback);};};
 commit(model:NumberLineModel,final=true){
  if(this.readOnly)return false;
  const current=this.getModel(),next:BoardState={items:{},order:model.pins.map(pin=>pin.id),fields:{...this.state.fields}};
  if(this.role==='student'&&(!structurallyEqual(model.note,current.note)||model.fs!==current.fs))return false;
  for(const pin of model.pins){const item={t:'pin',n:pin.n,v:pin.v};next.items[pin.id]=structurallyEqual(this.state.items[pin.id],item)?this.state.items[pin.id]:item;}
  for(const key of ['a','b','note','fs'] as const)if(!structurallyEqual(model[key],current[key]))next.fields[key]=structuredClone(model[key]);
  if(!structurallyEqual(model.note,current.note)&&!validNote(model.note))throw Error('Las notas contienen una imagen o un bloque no permitido.');
  if(new TextEncoder().encode(JSON.stringify(next)).length>LIMITS.stateBytes)throw Error('Las notas y los pines superan el tamaño máximo de la pizarra.');
  if(structurallyEqual(next.order,this.state.order))next.order=this.state.order;
  this.state=next;this.changes.forEach(callback=>callback(final));return true;
 }
}

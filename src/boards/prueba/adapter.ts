import { clone, emptyState, type BoardState, type Op } from '@shared/protocol';
import { applyOperation } from '@shared/operations';
import { structurallyEqual } from '../../live/engine';
import type { BoardAdapter } from '../../live/BoardAdapter';
export class TestBoardAdapter implements BoardAdapter {
  localKeys=['tool','color','selection','magnet','largeBoard','hideOptions','tab'];
  private state=emptyState();private changes=new Set<(final?:boolean)=>void>();private renders=new Set<()=>void>();
  readOnly=false;
  getState=()=>this.state;
  setState=(state:BoardState)=>{this.state=state;this.renders.forEach(cb=>cb());};
  applyRemote=(ops:Op[])=>{const state={...this.state};ops.forEach(op=>applyOperation(state,op));this.setState(state);};
  setReadOnly=(value:boolean)=>{this.readOnly=value;this.renders.forEach(cb=>cb());};
  onChange=(cb:(final?:boolean)=>void)=>{this.changes.add(cb);return()=>{this.changes.delete(cb);};};
  subscribe=(cb:()=>void)=>{this.renders.add(cb);return()=>{this.renders.delete(cb);};};
  change=(mutate:(state:BoardState)=>void,final=true)=>{
    if(this.readOnly)return;
    const before=this.state,state=clone(before);mutate(state);
    for(const id of Object.keys(state.items))if(Object.hasOwn(before.items,id)&&structurallyEqual(before.items[id],state.items[id]))state.items[id]=before.items[id];
    if(structurallyEqual(before.order,state.order))state.order=before.order;
    for(const key of Object.keys(state.fields))if(structurallyEqual(before.fields[key],state.fields[key]))state.fields[key]=before.fields[key];
    this.setState(state);this.changes.forEach(cb=>cb(final));
  };
}

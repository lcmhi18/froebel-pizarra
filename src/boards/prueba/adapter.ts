import { applyOp, clone, emptyState, type BoardState, type Op } from '@shared/protocol';
import type { BoardAdapter } from '../../live/BoardAdapter';
export class TestBoardAdapter implements BoardAdapter {
  localKeys=['tool','color','selection','magnet','largeBoard','hideOptions','tab'];
  private state=emptyState();private changes=new Set<(final?:boolean)=>void>();private renders=new Set<()=>void>();
  getState=()=>this.state;
  setState=(state:BoardState)=>{this.state=clone(state);this.renders.forEach(cb=>cb());};
  applyRemote=(ops:Op[])=>{const state=clone(this.state);ops.forEach(op=>applyOp(state,op));this.setState(state);};
  onChange=(cb:(final?:boolean)=>void)=>{this.changes.add(cb);return()=>{this.changes.delete(cb);};};
  subscribe=(cb:()=>void)=>{this.renders.add(cb);return()=>{this.renders.delete(cb);};};
  change=(mutate:(state:BoardState)=>void,final=true)=>{const state=clone(this.state);mutate(state);this.setState(state);this.changes.forEach(cb=>cb(final));};
}

import type { BoardState, LegacyOp } from '../shared/protocol';
export interface BoardAdapter {
  getState():BoardState;
  setState(state:BoardState):void;
  applyRemote(ops:LegacyOp[]):void;
  /** UI-only keys inside state.fields. Object properties such as an item's fill color ARE shared. */
  localKeys:string[];
  onChange(cb:(final?:boolean)=>void):()=>void;
}

import type { BoardState, Op } from '../shared/protocol';
export interface BoardAdapter {
  /** Immutable snapshots: retain references to unchanged items/properties. Never mutate a published state. */
  getState():BoardState;
  setState(state:BoardState):void;
  applyRemote(ops:Op[]):void;
  /** UI-only keys inside state.fields. Object properties such as an item's fill color ARE shared. */
  localKeys:string[];
  onChange(cb:(final?:boolean)=>void):()=>void;
  setReadOnly(readOnly:boolean):void;
}

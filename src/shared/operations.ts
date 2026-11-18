import { clone, type BoardState, type Op } from './protocol';

/** Apply only the properties present in a patch; ordering never replaces the list. */
export function applyOperation(state:BoardState,op:Op):boolean {
  if(op.kind==='field'){state.fields={...state.fields,[op.field]:clone(op.value)};return true;}
  if(op.kind==='add'){
    if(Object.hasOwn(state.items,op.id))return false;
    state.items={...state.items,[op.id]:clone(op.patch)};state.order=[...state.order,op.id];return true;
  }
  if(!Object.hasOwn(state.items,op.id))return false;
  if(op.kind==='update')state.items={...state.items,[op.id]:{...state.items[op.id],...clone(op.patch)}};
  if(op.kind==='remove'){state.items={...state.items};delete state.items[op.id];state.order=state.order.filter(id=>id!==op.id);}
  if(op.kind==='order'){
    if(op.after!==null&&!Object.hasOwn(state.items,op.after))return false;
    state.order=state.order.filter(id=>id!==op.id);
    state.order.splice(op.after===null?0:state.order.indexOf(op.after)+1,0,op.id);
  }
  return true;
}

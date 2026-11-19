import { clone,emptyState,type BoardState,type Item,type Op } from '../../shared/protocol';
import { applyOperation } from '../../shared/operations';
import { structurallyEqual } from '../../live/engine';
import type { BoardAdapter } from '../../live/BoardAdapter';
export class GeometryAdapter implements BoardAdapter{
 localKeys=['tool','col','sel','sd','snap','tab','hide','ang','largeBoard','hideOptions'];
 private defaultProtractor:unknown;private state:BoardState=emptyState();private listeners=new Set<(final?:boolean)=>void>();readOnly=false;private gesture=false;
 constructor(private read:()=>BoardState,private write:(state:BoardState)=>void,private lock:(value:boolean)=>void){this.state=JSON.parse(JSON.stringify(this.read()));this.defaultProtractor=clone(this.state.fields.protractor);}
 getState=()=>this.state;
 setState=(state:BoardState)=>{this.state={...state,items:Object.fromEntries(Object.entries(state.items).map(([id,item])=>[id,cleanItem(item)])),fields:{...state.fields,protractor:state.fields.protractor??clone(this.defaultProtractor)}};this.write(clone(this.state));};
 applyRemote=(ops:Op[])=>{const next={...this.state};ops.forEach(op=>applyOperation(next,op));this.setState(next);};
 setReadOnly=(value:boolean)=>{this.readOnly=value;this.lock(value);};
 onChange=(listener:(final?:boolean)=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 capture(final=true){
  if(this.readOnly)return;
  // Legacy geometry mutates its working objects. Only immutable copies cross the engine boundary.
  const next=JSON.parse(JSON.stringify(this.read())) as BoardState;
  for(const id of next.order)if(this.state.items[id]&&structurallyEqual(next.items[id],this.state.items[id]))next.items[id]=this.state.items[id];
  if(structurallyEqual(next.order,this.state.order))next.order=this.state.order;
  for(const key of Object.keys(next.fields))if(structurallyEqual(next.fields[key],this.state.fields[key]))next.fields[key]=this.state.fields[key];
  const changed=!structurallyEqual(next,this.state),finish=final&&this.gesture;this.state=next;if(final)this.gesture=false;else if(changed)this.gesture=true;if(changed||finish)this.listeners.forEach(listener=>listener(final));
 }
}
export function geometryState(items:Item[],protractor:unknown):BoardState{
 const state=emptyState();for(const item of items){if(typeof item.id!=='string')continue;state.items[item.id]=cleanItem(item);state.order.push(item.id);}state.fields.protractor=protractor;return state;
}

// v1 uses null to restore an absent property. Legacy geometry treats these optional
// null slots as absent; normalize both directions so insertion undo still matches.
function cleanItem(item:Item):Item{return Object.values(item).some(value=>value===null)?Object.fromEntries(Object.entries(item).filter(([,value])=>value!==null)):item;}

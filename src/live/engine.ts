import { applyOp, clone, emptyState, type BoardState, type Op } from '../shared/protocol';
import type { BoardAdapter } from './BoardAdapter';
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function differences(before:BoardState,after:BoardState,author:string,localKeys:string[]=[]):Op[]{
  const ops:Op[]=[];const emit=(op:Omit<Op,'opId'|'author'>)=>ops.push({...op,author,opId:`${author}:${crypto.randomUUID()}`});
  for(const [id,item] of Object.entries(after.items)){
    if(!before.items[id])emit({kind:'add',id,patch:clone(item)});
    else {const patch=Object.fromEntries(Object.keys({...before.items[id],...item}).filter(k=>!equal(before.items[id][k],item[k])).map(k=>[k,item[k]??null]));if(Object.keys(patch).length)emit({kind:'update',id,patch});}
  }
  for(const id of Object.keys(before.items))if(!after.items[id])emit({kind:'remove',id});
  if(!equal(before.order,after.order))emit({kind:'order',value:after.order});
  for(const key of Object.keys({...before.fields,...after.fields}))if(!localKeys.includes(key)&&!equal(before.fields[key],after.fields[key]))emit({kind:'field',field:key,value:after.fields[key]??null});
  return ops;
}
type History={before:BoardState;after:BoardState};
export class RoomEngine {
  author=''; private canonical=emptyState();private observed=emptyState();private pending:Op[]=[];private undoStack:History[]=[];private actionBefore:BoardState|null=null;private timer:ReturnType<typeof setTimeout>|undefined;private unsubscribe:()=>void;private seq=0;
  constructor(private adapter:BoardAdapter,private send:(ops:Op[])=>void){this.observed=clone(adapter.getState());this.unsubscribe=adapter.onChange(final=>this.local(final!==false));}
  identity(author:string){this.author=author;}
  private local(final:boolean){
    if(!this.author)return;
    this.actionBefore??=clone(this.observed);
    if(final){clearTimeout(this.timer);this.timer=undefined;this.flush();const after=clone(this.adapter.getState());if(differences(this.actionBefore,after,this.author,this.adapter.localKeys).length){this.undoStack.push({before:this.actionBefore,after});if(this.undoStack.length>60)this.undoStack.shift();}this.actionBefore=null;}
    else if(!this.timer)this.timer=setTimeout(()=>{this.timer=undefined;this.flush();},40);
  }
  private flush(){const next=clone(this.adapter.getState()),ops=differences(this.observed,next,this.author,this.adapter.localKeys);this.observed=next;if(ops.length){this.pending.push(...ops);this.send(ops);}}
  snapshot(state:BoardState,seq:number){this.canonical=clone(state);this.seq=seq;this.paint();}
  receive(ops:Op[]){for(const op of ops){this.pending=this.pending.filter(p=>p.opId!==op.opId);if((op.seq||0)>this.seq){applyOp(this.canonical,op);if(this.actionBefore&&op.author!==this.author)applyOp(this.actionBefore,op);this.seq=op.seq!;}}this.paint();}
  ignored(ids:string[]){this.pending=this.pending.filter(op=>!ids.includes(op.opId));this.paint();}
  resend(){if(this.pending.length)this.send(this.pending);}
  private paint(){
    // Preserve the most recent local drag frame while an acknowledgement arrives.
    if(this.actionBefore)this.flush();
    const state=clone(this.canonical);for(const op of this.pending)applyOp(state,op);
    for(const key of this.adapter.localKeys)if(key in this.observed.fields)state.fields[key]=this.observed.fields[key];
    this.observed=clone(state);this.adapter.setState(state);
  }
  undo(){
    const entry=this.undoStack.pop();if(!entry)return;
    const state=clone(this.adapter.getState());
    for(const op of differences(entry.after,entry.before,this.author,this.adapter.localKeys)){
      if(op.kind==='update'&&state.items[op.id!]){
        op.patch=Object.fromEntries(Object.entries(op.patch!).filter(([k])=>equal(state.items[op.id!][k],entry.after.items[op.id!]?.[k])));
      }
      if(op.kind==='remove'&&!equal(state.items[op.id!],entry.after.items[op.id!]))continue;
      if(op.kind==='add'){
        if(state.items[op.id!])continue;
        // A restored remote object is a new object owned by this user; stale updates cannot resurrect it.
        op.id=`${this.author}:${crypto.randomUUID()}`;
      }
      if(op.kind==='field'&&!equal(state.fields[op.field!],entry.after.fields[op.field!]))continue;
      if(op.kind==='order')continue;
      applyOp(state,op);
    }
    this.adapter.setState(state);this.flush();
  }
  dispose(){clearTimeout(this.timer);this.unsubscribe();}
}

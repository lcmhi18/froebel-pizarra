import { clone, emptyState, type BoardState, type Op, type BoardId, type Item } from '../shared/protocol';
import { applyOperation } from '../shared/operations';
import type { BoardAdapter } from './BoardAdapter';

// Adapters publish immutable snapshots and retain references for unchanged objects.
// The canonical text also guards against hash collisions.
const signatures=new WeakMap<object,{hash:number;text:string}>();
function signature(value:unknown):{hash:number;text:string}{
  if(value&&typeof value==='object'){const cached=signatures.get(value);if(cached)return cached;}
  const text=Array.isArray(value)?'['+value.map(v=>signature(v).text).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+signature((value as Item)[k]).text).join(',')+'}':JSON.stringify(value)??'undefined';
  let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
  const result={hash:hash>>>0,text};if(value&&typeof value==='object')signatures.set(value,result);return result;
}
export function structurallyEqual(a:unknown,b:unknown):boolean{if(a===b)return true;const x=signature(a),y=signature(b);return x.hash===y.hash&&x.text===y.text;}
const copyState=(state:BoardState):BoardState=>({items:{...state.items},order:[...state.order],fields:{...state.fields}});
const predecessor=(order:string[],id:string)=>{const at=order.indexOf(id);return at>0?order[at-1]:null;};
const present=(state:BoardState,id:string)=>Object.hasOwn(state.items,id);
export function differences(before:BoardState,after:BoardState,author:string,localKeys:string[]=[],boardId:BoardId='prueba',gestureId:string=crypto.randomUUID()):Op[]{
  const ops:Op[]=[];
  const base=()=>({author,opId:`${author}:${crypto.randomUUID()}`,boardId,gestureId});
  for(const id of Object.keys(after.items)){
    const next=after.items[id],old=before.items[id];
    if(!Object.hasOwn(before.items,id))ops.push({...base(),kind:'add',id,patch:clone(next)});
    else if(!structurallyEqual(old,next)){
      const patch:Item={};for(const key of new Set([...Object.keys(old),...Object.keys(next)]))if(!structurallyEqual(old[key],next[key]))patch[key]=clone(next[key]??null);
      if(Object.keys(patch).length)ops.push({...base(),kind:'update',id,patch});
    }
  }
  for(const id of Object.keys(before.items))if(!present(after,id))ops.push({...base(),kind:'remove',id});
  if(!structurallyEqual(before.order,after.order)){
    const desired=[...new Set(after.order.filter(id=>present(after,id)))];
    for(const id of Object.keys(after.items))if(!desired.includes(id))desired.push(id);
    const working=before.order.filter(id=>present(after,id));
    for(const id of Object.keys(after.items))if(!working.includes(id))working.push(id);
    desired.forEach((id,index)=>{if(working[index]===id)return;working.splice(working.indexOf(id),1);working.splice(index,0,id);ops.push({...base(),kind:'order',id,after:index?desired[index-1]:null});});
  }
  for(const field of new Set([...Object.keys(before.fields),...Object.keys(after.fields)]))if(!localKeys.includes(field)&&!structurallyEqual(before.fields[field],after.fields[field]))ops.push({...base(),kind:'field',field,value:clone(after.fields[field]??null)});
  return ops;
}

type ItemChange={before:Item|undefined;after:Item|undefined;keys:Set<string>};
type History={gestureId:string;items:Map<string,ItemChange>;fields:Map<string,{before:unknown;after:unknown}>;orders:Map<string,{before:string|null;after:string|null}>;beforeOrder:string[];sent:boolean};
type Options={boardId?:BoardId;requestResync?:(fromSeq:number)=>void};
export class RoomEngine{
  author='';private boardId:BoardId;private canonical=emptyState();private observed:BoardState;
  private pending=new Map<string,Op>();private unsent=new Set<string>();private undoStack:History[]=[];private gesture:History|null=null;
  private timer:ReturnType<typeof setTimeout>|undefined;private unsubscribe:()=>void;private seq=0;private readOnly=false;private resyncPending=false;private painting=false;private disposed=false;
  constructor(private adapter:BoardAdapter,private send:(ops:Op[])=>void,private options:Options={}){
    this.boardId=options.boardId||'prueba';this.observed=adapter.getState();this.unsubscribe=adapter.onChange(final=>this.local(final!==false));
  }
  private clearTimer(){if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;}
  identity(author:string){this.author=author;}
  newId(){if(this.disposed||!this.author||this.readOnly)throw Error('La pizarra está en solo lectura.');return `${this.author}:${crypto.randomUUID()}`;}
  get sequence(){return this.seq;}
  get pendingCount(){return this.pending.size;}
  get historySize(){return this.undoStack.length;}
  get isReadOnly(){return this.readOnly;}
  setReadOnly(value:boolean){
    if(this.disposed)return;
    if(value&&this.gesture)this.finishGesture(false);
    this.readOnly=value;this.adapter.setReadOnly(value);
  }
  setBoard(boardId:BoardId){
    if(this.disposed)return;
    if(boardId===this.boardId)return;
    this.clearTimer();this.boardId=boardId;this.canonical=emptyState();this.pending.clear();this.unsent.clear();this.undoStack=[];this.gesture=null;this.seq=0;this.resyncPending=false;this.setReadOnly(true);this.paint();
  }
  private startGesture():History{return {gestureId:crypto.randomUUID(),items:new Map(),fields:new Map(),orders:new Map(),beforeOrder:[...this.observed.order],sent:false};}
  private record(ops:Op[],before:BoardState,after:BoardState){
    const g=this.gesture!;
    for(const op of ops){
      if(op.kind==='field'){const old=g.fields.get(op.field);g.fields.set(op.field,{before:old?old.before:clone(before.fields[op.field]),after:clone(after.fields[op.field])});}
      else if(op.kind==='order'){const old=g.orders.get(op.id);g.orders.set(op.id,{before:old?old.before:predecessor(g.beforeOrder.includes(op.id)?g.beforeOrder:before.order,op.id),after:predecessor(after.order,op.id)});}
      else{
        let change=g.items.get(op.id);if(!change){change={before:clone(before.items[op.id]),after:undefined,keys:new Set()};g.items.set(op.id,change);}
        change.after=clone(after.items[op.id]);if(op.kind==='add'||op.kind==='update')Object.keys(op.patch).forEach(key=>change.keys.add(key));
      }
    }
    for(const [id,change] of g.orders)change.after=predecessor(after.order,id);
  }
  private enqueue(ops:Op[]){
    for(const op of ops){
      // Only coalesce operations that have never left this client. Sent frames keep their opId/content.
      const candidate=[...this.pending.values()].reverse().find(p=>this.unsent.has(p.opId)&&p.gestureId===op.gestureId&&((op.kind==='update'&&p.kind!=='field'&&p.id===op.id)||(op.kind==='field'&&p.kind==='field'&&p.field===op.field)));
      const previous=candidate&&(op.kind==='field'||candidate.kind==='add'||candidate.kind==='update')?candidate:undefined;
      if(previous){
        const merged:Op=op.kind==='update'&&(previous.kind==='add'||previous.kind==='update')?{...previous,patch:{...previous.patch,...op.patch}}:{...op,opId:previous.opId};
        this.pending.set(previous.opId,merged);
      }else{this.pending.set(op.opId,op);this.unsent.add(op.opId);}
    }
  }
  private local(final:boolean){
    if(this.painting||this.disposed)return;
    if(!this.author||this.readOnly){this.adapter.setState(this.observed);return;}
    const next=this.adapter.getState();this.gesture??=this.startGesture();
    const ops=differences(this.observed,next,this.author,this.adapter.localKeys,this.boardId,this.gesture.gestureId);
    this.record(ops,this.observed,next);this.observed=next;this.enqueue(ops);
    if(final){this.finishGesture(true,ops.length===0);return;}
    if(!this.timer)this.timer=setTimeout(()=>{this.timer=undefined;this.flush();},40);
  }
  private finalOperations(g:History):Op[]{
    const base=()=>({author:this.author,opId:`${this.author}:${crypto.randomUUID()}`,boardId:this.boardId,gestureId:g.gestureId});const ops:Op[]=[];
    for(const [id,change] of g.items){if(!change.after||!present(this.observed,id))continue;const patch=Object.fromEntries([...change.keys].map(key=>[key,clone(this.observed.items[id][key]??null)]));if(Object.keys(patch).length)ops.push({...base(),kind:'update',id,patch});}
    for(const [field] of g.fields)ops.push({...base(),kind:'field',field,value:clone(this.observed.fields[field]??null)});
    for(const [id] of g.orders)if(present(this.observed,id))ops.push({...base(),kind:'order',id,after:predecessor(this.observed.order,id)});
    return ops;
  }
  private finishGesture(send:boolean,forceFinal=true){
    const g=this.gesture;if(!g)return;this.clearTimer();
    if(forceFinal&&g.sent)this.enqueue(this.finalOperations(g));
    const changed=[...g.items.values()].some(c=>!structurallyEqual(c.before,c.after))||[...g.fields.values()].some(c=>!structurallyEqual(c.before,c.after))||[...g.orders.values()].some(c=>c.before!==c.after);
    if(changed){this.undoStack.push(g);if(this.undoStack.length>60)this.undoStack.shift();}
    if(send)this.flush();this.gesture=null;this.paint();
  }
  private flush(){
    if(!this.unsent.size)return;const ops=[...this.unsent].map(id=>this.pending.get(id)!).filter(Boolean);this.unsent.clear();
    if(this.gesture&&ops.some(op=>op.gestureId===this.gesture!.gestureId))this.gesture.sent=true;
    try{this.send(ops);}catch{ops.forEach(op=>this.unsent.add(op.opId));}
  }
  snapshot(state:BoardState,seq:number,boardId:BoardId=this.boardId){
    if(this.disposed)return;
    this.setBoard(boardId);if(seq<this.seq)return;
    this.canonical=clone(state);this.seq=seq;this.resyncPending=false;this.paint();
  }
  receive(ops:Op[]){
    if(this.disposed)return;
    for(const op of ops){
      if(op.boardId!==this.boardId)continue;
      this.pending.delete(op.opId);this.unsent.delete(op.opId);
      if(!Number.isSafeInteger(op.seq)||op.seq!<=this.seq)continue;
      if(this.resyncPending)continue;
      if(op.seq!==this.seq+1){this.resyncPending=true;this.setReadOnly(true);this.options.requestResync?.(this.seq);continue;}
      applyOperation(this.canonical,op);this.seq=op.seq!;
    }
    this.paint();
  }
  reject(){
    if(this.disposed)return;
    const gestures=new Set([...this.pending.values()].map(op=>op.gestureId));
    this.pending.clear();this.unsent.clear();this.clearTimer();this.gesture=null;this.undoStack=this.undoStack.filter(entry=>!gestures.has(entry.gestureId));
    this.resyncPending=true;this.setReadOnly(true);this.paint();this.options.requestResync?.(this.seq);
  }
  resend(){if(this.disposed)return;const ops=[...this.pending.values()];if(ops.length){this.unsent.clear();this.send(ops);}}
  private paint(){
    if(this.painting)return;this.painting=true;
    try{
      const state=copyState(this.canonical);for(const op of this.pending.values())applyOperation(state,op);
      // Server ops always reach canonical state. An active gesture shields only the objects it edits visually.
      if(this.gesture)for(const [id] of this.gesture.items){if(present(this.observed,id)){state.items[id]=this.observed.items[id];if(!state.order.includes(id))state.order.push(id);}else{delete state.items[id];state.order=state.order.filter(key=>key!==id);}}
      if(this.gesture){
        for(const id of new Set([...this.gesture.items.keys(),...this.gesture.orders.keys()]))if(present(state,id)&&present(this.observed,id)){
          const before=this.observed.order.slice(0,this.observed.order.indexOf(id)).reverse().find(key=>present(state,key));
          applyOperation(state,{author:this.author,opId:'visual',boardId:this.boardId,gestureId:this.gesture.gestureId,kind:'order',id,after:before||null});
        }
        for(const [field] of this.gesture.fields)state.fields[field]=this.observed.fields[field];
      }
      for(const key of this.adapter.localKeys)if(Object.hasOwn(this.observed.fields,key))state.fields[key]=this.observed.fields[key];
      this.adapter.setState(state);this.observed=this.adapter.getState();
    }finally{this.painting=false;}
  }
  undo(){
    if(this.readOnly||!this.author)return;if(this.gesture)this.finishGesture(true);
    const entry=this.undoStack.pop();if(!entry)return;
    const state=copyState(this.adapter.getState()),initial=copyState(state),gestureId=crypto.randomUUID(),ops:Op[]=[];
    const base=()=>({author:this.author,opId:`${this.author}:${crypto.randomUUID()}`,boardId:this.boardId,gestureId});
    const emit=(op:Op)=>{if(applyOperation(state,op))ops.push(op);};
    for(const [id,change] of entry.items){
      if(!change.before&&change.after){if(present(state,id)&&structurallyEqual(state.items[id],change.after))emit({...base(),kind:'remove',id});}
      else if(change.before&&!change.after){if(!present(state,id))emit({...base(),kind:'add',id,patch:clone(change.before)});}
      else if(change.before&&change.after&&present(state,id)){
        const patch:Item={};for(const key of change.keys)if(structurallyEqual(state.items[id][key],change.after[key]))patch[key]=clone(change.before[key]??null);
        if(Object.keys(patch).length)emit({...base(),kind:'update',id,patch});
      }
    }
    // Restore removed objects at their original stable-ID position while keeping unrelated objects.
    let previous:string|null=null;for(const id of entry.beforeOrder){if(!present(state,id))continue;const c=entry.items.get(id);if(c?.before&&!c.after&&!present(initial,id))emit({...base(),kind:'order',id,after:previous});previous=id;}
    for(const [field,change] of entry.fields)if(structurallyEqual(state.fields[field],change.after))emit({...base(),kind:'field',field,value:clone(change.before??null)});
    const orders=[...entry.orders.entries()].filter(([id,c])=>present(initial,id)&&predecessor(initial.order,id)===c.after).sort(([a],[b])=>entry.beforeOrder.indexOf(a)-entry.beforeOrder.indexOf(b));
    for(const [id,c] of orders)if(c.before===null||present(state,c.before))emit({...base(),kind:'order',id,after:c.before});
    this.enqueue(ops);this.paint();this.flush();
  }
  dispose(){this.disposed=true;this.readOnly=true;this.clearTimer();this.pending.clear();this.unsent.clear();this.gesture=null;this.unsubscribe();this.adapter.setReadOnly(true);}
}

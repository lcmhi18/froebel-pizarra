import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomEngine,differences,structurallyEqual } from '../../.live-test/unit/live/engine.js';
import { TestBoardAdapter } from '../../.live-test/unit/boards/prueba/adapter.js';
import { applyOperation } from '../../.live-test/unit/shared/operations.js';
import { emptyState,validateOperation } from '../../.live-test/unit/shared/protocol.js';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function setup(t,seed=emptyState()){
 const a=new TestBoardAdapter(),b=new TestBoardAdapter(),canonical=structuredClone(seed),queue=[],requests=[];let seq=0;
 const engines=[];const create=(adapter,author)=>{const engine=new RoomEngine(adapter,ops=>queue.push(...ops.map(op=>({op:structuredClone(op),engine}))),{requestResync:from=>requests.push(from)});engine.identity(author);engine.snapshot(seed,0);engines.push(engine);return engine;};
 const ea=create(a,'teacher'),eb=create(b,'u-student');t.after(()=>engines.forEach(e=>e.dispose()));
 const sent=[];
 function deliver(index=0){while(queue.length){const {op,engine}=queue.splice(index,1)[0];index=0;if(applyOperation(canonical,op)){op.seq=++seq;sent.push(structuredClone(op));engines.forEach(e=>e.receive([op]));}else{engine.reject();engine.snapshot(canonical,seq);engine.setReadOnly(false);}}}
 return {a,b,ea,eb,canonical,queue,deliver,sent,requests,get seq(){return seq;}};
}
const seed=()=>({items:{'teacher:one':{x:0,y:0,fill:'red'}},order:['teacher:one'],fields:{}});
const edit=(adapter,patch,final=true)=>adapter.change(s=>Object.assign(s.items['teacher:one'],patch),final);
test('wire differences are valid v1, property patches and id/after ordering',()=>{
 const before={items:{a:{x:1},b:{x:2},c:{x:3}},order:['a','b','c'],fields:{tool:'move'}};
 const after={items:{...before.items,b:{x:4}},order:['c','a','b'],fields:{tool:'pencil'}};
 const ops=differences(before,after,'teacher',['tool'],'prueba','g');assert(ops.every(validateOperation));assert.deepEqual(ops.map(o=>o.kind),['update','order']);assert.deepEqual(ops[1].after,null);assert.equal(ops[1].id,'c');
 const state=structuredClone(before);ops.forEach(op=>applyOperation(state,op));assert.deepEqual(state.order,after.order);assert.equal(state.items.b.x,4);assert.equal(state.fields.tool,'move');
});
test('newId uses the authenticated public author and never reuses an ID',t=>{
 const {ea}=setup(t);const ids=new Set(Array.from({length:100},()=>ea.newId()));assert.equal(ids.size,100);assert([...ids].every(id=>id.startsWith('teacher:')));
 ea.setReadOnly(true);assert.throws(()=>ea.newId());
});
test('unacknowledged local changes survive unrelated remote patches and converge',t=>{
 const {a,b,ea,queue,deliver,canonical}=setup(t,seed());edit(a,{x:20});edit(b,{y:30});assert.equal(a.getState().items['teacher:one'].x,20);assert.equal(ea.pendingCount,1);
 deliver(1);assert.deepEqual(a.getState(),b.getState());assert.deepEqual(a.getState(),canonical);assert.equal(a.getState().items['teacher:one'].y,30);assert.equal(ea.pendingCount,0);assert.equal(queue.length,0);
 ea.undo();deliver();assert.deepEqual(a.getState().items['teacher:one'],{x:0,y:30,fill:'red'});
});
test('echoes and duplicates acknowledge pending operations once without history entries',t=>{
 const {a,ea,deliver,sent}=setup(t,seed());edit(a,{x:10});deliver();const size=ea.historySize;ea.receive([sent[0],sent[0]]);assert.equal(ea.pendingCount,0);assert.equal(ea.historySize,size);assert.equal(a.getState().items['teacher:one'].x,10);
});
test('undo skips properties overwritten by someone else and preserves their other properties',t=>{
 const {a,b,ea,deliver,queue}=setup(t,seed());edit(a,{x:40,y:40});deliver();edit(b,{x:90,fill:'blue'});deliver();ea.undo();deliver();assert.deepEqual(a.getState().items['teacher:one'],{x:90,y:0,fill:'blue'});assert.deepEqual(a.getState(),b.getState());assert.equal(queue.length,0);
});
test('an active gesture shields its object and lets unrelated remote additions render',t=>{
 const {a,b,ea,eb,deliver}=setup(t,seed());edit(a,{x:20},false);edit(b,{fill:'blue'});deliver();assert.equal(a.getState().items['teacher:one'].fill,'red');
 const id=eb.newId();b.change(s=>{s.items[id]={text:'Alumno'};s.order.push(id);});deliver();assert.equal(a.getState().items[id].text,'Alumno');
 edit(a,{x:30});deliver();assert.equal(a.getState().items['teacher:one'].fill,'blue');assert.equal(ea.historySize,1);
 ea.undo();deliver();assert.deepEqual(a.getState().items['teacher:one'],{x:0,y:0,fill:'blue'});assert.equal(a.getState().items[id].text,'Alumno');assert.deepEqual(a.getState(),b.getState());
});
test('drag/slider frames throttle at 40ms, keep one gestureId and always send a final frame',async t=>{
 const {a,ea,deliver,sent,queue}=setup(t,seed());for(let x=1;x<=20;x++)edit(a,{x},false);assert.equal(queue.length,0);
 await pause(55);assert.equal(queue.length,1);deliver();edit(a,{x:30},false);await pause(55);deliver();a.change(()=>{},true);assert.equal(queue.length,1);deliver();
 assert.equal(sent.length,3);assert.equal(new Set(sent.map(op=>op.gestureId)).size,1);assert.equal(sent.at(-1).patch.x,30);assert.equal(ea.historySize,1);ea.undo();deliver();assert.equal(a.getState().items['teacher:one'].x,0);
});
test('clearing remote objects is undone using exactly the same IDs and original order',t=>{
 const initial={items:{'u-student:a':{text:'A'},'u-student:b':{text:'B'},'teacher:c':{text:'C'}},order:['u-student:b','teacher:c','u-student:a'],fields:{}};
 const {a,b,ea,deliver,sent}=setup(t,initial);a.change(s=>{s.items={};s.order=[];});deliver();ea.undo();deliver();assert.deepEqual(a.getState(),initial);assert.deepEqual(a.getState(),b.getState());assert(sent.filter(op=>op.kind==='add').every(op=>Object.hasOwn(initial.items,op.id)&&op.author==='teacher'));
});
test('undo does not recreate an updated object another user has removed',t=>{
 const {a,b,ea,deliver,queue}=setup(t,seed());edit(a,{x:7});deliver();b.change(s=>{delete s.items['teacher:one'];s.order=[];});deliver();ea.undo();assert.equal(queue.length,0);assert.equal(ea.historySize,0);assert.equal(a.getState().items['teacher:one'],undefined);
});
test('undo of deletion skips an ID already restored by a different user',t=>{
 const {a,b,ea,eb,deliver,queue}=setup(t,seed());a.change(s=>{delete s.items['teacher:one'];s.order=[];});deliver();b.change(s=>{s.items['teacher:one']={x:99};s.order.push('teacher:one');});deliver();ea.undo();assert.equal(queue.length,0);assert.equal(a.getState().items['teacher:one'].x,99);assert.equal(eb.historySize,1);
});
test('undo of insertion does not delete later changes from another user',t=>{
 const {a,b,ea,deliver,queue}=setup(t);const id=ea.newId();a.change(s=>{s.items[id]={x:1};s.order.push(id);});deliver();b.change(s=>{s.items[id].x=2;});deliver();ea.undo();assert.equal(queue.length,0);assert.equal(a.getState().items[id].x,2);
});
test('undo of reordering preserves unrelated later additions',t=>{
 const initial={items:{a:{},b:{},c:{}},order:['a','b','c'],fields:{}};const {a,b,ea,eb,deliver}=setup(t,initial);
 a.change(s=>{s.order=['c','a','b'];});deliver();const id=eb.newId();b.change(s=>{s.items[id]={};s.order.push(id);});deliver();ea.undo();deliver();assert.deepEqual(a.getState().order,['a','b','c',id]);assert.deepEqual(a.getState(),b.getState());
});
test('local UI fields do not leave the browser; object fill remains shared',t=>{
 const {a,b,deliver,queue}=setup(t,seed());a.change(s=>{s.fields.tool='pencil';s.fields.color='green';s.fields.magnet=true;});assert.equal(queue.length,0);edit(b,{fill:'purple'});deliver();assert.equal(a.getState().fields.tool,'pencil');assert.equal(a.getState().items['teacher:one'].fill,'purple');assert.equal(b.getState().fields.tool,undefined);
});
test('readOnly blocks local changes and undo while still accepting remote state',t=>{
 const {a,b,ea,deliver,queue}=setup(t,seed());ea.setReadOnly(true);edit(a,{x:50});ea.undo();assert.equal(queue.length,0);assert.equal(a.getState().items['teacher:one'].x,0);edit(b,{x:8});deliver();assert.equal(a.getState().items['teacher:one'].x,8);
});
test('setState/applyRemote redraw without local onChange or echo',()=>{
 const adapter=new TestBoardAdapter();let events=0;adapter.onChange(()=>events++);adapter.setState(seed());adapter.applyRemote([{kind:'update',id:'teacher:one',patch:{x:5}}]);assert.equal(events,0);assert.equal(adapter.getState().items['teacher:one'].x,5);
});
test('sequence gaps request one resync and never apply frames from another board',t=>{
 const {a,ea,requests}=setup(t,seed());const op={opId:'u-student:gap',author:'u-student',boardId:'prueba',gestureId:'g',kind:'update',id:'teacher:one',patch:{x:2},seq:2};
 ea.receive([{...op,boardId:'other'}]);assert.equal(requests.length,0);ea.receive([op,{...op,seq:3}]);assert.deepEqual(requests,[0]);assert.equal(ea.isReadOnly,true);assert.equal(a.getState().items['teacher:one'].x,0);
 const latest=seed();latest.items['teacher:one'].x=2;ea.snapshot(latest,2);ea.setReadOnly(false);ea.receive([{...op,seq:1}]);assert.equal(a.getState().items['teacher:one'].x,2);assert.equal(ea.sequence,2);
});
test('reconnection snapshot reapplies and resends pending opIds; rejection removes them and requests resync',t=>{
 const {a,ea,queue,requests}=setup(t,seed());edit(a,{x:7});const id=queue[0].op.opId;queue.length=0;ea.setReadOnly(true);ea.snapshot(seed(),0);ea.setReadOnly(false);assert.equal(a.getState().items['teacher:one'].x,7);ea.resend();assert.equal(queue[0].op.opId,id);assert.equal(ea.historySize,1);
 ea.reject();assert.equal(ea.pendingCount,0);assert.equal(ea.historySize,0);assert.equal(ea.isReadOnly,true);assert.deepEqual(requests,[0]);assert.equal(a.getState().items['teacher:one'].x,0);
});
test('history is capped at sixty gestures',t=>{
 const {a,ea,deliver}=setup(t,seed());for(let x=1;x<=65;x++){edit(a,{x});deliver();}assert.equal(ea.historySize,60);for(let i=0;i<60;i++){ea.undo();deliver();}assert.equal(a.getState().items['teacher:one'].x,5);ea.undo();assert.equal(ea.historySize,0);
});
test('structural cache handles reordered keys, nested edits and unchanged item reference sharing',()=>{
 assert.equal(structurallyEqual({b:[1,{x:2}],a:3},{a:3,b:[1,{x:2}]}),true);assert.equal(structurallyEqual({a:[1,2]},{a:[1,3]}),false);
 const adapter=new TestBoardAdapter();adapter.setState({items:{a:{x:1},b:{x:2}},order:['a','b'],fields:{}});const before=adapter.getState();adapter.change(s=>{s.items.a.x=3;});assert.equal(adapter.getState().items.b,before.items.b);assert.notEqual(adapter.getState().items.a,before.items.a);assert.equal(before.items.a.x,1);
});
test('500-object diff stays below 2 ms at p95 with one dirty object',t=>{
 const before=emptyState();for(let i=0;i<500;i++){const id='teacher:'+i;before.items[id]={x:i,y:i*2,fill:'blue',points:[{x:i,y:1},{x:2,y:i}]};before.order.push(id);}
 const after={...before,items:{...before.items,'teacher:250':{...before.items['teacher:250'],x:999}}};for(let i=0;i<100;i++)differences(before,after,'teacher');
 const times=[];for(let i=0;i<300;i++){const start=performance.now();const ops=differences(before,after,'teacher');times.push(performance.now()-start);assert.equal(ops.length,1);}
 times.sort((a,b)=>a-b);const p95=times[Math.floor(times.length*.95)];t.diagnostic('500 items, one dirty: p95='+p95.toFixed(3)+' ms; max='+times.at(-1).toFixed(3)+' ms');assert(p95<2,'Diff p95 exceeded 2 ms: '+p95);
});

test('undo restores all five-object permutations without sending a full order array',t=>{
 const initial={items:{a:{},b:{},c:{},d:{},e:{}},order:['a','b','c','d','e'],fields:{}};
 function permutations(ids){return ids.length?ids.flatMap((id,index)=>permutations(ids.filter((_,i)=>i!==index)).map(tail=>[id,...tail])):[[]];}
 for(const order of permutations(initial.order)){
  const {a,ea,deliver,sent}=setup(t,initial);a.change(state=>{state.order=order;});deliver();ea.undo();deliver();assert.deepEqual(a.getState().order,initial.order,'Order '+order);assert(sent.every(op=>op.kind!=='order'||!Object.hasOwn(op,'value')));
 }
});
test('multiple reorder frames inside one gesture undo to the original order',t=>{
 const initial={items:{a:{},b:{},c:{},d:{},e:{}},order:['a','b','c','d','e'],fields:{}};const {a,ea,deliver}=setup(t,initial);
 a.change(s=>{s.order=['c','a','b','d','e'];},false);a.change(s=>{s.order=['c','e','a','d','b'];});deliver();assert.equal(ea.historySize,1);ea.undo();deliver();assert.deepEqual(a.getState().order,initial.order);
});

test('several unsent reorder frames retain dependencies and converge',t=>{
 const initial={items:{a:{},b:{},c:{},d:{},e:{}},order:['a','b','c','d','e'],fields:{}};
 let random=917;const draw=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
 for(let run=0;run<60;run++){
  const {a,b,ea,deliver}=setup(t,initial);let desired;
  for(let frame=0;frame<4;frame++){desired=[...initial.order];for(let i=desired.length-1;i>0;i--){const j=Math.floor(draw()*(i+1));[desired[i],desired[j]]=[desired[j],desired[i]];}a.change(s=>{s.order=desired;},false);}
  a.change(()=>{},true);deliver();assert.deepEqual(a.getState().order,desired);assert.deepEqual(b.getState().order,desired);ea.undo();deliver();assert.deepEqual(a.getState().order,initial.order);
 }
});

test('disposed engines ignore late snapshots/echoes and never send a scheduled drag',async t=>{
 const {a,ea,queue}=setup(t,seed());edit(a,{x:8},false);ea.dispose();const state=structuredClone(a.getState());
 ea.snapshot(emptyState(),10);ea.setReadOnly(false);ea.receive([{opId:'u-student:late',author:'u-student',boardId:'prueba',gestureId:'g',kind:'remove',id:'teacher:one',seq:1}]);ea.resend();await pause(55);
 assert.equal(queue.length,0);assert.deepEqual(a.getState(),state);assert.equal(ea.isReadOnly,true);assert.throws(()=>ea.newId());
});

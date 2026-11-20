import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NumberLineAdapter} from '../../.live-test/unit/boards/recta-numerica/adapter.js';
import {RoomEngine} from '../../.live-test/unit/live/engine.js';
import {boardOperationError} from '../../.live-test/unit/shared/permissions.js';
test('student pin commits omit protected default fields and keep the strict pin wire schema',()=>{
 const adapter=new NumberLineAdapter('student');let frames=[],seq=0;
 const engine=new RoomEngine(adapter,ops=>{frames.push(...ops);engine.receive(ops.map(op=>({...op,seq:++seq})))},{boardId:'recta-numerica'});
 engine.identity('u-student');engine.snapshot({items:{},order:[],fields:{}},0);engine.setReadOnly(false);
 const model=adapter.getModel(),id=engine.newId();model.pins.push({id,t:'pin',n:3,v:5});adapter.commit(model);
 assert.equal(frames.length,1);assert.equal(frames[0].kind,'add');assert.deepEqual(frames[0].patch,{t:'pin',n:3,v:5});
 assert.equal(boardOperationError('recta-numerica','student',frames[0],{items:{},order:[],fields:{}}),null);
 assert.deepEqual(adapter.getState().fields,{});
 assert.equal(adapter.commit({...adapter.getModel(),fs:24}),false);assert.equal(adapter.commit({...adapter.getModel(),note:[{k:'t',v:'No permitido'}]}),false);
 engine.dispose();
});
test('remote state redraws without echo and a paused adapter refuses changes',()=>{
 const adapter=new NumberLineAdapter('teacher');let changes=0,renders=0;adapter.onChange(()=>changes++);adapter.subscribe(()=>renders++);
 adapter.setState({items:{'teacher:p':{t:'pin',n:-3,v:-3}},order:['teacher:p'],fields:{a:4,note:[{k:'t',v:'Nota'}],fs:22}});
 assert.equal(changes,0);assert.equal(renders,1);assert.equal(adapter.getModel().pins[0].n,-3);
 assert.equal(adapter.commit({...adapter.getModel(),a:5}),false);assert.equal(adapter.getModel().a,4);
 adapter.setReadOnly(false);assert.equal(adapter.canEditNotes,true);adapter.commit({...adapter.getModel(),a:5});assert.equal(changes,1);
});

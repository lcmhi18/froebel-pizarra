import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shapeHandles,moveGraphShape,resizeGraphShape,hitGraphShape,validGraphShape} from '../../src/boards/intervalos/shapes.js';
import {validLesson} from '../../src/boards/intervalos/model.js';
const shape={t:'shape',kind:'rect',c:'#082783',w:5,a:1,fill:'#7fd4ff',opacity:0,x1:.2,y1:.3,x2:.5,y2:.7};
test('transparent and colored fills are valid; unsafe styles and coordinates are refused',()=>{
 assert.ok(validGraphShape(shape));assert.ok(validGraphShape({...shape,kind:'ellipse',opacity:.45}));
 for(const change of [{fill:'url(x)'},{opacity:-.1},{opacity:1.1},{x2:2},{y1:NaN},{kind:'path'},{x2:.1}])assert.equal(validGraphShape({...shape,...change}),false);
});
test('eight handles resize width and height independently without losing appearance',()=>{
 assert.equal(shapeHandles(shape).length,8);
 const wide=resizeGraphShape(shape,3,[.8,.5]);assert.equal(wide.x2,.8);assert.equal(wide.y1,.3);assert.equal(wide.y2,.7);assert.equal(wide.opacity,0);
 const high=resizeGraphShape(shape,5,[.3,.9]);assert.equal(high.y2,.9);assert.equal(high.x1,.2);assert.equal(high.x2,.5);
 const flipped=resizeGraphShape(shape,0,[.8,.9]);assert.ok(validGraphShape(flipped));
});
test('moving stays on the canvas and preserves dimensions; ellipse hit testing respects corners',()=>{
 const moved=moveGraphShape(shape,5,-4);assert.ok(Math.abs(moved.x2-1)<1e-9);assert.equal(moved.y1,0);assert.ok(Math.abs((moved.x2-moved.x1)-.3)<1e-9);
 assert.equal(hitGraphShape({...shape,kind:'ellipse'},[.35,.5],1000,500),true);assert.equal(hitGraphShape({...shape,kind:'ellipse'},[.2,.3],1000,500),false);
});
test('mixed graph drawing snapshots retain editable shapes for the room',()=>{
 const lesson={expression:'[1;4]',topic:0,shown:1,prof:false,work:'',strokes:[],graph:{rows:[{a:1,b:4,L:'c',R:'c',on:true}],operation:'n'},graphInk:[shape,{c:'#123abc',w:5,a:1,p:[[.1,.2],[.3,.4]]}],formulas:[]};
 assert.equal(validLesson(lesson),true);assert.equal(validLesson({...lesson,graphInk:[{...shape,opacity:2}]}),false);
});

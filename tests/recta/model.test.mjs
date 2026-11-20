import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,formatNumber,adjustMarks,addPin,movePin,removePin,clearLine,adjustFont,columnAt,placementMessage} from '../../src/boards/recta-numerica/model.js';

test('initial board has ten marks on either side and no challenge state',()=>{
 assert.deepEqual(initialState(),{a:10,b:10,fs:18,note:[],pins:[]});
 assert.deepEqual([-3,0,7].map(formatNumber),['−3','0','+7']);
});
test('a formed number may be placed on the wrong mark and keeps its own value',()=>{
 const state=addPin(initialState(),-3,5,'pin-1');
 assert.deepEqual(state.pins,[{id:'pin-1',t:'pin',n:-3,v:5}]);
 assert(placementMessage(-3,5,10,10).includes('a la izquierda'));
 assert(placementMessage(3,3,10,10).includes('¡Bien!'));
 assert(placementMessage(99,5,10,10).includes('no cabe'));
});
test('pins move without changing their identity or formed number and can be removed',()=>{
 const start=addPin(initialState(),7,3,'pin-1');const moved=movePin(start,'pin-1',-2);
 assert.deepEqual(moved.pins,[{id:'pin-1',t:'pin',n:7,v:-2}]);
 assert.equal(start.pins[0].v,3);assert.equal(removePin(moved,'pin-1').pins.length,0);
});
test('reducing marks removes only pins outside the new range and always leaves a mark',()=>{
 let state=addPin(addPin(initialState(),-7,-7,'outside'),2,2,'inside');state=adjustMarks(state,'a',-7);
 assert.equal(state.a,3);assert.deepEqual(state.pins.map(pin=>pin.id),['inside']);
 state=adjustMarks(state,'a',-3);state=adjustMarks(state,'b',-10);
 assert(state.a+state.b>=1);
 assert.equal(adjustMarks(initialState(),'b',99).b,20);
});
test('cleaning resets pins and marks while preserving notes and font size',()=>{
 const note=[{k:'t',v:'No borrar mis notas'}],before={...addPin(initialState(),2,2,'pin'),a:3,b:4,fs:28,note};
 assert.deepEqual(clearLine(before),{a:10,b:10,fs:28,note,pins:[]});
});
test('font changes by two and remains between twelve and seventy-two',()=>{
 assert.equal(adjustFont(initialState(),2).fs,20);assert.equal(adjustFont({...initialState(),fs:12},-2).fs,12);
 assert.equal(adjustFont({...initialState(),fs:72},2).fs,72);
});
test('drop coordinates include vertical tolerance and respect unequal negative/positive ranges',()=>{
 const rect={left:100,right:1200,top:100,bottom:440,width:1100};
 assert.equal(columnAt(rect,3,7,100,80),-3);assert.equal(columnAt(rect,3,7,450,200),0);
 assert.equal(columnAt(rect,3,7,1200,480),7);assert.equal(columnAt(rect,3,7,450,29),null);
 assert.equal(columnAt(rect,3,7,99,200),null);assert.equal(columnAt({...rect,width:0},3,7,400,200),null);
});
test('invalid values, duplicate IDs and more than two hundred pins are refused',()=>{
 const start=initialState();assert.equal(addPin(start,100,2,'bad'),start);assert.equal(addPin(start,2,99,'bad'),start);
 let state=addPin(start,2,2,'first');assert.equal(addPin(state,3,3,'first'),state);
 for(let i=1;i<200;i++)state=addPin(state,1,1,'pin-'+i);
 assert.equal(state.pins.length,200);assert.equal(addPin(state,1,1,'extra'),state);
});
test('solo page has a separate entry, local fonts and delegated events without unsafe HTML sinks',()=>{
 const html=readFileSync('src/boards/recta-numerica/index.html','utf8'),script=readFileSync('src/boards/recta-numerica/main.js','utf8');
 assert(html.includes('id="live-slot"'));assert(html.includes('./main.js'));
 assert(!/on(?:click|input|pointer\w+)\s*=/i.test(html));assert(!/\.innerHTML\s*=/.test(script));
 assert(script.includes('@fontsource/fredoka/latin-400.css'));assert(!/fonts\.googleapis|localStorage|sessionStorage|elementFromPoint/.test(html+script));
});

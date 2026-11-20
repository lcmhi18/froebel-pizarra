import {test} from 'node:test';
import assert from 'node:assert/strict';
import {operationFrames} from '../../.live-test/unit/shared/transport.js';
import {parseClientFrame} from '../../.live-test/unit/shared/protocol.js';
const op=value=>({opId:'teacher:large',author:'teacher',boardId:'recta-numerica',gestureId:'note',kind:'field',field:'note',value:[{k:'t',v:value}]});
test('large note frames retain Unicode, respect frame limits and parse through the real protocol',()=>{
 const operation=op('🐸\nÁlgebra\u0000'.repeat(15000)),frames=operationFrames(operation);
 assert(frames.length>1);
 for(const frame of frames){assert(new TextEncoder().encode(JSON.stringify(frame)).length<=64000);assert.equal(parseClientFrame(JSON.stringify(frame)).ok,true);assert(!/[\uD800-\uDBFF]$/.test(frame.data));}
 assert.deepEqual(JSON.parse(frames.map(frame=>frame.data).join('')),{type:'ops',ops:[operation]});
 assert.deepEqual(operationFrames(op('Breve')),[{type:'ops',ops:[op('Breve')]}]);
 assert.throws(()=>operationFrames(op('x'.repeat(1200000))));
});

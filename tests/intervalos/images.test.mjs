import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validGraphImage} from '../../src/boards/intervalos/images.js';
import {validLesson} from '../../src/boards/intervalos/model.js';
import {moveGraphShape,resizeGraphShape,hitGraphShape} from '../../src/boards/intervalos/shapes.js';
const src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0F8AAAAASUVORK5CYII=';
const image={t:'image',src,x1:.1,y1:.2,x2:.6,y2:.8};
const lesson={expression:'[1;4]',topic:0,shown:1,prof:false,work:'',strokes:[],graph:{rows:[{a:1,b:4,L:'c',R:'c',on:true}],operation:'n'},graphInk:[image],formulas:[]};
test('raster images validate; remote sources, SVG and invalid dimensions do not',()=>{
 assert.equal(validGraphImage(image),true);assert.equal(validLesson(lesson),true);
 for(const change of [{src:'https://example.com/image.png'},{src:'data:image/svg+xml;base64,PHN2Zz4='},{src:'data:image/png;base64,YWJjZA=='},{x2:2},{y2:.1},{extra:'x'}])assert.equal(validGraphImage({...image,...change}),false);
});
test('image width and height resize independently while image data is retained',()=>{
 const resized=resizeGraphShape(image,3,[.9,.5]);assert.equal(resized.x2,.9);assert.equal(resized.y1,.2);assert.equal(resized.y2,.8);assert.equal(resized.src,src);assert.equal(validGraphImage(resized),true);
 const moved=moveGraphShape(image,.1,-.1);assert.equal(moved.src,src);assert.equal(validGraphImage(moved),true);assert.equal(hitGraphShape(image,[.1,.2],1000,500),true);
});
test('image payloads exceeding one message remain valid but obey the lesson budget',()=>{
 const large={...image,src:'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(100000)]).toString('base64')};
 assert.equal(validLesson({...lesson,graphInk:[large]}),true);assert.equal(validLesson({...lesson,graphInk:Array(7).fill(large)}),false);
});

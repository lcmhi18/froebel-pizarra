import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildSteps,parse,tokenText,priority} from '../../src/boards/operaciones-combinadas/engine.js';
const cases=[['30 − [12 − (5 × 3 − 20)]',13],['−2 × {3 − [17 − 5 × 2 − 32 ÷ 8 − (74 ÷ 2 − 7)]}',-60],['−8 + 5 × (−4) − 12 ÷ (−3)',-24],['3 × 2 − 7 + 5 × (12 − 20)',-41],['5(12 − 20)',-40],['−(13 − 24)',11],['12 − (−5)',17],['48 / 4 * 3',36],['2[3+4]{5-3}',28],['(2+3)4',20],['−−3 + 2',5],['123456789012345678901234567890 + 1','123456789012345678901234567891']];
for(const [expression,expected]of cases)test('resolves '+expression,()=>assert.equal(String(buildSteps(expression).result),String(expected)));
for(const expression of ['(3 + 2','5 +','7 ÷ 2','3 $ 4','[]','[3+2)','3 4','2a+3','12x','1/0','()','3.5+2'])test('rejects '+expression,()=>assert.throws(()=>buildSteps(expression)));
test('groups are removed in their own step and negative operands retain readable parentheses',()=>{
 const {steps}=buildSteps('30-[12-(5*3-20)]');assert.equal(steps.length,7);
 assert(steps.some(s=>s.message.includes('Lo dejamos libre')));
 const tokens=parse('12 - -5');assert.equal(tokenText(tokens[2],tokens[1]),'(−5)');
 assert.equal(priority(parse('3+4')).active.md,false);assert(priority(parse('−(4−2)')).active.sign);
 assert.throws(()=>buildSteps('1+(2+(3+4))',2),/más de 2 pasos/);
});
test('two hundred generated expressions agree with an independently evaluated arithmetic expression',()=>{
 let seed=73;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed};
 function make(depth){if(!depth)return String(random()%15-7);const a=make(depth-1),b=make(depth-1);return `(${a} ${['+','-','*'][random()%3]} ${b})`;}
 for(let i=0;i<200;i++){const original=make(3),expected=Function('return '+original)();const grouped=original.replaceAll('(','[').replaceAll(')',']');assert.equal(Number(buildSteps(grouped).result),expected||0);}
});
test('highlights only new results and identifies applicable priorities',()=>{const {steps}=buildSteps('2*3+4*5');assert.deepEqual(steps[1].highlight,[0,2]);assert.equal(String(steps.at(-1).tokens[0].v),'26');assert.deepEqual(priority(parse('{[3+(2)]}')).active,{'(':true,'[':true,'{':true,md:false,as:true,sign:false});});

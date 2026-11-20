import {test} from 'node:test';
import assert from 'node:assert/strict';
import {uiHarness} from './ui-harness.mjs';
function form(h,sign,digit){h.click(h.find(`[data-sign="${sign}"]`));h.click(h.find(`[data-key="${digit}"]`));}
test('actual keypad and mark click place the formed number; pin tap removes it',()=>{
 const h=uiHarness();form(h,'−',3);h.click(h.find('[data-value="2"]'));
 const pin=h.inspect().state.pins[0];assert.equal(pin.n,-3);assert.equal(pin.v,2);assert(h.inspect().message.includes('a la izquierda'));
 const target=h.find('[data-pin]');h.pointer('pointerdown',target,600,200);h.pointer('pointerup',target,600,200);assert.equal(h.inspect().state.pins.length,0);
});
test('token drag places a pin, moving outside restores it, dropping on keypad removes it',()=>{
 const h=uiHarness();form(h,'+',7);const token=h.find('#formed-token');h.pointer('pointerdown',token,1400,180);h.pointer('pointermove',token,850,220);h.pointer('pointerup',token,850,220);
 assert.equal(h.inspect().state.pins.length,1);const pin=h.inspect().state.pins[0];
 let target=h.find('[data-pin]');h.pointer('pointerdown',target,850,220);h.pointer('pointermove',target,450,220);h.pointer('pointerup',target,10,800);
 assert.equal(h.inspect().state.pins[0].v,pin.v);
 target=h.find('[data-pin]');h.pointer('pointerdown',target,850,220);h.pointer('pointermove',target,1400,220);h.pointer('pointerup',target,1400,220);assert.equal(h.inspect().state.pins.length,0);
});
test('cleaning requires confirmation, resets the line and preserves typed notes and font',()=>{
 const h=uiHarness();h.input('Mis notas');h.click(h.id('font-larger'));form(h,'+',3);h.click(h.find('[data-value="3"]'));h.click(h.id('a-1'));
 h.click(h.id('clear-line'));assert.equal(h.id('clear-dialog').open,true);assert.equal(h.inspect().state.pins.length,1);
 h.click(h.id('confirm-clear'));const state=h.inspect().state;assert.equal(state.pins.length,0);assert.equal(state.a,10);assert.equal(state.b,10);assert.equal(state.fs,20);assert.equal(state.note[0].v,'Mis notas');
 assert.equal(h.id('number-note').textContent,'Mis notas');
});
test('forming a number remains local; notes debounce and echoes preserve the editor nodes',()=>{
 const h=uiHarness();form(h,'+',7);assert.equal(h.sent.length,0);
 h.input('A');h.tick(100);h.input('AB');h.click(h.id('a-1'));
 assert(!h.sent.some(op=>op.field==='note'));h.tick(299);assert.equal(h.adapter.getState().fields.note,undefined);
 h.tick(1);assert.equal(h.adapter.getState().fields.note[0].v,'AB');
 const editor=h.id('number-note'),text=editor.childNodes[0];h.adapter.setState(structuredClone(h.adapter.getState()));assert.equal(editor.childNodes[0],text);h.dispose();
});
test('student notes and font controls are read-only; pause blocks the keypad and line',()=>{
 const h=uiHarness('student',true);assert.equal(h.id('number-note').contentEditable,'false');assert.equal(h.id('font-larger').disabled,true);
 h.click(h.id('font-larger'));assert.equal(h.inspect().state.fs,18);
 h.adapter.setReadOnly(true);form(h,'+',3);h.click(h.find('[data-value="3"]'));assert.equal(h.inspect().state.pins.length,0);assert.equal(h.sent.length,0);h.dispose();
});

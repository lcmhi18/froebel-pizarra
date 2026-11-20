import {expect,it} from 'vitest';
import {boardOperationError,boardStateError,validNoteImage,validNote} from '../../src/shared/permissions';
import {emptyState,type Op} from '../../src/shared/protocol';
const op=(data:Record<string,unknown>)=>({opId:'teacher:1',author:'teacher',boardId:'recta-numerica',gestureId:'g',...data} as Op);
const check=(data:Record<string,unknown>,role:'teacher'|'student'='teacher')=>boardOperationError('recta-numerica',role,op(data),emptyState());
it('recta schema permits only pin adds and v-only movement for both roles',()=>{
 for(const role of ['teacher','student'] as const){
  expect(check({kind:'add',id:'p',patch:{t:'pin',n:-99,v:20}},role)).toBeNull();
  for(const patch of [{t:'pin',n:100,v:0},{t:'pin',n:1,v:99},{t:'text',n:1,v:0},{t:'pin',n:1,v:0,html:'x'}])expect(check({kind:'add',id:'p',patch},role)).toBe('BAD_MESSAGE');
  expect(check({kind:'update',id:'p',patch:{v:-20}},role)).toBeNull();
  for(const patch of [{n:5},{v:0,n:5},{v:0.5},{}])expect(check({kind:'update',id:'p',patch},role)).toBe('BAD_MESSAGE');
 }
});
it('notes and font are teacher-only; allowed numeric fields have strict ranges',()=>{
 expect(check({kind:'field',field:'note',value:[]},'student')).toBe('FORBIDDEN');
 expect(check({kind:'field',field:'fs',value:18},'student')).toBe('FORBIDDEN');
 for(const fs of [12,18,72])expect(check({kind:'field',field:'fs',value:fs})).toBeNull();
 for(const fs of [11,13,74,'18'])expect(check({kind:'field',field:'fs',value:fs})).toBe('BAD_MESSAGE');
 for(const value of [-1,21,0.5,'3'])expect(check({kind:'field',field:'a',value},'student')).toBe('BAD_MESSAGE');
 expect(check({kind:'field',field:'a',value:3},'student')).toBeNull();
});
it('notes are plain blocks with supported image headers and a 300 KB bound',()=>{
 expect(validNote([{k:'t',v:'<b>Esto es texto plano</b>'}])).toBe(true);
 expect(validNote([{k:'t',v:'texto',html:'<script>'}])).toBe(false);
 expect(validNoteImage('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
 expect(validNoteImage('data:image/jpeg;base64,iVBORw0KGgo=')).toBe(false);
 expect(validNoteImage('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
 expect(validNoteImage('https://example.com/image.png')).toBe(false);
 expect(validNoteImage('data:image/png;base64,'+btoa('\x89PNG\r\n\x1a\n'+'x'.repeat(400*1024)))).toBe(false);
});
it('a batch must leave at least one mark and no more than 200 pins',()=>{
 const state=emptyState();state.fields={a:0,b:0};expect(boardStateError('recta-numerica',state)).toBe('BAD_MESSAGE');
 state.fields.b=1;expect(boardStateError('recta-numerica',state)).toBeNull();
 for(let i=0;i<201;i++)state.items['p'+i]={t:'pin',n:1,v:1};
 expect(boardStateError('recta-numerica',state)).toBe('STATE_TOO_LARGE');
 expect(boardStateError('geometria',state)).toBeNull();
});

import { describe,it,expect } from 'vitest';
import { BOARD_IDS,CLOSE_CODES,ERROR_CODES,LIMITS,parseClientFrame,sanitizeFirstName,validateOperation } from '../../src/shared/protocol';

const studentId='11111111-1111-4111-8111-111111111111';
const base={opId:'a:1',author:'a',boardId:'prueba',gestureId:'gesture:1'};
const parse=(value:unknown)=>parseClientFrame(JSON.stringify(value));
describe('protocol v1 boundary',()=>{
  it('has a closed list of boards, errors and close codes',()=>{
    expect(BOARD_IDS).toEqual(['prueba','_plantilla','geometria','konva']);expect(ERROR_CODES).toHaveLength(12);
    expect(CLOSE_CODES.REPLACED_SESSION).toBe(4005);expect(CLOSE_CODES.AUTH_TIMEOUT).toBe(4008);
  });
  it('accepts valid teacher/student hello and controls',()=>{
    for(const m of [{type:'hello',v:1,role:'teacher',token:'a'.repeat(64)},{type:'hello',v:1,role:'student',name:'Ana'},{type:'hello',v:1,role:'student',studentId},{type:'accept',studentId},{type:'reject',studentId},{type:'kick',studentId},{type:'close_room'},{type:'teacher_leaving'},{type:'resync_request',fromSeq:0},{type:'set_board',boardId:'prueba'}])expect(parse(m).ok).toBe(true);
    expect(parseClientFrame('ping')).toEqual({ok:true,value:{type:'ping'}});
  });
  it('rejects wrong protocol version, unknown boards and spoofed extra keys',()=>{
    expect(parse({type:'hello',v:2,role:'teacher',token:'a'.repeat(64)})).toEqual({ok:false,code:'PROTOCOL_VERSION'});
    expect(parse({type:'set_board',boardId:'../../admin'})).toEqual({ok:false,code:'UNKNOWN_BOARD'});
    expect(parse({type:'hello',v:1,role:'student',name:'Ana',token:'a'.repeat(64)}).ok).toBe(false);
    expect(parse({type:'close_room',role:'teacher'}).ok).toBe(false);
    expect(parse({type:'resync_request',fromSeq:-1}).ok).toBe(false);
  });
  it('validates all operation kinds and rejects client-assigned seq',()=>{
    for(const op of [{...base,kind:'add',id:'a:2',patch:{color:'red',points:[{x:3,y:4}]}},{...base,kind:'update',id:'a:2',patch:{color:'blue'}},{...base,kind:'remove',id:'a:2'},{...base,kind:'order',id:'a:2',after:null},{...base,kind:'field',field:'angle',value:45}])expect(validateOperation(op)).toBe(true);
    expect(validateOperation({...base,kind:'order',id:'a:2',after:'a:2'})).toBe(false);
    expect(validateOperation({...base,seq:999,kind:'remove',id:'a:2'})).toBe(false);
    expect(validateOperation({...base,kind:'order',value:['a:2']})).toBe(false);
  });
  it('never throws on malformed messages, pollution, binary frames or size overflow',()=>{
    for(const input of ['{','null','[]','42','{"type":"ping","__proto__":{}}',new ArrayBuffer(4),'x'.repeat(LIMITS.clientBytes+1)])expect(parseClientFrame(input)).toEqual({ok:false,code:'BAD_MESSAGE'});
    expect(parse({type:'ops',ops:[{...base,kind:'add',id:'a:2',patch:JSON.parse('{"constructor":{}}')}]}).ok).toBe(false);
    expect(parse({type:'ops',ops:[]} ).ok).toBe(false);
  });
  it('checks byte size rather than string length and caps burst size',()=>{
    expect(parseClientFrame(JSON.stringify({type:'hello',v:1,role:'student',name:'😀'.repeat(20000)})).ok).toBe(false);
    expect(parse({type:'ops',ops:Array.from({length:121},()=>({...base,kind:'remove',id:'a:2'}))}).ok).toBe(false);
  });
  it('sanitizes names as text and preserves complete Unicode characters',()=>{
    expect(sanitizeFirstName(' <b>Ana</b>\u0000 ')).toBe('Ana');
    expect(Array.from(sanitizeFirstName('😀'.repeat(30)))).toHaveLength(24);
  });
});

import { BOARD_MANIFEST } from '../boards/manifest';
import type { BoardState, Item } from './protocol';

export const PROTOCOL_VERSION = 1 as const;
export const BOARD_IDS = BOARD_MANIFEST.map(board => board.id);
export type BoardId = typeof BOARD_MANIFEST[number]['id'];
export const ERROR_CODES = ['FORBIDDEN','BAD_AUTH','BAD_MESSAGE','ROOM_FULL','PENDING_FULL','RATE_LIMITED','STATE_TOO_LARGE','NOT_ACTIVE','PAUSED','UNKNOWN_BOARD','PROTOCOL_VERSION','NOT_FOUND'] as const;
export type ErrorCode = typeof ERROR_CODES[number];
export const CLOSE_CODES = { REMOVED:4001, ROOM_CLOSED:4002, REJECTED:4003, REPLACED_SESSION:4005, BAD_AUTH:4006, ABUSE:4007, AUTH_TIMEOUT:4008, PROTOCOL_VERSION:4009 } as const;
export const LIMITS = { clientBytes:65536, snapshotChunkBytes:32768, stateBytes:1048576, active:5, pending:10, opsPerSecond:60, opsBurst:120, authTimeoutMs:5000, teacherGraceMs:60000 } as const;
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const isRoomCode = (value:unknown):value is string => typeof value === 'string' && /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(value);
export const isBoardId = (value:unknown):value is BoardId => typeof value === 'string' && (BOARD_IDS as readonly string[]).includes(value);

type OpBase = { opId:string; author:string; seq?:number; boardId:BoardId; gestureId:string };
export type Op = OpBase & (
  | {kind:'add'|'update';id:string;patch:Item}
  | {kind:'remove';id:string}
  | {kind:'order';id:string;after:string|null}
  | {kind:'field';field:string;value:unknown}
);
export type ClientMessage =
  | {type:'hello';v:1;role:'teacher';token:string}
  | {type:'hello';v:1;role:'student';studentId?:string;name?:string}
  | {type:'ping'} | {type:'ops';ops:Op[]}
  | {type:'resync_request';fromSeq:number}
  | {type:'accept'|'reject'|'kick';studentId:string}
  | {type:'set_board';boardId:BoardId}
  | {type:'close_room'|'teacher_leaving'};
export type RosterEntry = {studentId:string;name:string};
export type ServerMessage =
  | {type:'joined';studentId?:string;status:'pending'|'active';author:string}
  | {type:'waiting'}
  | {type:'roster';pending:RosterEntry[];active:RosterEntry[];count:number}
  | {type:'snapshot_start';snapshotId:string;boardId:BoardId;seq:number;chunks:number}
  | {type:'snapshot_chunk';snapshotId:string;index:number;data:string}
  | {type:'snapshot_end';snapshotId:string;boardId:BoardId;seq:number}
  | {type:'ops';ops:Op[]}
  | {type:'board_changed';boardId:BoardId}
  | {type:'paused';reason:'teacher_disconnected'} | {type:'resumed'}
  | {type:'error';code:ErrorCode;ref?:string}
  | {type:'kicked';reason:'REMOVED'|'REJECTED'} | {type:'closed'};
export type Snapshot = {boardId:BoardId;state:BoardState;seq:number};
export type Validation<T> = {ok:true;value:T}|{ok:false;code:ErrorCode};
const bad = ():Validation<never> => ({ok:false,code:'BAD_MESSAGE'});
const record = (x:unknown):x is Record<string,unknown> => !!x && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;
const safeKey = (x:unknown):x is string => typeof x === 'string' && /^[\w:.-]{1,160}$/.test(x) && !['__proto__','constructor','prototype'].includes(x);
const keys = (o:Record<string,unknown>,allowed:readonly string[]) => Object.keys(o).every(key=>allowed.includes(key));
const uuid = (x:unknown):x is string => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const seq = (x:unknown):x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
function jsonValue(x:unknown,depth=0):boolean {
  if(depth>16)return false;
  if(x===null||typeof x==='boolean'||typeof x==='string')return true;
  if(typeof x==='number')return Number.isFinite(x);
  if(Array.isArray(x))return x.every(value=>jsonValue(value,depth+1));
  return record(x)&&Object.keys(x).every(key=>!['__proto__','constructor','prototype'].includes(key)&&jsonValue(x[key],depth+1));
}
export function sanitizeFirstName(name:string):string {
  return Array.from(name.replace(/<[^>]*>/g,'').replace(/\p{C}/gu,'').trim()).slice(0,24).join('');
}
export function validateOperation(value:unknown):value is Op {
  if(!record(value)||!safeKey(value.opId)||!safeKey(value.author)||!safeKey(value.gestureId)||!isBoardId(value.boardId))return false;
  const base=['opId','author','boardId','gestureId','kind']; // Client-supplied seq is not authority.
  switch(value.kind){
    case 'add':case 'update':return keys(value,[...base,'id','patch'])&&safeKey(value.id)&&record(value.patch)&&Object.keys(value.patch).every(safeKey)&&jsonValue(value.patch);
    case 'remove':return keys(value,[...base,'id'])&&safeKey(value.id);
    case 'order':return keys(value,[...base,'id','after'])&&safeKey(value.id)&&(value.after===null||safeKey(value.after))&&value.after!==value.id;
    case 'field':return keys(value,[...base,'field','value'])&&safeKey(value.field)&&jsonValue(value.value);
    default:return false;
  }
}
export function validateClientMessage(message:unknown):Validation<ClientMessage> {
  if(!record(message))return bad();
  switch(message.type){
    case 'hello':
      if(message.v!==PROTOCOL_VERSION)return {ok:false,code:'PROTOCOL_VERSION'};
      if(message.role==='teacher'){
        if(!keys(message,['type','v','role','token'])||typeof message.token!=='string'||!/^[a-f0-9]{64}$/.test(message.token))return bad();
      }else if(message.role==='student'){
        if(!keys(message,['type','v','role','studentId','name'])||(message.studentId!==undefined&&!uuid(message.studentId))||(message.name!==undefined&&(typeof message.name!=='string'||!sanitizeFirstName(message.name))))return bad();
        if(!message.studentId&&!message.name)return bad();
      }else return bad();
      break;
    case 'ping':case 'close_room':case 'teacher_leaving':if(!keys(message,['type']))return bad();break;
    case 'resync_request':if(!keys(message,['type','fromSeq'])||!seq(message.fromSeq))return bad();break;
    case 'accept':case 'reject':case 'kick':if(!keys(message,['type','studentId'])||!uuid(message.studentId))return bad();break;
    case 'set_board':
      if(!keys(message,['type','boardId']))return bad();
      if(!isBoardId(message.boardId))return {ok:false,code:'UNKNOWN_BOARD'};
      break;
    case 'ops':if(!keys(message,['type','ops'])||!Array.isArray(message.ops)||message.ops.length<1||message.ops.length>LIMITS.opsBurst||!message.ops.every(validateOperation))return bad();break;
    default:return bad();
  }
  return {ok:true,value:message as ClientMessage};
}
export function parseClientFrame(frame:unknown):Validation<ClientMessage> {
  if(typeof frame!=='string'||new TextEncoder().encode(frame).byteLength>LIMITS.clientBytes)return bad();
  if(frame==='ping')return {ok:true,value:{type:'ping'}};
  try{return validateClientMessage(JSON.parse(frame));}catch{return bad();}
}

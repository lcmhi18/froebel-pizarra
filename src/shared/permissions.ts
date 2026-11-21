import type {BoardState,Op,ErrorCode} from './protocol';
import {buildSteps} from '../boards/operaciones-combinadas/engine.js';
import {CONFIG} from '../boards/operaciones-combinadas/config.js';
import {validDrawingItem} from '../boards/operaciones-combinadas/drawing.js';
import {validLesson as validIntervalLesson} from '../boards/intervalos/model.js';

export type BoardPermissions={student:{itemTypes:readonly string[]|'*';operations:readonly string[];fields:readonly string[]|'*'};teacherOnlyFields:readonly string[]};
const unrestricted:BoardPermissions={student:{itemTypes:'*',operations:['add','update','remove','order','field'],fields:'*'},teacherOnlyFields:[]};
export const BOARD_PERMISSIONS:Record<string,BoardPermissions>={
 prueba:unrestricted,_plantilla:unrestricted,geometria:unrestricted,konva:unrestricted,aritmetica:unrestricted,
 'recta-numerica':{student:{itemTypes:['pin'],operations:['add','update','remove','order','field'],fields:['a','b']},teacherOnlyFields:['note','fs']},
 'operaciones-combinadas':{student:{itemTypes:[],operations:[],fields:[]},teacherOnlyFields:['lesson']},
 intervalos:{student:{itemTypes:[],operations:[],fields:[]},teacherOnlyFields:['lesson']},
};
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const only=(value:Record<string,unknown>,keys:readonly string[])=>Object.keys(value).every(key=>keys.includes(key));
const integer=(value:unknown,min:number,max:number):value is number=>typeof value==='number'&&Number.isInteger(value)&&value>=min&&value<=max;
export const NOTE_IMAGE_BYTES=300*1024;
export function validNoteImage(value:unknown):boolean{
 if(typeof value!=='string'||value.length>Math.ceil(NOTE_IMAGE_BYTES/3)*4+40)return false;
 const match=/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!match||match[2].length%4!==0)return false;
 const payload=match[2];const size=payload.length/4*3-(payload.endsWith('==')?2:payload.endsWith('=')?1:0);
 if(size>NOTE_IMAGE_BYTES)return false;
 try{
  const bytes=atob(payload);
  switch(match[1]){
   case 'png':return bytes.startsWith('\x89PNG\r\n\x1a\n');
   case 'jpeg':return bytes.startsWith('\xff\xd8\xff');
   case 'webp':return bytes.slice(0,4)==='RIFF'&&bytes.slice(8,12)==='WEBP';
   case 'gif':return ['GIF87a','GIF89a'].includes(bytes.slice(0,6));
  }
 }catch{return false;}
 return false;
}
export function validNote(value:unknown):boolean{
 return Array.isArray(value)&&value.every(block=>record(block)&&(
  block.k==='t'?only(block,['k','v'])&&typeof block.v==='string':block.k==='i'&&only(block,['k','src'])&&validNoteImage(block.src)
 ));
}
/** Called for every authenticated operation, before application or persistence. */
export function boardOperationError(boardId:string,role:'teacher'|'student',op:Op,state:BoardState):ErrorCode|null{
 if(boardId==='intervalos'){
  if(role!=='teacher')return 'FORBIDDEN';
  return op.kind==='field'&&op.field==='lesson'&&validIntervalLesson(op.value)?null:'BAD_MESSAGE';
 }
 if(boardId==='operaciones-combinadas'){
  if(role!=='teacher')return 'FORBIDDEN';
  if(op.kind==='field'){
   if(op.field!=='lesson'||!record(op.value)||!only(op.value,['expression','step'])||typeof op.value.expression!=='string'||!integer(op.value.step,0,CONFIG.maxSteps))return 'BAD_MESSAGE';
   try{return op.value.step<buildSteps(op.value.expression).steps.length?null:'BAD_MESSAGE';}catch{return 'BAD_MESSAGE';}
  }
  if(op.kind==='add'||op.kind==='update'){
   const item=op.kind==='add'?op.patch:{...state.items[op.id],...op.patch};
   return validDrawingItem(item)?null:'BAD_MESSAGE';
  }
  return null;
 }
 if(boardId!=='recta-numerica')return null;
 if(op.kind==='field'){
  if(role==='student'&&BOARD_PERMISSIONS[boardId].teacherOnlyFields.includes(op.field))return 'FORBIDDEN';
  if(op.field==='a'||op.field==='b')return integer(op.value,0,20)?null:'BAD_MESSAGE';
  if(op.field==='fs')return integer(op.value,12,72)&&op.value%2===0?null:'BAD_MESSAGE';
  if(op.field==='note')return validNote(op.value)?null:'BAD_MESSAGE';
  return 'BAD_MESSAGE';
 }
 if(op.kind==='add')return only(op.patch,['t','n','v'])&&op.patch.t==='pin'&&integer(op.patch.n,-99,99)&&integer(op.patch.v,-20,20)?null:'BAD_MESSAGE';
 const current=state.items[op.id];
 if(current&&current.t!=='pin')return 'BAD_MESSAGE';
 if(op.kind==='update')return only(op.patch,['v'])&&Object.hasOwn(op.patch,'v')&&integer(op.patch.v,-20,20)?null:'BAD_MESSAGE';
 if(op.kind==='order'&&op.after!==null&&state.items[op.after]&&state.items[op.after].t!=='pin')return 'BAD_MESSAGE';
 return null;
}
/** Validate final batch state, so related field writes are accepted atomically. */
export function boardStateError(boardId:string,state:BoardState):ErrorCode|null{
 if(boardId!=='recta-numerica')return null;
 const a=state.fields.a===undefined?10:state.fields.a,b=state.fields.b===undefined?10:state.fields.b;
 if(!integer(a,0,20)||!integer(b,0,20)||a+b<1)return 'BAD_MESSAGE';
 if(Object.keys(state.items).length>200)return 'STATE_TOO_LARGE';
 return null;
}

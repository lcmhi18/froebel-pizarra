import {LIMITS,type Op,type ClientMessage} from './protocol';
export const UPLOAD_PART_UNITS=4096;
export const UPLOAD_MAX_BYTES=LIMITS.stateBytes+65536;
export const UPLOAD_TTL_MS=30000;
export function operationFrames(op:Op):ClientMessage[]{
 const payload=JSON.stringify({type:'ops',ops:[op]}),bytes=new TextEncoder().encode(payload).length;
 if(bytes<=64000)return [{type:'ops',ops:[op]}];
 if(bytes>UPLOAD_MAX_BYTES)throw Error('El cambio supera el tamaño máximo de la pizarra.');
 const parts:string[]=[];
 for(let offset=0;offset<payload.length;){let end=Math.min(offset+UPLOAD_PART_UNITS,payload.length);const last=payload.charCodeAt(end-1);if(end<payload.length&&last>=0xd800&&last<=0xdbff)end--;parts.push(payload.slice(offset,end));offset=end;}
 return parts.map((data,index)=>({type:'ops_chunk',uploadId:op.opId,boardId:op.boardId,index,total:parts.length,data}));
}

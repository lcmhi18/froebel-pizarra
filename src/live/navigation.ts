import { BOARD_MANIFEST } from '../boards/manifest';
import { isBoardId,isRoomCode,type BoardId } from '../shared/protocol';
export function boardUrl(boardId:BoardId,code:string,role:'teacher'|'student'){
 const board=BOARD_MANIFEST.find(item=>item.id===boardId);if(!board||!isRoomCode(code))throw Error('Destino de sala inválido.');
 return `${board.path}?${new URLSearchParams({room:code,role})}`;
}
export type RecentRoom={code:string;boardId:BoardId;createdAt:number};
const historyKey='froebel:recent-rooms';
export function recentRooms(storage:Storage=localStorage):RecentRoom[]{
 let rows:unknown;try{rows=JSON.parse(storage.getItem(historyKey)||'[]');}catch{rows=[];}
 const valid=Array.isArray(rows)?rows.filter((row):row is RecentRoom=>!!row&&typeof row==='object'&&isRoomCode(row.code)&&isBoardId(row.boardId)&&Number.isFinite(row.createdAt)):[];
 const seen=new Set(valid.map(row=>row.code));
 for(let i=0;i<storage.length;i++){const key=storage.key(i),match=key?.match(/^room:([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}):teacher$/);if(match&&!seen.has(match[1])){valid.push({code:match[1],boardId:'prueba',createdAt:0});seen.add(match[1]);}}
 return valid.filter(row=>!!storage.getItem(`room:${row.code}:teacher`)).sort((a,b)=>b.createdAt-a.createdAt).slice(0,12);
}
export function rememberRoom(code:string,boardId:BoardId,storage:Storage=localStorage){
 if(!isRoomCode(code)||!isBoardId(boardId))return;
 const rows=recentRooms(storage),old=rows.find(row=>row.code===code);
 storage.setItem(historyKey,JSON.stringify([{code,boardId,createdAt:old?.createdAt||Date.now()},...rows.filter(row=>row.code!==code)].slice(0,12)));
}
/** Explicit user action only: forgetting access never closes or deletes the remote room. */
export function forgetRoom(code:string,storage:Storage=localStorage){
 if(!isRoomCode(code))return;const rows=recentRooms(storage).filter(row=>row.code!==code);storage.removeItem(`room:${code}:teacher`);storage.setItem(historyKey,JSON.stringify(rows));
}

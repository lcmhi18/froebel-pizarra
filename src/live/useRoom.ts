import { useEffect,useRef,useState } from 'react';
import type { BoardAdapter } from './BoardAdapter';
import { RoomConnection,type RoomOptions,type RoomView } from './connection';
export { API,messages,type RoomOptions } from './connection';
const idle:RoomView={status:'idle',error:'',students:[],author:'',name:'',boardId:'prueba'};
export function useRoom(adapter:BoardAdapter,options:RoomOptions|null){
 const connection=useRef<RoomConnection|null>(null);const [view,setView]=useState(idle);
 useEffect(()=>{
  if(!options){setView(idle);return;}
  const room=new RoomConnection(adapter,options);connection.current=room;setView(room.getSnapshot());const unsubscribe=room.subscribe(()=>setView(room.getSnapshot()));room.start();
  return()=>{unsubscribe();room.stop();if(connection.current===room)connection.current=null;};
 },[adapter,options]);
 return {...view,newId:()=>connection.current!.engine.newId(),undo:()=>connection.current?.engine.undo(),action:(type:string,studentId?:string)=>connection.current?.action(type,studentId),retry:()=>connection.current?.retry()};
}

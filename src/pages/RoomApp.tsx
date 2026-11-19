import { useEffect,useMemo,useRef,useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter,useSearchParams } from 'react-router-dom';
import { Moon,Sun,UsersThree,ArrowRight,ClockCounterClockwise,Trash } from '@phosphor-icons/react';
import '@fontsource/nunito/latin-400.css';import '@fontsource/nunito/latin-600.css';import '@fontsource/nunito/latin-800.css';
import './room.css';
import { BOARD_MANIFEST } from '../boards/manifest';
import { isBoardId,isRoomCode,sanitizeFirstName,type BoardId } from '../shared/protocol';
import { TestBoardAdapter } from '../boards/prueba/adapter';
import { API,messages,useRoom,type RoomOptions } from '../live/useRoom';
import { boardUrl,forgetRoom,recentRooms,rememberRoom } from '../live/navigation';
function RoomApp(){
 const [query]=useSearchParams(),role=/\/alumno(?:\/|$)/.test(location.pathname)?'student':'teacher';
 const initialCode=(query.get('code')||query.get('room')||'').trim().toUpperCase();
 const [code,setCode]=useState(initialCode),[name,setName]=useState(''),[boardId,setBoardId]=useState<BoardId>(()=>isBoardId(query.get('board'))?query.get('board') as BoardId:'prueba');
 const [options,setOptions]=useState<RoomOptions|null>(()=>role==='student'&&isRoomCode(initialCode)&&sessionStorage.getItem(`room:${initialCode}:student`)?{code:initialCode,role}:null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[recent,setRecent]=useState(()=>role==='teacher'?recentRooms():[]);
 const [dark,setDark]=useState(()=>localStorage.getItem('froebel:room-theme')==='dark'||(!localStorage.getItem('froebel:room-theme')&&matchMedia('(prefers-color-scheme:dark)').matches));
 const [forget,setForget]=useState<string|null>(null),dialog=useRef<HTMLDialogElement>(null),autoOpened=useRef(false);
 const adapter=useMemo(()=>new TestBoardAdapter(),[]),room=useRoom(adapter,options);
 useEffect(()=>{localStorage.setItem('froebel:room-theme',dark?'dark':'light');},[dark]);
 useEffect(()=>{if(forget)dialog.current?.showModal();else dialog.current?.close();},[forget]);
 useEffect(()=>{
  if(role==='student'&&options&&room.status==='active')location.replace(boardUrl(room.boardId,options.code,'student'));
 },[role,options,room.status,room.boardId]);
 useEffect(()=>{
  if(role==='teacher'&&isRoomCode(initialCode)&&!autoOpened.current){autoOpened.current=true;void openSaved(initialCode,false);}
 },[role,initialCode]);
 async function openSaved(target:string,allowReopen=true){
  setBusy(true);setError('');
  try{
   const normalized=target.trim().toUpperCase();if(!isRoomCode(normalized))throw Error('Escribe un código de seis caracteres válido.');
   const token=localStorage.getItem(`room:${normalized}:teacher`)||sessionStorage.getItem(`room:${normalized}:teacher`);
   if(!token)throw Error('Este navegador no tiene guardado el acceso de profesor para esa sala.');
   localStorage.setItem(`room:${normalized}:teacher`,token);
   const check=await fetch(`${API}/api/rooms/${normalized}`),state=await check.json() as {open?:boolean;error?:string};
   if(!check.ok)throw Error(messages[state.error||'']||'No se pudo consultar la sala.');
   if(!state.open){
    if(!allowReopen)throw Error('Esta sala está cerrada. Puedes reabrirla desde tus salas recientes.');
    const response=await fetch(`${API}/api/rooms/${normalized}/reopen`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teacherToken:token})});
    if(!response.ok)throw Error('No se pudo reabrir; el código o el acceso pueden haber caducado.');
   }
   const saved=recentRooms().find(item=>item.code===normalized);location.assign(boardUrl(saved?.boardId||'prueba',normalized,'teacher'));
  }catch(cause){setError((cause as Error).message);}finally{setBusy(false);}
 }
 async function enter(local=false){
  setBusy(true);setError('');
  try{
   if(role==='student'){
    const normalized=code.trim().toUpperCase(),firstName=sanitizeFirstName(name);
    if(!isRoomCode(normalized))throw Error('Escribe un código de seis caracteres válido.');if(!firstName)throw Error('Escribe tu nombre de pila.');
    setCode(normalized);setOptions({code:normalized,name:firstName,role});return;
   }
   let token:string|undefined;
   if(!local){
    const {createClient}=await import('@supabase/supabase-js');const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    const {data,error:authError}=await supabase.auth.getSession();if(authError||!data.session)throw Error('Inicia sesión como profesor desde la portada antes de crear una sala.');token=data.session.access_token;
   }
   const response=await fetch(`${API}/api/rooms`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({boardId})});
   const result=await response.json() as {code?:string;teacherToken?:string;error?:string};
   if(!response.ok)throw Error(messages[result.error||'']||'No se pudo crear la sala.');
   if(!isRoomCode(result.code)||!result.teacherToken||!/^[a-f0-9]{64}$/.test(result.teacherToken))throw Error('La sala devolvió un acceso inválido.');
   localStorage.setItem(`room:${result.code}:teacher`,result.teacherToken);rememberRoom(result.code,boardId);location.assign(boardUrl(boardId,result.code,'teacher'));
  }catch(cause){setError((cause as Error).message);}finally{setBusy(false);}
 }
 const waiting=role==='student'&&options&&room.status!=='entry';
 const statusText=room.status==='waiting'?'Esperando que el profesor te acepte…':room.status==='ended'?'La conexión a la sala terminó.':room.status==='paused'?'El profesor se desconectó, esperando…':'Conectando con tu clase…';
 return <div className={`room-app ${dark?'dark':''}`}>
  <header className="room-top"><a className="wordmark" href="/">Froebel <span>Academy</span></a><span className="room-title">Sala en vivo</span><div className="top-actions"><a href={role==='teacher'?'/alumno/':'/profesor/'}>{role==='teacher'?'Acceso de alumnos':'Acceso de profesores'}</a><button aria-label={dark?'Tema claro':'Tema oscuro'} onClick={()=>setDark(!dark)}>{dark?<Sun size={22}/>:<Moon size={22}/>}</button></div></header>
  {waiting?<main className="entry-sheet waiting-entry"><UsersThree size={48}/><h1>{statusText}</h1><p role="status">{room.error||'La pizarra se abrirá cuando el profesor acepte tu solicitud.'}</p>{room.status==='ended'&&<button className="primary" onClick={room.retry}>Volver a pedir entrada</button>}<button onClick={()=>setOptions(null)}>Volver al acceso</button></main>:
  <main className="entry-sheet"><div className="entry-copy"><h1>{role==='teacher'?'Tu clase, en un mismo lienzo.':'Entra a tu clase.'}</h1><p>{role==='teacher'?'Elige una pizarra y comparte el código con hasta cinco alumnos. Tú decides quién entra.':'Escribe el código de tu profesor y tu nombre de pila. Te avisaremos cuando acepte tu entrada.'}</p><p className="entry-note">Froebel Academy · Sala en vivo</p><a href="/boards/prueba/">Probar la pizarra en modo personal <ArrowRight size={18}/></a></div>
   <form onSubmit={event=>{event.preventDefault();void enter();}}><h2>{role==='teacher'?'Crear una sala':'Pedir entrada'}</h2>
    {role==='teacher'?<label>Pizarra<select aria-label="Pizarra inicial" value={boardId} onChange={event=>{if(isBoardId(event.target.value))setBoardId(event.target.value);}}>{BOARD_MANIFEST.map(board=><option key={board.id} value={board.id}>{board.title}</option>)}</select></label>:<><label>Código de sala<input aria-label="Código de sala" value={code} onChange={event=>setCode(event.target.value.toUpperCase())} maxLength={6} autoComplete="off" required placeholder="ABC234"/></label><label>Tu nombre<input aria-label="Tu nombre" value={name} onChange={event=>setName(event.target.value)} maxLength={24} required placeholder="¿Cómo te llamas?"/></label></>}
    <button className="primary" disabled={busy}>{busy?'Un momento…':role==='teacher'?'Crear sala':'Pedir entrada'}<ArrowRight size={20}/></button>
    {role==='teacher'&&<a href="/">Volver al acceso de profesores</a>}
    {import.meta.env.DEV&&role==='teacher'&&<button type="button" disabled={busy} onClick={()=>void enter(true)}>Crear sala de prueba local</button>}
    <p className="feedback" role="alert">{error||room.error}</p>
   </form>
  </main>}
  {role==='teacher'&&<section className="recent-rooms" aria-labelledby="recent-title"><h2 id="recent-title"><ClockCounterClockwise size={24}/>Tus salas recientes</h2><p>El acceso se guarda en este navegador. Una sala cerrada conserva la pizarra durante 24 horas.</p>{!recent.length?<p>Aún no has creado ninguna sala aquí.</p>:<ul>{recent.map(item=><li key={item.code}><div><strong>{item.code}</strong><span>{BOARD_MANIFEST.find(board=>board.id===item.boardId)?.title}</span></div><button disabled={busy} onClick={()=>void openSaved(item.code)}>Entrar o reabrir <ArrowRight size={18}/></button><button aria-label={`Olvidar acceso a ${item.code}`} onClick={()=>setForget(item.code)}><Trash size={20}/></button></li>)}</ul>}<form className="resume-room" onSubmit={event=>{event.preventDefault();void openSaved(code);}}><label>Código de una sala guardada<input value={code} onChange={event=>setCode(event.target.value.toUpperCase())} maxLength={6} required placeholder="ABC234"/></label><button disabled={busy}>Entrar o reabrir</button></form></section>}
  <dialog ref={dialog} onCancel={()=>setForget(null)} aria-labelledby="forget-title"><h2 id="forget-title">¿Olvidar este acceso?</h2><p>Se quitará de este navegador el acceso de profesor a {forget}. La sala y su contenido no se borran.</p><div className="dialog-actions"><button onClick={()=>setForget(null)}>Conservar acceso</button><button onClick={()=>{if(forget){forgetRoom(forget);sessionStorage.removeItem(`room:${forget}:teacher`);}setRecent(recentRooms());setForget(null);}}>Sí, olvidar acceso</button></div></dialog>
 </div>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><RoomApp/></BrowserRouter>);

import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import shell from '../src/boards/geometria/index.html?raw';
import brand from '../src/assets/img/header-mobile.webp';
import './style.css';
import {mountKonva} from './renderer';

// Only this repository's trusted shell/math are reused. No source or credentials
// from academia-profesores are imported. React 18 owns this separate page.
const parsed=new DOMParser().parseFromString(shell,'text/html');
parsed.querySelectorAll('script').forEach(node=>node.remove());
parsed.querySelector('img')!.setAttribute('src',brand);
parsed.querySelector('#top > b')!.textContent='🔺 Geometría de Primaria · Froebel Academy';
const markup=parsed.body.innerHTML,baseStyle=parsed.querySelector('style')!.textContent!;
const base=document.createElement('style');base.textContent=baseStyle;document.head.prepend(base);
function App(){
 useEffect(()=>{
  let disposed=false,cleanup:(()=>void)|undefined;
  import('../src/boards/geometria/main.js').then(()=>{
   if(disposed)return;
   cleanup=mountKonva(document.querySelector<SVGSVGElement>('#sv')!);
   document.body.dataset.konvaReady='true';
  }).catch(()=>{
   const error=document.createElement('p');error.setAttribute('role','alert');
   error.textContent='No se pudo iniciar la pizarra. Recarga para volver a intentarlo.';document.getElementById('konva-root')!.prepend(error);
  });
  return()=>{disposed=true;cleanup?.();};
 },[]);
 return <div className="konva-shell" dangerouslySetInnerHTML={{__html:markup}}/>;
}
createRoot(document.getElementById('konva-root')!).render(<App/>);


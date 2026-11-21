import {validNoteImage} from '../../shared/note-image.js';
export function validGraphImage(item){return !!item&&item.t==='image'&&Object.keys(item).every(k=>['t','src','x1','y1','x2','y2'].includes(k))&&validNoteImage(item.src)&&['x1','y1','x2','y2'].every(k=>Number.isFinite(item[k])&&item[k]>=0&&item[k]<=1)&&item.x2>item.x1&&item.y2>item.y1;}
/** Decode and optimize locally; never upload the clipboard to another service. */
export async function clipboardImageData(blob){
 if(!/^image\/(png|jpeg|webp|gif|bmp|avif)$/.test(blob.type)||blob.size>25*1024*1024)throw Error('Copia una imagen PNG, JPG, WebP o GIF de hasta 25 MB.');
 const bitmap=await createImageBitmap(blob);try{
  const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));let w=Math.max(1,Math.round(bitmap.width*ratio)),h=Math.max(1,Math.round(bitmap.height*ratio));
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  for(let attempt=0;attempt<8;attempt++){
   canvas.width=w;canvas.height=h;ctx.drawImage(bitmap,0,0,w,h);
   const data=canvas.toDataURL('image/webp',Math.max(.45,.9-attempt*.08));
   if(validNoteImage(data))return {src:data,width:w,height:h};w=Math.max(1,Math.round(w*.8));h=Math.max(1,Math.round(h*.8));
  }throw Error('La imagen es demasiado grande. Prueba una imagen más pequeña.');
 }finally{bitmap.close();}
}

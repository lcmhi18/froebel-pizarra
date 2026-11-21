export const NOTE_IMAGE_BYTES=300*1024;
export function validNoteImage(value){
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

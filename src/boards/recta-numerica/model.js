export const formatNumber=n=>n<0?'−'+Math.abs(n):n>0?'+'+n:'0';
export const initialState=()=>({a:10,b:10,fs:18,note:[],pins:[]});
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function adjustMarks(state,side,delta){
 if(!['a','b'].includes(side)||!Number.isInteger(delta))return state;
 const value=Math.max(0,Math.min(20,state[side]+delta));
 if(value+state[side==='a'?'b':'a']<1)return state;
 const next={...state,[side]:value};
 next.pins=state.pins.filter(pin=>pin.v>=-next.a&&pin.v<=next.b);return next;
}
export function addPin(state,n,v,id){
 if(!integer(n,-99,99)||!integer(v,-state.a,state.b)||state.pins.length>=200||state.pins.some(pin=>pin.id===id))return state;
 return {...state,pins:[...state.pins,{id,t:'pin',n,v}]};
}
export function movePin(state,id,v){
 if(!integer(v,-state.a,state.b))return state;
 return {...state,pins:state.pins.map(pin=>pin.id===id?{...pin,v}:pin)};
}
export const removePin=(state,id)=>({...state,pins:state.pins.filter(pin=>pin.id!==id)});
export const clearLine=state=>({...state,a:10,b:10,pins:[]});
export const adjustFont=(state,delta)=>({...state,fs:Math.max(12,Math.min(72,state.fs+delta))});
export function columnAt(rect,a,b,x,y){
 if(!rect.width||x<rect.left||x>rect.right||y<rect.top-70||y>rect.bottom+70)return null;
 return -a+Math.min(a+b,Math.floor((x-rect.left)/rect.width*(a+b+1)));
}
export const inside=(rect,x,y)=>x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
export function placementMessage(n,v,a,b){
 const distance=n?`está a ${Math.abs(n)} unidad${Math.abs(n)===1?'':'es'} del 0, ${n>0?'a la derecha (ℤ+)':'a la izquierda (ℤ−)'}`:'va justo en el centro: ni positivo ni negativo';
 if(n===v)return `✅ ¡Bien! ${formatNumber(n)} ${distance}.`;
 const range=n< -a||n>b?` Ese número no cabe en esta recta: amplía las marcas de arriba.`:'';
 return `Ojo: pusiste ${formatNumber(n)} en la marca ${formatNumber(v)}, pero ${formatNumber(n)} ${distance}.${range} Puedes mover el pin o tocarlo para quitarlo. 🐸`;
}

import type { Item } from '../../shared/protocol';
export type Motion={action:string;at:number;base:Record<string,number>};
const actions=['unf','hdes','arm','harm','cdes','rdes','carm','rarm','cpl','rpl','spin','hspin','rspin'];
const validMotion=(v:unknown):v is Motion=>!!v&&typeof v==='object'&&actions.includes((v as Motion).action)&&Number.isFinite((v as Motion).at)&&!!(v as Motion).base&&typeof (v as Motion).base==='object'&&Object.values((v as Motion).base).every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e6);
const finite=(value:unknown,fallback=0)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;
export function sampleMotion(item:Item,now:number):Item{
 const motion=item.motion as Motion|undefined;if(!validMotion(motion))return item;
 const step=Math.max(0,(now-finite(motion.at,now))/40),base=motion.base,next={...item};
 switch(motion.action){
  case 'unf':case 'hdes':next.u=Math.min(1,finite(base.u)+step*.03);break;
  case 'arm':case 'harm':next.u=Math.max(0,finite(base.u)-step*.03);break;
  case 'cdes':case 'rdes':next.un=Math.min(1,finite(base.un)+step*.03);break;
  case 'carm':case 'rarm':next.un=Math.max(0,finite(base.un)-step*.03);break;
  case 'cpl':next.sp=Math.min(360,step*3);break;
  case 'rpl':next.ang=Math.min(360,step*3);break;
  case 'spin':case 'hspin':next.yaw=((finite(base.yaw)+step*3+180)%360)-180;break;
  case 'rspin':{const angle=(finite(base.ang)+step*3)%720;next.ang=angle<=360?angle:720-angle;break;}
 }
 return next;
}
export function motionRunning(item:Item,now:number){const motion=item.motion as Motion|undefined;if(!validMotion(motion))return false;if(['spin','hspin','rspin'].includes(motion.action))return true;const value=sampleMotion(item,now);const key=['cpl'].includes(motion.action)?'sp':['rpl'].includes(motion.action)?'ang':['cdes','carm','rdes','rarm'].includes(motion.action)?'un':'u';const end=['arm','harm','carm','rarm'].includes(motion.action)?0:key==='sp'||key==='ang'?360:1;return value[key]!==end;}

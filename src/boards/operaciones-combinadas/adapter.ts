import {TestBoardAdapter} from '../prueba/adapter';
import type {BoardState} from '../../shared/protocol';
/** Teacher drives the lesson; pupils receive its canonical state. */
export class CombinedAdapter extends TestBoardAdapter{
 constructor(readonly role:'teacher'|'student'){super();this.readOnly=true;}
 get canEdit(){return !this.readOnly&&this.role==='teacher';}
 commit(mutate:(state:BoardState)=>void){if(!this.canEdit)return false;this.change(mutate);return true;}
}

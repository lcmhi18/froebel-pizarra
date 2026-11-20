import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productFields,restoreProduct} from '../../src/boards/aritmetica/shared-state.js';
const defaults={eA:'3;5',view:'lista',hold:null,tb:{},pts:{},dv:{},paint:{a:false,i:false,b:false},th:{a:[],b:[]}};
test('content round-trips without sharing the local view or held chip',()=>{
 const product={...structuredClone(defaults),view:'cart',hold:{s:'A',e:'3'},tb:{'0,1':'(3;y)'},pts:{'0,1':'red'},dv:{d0:'24'},paint:{a:true,i:false,b:false},th:{a:['3'],b:['y']}};
 const fields=productFields(product),restored=restoreProduct(fields,defaults);
 assert.deepEqual(restored,{...product,view:'lista',hold:null});
 assert(!Object.keys(fields).some(key=>/view|hold/.test(key)));
 assert(Object.keys(fields).every(key=>/^[\w:.-]{1,160}$/.test(key)));
});
test('independent cells merge and undo without replacing another cell',()=>{
 const a=productFields({...structuredClone(defaults),tb:{'0,0':'Ana'}});
 const b=productFields({...structuredClone(defaults),tb:{'1,1':'Luis'}});
 const combined={...a,...b};assert.deepEqual(restoreProduct(combined,defaults).tb,{'0,0':'Ana','1,1':'Luis'});
 const ownKey=Object.keys(a).find(key=>key.startsWith('product:tb:'));delete combined[ownKey];
 assert.deepEqual(restoreProduct(combined,defaults).tb,{'1,1':'Luis'});
});
test('older snapshots with grouped fields remain readable',()=>{
 assert.deepEqual(restoreProduct({'product:tb':{'0,0':'respuesta'}},defaults).tb,{'0,0':'respuesta'});
});

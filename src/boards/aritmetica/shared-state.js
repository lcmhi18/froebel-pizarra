// Each editable cell has its own protocol field, so edits to different cells
// remain independent during synchronization and per-author undo.
const maps=new Set(['tb','pts','dv','paint']);
const local=new Set(['view','hold']);
const encode=key=>Array.from(key,ch=>ch.charCodeAt(0).toString(16)).join('.');
const decode=key=>key.split('.').map(ch=>String.fromCharCode(parseInt(ch,16))).join('');
export function productFields(product){
 const fields={};
 for(const [key,value] of Object.entries(product)){
  if(local.has(key))continue;
  if(maps.has(key)){
   for(const [cell,content] of Object.entries(value))fields[`product:${key}:${encode(cell)}`]=structuredClone(content);
  }else if(key==='th'){
   for(const side of ['a','b'])value[side].forEach((content,index)=>fields[`product:th:${side}:${index}`]=content);
  }else fields[`product:${key}`]=structuredClone(value);
 }
 return fields;
}
export function restoreProduct(fields,defaults){
 const product=structuredClone(defaults);
 for(const key of Object.keys(defaults)){
  if(local.has(key))continue;
  const value=fields[`product:${key}`];
  if(value!==undefined)product[key]=structuredClone(value);
 }
 for(const [key,value] of Object.entries(fields)){
  const match=/^product:(tb|pts|dv|paint):([0-9a-f.]+)$/.exec(key);
  if(match){
   const cell=decode(match[2]);
   if(['__proto__','constructor','prototype'].includes(cell))continue;
   product[match[1]][cell]=structuredClone(value);
  }
  const header=/^product:th:([ab]):(\d{1,3})$/.exec(key);
  if(header)product.th[header[1]][Number(header[2])]=structuredClone(value);
 }
 return product;
}

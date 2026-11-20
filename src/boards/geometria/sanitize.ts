import DOMPurify from 'dompurify';
import {isGeometryImageUrl} from './image-source';
// Never trust text or colors merely because they arrived through an authenticated room.
DOMPurify.addHook('uponSanitizeAttribute',(_node,data)=>{
 if(['href','xlink:href','src'].includes(data.attrName)&&!/^#[\w:-]+$/.test(data.attrValue)&&!isGeometryImageUrl(data.attrValue))data.keepAttr=false;
 if(data.attrName==='style'&&/url\s*\(|expression\s*\(|@import/i.test(data.attrValue))data.keepAttr=false;
});
export function putHTML(target:Element,markup:string){
 const config={FORBID_TAGS:['script','style','foreignObject','iframe','object','embed','audio','video'],ADD_ATTR:['dominant-baseline']};
 if(target.namespaceURI==='http://www.w3.org/2000/svg'){const fragment=DOMPurify.sanitize(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,{...config,RETURN_DOM_FRAGMENT:true});target.replaceChildren(...Array.from(fragment.firstElementChild?.childNodes||[]));}
 else target.innerHTML=DOMPurify.sanitize(markup,config);
}

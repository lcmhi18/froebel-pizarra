import DOMPurify from 'dompurify';
DOMPurify.addHook('uponSanitizeAttribute',(_node,data)=>{
 if(['href','src','xlink:href'].includes(data.attrName)&&!/^#[\w:-]+$/.test(data.attrValue))data.keepAttr=false;
 if(data.attrName==='style'&&/(?:expression|@import|url\s*\(\s*[^#])/i.test(data.attrValue))data.keepAttr=false;
});
export function putHTML(target:Element,markup:string){
 const svg=target.namespaceURI==='http://www.w3.org/2000/svg';
 const clean=DOMPurify.sanitize(svg?`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`:markup,{FORBID_TAGS:['script','foreignObject','iframe','object','embed'],ADD_TAGS:['mask','clippath','marker'],ADD_ATTR:['mask','maskUnits','clip-path','marker-end','markerUnits','refX','refY','orient','dominant-baseline'],RETURN_DOM_FRAGMENT:true});
 target.replaceChildren(...Array.from(svg?clean.firstElementChild?.childNodes||[]:clean.childNodes));
}

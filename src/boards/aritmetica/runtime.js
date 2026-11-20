import {putHTML} from './sanitize';
let newId=()=>crypto.randomUUID(),undoShared=()=>{},afterDraw=()=>{};

'use strict';
const $=s=>document.querySelector(s);
const vs=$('#vs'),cm=$('#cm'),stage=$('#stage');
let paper={x:0,y:0,w:1000,h:560};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const COLORS=['#111111','#6b7280','#e03e3e','#f97316','#eab308','#84cc16','#2e8b57','#06b6d4','#2563eb','#8e44ad','#ec4899','#92400e'];
let col='#2563eb',tab='v',big=false,msgx='',D=null,foc=false,lastCtx='';
const cc=()=>col||'#111111';
const V={items:[],fl:[],tool:'m',sel:null,snap:false,n:0,cnt:0,H:[]};
const P={nA:'A',nB:'B',eA:'3; 5; 8',eB:'y; z',view:'lista',pts:{},sg:{A:[],B:[],ar:[]},tb:{},th:{a:[],b:[]},li:'',hold:null,rev:'(a; 1); (a; 2); (a; 3); (b; 1); (b; 2); (b; 3)',paint:{a:false,i:false,b:false},ds:4,dv:{}};
const pList=s=>[...new Set(String(s).split(/[;,]/).map(x=>x.trim()).filter(Boolean))];
const sel=()=>V.items.find(o=>o.id===V.sel)||null;
const sn=v=>V.snap?Math.round(v/25)*25:v;
const clone=o=>JSON.parse(JSON.stringify(o));
const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',n:'ⁿ',x:'ˣ'};

/* ---------- historial ---------- */
function hist(){}
function undo(){undoShared()}

/* ---------- geometría ---------- */
function segD(p,a,b,c,d){const dx=c-a,dy=d-b,l=dx*dx+dy*dy;let t=l?((p.x-a)*dx+(p.y-b)*dy)/l:0;t=clamp(t,0,1);return Math.hypot(p.x-(a+t*dx),p.y-(b+t*dy))}
function bb(o){switch(o.t){
 case 'd':return{x:o.x-30,y:o.y-26,w:100*(o.k+1)+40,h:90*o.k+130};
 case 'g':return{x:o.x,y:o.y,w:(o.cols+1)*o.cw,h:(o.rows+1)*o.ch};
 case 'x':return{x:o.x-10,y:o.y-16,w:o.w+26,h:o.h+26};
 case 'o':return{x:o.x,y:o.y,w:o.w,h:o.h};
 case 't':{const lines=o.txt.split('\n'),w=Math.max(24,.55*o.s*Math.max(...lines.map(line=>line.length))+8);return{x:o.x-w/2,y:o.y-.6*o.s,w,h:1.2*o.s+(lines.length-1)*1.25*o.s}}
}}
function hit(o,p){switch(o.t){
 case 'c':return Math.hypot(p.x-o.x,p.y-o.y)<=o.r+6;
 case 'r':{const a=p.x>=o.x-6&&p.x<=o.x+o.w+6&&p.y>=o.y-6&&p.y<=o.y+o.h+6;const b=p.x>o.x+6&&p.x<o.x+o.w-6&&p.y>o.y+6&&p.y<o.y+o.h-6;return a&&!b}
 case 'l':return segD(p,o.x1,o.y1,o.x2,o.y2)<=10;
 case 'p':for(let i=1;i<o.d.length;i++)if(segD(p,o.d[i-1][0],o.d[i-1][1],o.d[i][0],o.d[i][1])<=10)return true;return false;
 default:{const b=bb(o);return p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h}
}}
function letters(){const L={};V.items.filter(o=>o.t==='c').forEach((o,i)=>L[o.id]=String.fromCharCode(65+i));return L}

/* ---------- dibujo de la pizarra ---------- */
function itemSVG(o,L){
 const st=`stroke="${o.c}" stroke-width="${o.sw}" fill="none"`;
 switch(o.t){
 case 'c':return `<circle class="it" cx="${o.x}" cy="${o.y}" r="${o.r}" ${st}/><text class="dc" x="${o.x-.72*o.r}" y="${o.y-.72*o.r-4}" font-size="20" font-weight="700" fill="${o.c}" text-anchor="middle">${L[o.id]||''}</text>`;
 case 'r':return `<rect class="it" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" ${st}/>`;
 case 'l':return `<line class="it" x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${o.c}" stroke-width="${o.w}" stroke-linecap="round"/>`;
 case 'p':return `<path class="it" d="M${o.d.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L')}" fill="none" stroke="${o.c}" stroke-width="${o.w}" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`;
 case 't':return `<text class="it" x="${o.x}" y="${o.y}" font-size="${o.s}" font-weight="700" fill="${o.c}" text-anchor="middle" dominant-baseline="central" style="white-space:pre">${o.txt.split('\n').map((line,i)=>`<tspan x="${o.x}" y="${o.y+i*1.25*o.s}">${esc(line)}</tspan>`).join('')}</text>`;
 case 'd':{let h='';for(let i=0;i<o.k;i++){const a=o.x+100*i,b=o.y+90*i;h+=`<line x1="${a+35}" y1="${b-26}" x2="${a+35}" y2="${b+12}"/><line x1="${a+35}" y1="${b+12}" x2="${a+100}" y2="${b+12}"/><line x1="${a-30}" y1="${b+86}" x2="${a+30}" y2="${b+86}"/>`}
  return `<g class="it" stroke="${o.c}" stroke-width="${o.sw}" stroke-linecap="round" fill="none">${h}<rect x="${o.x-30}" y="${o.y-26}" width="${100*(o.k+1)+40}" height="${90*o.k+130}" fill="transparent" stroke="none"/></g>`}
 case 'g':{let h='';const W=(o.cols+1)*o.cw,H=(o.rows+1)*o.ch;for(let j=0;j<=o.rows+1;j++)h+=`<line x1="${o.x}" y1="${o.y+j*o.ch}" x2="${o.x+W}" y2="${o.y+j*o.ch}"/>`;for(let i=0;i<=o.cols+1;i++)h+=`<line x1="${o.x+i*o.cw}" y1="${o.y}" x2="${o.x+i*o.cw}" y2="${o.y+H}"/>`;
  return `<g class="it" stroke="${o.c}" stroke-width="${o.sw}" stroke-linecap="round" fill="none">${h}</g>`}
 case 'x':{const X=o.x,Y=o.y,W=o.w,H=o.h;
  return `<g class="it" stroke="${o.c}" stroke-width="${o.sw}" stroke-linecap="round" fill="none"><line x1="${X}" y1="${Y+H}" x2="${X+W}" y2="${Y+H}"/><line x1="${X}" y1="${Y+H}" x2="${X}" y2="${Y}"/><polygon fill="${o.c}" points="${X+W+6},${Y+H} ${X+W-8},${Y+H-6} ${X+W-8},${Y+H+6}"/><polygon fill="${o.c}" points="${X},${Y-6} ${X-6},${Y+8} ${X+6},${Y+8}"/><rect x="${X-10}" y="${Y-16}" width="${W+26}" height="${H+26}" fill="transparent" stroke="none"/></g>`}
 case 'o':return `<g class="it" stroke-width="${o.sw}" fill="none"><ellipse cx="${o.x+.17*o.w}" cy="${o.y+o.h/2}" rx="${.13*o.w}" ry="${o.h/2}" stroke="#2563eb"/><ellipse cx="${o.x+.83*o.w}" cy="${o.y+o.h/2}" rx="${.13*o.w}" ry="${o.h/2}" stroke="#e03e3e"/></g>`;
 }
}
function regionsSVG(){
 const circs=V.items.filter(o=>o.t==='c');let defs='',body='';
 V.fl.forEach((f,k)=>{
  const u=f.r?V.items.find(o=>o.id===f.r&&o.t==='r'):null;if(f.r&&!u)return;
  const inn=f.i.map(id=>circs.find(c=>c.id===id));if(inn.some(c=>!c))return;
  const oth=circs.filter(c=>!f.i.includes(c.id));
  defs+=`<mask id="m${k}" maskUnits="userSpaceOnUse" x="${paper.x}" y="${paper.y}" width="${paper.w}" height="${paper.h}"><rect x="${paper.x}" y="${paper.y}" width="${paper.w}" height="${paper.h}" fill="#fff"/>${oth.map(c=>`<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="#000"/>`).join('')}</mask>`;
  inn.forEach((c,j)=>{defs+=`<clipPath id="k${k}_${j}"><circle cx="${c.x}" cy="${c.y}" r="${c.r}"/></clipPath>`});
  const rect=u?`<rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" fill="${f.c}" opacity=".6"/>`:`<rect x="${paper.x}" y="${paper.y}" width="${paper.w}" height="${paper.h}" fill="${f.c}" opacity=".6"/>`;
  let g=rect;for(let j=inn.length-1;j>=0;j--)g=`<g clip-path="url(#k${k}_${j})">${g}</g>`;
  body+=`<g mask="url(#m${k})" class="dc">${g}</g>`;
 });
 return `<defs>${defs}</defs>${body}`;
}
function handlesSVG(){
 const s=sel();if(!s)return '';const B='#2563eb';
 const hd=(x,y,r)=>`<circle class="hd" cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${B}" stroke-width="2.5"/>`;
 const dash=(x,y,w,h)=>`<rect class="dc" x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="6 4"/>`;
 switch(s.t){
 case 'c':return `<circle class="dc" cx="${s.x}" cy="${s.y}" r="${s.r+6}" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="6 4"/>`+hd(s.x+s.r,s.y,7);
 case 'r':return dash(s.x-5,s.y-5,s.w+10,s.h+10)+hd(s.x+s.w,s.y+s.h,7);
 case 'l':return `<line class="dc" x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="rgba(37,99,235,.3)" stroke-width="${s.w+10}" stroke-linecap="round"/>`+hd(s.x1,s.y1,6)+hd(s.x2,s.y2,6);
 case 'p':return `<path class="dc" d="M${s.d.map(q=>q[0]+' '+q[1]).join('L')}" fill="none" stroke="rgba(37,99,235,.3)" stroke-width="${s.w+10}" stroke-linecap="round" stroke-linejoin="round"/>`;
 default:{const b=bb(s);return dash(b.x-5,b.y-5,b.w+10,b.h+10)}
 }
}
function draw(){
 const size=stage.getBoundingClientRect();
 if(tab==='v'&&size.width>0&&size.height>0){
  const ratio=size.width/size.height,w=Math.max(1000,560*ratio),h=w/ratio;
  paper={x:(1000-w)/2,y:(560-h)/2,w,h};
 }else paper={x:0,y:0,w:1000,h:560};
 vs.setAttribute('viewBox',`${paper.x} ${paper.y} ${paper.w} ${paper.h}`);
 const cap=['p','l','t','f'].includes(V.tool);
 vs.setAttribute('class',(tab!=='v'?'ov':'')+(cap?' cap':''));
 stage.classList.toggle('sc',tab!=='v');
 const L=letters();
 let h=`<defs><pattern id="gr" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" style="stroke:var(--bd)" stroke-width="1"/></pattern></defs>`;
 h+=`<rect class="dc" x="${paper.x}" y="${paper.y}" width="${paper.w}" height="${paper.h}" fill="${tab==='v'?'url(#gr)':'none'}"/>`;
 h+=regionsSVG();
 h+=V.items.map(o=>itemSVG(o,L)).join('');
 h+=handlesSVG();
 if(D&&D.k==='ln')h+=`<line class="dc" x1="${D.x1}" y1="${D.y1}" x2="${D.x2}" y2="${D.y2}" stroke="${cc()}" stroke-width="2" stroke-dasharray="6 4"/>`;
 putHTML(vs,h);afterDraw();
}

/* ---------- interfaz ---------- */
const TABS=[['v','⭕ Conjuntos'],['prod','× Producto A × B'],['dv','➗ Divisiones sucesivas'],['rev','↺ Al revés']];
const TOOLS=[['tool','m','👆 Mover'],['tool','p','✏️ Lápiz'],['tool','l','📏 Línea'],['tool','t','🔤 Texto'],['tool','f','🖌 Pintar regiones'],['clrfl','','🧽 Quitar colores'],'|',['mk','c','◯ Círculo'],['mk','r','▭ Rectángulo (universo)'],['mk','v2','Venn 2'],['mk','v3','Venn 3'],['mk','d','➗ Divisiones sucesivas'],['mk','g','▦ Tabla del producto'],['mk','x','⊥ Plano cartesiano'],['mk','o','⇉ Sagital']];
function descRegion(r,ids){const L=letters();if(!ids.length)return r?'fuera de los conjuntos (dentro de U)':'fuera de los conjuntos';if(ids.length===1)return 'solo '+L[ids[0]];return ids.map(i=>L[i]).join(' ∩ ')}
function owlText(){
 if(tab!=='v'&&V.tool==='m'&&!V.sel){return {prod:'Escribe los elementos separados por ; y rellena tú la lista, la tabla, el plano cartesiano y el diagrama sagital. Elige un color abajo.',dv:'Rellena tú los números en cada casilla de la escalera. Cambia los pasos si necesitas más o menos divisiones.',rev:'Pega un A × B: las primeras componentes forman A y las segundas forman B, sin repetir.'}[tab]}
 if(msgx)return msgx;
 const t=V.tool;
 if(t==='f')return 'Elige un color y toca la parte que quieras pintar: solo A, la intersección A ∩ B, solo B o lo que queda fuera. Cada región se pinta aparte.';
 if(t==='l')return 'Arrastra para trazar una línea delgada. Pulsa 👆 Mover cuando termines.';
 if(t==='p')return 'Dibuja a mano con el color elegido. Pulsa 👆 Mover cuando termines.';
 if(t==='t')return 'Toca la pizarra para escribir un texto.';
 const s=sel();
 if(!s)return 'Crea un círculo ◯ o un rectángulo ▭ (el universo), o usa Venn 2 / Venn 3. Escribe con 🔤 Texto y pinta cada región con 🖌 Pintar regiones.';
 if(s.t==='c')return `Conjunto ${letters()[s.id]}: arrastra el círculo para moverlo y el punto blanco del borde para cambiar su tamaño.`;
 if(s.t==='r')return 'El rectángulo es el universo U: arrástralo por el borde y cambia su tamaño con el punto de la esquina.';
 return 'Cambia el color, escribe o usa los botones 👇';
}
function palLabel(){
 if(V.tool==='f')return 'Pintar la región';
 if(['p','l','t'].includes(V.tool))return 'Color del lápiz';
 const s=sel();
 if(s)return ['c','r','d','g','x','o'].includes(s.t)?'Color del borde':'Color';
 return tab==='prod'?'Color de puntos y flechas':'Color';
}
function ctxHTML(){
 if(V.tool!=='m')return '';const s=sel();if(!s)return '';
 const b=(a,p,t)=>`<button data-a="${a}" data-p="${p}">${t}</button>`;
 const swb=b('adj','sw:-','➖ Grosor')+b('adj','sw:+','➕ Grosor');
 const end=b('dup','','👯 Copiar')+b('del','','🗑️ Borrar');
 switch(s.t){
 case 'c':return b('adj','r:-','➖ Radio')+b('adj','r:+','➕ Radio')+swb+b('dup','','👯 Gemelo')+b('del','','🗑️ Borrar');
 case 'r':return b('adj','sz:-','➖ Tamaño')+b('adj','sz:+','➕ Tamaño')+swb+end;
 case 't':return `<textarea id="txin" maxlength="2000" rows="3" aria-label="Texto de la pizarra. Enter para una nueva línea" style="width:240px;resize:vertical">${esc(s.txt)}</textarea>`+b('adj','ts:-','A−')+b('adj','ts:+','A+')+['√','²','³','⁴','ⁿ','ˣ'].map((c,i)=>b('ins',c,['√','x²','x³','x⁴','xⁿ','xˣ'][i])).join('')+b('del','','🗑️ Borrar')+'<span class="nt">Enter: nueva línea. También: ^2, ^3, ^5, ^n, ^x…</span>';
 case 'l':case 'p':return b('adj','sw:-','➖ Más delgada')+b('adj','sw:+','➕ Más gruesa')+b('del','','🗑️ Borrar');
 case 'd':return b('adj','k:-','➖ Pasos')+b('adj','k:+','➕ Pasos')+swb+end;
 case 'g':return b('adj','rows:-','➖ Filas')+b('adj','rows:+','➕ Filas')+b('adj','cols:-','➖ Columnas')+b('adj','cols:+','➕ Columnas')+swb+end;
 default:return b('adj','sz:-','➖ Tamaño')+b('adj','sz:+','➕ Tamaño')+swb+end;
 }
}
function ui(){
 putHTML($('#tabs'),TABS.map(t=>`<button data-a="tab" data-p="${t[0]}" class="${tab===t[0]?'on':''}">${t[1]}</button>`).join(''));
 putHTML($('#tools'),TOOLS.map(t=>t==='|'?'<span class="sep"></span>':`<button data-a="${t[0]}" data-p="${t[1]}" class="${t[0]==='tool'&&V.tool===t[1]?'on':''}">${t[2]}</button>`).join(''));
 $('#bBig').classList.toggle('on',big);$('#bBig').textContent=big?'↩ Salir de grande':'🔍 Pizarra grande';
 $('#bSnap').classList.toggle('on',V.snap);
 document.body.classList.toggle('big',big);
 $('#msg').textContent=owlText();
 putHTML($('#pal'),`<span class="lb">${palLabel()}</span>`+COLORS.map(c=>`<button class="sw ${col===c?'ring':''}" data-a="col" data-p="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')+`<button class="sw ${col===null?'ring':''}" data-a="col" data-p="" title="Sin color">⌫</button><input type="color" id="cpick" value="${col||'#111111'}">`);
 const h=ctxHTML();if(h!==lastCtx){putHTML($('#ctx'),h);lastCtx=h}
}
function render(){draw();ui();cmr()}

/* ---------- acciones ---------- */
function add(it){it.id=newId();V.items.push(it);V.sel=it.id;V.tool='m'}
function make(k){
 hist();msgx='';const o=(V.cnt%5)*26;
 if(k==='v2'){const r={t:'r',x:130,y:90,w:740,h:380,c:'#1b2a41',sw:3};add(r);const R=r.id;add({t:'c',x:360,y:280,r:130,c:'#1e3a8a',sw:3.5});add({t:'c',x:600,y:280,r:130,c:'#1e3a8a',sw:3.5});V.sel=R}
 else if(k==='v3'){const r={t:'r',x:130,y:60,w:740,h:440,c:'#1b2a41',sw:3};add(r);const R=r.id;[[420,240],[580,240],[500,370]].forEach(q=>add({t:'c',x:q[0],y:q[1],r:120,c:'#1e3a8a',sw:3.5}));V.sel=R}
 else{V.cnt++;
  const base={c:'#1b2a41',sw:3};
  if(k==='c')add({t:'c',x:400+o,y:280+o,r:100,c:'#1e3a8a',sw:3.5});
  if(k==='r')add({t:'r',x:150+o,y:100+o,w:700,h:340,...base});
  if(k==='d')add({t:'d',x:150+o,y:100+o,k:4,...base});
  if(k==='g')add({t:'g',x:150+o,y:100+o,rows:3,cols:3,cw:90,ch:60,...base});
  if(k==='x')add({t:'x',x:150+o,y:100+o,w:400,h:300,...base});
  if(k==='o')add({t:'o',x:150+o,y:100+o,w:420,h:300,...base});
 }
 draw();ui();
}
function setCol(p){
 col=p||null;const s=sel();
 if(V.tool==='m'&&s&&s.t!=='o'){hist();s.c=cc();}
 draw();ui();
}
function adj(p){
 const s=sel();if(!s)return;const [k,d]=p.split(':'),u=d==='+'?1:-1;hist();
 if(k==='r')s.r=clamp(u>0?s.r*1.15:s.r/1.15,25,300);
 else if(k==='sz'){const f=u>0?1.15:1/1.15;s.w=Math.max(60,s.w*f);if(s.h!=null)s.h=Math.max(60,s.h*f)}
 else if(k==='sw'){if(s.t==='l'||s.t==='p')s.w=clamp(s.w+u,1,30);else s.sw=clamp(s.sw+u,1,20)}
 else if(k==='k')s.k=clamp(s.k+u,1,8);
 else if(k==='rows')s.rows=clamp(s.rows+u,1,10);
 else if(k==='cols')s.cols=clamp(s.cols+u,1,10);
 else if(k==='ts')s.s=clamp(s.s+8*u,18,120);
 draw();ui();
}
function dup(){
 const s=sel();if(!s)return;hist();const c=clone(s);c.id=newId();
 if(c.t==='l'){c.x1+=40;c.x2+=40;c.y1+=30;c.y2+=30}else if(c.t==='p'){c.d=c.d.map(q=>[q[0]+40,q[1]+30])}else{c.x+=40;c.y+=30}
 V.items.push(c);V.sel=c.id;draw();ui();
}
function del(){
 const s=sel();if(!s)return;hist();
 V.items=V.items.filter(o=>o.id!==s.id);
 V.fl=V.fl.filter(f=>f.r!==s.id&&!f.i.includes(s.id));
 V.sel=null;draw();ui();
}
function ins(ch){
 const el=$('#txin'),s=sel();if(!el||!s)return;
 const a=el.selectionStart??el.value.length,b=el.selectionEnd??a;
 let v=el.value.slice(0,a)+ch+el.value.slice(b);if(v.length>2000)return;
 el.value=v;s.txt=v;el.focus();el.setSelectionRange(a+ch.length,a+ch.length);lastCtx=ctxHTML();draw();
}
function toggleBig(){
 big=!big;
 if(big){try{const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
 else{try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}}
 ui();
}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&big){big=false;ui()}});

function clearFill(){P.pts={};P.sg={A:[],B:[],ar:[]};P.tb={};P.th={a:[],b:[]};P.hold=null}
function act(a,p){
 switch(a){
 case 'tab':tab=p;msgx='';render();break;
 case 'big':toggleBig();break;
 case 'undo':undo();break;
 case 'snap':V.snap=!V.snap;ui();break;
 case 'clear':hist();V.items=[];V.fl=[];V.sel=null;draw();ui();break;
 case 'tool':V.tool=p;V.sel=null;msgx='';draw();ui();break;
 case 'clrfl':hist();V.fl=[];draw();ui();break;
 case 'mk':make(p);break;
 case 'col':setCol(p);break;
 case 'adj':adj(p);break;
 case 'dup':dup();break;
 case 'del':del();break;
 case 'ins':ins(p);break;
 case 'swap':{[P.nA,P.nB]=[P.nB,P.nA];[P.eA,P.eB]=[P.eB,P.eA];clearFill();cmr();break}
 case 'chip':{const i=p.indexOf('|'),s=p.slice(0,i),e=p.slice(i+1);P.hold=(P.hold&&P.hold.s===s&&P.hold.e===e)?null:{s,e};cmr();break}
 case 'dvclr':P.dv={};cmr();break;
 case 'rp':P.paint[p]=!P.paint[p];cmr();break;
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(b){act(b.dataset.a,b.dataset.p);return}
 const v=e.target.closest('[data-v]');if(v){P.view=v.dataset.v;P.hold=null;cmr();return}
 const c=e.target.closest('#cart');if(c)cartClick(e,c);
});
document.addEventListener('keydown',e=>{
 const t=e.target.tagName;
 if(e.key==='Delete'&&t!=='INPUT'&&t!=='TEXTAREA'&&sel()){del()}
 if(e.key==='Escape'&&big&&!document.fullscreenElement){big=false;ui()}
});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='cpick'){col=t.value;const s=sel();if(V.tool==='m'&&s&&s.t!=='o')s.c=col;draw();return}
 if(t.id==='txin'){
  const s=sel();if(!s)return;const v=t.value,pos=t.selectionStart;
  const nv=v.replace(/\^([0-9nx])/g,(m,c)=>SUP[c]);
  if(nv!==v){t.value=nv;const np=pos-(v.length-nv.length);t.setSelectionRange(np,np)}
  s.txt=nv;lastCtx=ctxHTML();draw();
 }
});

/* ---------- puntero de la pizarra ---------- */
function pt(e){const s=vs.createSVGPoint();s.x=e.clientX;s.y=e.clientY;const m=vs.getScreenCTM();return m?s.matrixTransform(m.inverse()):{x:0,y:0}}
function paintAt(p){
 hist();
 const rs=V.items.filter(o=>o.t==='r'&&p.x>=o.x&&p.x<=o.x+o.w&&p.y>=o.y&&p.y<=o.y+o.h).sort((a,b)=>a.w*a.h-b.w*b.h);
 const r=rs[0]?rs[0].id:0;
 const ids=V.items.filter(o=>o.t==='c'&&Math.hypot(p.x-o.x,p.y-o.y)<=o.r).map(o=>o.id).sort();
 const k=V.fl.findIndex(f=>f.r===r&&f.i.join()===ids.join());
 const d=descRegion(r,ids);
 if(col===null){if(k>=0)V.fl.splice(k,1);msgx='Color borrado en: '+d+'.'}
 else{if(k>=0)V.fl[k].c=col;else V.fl.push({r,i:ids,c:col});msgx='Pintaste: '+d+'.'}
 draw();ui();
}
vs.addEventListener('pointerdown',e=>{
 if(e.button>0)return;
 const p=pt(e);
 if(V.tool==='f'){paintAt(p);e.preventDefault();return}
 msgx='';
 try{vs.setPointerCapture(e.pointerId)}catch(_){}
 if(V.tool==='p'){hist();const it={t:'p',id:newId(),d:[[p.x,p.y],[p.x,p.y]],c:cc(),w:5};V.items.push(it);D={k:'pen',it};draw();return}
 if(V.tool==='l'){D={k:'ln',x1:sn(p.x),y1:sn(p.y),x2:sn(p.x),y2:sn(p.y)};draw();return}
 if(V.tool==='t'){hist();add({t:'t',x:sn(p.x),y:sn(p.y),s:36,txt:'Texto',c:cc()});foc=true;draw();ui();return}
 const s=sel();
 if(s){
  if(s.t==='c'&&Math.hypot(p.x-(s.x+s.r),p.y-s.y)<=18){hist();D={k:'rad',it:s};return}
  if(s.t==='r'&&Math.hypot(p.x-(s.x+s.w),p.y-(s.y+s.h))<=18){hist();D={k:'rs',it:s};return}
  if(s.t==='l'){
   if(Math.hypot(p.x-s.x1,p.y-s.y1)<=16){hist();D={k:'e1',it:s};return}
   if(Math.hypot(p.x-s.x2,p.y-s.y2)<=16){hist();D={k:'e2',it:s};return}
  }
 }
 for(let i=V.items.length-1;i>=0;i--){
  const o=V.items[i];
  if(hit(o,p)){hist();V.sel=o.id;D={k:'mv',it:o,sx:p.x,sy:p.y,o:clone(o)};draw();ui();return}
 }
 V.sel=null;draw();ui();
});
window.addEventListener('pointermove',e=>{
 if(!D)return;const p=pt(e);const it=D.it;
 switch(D.k){
 case 'pen':it.d.push([p.x,p.y]);break;
 case 'ln':D.x2=sn(p.x);D.y2=sn(p.y);break;
 case 'rad':{let r=Math.hypot(p.x-it.x,p.y-it.y);if(V.snap)r=Math.round(r/25)*25;it.r=clamp(r,25,300);break}
 case 'rs':{let w=p.x-it.x,h=p.y-it.y;if(V.snap){w=Math.round(w/25)*25;h=Math.round(h/25)*25}it.w=Math.max(60,w);it.h=Math.max(60,h);break}
 case 'e1':it.x1=sn(p.x);it.y1=sn(p.y);break;
 case 'e2':it.x2=sn(p.x);it.y2=sn(p.y);break;
 case 'mv':{
  const dx=p.x-D.sx,dy=p.y-D.sy,o=D.o;
  if(it.t==='l'){it.x1=o.x1+dx;it.x2=o.x2+dx;it.y1=o.y1+dy;it.y2=o.y2+dy}
  else if(it.t==='p'){it.d=o.d.map(q=>[q[0]+dx,q[1]+dy])}
  else{it.x=sn(o.x+dx);it.y=sn(o.y+dy)}
  break}
 }
 draw();
});
window.addEventListener('pointerup',()=>{
 if(foc){foc=false;const el=$('#txin');if(el){el.focus();el.select()}}
 if(!D)return;const d=D;D=null;
 if(d.k==='ln'){
  if(Math.hypot(d.x2-d.x1,d.y2-d.y1)>=6){hist();add({t:'l',x1:d.x1,y1:d.y1,x2:d.x2,y2:d.y2,c:cc(),w:2})}
  draw();ui();return;
 }
 draw();ui();
});
window.addEventListener('pointercancel',()=>{if(D){D=null;draw();ui()}});

/* ---------- pestañas de contenido ---------- */
function cmr(){
 if(tab==='v'){cm.style.display='none';putHTML(cm,'');return}
 cm.style.display='block';
 putHTML(cm,tab==='prod'?cmProd():tab==='dv'?cmDv():cmRev());
}
const X=(i,n)=>50+(i+1)*340/(n+1),Y=(j,m)=>280-(j+1)*240/(m+1);
function cellVal(i,j,a,b){const k=i+','+j;if(P.tb[k]!==undefined)return P.tb[k];const ha=P.th.a[i],hb=P.th.b[j];return(ha&&hb)?`(${ha}; ${hb})`:''}
function cmProd(){
 const a=pList(P.eA),b=pList(P.eB);
 let h=`<div class="row"><span>Conjunto <input data-f="nA" size="2" maxlength="2" value="${esc(P.nA)}"> = { <input data-f="eA" style="width:130px" value="${esc(P.eA)}"> }</span><span><input data-f="nB" size="2" maxlength="2" value="${esc(P.nB)}"> = { <input data-f="eB" style="width:130px" value="${esc(P.eB)}"> }</span><button data-a="swap">⇄ Intercambiar</button></div>`;
 h+=`<div style="font-size:18px;margin:8px 0">n(${esc(P.nA)}) · n(${esc(P.nB)}) = ${a.length} × ${b.length} = <b>${a.length*b.length}</b> ✓</div>`;
 h+=`<div class="row">`+[['lista','Lista'],['tabla','Tabla'],['cart','Cartesiano'],['sag','Sagital']].map(v=>`<button data-v="${v[0]}" class="${P.view===v[0]?'on':''}">${v[1]}</button>`).join('')+`</div>`;
 if(!a.length||!b.length)return h+'<p>Escribe al menos un elemento en cada conjunto.</p>';
 if(P.view==='lista'){
  h+=`<div class="card"><b>${esc(P.nA)} × ${esc(P.nB)} = {</b><textarea data-f="li" rows="5" style="width:100%;font-size:16px" placeholder="Escribe aquí los pares…">${esc(P.li)}</textarea><b>}</b></div>`;
 }else if(P.view==='tabla'){
  h+=`<table id="tbl"><tr><td></td>${b.map((_,j)=>`<td><input data-f="th" data-s="b" data-i="${j}" size="4" maxlength="6" style="font-weight:700;text-align:center" placeholder="…" value="${esc(P.th.b[j]||'')}"></td>`).join('')}</tr>`;
  a.forEach((_,i)=>{h+=`<tr><td><input data-f="th" data-s="a" data-i="${i}" size="4" maxlength="6" style="font-weight:700;text-align:center" placeholder="…" value="${esc(P.th.a[i]||'')}"></td>`+b.map((_,j)=>`<td><input data-f="tb" data-k="${i},${j}" size="8" maxlength="14" style="text-align:center" value="${esc(cellVal(i,j,a,b))}"></td>`).join('')+'</tr>'});
  h+=`</table><p class="sub">Completa los números de arriba y de la izquierda: los pares salen solos en cada casilla.</p>`;
 }else if(P.view==='cart'){
  let s=`<svg id="cart" viewBox="0 0 420 320" width="460" style="touch-action:manipulation"><line class="ax" x1="50" y1="280" x2="410" y2="280"/><line class="ax" x1="50" y1="280" x2="50" y2="15"/><text class="s" x="405" y="300">${esc(P.nA)}</text><text class="s" x="30" y="22">${esc(P.nB)}</text>`;
  a.forEach((e,i)=>{s+=`<text class="s" x="${X(i,a.length)}" y="300">${esc(e)}</text>`});
  b.forEach((e,j)=>{s+=`<text class="s" x="34" y="${Y(j,b.length)+5}">${esc(e)}</text>`});
  a.forEach((_,i)=>b.forEach((_,j)=>{s+=`<circle cx="${X(i,a.length)}" cy="${Y(j,b.length)}" r="3" style="fill:var(--bd)"/>`}));
  Object.keys(P.pts).forEach(k=>{const [i,j]=k.split(',').map(Number);if(i<a.length&&j<b.length)s+=`<circle cx="${X(i,a.length)}" cy="${Y(j,b.length)}" r="10" fill="${P.pts[k]}" style="pointer-events:none"/>`});
  h+=`<div class="card" style="display:inline-block;max-width:100%">${s}</svg></div><p class="sub">Toca un cruce para poner un punto con el color elegido; tócalo otra vez para quitarlo.</p>`;
 }else{
  const pl=(s,l)=>l.filter(e=>!P.sg[s].some(q=>q.e===e));
  const chips=(s,l,cls)=>pl(s,l).map(e=>`<button class="chip ${cls}${P.hold&&P.hold.s===s&&P.hold.e===e?' on':''}" data-a="chip" data-p="${s}|${esc(e)}">${esc(e)}</button>`).join('');
  h+=`<div class="row"><span><b>${esc(P.nA)}</b> ${chips('A',a,'')}</span><span><b>${esc(P.nB)}</b> ${chips('B',b,'b')}</span></div>`;
  let s=`<svg id="sag" viewBox="0 0 420 320" width="460" style="touch-action:none"><defs>`;
  const used=[...new Set(P.sg.ar.map(r=>r.c))];
  used.forEach(c=>{s+=`<marker id="mk${c.replace('#','')}" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" refX="10" refY="5.5" orient="auto"><path d="M0 0L11 5.5L0 11z" fill="${c}"/></marker>`});
  s+=`</defs><ellipse cx="70" cy="160" rx="55" ry="150" fill="none" stroke="#2563eb" stroke-width="3"/><ellipse cx="350" cy="160" rx="55" ry="150" fill="none" stroke="#e03e3e" stroke-width="3"/><text class="s" x="70" y="14">${esc(P.nA)}</text><text class="s" x="350" y="14">${esc(P.nB)}</text>`;
  P.sg.ar.forEach((r,n)=>{const A=P.sg.A[r.a],B=P.sg.B[r.b];if(!A||!B)return;
   s+=`<line x1="${A.x+17}" y1="${A.y}" x2="${B.x-19}" y2="${B.y}" stroke="${r.c}" stroke-width="3" marker-end="url(#mk${r.c.replace('#','')})"/><line data-ar="${n}" x1="${A.x+17}" y1="${A.y}" x2="${B.x-19}" y2="${B.y}" stroke="transparent" stroke-width="14" style="cursor:pointer"/>`});
  ['A','B'].forEach(side=>P.sg[side].forEach((q,i)=>{s+=`<g class="se" data-s="${side}" data-i="${i}" style="cursor:pointer"><circle cx="${q.x}" cy="${q.y}" r="17" style="fill:var(--cd)" stroke="${side==='A'?'#2563eb':'#e03e3e'}" stroke-width="2.5"/><text class="s" x="${q.x}" y="${q.y+5}" style="pointer-events:none">${esc(q.e)}</text></g>`}));
  h+=`<div class="card" style="display:inline-block;max-width:100%">${s}</svg></div><p class="sub">Elige un elemento arriba y toca dentro del óvalo para colocarlo. Arrastra de un elemento de A a uno de B para hacer una flecha con el color elegido. Toca una flecha o un elemento para quitarlo.</p>`;
 }
 return h;
}
function cartClick(e,svg){
 const s=svg.createSVGPoint();s.x=e.clientX;s.y=e.clientY;const q=s.matrixTransform(svg.getScreenCTM().inverse());
 const a=pList(P.eA),b=pList(P.eB);let best=null,bd=24;
 a.forEach((_,i)=>b.forEach((_,j)=>{const d=Math.hypot(q.x-X(i,a.length),q.y-Y(j,b.length));if(d<bd){bd=d;best=[i,j]}}));
 if(!best)return;const k=best.join(),c=cc();
 if(P.pts[k]===c)delete P.pts[k];else P.pts[k]=c;cmr();
}
function cmDv(){
 const k=P.ds,W=60+(k+1)*100+40,H=50+k*90+130;
 let h=`<div class="row"><label>Pasos <input data-f="ds" type="number" min="1" max="8" style="width:60px" value="${k}"></label><button data-a="dvclr">🧽 Borrar números</button></div>`;
 let svg='',inp='';
 const I=(key,x,y,color)=>`<input data-f="dv" data-k="${key}" style="left:${x-30}px;top:${y-26}px${color?';color:'+color:''}" value="${esc(P.dv[key]||'')}">`;
 for(let i=0;i<k;i++){
  const x=60+100*i,y=50+90*i;
  svg+=`<line x1="${x+35}" y1="${y-26}" x2="${x+35}" y2="${y+12}"/><line x1="${x+35}" y1="${y+12}" x2="${x+100}" y2="${y+12}"/><line x1="${x-30}" y1="${y+86}" x2="${x+30}" y2="${y+86}"/>`;
  inp+=I('d'+i,x,y)+I('v'+i,x+65,y)+I('p'+i,x,y+75)+I('r'+i,x,y+114,'#e03e3e');
 }
 inp+=I('f',60+100*k,50+90*k,'#2563eb');
 return h+`<div class="dvb" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" style="position:absolute;left:0;top:0" stroke-width="3" stroke-linecap="round"><g style="stroke:var(--tx)">${svg}</g></svg>${inp}</div>`;
}
function cmRev(){
 const re=/\(\s*([^;,()]+?)\s*[;,]\s*([^()]+?)\s*\)/g;
 const A=[],B=[];let m,n=0;
 while((m=re.exec(P.rev))){n++;if(!A.includes(m[1]))A.push(m[1]);if(!B.includes(m[2]))B.push(m[2])}
 let h=`<div class="row"><textarea data-f="rev" rows="2" style="flex:1;min-width:240px">${esc(P.rev)}</textarea></div>`;
 if(!n)return h+'<p>Escribe pares como (a; 1); (a; 2)…</p>';
 const oA=A.filter(x=>!B.includes(x)),it=A.filter(x=>B.includes(x)),oB=B.filter(x=>!A.includes(x));
 h+=`<div class="row">`+[['a','Pintar A − B'],['i','Pintar A ∩ B'],['b','Pintar B − A']].map(t=>`<button data-a="rp" data-p="${t[0]}" class="${P.paint[t[0]]?'on':''}">${t[1]}</button>`).join('')+`</div>`;
 let s=`<svg viewBox="0 0 480 280" width="500"><defs><mask id="rmA" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="280"><rect width="480" height="280" fill="#fff"/><circle cx="290" cy="140" r="105" fill="#000"/></mask><mask id="rmB" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="280"><rect width="480" height="280" fill="#fff"/><circle cx="190" cy="140" r="105" fill="#000"/></mask><clipPath id="rcB"><circle cx="290" cy="140" r="105"/></clipPath></defs>`;
 if(P.paint.a)s+=`<circle cx="190" cy="140" r="105" fill="#2563eb" opacity=".55" mask="url(#rmA)"/>`;
 if(P.paint.b)s+=`<circle cx="290" cy="140" r="105" fill="#e03e3e" opacity=".55" mask="url(#rmB)"/>`;
 if(P.paint.i)s+=`<g clip-path="url(#rcB)"><circle cx="190" cy="140" r="105" fill="#eab308" opacity=".8"/></g>`;
 s+=`<circle cx="190" cy="140" r="105" fill="none" stroke="#1e3a8a" stroke-width="3"/><circle cx="290" cy="140" r="105" fill="none" stroke="#991b1b" stroke-width="3"/><text class="s" x="100" y="40" style="font-weight:700">A</text><text class="s" x="380" y="40" style="font-weight:700">B</text>`;
 const col3=(l,x)=>l.map((e,i)=>`<text class="s" x="${x}" y="${145+(i-(l.length-1)/2)*22}" dominant-baseline="central">${esc(e)}</text>`).join('');
 s+=col3(oA,125)+col3(it,240)+col3(oB,355)+'</svg>';
 const set=l=>l.length?'{'+l.map(esc).join('; ')+'}':'∅';
 h+=`<div class="card" style="display:inline-block;max-width:100%">${s}</div>`;
 const tot=oA.length+it.length+oB.length;
 h+=`<div class="card"><div>A = ${set(A)} · B = ${set(B)}</div><div>A − B = ${set(oA)} · A ∩ B = ${set(it)} · B − A = ${set(oB)}</div><div><b>n(A ∪ B) = ${A.length} + ${B.length}${it.length?' − '+it.length:''} = ${tot}</b></div></div>`;
 return h;
}

/* ---------- campos de las pestañas (change) ---------- */
function refreshTable(){
 const a=pList(P.eA),b=pList(P.eB);
 document.querySelectorAll('#tbl input[data-f=tb]').forEach(el=>{const [i,j]=el.dataset.k.split(',').map(Number);el.value=cellVal(i,j,a,b)});
}
document.addEventListener('change',e=>{
 const t=e.target,f=t.dataset&&t.dataset.f;if(!f)return;
 switch(f){
 case 'nA':P.nA=t.value.trim().slice(0,2)||'A';cmr();break;
 case 'nB':P.nB=t.value.trim().slice(0,2)||'B';cmr();break;
 case 'eA':case 'eB':P[f]=t.value;clearFill();cmr();break;
 case 'li':P.li=t.value;break;
 case 'tb':P.tb[t.dataset.k]=t.value;break;
 case 'th':{
  const s=t.dataset.s,i=+t.dataset.i;P.th[s][i]=t.value.trim();
  Object.keys(P.tb).forEach(k=>{const [x,y]=k.split(',').map(Number);if((s==='a'&&x===i)||(s==='b'&&y===i))delete P.tb[k]});
  refreshTable();break}
 case 'rev':P.rev=t.value;cmr();break;
 case 'ds':P.ds=clamp(Math.round(+t.value)||4,1,8);cmr();break;
 case 'dv':P.dv[t.dataset.k]=t.value;break;
 }
});

/* ---------- Sagital: colocar, flechas, quitar ---------- */
let D2=null;
function sagPt(e,svg){const s=svg.createSVGPoint();s.x=e.clientX;s.y=e.clientY;return s.matrixTransform(svg.getScreenCTM().inverse())}
cm.addEventListener('pointerdown',e=>{
 const svg=e.target.closest('#sag');if(!svg||e.button>0)return;
 const q=sagPt(e,svg),se=e.target.closest('.se'),ar=e.target.closest('[data-ar]');
 if(se){D2={s:se.dataset.s,i:+se.dataset.i,x:e.clientX,y:e.clientY,moved:false,svg};try{svg.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();return}
 if(ar){P.sg.ar.splice(+ar.dataset.ar,1);cmr();return}
 if(P.hold){
  const s=P.hold.s,cx=s==='A'?70:350;
  if(((q.x-cx)/55)**2+((q.y-160)/150)**2<=1){P.sg[s].push({e:P.hold.e,x:q.x,y:q.y});P.hold=null;cmr()}
 }
});
cm.addEventListener('pointermove',e=>{
 if(!D2)return;
 if(!D2.moved&&Math.hypot(e.clientX-D2.x,e.clientY-D2.y)>6)D2.moved=true;
 if(D2.moved&&D2.s==='A'){
  const src=P.sg.A[D2.i],q=sagPt(e,D2.svg);let pv=D2.svg.querySelector('#pv');
  if(!pv){pv=document.createElementNS('http://www.w3.org/2000/svg','line');pv.id='pv';pv.setAttribute('stroke-dasharray','6 4');pv.setAttribute('stroke-width','3');pv.style.pointerEvents='none';D2.svg.appendChild(pv)}
  pv.setAttribute('stroke',cc());pv.setAttribute('x1',src.x+17);pv.setAttribute('y1',src.y);pv.setAttribute('x2',q.x);pv.setAttribute('y2',q.y);
 }
});
cm.addEventListener('pointerup',e=>{
 if(!D2)return;const d=D2;D2=null;
 if(d.moved){
  if(d.s==='A'){
   const pv=d.svg.querySelector('#pv');if(pv)pv.remove();
   const t=document.elementFromPoint(e.clientX,e.clientY),g=t&&t.closest?t.closest('.se'):null;
   if(g&&g.dataset.s==='B'){
    const b=+g.dataset.i,ex=P.sg.ar.find(r=>r.a===d.i&&r.b===b);
    if(ex)ex.c=cc();else P.sg.ar.push({a:d.i,b,c:cc()});
   }
  }
  cmr();return;
 }
 const L=P.sg[d.s];L.splice(d.i,1);
 P.sg.ar=P.sg.ar.filter(r=>(d.s==='A'?r.a:r.b)!==d.i);
 P.sg.ar.forEach(r=>{if(d.s==='A'&&r.a>d.i)r.a--;if(d.s==='B'&&r.b>d.i)r.b--});
 cmr();
});

render();

export const arithmetic={V,P,render,draw,ui,cmr,get tab(){return tab},get dragging(){return !!D||!!D2},cancel(){D=null;D2=null},init(h){newId=h.newId;undoShared=h.undo},resetContext(){lastCtx=''}};




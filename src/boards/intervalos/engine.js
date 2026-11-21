import {sup,toSup,norm as normBase,pretty,fr} from '../algebra-completa/engine.js';
/* ===== Intervalos en ℤ: núcleo (conjuntos = lista de tramos [lo,hi] con enteros) ===== */
const norm=s=>normBase(s).replace(/[δ△▵∆]/g,'Δ');
const INF=Infinity;
const M=n=>n===INF?'+∞':n===-INF?'−∞':String(n).replace('-','−');
const iNum=t=>{t=t.replace(/^\+/,'');if(/^-?(∞|inf)$/.test(t))return t[0]==='-'?-INF:INF;return/^-?\d+$/.test(t)?+t:null};
function mkIv(a,b,lc,rc,v,src){
 if(a===INF||b===-INF||Number.isNaN(a)||Number.isNaN(b))throw 'El infinito negativo va a la izquierda y el positivo a la derecha.';
 if(a>b)throw 'El intervalo empieza en '+M(a)+' y termina en '+M(b)+'. El extremo izquierdo no puede ser mayor que el derecho. Revisa esos dos números.';
 lc=lc&&isFinite(a);rc=rc&&isFinite(b);
 return{a,b,lc,rc,v:v||'x',src,lo:isFinite(a)?(lc?a:a+1):-INF,hi:isFinite(b)?(rc?b:b-1):INF}}
function parseIv(t){
 t=t.replace(/^[a-z]?∈/,'');
 const m=/^([⟨(\[<])(.+?)[;,](.+?)([⟩)\]>])$/.exec(t);if(!m)return null;
 const a=iNum(m[2]),b=iNum(m[3]);if(a===null||b===null)return null;
 return mkIv(a,b,m[1]==='[',m[4]===']','x','iv')}
const CL=o=>/=|≤|≥/.test(o),UP=o=>/[<≤]/.test(o),OP='(<=|≤|<|>=|≥|>)';
function parseIneq(t){
 let m=new RegExp('^([+-]?\\d+)'+OP+'([a-z])'+OP+'([+-]?\\d+)$').exec(t);
 if(m){if(UP(m[2])!==UP(m[4]))return null;
  let a=+m[1],b=+m[5],ca=CL(m[2]),cb=CL(m[4]);if(!UP(m[2])){[a,b]=[b,a];[ca,cb]=[cb,ca]}
  return mkIv(a,b,ca,cb,m[3],'ineq')}
 m=new RegExp('^([a-z])'+OP+'([+-]?\\d+)$').exec(t);
 if(m)return UP(m[2])?mkIv(-INF,+m[3],false,CL(m[2]),m[1],'ineq'):mkIv(+m[3],INF,CL(m[2]),false,m[1],'ineq');
 m=new RegExp('^([+-]?\\d+)'+OP+'([a-z])$').exec(t);
 if(m)return UP(m[2])?mkIv(+m[1],INF,CL(m[2]),false,m[3],'ineq'):mkIv(-INF,+m[1],false,CL(m[2]),m[3],'ineq');
 return null}
const parseSet=t=>parseIv(t)||parseIneq(t);
const ivR=i=>i.lo<=i.hi?[[i.lo,i.hi]]:[];
/* álgebra de tramos */
const rn=a=>{a=a.filter(r=>r[0]<=r[1]).sort((x,y)=>x[0]-y[0]);const o=[];for(const r of a){const l=o[o.length-1];if(l&&r[0]<=l[1]+1)l[1]=Math.max(l[1],r[1]);else o.push([r[0],r[1]])}return o};
const rU=(A,B)=>rn(A.concat(B));
const rC=A=>{const o=[];let s=-INF;for(const r of A){if(r[0]>s)o.push([s,r[0]-1]);s=r[1]+1}if(s<INF)o.push([s,INF]);return o};
const rI=(A,B)=>{const o=[];for(const x of A)for(const y of B){const l=Math.max(x[0],y[0]),h=Math.min(x[1],y[1]);if(l<=h)o.push([l,h])}return rn(o)};
const rD=(A,B)=>rI(A,rC(B));

/* ===== Intervalos en ℤ: texto y recta numérica ===== */
const seq=(l,h)=>{const o=[];for(let v=l;v<=h;v++)o.push(M(v));return o.join('; ')};
function ext(R){if(!R.length)return'{ }';
 return'{'+R.map(([l,h])=>{const f=isFinite(l),g=isFinite(h);
  if(f&&g)return h-l+1<=16?seq(l,h):seq(l,l+2)+'; …; '+seq(h-1,h);
  if(f)return seq(l,l+2)+'; …';
  if(g)return'…; '+seq(h-2,h);
  return'…; −1; 0; 1; …'}).join('; ')+'}'}
function ivTxt(R,E){if(!R.length)return'∅';
 const T=R.map(([l,h])=>{
  if(l===h&&!(E.has(l-1)&&E.has(l+1)))return{b:M(l)};
  const L=isFinite(l)?(E.has(l-1)?'⟨'+M(l-1):'['+M(l)):'⟨−∞';
  const U=isFinite(h)?(E.has(h+1)?M(h+1)+'⟩':M(h)+']'):'+∞⟩';
  return{t:L+'; '+U}});
 if(T.every(x=>x.b!==undefined))return'{'+T.map(x=>x.b).join('; ')+'}';
 return T.map(x=>x.t||'{'+x.b+'}').join(' ∪ ')}
const ivNot=i=>(i.lc?'[':'⟨')+M(i.a)+'; '+M(i.b)+(i.rc?']':'⟩');
function ineqTxt(i,x){x=x||'x';
 if(i.a===-INF&&i.b===INF)return x+' ∈ ℤ';
 if(i.a===-INF)return x+(i.rc?' ≤ ':' < ')+M(i.b);
 if(i.b===INF)return x+(i.lc?' ≥ ':' > ')+M(i.a);
 return M(i.a)+(i.lc?' ≤ ':' < ')+x+(i.rc?' ≤ ':' < ')+M(i.b)}
const openEnds=i=>[!i.lc&&isFinite(i.a)?i.a:null,!i.rc&&isFinite(i.b)?i.b:null].filter(v=>v!==null);
/* recta numérica en SVG: filas {label,R,color,open:[valores]} */
function nl(rows){
 let mn=INF,mx=-INF;const up=v=>{if(isFinite(v)){mn=Math.min(mn,v);mx=Math.max(mx,v)}};
 rows.forEach(r=>{r.R.forEach(q=>{up(q[0]);up(q[1])});(r.open||[]).forEach(up)});
 if(mn===INF||mx-mn>26)return'';
 mn-=2;mx+=2;
 const S=30,X0=58,n=mx-mn+1,W=X0+n*S+6,H=rows.length*36+30,x=v=>X0+(v-mn)*S+S/2;
 let s=`<svg class="nl" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Recta numérica">`;
 rows.forEach((r,i)=>{const y=22+i*36,c=r.color;
  s+=`<text x="4" y="${y+6}" fill="${c}" class="nlt b">${r.label}</text><line x1="${X0}" y1="${y}" x2="${W-4}" y2="${y}" class="ax"/>`;
  for(let v=mn;v<=mx;v++){
   if(r.R.some(q=>v>=q[0]&&v<=q[1]))s+=`<circle cx="${x(v)}" cy="${y}" r="8" fill="${c}"/>`;
   else s+=`<line x1="${x(v)}" y1="${y-4}" x2="${x(v)}" y2="${y+4}" class="ax"/>`}
  (r.open||[]).forEach(v=>{s+=`<circle cx="${x(v)}" cy="${y}" r="8" fill="#234a3c" stroke="${c}" class="sw"/>`});
  if(r.R.some(q=>q[0]===-INF))s+=`<polygon points="${X0-2},${y} ${X0+10},${y-7} ${X0+10},${y+7}" fill="${c}"/>`;
  if(r.R.some(q=>q[1]===INF))s+=`<polygon points="${W-2},${y} ${W-14},${y-7} ${W-14},${y+7}" fill="${c}"/>`});
 for(let v=mn;v<=mx;v++)s+=`<text x="${x(v)}" y="${H-6}" class="nlt" fill="#f4f1e8">${M(v)}</text>`;
 return s+'</svg>'}

function nlB(rows,RR,E){const edge=(l,h)=>[isFinite(l)?(E.has(l-1)?l-1:l):-INF,isFinite(h)?(E.has(h+1)?h+1:h):INF],bands=RR.map(r=>edge(r[0],r[1])),pts=[...E];bands.forEach(b=>b.forEach(v=>{if(isFinite(v))pts.push(v)}));if(!pts.length)pts.push(-4,4);const mn=Math.min(...pts),mx=Math.max(...pts),sp=Math.max(mx-mn,2),pd=Math.max(sp*.2,1),lo=mn-pd,hi=mx+pd,W=640,L=60,x=v=>v===-INF?34:v===INF?W-34:L+(v-lo)/(hi-lo)*(W-2*L),n=rows.length,hm=44+30*(n-1),AY=hm+58,H=AY+46,BL='#2b3a9e',DK='#1d1d1d',ang=[45,-45,0,90];let s=`<svg class='nl' viewBox='0 0 ${W} ${H}' width='${W}' role='img' aria-label='Recta numérica'><defs>${ang.map((a,i)=>`<pattern id='nlh${i}' width='9' height='9' patternUnits='userSpaceOnUse' patternTransform='rotate(${a})'><line x1='0' y1='0' x2='0' y2='9' stroke='${DK}' stroke-width='1.6'/></pattern>`).join('')}</defs><rect width='${W}' height='${H}' rx='12' fill='#fff8cf'/>`;bands.forEach(b=>{let x1=x(b[0]),x2=x(b[1]);if(x2-x1<6){x1-=3;x2+=3}s+=`<rect x='${x1}' y='${AY-hm-24}' width='${x2-x1}' height='${hm+24}' fill='#2fbf71' fill-opacity='.3'/><rect x='${x1}' y='${AY+5}' width='${x2-x1}' height='9' rx='4' fill='#1f9d57'/>`});s+=`<line x1='10' y1='${AY}' x2='${W-10}' y2='${AY}' stroke='${BL}' stroke-width='3'/><polygon points='4,${AY} 18,${AY-8} 18,${AY+8}' fill='${BL}'/><polygon points='${W-4},${AY} ${W-18},${AY-8} ${W-18},${AY+8}' fill='${BL}'/><text x='34' y='${AY+30}' text-anchor='middle' font-size='16' font-weight='800' fill='${BL}' font-family='Nunito,sans-serif'>−∞</text><text x='${W-34}' y='${AY+30}' text-anchor='middle' font-size='16' font-weight='800' fill='${BL}' font-family='Nunito,sans-serif'>+∞</text>`;const own={};rows.forEach((r,k)=>{const a=r.iv.a,b=r.iv.b,x1=x(a),x2=x(b),h=44+30*k,yt=AY-h;s+=`<rect x='${x1}' y='${yt}' width='${x2-x1}' height='${h}' fill='url(#nlh${k%4})' fill-opacity='.85'/>`;let d=`M${x1},${yt}H${x2}`;if(isFinite(a))d+=`M${x1},${yt}V${AY}`;if(isFinite(b))d+=`M${x2},${yt}V${AY}`;s+=`<path d='${d}' fill='none' stroke='${r.color}' stroke-width='4' stroke-linecap='round'/><text x='${isFinite(a)?x1+26:x1+40}' y='${yt-12}' text-anchor='middle' font-size='28' font-weight='800' fill='${r.color}' font-family='Nunito,sans-serif'>${r.label}</text>`;[[a,r.iv.lc],[b,r.iv.rc]].forEach(([v,c])=>{if(!isFinite(v))return;s+=`<line x1='${x(v)}' y1='${AY-6}' x2='${x(v)}' y2='${AY+6}' stroke='${BL}' stroke-width='3'/><circle cx='${x(v)}' cy='${yt}' r='9' fill='${c?DK:'#fff'}' stroke='${c?DK:r.color}' stroke-width='3.5'/>`;own[v]=own[v]===undefined?r.color:DK})});Object.keys(own).forEach(v=>{s+=`<text x='${x(+v)}' y='${AY+32}' text-anchor='middle' font-size='22' font-weight='800' fill='${own[v]}' font-family='Nunito,sans-serif'>${M(+v)}</text>`});return s+'</svg>'}
function nlOld(rows,RR,E,bc){bc=bc||'#ffd84d';const edge=(l,h)=>[isFinite(l)?(E.has(l-1)?l-1:l):-INF,isFinite(h)?(E.has(h+1)?h+1:h):INF],bands=RR.map(r=>edge(r[0],r[1])),pts=[...E];bands.forEach(b=>b.forEach(v=>{if(isFinite(v))pts.push(v)}));if(!pts.length)return'';const mn=Math.min(...pts),mx=Math.max(...pts),sp=Math.max(mx-mn,2),pd=Math.max(sp*.2,1),lo=mn-pd,hi=mx+pd,W=640,L=34,x=v=>v===-INF?18:v===INF?W-18:L+(v-lo)/(hi-lo)*(W-2*L),n=rows.length,AY=n*40+34,H=AY+42,top=AY-40*n-2,ink='#f4f1e8';let s=`<svg class='nl' viewBox='0 0 ${W} ${H}' width='${W}' role='img' aria-label='Recta numérica'>`;bands.forEach(b=>{let x1=x(b[0]),x2=x(b[1]);if(x2-x1<6){x1-=3;x2+=3}s+=`<rect x='${x1}' y='${top}' width='${x2-x1}' height='${AY-top}' fill='${bc}' fill-opacity='.4'/>`});s+=`<line class='ax' x1='8' y1='${AY}' x2='${W-8}' y2='${AY}'/><polygon points='2,${AY} 14,${AY-7} 14,${AY+7}' fill='${ink}' fill-opacity='.7'/><polygon points='${W-2},${AY} ${W-14},${AY-7} ${W-14},${AY+7}' fill='${ink}' fill-opacity='.7'/>`;const own={};rows.forEach((r,k)=>{const a=r.iv.a,b=r.iv.b,x1=x(a),x2=x(b),yb=AY-40*k-6,yt=yb-32;let d=`M${x1},${yt}H${x2}M${x1},${yb}H${x2}`;if(isFinite(a))d+=`M${x1},${yt}V${yb}`;if(isFinite(b))d+=`M${x2},${yt}V${yb}`;s+=`<path d='${d}' fill='none' stroke='${r.color}' stroke-width='3'/>`;s+=isFinite(a)?`<text x='${x1-10}' y='${yt+23}' text-anchor='end' font-size='18' font-weight='800' fill='${r.color}' font-family='Nunito,sans-serif'>${r.label}</text>`:`<text x='${x1+14}' y='${yt+23}' font-size='18' font-weight='800' fill='${r.color}' font-family='Nunito,sans-serif'>${r.label}</text>`;[[a,r.iv.lc],[b,r.iv.rc]].forEach(([v,c])=>{if(!isFinite(v))return;s+=`<circle cx='${x(v)}' cy='${AY}' r='10' fill='${c?r.color:'#234a3c'}' stroke='${r.color}' stroke-width='3'/>`;own[v]=own[v]===undefined?r.color:ink})});Object.keys(own).forEach(v=>{s+=`<text x='${x(+v)}' y='${AY+30}' text-anchor='middle' font-size='18' font-weight='800' fill='${own[v]}' font-family='Nunito,sans-serif'>${M(+v)}</text>`});return s+'</svg>'}
/* ===== Intervalos en ℤ: lectura del ejercicio y los 3 temas ===== */
const BL='⟨([',BR='⟩)]',PR=/['’′]$/,AYUDA='Escribe intervalos como ⟨2; 8⟩ o [−3; 5⟩. Ejemplo: A = ⟨2; 8⟩ , B = [5; 12⟩ , A ∪ B';
function topSplit(s){const r=[];let d=0,c='';for(const ch of s){if(BL.includes(ch))d++;if(BR.includes(ch))d--;
 if((ch===','||ch===';')&&d<=0){r.push(c);c=''}else c+=ch}r.push(c);return r.filter(Boolean)}
function ivParse(s){
 const defs={},order=[],lits=[];let expr=null;
 const one=parseSet(s);if(one){lits.push(one);return{defs,order,lits,expr}}
 for(const st of topSplit(s)){
  let m=/^([a-z])=(.+)$/.exec(st),iv;
  if(m&&(iv=parseSet(m[2]))){iv.name=m[1];defs[m[1]]=iv;order.push(m[1]);continue}
  m=/^([a-z])?∈(.+)$/.exec(st);
  if(m&&(iv=parseSet(m[2]))){const nm=m[1]||'x';iv.name=nm;defs[nm]=iv;order.push(nm);continue}
  iv=parseSet(st);if(iv){lits.push(iv);continue}
  if(expr===null&&/[∪∩Δ'’′-]/.test(st)){expr=st;continue}
  throw'No entiendo “'+st+'”. '+AYUDA}
 return{defs,order,lits,expr}}
function splitExpr(e){let d=0,c='';const ps=[],ops=[];
 for(const ch of e){if(BL.includes(ch))d++;if(BR.includes(ch))d--;
  if(d<=0&&(ch==='∪'||ch==='∩'||ch==='Δ'||ch==='-')){ps.push(c);ops.push(ch);c=''}else c+=ch}
 ps.push(c);return{ps,ops}}
function opnd(t,defs,k){let comp=false,iv;
 if(!t)throw'Falta un conjunto al lado del signo. '+AYUDA;
 if(PR.test(t)){comp=true;t=t.slice(0,-1)}
 if(/^[a-z]$/.test(t)){iv=defs[t];if(!iv)throw'No sé qué es “'+t.toUpperCase()+'”. Defínelo, por ejemplo: '+t.toUpperCase()+' = ⟨2; 8⟩'}
 else{iv=parseSet(t);if(!iv)throw'No entiendo “'+t+'”. '+AYUDA;iv.name=iv.name||'ab'[k]||'x'}
 const nm=iv.name||iv.v||'x';
 return{iv,comp,name:nm==='x'?'x':nm.toUpperCase(),R:ivR(iv)}}
const PV=v=>v<0?'('+M(v)+')':M(v);
/* Tema: un intervalo o una desigualdad */
function tIv(s){const P=ivParse(s);
 if(P.expr)throw'Aquí va UN solo intervalo o desigualdad. Para unión, intersección, diferencia o complemento usa los otros temas.';
 const all=P.order.map(k=>P.defs[k]).concat(P.lits);
 if(all.length!==1)throw'Escribe un intervalo como [−5; 3⟩ o una desigualdad como −5 ≤ x < 3.';
 const i=all[0],nm=i.name&&i.name!=='x'?i.name.toUpperCase():(i.src==='ineq'?i.v:'x'),
  R=ivR(i),I=ivNot(i),Q=ineqTxt(i,i.v||'x'),fin=isFinite(i.a)&&isFinite(i.b),E=new Set([i.a,i.b].filter(isFinite)),
  cnt=R.length?i.hi-i.lo+1:0,tipo=i.lc&&i.rc?'cerrado':!i.lc&&!i.rc?'abierto':'semiabierto',
  named=i.name&&i.name!=='x'?nm+' = ':'';
 const izq=isFinite(i.a)?(i.lc?`el ${M(i.a)} SÍ entra`:`el ${M(i.a)} NO entra (empezamos en ${M(i.lo)})`):'sigue sin parar hacia la izquierda (−∞)';
 const der=isFinite(i.b)?(i.rc?`el ${M(i.b)} SÍ entra`:`el ${M(i.b)} NO entra (terminamos en ${M(i.hi)})`):'sigue sin parar hacia la derecha (+∞)';
 let n,nSay;
 if(!fin){n=`n(${nm}) = ∞ (infinitos elementos)`;nSay='Un intervalo al infinito tiene infinitos enteros: no se pueden contar.'}
 else if(!R.length){n=`n(${nm}) = 0`;nSay='No hay ningún entero dentro: el conjunto es vacío.'}
 else{const f=i.lc&&i.rc?'+ 1':!i.lc&&!i.rc?'− 1':'',k=`${M(i.b)} − ${PV(i.a)}${f?' '+f:''}`;
  n=`n(${nm}) = ${k} = ${cnt}`;
  nSay=`Intervalo ${tipo}: `+(i.lc&&i.rc?'n = b − a + 1.':!i.lc&&!i.rc?'n = b − a − 1.':'n = b − a.')+` Comprueba contando los puntos de la gráfica: hay ${cnt}.`}
 return[
  [named+(i.src==='ineq'?Q:I),'Tenemos un intervalo de números enteros. Vamos a verlo de varias formas.'],
  [`${I} ↔ ${Q}`,(i.src==='ineq'?'Pasamos de desigualdad a intervalo: < es extremo abierto ⟨ ⟩ y ≤ es extremo cerrado [ ].':'Pasamos de intervalo a desigualdad: extremo abierto ⟨ ⟩ → <, extremo cerrado [ ] → ≤.')+(fin?'':' El infinito siempre es abierto.')],
  [`${nm} = ${ext(R)}`,R.length?`Por extensión: ${izq}; ${der}.`:'No hay enteros dentro de este intervalo: queda vacío.'],
  ['Gráfica:'+nlB([{label:nm,iv:i,color:'#d6336c'}],[],E),'El círculo lleno incluye el extremo; el círculo vacío lo excluye. En ℤ solo contamos los números enteros del intervalo.'],
  [`${Q} ↔ ${I}<br>${n}`,nSay]]}
/* Temas: operaciones entre intervalos */
const OPN={'∪':'unión','∩':'intersección','-':'diferencia','Δ':'diferencia simétrica',"'":'complemento'};
function tOp(s,allow){const P=ivParse(s);
 if(!P.expr)throw'Falta la operación. Escribe por ejemplo: A = ⟨2; 8⟩ , B = [5; 12⟩ , A ∪ B';
 const{ps,ops}=splitExpr(P.expr);let X,Y,op;
 if(ops.length>1)throw'Resuelvo una operación a la vez: A ∪ B, A ∩ B, A − B o A’.';
 if(!ops.length){if(!PR.test(ps[0]))throw'No encuentro la operación. '+AYUDA;op="'";X=opnd(ps[0],P.defs,0);X.comp=false}
 else{op=ops[0];X=opnd(ps[0],P.defs,0);Y=opnd(ps[1],P.defs,1);
  if(X.comp||Y.comp)throw'Escribe una sola operación a la vez; el complemento va solo: A’.'}
 if(!allow.includes(op))throw'Esa operación está en otro tema.';
 const O=op==="'"?[X]:[X,Y],E=new Set();O.forEach(o=>[o.iv.a,o.iv.b].forEach(v=>{if(isFinite(v))E.add(v)}));
 const sym=op==='-'?'−':op,nm=op==="'"?X.name+"'":`${X.name} ${sym} ${Y.name}`,lab=op==="'"?X.name+"'":X.name+sym+Y.name;
 const RR=op==='∪'?rU(X.R,Y.R):op==='∩'?rI(X.R,Y.R):op==='-'?rD(X.R,Y.R):op==='Δ'?rU(rD(X.R,Y.R),rD(Y.R,X.R)):rC(X.R);
 const I=Y?rI(X.R,Y.R):[],cols=['#8ecbff','#ffb27a'];
 const rows=O.map((o,k)=>({label:o.name,R:o.R,color:cols[k],open:openEnds(o.iv)}));
 const res=rows.concat([{label:lab,R:RR,color:'#ffd84d'}]),rowsB=O.map((o,k)=>({label:o.name,iv:o.iv,color:['#d6336c','#12a38e'][k]}));
 let opH,opS;
 if(op==='∪'){opH=`${nm} = ${ext(RR)}`;opS='Unión: juntamos todos los elementos de A y de B, sin repetir.'+(I.length?` Los comunes ${ext(I)} se escriben una sola vez.`:'')}
 else if(op==='∩'){opH=`${nm} = ${ext(RR)}`;opS='Intersección: solo los elementos que están en A y también en B.'+(RR.length?'':' No hay ninguno en común, así que queda vacío.')}
 else if(op==='-'){opH=`Comunes: ${ext(I)}<br>${nm} = ${ext(RR)}`;opS=`Diferencia: de ${X.name} quitamos los elementos que también están en ${Y.name}. Ojo: ${X.name} − ${Y.name} no es lo mismo que ${Y.name} − ${X.name}.`+(RR.length?'':` Todo ${X.name} está dentro de ${Y.name}, por eso no sobra nada.`)}
 else if(op==='Δ'){opH=`${X.name} − ${Y.name} = ${ext(rD(X.R,Y.R))}<br>${Y.name} − ${X.name} = ${ext(rD(Y.R,X.R))}<br>${nm} = ${ext(RR)}`;opS='Diferencia simétrica: lo que está en A o en B, pero NO en los dos. Es (A − B) ∪ (B − A): quitamos los elementos comunes.'}else{opH=`${nm} = ${ext(RR)}`;opS='Complemento: todos los enteros de ℤ que NO están en '+X.name+'. Los extremos se invierten: lo que era cerrado pasa a abierto.'}
 const iT=ivTxt(RR,E),ex=ext(RR),parts=[nm,iT];if(RR.length&&ex!==iT)parts.push(ex);
 if(!RR.length)parts.length=2;
 const una=RR.length===1&&isFinite(RR[0][0])&&isFinite(RR[0][1])&&RR[0][0]<RR[0][1]?`[${M(RR[0][0])}; ${M(RR[0][1])}]`:null;
 const fS='Escribimos el resultado como intervalo y como conjunto.'+(RR.length>1?' Quedaron varios pedazos, por eso se unen con ∪.':'')+(!RR.length?' No queda ningún elemento: es el conjunto vacío ∅.':'')+(una&&una!==iT?` En ℤ, ${iT} y ${una} son lo mismo: tienen los mismos enteros.`:'');
 return[
  [O.map(o=>`${o.name} = ${ivNot(o.iv)}`).join('&nbsp;&nbsp;&nbsp;')+`&nbsp;&nbsp;→&nbsp;&nbsp;${nm}`,`Nos piden la ${OPN[op]}. Lo primero: escribir cada intervalo por extensión.`],
  [O.map(o=>`${o.name} = ${ext(o.R)}`).join('<br>'),'Por extensión: los extremos abiertos NO entran y los cerrados SÍ entran.'],
  ['Gráfica:'+nlB(rowsB,[],E),'Dibujamos cada intervalo como una barra en la recta: círculo vacío = extremo que NO entra, círculo lleno = extremo que SÍ entra.'],
  [opH+nlB(rowsB,RR,E),opS],
  [parts.join(' = '),fS]]}
const tUI=s=>tOp(s,'∪∩'),tDC=s=>tOp(s,"-'Δ");

const TOP=[
 {n:'Intervalos en ℤ',i:'📏',fn:tIv,ex:['[−5; 3⟩','−3 < x ≤ 6','x ∈ ⟨−∞; 4]']},
 {n:'Unión e intersección',i:'🤝',fn:tUI,ex:['A = ⟨2; 8⟩ , B = [5; 12⟩ , A ∪ B','C = ⟨3; 9] , D = ⟨7; 14⟩ , C ∩ D','C = [−7; −2] , D = ⟨0; 4⟩ , C ∪ D']},
 {n:'Diferencia y complemento',i:'🌓',fn:tDC,ex:['M = [−3; 7] , P = ⟨1; 8⟩ , M − P','E = ⟨−4; 6] , E\'','A = ⟨−9; 2⟩ , B = [−7; 0] , A − B']}];

TOP[0].ex=["[−5; 3⟩","−5 ≤ x < 3","⟨4; 9⟩","[−3; 5]","A = ⟨−3; 6]","x ∈ [−5; +∞⟩"];
TOP[1].ex=["A = ⟨2; 8⟩ , B = [5; 12⟩ , A ∪ B","C = ⟨3; 9] , D = ⟨7; 14⟩ , C ∩ D","C = [−7; −2] , D = ⟨0; 4⟩ , C ∪ D","E = ⟨−2; 7] , F = ⟨2; 9] , E ∩ F","G = [−4; 6⟩ , H = ⟨0; 2] , G ∩ H","C = [−9; −3] , D = [−6; 1] , C ∪ D"];
TOP[2].ex=["M = [−3; 7] , P = ⟨1; 8⟩ , M − P","A = ⟨−∞; 15] , A'","D = ⟨2; 12⟩ , C = ⟨4; 8⟩ , D − C","E = ⟨−4; 6] , E'","G = [−5; +∞⟩ , G'","A = ⟨−3; 4⟩ , B = [0; 6] , A − B","A = ⟨2; 8⟩ , B = [5; 12⟩ , A Δ B"];
function solve(tp,raw){
 if(typeof raw!=='string'||raw.length>2000)throw 'Usa un ejercicio de hasta 2000 caracteres.';
 const s=norm(raw);if(!s)throw 'Escribe un ejercicio.';
 if(!/^[a-z0-9+\-∞;,=∈⟨⟩()[\]<>≤≥∪∩Δ'’′]+$/.test(s))throw 'Usa intervalos, desigualdades y signos de conjuntos.';
 for(const n of s.match(/\d+/g)||[])if(n.length>6||Number(n)>100000)throw 'Usa extremos enteros entre −100000 y 100000.';
 if(!TOP[tp])throw 'Elige un tema de intervalos.';
 return TOP[tp].fn(s).map(x=>[x[0],x[1]]);
}

export {sup,toSup,norm,pretty,fr,INF,mkIv,parseIv,parseIneq,ivR,rn,rU,rI,rD,rC,ext,ivTxt,nlB,TOP,solve};

/** Pick the operation from the exercise itself; never report an unrelated tab's error. */
export function resolveExercise(raw,preferred=0,graph){
 if(typeof raw!=='string'||raw.length>2000)return {topic:preferred,steps:solve(preferred,raw)};
 let expression=raw;
 let parsed=ivParse(norm(expression));
 if(parsed.expr&&graph?.rows){
  const missing=[...new Set(parsed.expr.match(/[a-z]/g)||[])].filter(name=>!parsed.defs[name]);
  const definitions=missing.flatMap(name=>{const row=graph.rows[name.charCodeAt(0)-97];if(!row||!row.on)return [];return name+'='+ivNot(mkIv(row.L==='i'?-INF:row.R==='i'?row.a:Math.min(row.a,row.b),row.R==='i'?INF:row.L==='i'?row.b:Math.max(row.a,row.b),row.L==='c',row.R==='c'));});
  if(definitions.length){expression=definitions.join(',')+','+raw;parsed=ivParse(norm(expression));}
 }

 const topic=parsed.expr?(/[∪∩]/.test(parsed.expr)?1:2):0;
 return {topic,expression,steps:solve(topic,expression)};
}

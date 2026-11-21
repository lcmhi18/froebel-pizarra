const safeNumber=n=>{if(!Number.isSafeInteger(n))throw 'Los coeficientes son demasiado grandes para calcularlos con exactitud.';return n;};

const sup=s=>s.replace(/\^\{([^}]*)\}/g,'<sup>$1</sup>').replace(/\^(\d+)/g,'<sup>$1</sup>').replace(/\^([a-z])/g,'<sup>$1</sup>');
const SD='⁰¹²³⁴⁵⁶⁷⁸⁹',toSup=s=>s.replace(/\^(\d+)/g,(m,d)=>[...d].map(c=>SD[c]).join(''));
const norm=s=>s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,m=>'^'+[...m].map(c=>SD.indexOf(c)).join('')).replace(/[−–—]/g,'-').replace(/\s+/g,'').replace(/[·×⋅∙•]/g,'*').replace(/[÷:／]/g,'/').toLowerCase();
const pretty=s=>s.replace(/\*/g,' × ').replace(/\//g,' ÷ ').replace(/([+\-])/g,' $1 ').replace(/\(\s*-\s*/g,'(-').replace(/\s+/g,' ').trim();
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function pm(s){const m=/^([+-]?)(\d*)((?:[a-z](?:\^\d+)?)*)$/.exec(s);if(!m||(!m[2]&&!m[3]))return null;
 const v={};for(const x of m[3].matchAll(/([a-z])(?:\^(\d+))?/g)){const e=x[2]===undefined?1:Number(x[2]);if(e)v[x[1]]=(v[x[1]]||0)+e;}
 return{c:(m[1]==='-'?-1:1)*(m[2]===''?1:+m[2]),v}}
const fm=(m,abs)=>{if(m.c===0)return '0';const c=abs?Math.abs(m.c):m.c,l=Object.keys(m.v).sort().map(k=>k+(m.v[k]>1?'^'+m.v[k]:'')).join('');return l?(Math.abs(c)===1?(c<0?'-':''):c)+l:''+c};
const mmul=(a,b)=>{const v={...a.v};for(const k in b.v)v[k]=(v[k]||0)+b.v[k];return{c:safeNumber(a.c*b.c),v}};
const mpow=(a,n)=>({c:safeNumber(a.c**n),v:Object.fromEntries(Object.entries(a.v).map(([k,e])=>[k,e*n]).filter(([,e])=>e>0))});
const pr=m=>{const k=Object.keys(m.v);return(!k.length?m.c<0:(m.c!==1||k.length>1||m.v[k[0]]>1))?'('+fm(m)+')':fm(m)};
const polyStr=ms=>ms.map((m,i)=>i?(m.c<0?' - ':' + ')+fm(m,1):fm(m)).join('');
const fr=(a,b)=>`<span class="fr"><span>${a}</span><span>${b}</span></span>`;
function terms(s){const r=[];let d=0,cur='';for(const ch of s){if(ch==='(')d++;if(ch===')')d--;
 if((ch==='+'||ch==='-')&&!d&&cur!==''&&!/[\^(*\/]$/.test(cur)){r.push(cur);cur=ch==='-'?'-':''}else cur+=ch}if(cur)r.push(cur);return r}
function gcfOf(M,sg){const g=M.map(x=>x.c).reduce(gcd),L=Object.keys(M[0].v).filter(k=>M.every(x=>x.v[k])),v={};
 L.forEach(k=>v[k]=Math.min(...M.map(x=>x.v[k])));const c=g*(sg&&M[0].c<0?-1:1);
 return{F:{c,v},L,g,Q:M.map(x=>{const w={};for(const k in x.v){const e=x.v[k]-(v[k]||0);if(e)w[k]=e}return{c:x.c/c,v:w}})}}
function pw(s){const dv=s.includes('/'),f=s.split(dv?'/':'*');
 if((dv&&f.length!==2)||f.length<2)throw'Escribe algo como 3^8 × 3^12 o a^15 ÷ a^8.';
 const P=f.map(x=>{const m=/^(\d+|[a-z])(?:\^(\d+))?$/.exec(x);if(!m)throw'No entiendo “'+x+'”. Usa una base y un exponente, por ejemplo 3^8.';return{b:m[1],e:+(m[2]||1)}});
 if(P.some(p=>p.b!==P[0].b))throw'Los teoremas piden la MISMA base en todas las potencias.';
 const b=P[0].b,es=P.map(p=>p.e),num=/\d/.test(b),imp=f.some(x=>!x.includes('^'));
 if(b==='0'&&(dv||es.some(e=>e===0)))throw 'No se puede usar cero como divisor ni calcular cero elevado a cero.';
 const val=e=>num&&e<=60&&BigInt(b)**BigInt(e)<100000n?' = '+(BigInt(b)**BigInt(e)):'';
 const o=[[pretty(s),'Mira las bases: ¿son todas iguales? Si lo son, podemos usar el teorema.']];
 if(!dv){const R=es.reduce((a,c)=>a+c);
  o.push(['a^n × a^m = a^{n + m}','Multiplicación de bases iguales: se escribe la misma base y se SUMAN los exponentes.'],
   [`Base ${b}:  ${es.join(' + ')} = ${R}`,'Sumamos los exponentes.'+(imp?' Recuerda que '+b+' es '+b+'^1.':'')],
   [`${b}^${R}${val(R)}`,'Esta es la respuesta.'])}
 else{const R=es[0]-es[1];
  o.push(['a^n ÷ a^m = a^{n − m}','División de bases iguales: se escribe la misma base y se RESTAN los exponentes.'],
   [`Base ${b}:  ${es[0]} − ${es[1]} = ${R}`,'Restamos el exponente del dividendo menos el del divisor.'],
   [R>1?`${b}^${R}${val(R)}`:R===1?b:R===0?'1':fr('1',`${b}^${-R}`),R<0?'El exponente salió negativo: la potencia pasa al denominador.':'Esta es la respuesta.']) }
 return o}
function pp2(s){const m=/^\((.+)\)\^(\d+)$/.exec(s);if(!m)throw'Escribe algo como (2×3)^3 o (6÷5)^2.';
 const n=+m[2],dv=m[1].includes('/'),f=m[1].split(dv?'/':'*');if(dv&&f.length!==2)throw'Una división lleva dos términos: (6÷5)^2.';
 let M=f.map(pm);if(M.some(x=>!x))throw'No entiendo algún factor. Usa números y letras.';
 if(!dv&&M.length===1){const x=M[0];M=[];if(x.c!==1)M.push({c:x.c,v:{}});for(const k in x.v)M.push({c:1,v:{[k]:x.v[k]}});
  if(M.length<2)throw'Dentro del paréntesis necesito dos factores, como (xy)^9.'}
 if(dv&&M[1].c===0)throw 'No se puede dividir entre cero.';
 const o=[[pretty(s),'Hay un paréntesis elevado a una potencia. ¿Es una multiplicación o una división?'],
  [dv?'(a ÷ b)^n = a^n ÷ b^n':'(a × b)^n = a^n × b^n',dv?'El exponente afecta al numerador y al denominador.':'El exponente afecta a cada uno de los factores.']];
 const Pw=M.map(x=>mpow(x,n)),A=M.map(x=>pr(x)+'^'+n),lg=x=>Math.abs(x.c)>=1e5||(n>5&&Math.abs(x.c)>1),big=Pw.some(lg),sh=i=>lg(Pw[i])?A[i]:fm(Pw[i]);
 if(dv){o.push([fr(A[0],A[1]),'Elevamos cada término a la potencia '+n+'.'],[fr(sh(0),sh(1)),'Calculamos cada potencia.'+(big?' Como el número es grande, lo dejamos indicado.':'')]);
  if(!big&&!Object.keys(M[0].v).length&&!Object.keys(M[1].v).length)o.push([fr(fm(Pw[0]),fm(Pw[1]))+' = '+(+(Pw[0].c/Pw[1].c).toFixed(4)).toString().replace('.',','),'Y dividimos para tener el valor.'])}
 else{o.push([A.join(' × '),'Elevamos cada factor a la potencia '+n+'.'],[Pw.map((_,i)=>sh(i)).join(' × '),'Calculamos cada potencia.'+(big?' Como el número es grande, lo dejamos indicado.':'')]);
  if(!big&&Math.abs(Pw.reduce(mmul).c)<1e6)o.push([fm(Pw.reduce(mmul)),'Multiplicamos y ¡listo!'])}
 return o}
function fcm(s){const T=terms(s).map(pm);if(T.length<2||T.some(x=>!x))throw'Escribe un polinomio de monomios, por ejemplo 12m^5n^2 + 16m^3n^6.';
 const{F,L,g,Q}=gcfOf(T);if(g===1&&!L.length)throw'Estos términos no tienen factor común (solo el 1).';
 const Ls=L.map(k=>k+(F.v[k]>1?'^'+F.v[k]:'')).join('  y  ');
 return[[pretty(s),'Buscamos lo que se repite en TODOS los términos: números y letras.'],
 [`MCD(${T.map(x=>Math.abs(x.c)).join(', ')}) = ${g}`,g===1?'Los coeficientes solo comparten el 1.':'Primero el MCD de los coeficientes.'],
 ['Letras comunes: '+(Ls||'ninguna'),'Tomamos las letras que están en todos, con su MENOR exponente.'],
 ['Factor común: '+fm(F),'Juntamos el número y las letras: ese es el factor común.'],
 ['Cocientes:  '+T.map((x,i)=>fm(x)+' ÷ '+fm(F)+' = '+fm(Q[i])).join(' ;  '),'Dividimos cada término entre el factor común.'],
 [fm(F)+'('+polyStr(Q)+')','Escribimos el factor común y, dentro del paréntesis, los cocientes.']]}
function fcp(s){const T=terms(s);if(T.length<2)throw'Escribe dos o más términos, por ejemplo 4x(a+b) + 7b(a+b).';
 if(s.includes('(')){
  const R=T.map(t=>{const m=/^([^()]*)\((.+)\)$/.exec(t);if(!m)throw'Cada término debe terminar en un paréntesis, por ejemplo 4x(a+b).';
   const c=pm(m[1]==='-'?'-1':m[1]||'1');if(!c)throw'No entiendo el factor “'+m[1]+'”.';return{c,p:m[2]}});
  if(R.some(r=>r.p!==R[0].p))throw'Los paréntesis no son iguales. (Primero hay que sacar factor común dentro de ellos.)';
  const pt=terms(R[0].p).map(pm); if(!pt.every(x=>x))throw 'Revisa los términos del polinomio.'; const P='('+polyStr(pt)+')';
  return[[pretty(s),'Miramos qué paréntesis se repite en todos los grupos.'],
   ['Factor común polinomio: '+P,'Ese paréntesis se repite: es el factor común.'],
   ['Quedan:  '+R.map(r=>fm(r.c)).join('  ;  '),'Lo que queda en cada grupo va en el otro paréntesis.'],
   [P+'('+polyStr(R.map(r=>r.c))+')','Escribimos el factor común por el binomio que formamos.']]}
 const M=T.map(pm);if(T.length!==4||M.some(x=>!x))throw'Para agrupar necesito 4 términos de letras y números, como mx + my + nx + ny.';
 const g1=gcfOf(M.slice(0,2),1),g2=gcfOf(M.slice(2),1),p1=polyStr(g1.Q),p2=polyStr(g2.Q);
 if(p1!==p2)throw'Al agrupar de 2 en 2 no coinciden los paréntesis ('+p1+' y '+p2+'). Prueba ordenando los términos de otra forma.';
 const gf=(g)=>fm(g.F,1)+'('+polyStr(g.Q)+')';
 return[[pretty(s),'El factor común no se ve. Vamos a agrupar los términos de dos en dos.'],
  [`(${polyStr(M.slice(0,2))}) + (${polyStr(M.slice(2))})`,'Agrupamos: los dos primeros y los dos últimos.'],
  [gf(g1)+(g2.F.c<0?' - ':' + ')+gf(g2),'Sacamos el factor común monomio de cada grupo.'],
  ['Factor común polinomio: ('+p1+')','¡Ahora sí aparece el mismo paréntesis en los dos grupos!'],
  [`(${p1})(${polyStr([g1.F,g2.F])})`,'Escribimos el paréntesis repetido por los factores que sacamos.']]}
function sq(s){const m=/^\((.+)\)\^2$/.exec(s);if(!m)throw'Escribe algo como (2m + 5)^2.';
 const t=terms(m[1]).map(pm);if(t.length!==2||t.some(x=>!x))throw'Dentro del paréntesis deben ir dos términos, por ejemplo (2m + 5).';
 const[A,B]=t,min=B.c<0,Bp={c:Math.abs(B.c),v:B.v},a2=mpow(A,2),b2=mpow(B,2),mid=mmul(mmul({c:2,v:{}},A),B);
 return[[pretty(s),'Un binomio al cuadrado. Mira el signo del medio: '+(min?'es una resta.':'es una suma.')],
  [min?'(a − b)^2 = a^2 − 2ab + b^2':'(a + b)^2 = a^2 + 2ab + b^2',(min?'Cuadrado de la diferencia.':'Cuadrado de la suma.')+' Aquí a = '+fm(A)+' y b = '+fm(Bp)+'.'],
  [`${pr(A)}^2 ${min?'-':'+'} 2·${pr(A)}·${pr(Bp)} + ${pr(Bp)}^2`,'1.º al cuadrado, el doble producto y el 2.º al cuadrado.'],
  [polyStr([a2,mid,b2]),`Calculamos: ${fm(a2)} ; 2·${pr(A)}·${pr(B)} = ${fm(mid)} ; ${fm(b2)}.`]]}
function sd(s){const m=/^\((.+?)\)\((.+)\)$/.exec(s);if(!m)throw'Escribe algo como (4a − 5)(4a + 5).';
 const P=terms(m[1]).map(pm),Q=terms(m[2]).map(pm);if([P,Q].some(x=>x.length!==2||x.some(y=>!y)))throw'Cada paréntesis debe tener dos términos.';
 const E=(x,y)=>fm(x)===fm(y),N=x=>({c:-x.c,v:x.v});let a,b;
 if(E(P[0],Q[0])&&E(P[1],N(Q[1])))[a,b]=P;else if(E(P[1],Q[1])&&E(P[0],N(Q[0])))[b,a]=P;
 else if(E(P[0],Q[1])&&E(P[1],N(Q[0])))[a,b]=P;else if(E(P[1],Q[0])&&E(P[0],N(Q[1])))[b,a]=P;
 else throw'Esto no es suma por diferencia: un paréntesis lleva + y el otro −, con los mismos términos.';
 const bp={c:Math.abs(b.c),v:b.v},b2=mpow(b,2);
 return[[pretty(s),'Dos paréntesis: uno con + y el otro con −, y los mismos términos.'],
  ['(a + b)(a − b) = a^2 − b^2','¡Suma por diferencia! Aquí a = '+fm(a)+' y b = '+fm(bp)+'.'],
  [`${pr(a)}^2 − ${pr(bp)}^2`,'Elevamos al cuadrado el 1.º y el 2.º, con un − en el medio.'],
  [polyStr([mpow(a,2),{c:-b2.c,v:b2.v}]),'Calculamos las potencias. No hay término del medio: −ab y +ab se cancelan.']]}
function spp(s){s=s.replace(/=+$/,'').replace(/\)(\d+)/g,')^$1').replace(/([a-z])(\d+)/g,'$1^$2');
 const split=(t,ch)=>{const r=[];let d=0,c='';for(const x of t){if(x==='(')d++;if(x===')')d--;if(x===ch&&!d){r.push(c);c=''}else c+=x}r.push(c);return r};
 const unw=t=>{while(t[0]==='('&&t.endsWith(')')){let d=0,ok=true;for(let i=0;i<t.length;i++){if(t[i]==='(')d++;if(t[i]===')')d--;if(!d&&i<t.length-1){ok=false;break}}if(!ok)break;t=t.slice(1,-1)}return t};
 const D=split(s,'/');if(D.length!==2||!D[0]||!D[1])throw'Escribe una fracción con una sola división, por ejemplo (x·y)^3 ÷ (x^2·y).';
 const side=t=>split(unw(t),'*').map(f=>{const m=/^\((.+)\)(?:\^(\d+))?$/.exec(f),n=m?+(m[2]||1):1,inner=m?m[1]:f;
  const ts=split(inner,'*').map(q=>{const k=/^(\d+|[a-z])(?:\^(\d+))?$/.exec(q);if(!k)throw'No entiendo “'+q+'”. Usa letras o números con exponente, como x^3.';return{b:k[1],e:+(k[2]||1)}});
  return{n,ts,par:!!m}});
 const A=side(D[0]),B=side(D[1]);if(B.some(f=>f.ts.some(t=>t.b==='0'&&t.e*f.n>0)))throw 'No se puede dividir entre cero.';
 const tS=(b,e)=>e===1?b:b+'^'+e;
 const show=F=>F.map(f=>f.par?'('+f.ts.map(t=>tS(t.b,t.e)).join(' · ')+')'+(f.n>1?'^'+f.n:''):f.ts.map(t=>tS(t.b,t.e)).join(' · ')).join(' · ');
 const flat=F=>F.flatMap(f=>f.ts.map(t=>({b:t.b,e:t.e*f.n})));
 const fA=flat(A),fB=flat(B),order=[...new Set(fA.concat(fB).map(t=>t.b))];
 const sm=F=>{const o={};F.forEach(t=>o[t.b]=(o[t.b]||0)+t.e);return o},sA=sm(fA),sB=sm(fB);
 const fl=F=>F.map(t=>tS(t.b,t.e)).join(' · ')||'1',mg=S=>order.filter(b=>S[b]).map(b=>tS(b,S[b])).join(' · ')||'1';
 const up=order.filter(b=>(sA[b]||0)-(sB[b]||0)>0).map(b=>tS(b,sA[b]-(sB[b]||0))),dn=order.filter(b=>(sA[b]||0)-(sB[b]||0)<0).map(b=>tS(b,sB[b]-(sA[b]||0)));
 const N=up.join(' · ')||'1',fin=dn.length?fr(N,dn.join(' · ')):N;
 return[[fr(show(A),show(B)),'Es una fracción de potencias con paréntesis. Primero repartimos cada exponente.'],
  ['(a · b)^n = a^n · b^n','Potencia de un producto: el exponente afecta a cada factor del paréntesis.'],
  [fr(fl(fA),fl(fB)),'Repartimos cada exponente dentro de su paréntesis.'],
  [fr(mg(sA),mg(sB)),'Juntamos las bases iguales de arriba y de abajo, y sumamos sus exponentes.'],
  ['a^n ÷ a^m = a^{n − m}','División de bases iguales: exponente de arriba menos exponente de abajo.'],
  [order.map(b=>`${b}:  ${sA[b]||0} − ${sB[b]||0} = ${(sA[b]||0)-(sB[b]||0)}`).join('  ;  '),'Restamos los exponentes de cada letra (arriba − abajo).'],
  [fin,'Exponente positivo: se queda arriba. Negativo: pasa abajo. Si da 0, la letra desaparece (x^0 = 1).']]}
const TOP=[
 {n:'Potencias: misma base',i:'🔢',fn:pw,ex:['3^8 × 3^12','a^15 ÷ a^8','6^3 × 6^9 × 6^5']},
 {n:'Potencia de × y ÷',i:'🧮',fn:pp2,ex:['(2×3)^3','(xy)^9','(6÷5)^2']},
 {n:'Factor común monomio',i:'🧩',fn:fcm,ex:['12m^5n^2 + 16m^3n^6','3ay + 5by','8ab^2c^3 + 15ab^2d^2 − 7ab^2e^4']},
 {n:'Factor común polinomio',i:'🔗',fn:fcp,ex:['4x(a+b) + 7b(a+b)','mx + my + nx + ny','24m^3 + 30m^2 + 20m + 25']},
 {n:'Cuadrado de suma / diferencia',i:'🟦',fn:sq,ex:['(2m + 5)^2','(a − 2)^2','(3 + x)^2']},
 {n:'Suma por diferencia',i:'⚖️',fn:sd,ex:['(4a − 5)(4a + 5)','(5m + 3n)(5m − 3n)','(x + 2)(x − 2)']},
 {n:'Simplificar con potencias',i:'✂️',fn:spp,ex:['(x·y)^3 · (z·w)^4 ÷ ((y·z)^4 · (x·w)^3)','(a·b)^2 · (b·c)^3 ÷ ((a·c)^2 · b^3)','(m·n)^4 ÷ (m^2 · n^3)']}];
function solve(tp,raw){
 if(typeof raw!=='string'||raw.length>2000)throw 'El ejercicio es demasiado largo: usa hasta 2000 caracteres.';
 const s=norm(raw);if(!s)throw 'Escribe un ejercicio.';
 if(!/^[a-z0-9^()+*/=\-]+$/.test(s))throw 'Usa números, letras, exponentes y signos de operación.';
 if(!TOP[tp])throw 'Elige uno de los siete temas.';
 let depth=0;for(const c of s){if(c==='('&&++depth>40)throw 'Hay demasiados paréntesis anidados.';if(c===')'&&--depth<0)throw 'Revisa los paréntesis.';}if(depth)throw 'Falta cerrar un paréntesis.';
 for(const digits of s.match(/\d+/g)||[])if(digits.length>10||Number(digits)>1000000000)throw 'Usa números más pequeños para explicar el procedimiento.';
 const result=TOP[tp].fn(s).map(x=>[x[0],x[1]]);if(result.some(row=>/Infinity|NaN/.test(row[0])))throw 'Este cálculo supera el tamaño permitido. Usa coeficientes más pequeños.';return result;
}

export {sup,toSup,norm,pretty,pm,fm,mmul,mpow,pw,pp2,fcm,fcp,sq,sd,spp,fr,TOP,solve};


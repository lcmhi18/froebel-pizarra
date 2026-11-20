import {CONFIG} from './config.js';
const close={'(':')','[':']','{':'}'},names={'(':'paréntesis','[':'corchete','{':'llave'};
const number=v=>({t:'n',v}),operator=v=>({t:'o',v});
export function parse(expression){
 if(typeof expression!=='string'||expression.length>CONFIG.maxInput)throw Error(`Escribe un ejercicio de hasta ${CONFIG.maxInput} caracteres.`);
 const s=expression.replace(/[−–—]/g,'-').replace(/[×·*xX]/g,'*').replace(/[÷:/]/g,'/');
 const tokens=[],stack=[];let i=0,expect=true;
 const skip=()=>{while(/\s/.test(s[i]||'')&&i<s.length)i++};
 while(i<s.length){
  skip();if(i===s.length)break;let c=s[i];
  if(!expect){
   if('+-*/'.includes(c)){tokens.push(operator(c));expect=true;i++;continue;}
   if(')]}'.includes(c)){if(close[stack.pop()]!==c)throw Error('Hay un signo de agrupación mal cerrado.');tokens.push({t:')',k:Object.keys(close).find(k=>close[k]===c)});i++;continue;}
   if('([{'.includes(c)||(/\d/.test(c)&&tokens.at(-1)?.t===')')){tokens.push(operator('*'));expect=true;continue;}
   throw Error(/\d/.test(c)?'Falta una operación entre los números.':`No reconozco el símbolo «${c}». Usa enteros y + − × ÷ ( ) [ ] { }.`);
  }
  let sign=1n;
  while(c==='+'||c==='-'){if(c==='-')sign=-sign;i++;skip();c=s[i];}
  if(c&&/\d/.test(c)){let end=i;while(end<s.length&&/\d/.test(s[end]))end++;tokens.push(number(sign*BigInt(s.slice(i,end))));i=end;expect=false;continue;}
  if(c&&'([{'.includes(c)){if(sign<0)tokens.push({t:'neg'});tokens.push({t:'(',k:c});stack.push(c);i++;continue;}
  throw Error(!c?'Falta un número después de la operación.':')]}'.includes(c)?'Hay un grupo vacío o una operación sin número.':`No reconozco el símbolo «${c}». Escribe un número entero.`);
 }
 if(!tokens.length)throw Error('Escribe un ejercicio.');
 if(stack.length)throw Error('Falta cerrar un signo de agrupación.');
 if(expect)throw Error('El ejercicio termina en una operación: falta un número.');
 return tokens;
}
export function nextStep(tokens){
 if(tokens.length===1)return null;
 let lo=-1,hi=tokens.length;
 for(let i=0;i<tokens.length;i++){if(tokens[i].t==='(')lo=i;if(tokens[i].t===')'){hi=i;break;}}
 const inner=tokens.slice(lo+1,hi),group=lo>=0,where=group?`dentro del ${names[tokens[lo].k]}`:'en toda la expresión';
 const replace=(start,end,values)=>[...tokens.slice(0,start),...values,...tokens.slice(end)];
 if(inner.length===1){const negative=group&&tokens[lo-1]?.t==='neg',v=negative?-inner[0].v:inner[0].v,start=negative?lo-1:lo;
  return {tokens:replace(start,hi+1,[number(v)]),focus:[[start,hi]],highlight:[start],message:negative?`Ya solo queda un número dentro del ${names[tokens[lo].k]}. El − de delante cambia su signo: ${v}.`:`El ${names[tokens[lo].k]} ya tiene un solo número. Lo dejamos libre: ${v}.`};
 }
 const md=inner.some(t=>t.t==='o'&&'*/'.includes(t.v));let out=[],highlight=[],focus=[],law=false;
 if(md){out=[inner[0]];for(let j=1;j<inner.length;j+=2){const op=inner[j].v,b=inner[j+1];
   if(op==='*'||op==='/'){const a=out.pop();if(op==='/'&&b.v===0n)throw Error('No se puede dividir entre cero.');if(op==='/'&&a.v%b.v!==0n)throw Error(`La división ${a.v} ÷ ${b.v} no da un entero. Usa divisiones exactas.`);law ||= a.v<0n||b.v<0n;out.push(number(op==='*'?a.v*b.v:a.v/b.v));focus.push([lo+j,lo+j+2]);highlight.push(lo+out.length);}
   else out.push(inner[j],b);
  }
  // A chain such as 2 × 3 ÷ 2 produces one final highlighted number.
  highlight=[...new Set(highlight)].filter(i=>out[i-lo-1]?.t==='n');
 }else{let acc=inner[0].v;for(let j=1;j<inner.length;j+=2){const b=inner[j+1].v;law ||= inner[j].v==='-'&&b<0n;acc=inner[j].v==='+'?acc+b:acc-b;}out=[number(acc)];highlight=[lo+1];focus=[[lo+1,hi-1]];}
 return {tokens:replace(lo+1,hi,out),focus,highlight,message:`${md?CONFIG.text.multiply:CONFIG.text.add} ${where}.${law?' '+(md?CONFIG.text.signMultiply:CONFIG.text.signAdd):''}`};
}
export function buildSteps(expression,maxSteps=CONFIG.maxSteps){
 const tokens=parse(expression),steps=[{tokens,focus:[],highlight:[],message:CONFIG.text.initial}];
 while(steps.at(-1).tokens.length>1){if(steps.length-1>=maxSteps)throw Error(`Este ejercicio necesita más de ${maxSteps} pasos. Resuélvelo por partes.`);const next=nextStep(steps.at(-1).tokens);steps.at(-1).focus=next.focus;steps.push(next);}
 return {steps,result:steps.at(-1).tokens[0].v};
}
export function tokenText(token,previous){
 if(token.t==='n')return token.v<0n?(previous&&previous.t==='o'?`(−${-token.v})`:`−${-token.v}`):String(token.v);
 if(token.t==='o')return ` ${{'*':'×','/':'÷','+':'+','-':'−'}[token.v]} `;
 return token.t==='neg'?'−':token.t==='('?token.k:close[token.k];
}
export function priority(tokens){
 const first=tokens.find(t=>t.t===')');
 const active=Object.fromEntries(CONFIG.rules.map(rule=>[rule.key,tokens.some(t=>rule.key==='md'?t.t==='o'&&'*/'.includes(t.v):rule.key==='as'?t.t==='o'&&'+-'.includes(t.v):rule.key==='sign'?(t.t==='n'&&t.v<0n)||t.t==='neg':t.t==='('&&t.k===rule.key)]));
 return {active,message:first?`Tu ejercicio empieza por el ${names[first.k]} más interno.`:active.md?'No hay grupos: empieza por las multiplicaciones y divisiones.':'Empieza por las sumas y restas, de izquierda a derecha.'};
}

import {readTextRuns} from '../intervalos/text.js';

// Retain the original typed syntax in shared runs; only presentation is mathematical.
export function mathTokens(text){
 const out=[],pattern=/(?<![\p{L}\d/.,])([−-]?\d+)[ \t]*\/[ \t]*([−+-]?\d+)(?![\p{L}\d/.,])/gu;let at=0;
 for(const m of text.matchAll(pattern)){if(m.index>at)out.push({kind:'text',text:text.slice(at,m.index)});out.push({kind:'fraction',text:m[0],n:m[1],d:m[2]});at=m.index+m[0].length;}
 if(at<text.length)out.push({kind:'text',text:text.slice(at)});return out;
}
export function mathTextLayout(runs,width,fontSize,measure){
 const lines=[{atoms:[],width:0,fraction:false}];
 const next=()=>lines.push({atoms:[],width:0,fraction:false});
 const add=atom=>{let line=lines.at(-1);if(line.width+atom.width>width&&line.atoms.length){next();line=lines.at(-1);}atom.x=line.width;line.atoms.push(atom);line.width+=atom.width;line.fraction||=atom.kind==='fraction';};
 for(const run of runs){const size=run.sup?fontSize*.65:fontSize;for(const token of mathTokens(run.text)){if(token.kind==='fraction')add({...token,size,sup:run.sup,width:Math.max(measure(token.n,size,800),measure(token.d,size,800))+size*.54});else for(const char of token.text){if(char==='\n'){next();continue;}add({kind:'text',text:char,size,sup:run.sup,width:measure(char,size,600)});}}}
 let height=0;for(const line of lines){line.top=height;line.baseline=height+fontSize*(line.fraction?1.5:1);line.height=fontSize*(line.fraction?2.6:1.4);height+=line.height;}return {lines,height};
}
export function drawMathText(ctx,item,canvasWidth,canvasHeight){
 const x=item.x1*canvasWidth,y=item.y1*canvasHeight,w=(item.x2-item.x1)*canvasWidth,h=(item.y2-item.y1)*canvasHeight;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=ctx.strokeStyle=item.c;ctx.globalAlpha=1;ctx.textBaseline='alphabetic';ctx.textAlign='left';
 const layout=mathTextLayout(item.runs,w,item.fontSize,(text,size,weight)=>{ctx.font=`${weight} ${size}px Nunito,sans-serif`;return ctx.measureText(text).width;});
 for(const line of layout.lines)for(const atom of line.atoms){const baseline=y+line.baseline-(atom.sup?item.fontSize*.4:0);ctx.font=`${atom.kind==='fraction'?800:600} ${atom.size}px Nunito,sans-serif`;if(atom.kind==='text')ctx.fillText(atom.text,x+atom.x,baseline);else{const left=x+atom.x+atom.size*.12,width=atom.width-atom.size*.24;ctx.textAlign='center';ctx.fillText(atom.n,left+width/2,baseline-atom.size*.55);ctx.fillText(atom.d,left+width/2,baseline+atom.size*.75);ctx.lineWidth=Math.max(1,atom.size*.07);ctx.beginPath();ctx.moveTo(left,baseline-atom.size*.15);ctx.lineTo(left+width,baseline-atom.size*.15);ctx.stroke();ctx.textAlign='left';}}
 ctx.restore();return layout;
}
/** Rebuild from text nodes, preserving the logical caret even across Enter/superscripts. */
export function decorateMathText(editor,runs){
 const selection=getSelection();let offset=null;
 if(selection?.rangeCount&&editor.contains(selection.anchorNode)&&selection.isCollapsed){const range=selection.getRangeAt(0).cloneRange();range.selectNodeContents(editor);range.setEnd(selection.anchorNode,selection.anchorOffset);offset=readTextRuns(range.cloneContents()).reduce((n,r)=>n+r.text.length,0);}
 const fragment=document.createDocumentFragment();
 for(const run of runs){const host=document.createElement(run.sup?'sup':'span');for(const token of mathTokens(run.text)){if(token.kind==='text'){host.append(document.createTextNode(token.text));continue;}const fraction=document.createElement('span');fraction.className='inline-math-fraction';const num=document.createElement('span'),slash=document.createElement('span'),den=document.createElement('span');num.className='inline-math-numerator';den.className='inline-math-denominator';slash.className='inline-math-slash';num.textContent=token.n;den.textContent=token.d;const start=token.text.indexOf('/');slash.textContent=token.text.slice(token.n.length,start+1)+token.text.slice(start+1,token.text.length-token.d.length);fraction.append(num,slash,den);host.append(fraction);}fragment.append(host);}
 // A trailing newline needs a following glyph to keep Chromium's caret on the new line.
 // readTextRuns strips this placeholder before anything is shared or drawn.
 if(runs.at(-1)?.text.endsWith('\n'))fragment.lastChild?.append(document.createTextNode('\u200b'));
 // Avoid replacing an active selection while the user is selecting or composing text.
 if(selection?.rangeCount&&editor.contains(selection.anchorNode)&&!selection.isCollapsed)return;
 editor.replaceChildren(fragment);
 if(offset!==null){const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let leaf,last;while((leaf=walker.nextNode())){last=leaf;if(offset<=leaf.length){const range=document.createRange();range.setStart(leaf,offset);range.collapse(true);selection.removeAllRanges();selection.addRange(range);return;}offset-=leaf.length;}if(last){const range=document.createRange();range.setStart(last,last.length);range.collapse(true);selection.removeAllRanges();selection.addRange(range);}}
}

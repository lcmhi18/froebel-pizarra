import {createGraphDrawing} from './graph-drawing.js';
import {CombinedAdapter} from '../operaciones-combinadas/adapter';
import {attachLive} from '../../live/attach';
import {validLesson} from './model.js';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/patrick-hand/latin-400.css';
import './reference.css';
import '../algebra-completa/style.css';
import './style.css';
import DOMPurify from 'dompurify';
import {sup,toSup,norm,pretty,fr,INF,mkIv,ivR,rU,rI,rD,rC,ext,ivTxt,nlB,TOP,solve,resolveExercise} from './engine.js';
const cleanHTML=value=>DOMPurify.sanitize(String(value),{USE_PROFILES:{html:true,svg:true,svgFilters:true},FORBID_TAGS:['style','iframe','object','embed','form']});
const setHTML=(element,value)=>{element.innerHTML=cleanHTML(value);};
let graphModelAPI, graphInkAPI, currentExercise;
const validation=document.createElement('p');validation.id='exercise-error';validation.className='err';validation.hidden=true;validation.setAttribute('role','alert');document.getElementById('inp').closest('.row').after(validation);
let S = [], shown = 1, tp = 0;
function build() {
    const b = document.getElementById('board');
    try {
        {
            const q = document.getElementById('inp');
            q.value = toSup(q.value);
        }
        const raw = document.getElementById('inp').value;
        const resolved=resolveExercise(raw,tp,graphModelAPI?.get());
        const R=resolved.steps;
        if(tp!==resolved.topic){tp=resolved.topic;tabs(tp);}
        validation.hidden=true;
        currentExercise = resolved.expression;
        S = R.map((x, i, a) => { const h = sup(x[0].replace(/-(?![^<]*>)/g, '−')); return { h: i === a.length - 1 && i > 0 ? `<span class="hl">${h}</span>` : h, s: toSup(x[1]).replace(/-/g, '−') }; });
        shown = 1;
        draw();
        rules();
        clearInk();
        clearPF();
        setHTML($('work'), '');
    }
    catch (e) {
        validation.textContent=String(e.message||e);
        validation.hidden=false;
    }
}
const FX = [
    ['0,6', 'a^m · a^n = a^{m+n}', 'Producto de bases iguales', 'Misma base: se suman los exponentes.', '5^2 · 5^3 = 5^{2+3} = 5^5'],
    ['0,6', 'a^m ÷ a^n = a^{m−n}', 'División de bases iguales', 'Misma base: se restan los exponentes.', '7^4 ÷ 7^2 = 7^{4−2} = 7^2'],
    [0, '(a^m)^n = a^{m×n}', 'Potencia de una potencia', 'Se escribe la misma base y se multiplican los exponentes.', '(2^3)^2 = 2^{3×2} = 2^6'],
    [0, 'a^0 = 1 ;  a^1 = a', 'Casos especiales', 'Todo número (distinto de 0) elevado a 0 es 1, y elevado a 1 es él mismo.', '9^0 = 1 ;  9^1 = 9'],
    ['1,6', '(a·b)^n = a^n · b^n', 'Potencia de un producto', 'El exponente afecta a cada factor.', '(2·3)^2 = 2^2 · 3^2 = 36'],
    ['1,6', '(' + fr('A', 'B') + ')^n = ' + fr('A^n', 'B^n'), 'Potencia de una fracción', '', ''],
    ['0,6', fr('a^m', 'a^n') + ' = a^{m−n}', 'División de bases iguales (fracción)', '', ''],
    [-1, 'a^{' + fr('m', 'n') + '} = ^n√(a^m)  ⇔  ^n√(a^m) = a^{' + fr('m', 'n') + '}', 'Exponente fraccionario (raíz)', '', '', 1],
    [4, '(a + b)^2 = a^2 + b^2 + 2ab', 'Cuadrado de la suma', '', ''],
    [4, '(a − b)^2 = a^2 + b^2 − 2ab', 'Cuadrado de la diferencia', '', ''],
    [5, '(a + b)(a − b) = a^2 − b^2', 'Suma por diferencia', '', ''],
    [7, '⟨a; b⟩ ↔ a < x < b', 'Intervalo abierto', '', '', 1],
    [7, '[a; b] ↔ a ≤ x ≤ b', 'Intervalo cerrado', '', '', 1],
    [7, '[a; b⟩ ↔ a ≤ x < b', 'Semiabierto', '', '', 1],
    [7, 'abierto: b − a − 1 ; cerrado: b − a + 1 ; semi: b − a', 'Cantidad de enteros n(x)', '', '', 1],
    [8, 'A ∪ B', 'Unión: está en A o en B', '', ''],
    [8, 'A ∩ B', 'Intersección: está en A y en B', '', ''],
    [9, 'A − B', 'Diferencia: en A, no en B', '', ''],
    [9, "A'", 'Complemento: lo que no está en A', '', '']
];
FX.splice(0, 11);
FX.forEach(f => f[0] = Number(f[0]) - 7);
function rules() { document.querySelectorAll('.rule').forEach(r => { const o = r.dataset.t.split(',').map(Number).includes(tp); r.classList.toggle('on', o); r.querySelector('.st').textContent = o ? '✔ Tema actual' : ''; }); }
function setTopic(i) { tp = i; document.getElementById('inp').value = toSup(TOP[i].ex[0]); tabs(i); build(); }
function tabs(i) {
    tp = i;
    const t = TOP[i], d = document;
    const tb = d.getElementById('tabs');
    setHTML(tb, '');
    TOP.forEach((x, j) => { const b = d.createElement('button'); b.className = 'ghost tab' + (j === i ? ' act' : ''); b.textContent = x.i + ' ' + x.n; b.onclick = () => setTopic(j); tb.appendChild(b); });
    const ch = d.getElementById('chips');
    setHTML(ch, '');
    t.ex.forEach(x => { const b = d.createElement('button'); b.className = 'ghost'; b.textContent = toSup(x); b.onclick = () => { d.getElementById('inp').value = toSup(x); build(); }; ch.appendChild(b); });
}
function say(f, t) { document.getElementById('face').dataset.emotion = f; document.getElementById('say').textContent = t; }
function count() {
    document.getElementById('count').textContent = S.length ? `Paso ${shown - 1} de ${S.length - 1}` : '';
    document.getElementById('back').disabled = shown <= 1;
    document.getElementById('next').disabled = !S.length || shown >= S.length;
}
function draw() {
    const b = document.getElementById('board');
    park();
    setHTML(b, S.slice(0, shown).map((st, i) => {
        const last = i === shown - 1, focus = (i === shown - 2) ? S[i].f : null;
        return `<div class="line${last && i > 0 ? ' new' : ''}"><span class="tag">${i === 0 ? 'Ejercicio' : 'Paso ' + i}</span><span>${st.h}</span></div>`;
    }).join(''));
    const cur = S[shown - 1], fin = shown === S.length;
    if (fin && shown > 1) {
        const v = cur.h;
        setHTML(b, b.innerHTML + `<div class="line"><span class="tag">Rpta</span><span class="hl">${v}</span></div>`);
        say('🥳', '¡Listo! Mira la Rpta en la pizarra. ' + cur.s);
        party();
    }
    else
        say(shown === 1 ? (prof ? '✍️' : '🐸') : '😎', shown === 1 && prof ? 'Resuelve tú el ejercicio: escribe tu resolución aquí mismo en la pizarra, o dibuja con ✏️ Lápiz. Si quieres comprobar, toca “Comprobar paso”.' : cur.s);
    seat();
    count();
}
function party() {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches)
        return;
    for (let i = 0; i < 22; i++) {
        const e = document.createElement('span');
        e.className = 'conf';
        e.textContent = ['🎉', '⭐', '🐸', '✨'][i % 4];
        e.style.left = Math.random() * 100 + 'vw';
        e.style.animationDelay = Math.random() * .6 + 's';
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 3200);
    }
}
document.getElementById('go').onclick = build;
document.getElementById('inp').addEventListener('keydown', e => { if (e.key === 'Enter')
    build(); });
document.getElementById('next').onclick = () => { if (shown < S.length) {
    shown++;
    draw();
} };
document.getElementById('back').onclick = () => { if (shown > 1) {
    shown--;
    draw();
} };
document.getElementById('reset').onclick = () => { shown = 1; if (S.length)
    draw(); };
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.isContentEditable)
        return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('next').click();
    }
    if (e.key === 'ArrowLeft')
        document.getElementById('back').click();
});
const $ = id => document.getElementById(id);
let strokes = [], cur = null, inks = { pen: '#ffd84d', hi: '#ffd84d' }, W = { pen: 5, hi: 24 }, pen = false;
const cv = $('ink'), cx = cv.getContext('2d');
function paint() {
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    strokes.forEach(s => {
        cx.strokeStyle = s.c;
        cx.fillStyle = s.c;
        cx.lineWidth = s.w;
        cx.globalAlpha = s.a;
        const P = s.p;
        if (P.length === 1) {
            cx.beginPath();
            cx.arc(P[0][0], P[0][1], s.w / 2, 0, 7);
            cx.fill();
        }
        else {
            cx.beginPath();
            cx.moveTo(P[0][0], P[0][1]);
            for (let i = 1; i < P.length - 1; i++) {
                const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
                cx.quadraticCurveTo(P[i][0], P[i][1], mx, my);
            }
            cx.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
            cx.stroke();
        }
        cx.globalAlpha = 1;
    });
}
function clearInk() { strokes = []; cur = null; paint(); }
let cw = 0, ch = 0;
new ResizeObserver(() => { const w = $('wrap'), nw = w.clientWidth, nh = w.clientHeight; if (nw === cw && nh === ch)
    return; cw = nw; ch = nh; cv.width = nw; cv.height = nh; paint(); }).observe($('wrap'));
cv.style.touchAction = 'none';
const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', e => {
    if (tool !== 'pen' && tool !== 'hi')
        return;
    if (e.pointerType === 'mouse' && e.button !== 0)
        return;
    e.preventDefault();
    const k = tool === 'hi' ? 'hi' : 'pen';
    cur = { c: inks[k], w: W[k], a: k === 'hi' ? .4 : 1, p: [pt(e)], id: e.pointerId };
    strokes.push(cur);
    try {
        cv.setPointerCapture(e.pointerId);
    }
    catch (_) { }
    paint();
});
cv.addEventListener('pointermove', e => {
    if (tool === 'cursor') {
        const q = pt(e), l = $('laser');
        l.style.display = 'block';
        l.style.left = q[0] + 'px';
        l.style.top = q[1] + 'px';
    }
    if (cur && e.pointerId === cur.id) {
        const ev = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
        (ev.length ? ev : [e]).forEach(x => cur.p.push(pt(x)));
        paint();
    }
});
cv.addEventListener('pointerleave', () => { $('laser').style.display = 'none'; });
['pointerup', 'pointercancel'].forEach(n => cv.addEventListener(n, e => { if (cur && e.pointerId === cur.id) {
    if (n === 'pointerup' && e.clientX != null) {
        cur.p.push(pt(e));
        paint();
    }
    cur = null;
} }));
let tool = 'none';
function setTool(t) { tool = (tool === t) ? 'none' : t; cv.style.pointerEvents = tool === 'none' ? 'none' : 'auto'; cv.style.cursor = tool === 'cursor' ? 'none' : 'crosshair'; $('laser').style.display = 'none'; [['tCur', 'cursor'], ['tPen', 'pen'], ['tHi', 'hi']].forEach(([id, k]) => { $(id).classList.toggle('act', tool === k); $(id).setAttribute('aria-pressed', tool === k); }); }
const T = t => { setTool(t); markCols(); };
$('tCur').onclick = () => T('cursor');
$('tPen').onclick = () => T('pen');
$('tHi').onclick = () => T('hi');
function markCols() { const c = inks[tool === 'hi' ? 'hi' : 'pen']; document.querySelectorAll('.col').forEach(b => { b.classList.toggle('sel', b.dataset.c === c); b.setAttribute('aria-pressed', b.dataset.c === c); }); markThick(); }
function markThick() { const k = tool === 'hi' ? 'hi' : 'pen', t = $('thick'), d = $('tdot'); t.min = k === 'hi' ? 8 : 1; t.max = k === 'hi' ? 70 : 24; t.value = W[k]; d.style.width = d.style.height = Math.min(W[k], 40) + 'px'; d.style.background = inks[k]; d.style.opacity = k === 'hi' ? .6 : 1; }
$('thick').addEventListener('input', () => { W[tool === 'hi' ? 'hi' : 'pen'] = +$('thick').value; markThick(); });
document.querySelectorAll('.col').forEach(b => b.onclick = () => { if (tool === 'none' || tool === 'cursor')
    setTool('pen'); inks[tool === 'hi' ? 'hi' : 'pen'] = b.dataset.c; markCols(); });
markCols();
$('undo').onclick = () => { strokes.pop(); paint(); };
$('wipe').onclick = () => { clearInk(); clearPF(); };
setHTML(document.getElementById('fx'), FX.map((f, i) => `<div class="rule cc c${i % 5 + 1}" data-t="${f[0]}" data-i="${i}"><h3><span class="sym">${i + 1}</span>${f[2]}</h3><p class="fm${f[5] ? ' lg' : ''}">${sup(f[1])}</p><span class="grab" title="Arrastra esta fórmula a la pizarra">✋ arrastra</span><p class="st"></p></div>`).join(''));
let expOn = 0;
const SDg = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const eb = document.createElement('button'), db = document.createElement('button');
[eb, db].forEach(x => { x.className = 'ghost big'; x.type = 'button'; });
const setExp = v => {
    expOn = v;
    eb.classList.toggle('act', v === 1);
    db.classList.toggle('act', v === 0);
    eb.setAttribute('aria-pressed', v === 1);
    db.setAttribute('aria-pressed', v === 0);
    eb.textContent = v === 1 ? '⬆️ Escribiendo ARRIBA (exponente)' : '⬆️ Escribir arriba (exponente)';
    db.textContent = v === 0 ? '⬇️ Escribiendo ABAJO (normal)' : '⬇️ Escribir abajo (normal)';
};
setExp(0);
eb.onclick = () => { setExp(1); focusF(); syncSup(); };
db.onclick = () => { setExp(0); focusF(); syncSup(); };
$('exps').appendChild(eb);
$('exps').appendChild(db);
window.lastF = $('inp');
/* Cuadro de resolución editable: el exponente es un <sup> real (mismo tamaño siempre) */
let wRange = null, inGuard = false;
function saveRange() { const sl = getSelection(); if (sl.rangeCount && $('work').contains(sl.anchorNode))
    wRange = sl.getRangeAt(0).cloneRange(); }
['keyup', 'mouseup', 'input'].forEach(n => $('work').addEventListener(n, saveRange));
function focusF() {
    const f = window.lastF || $('inp');
    if (f.id !== 'work') {
        f.focus();
        return;
    }
    if (document.activeElement !== f)
        f.focus();
    const sl = getSelection();
    if (wRange && f.contains(wRange.startContainer)) {
        sl.removeAllRanges();
        sl.addRange(wRange);
    }
    else if (!f.contains(sl.anchorNode)) {
        const r = document.createRange();
        r.selectNodeContents(f);
        r.collapse(false);
        sl.removeAllRanges();
        sl.addRange(r);
    }
}
function syncSup() { if (document.activeElement !== $('work'))
    return; const on = document.queryCommandState('superscript'); if ((expOn === 1) !== on)
    document.execCommand('superscript'); }
function typeW(t) { inGuard = true; try {
    syncSup();
    document.execCommand('insertText', false, t);
}
finally {
    inGuard = false;
} }
function expW(t) { inGuard = true; try {
    if (document.queryCommandState('superscript'))
        document.execCommand('superscript');
    document.execCommand('insertHTML', false, cleanHTML('<sup>' + t + '</sup>&#8203;'));
}
finally {
    inGuard = false;
} }
$('work').addEventListener('beforeinput', e => { if (inGuard || e.inputType !== 'insertText' || !e.data)
    return; e.preventDefault(); typeW(e.data); });
$('work').addEventListener('focus', () => setTimeout(syncSup, 0));
$('work').addEventListener('input', () => { const W = $('work'); if (!W.textContent.replace(/\u200b/g, '').trim() && !W.querySelector('sup'))
    setHTML(W, ''); });
$('work').addEventListener('paste', e => { e.preventDefault(); typeW((e.clipboardData || window.clipboardData).getData('text/plain')); });
/* Cuadro del ejercicio: solo dígitos en exponente */
$('inp').addEventListener('beforeinput', e => { if (expOn !== 1 || e.inputType !== 'insertText' || !/^[0-9]$/.test(e.data || ''))
    return; e.preventDefault(); const t = $('inp'); t.setRangeText(SDg[e.data], t.selectionStart, t.selectionEnd, 'end'); });
/* Flechas del teclado: ↑ exponente, ↓ normal */
['inp', 'work'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')
    return; e.preventDefault(); setExp(e.key === 'ArrowUp' ? 1 : 0); syncSup(); }));
/* Teclas de signos (como estaban) */
['^', '×', '÷', '−', '(', ')', '=', '⟨', '⟩', '[', ']', ';', '∪', '∩', 'Δ', '∞', "'", '≤', '<'].forEach(k => {
    const bt = document.createElement('button');
    bt.type = 'button';
    bt.className = 'ghost';
    bt.textContent = k;
    bt.onclick = () => { const i = window.lastF || $('inp'); if (i.id === 'work') {
        focusF();
        typeW(k);
    }
    else {
        i.setRangeText(k, i.selectionStart, i.selectionEnd, 'end');
        i.focus();
    } };
    $('keys').appendChild(bt);
});
['inp', 'work'].forEach(id => $(id).addEventListener('focus', () => { window.lastF = $(id); }));
$('inp').addEventListener('paste', e => {
    let t = ((e.clipboardData || window.clipboardData).getData('text') || '').trim();
    if (!t)
        return;
    e.preventDefault();
    if (/[⟨⟩∪∩]|\[[^\]]*[;,]/.test(t)) {
        const r = t.replace(/(^|[\s,.:])(dados?|sean|según|considerando|de acuerdo con|si|halla|hallar|determina|calcula|calcular)(?=[\s,.:]|$)/gi, '$1 ').replace(/\s+y\s+/gi, ' , ').replace(/[\r\n]+/g, ' , ').replace(/\s+/g, ' ').replace(/(\s*,\s*){2,}/g, ' , ').replace(/^[\s,.:]+|[\s,.:]+$/g, '');
        const q = $('inp');
        q.setRangeText(r, q.selectionStart, q.selectionEnd, 'end');
        return;
    }
    const eq = t.indexOf('=');
    if (eq > 0)
        t = t.slice(0, eq).trim();
    const L = t.split(/\r?\n/).map(x => x.trim()).filter(x => x && x !== '=');
    let r = (L.length === 2 && !/[÷\/:]/.test(L[0] + L[1])) ? '(' + L[0] + ') ÷ (' + L[1] + ')' : L.join(' ');
    /* Al copiar de una imagen los exponentes llegan como números pegados: (p·q)6 → (p·q)^6, q2 → q^2 */
    if (!/\^|[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(r))
        r = r.replace(/\)\s?(\d+)/g, ')^$1').replace(/([a-z])(\d+)/gi, '$1^$2');
    r = toSup(r);
    const i = $('inp');
    i.setRangeText(r, i.selectionStart, i.selectionEnd, 'end');
});
/* Fracción en el cuadro de resolución */
function insFr() {
    const i = window.lastF || $('inp');
    if (i.id !== 'work') {
        i.setRangeText(' ÷ ', i.selectionStart, i.selectionEnd, 'end');
        i.focus();
        return;
    }
    focusF();
    inGuard = true;
    try {
        if (document.queryCommandState('superscript'))
            document.execCommand('superscript');
        document.execCommand('insertHTML', false, cleanHTML('<span class="fr2" data-new="1" contenteditable="false"><span class="n" contenteditable="true"></span><span class="d" contenteditable="true"></span></span>&#8203;'));
    }
    finally {
        inGuard = false;
    }
    const el = $('work').querySelector('[data-new]');
    if (!el)
        return;
    el.removeAttribute('data-new');
    const n = el.querySelector('.n');
    n.focus();
    const r = document.createRange();
    r.selectNodeContents(n);
    r.collapse(true);
    const sl = getSelection();
    sl.removeAllRanges();
    sl.addRange(r);
}
const fb = document.createElement('button');
fb.type = 'button';
fb.className = 'ghost';
fb.textContent = '➗ Fracción';
fb.onclick = insFr;
$('keys').appendChild(fb);
$('work').addEventListener('keydown', e => {
    if (e.key !== 'Tab')
        return;
    const sl = getSelection(), nd = sl.anchorNode && (sl.anchorNode.nodeType === 1 ? sl.anchorNode : sl.anchorNode.parentElement), c = nd && nd.closest && nd.closest('.n,.d');
    if (!c)
        return;
    e.preventDefault();
    const r = document.createRange();
    if (c.classList.contains('n')) {
        r.selectNodeContents(c.parentNode.querySelector('.d'));
        r.collapse(true);
    }
    else {
        const f = c.parentNode;
        r.setStartAfter(f.nextSibling && f.nextSibling.nodeType === 3 ? f.nextSibling : f);
        r.collapse(true);
    }
    sl.removeAllRanges();
    sl.addRange(r);
});
['exps', 'keys'].forEach(id => $(id).addEventListener('mousedown', e => e.preventDefault()));
let prof = false;
$('mode').onclick = () => { prof = !prof; $('mode').classList.toggle('act', prof); $('mode').setAttribute('aria-pressed', prof); $('next').textContent = prof ? 'Comprobar paso' : 'Siguiente paso'; $('board').classList.toggle('prof', prof); $('work').classList.toggle('on', prof); shown = 1; if (S.length)
    draw();
else {
    park();
    seat();
} };
/* El cuadro de escritura vive dentro de la pizarra en modo profe */
function park() { $('wrap').after($('work')); }
function seat() { if (prof)
    $('board').appendChild($('work')); }
/* Fórmulas arrastrables */
function clearPF() { setHTML($('pf'), ''); }
function addPF(txt, cx_, cy_) {
    const pf = $('pf'), r = pf.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'pf';
    setHTML(d, sup(txt));
    const k = document.createElement('button');
    k.textContent = '✕';
    k.setAttribute('aria-label', 'Quitar fórmula');
    k.onclick = () => d.remove();
    k.onpointerdown = e => e.stopPropagation();
    d.appendChild(k);
    pf.appendChild(d);
    const cl = (v, mx) => Math.max(0, Math.min(v, mx));
    d.style.left = cl(cx_ - r.left - d.offsetWidth / 2, pf.clientWidth - d.offsetWidth) + 'px';
    d.style.top = cl(cy_ - r.top - d.offsetHeight / 2, pf.clientHeight - d.offsetHeight) + 'px';
    d.addEventListener('pointerdown', e => {
        if (e.target === k)
            return;
        d.setPointerCapture(e.pointerId);
        const sx = e.clientX - d.offsetLeft, sy = e.clientY - d.offsetTop;
        const mv = ev => { d.style.left = cl(ev.clientX - sx, pf.clientWidth - d.offsetWidth) + 'px'; d.style.top = cl(ev.clientY - sy, pf.clientHeight - d.offsetHeight) + 'px'; };
        const up = () => { d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up); };
        d.addEventListener('pointermove', mv);
        d.addEventListener('pointerup', up);
        d.addEventListener('pointercancel', up);
    });
}
document.querySelectorAll('.rule').forEach(card => card.addEventListener('pointerdown', e => {
    if (e.button > 0 || (e.pointerType !== 'mouse' && !e.target.closest('.grab')))
        return;
    e.preventDefault();
    const txt = FX[+card.dataset.i][1], wr = $('wrap'), sx = e.clientX, sy = e.clientY;
    let gh = null;
    const inside = (x, y) => { const r = wr.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
    const mv = ev => {
        if (!gh) {
            if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6)
                return;
            gh = document.createElement('div');
            gh.className = 'drag-ghost';
            setHTML(gh, sup(txt));
            document.body.appendChild(gh);
        }
        gh.style.left = ev.clientX + 'px';
        gh.style.top = ev.clientY + 'px';
        wr.classList.toggle('over', inside(ev.clientX, ev.clientY));
    };
    const up = ev => {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        wr.classList.remove('over');
        if (gh) {
            gh.remove();
            if (ev.type === 'pointerup' && inside(ev.clientX, ev.clientY))
                addPF(txt, ev.clientX, ev.clientY);
        }
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
}));
graphInkAPI=createGraphDrawing({canvas:$('gCv'),laser:$('gLaser'),cursorButton:$('gCursor'),penButton:$('gP'),highlighterButton:$('gH'),colors:[...document.querySelectorAll('.gcb')],widthInput:$('gThick'),preview:$('gDot'),undoButton:$('gU'),clearButton:$('gX'),shapeButtons:[...document.querySelectorAll('[data-graph-shape]')],borderInput:$('gBorder'),fillInput:$('gFill'),opacityInput:$('gOpacity'),opacityOutput:$('gOpacityValue'),shapeWidth:$('gShapeWidth'),shapeHeight:$('gShapeHeight'),deleteButton:$('gDeleteShape'),pasteButton:$('gPasteImage'),imageInput:$('gImageFile'),imageNotice:$('gImageNotice'),onImageChange:()=>schedulePublish(),canEdit:()=>adapter.canEdit});
(function () { const q = id => document.getElementById(id), COL = ['#d6336c', '#12a38e', '#e8890c', '#7a4fd6', '#2f9e44', '#c92a2a', '#1f7bd1', '#555555'], NM = 'ABCDEFGH', LO = [['c', 'cerrado ●'], ['o', 'abierto ○'], ['i', '−∞']], RO = [['c', 'cerrado ●'], ['o', 'abierto ○'], ['i', '+∞']], OO = [['n', 'Sin operación'], ['u', 'Unión ∪'], ['i', 'Intersección ∩'], ['d', 'Diferencia (A − los demás)'], ['s', 'Diferencia simétrica Δ'], ['c', 'Complemento de A']], so = (cur, arr) => arr.map(([v, l]) => `<option value='${v}'${v === cur ? ' selected' : ''}>${l}</option>`).join(''); let S = [{ a: -5, b: 3, L: 'c', R: 'o', on: true }, { a: 1, b: 7, L: 'o', R: 'c', on: true }], OP = 'u'; function ctl() { const m = q('gM'); setHTML(m, ''); S.forEach((t, k) => { const d = document.createElement('div'); d.className = 'row gr'; setHTML(d, `<b style='color:${COL[k]};font-size:1.3rem;width:1.4rem'>${NM[k]}</b><span>a</span><input type='number' min='-99' max='99' value='${t.a}' aria-label='a de ${NM[k]}'><select aria-label='Extremo izquierdo'>${so(t.L, LO)}</select><span>b</span><input type='number' min='-99' max='99' value='${t.b}' aria-label='b de ${NM[k]}'><select aria-label='Extremo derecho'>${so(t.R, RO)}</select><label><input type='checkbox'${t.on ? ' checked' : ''}> usar</label><button class='ghost' type='button' aria-label='Quitar gráfico'${S.length < 2 ? ' disabled' : ''}>✕</button>`); const [ia, ib, ic] = d.querySelectorAll('input'), [sl, sr] = d.querySelectorAll('select'); ia.oninput = () => { t.a = Math.max(-99,Math.min(99,Math.trunc(Number(ia.value)||0))); draw(); }; ib.oninput = () => { t.b = Math.max(-99,Math.min(99,Math.trunc(Number(ib.value)||0))); draw(); }; ia.onchange=()=>{ia.value=String(t.a)}; ib.onchange=()=>{ib.value=String(t.b)}; sl.onchange = () => { t.L = sl.value; draw(); }; sr.onchange = () => { t.R = sr.value; draw(); }; ic.onchange = () => { t.on = ic.checked; draw(); }; d.querySelector('button').onclick = () => { S.splice(k, 1); ctl(); draw(); }; m.appendChild(d); }); const f = document.createElement('div'); f.className = 'row gr'; setHTML(f, `<button id='gAdd' class='ghost' type='button'${S.length >= 8 ? ' disabled' : ''}>➕ Agregar gráfico</button><label>Resaltar: <select id='gO'>${so(OP, OO)}</select></label>`); m.appendChild(f); q('gAdd').onclick = () => { const k = S.length; S.push({ a: k * 2, b: k * 2 + 6, L: 'c', R: 'c', on: true }); ctl(); draw(); }; q('gO').onchange = () => { OP = q('gO').value; draw(); }; } function draw() { const U = S.map((t, k) => ({ ...t, k })).filter(t => t.on); if (!U.length) {
    setHTML(q('gS'), '');
    q('gT').textContent = 'Marca al menos un gráfico en “usar”.';
    return;
} const rows = [], E = new Set(), Rg = []; U.forEach(t => { let a = t.L === 'i' ? -INF : t.a, b = t.R === 'i' ? INF : t.b; if (isFinite(a) && isFinite(b) && a > b) {
    const z = a;
    a = b;
    b = z;
} const iv = mkIv(a, b, t.L === 'c', t.R === 'c', 'x', 'iv'); rows.push({ label: NM[t.k], iv, color: COL[t.k] }); Rg.push(ivR(iv)); [a, b].forEach(v => { if (isFinite(v))
    E.add(v); }); }); const nm = U.map(t => NM[t.k]), f = g => Rg.reduce(g); let RR = [], ex = ''; if (OP === 'u' && U.length > 1) {
    RR = f(rU);
    ex = nm.join(' ∪ ');
}
else if (OP === 'i' && U.length > 1) {
    RR = f(rI);
    ex = nm.join(' ∩ ');
}
else if (OP === 'd' && U.length > 1) {
    RR = rD(Rg[0], Rg.slice(1).reduce(rU));
    ex = nm.join(' − ');
}
else if (OP === 's' && U.length > 1) {
    RR = f((x, y) => rU(rD(x, y), rD(y, x)));
    ex = nm.join(' Δ ');
}
else if (OP === 'c') {
    RR = rC(Rg[0]);
    ex = nm[0] + String.fromCharCode(39);
} const svg = nlB(rows, ex ? RR : [], E); setHTML(q('gS'), svg || `<p style='color:#f4f1e8;padding:10px;margin:0'>Pon al menos un extremo con número para ver la recta.</p>`); if (ex) {
    const iT = ivTxt(RR, E), x = ext(RR);
    q('gT').textContent = ex + ' = ' + iT + (RR.length && x !== iT ? '  =  ' + x : '');
}
else
    q('gT').textContent = rows.map(r => r.label + ' = ' + ivNot(r.iv)).join('   ·   '); } graphModelAPI = { get: () => ({ rows: structuredClone(S), operation: OP }), set: value => { S = structuredClone(value.rows); OP = value.operation; ctl(); draw(); } }; ctl(); draw(); })();
setTopic(0);

// Personal layout choices never change the shared lesson.
const formulaPanel=document.querySelector('.interval-reference>.ord');
formulaPanel.addEventListener('toggle',()=>{
 const action=formulaPanel.open?'Cerrar fórmulas':'Abrir fórmulas';
 formulaPanel.querySelector('summary').setAttribute('aria-label',action);
});
const graphPanel=document.querySelector('.graph-panel');
graphPanel.addEventListener('toggle',()=>graphPanel.querySelector('summary').setAttribute('aria-label',graphPanel.open?'Cerrar editor de gráficos':'Abrir editor de gráficos'));
$('toggle-upper').onclick=()=>{const hidden=$('upper-menu').hidden=!$('upper-menu').hidden;$('toggle-upper').textContent=hidden?'Mostrar menú superior':'Ocultar menú superior';};
$('toggle-lower').onclick=()=>{const hidden=document.body.classList.toggle('hide-lower');$('toggle-lower').textContent=hidden?'Mostrar menú inferior':'Ocultar menú inferior';};
$('large-board').onclick=()=>{const large=document.body.classList.toggle('interval-large');$('large-board').textContent=large?'Volver a pizarra normal':'Pizarra grande';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('interval-large');$('large-board').textContent='Pizarra grande';}});

// Teacher-owned canonical lesson, transported by the existing authenticated room.
const query=new URLSearchParams(location.search);
const role=query.has('room')&&query.get('role')!=='teacher'?'student':'teacher';
const adapter=new CombinedAdapter(role);
let applying=false,lastRemote='',publishTimer;
const editable=()=>adapter.canEdit;
const round=n=>Math.round(n*1000)/1000;
const packed=list=>list.map(s=>({c:s.c,w:s.w,a:s.a,p:s.p.map(p=>p.map(round))}));
function captureLesson(){
 return {expression:currentExercise,topic:tp,shown,prof,work:$('work').innerHTML,
 strokes:packed(strokes.map(s=>({...s,p:s.p.map(p=>[p[0]/(cv.width||1),p[1]/(cv.height||1)])}))),
 graph:graphModelAPI.get(),graphInk:graphInkAPI.get(),
 formulas:[...$('pf').querySelectorAll('.pf')].map(el=>({html:[...el.childNodes].filter(n=>n.nodeName!=='BUTTON').map(n=>n.outerHTML||n.textContent).join(''),x:Math.max(0,Math.min(1,el.offsetLeft/($('pf').clientWidth||1))),y:Math.max(0,Math.min(1,el.offsetTop/($('pf').clientHeight||1)))}))};
}
const permissionDisabled=new WeakSet();
function permissionUI(){
 const readOnly=!editable();document.body.classList.toggle('interval-readonly',readOnly);
 document.querySelectorAll('main input,main select,main button').forEach(el=>{if(readOnly){if(!el.disabled)permissionDisabled.add(el);el.disabled=true;}else if(permissionDisabled.has(el)){el.disabled=false;permissionDisabled.delete(el);}});
 $('work').contentEditable=String(!readOnly);
 if(!readOnly)count();
}
function publishLesson(){
 if(applying||!editable())return;
 const value=captureLesson();
 if(!validLesson(value)){$('status').hidden=false;$('status').textContent='La sala admite extremos enteros de −99 a 99 y hasta 1200 puntos de dibujo por lienzo. Reduce el contenido antes de compartir.';return;}
 const key=JSON.stringify(value);if(key===lastRemote)return;
 lastRemote=key;adapter.commit(state=>{state.fields.lesson=value;});
}
function schedulePublish(){if(applying||!editable())return;clearTimeout(publishTimer);publishTimer=setTimeout(publishLesson,120);}
function applyLesson(){
 permissionUI();const value=adapter.getState().fields.lesson;if(!value||!validLesson(value))return;
 const key=JSON.stringify(value);if(key===lastRemote)return;lastRemote=key;applying=true;
 try{
  if(currentExercise!==value.expression||tp!==value.topic){tp=value.topic;tabs(tp);$('inp').value=value.expression;build();}
  shown=value.shown;prof=value.prof;$('mode').classList.toggle('act',prof);$('mode').setAttribute('aria-pressed',String(prof));$('next').textContent=prof?'Comprobar paso':'Siguiente paso';$('board').classList.toggle('prof',prof);$('work').classList.toggle('on',prof);
  setHTML($('work'),DOMPurify.sanitize(value.work,{ALLOWED_TAGS:['span','sup','sub','div','p','br','b','strong','i'],ALLOWED_ATTR:['class','contenteditable']}));draw();
  strokes=value.strokes.map(s=>({...s,p:s.p.map(p=>[p[0]*(cv.width||1),p[1]*(cv.height||1)])}));paint();graphModelAPI.set(value.graph);graphInkAPI.set(value.graphInk);
  clearPF();value.formulas.forEach(f=>{const r=$('pf').getBoundingClientRect();addPF(f.html,r.left+f.x*r.width,r.top+f.y*r.height);const el=$('pf').lastElementChild;el.style.left=f.x*$('pf').clientWidth+'px';el.style.top=f.y*$('pf').clientHeight+'px';});
 }finally{applying=false;permissionUI();}
}
// UI controls are also guarded before their handlers, including keyboard shortcuts.
for(const name of ['click','beforeinput','pointerdown','keydown'])document.addEventListener(name,event=>{
 if(editable()||!event.target.closest?.('main'))return;
 if(event.target.closest('summary'))return;
 if(name==='keydown'&&!['ArrowRight','ArrowLeft',' '].includes(event.key))return;
 if(event.target.closest('button,input,select,[contenteditable],.rule,.pf,canvas')||name==='keydown'){event.preventDefault();event.stopImmediatePropagation();}
},true);
for(const name of ['click','input','change','pointerup','pointercancel','keyup'])$('workspace').addEventListener(name,schedulePublish);
adapter.subscribe(applyLesson);
const live=attachLive(adapter,{boardId:'intervalos',workspace:$('workspace'),slot:$('live-slot')});
live.subscribe(view=>{$('status').hidden=view.status==='active'&&!view.error;$('status').textContent=view.error||(view.status==='paused'?'El profesor se desconectó. La pizarra está en pausa.':view.status==='waiting'?'Esperando la aceptación del profesor…':'Conectando a la sala…');});
if(live.mode==='solo'){const button=document.createElement('button');button.textContent='Clase';button.onclick=()=>location.assign('/profesor/?board=intervalos');$('live-slot').append(button);}
permissionUI();

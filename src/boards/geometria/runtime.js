/* Port of the user's geometry HTML. Original SHA256 6a7d35c4bd742c31a3ba40eec2903dc18e3e1d86861c54aa1bea6a935a022fd4.
 * Geometry and tools retained; legacy hosted database removed, sinks sanitized, IDs/history/animation supplied by bridge. */
import { putHTML } from './sanitize';
const htmlAttr=value=>String(value).replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
let geometrySample = item => item,geometryValid=()=>true,geometryRenderError=()=>{};
function r() { const original = S.items; S.items = original.map(item => geometrySample(item, Date.now())); try {
    renderGeometry();
}
finally {
    S.items = original;
} }
let geometryNewId = () => `solo:${crypto.randomUUID()}`, geometryAnimationStart = () => { }, geometryAnimationStop = () => { };
function listen(target,type,callback){target.addEventListener(type,event=>{try{callback(event);}catch{geometryRenderError();drag=null;S.sel=-1;}});}
const $ = i => document.getElementById(i), sv = $('sv'), L = $('L');
const COL = ['#111111', '#6b7280', '#e03e3e', '#f97316', '#eab308', '#84cc16', '#2e8b57', '#06b6d4', '#2563eb', '#8e44ad', '#ec4899', '#92400e'];
const S = { pr: { on: 0, x: 620, y: 450, r: 0, R: 200 }, sd: -1, gs: [], items: [], tool: 'm', col: '#2563eb', sel: -1, snap: 0, tab: 'tri', ang: 0, hide: 1, hist: [], n: 0 };
const TRI = { Equilátero: [[-100, 80], [0, -93], [100, 80]], Isósceles: [[-80, 80], [0, -100], [80, 80]], Escaleno: [[-120, 80], [-20, -90], [110, 80]], Rectángulo: [[-90, 80], [-90, -80], [110, 80]], Obtusángulo: [[-130, 70], [-60, -50], [100, 70]], Acutángulo: [[-100, 70], [10, -90], [110, 60]] };
const QUA = { Cuadrado: [[-90, 90], [-90, -90], [90, -90], [90, 90]], Rectángulo: [[-130, 70], [-130, -70], [130, -70], [130, 70]], Rombo: [[-120, 0], [0, -80], [120, 0], [0, 80]], Romboide: [[-150, 70], [-100, -70], [150, -70], [100, 70]], 'Trapecio isósceles': [[-140, 70], [-80, -70], [80, -70], [140, 70]], 'Trapecio rectángulo': [[-120, 70], [-120, -70], [40, -70], [120, 70]], 'Trapecio escaleno': [[-130, 70], [-100, -70], [60, -70], [140, 70]], Cometa: [[-110, 0], [0, -80], [150, 0], [0, 80]], Cóncavo: [[-120, 90], [0, -110], [120, 90], [0, 20]] };
const TABS = { tri: '🔺 Triángulos', qua: '◻️ Cuadriláteros', cir: '⭕ Círculo', are: '📏 Áreas', pol: '🧊 Poliedros', rev: '🛢️ Cuerpos', ang: '📐 Ángulos', lin: '↗️ Líneas', dib: '✏️ Dibujo' };
/* ===== LÍNEAS: recta, rayo, segmento, paralelas, perpendiculares, secantes ===== */
const NL = [
    ['Recta', [[-170, 0, 170, 0, 'aa']], [[0, -24, 'recta']]],
    ['Rayo', [[-170, 0, 170, 0, 'da']], [[-170, -24, 'A'], [0, -24, 'rayo'], [-170, 36, 'origen']]],
    ['Segmento', [[-140, 0, 140, 0, 'dd']], [[-140, -24, 'A'], [140, -24, 'B'], [0, -24, 'segmento AB']]],
    ['Paralelas', [[-160, -42, 160, -42, 'aa'], [-160, 42, 160, 42, 'aa']], [[-130, -56, 'L₁'], [-130, 72, 'L₂'], [0, 6, 'L₁ ∥ L₂']]],
    ['Perpendiculares', [[-150, 0, 150, 0, 'aa'], [0, -105, 0, 105, 'aa']], [[140, -14, 'L₁'], [20, -94, 'L₂'], [-90, -52, 'L₁ ⊥ L₂']]],
    ['Secantes', [[-135, -75, 135, 75, 'aa'], [-135, 75, 135, -75, 'aa']], [[120, 100, 'L₁'], [120, -92, 'L₂'], [-95, 0, 'se cruzan']]]
];
const NX = ['La RECTA no tiene principio ni fin: sigue y sigue por los dos lados (por eso lleva 2 flechas). No se puede medir.',
    'El RAYO (o semirrecta) tiene un punto de inicio, el origen, y sigue sin fin hacia un solo lado. No se puede medir.',
    'El SEGMENTO tiene principio y fin: es un pedacito de recta con 2 puntos (A y B). ¡Este sí se puede medir con la regla!',
    'Las rectas PARALELAS NUNCA se cruzan: siempre están a la misma distancia. Se escribe L₁ ∥ L₂.',
    'Las rectas PERPENDICULARES se cruzan y forman ángulos RECTOS (90°). Se escribe L₁ ⊥ L₂.',
    'Las rectas SECANTES se cruzan en un punto, pero NO forman ángulos rectos.'];
NL.push(['Paralelas y transversal', (() => { const d = [-72, 105.6, 72, -105.6]; return [[-170, -44, 170, -44, 'aa'], [-170, 44, 170, 44, 'aa'], [d[0], d[1], d[2], d[3], 'aa']]; })(), (() => {
        const P = [[30, -44], [-30, 44]], th = Math.atan2(88, 60), pi = Math.PI, Sc = [[th, pi], [0, th], [pi, pi + th], [pi + th, 2 * pi]], G = ['α', 'β', 'θ', 'ω', 'ε', 'τ', 'σ', 'φ'], L = [];
        P.forEach((p, j) => Sc.forEach((s, i) => { const b = (s[0] + s[1]) / 2, r = (s[1] - s[0]) < 1.2 ? 34 : 28; L.push([p[0] + r * Math.cos(b), p[1] - r * Math.sin(b) + 7, G[j * 4 + i]]); }));
        L.push([-135, -54, 'L₁'], [-135, 72, 'L₂'], [-110, 6, 'L₁ ∥ L₂']);
        return L;
    })()]);
NX.push('Una TRANSVERSAL corta a 2 paralelas y forma 8 ángulos. Alternos (θ=τ, ω=ε, α=φ, σ=β) y correspondientes (α=ε, β=τ, σ=θ, φ=ω) son IGUALES. Los conjugados (θ+ε, ω+τ, α+σ, β+φ) suman 180°.');
const LX = { r: 'La RECTA no tiene principio ni fin: sigue por los dos lados (2 flechas). No se puede medir.', y: 'El RAYO tiene un origen (el punto) y sigue sin fin por un solo lado (1 flecha). No se puede medir.', s: 'El SEGMENTO tiene principio y fin (2 puntos): ¡sí se puede medir con la regla!' };
function lnE(it, s) {
    const c = it.c, x1 = it.x1, y1 = it.y1, x2 = it.x2, y2 = it.y2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, an = Math.atan2(dy, dx) / rad, k = it.ln, a1 = k == 'r' ? 14 : 0, a2 = k != 's' ? 14 : 0;
    let o = '';
    if (s)
        o += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-opacity=".25" stroke-width="16" stroke-linecap="round"/>`;
    o += `<line x1="${x1 + a1 * ux}" y1="${y1 + a1 * uy}" x2="${x2 - a2 * ux}" y2="${y2 - a2 * uy}" stroke="${c}" stroke-width="${s ? 5 : 4}"/>`;
    const ar = (x, y, a) => `<polygon points="0,0 -22,-10 -22,10" transform="translate(${x} ${y}) rotate(${a})" fill="${c}"/>`, dt = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`;
    if (k == 'r')
        o += ar(x1, y1, an + 180) + ar(x2, y2, an);
    else if (k == 'y')
        o += dt(x1, y1) + ar(x2, y2, an);
    else
        o += dt(x1, y1) + dt(x2, y2);
    if (it.nm) {
        const tx = (x, y, t) => `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="19" font-weight="700" fill="${c}" stroke="var(--cd)" stroke-width="4" paint-order="stroke">${t}</text>`, nx = -uy * 26, ny = ux * 26;
        if (k == 'r')
            o += tx((x1 + x2) / 2 + nx, (y1 + y2) / 2 + ny, 'recta');
        else if (k == 'y')
            o += tx(x1 + nx, y1 + ny, 'A') + tx((x1 + x2) / 2 + nx, (y1 + y2) / 2 + ny, 'rayo');
        else
            o += tx(x1 + nx, y1 + ny, 'A') + tx(x2 + nx, y2 + ny, 'B');
    }
    return o;
}
function mkN(k) { const o = S.items.length % 5 * 26; add({ t: 'n', k, x: 500 + o, y: 280 + o, s: 1.3, r: 0, c: '#2563eb' }); }
function nl(it, s) {
    const c = it.c || '#2563eb', K = NL[it.k];
    let o = '', g = '';
    K[1].forEach(([x1, y1, x2, y2, st]) => {
        const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, an = Math.atan2(dy, dx) / rad, a1 = st[0] == 'a' ? 14 : 0, a2 = st[1] == 'a' ? 14 : 0, X1 = x1 + a1 * ux, Y1 = y1 + a1 * uy, X2 = x2 - a2 * ux, Y2 = y2 - a2 * uy;
        if (s)
            g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-opacity=".25" stroke-width="18" stroke-linecap="round"/>`;
        o += `<line x1="${X1}" y1="${Y1}" x2="${X2}" y2="${Y2}" stroke="${c}" stroke-width="5"/>`;
        [[st[0], x1, y1, an + 180], [st[1], x2, y2, an]].forEach(([t, x, y, a]) => {
            if (t == 'a')
                o += `<polygon points="0,0 -22,-10 -22,10" transform="translate(${x} ${y}) rotate(${a})" fill="${c}"/>`;
            else if (t == 'd')
                o += `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`;
        });
    });
    if (it.k == 4)
        o += `<rect x="0" y="-20" width="20" height="20" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width="3"/>`;
    if (it.k == 5)
        o += `<circle cx="0" cy="0" r="6" fill="${c}"/>`;
    if (!it.hn)
        K[2].forEach(([x, y, t]) => { o += `<text x="${x}" y="${y}" text-anchor="middle" font-size="19" font-weight="700" fill="${c}" stroke="var(--cd)" stroke-width="4" paint-order="stroke">${t}</text>`; });
    return `<g transform="translate(${it.x} ${it.y}) rotate(${it.r}) scale(${it.s})">${g}${o}</g>`;
}
function nhit(it, p) { const a = -it.r * rad, dx = p.x - it.x, dy = p.y - it.y, q = { x: (dx * Math.cos(a) - dy * Math.sin(a)) / it.s, y: (dx * Math.sin(a) + dy * Math.cos(a)) / it.s }; return NL[it.k][1].some(g => sd(q, { x: g[0], y: g[1] }, { x: g[2], y: g[3] }) * it.s < 14); }
const rad = Math.PI / 180, D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let H = [], drag = null, raf = 0, txtIn = null;
function snapH() { }
function pt(e) { const m = sv.getScreenCTM().inverse(), p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return { x: p.x, y: p.y }; }
const sn = v => S.snap ? Math.round(v / 20) * 20 : v;
function add(it) { S.sd = -1; snapH(); it.id = geometryNewId(); S.items.push(it); S.sel = S.items.length - 1; S.tool = 'm'; ui(); draw(); }
function mk(name, pts) { const o = S.items.length % 5 * 18; add({ t: 'p', c: '#2e8b57', pts: pts.map(p => ({ x: 500 + p[0] + o, y: 280 + p[1] + o })), nm: name }); }
function mkA(v) { const o = S.items.length % 5 * 20; add({ t: 'a', x: 250 + o, y: 420 - o, a1: 0, a2: v, l: 200, c: '#2e8b57' }); }
const A = (it, i) => ({ x: it.x + it.l * Math.cos(it['a' + i] * rad), y: it.y - it.l * Math.sin(it['a' + i] * rad) });
function angs(p) {
    const n = p.pts.length, cr = [];
    let s = 0;
    for (let i = 0; i < n; i++) {
        const a = p.pts[(i + n - 1) % n], b = p.pts[i], c = p.pts[(i + 1) % n];
        cr.push((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x));
        s += cr[i];
    }
    return p.pts.map((b, i) => {
        const a = p.pts[(i + n - 1) % n], c = p.pts[(i + 1) % n];
        let d = (Math.atan2(a.y - b.y, a.x - b.x) - Math.atan2(c.y - b.y, c.x - b.x)) / rad;
        d = (d + 720) % 360;
        if (d > 180)
            d = 360 - d;
        if (cr[i] * s < 0)
            d = 360 - d;
        return d;
    });
}
function rnd(a) {
    const t = Math.round(a.reduce((x, y) => x + y, 0)), f = a.map(Math.floor);
    let r = t - f.reduce((x, y) => x + y, 0);
    a.map((v, i) => [v - f[i], i]).sort((x, y) => y[0] - x[0]).forEach(([_, i]) => {
        if (r > 0) {
            f[i]++;
            r--;
        }
    });
    return f;
}
function cls(p) {
    const n = p.pts.length, P = p.pts, an = angs(p), sd = P.map((q, i) => D(q, P[(i + 1) % n])), eq = (a, b) => Math.abs(a - b) < .03 * Math.max(a, b), rt = an.map(a => Math.abs(a - 90) <= 1);
    if (n == 3) {
        const s3 = eq(sd[0], sd[1]) && eq(sd[1], sd[2]), s2 = eq(sd[0], sd[1]) || eq(sd[1], sd[2]) || eq(sd[0], sd[2]);
        let a = s3 ? 'Equilátero' : s2 ? 'Isósceles' : 'Escaleno', b = rt.some(x => x) ? 'Rectángulo' : an.some(x => x > 90) ? 'Obtusángulo' : 'Acutángulo';
        return [a + ' y ' + b + (s3 || rt.some(x => x) ? ' 🎉' : ''), s3 ? '3 lados iguales y cada ángulo mide 60°.' : 'Los 3 ángulos siempre suman 180°.'];
    }
    if (an.some(x => x > 180))
        return ['Cóncavo (trapezoide)', 'Un ángulo mide más de 180°. Los 4 ángulos suman 360°.'];
    const par = (i, j) => { const u = { x: P[(i + 1) % 4].x - P[i].x, y: P[(i + 1) % 4].y - P[i].y }, v = { x: P[(j + 1) % 4].x - P[j].x, y: P[(j + 1) % 4].y - P[j].y }; return Math.abs(u.x * v.y - u.y * v.x) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)) < .03; }, p1 = par(0, 2), p2 = par(1, 3), r4 = rt.every(x => x), e4 = eq(sd[0], sd[1]) && eq(sd[1], sd[2]) && eq(sd[2], sd[3]);
    let r;
    if (p1 && p2)
        r = r4 && e4 ? 'Cuadrado 🎉' : r4 ? 'Rectángulo 🎉' : e4 ? 'Rombo' : 'Romboide';
    else if (p1 || p2) {
        const l = p1 ? [1, 3] : [0, 2];
        r = rt.filter(x => x).length >= 2 ? 'Trapecio rectángulo' : eq(sd[l[0]], sd[l[1]]) ? 'Trapecio isósceles' : 'Trapecio escaleno';
    }
    else
        r = (eq(sd[0], sd[1]) && eq(sd[2], sd[3])) || (eq(sd[1], sd[2]) && eq(sd[3], sd[0])) ? 'Trapezoide simétrico (cometa)' : 'Trapezoide asimétrico';
    return [r, 'Los 4 ángulos suman 360°.'];
}
function meas(a) { let d = Math.abs(a.a2 - a.a1) % 360; return d > 180 ? 360 - d : d; }
function draw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(r); }
function renderGeometry() {
    let o = '';
    S.items.forEach((it, i) => {
        if(!geometryValid(it)){geometryRenderError();return;}
        const before=o;try {
        o += `<g data-geometry-item="${it.id}">`;
        const s = i == S.sel;
        if (it.t == 'p') {
            const P = it.pts, d = P.map((q, k) => (k ? 'L' : 'M') + q.x + ' ' + q.y).join('') + 'Z', cx = P.reduce((a, q) => a + q.x, 0) / P.length, cy = P.reduce((a, q) => a + q.y, 0) / P.length;
            o += rgnPS(it) + `<path d="${d}" fill="${it.f || it.c}" fill-opacity="${it.f ? .8 : .15}" stroke="${s ? '#2563eb' : it.c}" stroke-width="${s ? 7 : 5}" stroke-opacity="${s ? .35 : 1}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${it.c}" stroke-width="5" stroke-linejoin="round"/>`;
            o += ex(it, s) + ppaint(it);
            const pvc = [];
            (it.pv || []).forEach(e => pvc[e.k] = e.c);
            const an = S.ang ? rnd(angs(it)) : null;
            P.forEach((q, k) => {
                const L = 'ABCD'[k], ux = q.x - cx, uy = q.y - cy, m = Math.hypot(ux, uy) || 1;
                o += `<circle cx="${q.x}" cy="${q.y}" r="${s ? 9 : 7}" fill="${pvc[k] || '#fff'}" stroke="#2563eb" stroke-width="3"/><text x="${q.x + ux / m * 24}" y="${q.y + uy / m * 24 + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="#2563eb">${L}</text>`;
                if (an)
                    o += `<text x="${q.x - ux / m * 42}" y="${q.y - uy / m * 42 + 6}" text-anchor="middle" font-size="16" font-weight="700" fill="#d97706">${an[k]}°</text>`;
            });
        }
        else if (it.t == 'a') {
            const p1 = A(it, 1), p2 = A(it, 2), m = meas(it), R = 44, u = k => ({ x: it.x + R * Math.cos(it['a' + k] * rad), y: it.y - R * Math.sin(it['a' + k] * rad) }), u1 = u(1), u2 = u(2), df = ((it.a2 - it.a1) + 540) % 360 - 180;
            if (s)
                o += `<path d="M${p1.x} ${p1.y}L${it.x} ${it.y}L${p2.x} ${p2.y}" fill="none" stroke="#2563eb" stroke-opacity=".3" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
            if (Math.abs(m - 90) < 1) {
                const a = it.a1 * rad, b = it.a2 * rad, q = 18, c1 = { x: it.x + q * Math.cos(a), y: it.y - q * Math.sin(a) }, c2 = { x: it.x + q * Math.cos(b), y: it.y - q * Math.sin(b) };
                o += `<path d="M${it.x} ${it.y}L${c1.x} ${c1.y}L${c1.x + c2.x - it.x} ${c1.y + c2.y - it.y}L${c2.x} ${c2.y}Z" fill="#e03e3e" fill-opacity=".4" stroke="#e03e3e" stroke-width="2.5"/>`;
            }
            else if (m > .5)
                o += `<path d="M${it.x} ${it.y}L${u1.x} ${u1.y}A${R} ${R} 0 0 ${df > 0 ? 0 : 1} ${u2.x} ${u2.y}Z" fill="#f59e0b" fill-opacity=".4" stroke="#f59e0b" stroke-width="2"/>`;
            [p1, p2].forEach(q => o += `<line x1="${it.x}" y1="${it.y}" x2="${q.x}" y2="${q.y}" stroke="${it.c}" stroke-width="3" stroke-linecap="round"/><circle cx="${q.x}" cy="${q.y}" r="${s ? 9 : 4}" fill="${s ? '#fff' : it.c}" stroke="#2563eb" stroke-width="${s ? 3 : 0}"/>`);
            o += `<circle cx="${it.x}" cy="${it.y}" r="5" fill="#fff" stroke="#2563eb" stroke-width="2.5"/>`;
            o += bs(it);
            if (!S.hide) {
                const b = ((it.a1 + it.a2) / 2 + (Math.abs(it.a2 - it.a1) > 180 ? 180 : 0)) * rad;
                o += `<text x="${it.x + 74 * Math.cos(b)}" y="${it.y - 74 * Math.sin(b) + 6}" text-anchor="middle" font-size="18" font-weight="700" fill="#d97706">${Math.round(m)}°</text>`;
            }
        }
        else if (it.t == 'l')
            o += (it.ln ? lnE(it, s) : `<line x1="${it.x1}" y1="${it.y1}" x2="${it.x2}" y2="${it.y2}" stroke="${it.c}" stroke-width="${s ? 4 : 3}" stroke-linecap="round"/>`) + ppL(it) + (s ? `<circle cx="${it.x1}" cy="${it.y1}" r="6" fill="#fff" stroke="#2563eb" stroke-width="2"/><circle cx="${it.x2}" cy="${it.y2}" r="6" fill="#fff" stroke="#2563eb" stroke-width="2"/>` : '');
        else if (it.t == 'd')
            o += `<path d="${it.d.map((q, k) => (k ? 'L' : 'M') + q.x + ' ' + q.y).join('')}" fill="none" stroke="${it.c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="${s ? 1 : .8}"/>`;
        else if (it.t == 'h')
            o += hv(it, s);
        else if (it.t == 'y')
            o += PY.draw(it, s);
        else if (it.t == 'r')
            o += rv(it, s);
        else if (it.t == 'n')
            o += nl(it, s);
        else if (it.t == 'g')
            o += ag(it, s);
        else if (it.t == 'c')
            o += cd(it, s);
        else if (it.t == 's')
            o += sh(it, s);
        else if (it.t == 'f')
            o += fc(it, s);
        else
            o += `<text x="${it.x}" y="${it.y}" text-anchor="middle" font-size="${it.s}" font-weight="700" fill="${it.c}">${it.x_.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` + (s ? `<rect x="${it.x - it.s * .3 * it.x_.length - 6}" y="${it.y - it.s}" width="${it.s * .6 * it.x_.length + 12}" height="${it.s * 1.3}" fill="none" stroke="#2563eb" stroke-dasharray="5 4"/>` : '');
        o += '</g>';
        }catch{ o=before;geometryRenderError(); }
    });
    putHTML(L, o + prot());
    owl();
}
function owl() {
    const it = S.items[S.sel];
    let m = 'Elige una figura de arriba y arrastra sus esquinas 👆';
    if (S.tool == 'p')
        m = 'Dibuja a mano. Pulsa 👆 Mover al terminar.';
    else if (S.tool == 'l')
        m = 'Arrastra para trazar una línea.';
    else if (S.tool == 'lr')
        m = 'RECTA: arrastra donde quieras. Sin principio ni fin (2 flechas). Luego pulsa 👆 Mover y toca la recta para girarla, pintarla o mover sus puntas.';
    else if (S.tool == 'ly')
        m = 'RAYO: arrastra desde el origen (el punto) hacia donde quieras. Sigue sin fin por un lado (1 flecha).';
    else if (S.tool == 'ls')
        m = 'SEGMENTO: arrastra de un punto a otro. Tiene principio y fin, ¡sí se puede medir!';
    else if (S.tool == 't')
        m = 'Escribe el texto arriba y toca la pizarra.';
    else if (S.tool == 'pt')
        m = 'Mueve el puntero para señalar. Cambia su color con la paleta. No deja marcas.';
    else if (S.tool == 'bk')
        m = S.bke ? 'Toca una zona pintada del círculo para quitarle el color.' : 'Elige un color y toca una zona, un arco del borde o una línea (cada trozo se pinta aparte) 🪣';
    else if (it && it.t == 'p') {
        const c = cls(it);
        m = c[0] + '. ' + c[1];
    }
    else if (it && it.t == 'h') {
        const B = BODY[it.k], C = B.F.length, V = B.V.length, A = B.nE;
        m = S.hide ? '¿Cuántas caras, vértices y aristas crees que tiene el ' + B.n.toLowerCase() + '? Cuéntalas girándolo y pulsa «Comprobar conteo».' : B.n + ': C = ' + C + ', V = ' + V + ', A = ' + A + '. ' + C + ' + ' + V + ' = ' + (C + V) + ' y ' + A + ' + 2 = ' + (A + 2) + '. ¡Euler se cumple! Prueba 🧩 Desarrollar.';
    }
    else if (it && it.t == 'r')
        m = ['Un cilindro nace al girar un rectángulo alrededor de su eje.', 'Un cono nace al girar un triángulo rectángulo alrededor de su altura.', 'Una esfera nace al girar un semicírculo alrededor de su diámetro.'][it.k] + (() => { const f = ELR[it.k].map(e => e[0]).filter((_, i) => !(it.on || []).includes(i)); return f.length ? (f.length == 1 ? ' Falta: ' : ' Faltan: ') + f.join(', ') + '. Actívalos y dale a cada uno su color 👇' : ' ¡Están todos los elementos! Ponles un color a cada uno y pulsa ▶ Reproducir o 🧩 Desarrollar 👇'; })();
    else if (it && it.t == 'l' && it.ln)
        m = LX[it.ln];
    else if (it && it.t == 'n')
        m = NX[it.k];
    else if (it && it.t == 'g') {
        const A = AR[it.k], f = A[4].filter((e, i) => !it.on.includes(i)).map(e => e[0]);
        m = it.show ? A[0] + ': ' + A[2] + '. ' + A[3] : f.length ? '¿Qué fórmula tiene este ' + A[0].toLowerCase() + '? Coloca sus elementos (' + f.join(', ') + ') y pulsa «Comprobar fórmula».' : '¡Figura completa! Di la fórmula en voz alta y pulsa «Comprobar fórmula».';
    }
    else if (it && it.t == 'y')
        m = PY.msg(it);
    else if (it && it.t == 's')
        m = 'Arrastra la figura para moverla. Cambia su tamaño con el punto de la esquina o con ➕ ➖, y elige sus colores abajo.';
    else if (it && it.t == 'c')
        m = (it.un > 0 || it.sp > 0) ? 'Mueve el «Giro» y el radio recorre toda la circunferencia. Al desarrollarla se estira en una línea: mide L = 2πr, ¡un poco más de 3 diámetros! 📏' : S.hide ? '¿Cuánto crees que mide el radio? Estima, mide con la cuadrícula (1 cuadro = 1 cm) y pulsa «Comprobar medida».' : 'Radio ' + (it.r / 20).toFixed(1) + ' cm, diámetro ' + (it.r / 10).toFixed(1) + ' cm (d = 2r). L = 2πr ≈ ' + (2 * Math.PI * it.r / 20).toFixed(1) + ' cm · A = πr² ≈ ' + (Math.PI * it.r * it.r / 400).toFixed(1) + ' cm².';
    else if (it && it.t == 'a')
        m = S.hide ? '¿Cuánto crees que mide este ángulo? Estima y pulsa «Comprobar medida».' : 'Mide ' + Math.round(meas(it)) + '°. ' + (Math.abs(meas(it) - 90) < 1 ? 'Es recto.' : meas(it) < 90 ? 'Es agudo.' : meas(it) < 180 ? 'Es obtuso.' : 'Es llano.');
    $('owl').textContent = '🦉 ' + m;
}
function ui() {
    if(S.items[S.sel]&&!geometryValid(S.items[S.sel]))S.sel=-1;
    putHTML($('tabs'), Object.entries(TABS).map(([k, v]) => `<button data-k="${k}" class="${S.tab == k ? 'on' : ''}">${v}</button>`).join(''));
    putHTML($('tools'), [['m', '👆 Mover'], ['p', '✏️ Lápiz'], ['l', '📏 Línea'], ['t', '🔤 Texto'], ['pt', '🔴 Puntero'], ['bk', '🪣 Balde']].map(([k, v]) => `<button data-t="${k}" class="${S.tool == k ? 'on' : ''}">${v}</button>`).join('') + (S.tool == 'bk' ? '<button data-x="bke" class="' + (S.bke ? 'on' : '') + '">🧽 Quitar color</button>' : '') + ' <span>Figuras:</span>' + SH.map(([k, v]) => `<button data-sh="${k}">${v}</button>`).join('') + ' <input type="text" id="ti" placeholder="Texto…" maxlength="14" value="' + htmlAttr(txtIn || '') + '"> <button data-x="pr" class="' + (S.pr.on ? 'on' : '') + '">📐 Transportador</button><button data-x="prm">➖</button><button data-x="prM">➕</button> │ ' + (S.tab == 'tri' ? Object.keys(TRI).map(k => `<button data-c="${k}">${k}</button>`).join('') : S.tab == 'qua' ? Object.keys(QUA).map(k => `<button data-c="${k}">${k}</button>`).join('') : S.tab == 'pol' ? '<b>Crear poliedro:</b>' + PY.NM.map((n, i) => `<button data-hk="${i}">${n}</button>`).join('') + '<button data-hk="r">🎲 Sorpresa</button><button data-x="ynm" class="' + (S.nm ? 'on' : '') + '">🏷️ Nombres</button><button data-x="yeu">🧮 Fórmula de Euler</button>' : S.tab == 'rev' ? '<b>Crear dibujo:</b>' + ['🛢️ Cilindro', '🔻 Cono', '🔵 Esfera'].map((n, i) => `<button data-rk="${i}">${n}</button>`).join('') : S.tab == 'lin' ? '<b>Dibujar:</b>' + [['lr', '↔️ Recta'], ['ly', '●→ Rayo'], ['ls', '●—● Segmento']].map(([k, v]) => `<button data-t="${k}" class="${S.tool == k ? 'on' : ''}">${v}</button>`).join('') + '<span>Arrastra en la pizarra. Con 👆 Mover tocas la línea para girarla, pintarla o mover sus puntas.</span>' : S.tab == 'are' ? AR.map((a, i) => `<button data-gk="${i}">${a[0]}</button>`).join('') + '<button data-gk="r">🎲 Sorpresa</button>' : S.tab == 'cir' ? '<b>Crear dibujo:</b>' + [2, 3, 4, 5, 6].map(v => `<button data-cr="${v}">${v} cm</button>`).join('') + '<button data-cr="r">🎲 Sorpresa</button>' : S.tab == 'ang' ? '<span>Crear ángulo de:</span>' + [30, 45, 60, 90, 120, 150, 180].map(v => `<button data-a="${v}">${v}°</button>`).join('') + '<button data-a="r">🎲</button>' : '<span>Usa lápiz, línea y texto sobre cualquier figura.</span>'));
    putHTML($('cols'), (() => { const q = S.items[S.sel]; return q && q.t == 'c' ? '<b>Pintar: ' + (CN[q.af || 'cf'] || '') + '</b> ' : q && q.t == 'r' ? '<b>Pintar: ' + ELR[q.k][+(q.af || 0)][0] + '</b> ' : q && q.t == 'y' ? '<b>' + PY.label(q) + '</b> ' : ''; })() + COL.map(c => `<button class="sw ${S.col == c ? 'sel' : ''}" data-col="${c}" style="background:${c}"></button>`).join('') + '<input type="color" id="cf" value="' + S.col + '">');
    const it = S.items[S.sel], b = [];
    if (it) {
        if (it.t == 'p')
            b.push('<button data-x="ang" class="' + (S.ang ? 'on' : '') + '">∠ Grados auto</button>', '<button data-x="fill">🎨 Relleno</button>' + (it.pts.length == 4 ? '<button data-x="dg0" class="' + (it.dg & 1 ? 'on' : '') + '">⟋ AC</button><button data-x="dg1" class="' + (it.dg & 2 ? 'on' : '') + '">⟍ BD</button><button data-x="par" class="' + (it.par ? 'on' : '') + '">∥ Paralelos</button>' : '') + '<button data-x="ext" class="' + (it.ext ? 'on' : '') + '">↗ Exterior</button><button data-x="dv">✂ Dividir (' + (it.dv || 0) + ')</button>' + (S.sd >= 0 ? '<button data-x="tk">📏 Marcas</button><input type="text" id="si" maxlength="8" style="width:80px" placeholder="Medida" value="' + htmlAttr((it.sl || [])[S.sd] || '') + '">' : ''));
        if (it.t == 'a')
            b.push('<button data-x="hide" class="' + (S.hide ? '' : 'on') + '">' + (S.hide ? '👁 Comprobar medida' : '🙈 Ocultar medida') + '</button>', '<button data-x="o-5">Cerrar −5°</button>', '<button data-x="o5">Abrir +5°</button>', '<button data-x="bis" class="' + (it.bis ? 'on' : '') + '">✂ Bisectriz</button>', '<button data-x="plc">🎯 Colocar transportador</button>');
        if (it.t == 'l' && it.ln)
            b.push('<button data-x="lnm" class="' + (it.nm ? 'on' : '') + '">🏷️ ' + (it.nm ? 'Quitar nombres' : 'Poner nombres') + '</button>');
        if (it.t == 't') {
            const ea = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'), bi = (v, l, st) => '<button data-ins="' + v + '"' + (st ? ' style="' + st + '"' : '') + '>' + (l || v) + '</button>';
            b.push('<input type="text" id="ti2" value="' + ea(it.x_) + '" maxlength="40" style="width:190px;border:2px solid var(--pr)">', '<button data-x="tsm">A−</button><button data-x="tsM">A+</button>', bi('√'), bi('²', 'x<sup>2</sup>'), bi('³', 'x<sup>3</sup>'), bi('⁴', 'x<sup>4</sup>'), bi('ⁿ', 'x<sup>n</sup>'), bi('ˣ', 'x<sup>x</sup>'), '<span style="flex-basis:100%;height:0"></span>', ...['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'τ', 'φ', 'ω'].map(g => bi(g, g, 'font-weight:800;font-size:16px;color:var(--pr)')), ...['°', '∠', '⊥', '∥', '±'].map(g => bi(g, g, 'font-weight:800;font-size:16px')), '<span>También: escribe ^2, ^3, ^5, ^n, ^x…</span>');
        }
        if (it.t == 'n')
            b.push('<button data-x="nln" class="' + (it.hn ? '' : 'on') + '">' + (it.hn ? '🏷️ Mostrar nombres' : '🏷️ Ocultar nombres') + '</button>');
        if (it.t == 'p' || it.t == 'a' || it.t == 'l' || it.t == 'n')
            b.push('<button data-x="tw">👯 Gemelo</button>', '<button data-x="gm">➖</button><button data-x="gM">➕</button>', '<button data-x="r-15">↺ 15°</button><button data-x="r15">↻ 15°</button>');
        const sl = (l, k, mn, mx, v) => '<label>' + l + ' <input type="range" data-sl="' + k + '" min="' + mn + '" max="' + mx + '" value="' + v + '"></label>';
        if (it.t == 'y')
            b.push(...PY.ctx(it));
        if (it.t == 'h')
            b.push(sl('↻ Giro', 'yaw', -180, 180, it.yaw), sl('↕ Inclinación', 'pit', -90, 90, it.pit), sl('🧩 Desarrollar', 'u', 0, 100, it.u * 100), '<button data-x="hide" class="' + (S.hide ? '' : 'on') + '">' + (S.hide ? '👁 Comprobar conteo' : '🙈 Ocultar conteo') + '</button><button data-x="hdes" class="on">▶ Desarrollar</button><button data-x="harm">↩ Armar de nuevo</button><button data-x="hspin">🔄 Girar solo / ⏸</button><button data-x="tw">👯 Gemelo</button><button data-x="gm">➖</button><button data-x="gM">➕</button>');
        if (it.t == 'r')
            b.push(sl('↻ Giro del ' + ['rectángulo', 'triángulo', 'semicírculo'][it.k], 'ang', 0, 360, it.ang), ...ELR[it.k].map((e, i) => '<span style="display:inline-flex;gap:2px"><button data-x="vel:' + i + '" class="' + ((it.on || []).includes(i) ? 'on' : '') + '" style="border:2px solid ' + e[1] + ';' + (+(it.af || 0) === i ? 'box-shadow:0 0 0 2px var(--pr)' : '') + '">' + e[0] + '</button><input type="color" data-pc="' + i + '" value="' + ((it.pc && it.pc[i]) || e[1]) + '" style="width:26px;height:30px;padding:0;border:1px solid var(--bd);border-radius:6px"></span>'), '<button data-x="vall">✨ Todos</button><button data-x="vnone">🧹 Quitar</button><button data-x="rspin">🔄 Girar solo / ⏸</button><button data-x="rpl" class="on">▶ Reproducir</button><button data-x="vfull">🔄 Completo</button><button data-x="vrs">⏮ Reiniciar giro</button>', sl('🧩 Desarrollar', 'un', 0, 100, it.un * 100), '<button data-x="rdes" class="on">▶ Desarrollar</button><button data-x="rarm">↩ Armar de nuevo</button><button data-x="tw">👯 Gemelo</button><button data-x="gm">➖</button><button data-x="gM">➕</button>');
        if (it.t == 'g') {
            b.push(...AR[it.k][4].map((e, i) => '<button data-x="el:' + i + '" class="' + (it.on.includes(i) ? 'on' : '') + '" style="border:2px solid ' + e[1] + '">' + e[0] + '</button>'), '<button data-x="all">✨ Todos</button><button data-x="none">🧹 Quitar</button><button data-x="gsh" class="' + (it.show ? 'on' : '') + '">' + (it.show ? '🙈 Ocultar fórmula' : '👁 Comprobar fórmula') + '</button><button data-x="tw">👯 Gemelo</button><button data-x="gm">➖</button><button data-x="gM">➕</button><button data-x="r-15">↺ 15°</button><button data-x="r15">↻ 15°</button>');
        }
        if (it.t == 'c')
            b.push(...[['ci', 'Círculo'], ['cf', 'Circunferencia'], ['ce', 'Centro'], ['ra', 'Radio'], ['di', 'Diámetro'], ['cu', 'Cuerda'], ['ar', 'Arco'], ['sg', 'Segmento'], ['sc', 'Sector'], ['fl', 'Flecha'], ['se', 'Secante'], ['ta', 'Tangente']].map(([k, v]) => '<span style="display:inline-flex;gap:2px"><button data-x="e:' + k + '" class="' + (((k == 'ci' || k == 'cf' || k == 'ce') ? it.on[k] !== 0 : it.on[k]) ? 'on' : '') + '" style="' + (it.af == k ? 'box-shadow:0 0 0 2px var(--pr)' : '') + '">' + v + '</button><input type="color" data-pc="' + k + '" value="' + ((it.pc && it.pc[k]) || DC[k]) + '" style="width:26px;height:30px;padding:0;border:1px solid var(--bd);border-radius:6px"></span>'), '<button data-x="hide" class="' + (S.hide ? '' : 'on') + '">' + (S.hide ? '👁 Comprobar medida' : '🙈 Ocultar medida') + '</button>', '<button data-x="tw">👯 Gemelo</button><button data-x="gm">➖ Radio</button><button data-x="gM">➕ Radio</button><button data-x="cor">🎨 Colores originales</button>', sl('↻ Giro del radio', 'sp', 0, 360, it.sp || 0), sl('🧩 Desarrollar', 'un', 0, 100, (it.un || 0) * 100), '<button data-x="call">✨ Todos</button><button data-x="cnone">🧹 Quitar</button><button data-x="cpl" class="on">▶ Reproducir</button><button data-x="cfull">🔄 Completo</button><button data-x="crs">⏮ Reiniciar giro</button><button data-x="cdes" class="on">▶ Desarrollar</button><button data-x="carm">↩ Armar de nuevo</button><button data-x="cfm" class="' + (it.fm ? 'on' : '') + '">📐 Ver fórmulas</button>');
        if (it.t == 'f')
            b.push('<button data-x="gm">➖</button><button data-x="gM">➕</button>');
        if (it.t == 's')
            b.push('<span>Borde</span><input type="color" data-sp="c" value="' + it.c + '"><span>Relleno</span><input type="color" data-sp="f" value="' + (it.f || it.f0 || '#93c5fd') + '">' + (it.k == 'cd' ? '<span>Interior</span><input type="color" data-sp="i" value="' + it.i + '"><button data-x="zim">➖ Interior</button><button data-x="ziM">➕ Interior</button>' : '') + '<button data-x="zfill" class="' + (it.f ? '' : 'on') + '">Sin relleno</button><button data-x="zbm">➖ Borde</button><button data-x="zbM">➕ Borde</button><button data-x="zgm">➖ Tamaño</button><button data-x="zgM">➕ Tamaño</button><button data-x="zr-15">↺ Girar 15°</button><button data-x="zr15">↻ Girar 15°</button><button data-x="zr90">⟳ 90°</button><button data-x="zcp">👯 Copiar</button>');
        if (it.t == 'r')
            b.push('<label>🎨 Color del cuerpo <input type="color" data-bc value="' + (it.bc || ['#F28C28', '#F28C28', '#8E44AD'][it.k]).toLowerCase() + '"></label><button data-x="vnm" class="' + (it.nn ? '' : 'on') + '">' + (it.nn ? '🏷️ Mostrar nombres' : '🏷️ Ocultar nombres') + '</button><button data-x="vbc">↺ Color original</button><button data-x="vbx" class="' + (it.nb ? 'on' : '') + '">' + (it.nb ? '⬜ Mostrar cuadro' : '⬜ Quitar cuadro') + '</button><button data-x="vor">🎨 Colores originales</button>');
        if (['l', 'd', 'p', 'a', 't'].includes(it.t))
            b.push('<label>🖍️ ' + (it.t == 't' ? 'Color del texto' : 'Color de línea') + ' <input type="color" data-lc value="' + it.c + '"></label>' + (it.t == 'p' ? '<label>🎨 Relleno <input type="color" data-fc value="' + (it.f || it.c) + '"></label><button data-x="nofill">Sin relleno</button>' : ''));
        b.push('<button data-x="del">🗑️ Borrar</button>');
    }
    putHTML($('ctx'), b.join(''));
    draw();
    dp();
}
function cen(it) { const P = it.t == 'p' ? it.pts : [{ x: it.x1, y: it.y1 }, { x: it.x2, y: it.y2 }]; return { x: P.reduce((a, q) => a + q.x, 0) / P.length, y: P.reduce((a, q) => a + q.y, 0) / P.length, P }; }
function xf(it, f) {
    if (it.t != 'p' && it.t != 'l')
        return;
    const c = cen(it);
    c.P.forEach(q => { const p = f(q.x - c.x, q.y - c.y); q.x = c.x + p[0]; q.y = c.y + p[1]; });
    if (it.t == 'l') {
        it.x1 = c.P[0].x;
        it.y1 = c.P[0].y;
        it.x2 = c.P[1].x;
        it.y2 = c.P[1].y;
    }
}
function act(x) {
    if (x == 'yeu') {
        snapH();
        S.items.push({ t: 'f', i: PYEU, x: 690, y: 14, s: 1.15, id: geometryNewId() });
        S.sel = S.items.length - 1;
        return ui();
    }
    if (x == 'ynm') {
        S.nm = S.nm ? 0 : 1;
        return ui();
    }
    if (x == 'bke') {
        S.bke = S.bke ? 0 : 1;
        return ui();
    }
    if (x == 'pr') {
        S.pr.on = S.pr.on ? 0 : 1;
        return ui();
    }
    if (x == 'prm' || x == 'prM') {
        S.pr.R = Math.max(120, Math.min(300, S.pr.R + (x == 'prM' ? 30 : -30)));
        return ui();
    }
    const it = S.items[S.sel];
    if (!it)
        return;
    snapH();
    if (it.t == 'y' && x.slice(0, 2) == 'y:') {
        PY.act(x.slice(2), it);
        return ui();
    }
    if (x[0] == 'z' && it.t == 's') {
        zact(x, it);
        return ui();
    }
    if (it.t == 'c' && /^c[a-z]+$/.test(x)) {
        cact(x, it);
        return ui();
    }
    if (it.t == 'r' && x[0] == 'v') {
        vact(x, it);
        return ui();
    }
    if (x == 'nofill' && it.t == 'p') {
        it.f = null;
        return ui();
    }
    if (it.t == 'n' && x == 'nln') {
        it.hn = it.hn ? 0 : 1;
        return ui();
    }
    if (it.t == 'l' && x == 'lnm') {
        it.nm = it.nm ? 0 : 1;
        return ui();
    }
    if (it.t == 't' && (x == 'tsm' || x == 'tsM')) {
        it.s = Math.max(14, Math.min(160, it.s + (x == 'tsM' ? 6 : -6)));
        return ui();
    }
    if (x == 'hdes')
        anRun(() => { it.u = Math.min(1, it.u + .03); return it.u < 1; });
    else if (x == 'harm')
        anRun(() => { it.u = Math.max(0, it.u - .03); return it.u > 0; });
    else if (x == 'hspin') {
        if (AN)
            anStop();
        else
            anRun(() => { it.yaw = (it.yaw + 3) % 360; return true; });
    }
    else if (x == 'rpl') {
        it.ang = 0;
        it.on = it.on || [];
        const q = ELR[it.k].length - 1;
        if (!it.on.includes(q))
            it.on.push(q);
        anRun(() => { it.ang = Math.min(360, it.ang + 3); return it.ang < 360; });
    }
    else if (x == 'rdes')
        anRun(() => { it.un = Math.min(1, it.un + .03); return it.un < 1; });
    else if (x == 'rarm')
        anRun(() => { it.un = Math.max(0, it.un - .03); return it.un > 0; });
    else if (x == 'rspin') {
        if (AN)
            anStop();
        else {
            let d = 1;
            anRun(() => {
                it.ang += 3 * d;
                if (it.ang >= 360) {
                    it.ang = 360;
                    d = -1;
                }
                if (it.ang <= 0) {
                    it.ang = 0;
                    d = 1;
                }
                return true;
            });
        }
    }
    else if (x == 'rfm')
        it.fm = it.fm ? 0 : 1;
    else if (x.startsWith('el:')) {
        const i = +x.slice(3), k = it.on.indexOf(i);
        k < 0 ? it.on.push(i) : it.on.splice(k, 1);
    }
    else if (x == 'all')
        it.on = AR[it.k][4].map((_, i) => i);
    else if (x == 'none') {
        it.on = [];
        it.show = 0;
    }
    else if (x == 'gsh')
        it.show = it.show ? 0 : 1;
    else if (x[1] == ':') {
        const k = x.slice(2);
        it.af = k;
        if (k == 'ci' || k == 'cf' || k == 'ce')
            it.on[k] = it.on[k] === 0 ? 1 : 0;
        else
            it.on[k] = it.on[k] ? 0 : 1;
    }
    else if (x == 'bis')
        it.bis = it.bis ? 0 : 1;
    else if (x == 'dg0' || x == 'dg1')
        it.dg = (it.dg || 0) ^ (x == 'dg0' ? 1 : 2);
    else if (x == 'par' || x == 'ext')
        it[x] = it[x] ? 0 : 1;
    else if (x == 'dv') {
        const o = [0, 2, 3, 4];
        it.dv = o[(o.indexOf(it.dv || 0) + 1) % 4];
    }
    else if (x == 'tk' && S.sd >= 0) {
        it.tk = it.tk || [0, 0, 0, 0];
        it.tk[S.sd] = ((it.tk[S.sd] || 0) + 1) % 4;
    }
    else if (x == 'plc') {
        const q = S.pr;
        q.on = 1;
        q.x = it.x;
        q.y = it.y;
        const d = ((it.a2 - it.a1) % 360 + 360) % 360;
        q.r = d <= 180 ? it.a1 : it.a1 - 180;
    }
    else if (x == 'ang')
        S.ang = S.ang ? 0 : 1;
    else if (x == 'hide')
        S.hide = S.hide ? 0 : 1;
    else if (x == 'fill') {
        const F = ['#e8f5ee', '#fff3b0', '#cfe3ff', '#ffd6e5', '#e3d4f7', null], i = F.indexOf(it.f || null);
        it.f = F[(i + 1) % F.length];
    }
    else if (x[0] == 'o')
        it.a2 += +x.slice(1);
    else if (x == 'tw') {
        const c = JSON.parse(JSON.stringify(it));
        c.id = geometryNewId();
        if (c.t == 'p')
            c.pts.forEach(q => { q.x += 26; q.y += 26; });
        else if (c.t == 'a' || c.t == 'c' || c.t == 'g' || c.t == 'n' || c.t == 'h' || c.t == 'r') {
            c.x += 26;
            c.y += 26;
        }
        else {
            c.x1 += 26;
            c.x2 += 26;
            c.y1 += 26;
            c.y2 += 26;
        }
        S.items.push(c);
        S.sel = S.items.length - 1;
    }
    else if (x[0] == 'g') {
        const k = x[1] == 'M' ? 1.15 : .87;
        if (it.t == 'g' || it.t == 'n' || it.t == 'h' || it.t == 'r')
            it.s = Math.max(.5, Math.min(3, it.s * k));
        else if (it.t == 'c')
            it.r = Math.max(40, Math.min(250, it.r * k));
        else if (it.t == 'f')
            it.s = Math.max(.3, Math.min(4, it.s * k));
        else if (it.t == 'a')
            it.l = Math.max(50, it.l * k);
        else
            xf(it, (a, b) => [a * k, b * k]);
    }
    else if (x[0] == 'r') {
        const d = +x.slice(1);
        if (it.t == 'g' || it.t == 'n')
            it.r += d;
        else if (it.t == 'a') {
            it.a1 += d;
            it.a2 += d;
        }
        else
            xf(it, (a, b) => { const c = Math.cos(-d * rad), s = Math.sin(-d * rad); return [a * c - b * s, a * s + b * c]; });
    }
    else if (x[0] == 'f') {
        it.s = Math.max(18, Math.min(120, it.s + (x[1] == 'M' ? 8 : -8)));
    }
    else if (x == 'del') {
        S.items.splice(S.sel, 1);
        S.sel = -1;
    }
    ui();
}
function hit(p) {
    const I = S.items, s = I[S.sel];
    if (S.pr.on) {
        if (D(tp(0, 18), p) < 24)
            return { k: 'pm' };
        if (D(tp(0, -(S.pr.R + 34)), p) < 26)
            return { k: 'pr' };
    }
    if (s && s.t == 'c') {
        if (D({ x: s.x + s.r, y: s.y }, p) < 18)
            return { k: 'cr', i: S.sel };
        const F = { ra: 'ra', di: 'di', c1: 'cu', c2: 'cu', s1: 'se', s2: 'se', tg: 'ta', k1: 'sc', k2: 'sc' };
        for (const j in F)
            if (s.on[F[j]] || (F[j] == 'cu' && (s.on.ar || s.on.sg || s.on.fl))) {
                const a = (s.g[j] ?? (j == 'k1' ? 20 : 100)) * rad, P = { x: s.x + s.r * Math.cos(a), y: s.y - s.r * Math.sin(a) };
                if (D(P, p) < 18)
                    return { k: 'ce', i: S.sel, j };
                if (j == 'di' && D({ x: 2 * s.x - P.x, y: 2 * s.y - P.y }, p) < 18)
                    return { k: 'ce', i: S.sel, j, inv: 1 };
            }
    }
    if (s) {
        if (s.t == 'r' && s.k == 2 && (s.on || []).includes(2)) {
            const a = (s.ra == null ? 45 : s.ra) * rad;
            if (D({ x: s.x + 50 * Math.cos(a) * s.s, y: s.y - 50 * Math.sin(a) * s.s }, p) < 22)
                return { k: 'rr', i: S.sel };
        }
        if (s.t == 's' && D(sh_h(s), p) < 20)
            return { k: 'ss', i: S.sel };
        if (s.t == 'f') {
            const c = GAL[s.i];
            if (D({ x: s.x + 200 * s.s, y: s.y + (c[4] ? 196.7 : 90) * s.s }, p) < 22)
                return { k: 'fs', i: S.sel };
        }
        if (s.t == 'p') {
            const hh = hp(s);
            if (D(hh.r, p) < 20)
                return { k: 'rot', i: S.sel };
            if (D(hh.s, p) < 20)
                return { k: 'scl', i: S.sel };
        }
        if (s.t == 'p') {
            const i = s.pts.findIndex(q => D(q, p) < 18);
            if (i >= 0)
                return { k: 'v', i: S.sel, j: i };
        }
        if (s.t == 'a') {
            for (const j of [1, 2])
                if (D(A(s, j), p) < 20)
                    return { k: 'e', i: S.sel, j };
        }
        if (s.t == 'l') {
            if (D({ x: s.x1, y: s.y1 }, p) < 18)
                return { k: 'p1', i: S.sel };
            if (D({ x: s.x2, y: s.y2 }, p) < 18)
                return { k: 'p2', i: S.sel };
        }
    }
    for (let i = I.length - 1; i >= 0; i--) {
        const it = I[i];
        if(!geometryValid(it))continue;
        let h = 0;
        if (it.t == 'p') {
            h = ptin(it.pts, p);
            if (h) {
                const P = it.pts;
                let q = -1;
                P.forEach((a, k) => {
                    if (sd(p, a, P[(k + 1) % P.length]) < 8)
                        q = k;
                });
                return { k: 'b', i, sd: q };
            }
        }
        else if (it.t == 'a') {
            h = D({ x: it.x, y: it.y }, p) < 18 || [1, 2].some(j => sd(p, it, A(it, j)) < 12);
        }
        else if (it.t == 'h') {
            const b = HB[it.id];
            h = b ? p.x > b[0] && p.x < b[2] && p.y > b[1] && p.y < b[3] : D(it, p) < 130 * it.s;
        }
        else if (it.t == 'y') {
            const b = PY.bb(it);
            h = b ? p.x > b[0] && p.x < b[2] && p.y > b[1] && p.y < b[3] : D(it, p) < 130 * it.s;
        }
        else if (it.t == 'r')
            h = Math.abs(p.x - it.x) < (it.un > 0 ? 120 : 75) * it.s && Math.abs(p.y - it.y) < (it.un > 0 ? 120 : 90) * it.s;
        else if (it.t == 'n')
            h = nhit(it, p);
        else if (it.t == 'g') {
            const a = -it.r * rad, dx = p.x - it.x, dy = p.y - it.y, lx = (dx * Math.cos(a) - dy * Math.sin(a)) / it.s + 100, ly = (dx * Math.sin(a) + dy * Math.cos(a)) / it.s + 71;
            h = lx > 0 && lx < 200 && ly > 0 && ly < 142;
        }
        else if (it.t == 'c')
            h = D({ x: it.x, y: it.y }, p) < it.r + 8;
        else if (it.t == 'f')
            h = p.x > it.x && p.x < it.x + 200 * it.s && p.y > it.y && p.y < it.y + (GAL[it.i][4] ? 198 : 90) * it.s;
        else if (it.t == 's')
            h = shin(it, p);
        else if (it.t == 'l')
            h = sd(p, { x: it.x1, y: it.y1 }, { x: it.x2, y: it.y2 }) < 10;
        else if (it.t == 'd')
            h = it.d.some((q, k) => k && sd(p, it.d[k - 1], q) < 10);
        else
            h = Math.abs(p.x - it.x) < it.s * .3 * it.x_.length + 8 && p.y > it.y - it.s && p.y < it.y + it.s * .3;
        if (h)
            return { k: 'b', i };
    }
    return null;
}
function sd(p, a, b) { const x = b.x - a.x, y = b.y - a.y, l = x * x + y * y, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * x + (p.y - a.y) * y) / l)) : 0; return Math.hypot(p.x - a.x - t * x, p.y - a.y - t * y); }
function ptin(P, p) {
    let c = 0;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++)
        if ((P[i].y > p.y) != (P[j].y > p.y) && p.x < (P[j].x - P[i].x) * (p.y - P[i].y) / (P[j].y - P[i].y) + P[i].x)
            c = !c;
    return c || P.some((q, i) => sd(p, q, P[(i + 1) % P.length]) < 10);
}
function mv(it, dx, dy) {
    if (it.t == 'p')
        it.pts.forEach(q => { q.x += dx; q.y += dy; });
    else if (it.t == 'a' || it.t == 't' || it.t == 'f' || it.t == 'c' || it.t == 's' || it.t == 'g' || it.t == 'n' || it.t == 'h' || it.t == 'y' || it.t == 'r') {
        it.x += dx;
        it.y += dy;
    }
    else if (it.t == 'l') {
        it.x1 += dx;
        it.x2 += dx;
        it.y1 += dy;
        it.y2 += dy;
    }
    else
        it.d.forEach(q => { q.x += dx; q.y += dy; });
}
const GAL = [['Ángulos del triángulo', 'a + b + c = 180°', 'Los 3 ángulos suman media vuelta', '#2563eb'], ['Pitágoras', 'a² + b² = c²', 'c es la hipotenusa', '#f97316'], ['Área del triángulo', 'A = (b × h) ÷ 2', 'Mitad de un rectángulo', '#7c3aed'], ['Ángulo exterior (triáng.)', 'ext = α + β', 'Suma de los 2 interiores lejanos', '#db2777'], ['Ángulos del cuadrilátero', 'a + b + c + d = 360°', 'Dos triángulos juntos', '#16a34a'], ['Cuadrado', 'A = l × l · P = 4l', 'Área y perímetro', '#0d9488'], ['Rectángulo', 'A = b × h · P = 2(b+h)', 'Largo por ancho', '#2563eb'], ['Rombo', 'A = (D × d) ÷ 2', 'Diagonales perpendiculares', '#f97316'], ['Romboide', 'A = b × h', 'Altura ⊥ a la base', '#7c3aed'], ['Trapecio', 'A = ((B + b) ÷ 2) × h', 'Semisuma de las bases', '#db2777'], ['Ángulo exterior', 'ext = 180° − int', 'Exterior + interior = llano', '#16a34a'], ['Tipos de ángulo', '<90° · 90° · >90° · 180°', 'Agudo, recto, obtuso, llano', '#0d9488'], ['Longitud de la circunferencia', 'L = 2πr', 'Con diámetro: L = d · π', '#f97316'], ['Área del círculo', 'A = πr²', 'r² = r × r', '#7c3aed'], ['Radio y diámetro', 'd = 2r · r = d ÷ 2', 'El diámetro pasa por el centro', '#2563eb'], ['Tangente ⊥ radio', 'OT ⊥ L', 'Forman 90° en T', '#0d9488'], ['Ángulo inscrito', 'x = arco ÷ 2', 'El central mide el arco', '#db2777'], ['Ángulo central', 'x = arco', 'Mide lo mismo que su arco', '#16a34a']];
function tp(x, y) { const q = S.pr, c = Math.cos(q.r * rad), n = Math.sin(q.r * rad); return { x: q.x + x * c + y * n, y: q.y - x * n + y * c }; }
function cenP(P) { return { x: P.reduce((a, q) => a + q.x, 0) / P.length, y: P.reduce((a, q) => a + q.y, 0) / P.length }; }
function hp(it) { const c = cenP(it.pts), ys = it.pts.map(q => q.y); return { r: { x: c.x, y: Math.max(16, Math.min(...ys) - 55) }, s: { x: c.x, y: Math.min(544, Math.max(...ys) + 55) } }; }
function ix(a, b, c, d) {
    const k = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (!k)
        return null;
    const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / k;
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}
function ex(it, s) {
    const P = it.pts, n = P.length, c = cenP(P);
    let o = '';
    if (n == 4 && it.dg) {
        [[0, 2, '#e67e22'], [1, 3, '#0ea5e9']].forEach(([a, b, k], j) => {
            if (it.dg >> j & 1)
                o += `<line x1="${P[a].x}" y1="${P[a].y}" x2="${P[b].x}" y2="${P[b].y}" stroke="${k}" stroke-width="3.5" stroke-dasharray="8 5"/>`;
        });
        if (it.dg == 3) {
            const m = ix(P[0], P[2], P[1], P[3]);
            if (m)
                o += `<circle cx="${m.x}" cy="${m.y}" r="6" fill="#e03e3e"/><text x="${m.x + 10}" y="${m.y - 8}" font-size="18" font-weight="700" fill="#e03e3e">M</text>`;
        }
    }
    const u = i => { const a = P[i], b = P[(i + 1) % n], l = D(a, b) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; }, an = angs(it);
    if (it.par && n == 4)
        [[0, 2, 1], [1, 3, 2]].forEach(([i, j, m]) => {
            const a = u(i), b = u(j);
            if (Math.abs(a.x * b.y - a.y * b.x) < .03)
                [i, j].forEach(k => {
                    const A1 = P[k], B1 = P[(k + 1) % 4], mx = (A1.x + B1.x) / 2, my = (A1.y + B1.y) / 2, v = k == i ? a : (a.x * b.x + a.y * b.y < 0 ? { x: -b.x, y: -b.y } : b);
                    for (let q = 0; q < m; q++) {
                        const t = q * 8;
                        o += `<path d="M${mx + v.x * (t - 8) - v.y * 7} ${my + v.y * (t - 8) + v.x * 7}L${mx + v.x * t} ${my + v.y * t}L${mx + v.x * (t - 8) + v.y * 7} ${my + v.y * (t - 8) - v.x * 7}" fill="none" stroke="#7c3aed" stroke-width="3"/>`;
                    }
                });
        });
    if (it.ext)
        P.forEach((q, k) => { const d = u((k + n - 1) % n), e = u(k), mx = d.x + e.x, my = d.y + e.y, l = Math.hypot(mx, my) || 1; o += `<line x1="${q.x}" y1="${q.y}" x2="${q.x + d.x * 70}" y2="${q.y + d.y * 70}" stroke="#e11d48" stroke-width="2.5" stroke-dasharray="4 4"/><text x="${q.x + mx / l * 46}" y="${q.y + my / l * 46 + 6}" text-anchor="middle" font-size="17" font-weight="700" fill="#e11d48">${S.ang ? Math.round(180 - an[k]) + '°' : 'xyvz'[k]}</text>`; });
    if (it.dv)
        P.forEach((q, k) => {
            const pv = P[(k + n - 1) % n], nx = P[(k + 1) % n], dn = Math.atan2(nx.y - q.y, nx.x - q.x), dp = Math.atan2(pv.y - q.y, pv.x - q.x), th = an[k] * rad, cr = Math.sign(Math.sin(dp - dn)) * (an[k] > 180 ? -1 : 1);
            for (let j = 1; j < it.dv; j++) {
                const a = dn + cr * th * j / it.dv;
                o += `<line x1="${q.x}" y1="${q.y}" x2="${q.x + Math.cos(a) * 110}" y2="${q.y + Math.sin(a) * 110}" stroke="#7c3aed" stroke-width="3" stroke-dasharray="9 5"/>`;
            }
        });
    P.forEach((q, i) => {
        const b = P[(i + 1) % n], v = u(i), mx = (q.x + b.x) / 2, my = (q.y + b.y) / 2;
        let nx = -v.y, ny = v.x;
        if ((mx - c.x) * nx + (my - c.y) * ny < 0) {
            nx = -nx;
            ny = -ny;
        }
        if (s && S.sd == i)
            o += `<line x1="${q.x}" y1="${q.y}" x2="${b.x}" y2="${b.y}" stroke="#2563eb" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"/>`;
        const tk = (it.tk || [])[i] || 0;
        for (let t = 0; t < tk; t++) {
            const f = (t - (tk - 1) / 2) * 7;
            o += `<line x1="${mx + v.x * f - nx * 8}" y1="${my + v.y * f - ny * 8}" x2="${mx + v.x * f + nx * 8}" y2="${my + v.y * f + ny * 8}" stroke="#e03e3e" stroke-width="3"/>`;
        }
        const tx = (it.sl && it.sl[i]) || 'ABCD'[i] + 'ABCD'[(i + 1) % n], w = tx.length * 10 + 14, d = 14 + Math.abs(nx) * w / 2 + Math.abs(ny) * 12, bx = mx + nx * d, by = my + ny * d;
        o += `<rect x="${bx - w / 2}" y="${by - 12}" width="${w}" height="24" rx="6" style="fill:var(--cd)" stroke="${s && S.sd == i ? '#2563eb' : it.c}" stroke-width="2.5"/><text x="${bx}" y="${by + 5}" text-anchor="middle" font-size="14" font-weight="700" style="fill:var(--tx)">${tx.replace(/</g, '&lt;')}</text>`;
    });
    if (s) {
        const h = hp(it);
        o += `<circle cx="${h.r.x}" cy="${h.r.y}" r="16" fill="#8e44ad"/><text x="${h.r.x}" y="${h.r.y + 7}" text-anchor="middle" font-size="20" fill="#fff">⟳</text><circle cx="${h.s.x}" cy="${h.s.y}" r="16" fill="#2e8b57"/><text x="${h.s.x}" y="${h.s.y + 7}" text-anchor="middle" font-size="20" fill="#fff">⤢</text>`;
    }
    return o;
}
function bs(it) {
    if (!it.bis)
        return '';
    const m = meas(it);
    if (m < .5)
        return '';
    const dd = ((it.a2 - it.a1) + 540) % 360 - 180, a = (it.a1 + dd / 2) * rad, l = it.l + 10, x = it.x + l * Math.cos(a), y = it.y - l * Math.sin(a);
    return `<line x1="${it.x}" y1="${it.y}" x2="${x}" y2="${y}" stroke="#7c3aed" stroke-width="3" stroke-dasharray="9 5"/><circle cx="${x}" cy="${y}" r="6" fill="#e03e3e"/><text x="${x + 10 * Math.cos(a) + 6}" y="${y - 16 * Math.sin(a) - 4}" font-size="20" font-weight="700" fill="#e03e3e">M</text>` + (S.hide ? '' : `<text x="${it.x + 96 * Math.cos(a)}" y="${it.y - 96 * Math.sin(a) + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#7c3aed">${(m / 2).toFixed(1).replace('.', ',')}°</text>`);
}
function prot() {
    const q = S.pr;
    if (!q.on)
        return '';
    const R = q.R;
    let o = `<g transform="translate(${q.x} ${q.y}) rotate(${-q.r})"><rect x="${-R - 14}" y="0" width="${2 * R + 28}" height="36" rx="5" fill="#0ea5e9" fill-opacity=".28" stroke="#0284c7" stroke-width="3"/><path d="M${-R} 0A${R} ${R} 0 0 1 ${R} 0Z" fill="#0ea5e9" fill-opacity=".12" stroke="#0284c7" stroke-width="3.5"/><path d="M${-R / 2} 0A${R / 2} ${R / 2} 0 0 1 ${R / 2} 0" fill="none" stroke="#0284c7" stroke-width="2"/>`;
    for (let d = 0; d <= 180; d++) {
        const l = d % 10 == 0 ? 22 : d % 5 == 0 ? 15 : 9, c = Math.cos(d * rad), n = Math.sin(d * rad);
        o += `<line x1="${R * c}" y1="${-R * n}" x2="${(R - l) * c}" y2="${-(R - l) * n}" stroke="#0369a1" stroke-width="${d % 10 == 0 ? 3 : d % 5 == 0 ? 2 : 1.2}"/>`;
        if (d % 10 == 0)
            o += `<text x="${(R - 42) * c}" y="${-(R - 42) * n + 6}" text-anchor="middle" font-size="${R / 14}" font-weight="700" fill="#0284c7">${d}</text><text x="${(R - 68) * c}" y="${-(R - 68) * n + 5}" text-anchor="middle" font-size="${R / 18}" font-weight="700" fill="#ea580c">${180 - d}</text>`;
    }
    o += `<line x1="-14" y1="0" x2="14" y2="0" stroke="#e03e3e" stroke-width="3"/><line x1="0" y1="-14" x2="0" y2="14" stroke="#e03e3e" stroke-width="3"/><line x1="0" y1="${-R}" x2="0" y2="${-(R + 34)}" stroke="#8e44ad" stroke-width="3"/><circle cx="0" cy="18" r="16" fill="#2563eb"/><text x="0" y="25" text-anchor="middle" font-size="20" fill="#fff">✥</text><circle cx="0" cy="${-(R + 34)}" r="18" fill="#8e44ad"/><text x="0" y="${-(R + 27)}" text-anchor="middle" font-size="22" fill="#fff">⟳</text>`;
    const it = S.items[S.sel];
    if (it && it.t == 'a' && D({ x: it.x, y: it.y }, q) < 14)
        [it.a1, it.a2].forEach(a => {
            const rel = (((a - q.r) % 360) + 360) % 360;
            if (rel <= 180) {
                const c = Math.cos(rel * rad), n = Math.sin(rel * rad);
                o += `<line x1="0" y1="0" x2="${R * c}" y2="${-R * n}" stroke="#e03e3e" stroke-width="1.8" stroke-dasharray="6 4"/><circle cx="${R * c}" cy="${-R * n}" r="6" fill="#e03e3e"/>` + (S.hide ? '' : `<text x="${(R + 26) * c}" y="${-(R + 26) * n + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="#e03e3e">${Math.round(rel)}</text>`);
            }
        });
    return o + '</g>';
}
function fc(it, s) { const c = GAL[it.i], f = Math.min(18, 190 / (c[1].length * .58)); return `<g transform="translate(${it.x} ${it.y}) scale(${it.s})"><rect width="200" height="90" rx="10" fill="#1a2740" stroke="${s ? '#2563eb' : '#3b4a68'}" stroke-width="${s ? 4 : 2}"/><path d="M0 22V10Q0 0 10 0H190Q200 0 200 10V22Z" fill="${c[3]}"/><text x="100" y="15" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${c[0]}</text><text x="100" y="54" text-anchor="middle" font-size="${f}" font-weight="700" fill="#fff">${c[1]}</text><text x="100" y="78" text-anchor="middle" font-size="10" fill="#9fb0cc">${c[2]}</text></g>`; }
function gal() { const g = $('gal'), st = g.scrollTop; g.style.display = 'block'; putHTML(g, `<div style="background:#1f5fbf;color:#fff;padding:8px;display:flex;justify-content:space-between;position:sticky;top:0"><b>📚 Fórmulas · elige las que quieras</b><button data-gallery-close="true">✕ Cerrar</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;padding:10px">` + GAL.map((c, i) => `<div data-gallery-select="${i}" style="background:#1a2740;color:#fff;border:3px solid ${S.gs.includes(i) ? '#2563eb' : 'transparent'};border-radius:10px;cursor:pointer;overflow:hidden"><div style="background:${c[3]};padding:5px 8px;font-weight:700">${S.gs.includes(i) ? '✓ ' : ''}${c[0]}</div><div style="padding:10px;font-size:18px;font-weight:700;text-align:center">${c[1]}</div><div style="padding:0 10px 8px;color:#9fb0cc;font-size:12px">${c[2]}</div></div>`).join('') + `</div><div style="position:sticky;bottom:0;background:var(--cd);padding:8px;display:flex;gap:10px;align-items:center"><span>${S.gs.length} seleccionada(s)</span><button data-gallery-place="true" ${S.gs.length ? '' : 'disabled'} style="background:#16a34a;color:#fff">📌 Poner en la pizarra</button></div>`); g.scrollTop = st; }
function gt(i) { const k = S.gs.indexOf(i); k < 0 ? S.gs.push(i) : S.gs.splice(k, 1); gal(); }
function gp() { snapH(); S.gs.sort((a, b) => a - b).forEach((i, n) => S.items.push({ t: 'f', i, x: 20 + (n % 4) * 240, y: 20 + Math.floor(n / 4) * 110, s: 1.1, id: geometryNewId() })); S.gs = []; S.sel = -1; $('gal').style.display = 'none'; ui(); }
$('bGa').onclick = () => { S.sel = -1; ui(); gal(); };
function mkC(v) { const o = S.items.length % 5 * 20; S.hide = 1; add({ t: 'c', x: 400 + o, y: 280 + o, r: (v == 'r' ? 2 + Math.floor(Math.random() * 8) : +v) * 20, on: { ra: 1, ci: 1, cf: 1, ce: 1 }, pc: {}, af: 'cf', g: { ra: 35, di: -20, c1: 60, c2: 150, s1: 200, s2: 300, tg: 110, k1: 20, k2: 100 } }); }
const ELR = [[['Eje de giro', '#374151'], ['Base superior', '#8e44ad'], ['Base inferior', '#8e44ad'], ['Generatriz', '#f97316'], ['Altura', '#2e8b57'], ['Radio', '#2563eb'], ['Superficie lateral', '#f59e0b'], ['Rectángulo que gira', '#0f766e']], [['Eje de giro', '#374151'], ['Vértice', '#ec4899'], ['Base', '#8e44ad'], ['Radio', '#2563eb'], ['Altura', '#2e8b57'], ['Generatriz', '#f97316'], ['Superficie lateral', '#f59e0b'], ['Triángulo que gira', '#1976d2']], [['Eje de giro', '#374151'], ['Centro', '#dc2626'], ['Radio', '#2563eb'], ['Diámetro', '#7c3aed'], ['Ecuador', '#f97316'], ['Superficie', '#8e44ad'], ['Semicírculo que gira', '#17a2b8']]];
const CN = { ci: 'Círculo', cf: 'Circunferencia', ce: 'Centro', ra: 'Radio', di: 'Diámetro', cu: 'Cuerda', ar: 'Arco', sg: 'Segmento', sc: 'Sector', fl: 'Flecha', se: 'Secante', ta: 'Tangente' };
const DC = { ci: '#fcd34d', cf: '#1e3a8a', ce: '#dc2626', ra: '#f97316', di: '#7c3aed', cu: '#16a34a', ar: '#db2777', sg: '#86efac', sc: '#60a5fa', fl: '#ef4444', se: '#2563eb', ta: '#0d9488' };
function segsP(it) {
    const sg = [];
    S.items.forEach(m => {
        if (m === it)
            return;
        if (m.t == 'p') {
            m.pts.forEach((q, k) => { const b = m.pts[(k + 1) % m.pts.length]; sg.push([q.x, q.y, b.x, b.y]); });
            if (m.pts.length == 4 && m.dg) {
                const Q = m.pts;
                if (m.dg & 1)
                    sg.push([Q[0].x, Q[0].y, Q[2].x, Q[2].y]);
                if (m.dg & 2)
                    sg.push([Q[1].x, Q[1].y, Q[3].x, Q[3].y]);
            }
        }
        else if (m.t == 'l')
            sg.push([m.x1, m.y1, m.x2, m.y2]);
        else if (m.t == 'c') {
            segsOf(m, 1).forEach(o => sg.push([m.x + o.a.x, m.y + o.a.y, m.x + o.b.x, m.y + o.b.y]));
            for (let k = 0; k < 48; k++) {
                const a = k * 7.5 * rad, b = (k + 1) * 7.5 * rad;
                sg.push([m.x + m.r * Math.cos(a), m.y - m.r * Math.sin(a), m.x + m.r * Math.cos(b), m.y - m.r * Math.sin(b)]);
            }
        }
    });
    const P = it.pts || [];
    if (P.length == 4 && it.dg) {
        if (it.dg & 1)
            sg.push([P[0].x, P[0].y, P[2].x, P[2].y]);
        if (it.dg & 2)
            sg.push([P[1].x, P[1].y, P[3].x, P[3].y]);
    }
    return sg;
}
function frag(a, b, sg) {
    const cr = (u, v) => u.x * v.y - u.y * v.x, sb = (u, v) => ({ x: u.x - v.x, y: u.y - v.y }), d = sb(b, a), ts = [0, 1], o = [];
    sg.forEach(z => {
        const A = { x: z[0], y: z[1] }, B = { x: z[2], y: z[3] }, e2 = sb(B, A), dn = cr(d, e2);
        if (Math.abs(dn) < 1e-9)
            return;
        const w = sb(A, a), t = cr(w, e2) / dn, u = cr(w, d) / dn;
        if (t > .002 && t < .998 && u >= -.002 && u <= 1.002)
            ts.push(t);
    });
    ts.sort((x, y) => x - y);
    for (let k = 0; k < ts.length - 1; k++) {
        if (ts[k + 1] - ts[k] < .002)
            continue;
        o.push({ a: { x: a.x + ts[k] * d.x, y: a.y + ts[k] * d.y }, b: { x: a.x + ts[k + 1] * d.x, y: a.y + ts[k + 1] * d.y } });
    }
    return o;
}
function ppcs(it) {
    const P = it.pts, n = P.length, sg = segsP(it);
    let ls = [];
    P.forEach((a, i) => { ls = ls.concat(frag(a, P[(i + 1) % n], sg)); });
    if (n == 4 && it.dg) {
        if (it.dg & 1)
            ls = ls.concat(frag(P[0], P[2], sg));
        if (it.dg & 2)
            ls = ls.concat(frag(P[1], P[3], sg));
    }
    return ls;
}
function ppcsL(it) { return frag({ x: it.x1, y: it.y1 }, { x: it.x2, y: it.y2 }, segsP(it)); }
function ppL(it) {
    if (!(it.pl && it.pl.length))
        return '';
    const c = { x: (it.x1 + it.x2) / 2, y: (it.y1 + it.y2) / 2 }, L = ppcsL(it), col = [];
    it.pl.forEach(e => {
        const q = { x: c.x + e.x, y: c.y + e.y };
        let b = -1, bd = 14;
        L.forEach((l, i) => {
            const d = sd(q, l.a, l.b);
            if (d < bd) {
                bd = d;
                b = i;
            }
        });
        if (b >= 0)
            col[b] = e.c;
    });
    return L.map((l, i) => col[i] ? `<line x1="${l.a.x}" y1="${l.a.y}" x2="${l.b.x}" y2="${l.b.y}" stroke="${col[i]}" stroke-width="8" stroke-linecap="butt"/>` : '').join('');
}
function ppaint(it) {
    if (!(it.pl && it.pl.length))
        return '';
    const c = cenP(it.pts), L = ppcs(it), col = [];
    it.pl.forEach(e => {
        const q = { x: c.x + e.x, y: c.y + e.y };
        let b = -1, bd = 14;
        L.forEach((l, i) => {
            const d = sd(q, l.a, l.b);
            if (d < bd) {
                bd = d;
                b = i;
            }
        });
        if (b >= 0)
            col[b] = e.c;
    });
    return L.map((l, i) => col[i] ? `<line x1="${l.a.x}" y1="${l.a.y}" x2="${l.b.x}" y2="${l.b.y}" stroke="${col[i]}" stroke-width="9" stroke-linecap="butt"/>` : '').join('');
}
function rgnP(it) {
    if (!it.pn || !it.pn.length)
        return null;
    const P = it.pts, c = cenP(P);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    P.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    x0 = Math.floor(x0) - 4;
    y0 = Math.floor(y0) - 4;
    const W = Math.ceil(x1) + 4 - x0, Hh = Math.ceil(y1) + 4 - y0;
    if (W < 8 || Hh < 8 || W * Hh > 1.5e6)
        return null;
    const sg = segsP(it), key = JSON.stringify([P.map(q => [Math.round(q.x), Math.round(q.y)]), sg.map(z => z.map(Math.round)), it.pn]), ch = RC[it.id];
    if (ch && ch.key == key)
        return ch;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = Hh;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.lineWidth = 3;
    cx.lineCap = 'square';
    cx.strokeStyle = '#000';
    const pth = () => { cx.beginPath(); P.forEach((q, k) => k ? cx.lineTo(q.x - x0, q.y - y0) : cx.moveTo(q.x - x0, q.y - y0)); cx.closePath(); };
    pth();
    cx.fillStyle = '#000';
    cx.fill();
    const md = cx.getImageData(0, 0, W, Hh).data, ins = new Uint8Array(W * Hh);
    for (let i = 0; i < W * Hh; i++)
        ins[i] = md[i * 4 + 3] > 128 ? 1 : 0;
    cx.clearRect(0, 0, W, Hh);
    pth();
    cx.stroke();
    sg.forEach(z => { cx.beginPath(); cx.moveTo(z[0] - x0, z[1] - y0); cx.lineTo(z[2] - x0, z[3] - y0); cx.stroke(); });
    const d = cx.getImageData(0, 0, W, Hh).data, bar = new Uint8Array(W * Hh), lab = new Int16Array(W * Hh).fill(-1);
    for (let i = 0; i < W * Hh; i++)
        bar[i] = (d[i * 4 + 3] > 90 || !ins[i]) ? 1 : 0;
    it.pn.forEach((z, k) => {
        const x = Math.round(c.x + z.a - x0), y = Math.round(c.y + z.b - y0);
        if (x < 0 || y < 0 || x >= W || y >= Hh || bar[y * W + x])
            return;
        const st = [y * W + x];
        lab[y * W + x] = k;
        while (st.length) {
            const j = st.pop(), jx = j % W;
            let q;
            if (jx > 0) {
                q = j - 1;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
            if (jx < W - 1) {
                q = j + 1;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
            if (j >= W) {
                q = j - W;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
            if (j < W * (Hh - 1)) {
                q = j + W;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
        }
    });
    for (let t = 0; t < 2; t++) {
        const L2 = lab.slice();
        for (let i = 0; i < W * Hh; i++) {
            if (!bar[i] || L2[i] >= 0 || !ins[i])
                continue;
            const x = i % W, y = (i / W) | 0;
            let v = -1;
            if (x > 0 && L2[i - 1] >= 0)
                v = L2[i - 1];
            else if (x < W - 1 && L2[i + 1] >= 0)
                v = L2[i + 1];
            else if (y > 0 && L2[i - W] >= 0)
                v = L2[i - W];
            else if (y < Hh - 1 && L2[i + W] >= 0)
                v = L2[i + W];
            if (v >= 0)
                lab[i] = v;
        }
    }
    const rgb = it.pn.map(z => {
        if (!z.c)
            return null;
        const h = z.c.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }), out = cx.createImageData(W, Hh), od = out.data;
    for (let i = 0; i < W * Hh; i++) {
        const l = lab[i];
        if (l < 0 || !rgb[l])
            continue;
        od[i * 4] = rgb[l][0];
        od[i * 4 + 1] = rgb[l][1];
        od[i * 4 + 2] = rgb[l][2];
        od[i * 4 + 3] = 210;
    }
    cx.putImageData(out, 0, 0);
    return RC[it.id] = { key, url: cv.toDataURL(), x0, y0, W, H: Hh };
}
function rgnPS(it) { const r = rgnP(it); return r ? `<image href="${r.url}" x="${r.x0}" y="${r.y0}" width="${r.W}" height="${r.H}"/>` : ''; }
function bkF(m, p) {
    const c = cenP(m.pts), col = S.bke ? null : S.col, vi = m.pts.findIndex(q => D(q, p) < 14);
    if (vi >= 0) {
        snapH();
        m.pv = m.pv || [];
        m.pv.push({ k: vi, c: col });
        if (m.pv.length > 40)
            m.pv.shift();
        draw();
        return true;
    }
    let bd = 8;
    ppcs(m).forEach(l => { bd = Math.min(bd, sd(p, l.a, l.b)); });
    if (bd < 8) {
        snapH();
        m.pl = m.pl || [];
        m.pl.push({ x: p.x - c.x, y: p.y - c.y, c: col });
        if (m.pl.length > 80)
            m.pl.shift();
        draw();
        return true;
    }
    return false;
}
function bkR(m, p) {
    if (!ptin(m.pts, p))
        return false;
    const c = cenP(m.pts);
    snapH();
    m.pn = m.pn || [];
    m.pn.push({ a: p.x - c.x, b: p.y - c.y, c: S.bke ? null : S.col });
    if (m.pn.length > 80)
        m.pn.shift();
    draw();
    return true;
}
function bkL(m, p) {
    if (sd(p, { x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }) >= 8)
        return false;
    snapH();
    m.pl = m.pl || [];
    m.pl.push({ x: p.x - (m.x1 + m.x2) / 2, y: p.y - (m.y1 + m.y2) / 2, c: S.bke ? null : S.col });
    if (m.pl.length > 80)
        m.pl.shift();
    draw();
    return true;
}
function bkC(m, p) {
    const q = { x: p.x - m.x, y: p.y - m.y }, c = S.bke ? null : S.col, da = Math.abs(Math.hypot(q.x, q.y) - m.r), dl = Math.min(1e9, ...segsOf(m, 1).map(o => sd(q, o.a, o.b)));
    if (dl < 8 && dl <= da) {
        snapH();
        m.pl = m.pl || [];
        m.pl.push({ x: q.x, y: q.y, c });
        if (m.pl.length > 80)
            m.pl.shift();
        draw();
        return true;
    }
    if (da < 8) {
        snapH();
        m.pa = m.pa || [];
        m.pa.push({ a: (Math.atan2(-q.y, q.x) / rad + 360) % 360, c });
        if (m.pa.length > 80)
            m.pa.shift();
        draw();
        return true;
    }
    return false;
}
function bkCR(m, p) {
    const q = { x: p.x - m.x, y: p.y - m.y };
    if (Math.hypot(q.x, q.y) >= m.r)
        return false;
    snapH();
    m.pn = m.pn || [];
    m.pn.push({ a: q.x / m.r, b: q.y / m.r, c: S.bke ? null : S.col });
    if (m.pn.length > 80)
        m.pn.shift();
    draw();
    return true;
}
const RC = {};
function rgn(it) {
    if (!it.pn || !it.pn.length)
        return null;
    const r = it.r, R0 = Math.ceil(r) + 4, N = 2 * R0, e = it.on, g = it.g, Pq = q => ({ x: r * Math.cos(q * rad), y: -r * Math.sin(q * rad) }), o = { x: 0, y: 0 }, sg = [], add = (a, b) => sg.push([a.x, a.y, b.x, b.y]);
    if (e.di) {
        const p = Pq(g.di);
        add(p, { x: -p.x, y: -p.y });
    }
    if (e.cu)
        add(Pq(g.c1), Pq(g.c2));
    if (e.ra)
        add(o, Pq(g.ra));
    if (e.sc) {
        add(o, Pq(g.k1 ?? 20));
        add(o, Pq(g.k2 ?? 100));
    }
    if (e.se) {
        const p = Pq(g.s1), q = Pq(g.s2);
        add({ x: p.x + (p.x - q.x) * .4, y: p.y + (p.y - q.y) * .4 }, { x: q.x + (q.x - p.x) * .4, y: q.y + (q.y - p.y) * .4 });
    }
    S.items.forEach(m => {
        if (m.t == 'p')
            m.pts.forEach((q, k) => { const b = m.pts[(k + 1) % m.pts.length]; add({ x: q.x - it.x, y: q.y - it.y }, { x: b.x - it.x, y: b.y - it.y }); });
        else if (m.t == 'l')
            add({ x: m.x1 - it.x, y: m.y1 - it.y }, { x: m.x2 - it.x, y: m.y2 - it.y });
        if (m.t == 'p' && m.pts.length == 4 && m.dg) {
            const Q = m.pts, r2 = q => ({ x: q.x - it.x, y: q.y - it.y });
            if (m.dg & 1)
                add(r2(Q[0]), r2(Q[2]));
            if (m.dg & 2)
                add(r2(Q[1]), r2(Q[3]));
        }
    });
    const key = JSON.stringify([r, sg.map(s => s.map(Math.round)), it.pn]), ch = RC[it.id];
    if (ch && ch.key == key)
        return ch;
    const cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.lineWidth = 3;
    cx.lineCap = 'square';
    cx.strokeStyle = '#000';
    sg.forEach(s => { cx.beginPath(); cx.moveTo(s[0] + R0, s[1] + R0); cx.lineTo(s[2] + R0, s[3] + R0); cx.stroke(); });
    const d = cx.getImageData(0, 0, N, N).data, bar = new Uint8Array(N * N), lab = new Int16Array(N * N).fill(-1);
    for (let i = 0; i < N * N; i++) {
        const x = i % N - R0 + .5, y = ((i / N) | 0) - R0 + .5;
        bar[i] = (d[i * 4 + 3] > 90 || x * x + y * y > (r - 1) * (r - 1)) ? 1 : 0;
    }
    it.pn.forEach((s, k) => {
        const x = Math.round(s.a * r) + R0, y = Math.round(s.b * r) + R0;
        if (x < 0 || y < 0 || x >= N || y >= N || bar[y * N + x])
            return;
        const st = [y * N + x];
        lab[y * N + x] = k;
        while (st.length) {
            const j = st.pop(), jx = j % N;
            let q;
            if (jx > 0) {
                q = j - 1;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
            if (jx < N - 1) {
                q = j + 1;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
            if (j >= N) {
                q = j - N;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
            if (j < N * (N - 1)) {
                q = j + N;
                if (!bar[q] && lab[q] != k) {
                    lab[q] = k;
                    st.push(q);
                }
            }
        }
    });
    for (let t = 0; t < 2; t++) {
        const L2 = lab.slice();
        for (let i = 0; i < N * N; i++) {
            if (!bar[i] || L2[i] >= 0)
                continue;
            const x = i % N, y = (i / N) | 0, dx = x - R0 + .5, dy = y - R0 + .5;
            if (dx * dx + dy * dy > r * r)
                continue;
            let v = -1;
            if (x > 0 && L2[i - 1] >= 0)
                v = L2[i - 1];
            else if (x < N - 1 && L2[i + 1] >= 0)
                v = L2[i + 1];
            else if (y > 0 && L2[i - N] >= 0)
                v = L2[i - N];
            else if (y < N - 1 && L2[i + N] >= 0)
                v = L2[i + N];
            if (v >= 0)
                lab[i] = v;
        }
    }
    const rgb = it.pn.map(s => {
        if (!s.c)
            return null;
        const h = s.c.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }), out = cx.createImageData(N, N), od = out.data;
    for (let i = 0; i < N * N; i++) {
        const l = lab[i];
        if (l < 0 || !rgb[l])
            continue;
        od[i * 4] = rgb[l][0];
        od[i * 4 + 1] = rgb[l][1];
        od[i * 4 + 2] = rgb[l][2];
        od[i * 4 + 3] = 200;
    }
    cx.putImageData(out, 0, 0);
    return RC[it.id] = { key, url: cv.toDataURL(), R0, N };
}
function segsOf(it, noItems) {
    const r = it.r, e = it.on, g = it.g, Pq = q => ({ x: r * Math.cos(q * rad), y: -r * Math.sin(q * rad) }), sg = [], add = (a, b, tg) => sg.push({ a, b, tg: tg ? 1 : 0 });
    if (e.di) {
        const p = Pq(g.di);
        add(p, { x: -p.x, y: -p.y });
    }
    if (e.cu || e.fl)
        add(Pq(g.c1), Pq(g.c2));
    if (e.ra)
        add({ x: 0, y: 0 }, Pq(g.ra));
    if (e.sc) {
        add({ x: 0, y: 0 }, Pq(g.k1 ?? 20));
        add({ x: 0, y: 0 }, Pq(g.k2 ?? 100));
    }
    if (e.se) {
        const p = Pq(g.s1), q = Pq(g.s2);
        add({ x: p.x + (p.x - q.x) * .4, y: p.y + (p.y - q.y) * .4 }, { x: q.x + (q.x - p.x) * .4, y: q.y + (q.y - p.y) * .4 });
    }
    if (e.ta) {
        const t = Pq(g.tg), n = { x: -t.y / r, y: t.x / r };
        add({ x: t.x - n.x * r * .9, y: t.y - n.y * r * .9 }, { x: t.x + n.x * r * .9, y: t.y + n.y * r * .9 }, 1);
    }
    if (!noItems)
        S.items.forEach(m => {
            if (m.t == 'p')
                m.pts.forEach((q, k) => { const b = m.pts[(k + 1) % m.pts.length]; add({ x: q.x - it.x, y: q.y - it.y }, { x: b.x - it.x, y: b.y - it.y }); });
            else if (m.t == 'l')
                add({ x: m.x1 - it.x, y: m.y1 - it.y }, { x: m.x2 - it.x, y: m.y2 - it.y });
            if (m.t == 'p' && m.pts.length == 4 && m.dg) {
                const Q = m.pts, r2 = q => ({ x: q.x - it.x, y: q.y - it.y });
                if (m.dg & 1)
                    add(r2(Q[0]), r2(Q[2]));
                if (m.dg & 2)
                    add(r2(Q[1]), r2(Q[3]));
            }
        });
    return sg;
}
function pcs(it) {
    const r = it.r, sg = segsOf(it), ang = P => (Math.atan2(-P.y, P.x) / rad + 360) % 360, cr = (a, b) => a.x * b.y - a.y * b.x, sb = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
    let br = [];
    const cit = (a, b) => {
        const d = sb(b, a), A = d.x * d.x + d.y * d.y, B = 2 * (a.x * d.x + a.y * d.y), C = a.x * a.x + a.y * a.y - r * r, D2 = B * B - 4 * A * C;
        if (A < 1e-9 || D2 <= 0)
            return [];
        const q = Math.sqrt(D2);
        return [(-B - q) / (2 * A), (-B + q) / (2 * A)];
    };
    sg.forEach(o => {
        if (o.tg)
            return;
        cit(o.a, o.b).forEach(t => {
            if (t > -.002 && t < 1.002)
                br.push(ang({ x: o.a.x + t * (o.b.x - o.a.x), y: o.a.y + t * (o.b.y - o.a.y) }));
        });
        [o.a, o.b].forEach(P => {
            if (Math.abs(Math.hypot(P.x, P.y) - r) < 3)
                br.push(ang(P));
        });
    });
    br.sort((a, b) => a - b);
    br = br.filter((a, i) => !i || a - br[i - 1] > .5);
    if (br.length > 1 && br[0] + 360 - br[br.length - 1] < .5)
        br.pop();
    const arcs = br.length < 2 ? [{ s: 0, sp: 360 }] : br.map((a, i) => { const n = br[(i + 1) % br.length]; return { s: a, sp: ((n - a) + 360) % 360 || 360 }; });
    const ls = [];
    sg.forEach((o, i) => {
        const d = sb(o.b, o.a), ts = [0, 1];
        sg.forEach((p, j) => {
            if (j == i)
                return;
            const e2 = sb(p.b, p.a), dn = cr(d, e2);
            if (Math.abs(dn) < 1e-9)
                return;
            const w = sb(p.a, o.a), t = cr(w, e2) / dn, u = cr(w, d) / dn;
            if (t > .002 && t < .998 && u >= -.002 && u <= 1.002)
                ts.push(t);
        });
        if (!o.tg)
            cit(o.a, o.b).forEach(t => {
                if (t > .002 && t < .998)
                    ts.push(t);
            });
        ts.sort((a, b) => a - b);
        for (let k = 0; k < ts.length - 1; k++) {
            if (ts[k + 1] - ts[k] < .002)
                continue;
            ls.push({ a: { x: o.a.x + ts[k] * d.x, y: o.a.y + ts[k] * d.y }, b: { x: o.a.x + ts[k + 1] * d.x, y: o.a.y + ts[k + 1] * d.y } });
        }
    });
    return { arcs, ls, sg };
}
function pnt(it) {
    if (!(it.pa && it.pa.length) && !(it.pl && it.pl.length))
        return '';
    const r = it.r, P = pcs(it), x = it.x, y = it.y, Pa = q => ({ x: x + r * Math.cos(q * rad), y: y - r * Math.sin(q * rad) });
    let h = '';
    const ac = [];
    (it.pa || []).forEach(e => {
        const i = P.arcs.findIndex(a => ((e.a - a.s + 360) % 360) < a.sp);
        if (i >= 0)
            ac[i] = e.c;
    });
    P.arcs.forEach((a, i) => {
        if (!ac[i])
            return;
        if (a.sp >= 359.9)
            h += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${ac[i]}" stroke-width="9"/>`;
        else {
            const p1 = Pa(a.s), p2 = Pa(a.s + a.sp);
            h += `<path d="M${p1.x} ${p1.y}A${r} ${r} 0 ${a.sp > 180 ? 1 : 0} 0 ${p2.x} ${p2.y}" fill="none" stroke="${ac[i]}" stroke-width="9" stroke-linecap="butt"/>`;
        }
    });
    const lc = [];
    (it.pl || []).forEach(e => {
        let b = -1, bd = 14;
        P.ls.forEach((l, i) => {
            const d = sd(e, l.a, l.b);
            if (d < bd) {
                bd = d;
                b = i;
            }
        });
        if (b >= 0)
            lc[b] = e.c;
    });
    P.ls.forEach((l, i) => {
        if (lc[i])
            h += `<line x1="${x + l.a.x}" y1="${y + l.a.y}" x2="${x + l.b.x}" y2="${y + l.b.y}" stroke="${lc[i]}" stroke-width="8" stroke-linecap="butt"/>`;
    });
    return h;
}
const SH = [['sq', '⬜ Cuadrado'], ['rc', '▭ Rectángulo'], ['sc', '◗ Medio círculo'], ['cd', '◎ Círculo doble']];
function mkS(k) { const o = S.items.length % 5 * 22, d = { sq: [160, 160], rc: [260, 150], sc: [260, 130], cd: [230, 230] }[k]; add({ t: 's', k, x: 420 + o, y: 230 + o, w: d[0], h: d[1], rot: 0, c: '#2563eb', f: '#93c5fd', i: '#fde68a', ir: .5, bw: 4 }); }
function shL(it, p) { const a = -it.rot * rad, dx = p.x - it.x, dy = p.y - it.y; return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }; }
function sh_h(it) { const a = it.rot * rad, lx = it.w / 2, ly = it.h / 2; return { x: it.x + lx * Math.cos(a) - ly * Math.sin(a), y: it.y + lx * Math.sin(a) + ly * Math.cos(a) }; }
function shin(it, p) {
    const q = shL(it, p), w = it.w / 2, h = it.h / 2;
    if (it.k == 'sq' || it.k == 'rc')
        return Math.abs(q.x) <= w && Math.abs(q.y) <= h;
    if (it.k == 'cd')
        return Math.hypot(q.x, q.y) <= w;
    return q.y <= h && (q.x / w) ** 2 + ((q.y - h) / it.h) ** 2 <= 1;
}
function sh(it, s) {
    const w = it.w, h = it.h, F = it.f ? `fill="${it.f}" fill-opacity=".6"` : 'fill="none"', St = `stroke="${it.c}" stroke-width="${it.bw}" stroke-linejoin="round"`;
    let b = '';
    if (it.k == 'sq' || it.k == 'rc')
        b = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" ${F} ${St}/>`;
    else if (it.k == 'sc')
        b = `<path d="M${-w / 2} ${h / 2}A${w / 2} ${h} 0 0 1 ${w / 2} ${h / 2}Z" ${F} ${St}/>`;
    else
        b = `<circle r="${w / 2}" ${F} ${St}/><circle r="${w / 2 * it.ir}" fill="${it.i}" fill-opacity=".8" ${St}/>`;
    if (s)
        b += `<rect x="${-w / 2 - 4}" y="${-h / 2 - 4}" width="${w + 8}" height="${h + 8}" fill="none" stroke="#2563eb" stroke-dasharray="5 4" stroke-width="2"/><circle cx="${w / 2}" cy="${h / 2}" r="11" fill="#fff" stroke="#2563eb" stroke-width="3"/>`;
    return `<g transform="translate(${it.x} ${it.y}) rotate(${it.rot})">${b}</g>`;
}
function zact(x, it) {
    if (x == 'zfill') {
        it.f = it.f ? null : (it.f0 || '#93c5fd');
    }
    else if (x == 'zbm')
        it.bw = Math.max(1, it.bw - 1);
    else if (x == 'zbM')
        it.bw = Math.min(14, it.bw + 1);
    else if (x == 'zim')
        it.ir = Math.max(.15, it.ir - .1);
    else if (x == 'ziM')
        it.ir = Math.min(.85, it.ir + .1);
    else if (x == 'zgm' || x == 'zgM') {
        const k = x == 'zgM' ? 1.15 : .87;
        it.w = Math.max(40, Math.min(700, it.w * k));
        it.h = Math.max(40, Math.min(700, it.h * k));
    }
    else if (x[1] == 'r') {
        it.rot = (it.rot + +x.slice(2) + 360) % 360;
    }
    else if (x == 'zcp') {
        const c = JSON.parse(JSON.stringify(it));
        c.id = geometryNewId();
        c.x += 30;
        c.y += 30;
        S.items.push(c);
        S.sel = S.items.length - 1;
    }
}
function cd(it, s) {
    const { x, y, r } = it, e = it.on, g = it.g, c = k => (it.pc && it.pc[k]) || DC[k], P = q => ({ x: x + r * Math.cos(q * rad), y: y - r * Math.sin(q * rad) }), a = k => P(g[k]), Ln = (p, q, col, w) => `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`, dot = (p, col) => s ? `<circle cx="${p.x}" cy="${p.y}" r="8" fill="#fff" stroke="${col}" stroke-width="3"/>` : '', mn = (u, v) => { const d = ((v - u) % 360 + 360) % 360; return d <= 180 ? { s: u, d } : { s: v, d: 360 - d }; }, AR = m => `A${r} ${r} 0 0 0 ${P(m.s + m.d).x} ${P(m.s + m.d).y}`, ST = m => `${P(m.s).x} ${P(m.s).y}`, ch = mn(g.c1, g.c2), k1 = g.k1 ?? 20, k2 = g.k2 ?? 100, sx = mn(k1, k2), cc = e.cu || e.ar || e.sg || e.fl;
    let h = (s ? `<circle cx="${x}" cy="${y}" r="${r + 6}" fill="none" stroke="#2563eb" stroke-dasharray="6 4" stroke-opacity=".6"/>` : '') + `<circle cx="${x}" cy="${y}" r="${r}" fill="${e.ci !== 0 ? c('ci') : 'none'}" fill-opacity=".35"/>`;
    {
        const rr = rgn(it);
        if (rr)
            h += `<image href="${rr.url}" x="${x - rr.R0}" y="${y - rr.R0}" width="${rr.N}" height="${rr.N}"/>`;
    }
    if (e.sg)
        h += `<path d="M${ST(ch)}${AR(ch)}Z" fill="${c('sg')}" fill-opacity=".6" stroke="${c('sg')}" stroke-width="1.5"/>`;
    if (e.sc) {
        h += `<path d="M${x} ${y}L${ST(sx)}${AR(sx)}Z" fill="${c('sc')}" fill-opacity=".6"/>` + Ln({ x, y }, P(sx.s), c('sc'), 2.5) + Ln({ x, y }, P(sx.s + sx.d), c('sc'), 2.5) + dot(P(k1), c('sc')) + dot(P(k2), c('sc'));
    }
    if (e.cf !== 0 && !(it.un > 0))
        h += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c('cf')}" stroke-width="4"/>`;
    if (e.cu)
        h += Ln(a('c1'), a('c2'), c('cu'), 3.5);
    if (cc) {
        const k = e.cu ? 'cu' : e.ar ? 'ar' : e.sg ? 'sg' : 'fl';
        h += dot(a('c1'), c(k)) + dot(a('c2'), c(k));
    }
    if (e.di) {
        const p = a('di'), q = { x: 2 * x - p.x, y: 2 * y - p.y };
        h += Ln(p, q, c('di'), 3.5) + dot(p, c('di')) + dot(q, c('di'));
    }
    if (e.ra) {
        const p = a('ra');
        h += Ln({ x, y }, p, c('ra'), 3.5) + dot(p, c('ra'));
    }
    if (e.fl) {
        const p = P(ch.s), q = P(ch.s + ch.d), m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, t = P(ch.s + ch.d / 2), l1 = Math.hypot(q.x - p.x, q.y - p.y) || 1, u = { x: (q.x - p.x) / l1, y: (q.y - p.y) / l1 }, l2 = Math.hypot(t.x - m.x, t.y - m.y) || 1, v = { x: (t.x - m.x) / l2, y: (t.y - m.y) / l2 };
        h += Ln(m, t, c('fl'), 3.5) + `<path d="M${m.x + 9 * u.x} ${m.y + 9 * u.y}L${m.x + 9 * (u.x + v.x)} ${m.y + 9 * (u.y + v.y)}L${m.x + 9 * v.x} ${m.y + 9 * v.y}" fill="none" stroke="${c('fl')}" stroke-width="2"/>`;
    }
    if (e.ar)
        h += `<path d="M${ST(ch)}${AR(ch)}" fill="none" stroke="${c('ar')}" stroke-width="6" stroke-linecap="round"/>`;
    if (e.se) {
        const p = a('s1'), q = a('s2');
        h += Ln({ x: p.x + (p.x - q.x) * .4, y: p.y + (p.y - q.y) * .4 }, { x: q.x + (q.x - p.x) * .4, y: q.y + (q.y - p.y) * .4 }, c('se'), 3) + dot(p, c('se')) + dot(q, c('se'));
    }
    if (e.ta) {
        const t = a('tg'), n = { x: -(t.y - y) / r, y: (t.x - x) / r };
        h += Ln({ x: t.x - n.x * r * .9, y: t.y - n.y * r * .9 }, { x: t.x + n.x * r * .9, y: t.y + n.y * r * .9 }, c('ta'), 3) + `<circle cx="${t.x}" cy="${t.y}" r="5" fill="${c('ta')}"/><text x="${t.x + 8}" y="${t.y - 8}" font-weight="700" fill="${c('ta')}">T</text>` + dot(t, c('ta'));
    }
    h += pnt(it);
    {
        const sp = it.sp || 0, un = it.un || 0, TW = 2 * Math.PI * r, ly = y + r + 64, x0 = x - TW / 2;
        if (sp > 0) {
            const q = P(sp), p0 = P(0);
            h += sp >= 359.9 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${c('ra')}" fill-opacity=".3"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c('ar')}" stroke-width="6"/>` : `<path d="M${x} ${y}L${p0.x} ${p0.y}A${r} ${r} 0 ${sp > 180 ? 1 : 0} 0 ${q.x} ${q.y}Z" fill="${c('ra')}" fill-opacity=".3"/><path d="M${p0.x} ${p0.y}A${r} ${r} 0 ${sp > 180 ? 1 : 0} 0 ${q.x} ${q.y}" fill="none" stroke="${c('ar')}" stroke-width="6" stroke-linecap="round"/>`;
            h += Ln({ x, y }, q, c('ra'), 4) + `<circle cx="${q.x}" cy="${q.y}" r="7" fill="${c('ra')}" stroke="#fff" stroke-width="2"/>`;
        }
        if (un > 0) {
            if (e.cf !== 0 && un < 1) {
                const f = (1 - un) * 360, t = P(90 + f), q = P(90);
                h += `<path d="M${q.x} ${q.y}A${r} ${r} 0 ${f > 180 ? 1 : 0} 0 ${t.x} ${t.y}" fill="none" stroke="${c('cf')}" stroke-width="4"/>`;
            }
            h += Ln({ x: x0, y: ly }, { x: x0 + TW * un, y: ly }, c('cf'), 6);
            if (un >= 1)
                for (let i = 1; i <= 3; i++)
                    h += Ln({ x: x0 + i * 2 * r, y: ly - 10 }, { x: x0 + i * 2 * r, y: ly + 10 }, c('di'), 3) + `<text x="${x0 + (i - .5) * 2 * r}" y="${ly - 14}" text-anchor="middle" font-size="15" font-weight="700" fill="${c('di')}">d</text>`;
        }
        if (it.fm)
            h += `<text x="${x}" y="${y + r + (un > 0 ? 104 : 58)}" text-anchor="middle" font-size="17" font-weight="700" fill="#d97706">L = 2 × π × r ≈ ${(TW / 20).toFixed(1).replace('.', ',')} cm (≈ 3 d + 0,14 d) · A = π × r² ≈ ${(Math.PI * r * r / 400).toFixed(1).replace('.', ',')} cm²</text>`;
    }
    if (e.ce !== 0)
        h += `<circle cx="${x}" cy="${y}" r="4.5" fill="${c('ce')}"/>`;
    if (s)
        h += `<circle cx="${x + r}" cy="${y}" r="9" fill="#fff" stroke="#2563eb" stroke-width="3" stroke-dasharray="3 2"/>`;
    if (!S.hide)
        h += `<text x="${x}" y="${y + r + 28}" text-anchor="middle" font-size="18" font-weight="700" fill="#d97706">r = ${(r / 20).toFixed(1).replace('.', ',')} cm · d = ${(r / 10).toFixed(1).replace('.', ',')} cm</text>`;
    return h;
}
const pg = p => `<polygon points="${p}" fill="%F" fill-opacity=".85" stroke="#1e9455" stroke-width="2.2" stroke-linejoin="round"/>`, pa = d => `<path d="${d}" fill="%F" fill-opacity=".85" stroke="#1e9455" stroke-width="2.2" stroke-linejoin="round"/>`, ln = (a, b, c, d, z) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="%C" stroke-width="2.4" ${z ? 'stroke-dasharray="5 3"' : ''}/>`, tx = (x, y, t) => `<text x="${x}" y="${y}" font-size="14" font-weight="700" text-anchor="middle" fill="%C">${t}</text>`, rq = (x, y, a, b) => `<rect x="${a > 0 ? x : x - 8}" y="${b > 0 ? y : y - 8}" width="8" height="8" fill="%C" stroke="#333" stroke-width=".8"/>`, dt = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="%C"/>`, cb = '#1976D2', cr = '#E0352B', cg = '#1E9455', co = '#E67E22', cy = '#F5B731';
const AR = [['Rectángulo', pg('20,20 180,20 180,120 20,120'), 'A = b × h', 'Largo × ancho', [['Base (b)', cb, ln(20, 120, 180, 120) + tx(100, 137, 'b')], ['Altura (h)', cr, ln(20, 20, 20, 120) + tx(8, 75, 'h')]]],
    ['Cuadrado', pg('50,21 150,21 150,121 50,121'), 'A = L²', 'L × L', [['Lado de abajo (L)', cg, ln(50, 121, 150, 121) + tx(100, 138, 'L')], ['Lado de al lado (L)', cg, ln(50, 21, 50, 121) + tx(38, 75, 'L')]]],
    ['Paralelogramo', pg('20,120 140,120 180,20 60,20'), 'A = b × h', 'Altura ⊥ a la base', [['Base (b)', cb, ln(20, 120, 140, 120) + tx(80, 137, 'b')], ['Altura (h)', cr, ln(60, 20, 60, 120, 1) + tx(50, 75, 'h')], ['Ángulo recto', cy, rq(60, 120, 1, -1)]]],
    ['Triángulo', pg('20,120 180,120 100,20'), 'A = (b × h) ÷ 2', 'Mitad de un rectángulo', [['Base (b)', cb, ln(20, 120, 180, 120) + tx(100, 137, 'b')], ['Altura (h)', cr, ln(100, 20, 100, 120, 1) + tx(90, 75, 'h')], ['Ángulo recto', cy, rq(100, 120, 1, -1)]]],
    ['Altura fuera', pg('20,120 100,120 150,20'), 'A = (b × h) ÷ 2', 'Misma fórmula: prolonga la base', [['Base (b)', cb, ln(20, 120, 100, 120) + tx(60, 137, 'b')], ['Prolongación', cg, ln(100, 120, 150, 120, 1)], ['Altura (h)', cr, ln(150, 20, 150, 120, 1) + tx(160, 75, 'h')], ['Ángulo recto', cy, rq(150, 120, -1, -1)]]],
    ['Equilátero', pg('30,125 170,125 100,4'), 'A = (L × h) ÷ 2', 'h = (L ÷ 2)·√3', [['Lado izquierdo (L)', cg, ln(30, 125, 100, 4) + tx(52, 60, 'L')], ['Lado derecho (L)', cg, ln(170, 125, 100, 4) + tx(148, 60, 'L')], ['Base (L)', cg, ln(30, 125, 170, 125) + tx(100, 140, 'L')], ['Altura (h)', cr, ln(100, 4, 100, 125, 1) + tx(90, 70, 'h')], ['Ángulo recto', cy, rq(100, 125, 1, -1)]]],
    ['Rombo', pg('100,10 180,71 100,132 20,71'), 'A = (D × d) ÷ 2', 'D mayor, d menor', [['Diagonal mayor (D)', cr, ln(20, 71, 180, 71, 1) + tx(60, 64, 'D')], ['Diagonal menor (d)', co, ln(100, 10, 100, 132, 1) + tx(112, 40, 'd')], ['Ángulo recto', cy, rq(100, 71, 1, -1)]]],
    ['Trapecio', pg('20,120 180,120 140,25 60,25'), 'A = ((B + b) ÷ 2) × h', 'Semisuma de las bases', [['Base mayor (B)', cb, ln(20, 120, 180, 120) + tx(100, 137, 'B')], ['Base menor (b)', '#12998E', ln(60, 25, 140, 25) + tx(100, 18, 'b')], ['Altura (h)', cr, ln(60, 25, 60, 120, 1) + tx(50, 75, 'h')], ['Ángulo recto', cy, rq(60, 120, 1, -1)]]],
    ['Círculo', `<circle cx="100" cy="71" r="60" fill="%F" fill-opacity=".85" stroke="#1e9455" stroke-width="2.2"/>`, 'A = π r²', 'r × r × π', [['Centro', cr, dt(100, 71)], ['Radio (r)', co, ln(100, 71, 160, 71) + tx(130, 64, 'r')]]],
    ['Sector', pa('M40 125L160 125A120 120 0 0 0 100 21Z'), 'A = θ·π·R² ÷ 360°', '90° = 1/4 · 180° = 1/2 · 60° = 1/6', [['Radio (R)', cb, ln(40, 125, 160, 125) + tx(100, 140, 'R')], ['Otro radio (R)', cb, ln(40, 125, 100, 21) + tx(58, 70, 'R')], ['Ángulo (θ)', cr, `<path d="M70 125A30 30 0 0 0 55 99" fill="none" stroke="%C" stroke-width="2.4"/>` + tx(80, 112, 'θ')]]],
    ['Semicírculo', pa('M20 110A80 80 0 0 1 180 110Z'), 'A = π R² ÷ 2', 'Círculo y luego mitad', [['Diámetro (2R)', cb, ln(20, 110, 180, 110) + tx(100, 128, 'diámetro = 2R')], ['Centro', cr, dt(100, 110)], ['Radio (R)', co, ln(100, 110, 100, 30) + tx(112, 70, 'R')]]]];
function mkG(k) { const o = S.items.length % 5 * 26; add({ t: 'g', k, x: 480 + o, y: 280 + o, s: 1.45, r: 0, on: [], ec: {}, fill: '#fff3b0', show: 0 }); }
function ag(it, s) {
    const A = AR[it.k], x = it.x, y = it.y;
    let o = `<g transform="translate(${x} ${y}) rotate(${it.r}) scale(${it.s}) translate(-100 -71)">` + A[1].replace(/%F/g, it.fill || '#fff3b0');
    it.on.forEach(i => { const e = A[4][i]; o += e[2].replace(/%C/g, e[1]); });
    o += '</g>';
    if (s)
        o += `<rect x="${x - 100 * it.s}" y="${y - 71 * it.s}" width="${200 * it.s}" height="${142 * it.s}" fill="none" stroke="#2563eb" stroke-dasharray="6 4"/>`;
    if (it.show)
        o += `<text x="${x}" y="${y + 71 * it.s + 34}" text-anchor="middle" font-size="26" font-weight="700" fill="#16324f" stroke="#fff" stroke-width="5" paint-order="stroke">${A[2]}</text>`;
    return o;
}
const HB = {};
let AN = null;
function vact(x, it) {
    const n = ELR[it.k].length;
    it.on = it.on || [];
    if (x.startsWith('vel:')) {
        const i = +x.slice(4), j = it.on.indexOf(i);
        if (j < 0) {
            it.on.push(i);
            it.af = i;
        }
        else
            it.on.splice(j, 1);
    }
    else if (x == 'vall')
        it.on = [...Array(n).keys()];
    else if (x == 'vnone')
        it.on = [];
    else if (x == 'vfull')
        it.ang = 360;
    else if (x == 'vrs')
        it.ang = 0;
    else if (x == 'vor') {
        it.pc = {};
        it.bc = null;
    }
    else if (x == 'vbc')
        it.bc = null;
    else if (x == 'vbx')
        it.nb = it.nb ? 0 : 1;
    else if (x == 'vnm')
        it.nn = it.nn ? 0 : 1;
}
function ovr(it, k, P) {
    const on = it.on || [], pc = it.pc || {}, c = i => pc[i] || ELR[k][i][1], L = (a, b, x, y, i, w = 4) => `<line x1="${a}" y1="${b}" x2="${x}" y2="${y}" stroke="${c(i)}" stroke-width="${w}" stroke-linecap="round"/>`, D = (x, y, i) => `<circle cx="${x}" cy="${y}" r="6" fill="${c(i)}"/>`, Y = (y, i) => `<ellipse cx="0" cy="${y}" rx="50" ry="15" fill="${c(i)}" fill-opacity=".5" stroke="${c(i)}" stroke-width="2.5"/>`, F = (d, i) => `<path d="${d}" fill="${c(i)}" fill-opacity=".4"/>`, Pg = (p, i) => `<polygon points="${p}" fill="${c(i)}" fill-opacity=".55" stroke="${c(i)}" stroke-width="2"/>`, ax = L(0, -80, 0, 80, 0, 3), ra = (it.ra == null ? 45 : it.ra) * rad;
    const A = [() => [ax, Y(-55, 1), Y(55, 2), L(50, -55, 50, 55, 3), L(0, -55, 0, 55, 4, 5), L(0, -55, 50, -55, 5) + L(0, 55, 50, 55, 5) + D(0, -55, 5) + D(0, 55, 5), F('M-50 -55V55A50 15 0 0 0 50 55V-55A50 15 0 0 0 -50 -55Z', 6), Pg(`${P(0, -55)} ${P(50, -55)} ${P(50, 55)} ${P(0, 55)}`, 7)], () => [ax, D(0, -55, 1), Y(55, 2), L(0, 55, 50, 55, 3), L(0, -55, 0, 55, 4, 5), L(0, -55, 50, 55, 5), F('M0 -55L-50 55A50 15 0 0 0 50 55Z', 6), Pg(`0,-55 0,55 ${P(50, 55)}`, 7)], () => [ax, D(0, 0, 1), L(0, 0, 50 * Math.cos(ra), -50 * Math.sin(ra), 2), L(-50, 0, 50, 0, 3), `<ellipse rx="50" ry="15" fill="none" stroke="${c(4)}" stroke-width="4"/>`, `<circle r="50" fill="${c(5)}" fill-opacity=".4"/>`, Pg(Array.from({ length: 46 }, (_, i) => { const th = (-90 + i * 4) * rad; return P(50 * Math.cos(th), 50 * Math.sin(th)); }).join(' '), 6)]][k]();
    const t = (it.ang || 0) * rad, lb = (x, y, i, an = 'middle') => `<text x="${x}" y="${y}" font-size="9" font-weight="700" fill="${c(i)}" text-anchor="${an}" stroke="#1a2333" stroke-width="2.5" paint-order="stroke">${ELR[k][i][0]}</text>`, LP = [[[0, -86], [-56, -58, 'end'], [-56, 62, 'end'], [56, 0, 'start'], [-4, 0, 'end'], [25, -45], [25, 28], [25 * Math.cos(t), 12]], [[0, -86], [10, -60, 'start'], [-56, 62, 'end'], [25, 49], [-4, 0, 'end'], [30, -8, 'start'], [-20, 35], [50 * Math.cos(t) / 3, 25]], [[0, -86], [-8, 16, 'end'], [56 * Math.cos(ra), -56 * Math.sin(ra) + 3, Math.cos(ra) >= 0 ? 'start' : 'end'], [30, 12], [0, 28], [-20, -25], [22 * Math.cos(t), 40]]][k], LB = i => LP[i] ? lb(LP[i][0], LP[i][1], i, LP[i][2]) + (k == 0 && i == 5 ? lb(25, 48, i) : '') : '';
    return on.map(i => (A[i] || '') + (it.nn ? '' : LB(i))).join('');
}
function cact(x, it) {
    const A = ['ci', 'cf', 'ce', 'ra', 'di', 'cu', 'ar', 'sg', 'sc', 'fl', 'se', 'ta'];
    if (x == 'call')
        A.forEach(k => it.on[k] = 1);
    else if (x == 'cnone') {
        it.on = { ci: 0, cf: 0, ce: 0 };
        it.sp = 0;
        it.un = 0;
    }
    else if (x == 'cpl') {
        it.sp = 0;
        anRun(() => { it.sp = Math.min(360, (it.sp || 0) + 3); return it.sp < 360; });
    }
    else if (x == 'cfull')
        it.sp = 360;
    else if (x == 'crs')
        it.sp = 0;
    else if (x == 'cdes')
        anRun(() => { it.un = Math.min(1, (it.un || 0) + .03); return it.un < 1; });
    else if (x == 'carm')
        anRun(() => { it.un = Math.max(0, (it.un || 0) - .03); return it.un > 0; });
    else if (x == 'cfm')
        it.fm = it.fm ? 0 : 1;
    else if (x == 'cor')
        it.pc = {};
}
function anStop() { geometryAnimationStop(); }
function anRun(fn) { geometryAnimationStart(); }
const rot = (p, a, d, th) => { const v = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], c = Math.cos(th), sn = Math.sin(th), k = d[0] * v[0] + d[1] * v[1] + d[2] * v[2], cr = [d[1] * v[2] - d[2] * v[1], d[2] * v[0] - d[0] * v[2], d[0] * v[1] - d[1] * v[0]]; return [0, 1, 2].map(i => a[i] + v[i] * c + cr[i] * sn + d[i] * k * (1 - c)); };
function mkB(n, V, F, pr) {
    const m = [0, 1, 2].map(i => V.reduce((a, v) => a + v[i], 0) / V.length);
    V = V.map(v => v.map((x, i) => x - m[i]));
    const N = F.map(f => { const P = f.map(i => V[i]); let a = 0, b = 0, c = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; a += (p[1] - q[1]) * (p[2] + q[2]); b += (p[2] - q[2]) * (p[0] + q[0]); c += (p[0] - q[0]) * (p[1] + q[1]); }); const l = Math.hypot(a, b, c), g = P.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]), k = (a * g[0] + b * g[1] + c * g[2]) < 0 ? -1 : 1; return [a / l * k, b / l * k, c / l * k]; });
    const t = [0, -1, 0], n0 = N[0], ax = [n0[1] * t[2] - n0[2] * t[1], n0[2] * t[0] - n0[0] * t[2], n0[0] * t[1] - n0[1] * t[0]], al = Math.hypot(...ax);
    if (al > 1e-6) {
        const d = ax.map(x => x / al), th = Math.atan2(al, n0[0] * t[0] + n0[1] * t[1] + n0[2] * t[2]);
        V = V.map(v => rot(v, [0, 0, 0], d, th));
        N.forEach((x, i) => N[i] = rot(x, [0, 0, 0], d, th));
    }
    const E = {};
    F.forEach((f, fi) => f.forEach((a, i) => { const b = f[(i + 1) % f.length], k = a < b ? a + '-' + b : b + '-' + a; (E[k] = E[k] || []).push([fi, a, b]); }));
    const par = [-1], ed = [], an = [], seen = new Set([0]), q = [0];
    while (q.length) {
        const f = q.shift();
        for (const k in E) {
            const e = E[k], x = e.find(z => z[0] == f);
            if (!x)
                continue;
            const y = e.find(z => z[0] != f);
            if (!y || seen.has(y[0]))
                continue;
            seen.add(y[0]);
            par[y[0]] = f;
            const A = V[x[1]], B = V[x[2]], d0 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], l = Math.hypot(...d0), d = d0.map(z => z / l), g = y[0], cs = Math.max(-1, Math.min(1, N[f][0] * N[g][0] + N[f][1] * N[g][1] + N[f][2] * N[g][2])), aa = Math.acos(cs), r1 = rot(N[g], [0, 0, 0], d, aa);
            ed[g] = [A, d];
            an[g] = (r1[0] * N[f][0] + r1[1] * N[f][1] + r1[2] * N[f][2]) > .99 ? aa : -aa;
            q.push(g);
        }
    }
    return { n, V, F, par, ed, an, pr, nE: Object.keys(E).length };
}
const ring = (n, y, R) => Array.from({ length: n }, (_, i) => [R * Math.cos(2 * Math.PI * i / n), y, R * Math.sin(2 * Math.PI * i / n)]);
const prism = (n, h, R) => [[...ring(n, 0, R), ...ring(n, h, R)], [[...Array(n).keys()], [...Array(n).keys()].map(i => i + n), ...Array.from({ length: n }, (_, i) => [i, (i + 1) % n, n + (i + 1) % n, n + i])]];
const pyr = (n, h, R) => [[...ring(n, 0, R), [0, h, 0]], [[...Array(n).keys()], ...Array.from({ length: n }, (_, i) => [i, (i + 1) % n, n])]];
const oc = .7071, OV = [[oc, 0, 0], [-oc, 0, 0], [0, oc, 0], [0, -oc, 0], [0, 0, oc], [0, 0, -oc]], OF = [];
for (const i of [0, 1])
    for (const j of [2, 3])
        for (const k of [4, 5])
            OF.push([i, j, k]);
const BODY = [mkB('Cubo', ...prism(4, 1, .7071), 1), mkB('Tetraedro', ...pyr(3, .8165, .5774)), mkB('Octaedro', OV, OF), mkB('Prisma triangular', ...prism(3, 1.6, .5774), 1), mkB('Prisma pentagonal', ...prism(5, 1.3, .8507), 1), mkB('Pirámide cuadrada', ...pyr(4, 1.2, .7071)), mkB('Pirámide pentagonal', ...pyr(5, 1.2, .8507))];
function unf(B, u) {
    return B.F.map((f, fi) => f.map(i => {
        let p = B.V[i];
        for (let k = fi; k > 0; k = B.par[k])
            p = rot(p, B.ed[k][0], B.ed[k][1], B.an[k] * u);
        return p;
    }));
}
function mkH(k) { const o = S.items.length % 5 * 26; add(PY.mk(k, 480 + o, 290 + o)); }
function mkR(k) { const o = S.items.length % 5 * 26; add({ t: 'r', k, x: 480 + o, y: 280 + o, s: 1.8, ang: 120, un: 0, fm: 0 }); }
function hv(it, s) {
    const B = BODY[it.k], u = it.u || 0, FV = u > .001 ? unf(B, u) : B.F.map(f => f.map(i => B.V[i])), yaw = it.yaw * rad, pit = (it.pit * (1 - u) + 90 * u) * rad, sc = 90 * it.s;
    const pj = v => { const x1 = v[0] * Math.cos(yaw) - v[2] * Math.sin(yaw), z1 = v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw); return { X: it.x + x1 * sc, Y: it.y + sc * (-v[1] * Math.cos(pit) + z1 * Math.sin(pit)), d: v[1] * Math.sin(pit) + z1 * Math.cos(pit) }; };
    const PF = FV.map((f, i) => { const P = f.map(pj); return { i, P, d: P.reduce((a, p) => a + p.d, 0) / P.length }; }).sort((a, b) => a.d - b.d);
    let o = '', x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    PF.forEach(({ i, P }) => { P.forEach(p => { x0 = Math.min(x0, p.X); x1 = Math.max(x1, p.X); y0 = Math.min(y0, p.Y); y1 = Math.max(y1, p.Y); }); const fl = u > .02 ? ((i == 0 || (B.pr && i == 1)) ? '#86efac' : '#fdba74') : '#93c5fd'; o += `<polygon points="${P.map(p => p.X + ',' + p.Y).join(' ')}" fill="${fl}" fill-opacity="${u > .02 ? .8 : .5}" stroke="#1f4fa8" stroke-width="3" stroke-linejoin="round"/>`; });
    if (u < .02) {
        const pv = B.V.map(pj);
        pv.forEach((p, i) => { const dx = p.X - it.x, dy = p.Y - it.y, m = Math.hypot(dx, dy) || 1; o += `<circle cx="${p.X}" cy="${p.Y}" r="5.5" fill="#E0352B"/><text x="${p.X + dx / m * 16}" y="${p.Y + dy / m * 16 + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#E0352B">${'ABCDEFGHIJ'[i]}</text>`; });
    }
    HB[it.id] = [x0 - 8, y0 - 8, x1 + 8, y1 + 8];
    if (s)
        o += `<rect x="${x0 - 8}" y="${y0 - 8}" width="${x1 - x0 + 16}" height="${y1 - y0 + 16}" fill="none" stroke="#2563eb" stroke-dasharray="6 4"/>`;
    if (!S.hide) {
        const C = B.F.length, V = B.V.length, A = B.nE;
        o += `<text x="${it.x}" y="${y1 + 34}" text-anchor="middle" font-size="18" font-weight="700" fill="#d97706">C = ${C} · V = ${V} · A = ${A} · C + V = A + 2</text>`;
    }
    return o;
}
function rv(it, s) {
    const k = it.k, t = it.ang * rad, un = it.un || 0, P = (r, y) => `${r * Math.cos(t)},${y + r * Math.sin(t) * .3}`, sw = it.ang / 360;
    let o = `<g transform="translate(${it.x} ${it.y}) scale(${it.s})" font-weight="700" text-anchor="middle">`, bd = '', nt = '';
    const E = `fill="none" stroke="#16324f" stroke-width="2.2"`, G = `fill="none" stroke="#7c8aa0" stroke-width="2" stroke-dasharray="5 4"`;
    if (k == 0) {
        bd = `<path d="M-50 55A50 15 0 0 1 50 55" ${G}/><path d="M-50 -55V55M50 -55V55M-50 55A50 15 0 0 0 50 55" ${E}/><ellipse cx="0" cy="-55" rx="50" ry="15" ${E}/><path d="M-50 -55V55A50 15 0 0 0 50 55V-55A50 15 0 0 0 -50 -55Z" fill="${it.bc || '#F28C28'}" fill-opacity="${it.bc ? .55 : .3 * sw}"/><line x1="0" y1="-80" x2="0" y2="80" stroke="#374151" stroke-dasharray="6 4"/>`;
        nt = `<rect x="-100" y="-55" width="201" height="110" fill="#F28C28" fill-opacity=".35" stroke="#F28C28"/><circle cx="-70" cy="-95" r="32" fill="#8E44AD" fill-opacity=".35" stroke="#8E44AD"/><circle cx="70" cy="95" r="32" fill="#8E44AD" fill-opacity=".35" stroke="#8E44AD"/><text x="0" y="0" font-size="14" fill="#B45309">AL = 2π·r·h</text><text x="0" y="72" font-size="12" fill="#1976D2">2π·r</text><text x="112" y="0" font-size="12" fill="#E0352B">h</text><text x="-70" y="-90" font-size="12" fill="#8E44AD">πr²</text><text x="70" y="100" font-size="12" fill="#8E44AD">πr²</text>`;
    }
    else if (k == 1) {
        bd = `<path d="M-50 55A50 15 0 0 1 50 55" ${G}/><path d="M0 -55L-50 55A50 15 0 0 0 50 55Z" ${E}/><path d="M0 -55L-50 55A50 15 0 0 0 50 55Z" fill="${it.bc || '#F28C28'}" fill-opacity="${it.bc ? .55 : .3 * sw}"/><line x1="0" y1="-80" x2="0" y2="55" stroke="#374151" stroke-dasharray="6 4"/>`;
        nt = `<path d="M0 -90L-95.1 -59.1A100 100 0 0 0 95.1 -59.1Z" fill="#F28C28" fill-opacity=".35" stroke="#F28C28"/><circle cx="70" cy="68" r="40" fill="#8E44AD" fill-opacity=".35" stroke="#8E44AD"/><text x="0" y="-40" font-size="13" fill="#B45309">AL = π·R·g</text><text x="-70" y="-55" font-size="12" fill="#E67E22">g</text><text x="0" y="28" font-size="12" fill="#17A2B8">2π·R</text><text x="70" y="72" font-size="11" fill="#8E44AD">AB = πR²</text>`;
    }
    else {
        bd = `<path d="M-50 0A50 15 0 0 1 50 0" ${G}/><circle r="50" ${E}/><path d="M-50 0A50 15 0 0 0 50 0" ${E}/><circle r="50" fill="${it.bc || '#8E44AD'}" fill-opacity="${it.bc ? .55 : .22 * sw}"/><line x1="0" y1="-70" x2="0" y2="70" stroke="#374151" stroke-dasharray="6 4"/>`;
        nt = [[-36, -36], [36, -36], [-36, 36], [36, 36]].map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="32" fill="#8E44AD" fill-opacity=".35" stroke="#E67E22" stroke-width="2.4"/>`).join('') + `<text x="0" y="4" font-size="12" fill="#8E44AD">S = 4πR²</text><text x="0" y="-74" font-size="11" fill="#E67E22">4 círculos máx.</text>`;
    }
    bd += ovr(it, k, P) + (s && k == 2 && (it.on || []).includes(2) ? `<circle cx="${50 * Math.cos((it.ra == null ? 45 : it.ra) * rad)}" cy="${-50 * Math.sin((it.ra == null ? 45 : it.ra) * rad)}" r="7" fill="#fff" stroke="#2563eb" stroke-width="3" stroke-dasharray="3 2"/>` : '');
    o += `<g opacity="${1 - un}">${bd}</g>` + (un > 0 ? `<g opacity="${un}">${nt}</g>` : '');
    if (it.fm) {
        const L = [['AL = 2π·r·h · AB = π·r²', 'AT = AL + 2·AB · V = π·r²·h'], ['g² = R² + h²', 'AL = π·R·g · AB = π·R²', 'AT = πR(g + R)', 'V = π·R²·h ÷ 3'], ['d = 2R', 'S = 4πR²', 'V = 4⁄3·π·R³', 'En un cilindro: R = h ÷ 2']][k];
        L.forEach((l, i) => o += `<text x="0" y="${(un > 0 ? 128 : 92) + i * 15}" font-size="11" fill="#0F766E">${l}</text>`);
    }
    o += '</g>';
    if (s && !it.nb)
        o += `<rect x="${it.x - (un > 0 ? 120 : 75) * it.s}" y="${it.y - (un > 0 ? 120 : 90) * it.s}" width="${(un > 0 ? 240 : 150) * it.s}" height="${(un > 0 ? 240 : 180) * it.s}" fill="none" stroke="#2563eb" stroke-dasharray="6 4"/>`;
    return o;
}
let PP = null, TR = [];
function dp() {
    const g = $('P');
    if (S.tool != 'pt' || !PP) {
        putHTML(g, '');
        if (S.tool != 'pt') {
            PP = null;
            TR = [];
        }
        return;
    }
    const c = S.col, x = PP.x, y = PP.y;
    let o = '';
    TR.forEach((q, i) => { o += `<circle cx="${q.x}" cy="${q.y}" r="${4 + i}" fill="${c}" fill-opacity="${i * .035}"/>`; });
    o += `<circle cx="${x}" cy="${y}" r="28" fill="${c}" fill-opacity=".2"/><circle cx="${x}" cy="${y}" r="16" fill="${c}" fill-opacity=".45"/><circle cx="${x}" cy="${y}" r="8" fill="${c}" stroke="#fff" stroke-width="3"/>`;
    putHTML(g, o);
}
function mvp(p) {
    PP = p;
    TR.push(p);
    if (TR.length > 8)
        TR.shift();
    dp();
}
listen(sv,'pointermove', e => {
    if (S.tool == 'pt')
        mvp(pt(e));
});
listen(sv,'pointerdown', e => {
    sv.setPointerCapture(e.pointerId);
    const p = pt(e);
    anStop();
    if (S.tool == 'pt') {
        mvp(p);
        return;
    }
    if (S.tool == 'bk') {
        let ok = 0;
        const I = S.items;
        for (let i = I.length - 1; i >= 0 && !ok; i--) {
            const m = I[i];
            if(!geometryValid(m))continue;
            ok = m.t == 'p' ? bkF(m, p) : m.t == 'l' ? bkL(m, p) : m.t == 'c' ? bkC(m, p) : 0;
        }
        for (let i = I.length - 1; i >= 0 && !ok; i--) {
            const m = I[i];
            ok = m.t == 'p' ? bkR(m, p) : m.t == 'c' ? bkCR(m, p) : 0;
        }
        return;
    }
    if (S.tool == 'p') {
        snapH();
        S.items.push({ t: 'd', c: S.col, d: [p], id: geometryNewId() });
        S.sel = -1;
        drag = { k: 'pen' };
        return;
    }
    if (S.tool == 'l' || S.tool == 'lr' || S.tool == 'ly' || S.tool == 'ls') {
        snapH();
        const q = { x: sn(p.x), y: sn(p.y) }, ln = S.tool.length == 2 ? S.tool[1] : null;
        S.items.push({ t: 'l', c: S.col, x1: q.x, y1: q.y, x2: q.x, y2: q.y, id: geometryNewId(), ...(ln ? { ln } : {}) });
        S.sel = -1;
        drag = { k: 'line' };
        return;
    }
    if (S.tool == 't') {
        snapH();
        S.items.push({ t: 't', x: p.x, y: p.y, s: 36, c: S.col, x_: txtIn || 'Texto', id: geometryNewId() });
        S.tool = 'm';
        S.sel = S.items.length - 1;
        ui();
        {
            const i = $('ti2');
            if (i) {
                i.focus();
                i.select();
            }
        }
        return;
    }
    const h = hit(p);
    if (!h) {
        S.sel = -1;
        S.sd = -1;
        ui();
        return;
    }
    snapH();
    if (h.i != null)
        S.sel = h.i;
    S.sd = h.sd != null ? h.sd : -1;
    const i0 = S.items[S.sel];
    drag = { ...h, px: p.x, py: p.y, pts0: i0 && i0.pts ? i0.pts.map(q => ({ ...q })) : null };
    ui();
});
listen(sv,'pointermove', e => {
    if (!drag)
        return;
    const p = pt(e), it = S.items[S.sel >= 0 ? S.sel : S.items.length - 1];
    if (drag.k == 'pm') {
        S.pr.x = sn(p.x);
        S.pr.y = sn(p.y);
    }
    else if (drag.k == 'pr') {
        const a = Math.atan2(-(p.y - S.pr.y), p.x - S.pr.x) / rad - 90;
        S.pr.r = S.snap ? Math.round(a / 5) * 5 : a;
    }
    else if (drag.k == 'rot' || drag.k == 'scl') {
        const c = cenP(drag.pts0), an = Math.atan2(p.y - c.y, p.x - c.x), dd = Math.hypot(p.x - c.x, p.y - c.y);
        if (drag.k == 'rot') {
            if (drag.a0 == null)
                drag.a0 = an;
            const da = an - drag.a0, cs = Math.cos(da), sn_ = Math.sin(da);
            it.pts = drag.pts0.map(q => ({ x: c.x + (q.x - c.x) * cs - (q.y - c.y) * sn_, y: c.y + (q.x - c.x) * sn_ + (q.y - c.y) * cs }));
        }
        else {
            if (!drag.d0)
                drag.d0 = dd || 1;
            const k = Math.max(.2, dd / drag.d0);
            it.pts = drag.pts0.map(q => ({ x: c.x + (q.x - c.x) * k, y: c.y + (q.y - c.y) * k }));
        }
    }
    else if (drag.k == 'cr') {
        const d = Math.hypot(p.x - it.x, p.y - it.y);
        it.r = Math.max(40, Math.min(250, S.snap ? Math.round(d / 20) * 20 : d));
    }
    else if (drag.k == 'ce') {
        let a = Math.atan2(it.y - p.y, p.x - it.x) / rad + (drag.inv ? 180 : 0);
        if (S.snap)
            a = Math.round(a / 5) * 5;
        it.g[drag.j] = a;
    }
    else if (drag.k == 'rr') {
        let a = Math.atan2(it.y - p.y, p.x - it.x) / rad;
        if (S.snap)
            a = Math.round(a / 15) * 15;
        it.ra = a;
    }
    else if (drag.k == 'fs') {
        it.s = Math.max(.3, Math.min(4, (p.x - it.x) / 200));
    }
    else if (drag.k == 'ss') {
        const q = shL(it, p);
        let w = Math.max(40, 2 * q.x), h = Math.max(40, 2 * q.y);
        if (it.k == 'sq' || it.k == 'cd')
            w = h = Math.max(w, h);
        else if (it.k == 'sc')
            h = w / 2;
        it.w = Math.min(800, w);
        it.h = Math.min(800, h);
    }
    else if (drag.k == 'pen') {const stroke=S.items[S.items.length-1];if(stroke.d.length>=400)S.items.push({...stroke,id:geometryNewId(),d:[stroke.d.at(-1),p]});else stroke.d.push(p);}
    else if (drag.k == 'line') {
        const l = S.items[S.items.length - 1];
        l.x2 = sn(p.x);
        l.y2 = sn(p.y);
    }
    else if (drag.k == 'v') {
        it.pts[drag.j].x = sn(p.x);
        it.pts[drag.j].y = sn(p.y);
    }
    else if (drag.k == 'p1') {
        it.x1 = sn(p.x);
        it.y1 = sn(p.y);
    }
    else if (drag.k == 'p2') {
        it.x2 = sn(p.x);
        it.y2 = sn(p.y);
    }
    else if (drag.k == 'e') {
        let a = Math.atan2(it.y - p.y, p.x - it.x) / rad;
        if (S.snap)
            a = Math.round(a / 5) * 5;
        it['a' + drag.j] = a;
        it.l = Math.max(50, Math.hypot(p.x - it.x, p.y - it.y));
    }
    else {
        const dx = p.x - drag.px, dy = p.y - drag.py;
        drag.mvd = (drag.mvd || 0) + Math.hypot(dx, dy);
        mv(it, dx, dy);
        drag.px = p.x;
        drag.py = p.y;
        if (S.snap && it.t == 'a') {
            it.x = sn(it.x);
            it.y = sn(it.y);
        }
    }
    draw();
});
const end = e => {
    if (!drag)
        return;
    if (drag.k == 'b' && e && e.type == 'pointerup' && (drag.mvd || 0) < 5) {
        const q = S.items[S.sel];
        if (q && q.t == 'y')
            PY.pickAt(q, pt(e));
    }
    if (drag.k == 'line') {
        const l = S.items[S.items.length - 1];
        if (Math.hypot(l.x2 - l.x1, l.y2 - l.y1) < 6)
            S.items.pop();
        else
            S.sel = S.items.length - 1;
    }
    if (drag.k == 'pen') {
        const d = S.items[S.items.length - 1];
        if (d.d.length < 2)
            S.items.pop();
        else
            S.sel = S.items.length - 1;
    }
    drag = null;
    ui();
};
listen(sv,'pointerup', end);
listen(sv,'pointercancel', end);
listen(document,'click', e => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset;
    if (d.k) {
        S.tab = d.k;
        if (['lr', 'ly', 'ls'].includes(S.tool))
            S.tool = 'm';
        ui();
    }
    else if (d.t) {
        S.tool = d.t;
        S.bke = 0;
        S.sel = -1;
        ui();
    }
    else if (d.c)
        mk(d.c, (TRI[d.c] || QUA[d.c]));
    else if (d.a)
        mkA(d.a == 'r' ? 5 * (2 + Math.floor(Math.random() * 33)) : +d.a);
    else if (d.col) {
        S.col = d.col;
        const it = S.items[S.sel];
        if (it && (S.tool == 'm' || S.tool == 'l' || S.tool == 'lr' || S.tool == 'ly' || S.tool == 'ls' || S.tool == 'p')) {
            snapH();
            if (it.t == 'g')
                it.fill = d.col;
            else if (it.t == 'c') {
                it.pc = it.pc || {};
                it.pc[it.af || 'cf'] = d.col;
            }
            else if (it.t == 'r') {
                it.pc = it.pc || {};
                it.pc[it.af || 0] = d.col;
            }
            else if (it.t == 'y')
                PY.setC(it, d.col);
            else
                it.c = d.col;
        }
        ui();
    }
    else if (d.sh)
        mkS(d.sh);
    else if (d.hk)
        mkH(d.hk == 'r' ? Math.floor(Math.random() * 9) : +d.hk);
    else if (d.rk)
        mkR(+d.rk);
    else if (d.nk)
        mkN(+d.nk);
    else if (d.gk)
        mkG(d.gk == 'r' ? Math.floor(Math.random() * 11) : +d.gk);
    else if (d.cr)
        mkC(d.cr);
    else if (d.x)
        act(d.x);
});
listen(document,'input', e => {
    if (e.target.dataset.lc !== undefined || e.target.dataset.fc !== undefined) {
        const it = S.items[S.sel];
        if (it) {
            if (!PCS) {
                snapH();
                PCS = 1;
            }
            if (e.target.dataset.lc !== undefined)
                it.c = e.target.value;
            else
                it.f = e.target.value;
            draw();
        }
        return;
    }
    if (e.target.dataset.bc !== undefined) {
        const it = S.items[S.sel];
        if (it) {
            if (!PCS) {
                snapH();
                PCS = 1;
            }
            it.bc = e.target.value;
            draw();
        }
        return;
    }
    if (e.target.dataset.sp) {
        const it = S.items[S.sel];
        if (it && it.t == 's') {
            if (!PCS) {
                snapH();
                PCS = 1;
            }
            const k = e.target.dataset.sp;
            if (k == 'c')
                it.c = e.target.value;
            else if (k == 'f') {
                it.f = it.f0 = e.target.value;
            }
            else
                it.i = e.target.value;
            draw();
        }
        return;
    }
    if (e.target.dataset.pc) {
        const it = S.items[S.sel];
        if (it) {
            if (!PCS) {
                snapH();
                PCS = 1;
            }
            it.pc = it.pc || {};
            it.pc[e.target.dataset.pc] = e.target.value;
            it.af = e.target.dataset.pc;
            draw();
        }
        return;
    }
    if (e.target.dataset.sl) {
        const it = S.items[S.sel], k = e.target.dataset.sl, v = +e.target.value;
        if (it) {
            anStop();
            it[k] = (k == 'u' || k == 'un') ? v / 100 : v;
            draw();
        }
        return;
    }
    if (e.target.id == 'si') {
        const it = S.items[S.sel];
        it.sl = it.sl || [];
        it.sl[S.sd] = e.target.value;
        draw();
        return;
    }
    if (e.target.id == 'ti')
        txtIn = e.target.value;
    if (e.target.id == 'cf') {
        S.col = e.target.value;
        const it = S.items[S.sel];
        if (it && S.tool == 'm') {
            if (it.t == 'y')
                PY.setC(it, S.col);
            else
                it.c = S.col;
        }
        draw();
    }
    if (e.target.id == 'ti' && S.items[S.sel] && S.items[S.sel].t == 't') {
        S.items[S.sel].x_ = txtIn;
        draw();
    }
});
$('bOp').onclick = e => { const b = document.body.classList.toggle('noopt'); e.target.textContent = b ? '👁 Mostrar opciones' : '🙈 Ocultar opciones'; e.target.classList.toggle('on', b); };
$('bUn').onclick = () => {
    if (H.length) {
        S.items = JSON.parse(H.pop());
        S.sel = -1;
        ui();
    }
};
$('bSn').onclick = e => { S.snap = S.snap ? 0 : 1; e.target.classList.toggle('on', !!S.snap); };
$('bCl').onclick = () => {
    if (S.items.length) {
        snapH();
        S.items = [];
        S.sel = -1;
        ui();
    }
};
$('bBig').onclick = e => {
    const b = document.body.classList.toggle('big');
    e.target.textContent = b ? '↩ Salir de grande' : '🔍 Pizarra grande';
    e.target.classList.toggle('on', b);
    if (b && document.documentElement.requestFullscreen)
        document.documentElement.requestFullscreen().catch(() => { });
    else if (!b && document.fullscreenElement)
        document.exitFullscreen();
};
listen(document,'keydown', e => {
    if (e.key == 'Delete' && e.target.tagName != 'INPUT')
        act('del');
});
H = [];
S.tab = 'tri';
/* ===== FÓRMULAS DEL CÍRCULO con gráfico (17 tarjetas) ===== */
const RD = Math.PI / 180, NV = '#1e3a8a', PK = '#db2777', GR = '#16a34a', OR = '#f97316', PU = '#7c3aed', BL = '#2563eb', TL = '#0d9488';
const cir = (cx = 100, cy = 60, r = 46) => {
    const p = a => [cx + r * Math.cos(a * RD), cy - r * Math.sin(a * RD)];
    return { cx, cy, r, p,
        c: (fl = '#fef3c7', s = NV, w = 2.5) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fl}" stroke="${s}" stroke-width="${w}"/>`,
        a: (a1, a2, c, w = 5) => `<path d="M${p(a1)} A${r} ${r} 0 ${((a2 - a1) % 360 + 360) % 360 > 180 ? 1 : 0} 0 ${p(a2)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`,
        w: (a1, a2, fl) => `<path d="M${cx} ${cy}L${p(a1)} A${r} ${r} 0 0 0 ${p(a2)}Z" fill="${fl}"/>` };
};
const lN = (a, b, c, w = 2.4) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`, tX = (x, y, t, c = NV, z = 10) => `<text x="${x}" y="${y}" font-size="${z}" font-weight="700" fill="${c}" text-anchor="middle">${t}</text>`, dT = (a, c = '#dc2626', r = 2.6) => `<circle cx="${a[0]}" cy="${a[1]}" r="${r}" fill="${c}"/>`, un = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; }, rQ = (P, u, v, k = 6) => `<path d="M${P[0] + k * u[0]} ${P[1] + k * u[1]}L${P[0] + k * (u[0] + v[0])} ${P[1] + k * (u[1] + v[1])}L${P[0] + k * v[0]} ${P[1] + k * v[1]}" fill="none" stroke="#111" stroke-width="1.4"/>`, lb = (K, a, rr, t, c, z = 11) => tX(K.cx + rr * Math.cos(a * RD), K.cy - rr * Math.sin(a * RD) + 4, t, c, z), sc = (P, K, t) => { const d = [Math.cos(t * RD), Math.sin(t * RD)], f = [P[0] - K.cx, P[1] - K.cy], b = f[0] * d[0] + f[1] * d[1], s = Math.sqrt(Math.max(0, b * b - f[0] * f[0] - f[1] * f[1] + K.r * K.r)); return [-b - s, -b + s].map(k => [P[0] + k * d[0], P[1] + k * d[1]]); }, agl = (K, X) => Math.atan2(-(X[1] - K.cy), X[0] - K.cx) / RD, xp = (a, b, c, d) => { const k = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]), t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / k; return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; }, dd = (a) => a.map(x => dT(x, NV)).join('');
const SV = [
    (() => { const K = cir(), O = [100, 60]; return K.c() + lN(K.p(180), K.p(0), PU, 2.6) + lN(O, K.p(40), OR, 2.6) + dT(O) + tX(95, 74, 'O', '#dc2626') + tX(124, 38, 'r', OR) + tX(150, 55, 'd', PU); })(),
    (() => { const K = cir(), O = [100, 60]; return K.c('#fef3c7', GR, 5) + lN(O, K.p(35), OR, 2.6) + dT(O) + tX(126, 38, 'r', OR) + tX(46, 24, 'L', GR, 12); })(),
    (() => { const K = cir(), O = [100, 60]; return K.c('#fcd34d', OR, 3) + lN(O, K.p(35), OR, 2.6) + dT(O) + tX(100, 82, 'A', '#7c2d12', 14) + tX(128, 38, 'r', OR); })(),
    (() => { const K = cir(82, 66, 40), O = [82, 66], P = K.p(40), d = [Math.sin(40 * RD), Math.cos(40 * RD)]; return K.c() + lN([P[0] - 40 * d[0], P[1] - 40 * d[1]], [P[0] + 50 * d[0], P[1] + 50 * d[1]], TL) + lN(O, P, OR, 2.6) + dT(O) + rQ(P, un(P, O), d) + tX(P[0] + 11, P[1] - 6, 'T', TL, 11) + tX(77, 84, 'O', '#dc2626'); })(),
    (() => { const K = cir(72, 60, 35), O = [72, 60], Pp = [175, 60], a = Math.acos(35 / 103) / RD, A = K.p(a), B = K.p(-a); return K.c() + lN(Pp, A, GR) + lN(Pp, B, GR) + lN(O, A, '#9ca3af', 1.8) + lN(O, B, '#9ca3af', 1.8) + dT(O) + dd([A, B]) + dT(Pp, '#111', 3) + rQ(A, un(A, O), un(A, Pp)) + rQ(B, un(B, O), un(B, Pp)) + tX(A[0] + 2, A[1] - 6, 'A') + tX(B[0] + 2, B[1] + 14, 'B') + tX(Pp[0] + 9, Pp[1] + 4, 'P', GR, 11); })(),
    (() => { const K = cir(), A = [55, 50], B = [145, 50], M = [100, 50], O = [100, 60]; return K.c() + lN([100, 14], [100, 106], PU, 2.6) + lN(A, B, GR) + lN([78, 46], [78, 54], GR, 2) + lN([122, 46], [122, 54], GR, 2) + rQ(M, [0, 1], [1, 0], 5) + dT(O) + dT(M, '#111', 2) + tX(46, 47, 'A') + tX(154, 47, 'B') + tX(110, 46, 'M', GR) + tX(112, 72, 'O', '#dc2626'); })(),
    (() => { const K = cir(), P = K.p(35), Q = K.p(85), C = K.p(215), E = K.p(265); return K.c() + K.a(35, 85, PK) + K.a(215, 265, PK) + lN(P, Q, GR) + lN(C, E, GR) + dd([P, Q, C, E]) + tX(Q[0], Q[1] - 6, 'Q') + tX(P[0] + 10, P[1] + 2, 'P') + tX(C[0] - 9, C[1] + 4, 'C') + tX(E[0], E[1] + 14, 'D'); })(),
    (() => { const K = cir(), A = K.p(143.13), B = K.p(36.87), C = K.p(216.87), E = K.p(323.13); return K.c() + K.a(143.13, 216.87, PK) + K.a(323.13, 396.87, PK) + lN(A, B, GR) + lN(C, E, GR) + dd([A, B, C, E]) + tX(A[0] - 9, A[1] - 2, 'A') + tX(B[0] + 9, B[1] - 2, 'B') + tX(C[0] - 9, C[1] + 10, 'C') + tX(E[0] + 9, E[1] + 10, 'D'); })(),
    (() => { const K = cir(), O = [100, 60]; return K.c() + K.w(-30, 90, '#bfdbfe') + K.w(90, 210, '#bbf7d0') + K.w(210, 330, '#fde68a') + K.c('none') + [90, 210, 330].map(a => lN(O, K.p(a), NV, 1.8)).join('') + lb(K, 150, 26, 'a', '#15803d', 13) + lb(K, 30, 26, 'c', '#1d4ed8', 13) + lb(K, 270, 26, 'b', '#b45309', 13); })(),
    (() => { const K = cir(), A = K.p(180), B = K.p(0), C = K.p(110), O = [100, 60]; return K.c() + lN(A, B, PU, 2.6) + lN(C, A, GR) + lN(C, B, GR) + dT(O) + dd([A, B, C]) + rQ(C, un(C, A), un(C, B)) + tX(A[0] - 8, A[1] + 4, 'A') + tX(B[0] + 9, B[1] + 4, 'B') + tX(C[0] - 3, C[1] - 6, 'C') + tX(104, 74, 'O', '#dc2626') + tX(C[0] + 14, C[1] + 16, '90°', '#dc2626', 9); })(),
    (() => { const K = cir(), O = [100, 60], A = K.p(20), B = K.p(100); return K.c() + K.w(20, 100, '#bfdbfe') + K.a(20, 100, PK) + lN(O, B, OR) + lN(O, A, OR) + dT(O) + dd([A, B]) + tX(B[0] - 6, B[1] - 5, 'B') + tX(A[0] + 11, A[1] + 4, 'A') + lb(K, 60, 22, 'x', BL, 12) + lb(K, 60, 58, 'x', '#dc2626', 11); })(),
    (() => { const K = cir(), C = K.p(215), B = K.p(100), A = K.p(20); return K.c() + K.a(20, 100, PK) + lN(C, B, GR) + lN(C, A, GR) + dd([A, B, C]) + tX(B[0] - 4, B[1] - 6, 'B') + tX(A[0] + 11, A[1] + 3, 'A') + tX(C[0] - 8, C[1] + 12, 'C') + tX(C[0] + 14, C[1] - 6, 'x', BL, 10) + lb(K, 60, 58, '2x', PK, 11); })(),
    (() => { const K = cir(100, 56, 44), T = K.p(270), A = K.p(60); return K.c() + lN([20, 100], [180, 100], TL) + lN(T, A, GR) + K.a(270, 420, PK) + dd([T, A]) + tX(100, 113, 'T', TL, 11) + tX(A[0] + 10, A[1] - 3, 'A') + tX(112, 93, 'x', BL, 10) + lb(K, 340, 60, '2x', PK, 11); })(),
    (() => { const K = cir(100, 58, 42), A = K.p(150), C = K.p(40), E = K.p(220), B = K.p(310), I = xp(A, B, C, E); return K.c() + K.a(40, 150, PK) + K.a(220, 310, GR) + lN(A, B, '#475569') + lN(C, E, '#475569') + dd([A, B, C, E]) + dT(I) + tX(I[0] + 9, I[1] - 3, 'x', BL, 10) + tX(A[0] - 9, A[1] - 2, 'A') + tX(C[0] + 9, C[1] - 2, 'C') + tX(E[0] - 9, E[1] + 10, 'D') + tX(B[0] + 9, B[1] + 10, 'B') + lb(K, 95, 52, 'θ', PK, 12) + lb(K, 265, 52, 'α', GR, 12); })(),
    (() => { const K = cir(68, 60, 42), P = [178, 60], s1 = sc(P, K, 196), s2 = sc(P, K, 164), n1 = s1[0], f1 = s1[1], n2 = s2[0], f2 = s2[1]; return K.c() + K.a(agl(K, f1), agl(K, f2), PK) + K.a(agl(K, n2), agl(K, n1), GR) + lN(P, f1, '#475569') + lN(P, f2, '#475569') + dd([n1, f1, n2, f2]) + dT(P, '#111', 3) + tX(K.cx - 52, 64, 'θ', PK, 12) + lb(K, 0, 26, 'α', GR, 12) + tX(P[0] - 20, P[1] + 3, 'x', BL, 10) + tX(P[0] + 9, P[1] + 4, 'P'); })(),
    (() => { const K = cir(68, 60, 42), P = [178, 60], ta = Math.acos(42 / 110) / RD, T = K.p(ta), s = sc(P, K, 162), n = s[0], f = s[1]; return K.c() + K.a(ta, agl(K, f), PK) + K.a(agl(K, n), ta, GR) + lN(P, T, TL) + lN(P, f, '#475569') + dd([T, n, f]) + dT(P, '#111', 3) + tX(T[0] - 3, T[1] - 6, 'T', TL, 11) + tX(K.cx - 52, 64, 'β', PK, 12) + tX(n[0] + 4, n[1] + 14, 'ω', GR, 11) + tX(P[0] - 20, P[1] + 4, 'x', BL, 10) + tX(P[0] + 9, P[1] + 4, 'P'); })(),
    (() => { const K = cir(70, 60, 38), O = [70, 60], P = [172, 60], a = Math.acos(38 / 102) / RD, A = K.p(a), B = K.p(-a); return K.c() + lN(P, A, TL) + lN(P, B, TL) + lN(O, A, OR) + lN(O, B, OR) + dT(O) + dd([A, B]) + dT(P, '#111', 3) + rQ(A, un(A, O), un(A, P)) + rQ(B, un(B, O), un(B, P)) + tX(A[0] + 2, A[1] - 6, 'A') + tX(B[0] + 2, B[1] + 14, 'B') + tX(P[0] + 9, P[1] + 4, 'P', TL, 11) + tX(O[0] + 15, O[1] + 4, 'δ', OR, 12) + tX(P[0] - 20, P[1] + 4, 'x', BL, 10); })()
];
const CT = [['Radio y diámetro', 'd = 2r · r = d ÷ 2', 'El diámetro pasa por el centro'], ['Longitud de la circunferencia', 'L = 2πr', 'Con diámetro: L = d · π'], ['Área del círculo', 'A = πr²', 'r² = r × r'], ['Tangente ⊥ radio', 'OT ⊥ L · forman 90° en T', 'La tangente toca en 1 solo punto'], ['Tangentes desde un punto', 'PA = PB', 'Dos hilos del mismo largo'], ['Diámetro ⊥ cuerda', 'AM = MB', 'Si OM ⊥ AB, la corta en 2 mitades iguales'], ['Cuerdas iguales', 'PQ = CD ⇒ arco PQ = arco CD', 'Cuerdas iguales, arcos iguales'], ['Cuerdas paralelas', 'AB ∥ CD ⇒ arco AC = arco BD', 'Arcos entre las paralelas'], ['Circunferencia completa', 'a + b + c = 360°', 'Media vuelta = 180°'], ['Ángulo que ve un diámetro', '= 90°', 'Cualquier punto C de la circunferencia'], ['Ángulo central', 'x = arco', 'Mide lo mismo que su arco'], ['Ángulo inscrito', 'x = arco ÷ 2', 'El arco mide el doble: 2x'], ['Ángulo semi-inscrito', 'x = arco ÷ 2', 'T: punto de tangencia'], ['Ángulo interior', 'x = (θ + α) ÷ 2', 'Dos cuerdas que se cruzan dentro'], ['Ángulo exterior', 'x = (θ − α) ÷ 2', 'Dos secantes desde un punto exterior'], ['Exterior: tangente y secante', 'x = (β − ω) ÷ 2', 'T: punto de tangencia'], ['Tangentes desde un punto (ángulo)', 'x + δ = 180°', 'A y B: puntos de tangencia']];
GAL.splice(12, 6, ...CT.map((c, i) => [c[0], c[1], c[2], [GR, OR, PU, BL, PK, TL][i % 6], SV[i]]));
const _fc = fc;
let ZI = -1, GF = 'all';
const frc = (x, y, n, d, w = 17) => tX(x, y - 4, n, '#111', 12) + `<line x1="${x - w}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#111" stroke-width="1.6"/>` + tX(x, y + 13, d, '#111', 12), bx = (a, b) => `<rect x="${a}" y="${b}" width="68" height="40" fill="#fff" stroke="#111" stroke-width="2"/>`;
const T1 = (() => {
    const A = [8, 104], D = [112, 104], B = [34, 18], C = [86, 18], ML = [21, 61], MR = [99, 61], pt = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t], tk = (P, Q, t) => { const m = pt(P, Q, t), u = un(P, Q), v = [-u[1], u[0]]; return [-3, 3].map(o => lN([m[0] + u[0] * o - v[0] * 5, m[1] + u[1] * o - v[1] * 5], [m[0] + u[0] * o + v[0] * 5, m[1] + u[1] * o + v[1] * 5], '#111', 1.8)).join(''); };
    return `<polygon points="${A} ${D} ${C} ${B}" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>` + lN(ML, MR, '#111', 2.2) + dT(pt(A, B, .22), '#111', 3.4) + dT(pt(A, B, .74), '#111', 3.4) + tk(D, C, .25) + tk(D, C, .75) + tX(B[0] - 9, B[1] - 3, 'B', '#111', 11) + tX(C[0] + 9, C[1] - 3, 'C', '#111', 11) + tX(A[0] - 2, A[1] + 13, 'A', '#111', 11) + tX(D[0] + 6, D[1] + 13, 'D', '#111', 11) + tX(60, 12, 'a', '#111', 11) + tX(60, 116, 'b', '#111', 11) + tX(60, 76, 'x', '#111', 11) + bx(126, 40) + tX(138, 64, 'x =', '#111', 13) + frc(172, 62, 'a + b', '2', 19);
})();
const T2 = (() => {
    const A = [6, 104], D = [114, 104], B = [30, 18], C = [90, 18], M = [48, 61], N = [72, 61];
    return `<polygon points="${A} ${D} ${C} ${B}" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>` + lN(A, C, '#111', 2.2) + lN(B, D, '#111', 2.2) + lN(M, N, '#111', 2.2) + dT(M, '#111', 3.4) + dT(N, '#111', 3.4) + tX(M[0] - 9, M[1] + 4, 'M', '#111', 11) + tX(N[0] + 9, N[1] + 4, 'N', '#111', 11) + tX(60, 12, 'a', '#111', 11) + tX(60, 117, 'b', '#111', 11) + tX(60, 76, 'x', '#111', 10) + bx(130, 40) + tX(142, 64, 'x =', '#111', 13) + frc(174, 62, 'b − a', '2', 19);
})();
GAL.push(['Mediana del trapecio', 'x = (a + b) ÷ 2', 'Une los puntos medios de los lados no paralelos', '#7c3aed', T1], ['Segmento entre diagonales', 'x = (b − a) ÷ 2', 'M y N: puntos medios de las diagonales', '#0ea5e9', T2]);
const aa = (V, P) => (Math.atan2(-(P[1] - V[1]), P[0] - V[0]) / RD + 360) % 360, spn = (V, P1, P2) => {
    let a1 = aa(V, P1), a2 = aa(V, P2);
    if (((a2 - a1 + 360) % 360) > 180)
        [a1, a2] = [a2, a1];
    return [a1, ((a2 - a1 + 360) % 360)];
}, angA = (V, P1, P2, r, c = '#111') => { const [a1, d] = spn(V, P1, P2); return cir(V[0], V[1], r).a(a1, a1 + d, c, 1.7); }, angL = (V, P1, P2, r, t, c = '#111', z = 12) => { const [a1, d] = spn(V, P1, P2), m = (a1 + d / 2) * RD; return tX(V[0] + r * Math.cos(m), V[1] - r * Math.sin(m) + 4, t, c, z); }, PK2 = '<tspan fill="#d6336c">', fbx = (x, y, w, h, html, z = 11, st = '#2563eb') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#eef4ff" stroke="${st}" stroke-width="1.6"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" font-size="${z}" font-weight="700" fill="#111" text-anchor="middle">${html}</text>`, TP = (P) => `<polygon points="${P.join(' ')}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`, SF = "font-family='Georgia,serif' font-style='italic'", ts = (x, y, t, z = 11, c = '#111') => `<text x="${x}" y="${y}" font-size="${z}" font-weight="700" fill="${c}" text-anchor="middle" font-family="Georgia,serif" font-style="italic">${t}</text>`;
const TZ = (() => {
    const A = [30, 62], D = [170, 62], B = [65, 12], C = [135, 12];
    return `<g transform="translate(0,6)"><polygon points="${A} ${D} ${C} ${B}" fill="#e6e6ff" stroke="#0000ff" stroke-width="2.4" stroke-linejoin="round"/>` + `<line x1="135" y1="12" x2="135" y2="62" stroke="#ff0000" stroke-width="2" stroke-dasharray="1.2 3" stroke-linecap="round"/><rect x="135" y="54" width="8" height="8" fill="#f87171" stroke="#ff0000" stroke-width="1.6"/>` + ts(100, 8, 'b₁', 12) + ts(100, 76, 'b₂', 12) + ts(122, 40, 'h', 12) + ts(60, 100, 'A =', 14) + `<line x1="88" y1="97" x2="150" y2="97" stroke="#111" stroke-width="1.4"/>` + ts(119, 93, '(b₁ + b₂)h', 11) + ts(119, 110, '2', 11) + '</g>';
})();
const TA = (() => { const A = [22, 70], B = [112, 70], C = [66, 12]; return `<polygon points="${A} ${B} ${C}" fill="#e6e6ff" stroke="#0000ff" stroke-width="2.4" stroke-linejoin="round"/><line x1="66" y1="12" x2="66" y2="70" stroke="#ff0000" stroke-width="2" stroke-dasharray="1.2 3" stroke-linecap="round"/><rect x="66" y="62" width="8" height="8" fill="#f87171" stroke="#ff0000" stroke-width="1.6"/>` + tX(67, 82, 'Base', '#0000ff', 11) + tX(82, 52, 'Altura', '#e67e22', 8) + tX(36, 100, 'Área =', '#1b2a41', 13) + tX(122, 94, 'Base x Altura', '#e67e22', 11) + `<line x1="80" y1="98" x2="166" y2="98" stroke="#1b2a41" stroke-width="1.6"/>` + tX(123, 113, '2', '#1b2a41', 13); })();
const T180 = (() => { const A = [34, 76], C = [166, 76], B = [100, 10]; return TP([A, C, B]) + angA(A, C, B, 14) + angA(C, B, A, 14) + angA(B, A, C, 12) + angL(A, C, B, 26, 'α') + angL(C, B, A, 26, 'β') + angL(B, A, C, 24, 'θ') + fbx(40, 90, 120, 24, `α ${PK2}+</tspan> β ${PK2}+</tspan> θ ${PK2}=</tspan> 180°`, 12); })();
const T3 = (() => { const A = [26, 74], B = [64, 12], C = [130, 74]; return `<line x1="10" y1="74" x2="190" y2="74" stroke="#111" stroke-width="2"/><line x1="26" y1="74" x2="64" y2="12" stroke="#111" stroke-width="2"/><line x1="64" y1="12" x2="130" y2="74" stroke="#111" stroke-width="2"/>` + angA(A, [190, 74], B, 14) + angA(B, A, C, 12) + angA(C, B, [190, 74], 15) + angL(A, [190, 74], B, 27, 'α') + angL(B, A, C, 26, 'β') + angL(C, B, [190, 74], 28, 'θ') + fbx(46, 92, 108, 22, `α ${PK2}+</tspan> β ${PK2}=</tspan> θ`, 12); })();
const T360 = (() => {
    const A = [58, 56], B = [100, 16], C = [142, 56], ex = (P, Q, l) => { const d = un(P, Q); return [Q[0] + d[0] * l, Q[1] + d[1] * l]; }, EA = ex(C, A, 30), EB = ex(A, B, 16), EC = ex(B, C, 24);
    return TP([A, B, C]) + lN(A, EA, '#111', 2) + lN(B, EB, '#111', 2) + lN(C, EC, '#111', 2) + angA(A, EA, B, 14) + angA(B, EB, C, 13) + angA(C, EC, A, 14) + angL(A, EA, B, 26, 'α') + angL(B, EB, C, 25, 'β') + angL(C, EC, A, 26, 'θ') + fbx(34, 98, 132, 18, `α ${PK2}+</tspan> β ${PK2}+</tspan> θ ${PK2}=</tspan> 360°`, 12);
})();
const TD = (() => { const A = [12, 74], B = [56, 16], C = [130, 74]; return TP([A, B, C]) + tX(26, 40, 'a', '#111', 12) + tX(100, 36, 'b', '#111', 12) + tX(71, 90, 'c', '#111', 12) + `<rect x="116" y="12" width="76" height="20" rx="6" fill="#fff" stroke="#888" stroke-width="1.5"/><text x="154" y="26" font-size="12" font-weight="700" fill="#111" text-anchor="middle">a &lt; b &lt; c</text>` + `<rect x="22" y="94" width="150" height="22" rx="6" fill="#eef4ff" stroke="#2563eb" stroke-width="1.6"/><text x="97" y="109" font-size="12" font-weight="700" fill="#111" text-anchor="middle">b − a ${PK2}&lt;</tspan> c ${PK2}&lt;</tspan> b + a</text>`; })();
const TPy = (() => { const A = [50, 14], B = [50, 76], C = [150, 76]; return TP([A, B, C]) + `<rect x="50" y="68" width="8" height="8" fill="none" stroke="#111" stroke-width="1.4"/>` + tX(38, 48, 'a', '#111', 12) + tX(100, 90, 'b', '#111', 12) + tX(110, 38, 'c', '#111', 12) + fbx(50, 96, 100, 20, `a² ${PK2}+</tspan> b² ${PK2}=</tspan> c²`, 12); })();
GAL[0][1] = 'α + β + θ = 180°';
GAL[0][4] = T180;
GAL[1][4] = TPy;
GAL[2][4] = TA;
GAL[3][1] = 'α + β = θ';
GAL[3][2] = 'θ es el ángulo exterior';
GAL[3][4] = T3;
GAL[9][1] = 'A = ((b₁ + b₂) × h) ÷ 2';
GAL[9][4] = TZ;
GAL.push(['Ángulos exteriores', 'α + β + θ = 360°', 'La suma de los 3 exteriores da una vuelta', '#16a34a', T360], ['Desigualdad triangular', 'b − a < c < b + a', 'Cada lado es menor que la suma de los otros 2', '#f97316', TD]);
const TQ = (() => { const BL = [22, 66], BR = [128, 66], TR = [154, 18], TL = [48, 18]; return `<polygon points="${BL} ${BR} ${TR} ${TL}" fill="none" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>` + ts(62, 33, 'α', 13) + ts(142, 33, 'θ', 13) + ts(38, 60, 'β', 13) + ts(114, 60, 'δ', 13) + ts(88, 99, 'δ + θ + β + α = 360°', 14); })();
const TC = (() => { const A = [24, 72], B = [100, 16], C = [176, 72], D = [100, 60], R = '#e11d48'; return `<polygon points="${A} ${B} ${C} ${D}" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linejoin="round"/>` + angA(A, B, D, 12, R) + angA(B, A, C, 11, R) + angA(C, B, D, 12, R) + angA(D, A, C, 9, R) + angL(A, B, D, 24, 'α') + angL(B, A, C, 22, 'β') + angL(C, B, D, 24, 'θ') + angL(D, A, C, 19, 'x') + tX(14, 82, 'A', '#111', 11) + tX(100, 12, 'B', '#111', 11) + tX(186, 82, 'C', '#111', 11) + tX(100, 50, 'D', '#111', 11) + fbx(46, 92, 108, 22, `x ${PK2}=</tspan> α + β + θ`, 13); })();
GAL[4][1] = 'δ + θ + β + α = 360°';
GAL[4][2] = 'Los 4 ángulos interiores suman 360°';
GAL[4][4] = TQ;
GAL.push(['Cuadrilátero cóncavo', 'x = α + β + θ', 'Cuadrilátero no convexo: x es el ángulo en D', '#e11d48', TC]);
{
    const O = '#f97316', OF = '#fde4c8', N = '#0f2a4a', G = '#15803d', GF2 = '#d3f0dd', tx = (x, y, t, z, c) => `<text x="${x}" y="${y}" font-size="${z}" font-weight="700" fill="${c}" text-anchor="middle">${t}</text>`, cy = (cx, top, bot, rx, ry, col, fl, tf = '#fff') => `<path d="M${cx - rx} ${top}V${bot}A${rx} ${ry} 0 0 0 ${cx + rx} ${bot}V${top}Z" fill="${fl}"/><path d="M${cx - rx} ${bot}A${rx} ${ry} 0 0 1 ${cx + rx} ${bot}" fill="none" stroke="${col}" stroke-width="1.6" stroke-dasharray="4 3"/><path d="M${cx - rx} ${top}V${bot}A${rx} ${ry} 0 0 0 ${cx + rx} ${bot}V${top}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${tf}" stroke="${col}" stroke-width="2.2"/>`, ar = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2 - 6}" y2="${y}" stroke="${N}" stroke-width="2.4"/><polygon points="${x2 - 9},${y - 5} ${x2},${y} ${x2 - 9},${y + 5}" fill="${N}"/>`, mk = a => { a.cat = 'cil'; return a; };
    const CS1 = cy(38, 26, 78, 26, 8, O, OF) + ar(74, 101, 56) + `<rect x="108" y="34" width="84" height="44" fill="${OF}" stroke="${O}" stroke-width="2.4"/>` + tx(150, 60, '2πr × h', 12, O) + tx(168, 26, 'alto = h', 9, N) + tx(150, 92, 'largo = 2πr', 9, N);
    const CS2 = `<circle cx="24" cy="30" r="17" fill="${GF2}" stroke="${G}" stroke-width="2.2"/><circle cx="24" cy="80" r="17" fill="${GF2}" stroke="${G}" stroke-width="2.2"/>` + tx(24, 33, 'tapa', 9, G) + tx(24, 83, 'fondo', 9, G) + tx(52, 62, '+', 20, N) + cy(84, 28, 84, 20, 7, O, OF) + ar(110, 128, 56) + `<rect x="134" y="38" width="60" height="36" fill="${OF}" stroke="${O}" stroke-width="2.4"/>` + tx(164, 60, '2πr × h', 10, O) + tx(172, 30, 'alto = h', 8, N) + tx(164, 88, 'largo = 2πr', 8.5, N);
    const CS3 = cy(104, 22, 96, 40, 11, G, GF2, '#e9f8ef') + [38, 54, 70, 86].map(y => `<path d="M64 ${y}A40 11 0 0 0 144 ${y}" fill="none" stroke="${G}" stroke-width="1.4"/>`).join('') + `<line x1="30" y1="26" x2="30" y2="92" stroke="${O}" stroke-width="2.4"/><polygon points="30,18 25,28 35,28" fill="${O}"/><polygon points="30,100 25,90 35,90" fill="${O}"/>` + tx(14, 66, 'h', 15, O);
    GAL.push(mk(['Cilindro · Área lateral', 'AL = 2π·r·h', 'Se desarrolla en un rectángulo: largo 2πr y alto h', '#f97316', CS1]), mk(['Cilindro · Área total', 'AT = AL + 2 · A(base)', 'Área total = área lateral + 2 × área de la base (tapa y fondo)', '#0891b2', CS2]), mk(['Cilindro · Volumen', 'V = π · r² · h', 'Área de la base × altura', '#16a34a', CS3]));
}
{
    const O = '#f97316', OF = '#fde4c8', N = '#0f2a4a', tx = (x, y, t, z, c, st = '') => `<text x="${x}" y="${y}" font-size="${z}" font-weight="700" fill="${c}" text-anchor="middle" ${st}>${t}</text>`, IT = (x, y, t, z, c) => tx(x, y, t, z, c, 'font-style="italic" font-family="Georgia,serif"'), sb = s => `<tspan font-size="7" dy="2.5">${s}</tspan>`, up = s => `<tspan dy="-2.5">${s}</tspan>`, CB = () => `<path d="M10 86L46 12L82 86A36 11 0 0 1 10 86Z" fill="${OF}" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 86A36 11 0 0 1 82 86" fill="none" stroke="${O}" stroke-width="1.8" stroke-dasharray="4 3"/>`, RD = (l) => `<line x1="46" y1="86" x2="82" y2="86" stroke="${N}" stroke-width="2"/><circle cx="46" cy="86" r="2.6" fill="${N}"/>` + IT(65, 81, l, 11, N), HH = () => `<line x1="46" y1="14" x2="46" y2="86" stroke="${N}" stroke-width="2"/>` + IT(56, 52, 'h', 12, N), BX = (a, b) => `<rect x="100" y="14" width="94" height="36" rx="13" fill="${N}" stroke="#22d3ee" stroke-width="2"/>` + tx(147, 29, a, 8.3, '#fff') + tx(147, 42, b, 8.3, '#fff'), FB = (y, h) => `<rect x="98" y="${y}" width="98" height="${h}" rx="13" fill="#e8f2ff" stroke="#22d3ee" stroke-width="2"/><rect x="99.5" y="${y + 1.5}" width="95" height="${h - 3}" rx="12" fill="none" stroke="${N}" stroke-width="1.2"/>`, FT = (y, z, h) => `<text x="147" y="${y}" font-size="${z}" font-weight="700" fill="${N}" text-anchor="middle">${h}</text>`, mk = a => { a.cat = 'con'; return a; };
    const G1 = `<line x1="54" y1="8" x2="90" y2="82" stroke="${N}" stroke-width="1.6"/><line x1="51.3" y1="9.3" x2="56.7" y2="6.7" stroke="${N}" stroke-width="1.6"/><line x1="87.3" y1="83.3" x2="92.7" y2="80.7" stroke="${N}" stroke-width="1.6"/>` + IT(81, 42, 'g', 12, N);
    const C1 = CB() + G1 + RD('R') + BX('ÁREA LATERAL', 'DEL CONO') + FB(58, 36) + FT(80, 13, 'A' + sb('L') + up(' = π·R·g'));
    const C2 = CB() + G1 + RD('R') + BX('ÁREA TOTAL', 'DEL CONO') + FB(56, 48) + FT(73, 10.5, 'A' + sb('T') + up(' = A') + sb('L') + up(' + A') + sb('B')) + FT(90, 10.5, '= π·R·(g + R)');
    const C3 = CB() + HH() + RD('r') + BX('VOLUMEN', 'DEL CONO') + FB(58, 36) + FT(80, 12.5, 'V = ⅓ π·r²·h');
    const C4 = CB() + `<line x1="46" y1="12" x2="82" y2="86" stroke="#e8450a" stroke-width="3.4" stroke-linecap="round"/>` + HH() + RD('r') + IT(80, 42, 'g', 12, '#e8450a') + BX('GENERATRIZ', 'DEL CONO') + FB(58, 36) + FT(80, 13, 'g² = r² + h²');
    GAL.push(mk(['Cono · Área lateral', 'AL = π·R·g', 'g es la generatriz y R el radio de la base', '#f97316', C1]), mk(['Cono · Área total', 'AT = AL + AB = π·R·(g + R)', 'Área lateral + área de la base (AB = π·R²)', '#0891b2', C2]), mk(['Cono · Volumen', 'V = ⅓·π·r²·h', 'Un tercio del volumen del cilindro', '#2563eb', C3]), mk(['Cono · Generatriz', 'g² = r² + h²', 'Pitágoras: g es la hipotenusa del triángulo con r y h', '#dc2626', C4]));
}
{
    const N = '#0f2a4a', tx = (x, y, t, z, c) => `<text x="${x}" y="${y}" font-size="${z}" font-weight="700" fill="${c}" text-anchor="middle">${t}</text>`, sb = s => `<tspan font-size="7" dy="2.5">${s}</tspan>`, up = s => `<tspan dy="-2.5">${s}</tspan>`, BX = (a, b) => `<rect x="100" y="14" width="94" height="36" rx="13" fill="${N}" stroke="#22d3ee" stroke-width="2"/>` + tx(147, 29, a, 7.2, '#fff') + tx(147, 42, b, 7.2, '#fff'), FB = `<rect x="98" y="58" width="98" height="36" rx="13" fill="#e8f2ff" stroke="#22d3ee" stroke-width="2"/><rect x="99.5" y="59.5" width="95" height="33" rx="12" fill="none" stroke="${N}" stroke-width="1.2"/>`, FT = h => `<text x="147" y="80" font-size="13" font-weight="700" fill="${N}" text-anchor="middle">${h}</text>`, SP = `<circle cx="50" cy="60" r="44" fill="#d4edf5" stroke="#1f78a8" stroke-width="2.4"/><ellipse cx="34" cy="36" rx="12" ry="8" fill="#fff" fill-opacity=".55"/><ellipse cx="50" cy="60" rx="44" ry="14" fill="#8fcf9c" fill-opacity=".75" stroke="#15803d" stroke-width="1.6"/><line x1="50" y1="60" x2="86" y2="60" stroke="#e11d1d" stroke-width="2"/><polygon points="85,55.5 94,60 85,64.5" fill="#e11d1d"/><circle cx="50" cy="60" r="2.8" fill="${N}"/>` + tx(70, 55, 'R', 10, '#e11d1d'), mk = a => { a.cat = 'esf'; return a; };
    GAL.push(mk(['Esfera · Superficie', 'Se = 4π·R²', 'Superficie esférica (área de la esfera): 4 círculos máximos', '#0891b2', SP + BX('SUPERFICIE ESFÉRICA', '(ÁREA DE LA ESFERA)') + FB + FT('S' + sb('e') + up(' = 4πR²'))]), mk(['Esfera · Volumen', 'VE = ⁴⁄₃·π·R³', 'Volumen de la esfera de radio R', '#2563eb', SP + BX('VOLUMEN', 'DE LA ESFERA') + FB + FT('V' + sb('E') + up(' = ⁴⁄₃ πR³'))]));
}
const CAT = i => (GAL[i] && GAL[i].cat) || (i >= 33 ? 'cua' : i >= 31 ? 'tri' : i >= 29 ? 'tra' : i < 4 ? 'tri' : i < 12 ? 'otr' : 'cir'), CIN = (i, k) => !!(GAL[i] && GAL[i][4]) && (k == 'all' || CAT(i) == k || (k == 'tra' && i == 9) || (k == 'cua' && i >= 4 && i <= 9));
fc = function (it, s) {
    const c = GAL[it.i], H = s ? `<circle cx="${it.x + 200 * it.s}" cy="${it.y + (c[4] ? 196.7 : 90) * it.s}" r="11" fill="#2563eb" stroke="#fff" stroke-width="2.5"/>` : '';
    if (!c[4])
        return _fc(it, s) + H;
    const f = Math.min(20, 215 / (c[1].length * .6));
    return `<g transform="translate(${it.x} ${it.y}) scale(${it.s * .8333})"><rect width="240" height="236" rx="10" fill="#1a2740" stroke="${s ? '#2563eb' : c[3]}" stroke-width="${s ? 5 : 3}"/><path d="M0 120V10Q0 0 10 0H230Q240 0 240 10V120Z" fill="#f4f8ff"/><svg x="0" y="0" width="240" height="120" viewBox="0 0 200 120">${c[4]}</svg><rect y="120" width="240" height="28" fill="${c[3]}"/><text x="120" y="139" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${c[0]}</text><text x="120" y="182" text-anchor="middle" font-size="${f}" font-weight="700" fill="${it.c || c[3]}">${c[1]}</text><text x="120" y="212" text-anchor="middle" font-size="11" fill="#9fb0cc">${c[2]}</text></g>` + H;
};
$('gal').addEventListener('click', e => {
    const b = e.target.closest('[data-gf]');
    if (b) {
        GF = b.dataset.gf;
        ZI = -1;
        gal();
        $('gal').scrollTop = 0;
    }
});
function gz(i) { ZI = ZI == i ? -1 : i; gal(); }
gal = function () {
    const g = $('gal'), sy = g.scrollTop;
    g.style.display = 'block';
    putHTML(g, '<div style="background:#1f5fbf;color:#fff;padding:8px;display:flex;justify-content:space-between;position:sticky;top:0;z-index:2"><b>📚 Fórmulas · elige las que quieras</b><button data-gallery-close="true">✕ Cerrar</button></div><div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 10px 0">' + [['are', '📏 Áreas'], ['lin', '↗️ Líneas'], ['cir', '⭕ Círculo'], ['tri', '🔺 Triángulo'], ['cua', '◻️ Cuadriláteros'], ['otr', '◻️ Otras fórmulas'], ['tra', '🔷 Trapecio'], ['cil', '🛢️ Cilindro'], ['con', '🔻 Cono'], ['esf', '🔵 Esfera'], ['pol', '🧊 Poliedros'], ['all', '📚 Todas']].map(([k, v]) => '<button data-gf="' + k + '" style="font-weight:700;' + (GF == k ? 'background:#facc15;color:#222;border-color:#facc15;' : '') + '">' + v + ' (' + GAL.filter((_, i) => CIN(i, k)).length + ')</button>').join('') + '</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;padding:10px">' + GAL.map((c, i) => {
        if (!CIN(i, GF))
            return '';
        const on = S.gs.includes(i), z = ZI == i;
        return '<div data-gallery-select="' + i + '" style="position:relative;' + (z ? 'grid-column:1/-1;' : '') + 'background:#1a2740;color:#fff;border:3px solid ' + (on ? '#2563eb' : c[3]) + ';' + (on ? 'box-shadow:0 0 0 3px #2563eb;' : '') + 'border-radius:12px;cursor:pointer;overflow:hidden">' + (c[4] ? '<div style="background:#f4f8ff"><svg viewBox="0 0 200 120" style="display:block;width:100%;height:auto;' + (z ? 'max-height:60vh;' : '') + '">' + c[4] + '</svg></div><button data-gallery-zoom="' + i + '" style="position:absolute;top:6px;right:6px;background:#1a2740;color:#fff;border-color:#334">🔍</button>' : '') + (on ? '<span style="position:absolute;top:6px;left:8px;color:#2563eb;font-size:20px;font-weight:700">✓</span>' : '') + '<div style="background:' + c[3] + ';padding:6px 8px;font-weight:700;text-align:center">' + c[0] + '</div><div style="padding:10px;font-size:' + (z ? 34 : 21) + 'px;font-weight:700;text-align:center;color:' + c[3] + '">' + c[1] + '</div><div style="padding:0 10px 10px;color:#9fb0cc;font-size:12px;text-align:center">' + c[2] + '</div></div>';
    }).join('') + '</div><div style="position:sticky;bottom:0;background:var(--cd);padding:8px;display:flex;gap:10px;align-items:center"><span>' + S.gs.length + ' seleccionada(s)</span><button data-gallery-place="true" ' + (S.gs.length ? '' : 'disabled') + ' style="background:#16a34a;color:#fff">📌 Poner en la pizarra</button></div>');
    g.scrollTop = sy;
};
gp = function () { snapH(); const L1 = S.gs.length == 1; S.gs.sort((a, b) => a - b).forEach((i, n) => S.items.push(L1 ? { t: 'f', i, x: 380, y: 150, s: 1.5, id: geometryNewId() } : { t: 'f', i, x: 15 + (n % 5) * 195, y: 12 + Math.floor(n / 5) * 176, s: .85, id: geometryNewId() })); S.gs = []; S.sel = L1 ? S.items.length - 1 : -1; ZI = -1; $('gal').style.display = 'none'; ui(); };
/* ===== POLIEDROS v2 (colores por cara/arista/vértice, área lateral, fórmulas…) ===== */
var PY = (() => {
    const C = {}, G = {}, isG = () => true;
    const NM = ['Cubo', 'Tetraedro', 'Octaedro', 'Prisma triangular', 'Prisma pentagonal', 'Pirámide cuadrada', 'Pirámide pentagonal', 'Prisma 4-5-6 cm', 'Prisma 4×4, h = 10'];
    const DEF = { c: '#93c5fd', e: '#1f4fa8', l: '#E67E22', v: '#E0352B' }, LB = 'ABCDEFGHIJKL';
    const CARDS = [['Elementos', 'CARA · ARISTA · VÉRTICE', 'Pared · borde · esquina'], ['Fórmula de Euler', 'C + V = A + 2', 'Caras + Vértices = Aristas + 2'], ['Conteo del prisma', 'C = n+2 · V = 2n · A = 3n', 'Dos bases más n paredes'], ['Conteo de la pirámide', 'C = n+1 · V = n+1 · A = 2n', 'n paredes + 1 base'], ['Aristas de un regular', 'A = (C × lados) ÷ 2', 'Cada arista la comparten 2 caras'], ['Área lateral (prisma)', 'AL = P × h', 'Etiqueta de una lata'], ['Área total (prisma)', 'AT = AL + 2 × AB', 'Etiqueta + tapa + fondo'], ['Volumen (prisma)', 'V = AB × h', 'Pisos apilados'], ['Triángulo escondido', 'Ap² = h² + ap²', 'Ap = √(h² + ap²)'], ['Área lateral (pirámide)', 'AL = P × Ap ÷ 2', 'PAPÁ entre 2'], ['Área total (pirámide)', 'AT = AL + AB', 'Lados + piso'], ['Volumen (pirámide)', 'V = AB × h ÷ 3', '3 pirámides llenan 1 prisma'], ['Cuadrado de lado l', 'AB = l × l · P = 4l', 'Área y perímetro'], ['Rectángulo a × b', 'AB = a × b · P = 2(a+b)', 'Área y perímetro'], ['Triángulo (b, t)', 'AB = (b × t) ÷ 2', 'P = suma de 3 lados'], ['Ángulo plano', '∠BAC = a', '2 rayos con el mismo origen'], ['Ángulo diedro', 'a entre R y S', '2 semiplanos con la misma arista'], ['Etiqueta de la lata', 'AL = P × h', 'largo = perímetro (P) · alto = h'], ['Prisma 4-5-6 cm, h = 10', 'AL = 15 × 10 = 150 cm²', 'P = 4 + 5 + 6 = 15 cm'], ['Fórmula usada: Euler', 'C + V = A + 2 (Euler)', 'Fórmula usada'], ['Prisma 4×4, h = 10', 'AL = 16 × 10 = 160 cm²', 'P = 4 × 4 = 16 cm']];
    const BAND = ['#16a34a', '#f97316', '#7c3aed', '#2563eb', '#db2777', '#0d9488'];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], nr = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
    const hx = c => /^#[0-9a-f]{6}$/i.test(c) ? c : '#2563eb';
    function rot(p, a, b, t) { const k = nr(sub(b, a)), v = sub(p, a), c = Math.cos(t), s = Math.sin(t), kv = cr(k, v), d = dot(k, v) * (1 - c); return [0, 1, 2].map(i => v[i] * c + kv[i] * s + k[i] * d + a[i]); }
    const ek = (a, b) => a < b ? a + '-' + b : b + '-' + a;
    /* ---------- geometría ---------- */
    function build(k) {
        let V, F, kind, n = 0;
        const ring = (m, R) => [...Array(m)].map((_, i) => [R * Math.cos(2 * Math.PI * i / m), R * Math.sin(2 * Math.PI * i / m)]), reg = m => ring(m, .5 / Math.sin(Math.PI / m));
        const idx = m => [...Array(m).keys()];
        const prism = (b, h) => {
            n = b.length;
            kind = 'p';
            V = [...b.map(p => [p[0], 0, p[1]]), ...b.map(p => [p[0], h, p[1]])];
            F = [idx(n), idx(n).map(i => i + n)];
            for (let i = 0; i < n; i++)
                F.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
        };
        const pyr = (b, h) => {
            n = b.length;
            kind = 'y';
            V = [...b.map(p => [p[0], 0, p[1]]), [0, h, 0]];
            F = [idx(n)];
            for (let i = 0; i < n; i++)
                F.push([i, (i + 1) % n, n]);
        };
        if (k == 0)
            prism(reg(4), 1);
        else if (k == 1)
            pyr(reg(3), .8165);
        else if (k == 2) {
            kind = 'r';
            const q = .7071;
            V = [[q, 0, 0], [-q, 0, 0], [0, q, 0], [0, -q, 0], [0, 0, q], [0, 0, -q]];
            F = [];
            for (const a of [0, 1])
                for (const b of [2, 3])
                    for (const c of [4, 5])
                        F.push([a, b, c]);
        }
        else if (k == 3)
            prism(reg(3), 1.6);
        else if (k == 4)
            prism(reg(5), 1.3);
        else if (k == 5)
            pyr(reg(4), 1.2);
        else if (k == 6)
            pyr(reg(5), 1.2);
        else if (k == 7) {
            const x = 27 / 8, y = Math.sqrt(36 - x * x);
            prism([[0, 0], [4, 0], [x, y]].map(p => [p[0] / 6, p[1] / 6]), 10 / 6);
        }
        else
            prism(reg(4), 2.5);
        const cen = V.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map(x => x / V.length);
        V = V.map(p => sub(p, cen));
        const N = F.map((f, i) => {
            let nn = [0, 0, 0];
            f.forEach((v, j) => { const a = V[v], b = V[f[(j + 1) % f.length]]; nn = [nn[0] + (a[1] - b[1]) * (a[2] + b[2]), nn[1] + (a[2] - b[2]) * (a[0] + b[0]), nn[2] + (a[0] - b[0]) * (a[1] + b[1])]; });
            const c = f.reduce((s, v) => [s[0] + V[v][0], s[1] + V[v][1], s[2] + V[v][2]], [0, 0, 0]);
            if (dot(nn, c) < 0) {
                F[i] = [...f].reverse();
                nn = nn.map(x => -x);
            }
            return nr(nn);
        });
        const em = {};
        F.forEach((f, i) => f.forEach((v, j) => { const key = ek(v, f[(j + 1) % f.length]); (em[key] = em[key] || []).push(i); }));
        const E = Object.keys(em).map(key => { const [a, b] = key.split('-').map(Number); const t = (kind == 'p' && b - a == n) || (kind == 'y' && b == n && k > 1) ? 'l' : 'e'; return { k: key, a, b, t, nm: LB[a] + LB[b] }; });
        const root = kind == 'p' ? 2 + Math.floor(n / 2) : 0, tree = {}, order = [root];
        tree[root] = { p: -1 };
        const okp = (f, c) => {
            if (kind != 'p')
                return true;
            if (c < 2)
                return f == root;
            if (f < 2)
                return false;
            const m = root - 2;
            return Math.abs(c - 2 - m) == Math.abs(f - 2 - m) + 1;
        };
        for (let q = 0; q < order.length; q++) {
            const f = order[q];
            F[f].forEach((v, j) => {
                const key = ek(v, F[f][(j + 1) % F[f].length]);
                em[key].forEach(c => {
                    if (tree[c] || !okp(f, c))
                        return;
                    const [a, b] = key.split('-').map(Number);
                    const ph = Math.acos(Math.max(-1, Math.min(1, dot(N[f], N[c]))));
                    const A = V[a], B = V[b];
                    const r = s => dot(sub(rot(N[c], [0, 0, 0], sub(B, A), s * ph), [0, 0, 0]), N[f]);
                    tree[c] = { p: f, a, b, ang: (r(1) > r(-1) ? 1 : -1) * ph };
                    order.push(c);
                });
            });
        }
        const nn = N[root], seed = Math.abs(nn[1]) > .9 ? [0, 0, 1] : [0, 1, 0], e2 = nr(sub(seed, nn.map(x => x * dot(seed, nn)))), e1 = cr(e2, nn);
        return { V, F, N, E, kind, n, root, tree, order, Mt: [e1, e2, nn], reg: k < 3 && k != 0 && k != 3 ? 0 : 0 };
    }
    function tfs(g, u) {
        const T = [];
        g.order.forEach(f => {
            const t = g.tree[f];
            if (t.p < 0) {
                T[f] = p => p;
                return;
            }
            const tp = T[t.p], a = g.V[t.a], b = g.V[t.b], an = t.ang * u;
            T[f] = p => tp(rot(p, a, b, an));
        });
        return T;
    }
    const gm = o => G[o.k] || (G[o.k] = build(o.k));
    /* ---------- dibujo del poliedro ---------- */
    function poly(o, sel) {
        const g = gm(o), u = o.u, sc = 90 * o.s, y = o.yaw * Math.PI / 180, p = o.pit * Math.PI / 180, cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p);
        let M = [[cy, 0, -sy], [-sp * sy, cp, -sp * cy], [cp * sy, sp, cp * cy]];
        if (u > 0) {
            M = M.map((r, i) => r.map((v, j) => v * (1 - u) + g.Mt[i][j] * u));
            const a = nr(M[0]);
            const b = nr(sub(M[1], a.map(v => v * dot(M[1], a))));
            M = [a, b, cr(a, b)];
        }
        const Tf = tfs(g, u);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        const FS = g.F.map((f, i) => { const P3 = f.map(v => Tf[i](g.V[v])); const S2 = P3.map(q => [dot(M[0], q) * sc, -dot(M[1], q) * sc]); S2.forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }); return { i, S: S2, z: P3.reduce((s, q) => s + dot(M[2], q), 0) / P3.length }; });
        const ox = o.x - u * (x0 + x1) / 2, oy = o.y - u * (y0 + y1) / 2;
        FS.forEach(f => f.S = f.S.map(q => [q[0] + ox, q[1] + oy]));
        x0 += ox;
        x1 += ox;
        y0 += oy;
        y1 += oy;
        const unf = u > .02, pj = { F: FS.map(f => ({ i: f.i, pts: f.S, z: f.z })), E: [], P: null };
        const pz = unf && g.kind == 'p', co = o.co, col = (t) => co[t] || DEF[t], isBase = i => g.kind == 'p' && i < 2, pts = a => a.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
        let h = '';
        [...FS].sort((a, b) => a.z - b.z).forEach(f => {
            const i = f.i, own = o.fc[i];
            const fill = !o.on.c ? 'none' : own || (unf ? (pz ? (isBase(i) ? '#c9bdf5' : '#bfe3f7') : isBase(i) ? '#86efac' : '#fdba74') : o.rb ? `hsl(${i * 360 / g.F.length},75%,62%)` : col('c'));
            let op = unf ? (pz ? .95 : .8) : (own || o.rb) ? .75 : .5;
            if (o.lat == 1 && isBase(i))
                op *= 1 - u;
            h += `<polygon points="${pts(f.S)}" fill="${fill}" fill-opacity="${op}" stroke="${unf ? (pz ? 'var(--tx)' : isBase(i) ? '#16a34a' : '#f28c28') : 'none'}" stroke-width="${pz ? 2.5 : 2}" stroke-opacity="${o.lat == 1 && isBase(i) ? 1 - u : 1}" stroke-linejoin="round"/>`;
        });
        const ecol = e => o.ec[e.k] || col(e.t);
        if (!unf) {
            const P = g.V.map(v => [dot(M[0], v) * sc + ox, -dot(M[1], v) * sc + oy]);
            pj.P = P;
            g.E.forEach(e => {
                const l = { x1: P[e.a][0], y1: P[e.a][1], x2: P[e.b][0], y2: P[e.b][1], k: e.k };
                pj.E.push(l);
                if (o.on[e.t] || o.ec[e.k] && 0)
                    h += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${ecol(e)}" stroke-width="3" stroke-linecap="round"/>`;
            });
            if (o.on.v)
                P.forEach((q, i) => {
                    h += `<circle cx="${q[0]}" cy="${q[1]}" r="5.5" fill="${o.vc[i] || col('v')}"/>`;
                    if (S.nm)
                        h += `<text x="${q[0] + 8}" y="${q[1] - 8}" font-size="15" font-weight="700" fill="var(--tx)">${LB[i]}</text>`;
                });
        }
        else {
            const lt = {};
            g.E.forEach(x => {
                if (x.t == 'l')
                    lt[x.k] = 1;
            });
            g.F.forEach((fv, i) => fv.forEach((v, j) => {
                const w = fv[(j + 1) % fv.length], kk = ek(v, w), e = o.ec[kk] || (pz && o.on.l && lt[kk] ? col('l') : null);
                if (e) {
                    const a = FS[i].S[j], b = FS[i].S[(j + 1) % fv.length];
                    h += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${e}" stroke-width="3" stroke-linecap="round"/>`;
                }
            }));
            if (u >= .98 && g.kind == 'p') {
                let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
                const lat = FS.filter(f => f.i > 1);
                lat.forEach(f => f.S.forEach(q => { a0 = Math.min(a0, q[0]); a1 = Math.max(a1, q[0]); b0 = Math.min(b0, q[1]); b1 = Math.max(b1, q[1]); }));
                if (o.lat != 1) {
                    const bs = FS.filter(f => f.i < 2).map(f => ({ c: f.S.reduce((s, q) => [s[0] + q[0] / f.S.length, s[1] + q[1] / f.S.length], [0, 0]) })).sort((p, q) => p.c[1] - q.c[1]), pn = ['triángulo', 'cuadrado', 'pentágono'][g.n - 3] || 'polígono', lab = (x, y, t1, t2, tx, ty, cl) => {
                        const w = Math.max(t1.length, t2.length) * 8.8 + 24;
                        x = Math.min(x, 994 - w);
                        const cx = x + w / 2, dx = tx - x, dy = ty - y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, qx = (x + tx) / 2, qy = y - 26, ax = tx - qx, ay = ty - qy, al = Math.hypot(ax, ay) || 1, vx = ax / al, vy = ay / al;
                        return `<path d="M${x},${y} Q${qx},${qy} ${tx},${ty}" fill="none" stroke="${cl}" stroke-width="2.5"/><polygon points="${tx},${ty} ${tx - vx * 13 - vy * 6},${ty - vy * 13 + vx * 6} ${tx - vx * 13 + vy * 6},${ty - vy * 13 - vx * 6}" fill="${cl}"/><rect x="${x}" y="${y - 23}" width="${w}" height="46" rx="12" fill="#f4f0ff" stroke="${cl}" stroke-width="2.5"/><text x="${x + w / 2}" y="${y - 3}" font-size="14" font-weight="700" fill="#1e1b4b" text-anchor="middle">${t1}</text><text x="${x + w / 2}" y="${y + 15}" font-size="14" font-weight="700" fill="#1e1b4b" text-anchor="middle">${t2}</text>`;
                    };
                    if (bs.length == 2) {
                        h += lab(bs[0].c[0] + 105, bs[0].c[1] - 28, 'Base superior', '(' + pn + ')', bs[0].c[0] + 18, bs[0].c[1] - 6, '#6d28d9');
                        h += lab(bs[1].c[0] + 105, bs[1].c[1] + 28, 'Base inferior', '(' + pn + ')', bs[1].c[0] + 18, bs[1].c[1] + 6, '#6d28d9');
                    }
                    h += lab(a1 + 16, (b0 + b1) / 2, 'Cara lateral', '(' + g.n + ' rectángulos)', a1 - 34, (b0 + b1) / 2 + 8, '#2563eb');
                }
                const yb = Math.max(y1, b1) + 14, ms = !o.hide && o.k > 6, pm = o.k == 7 ? 'P = 4 + 5 + 6 = 15 cm' : o.k == 8 ? 'P = 4 × 4 = 16 cm' : 'P = n × l', hm = ms ? 'h = 10 cm' : 'h';
                h += `<path d="M${a0 - 6},${b0} H${a0 - 14} V${b1} H${a0 - 6}" fill="none" stroke="#E0352B" stroke-width="2"/><text x="${a0 - 18}" y="${(b0 + b1) / 2}" fill="#E0352B" font-weight="700" font-size="14" text-anchor="end">${hm}</text>` +
                    `<path d="M${a0},${yb - 6} V${yb} H${a1} V${yb - 6}" fill="none" stroke="#1f4fa8" stroke-width="2"/><text x="${(a0 + a1) / 2}" y="${yb + 16}" fill="#1f4fa8" font-weight="700" font-size="14" text-anchor="middle">${ms || o.k < 7 ? pm : 'P'}</text>`;
                if (o.lat == 1)
                    h += `<text x="${(a0 + a1) / 2}" y="${(b0 + b1) / 2 + 5}" fill="#b45309" font-weight="700" font-size="15" text-anchor="middle">Área lateral = P × h</text>`;
            }
        }
        const tf = o.tf;
        if (tf) {
            if (tf.t == 'f')
                h += `<polygon points="${pts(FS[tf.i].S)}" fill="none" stroke="#1f5fbf" stroke-width="3" stroke-dasharray="6 4"/>`;
            else if (tf.t == 'e' && pj.E.length) {
                const l = pj.E.find(e => e.k == tf.k);
                if (l)
                    h += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#1f5fbf" stroke-opacity=".4" stroke-width="9" stroke-linecap="round"/>`;
            }
            else if (tf.t == 'v' && pj.P)
                h += `<circle cx="${pj.P[tf.i][0]}" cy="${pj.P[tf.i][1]}" r="10" fill="none" stroke="#1f5fbf" stroke-width="3"/>`;
        }
        if (!o.hide)
            h += `<text x="${(x0 + x1) / 2}" y="${y1 + (unf ? 38 : 28)}" font-size="18" font-weight="700" fill="#d97706" text-anchor="middle">C = ${g.F.length} · V = ${g.V.length} · A = ${g.E.length} · C + V = A + 2</text>`;
        C[o.id] = { pj, bb: [x0 - 14, y0 - 14, x1 + 14, y1 + 14] };
        if (sel)
            h += `<rect x="${x0 - 14}" y="${y0 - 14}" width="${x1 - x0 + 28}" height="${y1 - y0 + 28}" fill="none" stroke="#1f5fbf" stroke-width="2" stroke-dasharray="6 4"/>`;
        return h;
    }
    function dseg(x, y, a, b, c, d) { const dx = c - a, dy = d - b, l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - a) * dx + (y - b) * dy) / l)); return Math.hypot(x - (a + t * dx), y - (b + t * dy)); }
    function inP(P, x, y) {
        let r = false;
        for (let i = 0, j = P.length - 1; i < P.length; j = i++)
            if ((P[i][1] > y) != (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])
                r = !r;
        return r;
    }
    function pick(o, x, y) {
        const pj = (C[o.id] || {}).pj;
        if (!pj)
            return;
        const k = sv.getScreenCTM().a;
        if (pj.P) {
            let b = null, bd = 14 / k;
            pj.P.forEach((p, i) => {
                const d = Math.hypot(p[0] - x, p[1] - y);
                if (d < bd) {
                    bd = d;
                    b = i;
                }
            });
            if (b != null && o.on.v) {
                o.tf = { t: 'v', i: b };
                return;
            }
        }
        let be = null, bd = 8 / k;
        pj.E.forEach(e => {
            const d = dseg(x, y, e.x1, e.y1, e.x2, e.y2);
            if (d < bd) {
                bd = d;
                be = e.k;
            }
        });
        if (be) {
            o.tf = { t: 'e', k: be };
            return;
        }
        let bf = null, bz = -1e9;
        pj.F.forEach(f => {
            if (inP(f.pts, x, y) && f.z > bz) {
                bz = f.z;
                bf = f.i;
            }
        });
        o.tf = bf == null ? null : { t: 'f', i: bf };
    }
    function msg(o) {
        if (isG(o)) {
            const g = gm(o), n = NM[o.k].toLowerCase(), t = o.tf;
            if (t)
                return `Pintando ${t.t == 'f' ? 'la Cara ' + (t.i + 1) : t.t == 'e' ? 'la arista ' + LB[+t.k.split('-')[0]] + LB[+t.k.split('-')[1]] : 'el vértice ' + LB[t.i]}: elige un color de la paleta. Toca otra cara, arista o vértice para cambiar de objetivo.`;
            if (o.hide)
                return `¿Cuántas caras, vértices y aristas crees que tiene el ${n}? Cuéntalas girándolo y al final pulsa «Comprobar conteo».`;
            const C = g.F.length, V = g.V.length, A = g.E.length;
            return `${NM[o.k]}: ${C} + ${V} = ${C + V} y ${A} + 2 = ${A + 2}. ¡Euler se cumple! ` + (o.u >= .5 ? (o.lat == 1 && g.kind == 'p' ? 'Las caras laterales forman un rectángulo: largo P y alto h, AL = P × h.' : 'Así se ve su desarrollo plano.') : 'Prueba 🧩 Desarrollar' + (g.kind == 'p' ? ' o 📜 Área lateral.' : '.'));
        }
        return '';
    }
    const AFN = { c: 'Cara', e: 'Arista', l: 'Columna', v: 'Vértice' };
    const mk = (k, x, y) => ({ t: 'y', k, x, y, s: 1.2, yaw: -30, pit: 25, u: 0, on: { c: 1, e: 1, l: 1, v: 1 }, co: {}, rb: 0, hide: 1, fc: {}, vc: {}, ec: {}, lat: 2, tf: null, af: 'c' });
    const fromH = h => Object.assign(mk(h.k, h.x, h.y), { s: h.s || 1.2, yaw: h.yaw == null ? -30 : h.yaw, pit: h.pit == null ? 25 : h.pit, u: h.u || 0, id: h.id });
    const lab = o => { const t = o.tf; return 'Pintar: ' + (t ? (t.t == 'f' ? 'Cara ' + (t.i + 1) : t.t == 'e' ? 'Arista ' + LB[+t.k.split('-')[0]] + LB[+t.k.split('-')[1]] : 'Vértice ' + LB[t.i]) : AFN[o.af]); };
    function setC(o, v) {
        const t = o.tf;
        if (t) {
            if (t.t == 'f') {
                o.fc[t.i] = v;
                o.on.c = 1;
            }
            else if (t.t == 'v') {
                o.vc[t.i] = v;
                o.on.v = 1;
            }
            else {
                o.ec[t.k] = v;
                const e = gm(o).E.find(e => e.k == t.k);
                if (e)
                    o.on[e.t] = 1;
            }
        }
        else
            o.co[o.af] = v;
    }
    function ctx(o) {
        const g = gm(o), pr = g.kind == 'p', b = [];
        const sl = (l, k, mn, mx, v) => '<label>' + l + ' <input type="range" data-sl="' + k + '" min="' + mn + '" max="' + mx + '" value="' + v + '"></label>';
        const ci = 'style="width:26px;height:30px;padding:0;border:1px solid var(--bd);border-radius:6px"';
        b.push(sl('↻ Giro', 'yaw', -180, 180, Math.round(o.yaw)), sl('↕ Inclinación', 'pit', -90, 90, Math.round(o.pit)), sl('🧩 Desarrollar', 'u', 0, 100, Math.round(o.u * 100)));
        ['c', 'e', 'l', 'v'].forEach(t => {
            if (t == 'l' && o.k < 3)
                return;
            const c = o.co[t] || DEF[t];
            b.push('<span style="display:inline-flex;gap:2px"><button data-x="y:e:' + t + '" class="' + (o.on[t] ? 'on' : '') + '" style="border:2px solid ' + c + ';' + (o.af == t && !o.tf ? 'box-shadow:0 0 0 2px var(--pr)' : '') + '"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;background:' + c + '"></span>' + AFN[t] + '</button><input type="color" data-yg="' + t + '" value="' + hx(c) + '" ' + ci + '></span>');
        });
        b.push('<button data-x="y:rb" class="' + (o.rb ? 'on' : '') + '">🌈 Caras de colores</button>');
        b.push('<button data-x="y:hide" class="' + (o.hide ? '' : 'on') + '">' + (o.hide ? '👁 Comprobar conteo y medidas' : '🙈 Ocultar conteo y medidas') + '</button>');
        b.push('<button data-x="y:unf" class="on">▶ Desarrollar</button><button data-x="y:arm">↩ Armar de nuevo</button>');
        if (pr)
            b.push('<button data-x="y:lat1" class="' + (o.lat == 1 ? 'on' : '') + '">📜 Área lateral (rectángulo)</button><button data-x="y:lat2" class="' + (o.lat == 2 ? 'on' : '') + '">📦 Desarrollo con bases</button>');
        b.push('<button data-x="y:spin">🔄 Girar solo / ⏸</button><button data-x="y:top">⬆ Ver desde arriba</button><button data-x="y:home">⏮ Vista inicial</button>');
        b.push('<button data-x="y:twin">👯 Gemelo</button><button data-x="y:dn">➖</button><button data-x="y:up">➕</button><button data-x="y:orig">↺ Colores originales</button>');
        const mkc = (a, l, v) => '<span style="display:inline-flex;gap:2px;align-items:center"><b>' + l + '</b><input type="color" ' + a + ' value="' + hx(v) + '" ' + ci + '></span>';
        b.push('<div class="row" style="border:0;padding:0;width:100%"><b>Caras</b>' + g.F.map((_, i) => mkc('data-yf="' + i + '"', i + 1, o.fc[i] || o.co.c || DEF.c)).join('') + '</div>');
        b.push('<div class="row" style="border:0;padding:0;width:100%"><b>Vértices</b>' + g.V.map((_, i) => mkc('data-yv="' + i + '"', LB[i], o.vc[i] || o.co.v || DEF.v)).join('') + '</div>');
        b.push('<div class="row" style="border:0;padding:0;width:100%"><b>Aristas</b>' + g.E.map(e => mkc('data-ye="' + e.k + '"', e.nm, o.ec[e.k] || o.co[e.t] || DEF[e.t])).join('') + '</div>');
        return b;
    }
    function act(a, o) {
        const m = a.match(/^e:(.)$/);
        if (m) {
            const t = m[1];
            anStop();
            o.tf = null;
            o.af = t;
            o.on[t] = o.on[t] ? 0 : 1;
            return;
        }
        if (a == 'rb')
            o.rb = o.rb ? 0 : 1;
        else if (a == 'hide')
            o.hide = o.hide ? 0 : 1;
        else if (a == 'lat1') {
            anStop();
            o.lat = 1;
            o.u = 0;
        }
        else if (a == 'lat2') {
            anStop();
            o.lat = 2;
            o.u = 0;
        }
        else if (a == 'unf')
            anRun(() => { o.u = Math.min(1, o.u + .03); return o.u < 1; });
        else if (a == 'arm')
            anRun(() => { o.u = Math.max(0, o.u - .03); return o.u > 0; });
        else if (a == 'spin') {
            if (AN)
                anStop();
            else
                anRun(() => {
                    o.yaw += 3;
                    if (o.yaw > 180)
                        o.yaw -= 360;
                    return true;
                });
        }
        else if (a == 'top') {
            anStop();
            o.pit = 90;
        }
        else if (a == 'home') {
            anStop();
            o.yaw = -30;
            o.pit = 25;
            o.u = 0;
        }
        else if (a == 'fm') {
            const g = gm(o);
            const ids = g.kind == 'p' ? [0, 1, 2, 4, 5, 6, 7, 17].concat(o.k == 7 ? [18] : o.k == 8 ? [20] : []) : g.kind == 'y' && o.k > 2 ? [0, 1, 3, 8, 9, 10, 11] : [0, 1, 4];
            const Lf = o.x < 500;
            ids.forEach((id, j) => S.items.push({ t: 'f', i: PYBASE + id, x: (Lf ? 640 : 10) + (j % 2) * 175, y: 10 + Math.floor(j / 2) * 84, s: .85, id: geometryNewId() }));
        }
        else if (a == 'twin') {
            const c = JSON.parse(JSON.stringify(o));
            c.id = geometryNewId();
            c.x += 40;
            c.y += 30;
            c.tf = null;
            S.items.push(c);
            S.sel = S.items.length - 1;
        }
        else if (a == 'dn')
            o.s = Math.max(.5, o.s / 1.15);
        else if (a == 'up')
            o.s = Math.min(2.5, o.s * 1.15);
        else if (a == 'orig') {
            o.co = {};
            o.fc = {};
            o.vc = {};
            o.ec = {};
            o.tf = null;
            o.rb = 0;
        }
    }
    return { NM, CARDS, BAND, mk, fromH, msg, label: lab, setC, ctx, act,
        draw: (o, s) => poly(o, s), gm, bb: o => (C[o.id] || {}).bb, pickAt: (o, p) => pick(o, p.x, p.y) };
})();
var PYEU = GAL.length;
(() => { const a = ['Fórmula de Euler', 'C + V = A + 2', 'En todo poliedro convexo', '#0ea5e9', `<ellipse cx="35" cy="113" rx="31" ry="5" fill="#dbeafe"/><polygon points="35.3,35 6,48.6 6,102.6 19.9,116.3 50.6,116.3 64,102.6 64,48.3" fill="#aed6fb" fill-opacity=".8"/><line x1="35.3" y1="35" x2="6" y2="48.6" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="35.3" y1="35" x2="64" y2="48.3" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="6" y1="48.6" x2="19.9" y2="63.2" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="64" y1="48.3" x2="50.6" y2="63.2" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="19.9" y1="63.2" x2="50.6" y2="63.2" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="6" y1="102.6" x2="19.9" y2="116.3" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="19.9" y1="116.3" x2="50.6" y2="116.3" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="50.6" y1="116.3" x2="64" y2="102.6" stroke="#0b2a5b" stroke-width="1.3" stroke-linecap="round" /><line x1="6" y1="48.6" x2="6" y2="102.6" stroke="#f97316" stroke-width="1.7" stroke-linecap="round" /><line x1="19.9" y1="63.2" x2="19.9" y2="116.3" stroke="#f97316" stroke-width="1.7" stroke-linecap="round" /><line x1="50.6" y1="63.2" x2="50.6" y2="116.3" stroke="#f97316" stroke-width="1.7" stroke-linecap="round" /><line x1="64" y1="48.3" x2="64" y2="102.6" stroke="#f97316" stroke-width="1.7" stroke-linecap="round" /><line x1="6" y1="102.6" x2="35.3" y2="88.8" stroke="#1d6fd6" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="2.2 1.6"/><line x1="35.3" y1="88.8" x2="64" y2="102.6" stroke="#1d6fd6" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="2.2 1.6"/><circle cx="35.3" cy="35" r="2.4" fill="#7c1fd1"/><circle cx="35.3" cy="35" r=".95" fill="#fff"/><circle cx="6" cy="48.6" r="2.4" fill="#7c1fd1"/><circle cx="6" cy="48.6" r=".95" fill="#fff"/><circle cx="64" cy="48.3" r="2.4" fill="#7c1fd1"/><circle cx="64" cy="48.3" r=".95" fill="#fff"/><circle cx="19.9" cy="63.2" r="2.4" fill="#7c1fd1"/><circle cx="19.9" cy="63.2" r=".95" fill="#fff"/><circle cx="50.6" cy="63.2" r="2.4" fill="#7c1fd1"/><circle cx="50.6" cy="63.2" r=".95" fill="#fff"/><circle cx="6" cy="102.6" r="2.4" fill="#7c1fd1"/><circle cx="6" cy="102.6" r=".95" fill="#fff"/><circle cx="64" cy="102.6" r="2.4" fill="#7c1fd1"/><circle cx="64" cy="102.6" r=".95" fill="#fff"/><circle cx="19.9" cy="116.3" r="2.4" fill="#7c1fd1"/><circle cx="19.9" cy="116.3" r=".95" fill="#fff"/><circle cx="50.6" cy="116.3" r="2.4" fill="#7c1fd1"/><circle cx="50.6" cy="116.3" r=".95" fill="#fff"/><g stroke="#facc15" stroke-width="1.4" stroke-linecap="round"><line x1="34" y1="9" x2="40" y2="11"/><line x1="33" y1="16" x2="40" y2="16.5"/><line x1="35" y1="23" x2="40" y2="21"/></g><rect x="44" y="4" width="152" height="26" rx="13" fill="#0b2a5b" stroke="#22d3ee" stroke-width="2"/><text x="120" y="17" font-size="11.5" font-weight="800" fill="#fff" text-anchor="middle">FÓRMULA DE EULER</text><text x="120" y="26" font-size="7.6" fill="#cfeeff" text-anchor="middle">(un superpoder)</text><rect x="70" y="34" width="124" height="13" rx="6.5" fill="#cfe8fb" stroke="#a9d4f5" stroke-width=".8"/><text x="132" y="43.4" font-size="7.6" fill="#0b2a5b" text-anchor="middle">En todo <tspan font-weight="800">poliedro convexo</tspan>:</text><rect x="68" y="51" width="128" height="30" rx="14" fill="#eaf6ff" stroke="#0ea5e9" stroke-width="2.4"/><text x="132" y="72.5" font-size="17" font-weight="800" font-style="italic" fill="#0b2a5b" text-anchor="middle">C + V = A + 2</text><rect x="72" y="85" width="120" height="12" rx="6" fill="#fff3d1" stroke="#f6cf70" stroke-width=".8"/><text x="132" y="93.3" font-size="6.6" fill="#0b2a5b" text-anchor="middle">(Caras + Vértices = Aristas + 2)</text><rect x="66" y="100" width="132" height="15" rx="7.5" fill="#fff" stroke="#a5d5fb" stroke-width="1"/><rect x="70" y="102.5" width="10" height="10" rx="2.5" fill="#e9d5ff" stroke="#c084fc" stroke-width=".8"/><text x="75" y="110.3" font-size="7.4" font-weight="800" font-style="italic" fill="#0b2a5b" text-anchor="middle">C</text><text x="82" y="110.2" font-size="6.2" fill="#0b2a5b">= caras</text><rect x="107" y="102.5" width="10" height="10" rx="2.5" fill="#cfeeff" stroke="#7dd3fc" stroke-width=".8"/><text x="112" y="110.3" font-size="7.4" font-weight="800" font-style="italic" fill="#0b2a5b" text-anchor="middle">V</text><text x="119" y="110.2" font-size="6.2" fill="#0b2a5b">= vértices</text><rect x="155" y="102.5" width="10" height="10" rx="2.5" fill="#e9d5ff" stroke="#c084fc" stroke-width=".8"/><text x="160" y="110.3" font-size="7.4" font-weight="800" font-style="italic" fill="#0b2a5b" text-anchor="middle">A</text><text x="167" y="110.2" font-size="6.2" fill="#0b2a5b">= aristas</text>`]; a.cat = 'pol'; GAL.push(a); })();
var PYBASE = GAL.length;
PY.CARDS.forEach((c, i) => { const a = [c[0], c[1], c[2], PY.BAND[i % 6]]; a.cat = 'pol'; GAL.push(a); });
(() => { const a = ['Área del rectángulo', 'A = b · h', 'Largo por ancho', '#2563eb', `<g stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"><line x1="19" y1="14" x2="26" y2="17"/><line x1="17" y1="21.5" x2="26" y2="21.5"/><line x1="19" y1="29" x2="26" y2="26"/><line x1="181" y1="14" x2="174" y2="17"/><line x1="183" y1="21.5" x2="174" y2="21.5"/><line x1="181" y1="29" x2="174" y2="26"/></g><rect x="31" y="10" width="138" height="23" rx="11.5" fill="#0b2a5b" stroke="#22d3ee" stroke-width="2.2"/><text x="100" y="25" font-size="10.4" font-weight="800" fill="#fff" text-anchor="middle">ÁREA DEL RECTÁNGULO</text><rect x="18" y="45" width="86" height="39" fill="#bfe3fb" stroke="#0b1f5c" stroke-width="1.7"/><rect x="18.8" y="45.8" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><rect x="96.7" y="45.8" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><rect x="18.8" y="76.7" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><rect x="96.7" y="76.7" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><line x1="11" y1="50" x2="11" y2="80" stroke="#5b0fa8" stroke-width="1.3"/><polygon points="11,47 8.7,51.2 13.3,51.2" fill="#5b0fa8"/><polygon points="11,83 8.7,78.8 13.3,78.8" fill="#5b0fa8"/><text x="4" y="68" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#5b0fa8" text-anchor="middle">h</text><line x1="23" y1="91" x2="99" y2="91" stroke="#5b0fa8" stroke-width="1.3"/><polygon points="20,91 24.2,88.7 24.2,93.3" fill="#5b0fa8"/><polygon points="102,91 97.8,88.7 97.8,93.3" fill="#5b0fa8"/><text x="61" y="104" font-size="12" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#5b0fa8" text-anchor="middle">b</text><rect x="127" y="41" width="54" height="12" rx="6.0" fill="#bfe3fb"/><text x="154.0" y="49.64" font-size="7.4" font-weight="800" fill="#0b2a5b" text-anchor="middle">Fórmula:</text><rect x="111" y="56" width="86" height="25" rx="11.363636363636363" fill="#f3faff" stroke="#0ea5e9" stroke-width="2.2"/><text x="154" y="74" font-size="15" font-family="Georgia,Times New Roman,serif" font-style="italic" font-weight="800" fill="#0b2a5b" text-anchor="middle">A = b · h</text>`], b = ['Área del cuadrado', 'A = l²', 'Lado por lado', '#0d9488', `<g stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"><line x1="19" y1="14" x2="26" y2="17"/><line x1="17" y1="21.5" x2="26" y2="21.5"/><line x1="19" y1="29" x2="26" y2="26"/><line x1="181" y1="14" x2="174" y2="17"/><line x1="183" y1="21.5" x2="174" y2="21.5"/><line x1="181" y1="29" x2="174" y2="26"/></g><rect x="31" y="10" width="138" height="23" rx="11.5" fill="#0b2a5b" stroke="#22d3ee" stroke-width="2.2"/><text x="100" y="25" font-size="10.4" font-weight="800" fill="#fff" text-anchor="middle">ÁREA DEL CUADRADO</text><rect x="40" y="42" width="48" height="48" fill="#bfe3fb" stroke="#0b1f5c" stroke-width="1.7"/><rect x="40.8" y="42.8" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><rect x="80.7" y="42.8" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><rect x="40.8" y="82.7" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><rect x="80.7" y="82.7" width="6.5" height="6.5" fill="#e9d5ff" stroke="#7e22ce" stroke-width="1"/><line x1="31" y1="47" x2="31" y2="85" stroke="#5b0fa8" stroke-width="1.3"/><polygon points="31,44 28.7,48.2 33.3,48.2" fill="#5b0fa8"/><polygon points="31,88 28.7,83.8 33.3,83.8" fill="#5b0fa8"/><text x="20" y="70" font-size="12" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#5b0fa8" text-anchor="middle">l</text><line x1="44" y1="97" x2="84" y2="97" stroke="#5b0fa8" stroke-width="1.3"/><polygon points="41,97 45.2,94.7 45.2,99.3" fill="#5b0fa8"/><polygon points="87,97 82.8,94.7 82.8,99.3" fill="#5b0fa8"/><text x="64" y="112" font-size="12" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#5b0fa8" text-anchor="middle">l</text><rect x="111" y="48" width="58" height="12" rx="6.0" fill="#bfe3fb"/><text x="140.0" y="56.64" font-size="7.4" font-weight="800" fill="#0b2a5b" text-anchor="middle">Fórmula:</text><rect x="100" y="64" width="94" height="30" rx="13.636363636363635" fill="#f3faff" stroke="#0ea5e9" stroke-width="2.2"/><text x="147" y="86" font-size="17" font-family="Georgia,Times New Roman,serif" font-style="italic" font-weight="800" fill="#0b2a5b" text-anchor="middle">A = l<tspan dy="-6" font-size="10">2</tspan></text>`]; a.cat = 'cua'; b.cat = 'cua'; GAL.push(a, b); })();
S.nm = 1;
var PYS = 0;
listen(document,'input', e => {
    const t = e.target, d = t.dataset, o = S.items[S.sel];
    if (!d || !o || o.t != 'y')
        return;
    if (d.yg === undefined && d.yf === undefined && d.yv === undefined && d.ye === undefined)
        return;
    if (!PYS) {
        snapH();
        PYS = 1;
    }
    if (d.yg !== undefined) {
        o.co[d.yg] = t.value;
        o.af = d.yg;
        o.tf = null;
    }
    else if (d.yf !== undefined) {
        o.fc[d.yf] = t.value;
        o.on.c = 1;
        o.tf = { t: 'f', i: +d.yf };
    }
    else if (d.yv !== undefined) {
        o.vc[d.yv] = t.value;
        o.on.v = 1;
        o.tf = { t: 'v', i: +d.yv };
    }
    else {
        o.ec[d.ye] = t.value;
        const g = PY.gm(o).E.find(x => x.k == d.ye);
        if (g)
            o.on[g.t] = 1;
        o.tf = { t: 'e', k: d.ye };
    }
    draw();
});
listen(document,'change', e => {
    const d = e.target.dataset;
    if (d && (d.yg !== undefined || d.yf !== undefined || d.yv !== undefined || d.ye !== undefined)) {
        PYS = 0;
        ui();
    }
});
let PCS = 0, RO = 0;
/* ===== SECCIÓN ÁREAS (galería) ===== */
(() => {
    const N0 = GAL.length;
    {
        const a = ["Área del triángulo", "A = (b · h) ÷ 2", "Base por altura, entre 2", "#7c3aed"];
        a.push(`<rect width="200" height="120" fill="#fff"/><image href="/geometry-assets/formula-1.jpg" x="0" y="0" width="200" height="120" preserveAspectRatio="xMidYMid meet"/>`);
        a.cat = 'are';
        GAL.push(a);
    }
    {
        const a = ["Área del paralelogramo", "A = b · h", "Base por altura", "#2563eb"];
        a.push(`<rect width="200" height="120" fill="#fff"/><image href="/geometry-assets/formula-2.jpg" x="0" y="0" width="200" height="120" preserveAspectRatio="xMidYMid meet"/>`);
        a.cat = 'are';
        GAL.push(a);
    }
    {
        const a = ["Área del triángulo equilátero", "A = (√3 ÷ 4) · l²", "h = (√3 ÷ 2) · l", "#0d9488"];
        a.push(`<rect width="200" height="120" fill="#fff"/><image href="/geometry-assets/formula-3.jpg" x="0" y="0" width="200" height="120" preserveAspectRatio="xMidYMid meet"/>`);
        a.cat = 'are';
        GAL.push(a);
    }
    {
        const a = ["Área del rombo", "A = (D · d) ÷ 2", "Diagonal mayor por menor, entre 2", "#f97316"];
        a.push(`<rect width="200" height="120" fill="#fff"/><image href="/geometry-assets/formula-4.jpg" x="0" y="0" width="200" height="120" preserveAspectRatio="xMidYMid meet"/>`);
        a.cat = 'are';
        GAL.push(a);
    }
    {
        const a = ["Área del trapecio", "A = ((B + b) ÷ 2) · h", "Semisuma de las bases por la altura", "#db2777"];
        a.push(`<rect width="200" height="120" fill="#fff"/><image href="/geometry-assets/formula-5.jpg" x="0" y="0" width="200" height="120" preserveAspectRatio="xMidYMid meet"/>`);
        a.cat = 'are';
        GAL.push(a);
    }
    GAL.forEach((c, i) => {
        if (i < N0 && (c[0] == 'Área del círculo' || c[0] == 'Área del rectángulo' || c[0] == 'Área del cuadrado'))
            c.cat = 'are';
    });
})();
/* ===== GALERÍA: ángulos entre paralelas y transversal ===== */
(() => {
    {
        const a = ["Ángulos alternos internos", "θ = τ · ω = ε", "Dentro de las paralelas, en lados distintos de la transversal", "#f97316"];
        a.push(`<rect width="200" height="120" fill="#fff"/><path d="M115 38 L94.0 38.0 A21 21 0 0 0 103.2 55.4 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M85 82 L106.0 82.0 A21 21 0 0 0 96.8 64.6 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M115 38 L103.2 55.4 A21 21 0 0 0 136.0 38.0 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M85 82 L96.8 64.6 A21 21 0 0 0 64.0 82.0 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><line x1="16" y1="38" x2="184" y2="38" stroke="#1d4ed8" stroke-width="2"/><line x1="16" y1="82" x2="184" y2="82" stroke="#1d4ed8" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 38.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 38.0) rotate(180.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 82.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 82.0) rotate(180.0)" fill="#1d4ed8"/><line x1="64" y1="112.8" x2="136" y2="7.2" stroke="#0b1f5c" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(136.0 7.2) rotate(-55.7)" fill="#0b1f5c"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(64.0 112.8) rotate(124.3)" fill="#0b1f5c"/><text x="109.4" y="31.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">α</text><text x="128.3" y="35.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">β</text><text x="101.7" y="49.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">θ</text><text x="120.6" y="52.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ω</text><text x="79.4" y="75.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ε</text><text x="98.3" y="79.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">τ</text><text x="71.7" y="93.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">σ</text><text x="90.6" y="96.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">φ</text><text x="30" y="31" font-size="9" font-weight="800" fill="#1d4ed8">L₁</text><text x="30" y="75" font-size="9" font-weight="800" fill="#1d4ed8">L₂</text><text x="32" y="62" font-size="8" font-weight="800" fill="#0b2a5b">L₁ ∥ L₂</text>`);
        a.cat = "lin";
        GAL.push(a);
    }
    {
        const a = ["Ángulos alternos externos", "α = φ · σ = β", "Fuera de las paralelas, en lados distintos de la transversal", "#16a34a"];
        a.push(`<rect width="200" height="120" fill="#fff"/><path d="M115 38 L126.8 20.6 A21 21 0 0 0 94.0 38.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M85 82 L73.2 99.4 A21 21 0 0 0 106.0 82.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M85 82 L64.0 82.0 A21 21 0 0 0 73.2 99.4 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M115 38 L136.0 38.0 A21 21 0 0 0 126.8 20.6 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><line x1="16" y1="38" x2="184" y2="38" stroke="#1d4ed8" stroke-width="2"/><line x1="16" y1="82" x2="184" y2="82" stroke="#1d4ed8" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 38.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 38.0) rotate(180.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 82.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 82.0) rotate(180.0)" fill="#1d4ed8"/><line x1="64" y1="112.8" x2="136" y2="7.2" stroke="#0b1f5c" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(136.0 7.2) rotate(-55.7)" fill="#0b1f5c"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(64.0 112.8) rotate(124.3)" fill="#0b1f5c"/><text x="109.4" y="31.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">α</text><text x="128.3" y="35.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">β</text><text x="101.7" y="49.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">θ</text><text x="120.6" y="52.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ω</text><text x="79.4" y="75.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ε</text><text x="98.3" y="79.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">τ</text><text x="71.7" y="93.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">σ</text><text x="90.6" y="96.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">φ</text><text x="30" y="31" font-size="9" font-weight="800" fill="#1d4ed8">L₁</text><text x="30" y="75" font-size="9" font-weight="800" fill="#1d4ed8">L₂</text><text x="32" y="62" font-size="8" font-weight="800" fill="#0b2a5b">L₁ ∥ L₂</text>`);
        a.cat = "lin";
        GAL.push(a);
    }
    {
        const a = ["Ángulos correspondientes", "α = ε · β = τ", "σ = θ · φ = ω · misma posición en cada corte", "#2563eb"];
        a.push(`<rect width="200" height="120" fill="#fff"/><path d="M115 38 L126.8 20.6 A21 21 0 0 0 94.0 38.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M85 82 L96.8 64.6 A21 21 0 0 0 64.0 82.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M115 38 L136.0 38.0 A21 21 0 0 0 126.8 20.6 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M85 82 L106.0 82.0 A21 21 0 0 0 96.8 64.6 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M115 38 L94.0 38.0 A21 21 0 0 0 103.2 55.4 Z" fill="#2563eb" fill-opacity=".42" stroke="#2563eb" stroke-width="1"/><path d="M85 82 L64.0 82.0 A21 21 0 0 0 73.2 99.4 Z" fill="#2563eb" fill-opacity=".42" stroke="#2563eb" stroke-width="1"/><path d="M115 38 L103.2 55.4 A21 21 0 0 0 136.0 38.0 Z" fill="#db2777" fill-opacity=".42" stroke="#db2777" stroke-width="1"/><path d="M85 82 L73.2 99.4 A21 21 0 0 0 106.0 82.0 Z" fill="#db2777" fill-opacity=".42" stroke="#db2777" stroke-width="1"/><line x1="16" y1="38" x2="184" y2="38" stroke="#1d4ed8" stroke-width="2"/><line x1="16" y1="82" x2="184" y2="82" stroke="#1d4ed8" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 38.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 38.0) rotate(180.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 82.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 82.0) rotate(180.0)" fill="#1d4ed8"/><line x1="64" y1="112.8" x2="136" y2="7.2" stroke="#0b1f5c" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(136.0 7.2) rotate(-55.7)" fill="#0b1f5c"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(64.0 112.8) rotate(124.3)" fill="#0b1f5c"/><text x="109.4" y="31.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">α</text><text x="128.3" y="35.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">β</text><text x="101.7" y="49.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">θ</text><text x="120.6" y="52.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ω</text><text x="79.4" y="75.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ε</text><text x="98.3" y="79.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">τ</text><text x="71.7" y="93.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">σ</text><text x="90.6" y="96.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">φ</text><text x="30" y="31" font-size="9" font-weight="800" fill="#1d4ed8">L₁</text><text x="30" y="75" font-size="9" font-weight="800" fill="#1d4ed8">L₂</text><text x="32" y="62" font-size="8" font-weight="800" fill="#0b2a5b">L₁ ∥ L₂</text>`);
        a.cat = "lin";
        GAL.push(a);
    }
    {
        const a = ["Ángulos conjugados internos", "θ + ε = 180°", "ω + τ = 180° · dentro, del mismo lado", "#db2777"];
        a.push(`<rect width="200" height="120" fill="#fff"/><path d="M115 38 L94.0 38.0 A21 21 0 0 0 103.2 55.4 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M85 82 L96.8 64.6 A21 21 0 0 0 64.0 82.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M115 38 L103.2 55.4 A21 21 0 0 0 136.0 38.0 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M85 82 L106.0 82.0 A21 21 0 0 0 96.8 64.6 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><line x1="16" y1="38" x2="184" y2="38" stroke="#1d4ed8" stroke-width="2"/><line x1="16" y1="82" x2="184" y2="82" stroke="#1d4ed8" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 38.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 38.0) rotate(180.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 82.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 82.0) rotate(180.0)" fill="#1d4ed8"/><line x1="64" y1="112.8" x2="136" y2="7.2" stroke="#0b1f5c" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(136.0 7.2) rotate(-55.7)" fill="#0b1f5c"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(64.0 112.8) rotate(124.3)" fill="#0b1f5c"/><text x="109.4" y="31.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">α</text><text x="128.3" y="35.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">β</text><text x="101.7" y="49.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">θ</text><text x="120.6" y="52.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ω</text><text x="79.4" y="75.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ε</text><text x="98.3" y="79.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">τ</text><text x="71.7" y="93.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">σ</text><text x="90.6" y="96.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">φ</text><text x="30" y="31" font-size="9" font-weight="800" fill="#1d4ed8">L₁</text><text x="30" y="75" font-size="9" font-weight="800" fill="#1d4ed8">L₂</text><text x="32" y="62" font-size="8" font-weight="800" fill="#0b2a5b">L₁ ∥ L₂</text>`);
        a.cat = "lin";
        GAL.push(a);
    }
    {
        const a = ["Ángulos conjugados externos", "α + σ = 180°", "β + φ = 180° · fuera, del mismo lado", "#7c3aed"];
        a.push(`<rect width="200" height="120" fill="#fff"/><path d="M115 38 L126.8 20.6 A21 21 0 0 0 94.0 38.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M85 82 L64.0 82.0 A21 21 0 0 0 73.2 99.4 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M115 38 L136.0 38.0 A21 21 0 0 0 126.8 20.6 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M85 82 L73.2 99.4 A21 21 0 0 0 106.0 82.0 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><line x1="16" y1="38" x2="184" y2="38" stroke="#1d4ed8" stroke-width="2"/><line x1="16" y1="82" x2="184" y2="82" stroke="#1d4ed8" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 38.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 38.0) rotate(180.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 82.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 82.0) rotate(180.0)" fill="#1d4ed8"/><line x1="64" y1="112.8" x2="136" y2="7.2" stroke="#0b1f5c" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(136.0 7.2) rotate(-55.7)" fill="#0b1f5c"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(64.0 112.8) rotate(124.3)" fill="#0b1f5c"/><text x="109.4" y="31.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">α</text><text x="128.3" y="35.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">β</text><text x="101.7" y="49.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">θ</text><text x="120.6" y="52.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ω</text><text x="79.4" y="75.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ε</text><text x="98.3" y="79.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">τ</text><text x="71.7" y="93.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">σ</text><text x="90.6" y="96.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">φ</text><text x="30" y="31" font-size="9" font-weight="800" fill="#1d4ed8">L₁</text><text x="30" y="75" font-size="9" font-weight="800" fill="#1d4ed8">L₂</text><text x="32" y="62" font-size="8" font-weight="800" fill="#0b2a5b">L₁ ∥ L₂</text>`);
        a.cat = "lin";
        GAL.push(a);
    }
    {
        const a = ["Ángulos adyacentes (par lineal)", "α + β = 180°", "También θ+ω, ε+τ, σ+φ · forman una línea recta", "#0d9488"];
        a.push(`<rect width="200" height="120" fill="#fff"/><path d="M115 38 L126.8 20.6 A21 21 0 0 0 94.0 38.0 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M115 38 L136.0 38.0 A21 21 0 0 0 126.8 20.6 Z" fill="#f97316" fill-opacity=".42" stroke="#f97316" stroke-width="1"/><path d="M115 38 L94.0 38.0 A21 21 0 0 0 103.2 55.4 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M115 38 L103.2 55.4 A21 21 0 0 0 136.0 38.0 Z" fill="#16a34a" fill-opacity=".42" stroke="#16a34a" stroke-width="1"/><path d="M85 82 L96.8 64.6 A21 21 0 0 0 64.0 82.0 Z" fill="#2563eb" fill-opacity=".42" stroke="#2563eb" stroke-width="1"/><path d="M85 82 L106.0 82.0 A21 21 0 0 0 96.8 64.6 Z" fill="#2563eb" fill-opacity=".42" stroke="#2563eb" stroke-width="1"/><path d="M85 82 L64.0 82.0 A21 21 0 0 0 73.2 99.4 Z" fill="#db2777" fill-opacity=".42" stroke="#db2777" stroke-width="1"/><path d="M85 82 L73.2 99.4 A21 21 0 0 0 106.0 82.0 Z" fill="#db2777" fill-opacity=".42" stroke="#db2777" stroke-width="1"/><line x1="16" y1="38" x2="184" y2="38" stroke="#1d4ed8" stroke-width="2"/><line x1="16" y1="82" x2="184" y2="82" stroke="#1d4ed8" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 38.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 38.0) rotate(180.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(186.0 82.0) rotate(0.0)" fill="#1d4ed8"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(14.0 82.0) rotate(180.0)" fill="#1d4ed8"/><line x1="64" y1="112.8" x2="136" y2="7.2" stroke="#0b1f5c" stroke-width="2"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(136.0 7.2) rotate(-55.7)" fill="#0b1f5c"/><polygon points="0,0 -8,-3.6 -8,3.6" transform="translate(64.0 112.8) rotate(124.3)" fill="#0b1f5c"/><text x="109.4" y="31.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">α</text><text x="128.3" y="35.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">β</text><text x="101.7" y="49.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">θ</text><text x="120.6" y="52.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ω</text><text x="79.4" y="75.4" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">ε</text><text x="98.3" y="79.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">τ</text><text x="71.7" y="93.0" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">σ</text><text x="90.6" y="96.6" text-anchor="middle" font-size="11" font-weight="800" font-style="italic" font-family="Georgia,Times New Roman,serif" fill="#0b2a5b">φ</text><text x="30" y="31" font-size="9" font-weight="800" fill="#1d4ed8">L₁</text><text x="30" y="75" font-size="9" font-weight="800" fill="#1d4ed8">L₂</text><text x="32" y="62" font-size="8" font-weight="800" fill="#0b2a5b">L₁ ∥ L₂</text>`);
        a.cat = "lin";
        GAL.push(a);
    }
})();
/* ===== TEXTO: escribir, tamaño, potencias, raíz y letras griegas (en todas las secciones) ===== */
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ', 'x': 'ˣ', 'i': 'ⁱ', '+': '⁺', '-': '⁻' };
const tsup = v => v.replace(/\^([0-9nxi+\-])/g, (m, c) => SUP[c]);
listen(document,'input', e => {
    const i = e.target;
    if (i.id != 'ti2')
        return;
    const it = S.items[S.sel];
    if (!it || it.t != 't')
        return;
    const old = i.value, pos = i.selectionStart, v = tsup(old);
    if (v !== old) {
        i.value = v;
        const q = Math.max(0, (pos == null ? old.length : pos) - (old.length - v.length));
        try {
            i.setSelectionRange(q, q);
        }
        catch (_) { }
    }
    if (!PCS) {
        snapH();
        PCS = 1;
    }
    it.x_ = v || ' ';
    txtIn = v;
    const t = $('ti');
    if (t)
        t.value = v;
    draw();
});
listen(document,'change', e => {
    if (e.target.id == 'ti2')
        PCS = 0;
});
listen(document,'click', e => {
    const b = e.target.closest('button[data-ins]');
    if (!b)
        return;
    const it = S.items[S.sel], i = $('ti2');
    if (!it || it.t != 't' || !i || RO)
        return;
    snapH();
    const a = i.selectionStart == null ? i.value.length : i.selectionStart, z = i.selectionEnd == null ? a : i.selectionEnd, ins = b.dataset.ins, v = (i.value.slice(0, a) + ins + i.value.slice(z)).slice(0, 40);
    i.value = v;
    it.x_ = v || ' ';
    txtIn = v;
    const t = $('ti');
    if (t)
        t.value = v;
    i.focus();
    try {
        i.setSelectionRange(a + ins.length, a + ins.length);
    }
    catch (_) { }
    draw();
});
export const geometry = { gallerySelect:gt,galleryZoom:gz,galleryPlace:()=>gp(),S, ui, draw, r, init(hooks) { geometrySample = hooks.sample;geometryValid=hooks.valid||(()=>true);geometryRenderError=hooks.onInvalid||(()=>{}); geometryNewId = hooks.newId; geometryAnimationStart = hooks.start; geometryAnimationStop = hooks.stop; }, setReadOnly(value) { RO = value ? 1 : 0; drag = null; document.body.classList.toggle('ro', !!value); }, get dragging() { return !!drag; }, get animationFlag() { return AN; }, set animationFlag(value) { AN = value; }, cancelDrag() { drag = null; }, labels: TABS };

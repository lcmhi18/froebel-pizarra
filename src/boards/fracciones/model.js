import { FIGURES, weightsFor } from './engine.js';
export const COLORS = ['#ff5d8f', '#4d96ff', '#2dc98a', '#ffc233', '#8e63ef', '#ff8b27', '#22bdd2', '#ef4444'];
export function initialLesson() { return { tab: 'parts', parts: { figure: 'pizza', n: 3, d: 8, colors: Array.from({ length: 32 }, (_, i) => i < 3 ? 'original' : null), line: 'original', lineWidth: 1.5, scale: 1, transforms: [] }, equiv: { an: 3, ad: 4, bn: 6, bd: 8, symbol: null }, operations: { operands: [{ type: 'fraction', n: 1, d: 2, whole: 0, decimal: '0,5', exp: 1 }, { type: 'fraction', n: 1, d: 3, whole: 0, decimal: '0,(3)', exp: 1 }, { type: 'fraction', n: 1, d: 6, whole: 0, decimal: '0,1(6)', exp: 1 }], ops: ['+', '+'], shown: 0 }, decimal: { direction: 'toDecimal', n: 3, d: 8, decimal: '0,72', shown: 0 } }; }
const rec = x => !!x && typeof x === 'object' && !Array.isArray(x), int = (n, a, b) => Number.isInteger(n) && n >= a && n <= b, hex = x => typeof x === 'string' && /^#[\da-f]{6}$/i.test(x), only = (x, keys) => Object.keys(x).every(k => keys.includes(k));
export function validFractionLesson(s) {
    if (!rec(s) || !only(s, ['tab', 'parts', 'equiv', 'operations', 'decimal']) || !['parts', 'equiv', 'operations', 'decimal'].includes(s.tab))
        return false;
    const p = s.parts, e = s.equiv, o = s.operations, d = s.decimal;
    if (!rec(p) || !only(p, ['figure', 'n', 'd', 'colors', 'line', 'lineWidth', 'scale', 'transforms']) || !FIGURES.some(f => f.id === p.figure) || !int(p.d, 1, 36) || !int(p.n, 0, p.d * 4) || !(p.line === 'original' || hex(p.line)) || !Number.isFinite(p.lineWidth) || p.lineWidth < .5 || p.lineWidth > 3 || !Number.isFinite(p.scale) || p.scale < .5 || p.scale > 2)
        return false;
    const fixed = FIGURES.find(f => f.id === p.figure).d;
    if (fixed ? p.d !== fixed : p.d > 20)
        return false;
    const weights = weightsFor(p.figure, p.d);
    if (!Array.isArray(p.colors) || p.colors.length !== weights.length * 4 || p.colors.some(c => c !== null && c !== 'original' && !hex(c)) || p.colors.reduce((n, c, i) => n + (c ? weights[i % weights.length] : 0), 0) !== p.n)
        return false;
    if (!Array.isArray(p.transforms) || p.transforms.length > 4 || !p.transforms.every(t => rec(t) && only(t, ['x', 'y', 'sx', 'sy']) && ['x', 'y', 'sx', 'sy'].every(k => Number.isFinite(t[k])) && Math.abs(t.x) <= 2000 && Math.abs(t.y) <= 2000 && t.sx >= .2 && t.sx <= 8 && t.sy >= .2 && t.sy <= 8))
        return false;
    if (!rec(e) || !only(e, ['an', 'ad', 'bn', 'bd', 'symbol']) || !int(e.an, 0, 20) || !int(e.bn, 0, 20) || !int(e.ad, 1, 20) || !int(e.bd, 1, 20) || ![null, '>', '<', '≥', '≤', '='].includes(e.symbol))
        return false;
    if (!rec(o) || !only(o, ['operands', 'ops', 'shown']) || !Array.isArray(o.operands) || o.operands.length < 2 || o.operands.length > 6 || !Array.isArray(o.ops) || o.ops.length !== o.operands.length - 1 || !o.ops.every(x => ['+', '-', '*', '/'].includes(x)) || !int(o.shown, 0, 100) || !o.operands.every(v => rec(v) && only(v, ['type', 'n', 'd', 'whole', 'decimal', 'exp']) && ['fraction', 'mixed', 'decimal'].includes(v.type) && int(v.n, -999, 999) && int(v.d, 1, 99) && int(v.whole, -99, 99) && typeof v.decimal === 'string' && v.decimal.length <= 60 && int(v.exp, -8, 8)))
        return false;
    return rec(d) && only(d, ['direction', 'n', 'd', 'decimal', 'shown']) && ['toDecimal', 'toFraction'].includes(d.direction) && int(d.n, 0, 999) && int(d.d, 1, 99) && typeof d.decimal === 'string' && d.decimal.length <= 60 && int(d.shown, 0, 100) && JSON.stringify(s).length < 20000;
}

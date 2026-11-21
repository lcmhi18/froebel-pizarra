const validNumber = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
export function itemBounds(item) { if (item.t !== 'stroke')
    return { left: Math.min(item.x1, item.x2), right: Math.max(item.x1, item.x2), top: Math.min(item.y1, item.y2), bottom: Math.max(item.y1, item.y2) }; return { left: Math.min(...item.p.map(p => p[0])), right: Math.max(...item.p.map(p => p[0])), top: Math.min(...item.p.map(p => p[1])), bottom: Math.max(...item.p.map(p => p[1])) }; }
export function transformItem(item, bounds) { const before = itemBounds(item), w = before.right - before.left, h = before.bottom - before.top; if (item.t === 'stroke')
    return { ...item, p: item.p.map(([x, y]) => [bounds.left + (w ? (x - before.left) / w : 0) * (bounds.right - bounds.left), bounds.top + (h ? (y - before.top) / h : 0) * (bounds.bottom - bounds.top)]) }; if (item.t === 'line') {
    const map = (x, y) => [bounds.left + (w ? (x - before.left) / w : 0) * (bounds.right - bounds.left), bounds.top + (h ? (y - before.top) / h : 0) * (bounds.bottom - bounds.top)];
    const a = map(item.x1, item.y1), b = map(item.x2, item.y2);
    return { ...item, x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
} return { ...item, x1: bounds.left, y1: bounds.top, x2: bounds.right, y2: bounds.bottom }; }
export function validFractionDrawing(list) { if (!Array.isArray(list) || list.length > 100)
    return false; let count = 0, imageChars = 0; return list.every(item => { if (!item || typeof item !== 'object' || Array.isArray(item))
    return false; if (item.t === 'stroke') {
    count += item.p?.length || 0;
    return Object.keys(item).every(k => ['t', 'p', 'c', 'w'].includes(k)) && /^#[\da-f]{6}$/i.test(item.c) && validNumber(item.w, 1, 40) && Array.isArray(item.p) && item.p.length > 0 && count <= 5000 && item.p.every(p => Array.isArray(p) && p.length === 2 && p.every(n => validNumber(n, 0, 1)));
} if (!['text', 'fraction', 'line', 'image'].includes(item.t) || !['x1', 'y1', 'x2', 'y2'].every(k => validNumber(item[k], 0, 1)))
    return false; if (item.t === 'line')
    return Object.keys(item).every(k => ['t', 'x1', 'y1', 'x2', 'y2', 'c', 'w'].includes(k)) && /^#[\da-f]{6}$/i.test(item.c) && validNumber(item.w, 1, 40); if (item.x2 <= item.x1 || item.y2 <= item.y1)
    return false; if (item.t === 'image') {
    imageChars += item.src?.length || 0;
    return Object.keys(item).every(k => ['t', 'src', 'x1', 'y1', 'x2', 'y2'].includes(k)) && imageChars <= 820000 && validNoteImage(item.src);
} if (!/^#[\da-f]{6}$/i.test(item.c) || !Number.isInteger(item.fontSize) || item.fontSize < 10 || item.fontSize > 120)
    return false; if (item.t === 'fraction')
    return Object.keys(item).every(k => ['t', 'n', 'd', 'fontSize', 'c', 'x1', 'y1', 'x2', 'y2'].includes(k)) && /^-?\d{1,8}$/.test(item.n) && /^\d{1,8}$/.test(item.d) && BigInt(item.d) > 0n; return Object.keys(item).every(k => ['t', 'runs', 'fontSize', 'c', 'x1', 'y1', 'x2', 'y2'].includes(k)) && Array.isArray(item.runs) && item.runs.length > 0 && item.runs.length <= 400 && item.runs.every(r => r && Object.keys(r).every(k => ['text', 'sup'].includes(k)) && typeof r.text === 'string' && typeof r.sup === 'boolean') && item.runs.reduce((n, r) => n + r.text.length, 0) <= 4000; }) && JSON.stringify(list).length <= 900000; }
import { validNoteImage } from '../../shared/note-image.js';

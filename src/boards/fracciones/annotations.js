import { clipboardImageData } from '../intervalos/images.js';
import { createGraphTextEditor } from '../intervalos/text-editor.js';
import {drawMathText,decorateMathText} from './math-text.js';
import { itemBounds, transformItem, validFractionDrawing } from './drawing-model.js';
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export function attachDrawing({ canvas, toolbar, textUI, fractionUI, canEdit, onChange }) {
    const ctx = canvas.getContext('2d'), stage = canvas.parentElement;
    let items = [], tool = 'move', selected = -1, gesture = null, color = '#ff5d8f', fontSize = 28, scale = 1, history = [], textTarget = null, savedText = false, textEditor;
    const cache = new Map();
    const get = () => items[selected], remember = () => { history.push(structuredClone(items)); if (history.length > 40)
        history.shift(); }, emit = () => onChange(structuredClone(items)), point = e => { const r = canvas.getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)]; };
    function handles(item) { const b = itemBounds(item), cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2; return [[b.left, b.top], [cx, b.top], [b.right, b.top], [b.right, cy], [b.right, b.bottom], [cx, b.bottom], [b.left, b.bottom], [b.left, cy]]; }
    function hit(item, p) { const b = itemBounds(item); if (item.t !== 'stroke' && item.t !== 'line')
        return p[0] >= b.left && p[0] <= b.right && p[1] >= b.top && p[1] <= b.bottom; const ps = item.t === 'line' ? [[item.x1, item.y1], [item.x2, item.y2]] : item.p; for (let i = 0; i < ps.length; i++) {
        const a = ps[Math.max(0, i - 1)], z = ps[i], dx = (z[0] - a[0]) * canvas.width, dy = (z[1] - a[1]) * canvas.height, x = (p[0] - a[0]) * canvas.width, y = (p[1] - a[1]) * canvas.height, t = clamp((x * dx + y * dy) / (dx * dx + dy * dy || 1));
        if (Math.hypot(x - t * dx, y - t * dy) < (item.w || 3) + 8)
            return true;
    } return false; }
    function paint() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = ctx.lineJoin = 'round';
        for (const s of items) {
            if (s === textTarget && textEditor?.isEditing())
                continue;
            ctx.strokeStyle = ctx.fillStyle = s.c;
            ctx.lineWidth = s.w || 3;
            ctx.beginPath();
            if (s.t === 'image') {
                let image = cache.get(s.src);
                if (!image) {
                    image = new Image();
                    cache.set(s.src, image);
                    image.onload = paint;
                    image.src = s.src;
                }
                if (image.complete && image.naturalWidth)
                    ctx.drawImage(image, s.x1 * canvas.width, s.y1 * canvas.height, (s.x2 - s.x1) * canvas.width, (s.y2 - s.y1) * canvas.height);
            }
            else if (s.t === 'text')
                drawMathText(ctx, s, canvas.width, canvas.height);
            else if (s.t === 'fraction') {
                const b = itemBounds(s), x = (b.left + b.right) * canvas.width / 2, y = b.top * canvas.height, w = (b.right - b.left) * canvas.width;
                ctx.font = `800 ${s.fontSize}px Nunito,sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(s.n, x, y, w);
                ctx.moveTo(x - w / 2, y + s.fontSize * 1.15);
                ctx.lineTo(x + w / 2, y + s.fontSize * 1.15);
                ctx.stroke();
                ctx.fillText(s.d, x, y + s.fontSize * 1.3, w);
                ctx.textAlign = 'start';
            }
            else {
                const p = s.t === 'line' ? [[s.x1, s.y1], [s.x2, s.y2]] : s.p;
                p.forEach(([x, y], i) => i ? ctx.lineTo(x * canvas.width, y * canvas.height) : ctx.moveTo(x * canvas.width, y * canvas.height));
                if (p.length === 1)
                    ctx.lineTo(p[0][0] * canvas.width + .1, p[0][1] * canvas.height);
                ctx.stroke();
            }
        }
        if (get() && tool === 'move' && canEdit()) {
            const b = itemBounds(get());
            ctx.strokeStyle = '#4d96ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 4]);
            ctx.strokeRect(b.left * canvas.width, b.top * canvas.height, (b.right - b.left) * canvas.width, (b.bottom - b.top) * canvas.height);
            ctx.setLineDash([]);
            for (const [x, y] of handles(get())) {
                ctx.fillStyle = 'white';
                ctx.fillRect(x * canvas.width - 5, y * canvas.height - 5, 10, 10);
                ctx.strokeRect(x * canvas.width - 5, y * canvas.height - 5, 10, 10);
            }
        }
    }
    function refresh() { canvas.style.pointerEvents = tool === 'move' && !get() ? 'none' : canEdit() ? 'auto' : 'none'; canvas.style.cursor = tool === 'text' ? 'text' : tool === 'move' ? 'default' : 'crosshair'; toolbar.querySelectorAll('[data-tool]').forEach(b => { const on = b.dataset.tool === tool; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); b.disabled = !canEdit(); }); toolbar.querySelector('[data-scale]').textContent = Math.round(scale * 100) + '%'; paint(); }
    function setTool(value) { textEditor?.close(); tool = value; selected = -1; fractionUI.panel.hidden = value !== 'fraction'; textUI.panel.hidden = value !== 'text'; refresh(); if (value === 'move')
        canvas.style.pointerEvents = 'none'; }
    toolbar.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { if (canEdit())
        setTool(b.dataset.tool); });
    toolbar.querySelectorAll('[data-color]').forEach(b => b.onclick = () => { if (!canEdit())
        return; color = b.dataset.color; toolbar.querySelectorAll('[data-color]').forEach(k => k.classList.toggle('chosen', k === b)); if (get() && get().t !== 'image') {
        remember();
        get().c = color;
        emit();
        paint();
    } });
    toolbar.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { if (!canEdit())
        return; const factor = Number(b.dataset.size); scale = clamp(scale * factor, .4, 3); fontSize = Math.round(clamp(fontSize * factor, 10, 96)); if (get()) {
        remember();
        const old = itemBounds(get()), w = (old.right - old.left) * factor, h = (old.bottom - old.top) * factor;
        items[selected] = transformItem(get(), { ...old, right: clamp(old.left + w), bottom: clamp(old.top + h) });
        if (get().fontSize)
            get().fontSize = fontSize;
        if (get().w)
            get().w = clamp(get().w * factor, 1, 40);
        emit();
    } refresh(); });
    toolbar.querySelector('[data-clear]').onclick = () => { if (!canEdit())
        return; textEditor.close(); remember(); items = []; selected = -1; emit(); refresh(); };
    toolbar.querySelector('[data-undo]').onclick = () => { if (!canEdit() || !history.length)
        return; textEditor.close(); items = history.pop(); selected = -1; emit(); refresh(); };
    function beginText(p, item = null) { textEditor.close(); textTarget = item; savedText = false; selected = item ? items.indexOf(item) : -1; textEditor.openAt(item || { runs: [], c: color, fontSize, x1: p[0], y1: p[1], x2: Math.min(1, p[0] + Math.min(.6, 350 / canvas.width)), y2: Math.min(1, p[1] + 40 / canvas.height) }); tool = 'text'; refresh(); }
    textEditor = createGraphTextEditor(textUI, { decorate:decorateMathText, canEdit, container: stage, activate: (yes = true) => setTool(yes ? 'text' : 'move'), finish: () => { textTarget = null; refresh(); }, update: data => { if (!textTarget && !data.runs.some(r => r.text.trim()))
            return; if (!savedText) {
            remember();
            savedText = true;
        } if (!textTarget) {
            const x = parseFloat(textUI.editor.style.left) / 100, y = parseFloat(textUI.editor.style.top) / 100, w = parseFloat(textUI.editor.style.width) / 100;
            textTarget = { t: 'text', runs: data.runs, c: data.c, fontSize: data.fontSize, x1: x, y1: y, x2: Math.min(1, x + w), y2: Math.min(1, y + Math.max(data.fontSize * 1.5, data.height) / canvas.height) };
            items.push(textTarget);
            selected = items.length - 1;
        }
        else
            Object.assign(textTarget, { runs: data.runs, c: data.c, fontSize: data.fontSize, y2: Math.min(1, textTarget.y1 + Math.max(data.fontSize * 1.5, data.height) / canvas.height) }); emit(); paint(); } });
    canvas.addEventListener('pointerdown', e => { if (!canEdit() || e.button > 0)
        return; e.preventDefault(); const p = point(e); if (tool === 'text') {
        beginText(p);
        return;
    } if (tool === 'fraction') {
        remember();
        const n = /^-?\d{1,8}$/.test(fractionUI.n.value) ? fractionUI.n.value : '0', d = /^\d{1,8}$/.test(fractionUI.d.value) && BigInt(fractionUI.d.value) > 0n ? fractionUI.d.value : '1';
        const w = Math.min(.25, 100 / canvas.width), h = Math.min(.6, fontSize * 2.6 / canvas.height), x = Math.min(p[0], 1 - w), y = Math.min(p[1], 1 - h);
        items.push({ t: 'fraction', n, d, fontSize, c: color, x1: x, y1: y, x2: x + w, y2: y + h });
        selected = items.length - 1;
        emit();
        paint();
        return;
    } if (tool === 'erase') {
        remember();
        canvas.setPointerCapture(e.pointerId);
        gesture = { pointer: e.pointerId, erase: true };
        const at = items.findLastIndex(s => hit(s, p));
        if (at >= 0)
            items.splice(at, 1);
        selected = -1;
        paint();
        return;
    } canvas.setPointerCapture(e.pointerId); if (tool === 'move') {
        let handle = get() ? handles(get()).findIndex(([x, y]) => Math.hypot((x - p[0]) * canvas.width, (y - p[1]) * canvas.height) < 12) : -1;
        if (handle < 0)
            selected = items.findLastIndex(s => hit(s, p));
        if (get()) {
            remember();
            gesture = { pointer: e.pointerId, start: p, original: structuredClone(get()), handle };
        }
        refresh();
        return;
    } remember(); const s = tool === 'line' ? { t: 'line', x1: p[0], y1: p[1], x2: p[0], y2: p[1], c: color, w: clamp(3 * scale, 1, 40) } : { t: 'stroke', p: [p], c: color, w: clamp(4 * scale, 1, 40) }; items.push(s); selected = items.length - 1; gesture = { pointer: e.pointerId, start: p }; paint(); });
    canvas.addEventListener('pointermove', e => { if (!gesture || gesture.pointer !== e.pointerId || !canEdit())
        return; const p = point(e), s = get(); if (gesture.erase) {
        const at = items.findLastIndex(s => hit(s, p));
        if (at >= 0)
            items.splice(at, 1);
        paint();
        return;
    } if (gesture.original) {
        const b = itemBounds(gesture.original);
        let box = { ...b };
        if (gesture.handle < 0) {
            const dx = clamp(p[0] - gesture.start[0], -b.left, 1 - b.right), dy = clamp(p[1] - gesture.start[1], -b.top, 1 - b.bottom);
            box = { left: b.left + dx, right: b.right + dx, top: b.top + dy, bottom: b.bottom + dy };
        }
        else {
            const h = gesture.handle;
            if ([0, 6, 7].includes(h))
                box.left = p[0];
            if ([2, 3, 4].includes(h))
                box.right = p[0];
            if ([0, 1, 2].includes(h))
                box.top = p[1];
            if ([4, 5, 6].includes(h))
                box.bottom = p[1];
            box = { left: Math.min(box.left, box.right), right: Math.max(box.left, box.right), top: Math.min(box.top, box.bottom), bottom: Math.max(box.top, box.bottom) };
        }
        items[selected] = transformItem(gesture.original, box);
    }
    else if (s.t === 'line') {
        s.x2 = p[0];
        s.y2 = p[1];
    }
    else
        s.p.push(p); paint(); });
    for (const name of ['pointerup', 'pointercancel'])
        canvas.addEventListener(name, e => { if (gesture?.pointer !== e.pointerId)
            return; if (name === 'pointercancel') {
            items = history.pop() || [];
            selected = -1;
        } gesture = null; if (validFractionDrawing(items))
            emit();
        else {
            items = history.pop() || [];
            selected = -1;
        } refresh(); });
    // Selecting annotations must not block painting fraction pieces in Move mode.
    stage.addEventListener('pointerdown', e => { if (e.target === canvas || tool !== 'move' || !canEdit() || e.target.closest('button,input,select,[contenteditable],[data-figure-handle]'))
        return; const p = point(e); if (items.some(s => hit(s, p))) {
        canvas.style.pointerEvents = 'auto';
        const at = items.findLastIndex(s => hit(s, p));
        selected = at;
        remember();
        gesture = { pointer: e.pointerId, start: p, original: structuredClone(get()), handle: -1 };
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        refresh();
    } }, true);
    canvas.addEventListener('dblclick', () => { if (get()?.t === 'text' && canEdit())
        beginText([get().x1, get().y1], get()); });
    async function insertImage(file) { if (!canEdit())
        return; try {
        const image = await clipboardImageData(file);
        if (!canEdit())
            return;
        const chars = items.filter(i => i.t === 'image').reduce((n, i) => n + i.src.length, 0) + image.src.length;
        if (chars > 820000)
            throw Error('Quita una imagen antes de añadir otra.');
        remember();
        const ratio = Math.min(400 / image.width, 250 / image.height, 1), w = Math.min(.8, image.width * ratio / canvas.width), h = Math.min(.8, image.height * ratio / canvas.height);
        items.push({ t: 'image', src: image.src, x1: .1, y1: .1, x2: .1 + w, y2: .1 + h });
        selected = items.length - 1;
        tool = 'move';
        emit();
        refresh();
    }
    catch (error) {
        fractionUI.error.textContent = error.message;
        fractionUI.error.hidden = false;
    } }
    const fileInput = toolbar.querySelector('input[type=file]');
    fileInput.onchange = () => { if (fileInput.files[0])
        insertImage(fileInput.files[0]); fileInput.value = ''; };
    document.addEventListener('paste', e => { const file = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'))?.getAsFile(); if (file && canEdit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        insertImage(file);
    } }, true);
    stage.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files'))
        e.preventDefault(); });
    stage.addEventListener('drop', e => { const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')); if (files.length) {
        e.preventDefault();
        for (const file of files)
            insertImage(file);
    } });
    new ResizeObserver(() => { canvas.width = stage.clientWidth; canvas.height = stage.clientHeight; paint(); }).observe(stage);
    refresh();
    return { get: () => structuredClone(items), set: value => { textEditor.close(); items = structuredClone(value); selected = -1; gesture = null; history = []; refresh(); }, refresh, tool: () => tool };
}

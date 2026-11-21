import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { rat, compare, lcm, mixed, decimalFraction, fractionDecimal, operandValue, operationLesson, decimalLesson, FIGURES, weightsFor, chooseParts } from './engine.js';
import { initialLesson, COLORS } from './model.js';
import { figureNode } from './figures.js';
import { attachDrawing } from './annotations.js';
import { CombinedAdapter } from '../operaciones-combinadas/adapter';
import { attachLive } from '../../live/attach';
import pizza from '@phosphor-icons/core/assets/regular/pizza.svg';
import square from '@phosphor-icons/core/assets/regular/square.svg';
import calculator from '@phosphor-icons/core/assets/regular/calculator.svg';
import numbers from '@phosphor-icons/core/assets/regular/list-numbers.svg';
import pencil from '@phosphor-icons/core/assets/regular/pencil.svg';
import text from '@phosphor-icons/core/assets/regular/text-t.svg';
import ruler from '@phosphor-icons/core/assets/regular/ruler.svg';
import image from '@phosphor-icons/core/assets/regular/image.svg';
import hand from '@phosphor-icons/core/assets/regular/hand.svg';
import eraser from '@phosphor-icons/core/assets/regular/eraser.svg';
import undo from '@phosphor-icons/core/assets/regular/arrow-counter-clockwise.svg';
import trash from '@phosphor-icons/core/assets/regular/trash.svg';
import eyeClosed from '@phosphor-icons/core/assets/regular/eye-closed.svg';
import eye from '@phosphor-icons/core/assets/regular/eye.svg';
import dice from '@phosphor-icons/core/assets/regular/dice-five.svg';
import move from '@phosphor-icons/core/assets/regular/arrows-out-cardinal.svg';
import resize from '@phosphor-icons/core/assets/regular/arrows-out.svg';
const icons = { pizza, square, calculator, numbers, pencil, text, ruler, image, hand, eraser, undo, trash, 'eye-closed': eyeClosed, eye, dice, move, resize };
const $ = id => document.getElementById(id), node = (tag, text, css) => { const el = document.createElement(tag); if (text !== undefined)
    el.textContent = text; if (css)
    el.className = css; return el; }, img = name => { const el = node('img'); el.src = icons[name]; el.alt = ''; return el; };
document.querySelectorAll('[data-icon]').forEach(el => el.append(img(el.dataset.icon)));
const query = new URLSearchParams(location.search), role = query.has('room') && query.get('role') !== 'teacher' ? 'student' : 'teacher', adapter = new CombinedAdapter(role);
let live, drawing, signature = '', outputKey = '', drawingKey = '', activeFill = 'original', exam = false, moveFigures = false;
const revealed = new Set();
const editable = () => adapter.canEdit;
const lesson = () => adapter.getState().fields.lesson || initialLesson();
function update(mutate) { if (!editable())
    return; adapter.commit(state => { const next = structuredClone(state.fields.lesson || initialLesson()); mutate(next); state.fields.lesson = next; }); }
const valueAt = (obj, path) => path.split('.').reduce((o, k) => o[k], obj);
function setAt(obj, path, value) { const parts = path.split('.'), last = parts.pop(), target = parts.reduce((o, k) => o[k], obj); target[last] = value; }
function fillParts(parts, n) { const weights = weightsFor(parts.figure, parts.d), all = Array(4).fill(weights).flat(), choice = chooseParts(all, Math.max(0, Math.min(parts.d * 4, n))); parts.n = choice.total; parts.colors = all.map((_, i) => choice.indices.includes(i) ? 'original' : null); }
function setField(path, value) { update(s => { if (path === 'parts.figure') {
    s.parts.figure = value;
    const fixed = FIGURES.find(f => f.id === value).d;
    if (fixed)
        s.parts.d = fixed;
    else
        s.parts.d = Math.min(20, s.parts.d);
    fillParts(s.parts, value === 'thirds' ? 2 : value === 'weighted' ? 13 : Math.min(s.parts.n, s.parts.d * 4));
    s.parts.transforms = [];
}
else if (path === 'parts.d') {
    s.parts.d = value;
    fillParts(s.parts, s.parts.n);
}
else if (path === 'parts.n')
    fillParts(s.parts, value);
else
    setAt(s, path, value); if (path.startsWith('operations.'))
    s.operations.shown = 0; if (path.startsWith('decimal.'))
    s.decimal.shown = 0; if (path.startsWith('equiv.'))
    s.equiv.symbol = null; }); }
function numeric(label, path, min, max, step = 1) { const wrapper = node('label', label), input = node('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.dataset.path = path; input.setAttribute('aria-label', label); input.oninput = () => { const number = Number(input.value), safe = Math.max(min, Math.min(max, Number.isFinite(number) ? number : min)); setField(path, step === 1 ? Math.trunc(safe) : safe); }; input.onblur = () => { input.value = valueAt(lesson(), path); }; wrapper.append(input); return wrapper; }
function selectField(label, path, options) { const wrapper = node('label', label), select = node('select'); select.dataset.path = path; select.setAttribute('aria-label', label); for (const [value, text] of options) {
    const option = node('option', text);
    option.value = value;
    select.append(option);
} select.onchange = () => setField(path, select.value); wrapper.append(select); return wrapper; }
function button(text, action, css) { const b = node('button', text, css); b.type = 'button'; b.onclick = action; return b; }
function textField(label, path) { const wrapper = node('label', label), input = node('input'); input.type = 'text'; input.maxLength = 60; input.dataset.path = path; input.setAttribute('aria-label', label); input.oninput = () => setField(path, input.value); wrapper.append(input); return wrapper; }
function newButton() { const b = button('Nueva', newExercise, 'new-exercise'); b.prepend(img('dice')); return b; }
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
function newExercise() { revealed.clear(); update(s => { if (s.tab === 'parts') {
    const fixed = FIGURES.find(f => f.id === s.parts.figure).d;
    s.parts.d = fixed || rand(1, 12);
    fillParts(s.parts, rand(0, s.parts.d * 2));
    s.parts.transforms = [];
}
else if (s.tab === 'equiv') {
    s.equiv = { an: rand(0, 12), ad: rand(1, 12), bn: rand(0, 12), bd: rand(1, 12), symbol: null };
}
else if (s.tab === 'operations') {
    s.operations.operands = s.operations.operands.map(o => ({ ...o, n: rand(0, 9), d: rand(1, 9), whole: rand(0, 3), decimal: ['0,72', '0,(35)', '1,2(3)', '0,1(6)'][rand(0, 3)], exp: rand(1, 2) }));
    s.operations.ops = s.operations.ops.map(() => ['+', '-', '*', '/'][rand(0, 3)]);
    s.operations.shown = 0;
}
else {
    s.decimal.n = rand(0, 99);
    s.decimal.d = rand(1, 40);
    const kind = $('decimal-kind')?.value || 'random';
    const examples = { exact: ['0,72', '1,25', '2,4'], pure: ['0,(35)', '1,(6)', '0,(142857)'], mixed: ['1,2(3)', '0,1(6)', '2,45(7)'] };
    s.decimal.decimal = examples[kind || 'exact']?.[rand(0, 2)] || ['0,72', '0,(35)', '1,2(3)'][rand(0, 2)];
    s.decimal.shown = 0;
} }); }
function renderControls(s) {
    const key = s.tab + '|' + (s.tab === 'parts' ? s.parts.figure : s.tab === 'operations' ? s.operations.operands.map(o => o.type).join(',') : s.tab === 'decimal' ? s.decimal.direction : '');
    if (key === signature)
        return;
    signature = key;
    const c = $('controls');
    c.replaceChildren();
    if (s.tab === 'parts') {
        c.append(selectField('Figura', 'parts.figure', FIGURES.map(f => [f.id, f.name])), numeric('Partes elegidas', 'parts.n', 0, s.parts.d * 4), numeric('Total', 'parts.d', 1, FIGURES.find(f => f.id === s.parts.figure).d || 20), newButton());
    }
    else if (s.tab === 'equiv')
        c.append(numeric('Numerador A', 'equiv.an', 0, 20), numeric('Denominador A', 'equiv.ad', 1, 20), numeric('Numerador B', 'equiv.bn', 0, 20), numeric('Denominador B', 'equiv.bd', 1, 20), newButton());
    else if (s.tab === 'operations') {
        const row = node('div', undefined, 'operand-controls');
        s.operations.operands.forEach((o, i) => { if (i)
            row.append(selectField('', 'operations.ops.' + (i - 1), [['+', '+'], ['-', '−'], ['*', '×'], ['/', '÷']])); const card = node('div', undefined, 'operand-card'), prefix = 'operations.operands.' + i + '.'; card.append(selectField('Número ' + (i + 1), prefix + 'type', [['fraction', 'Fracción'], ['mixed', 'Mixta'], ['decimal', 'Decimal']])); const values = node('div', undefined, 'operand-values'); if (o.type === 'decimal')
            values.append(textField('Decimal', prefix + 'decimal'));
        else {
            if (o.type === 'mixed')
                values.append(numeric('Entero', prefix + 'whole', -99, 99));
            values.append(numeric('Arriba', prefix + 'n', -999, 999), numeric('Abajo', prefix + 'd', 1, 99));
        } card.append(values, numeric('Exponente', prefix + 'exp', -8, 8)); row.append(card); });
        c.append(row, button('+ Agregar', () => update(s => { if (s.operations.operands.length >= 6)
            return; s.operations.operands.push({ type: 'fraction', n: 1, d: 2, whole: 0, decimal: '0,5', exp: 1 }); s.operations.ops.push('+'); s.operations.shown = 0; })), button('− Quitar', () => update(s => { if (s.operations.operands.length <= 2)
            return; s.operations.operands.pop(); s.operations.ops.pop(); s.operations.shown = 0; })), newButton());
    }
    else {
        c.append(selectField('Convertir', 'decimal.direction', [['toDecimal', 'Fracción → decimal'], ['toFraction', 'Decimal → fracción']]));
        if (s.decimal.direction === 'toDecimal')
            c.append(numeric('Numerador', 'decimal.n', 0, 999), numeric('Denominador', 'decimal.d', 1, 99));
        else {
            const kind = node('select');
            kind.id = 'decimal-kind';
            kind.setAttribute('aria-label', 'Tipo de decimal');
            for (const [v, t] of [['random', 'Al azar'], ['exact', 'Exacto'], ['pure', 'Periódico puro'], ['mixed', 'Periódico mixto']]) {
                const o = node('option', t);
                o.value = v;
                kind.append(o);
            }
            c.append(kind, textField('Decimal', 'decimal.decimal'), node('small', 'Ejemplos: 0,72 · 0,(35) · 1,2(3)'));
        }
        c.append(newButton());
    }
}
function fraction(value) { const el = node('span', undefined, 'fraction'); el.append(node('span', String(value.n), 'numerator'), node('span', String(value.d), 'denominator')); return el; }
function partMath(part) { if (typeof part === 'string')
    return node('span', part); if (part.decimal) {
    const d = part.decimal, el = node('span', undefined, 'decimal-value');
    el.append(node('span', d.sign + d.whole + (d.nonrepeat || d.repeat ? ',' : '') + d.nonrepeat));
    if (d.repeat)
        el.append(node('span', d.repeat, 'repeat'));
    if (d.truncated)
        el.append(node('span', '…'));
    return el;
} if (part.mixed) {
    const m = part.mixed, el = node('span', undefined, 'mixed-number');
    el.append(node('span', (m.negative && m.whole === 0n ? '−' : '') + m.whole));
    if (m.remainder)
        el.append(fraction({ n: m.remainder, d: m.denominator }));
    return el;
} return part.d === 1n ? node('span', String(part.n)) : fraction(part); }
function math(parts) { const el = node('div', undefined, 'math-expression'); parts.forEach(p => el.append(partMath(p))); return el; }
function makeConcealable(el, key) { el.classList.add('concealable'); if (revealed.has(key))
    el.classList.add('revealed'); el.addEventListener('click', () => { if (!exam)
    return; revealed.has(key) ? revealed.delete(key) : revealed.add(key); el.classList.toggle('revealed', revealed.has(key)); }); return el; }
function swatches(title, active, choose, lines = false) { const box = node('div'), heading = node('h3', title), row = node('div', undefined, 'swatches'); const original = button('Original', () => choose('original'), 'original' + (active === 'original' ? ' chosen' : '')); row.append(original); const palette = lines ? ['#111111', '#ffffff', ...COLORS.slice(0, 5), COLORS[7]] : COLORS; palette.forEach(c => { const b = button('', () => choose(c), active === c ? 'chosen' : ''); b.style.setProperty('--swatch', c); b.setAttribute('aria-label', title + ' ' + c); b.setAttribute('aria-pressed', String(active === c)); row.append(b); }); box.append(heading, row); return box; }
function figureGesture(wrapper, copy, s) { const moveButton = button('', () => { }, 'figure-move'), resizeButton = button('', () => { }, 'figure-resize'); moveButton.append(img('move')); resizeButton.append(img('resize')); moveButton.dataset.figureHandle = 'move'; resizeButton.dataset.figureHandle = 'resize'; moveButton.setAttribute('aria-label', 'Mover figura ' + (copy + 1)); resizeButton.setAttribute('aria-label', 'Cambiar tamaño de figura ' + (copy + 1)); wrapper.append(moveButton, resizeButton); const transform = s.parts.transforms[copy] || { x: 0, y: 0, sx: 1, sy: 1 }; wrapper.style.transform = `translate(${transform.x}px,${transform.y}px) scale(${transform.sx * s.parts.scale},${transform.sy * s.parts.scale})`; wrapper.style.transformOrigin = 'center'; for (const [button, type] of [[moveButton, 'move'], [resizeButton, 'resize']])
    button.onpointerdown = e => { if (!editable() || drawing?.tool() !== 'move')
        return; e.preventDefault(); e.stopPropagation(); button.setPointerCapture(e.pointerId); const start = { x: e.clientX, y: e.clientY }, base = { ...transform }; let next = { ...base }; const onMove = ev => { if (type === 'move') {
        next.x = Math.max(-2000, Math.min(2000, base.x + ev.clientX - start.x));
        next.y = Math.max(-2000, Math.min(2000, base.y + ev.clientY - start.y));
    }
    else {
        const size = wrapper.clientWidth;
        next.sx = Math.max(.2, Math.min(8, base.sx + (ev.clientX - start.x) / size));
        next.sy = ev.shiftKey ? Math.max(.2, Math.min(8, base.sy + (ev.clientY - start.y) / Math.max(100, wrapper.clientHeight))) : next.sx;
    } wrapper.style.transform = `translate(${next.x}px,${next.y}px) scale(${next.sx * s.parts.scale},${next.sy * s.parts.scale})`; }; const end = ev => { button.removeEventListener('pointermove', onMove); button.removeEventListener('pointerup', end); button.removeEventListener('pointercancel', cancel); update(state => { while (state.parts.transforms.length <= copy)
        state.parts.transforms.push({ x: 0, y: 0, sx: 1, sy: 1 }); state.parts.transforms[copy] = next; }); }; const cancel = () => { button.removeEventListener('pointermove', onMove); button.removeEventListener('pointerup', end); button.removeEventListener('pointercancel', cancel); wrapper.style.transform = `translate(${base.x}px,${base.y}px) scale(${base.sx * s.parts.scale},${base.sy * s.parts.scale})`; }; button.addEventListener('pointermove', onMove); button.addEventListener('pointerup', end); button.addEventListener('pointercancel', cancel); }; }
function renderParts(s) { const output = $('output'); output.append(node('p', 'Escribe los números o toca las partes.', 'parts-hint')); const layout = node('div', undefined, 'parts-layout'), main = node('div', undefined, 'parts-main'), figures = node('div', undefined, 'figure-space'), p = s.parts, weights = weightsFor(p.figure, p.d), copies = Math.max(1, Math.ceil(p.n / p.d)); for (let copy = 0; copy < copies; copy++) {
    const wrapper = node('div', undefined, 'figure-wrap');
    if (copies > 1)
        wrapper.style.width = (copies > 2 ? '45%' : '75%');
    wrapper.append(figureNode(p.figure, p.d, p.colors.slice(copy * weights.length, (copy + 1) * weights.length), p, index => { if (drawing?.tool() !== 'move')
        return; update(s => { const i = copy * weights.length + index, current = s.parts.colors[i]; s.parts.colors[i] = current === activeFill ? null : activeFill; s.parts.n = s.parts.colors.reduce((n, c, i) => n + (c ? weights[i % weights.length] : 0), 0); }); }, copy));
    figureGesture(wrapper, copy, s);
    figures.append(wrapper);
} const big = node('div', undefined, 'big-fraction'); big.append(fraction({ n: p.n, d: p.d })); makeConcealable(big, 'parts'); const actions = node('div', undefined, 'part-actions'); actions.append(button('✓ Todo', () => update(s => fillParts(s.parts, s.parts.d * copies)), 'all'), button('Ninguna', () => update(s => fillParts(s.parts, 0)), 'none'), button('Centrar figura', () => update(s => { s.parts.transforms = []; s.parts.scale = 1; }), 'center')); main.append(figures, big, actions); const customize = node('aside', undefined, 'customize'); customize.append(swatches('Color', activeFill, c => { activeFill = c; outputKey = ''; render(); }), swatches('Líneas', p.line, c => update(s => s.parts.line = c), true)); for (const [title, path, min, max, step] of [['Grosor', 'lineWidth', .5, 3, .1], ['Tamaño', 'scale', .5, 2, .1]]) {
    const label = node('label', title), range = node('input'), out = node('output', p[path].toFixed(1) + '×');
    range.type = 'range';
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = p[path];
    range.setAttribute('aria-label', title + ' de figura');
    range.oninput = () => { const v = Number(range.value); out.textContent = v.toFixed(1) + '×'; if (path === 'scale')
        figures.querySelectorAll('.figure-wrap').forEach((el, i) => { const t = p.transforms[i] || { x: 0, y: 0, sx: 1, sy: 1 }; el.style.transform = `translate(${t.x}px,${t.y}px) scale(${t.sx * v},${t.sy * v})`; });
    else
        figures.querySelectorAll('[stroke-width]').forEach(el => { el.dataset.baseWidth ||= String(Number(el.getAttribute('stroke-width')) / p.lineWidth); el.setAttribute('stroke-width', Number(el.dataset.baseWidth) * v); }); };
    range.onchange = () => update(s => s.parts[path] = Number(range.value));
    label.append(range, out);
    customize.append(label);
} const toggle = button('Mover y redimensionar', () => { moveFigures = !moveFigures; document.body.classList.toggle('move-figures', moveFigures); }, 'move-toggle'); customize.append(toggle); layout.append(main, customize); output.append(layout); if (p.figure === 'weighted')
    output.append(node('small', 'Cada franja vale 2/36; cada triángulo, 3/36; cada celda entera, 6/36. Solo se pueden elegir sumas de esas piezas.')); }
function placeSymbol(symbol) { update(s => s.equiv.symbol = symbol); }
function renderEquiv(s) { const e = s.equiv, a = rat(e.an, e.ad), b = rat(e.bn, e.bd), row = node('div', undefined, 'comparison'), target = button(e.symbol || '?', () => placeSymbol(null), 'symbol-target'); target.setAttribute('aria-label', 'Soltar símbolo aquí'); target.setAttribute('data-symbol-target', ''); row.append(fraction({ n: e.an, d: e.ad }), target, fraction({ n: e.bn, d: e.bd })); $('output').append(row, node('p', 'Arrastra un símbolo hasta el recuadro, o tócalo para colocarlo.', 'parts-hint')); const chips = node('div', undefined, 'symbol-chips'); for (const symbol of ['>', '<', '≥', '≤', '=']) {
    const chip = button(symbol, () => placeSymbol(symbol));
    chip.onpointerdown = event => { if (!editable())
        return; event.preventDefault(); const ghost = node('div', symbol, 'symbol-ghost'); document.body.append(ghost); const move = e => { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }; move(event); const end = e => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', cancel); ghost.remove(); const rect = target.getBoundingClientRect(); if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom)
        placeSymbol(symbol); }; const cancel = () => { ghost.remove(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', cancel); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', cancel); };
    chips.append(chip);
} $('output').append(chips); if (e.symbol) {
    const c = compare(a, b), correct = e.symbol === '=' ? c === 0 : e.symbol === '>' ? c > 0 : e.symbol === '<' ? c < 0 : e.symbol === '≥' ? c >= 0 : c <= 0;
    const feedback = node('div', correct ? '¡Correcto! Comparamos usando el mismo denominador.' : 'Revisa el símbolo. Comparamos usando el mismo denominador.', 'feedback' + (correct ? '' : ' wrong'));
    const common = lcm(BigInt(e.ad), BigInt(e.bd));
    feedback.append(math([{ n: BigInt(e.an) * (common / BigInt(e.ad)), d: common }, c === 0 ? ' = ' : c > 0 ? ' > ' : ' < ', { n: BigInt(e.bn) * (common / BigInt(e.bd)), d: common }]));
    $('output').append(makeConcealable(feedback, 'equiv'));
} }
function renderSteps(s) { const operations = s.tab === 'operations', config = operations ? s.operations : s.decimal; let compiled; try {
    compiled = operations ? operationLesson(config.operands, config.ops) : decimalLesson(config.direction, config);
}
catch (error) {
    $('error').hidden = false;
    $('error').textContent = error.message;
    return;
} if (operations) {
    const expr = node('div', undefined, 'math-expression');
    config.operands.forEach((o, i) => { if (i)
        expr.append(node('span', { '+': '+', '-': '−', '*': '×', '/': '÷' }[config.ops[i - 1]])); const v = node('span', undefined, 'operand-expression'); if (o.exp !== 1)
        v.append(node('span', '(')); if (o.type === 'fraction')
        v.append(fraction({ n: o.n, d: o.d }));
    else if (o.type === 'mixed') {
        v.append(node('span', String(o.whole)), fraction({ n: o.n, d: o.d }));
    }
    else
        try {
            v.append(partMath({ decimal: fractionDecimal(decimalFraction(o.decimal)) }));
        }
        catch {
            v.append(node('span', o.decimal));
        } if (o.exp !== 1)
        v.append(node('span', ')'), node('sup', String(o.exp))); expr.append(v); });
    $('output').append(expr);
}
else
    $('output').append(math(config.direction === 'toDecimal' ? [rat(config.n, config.d), ' → decimal'] : [{ decimal: fractionDecimal(decimalFraction(config.decimal)) }, ' → fracción'])); const actions = node('div', undefined, 'step-controls'); const next = button('Siguiente →', () => update(s => { const state = operations ? s.operations : s.decimal; state.shown = Math.min(compiled.steps.length, state.shown + 1); }), 'next'); next.disabled = config.shown >= compiled.steps.length; actions.append(next, button('Reiniciar pasos', () => { revealed.clear(); update(s => (operations ? s.operations : s.decimal).shown = 0); }), node('span', `${Math.min(config.shown, compiled.steps.length)} de ${compiled.steps.length} pasos`)); $('output').append(actions); compiled.steps.slice(0, config.shown).forEach((step, i) => { const box = node('div', undefined, 'lesson-step' + (step.answer ? ' answer' : '')), heading = node('div', undefined, 'step-heading'); heading.append(node('span', String(i + 1)), node('strong', step.title)); box.append(heading, math(step.parts)); $('output').append(makeConcealable(box, s.tab + i)); }); }
function render() { const s = lesson(); renderControls(s); document.querySelectorAll('[data-path]').forEach(el => { if (el !== document.activeElement)
    el.value = valueAt(s, el.dataset.path); el.disabled = !editable(); }); if (s.tab === 'parts') {
    $('controls').querySelector('[data-path="parts.d"]').disabled = !editable() || !!FIGURES.find(f => f.id === s.parts.figure).d;
    $('controls').querySelector('[data-path="parts.n"]').max = s.parts.d * 4;
} document.querySelectorAll('[data-tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.tab === s.tab)); b.disabled = !editable(); }); const key = JSON.stringify(s) + '|' + editable(); if (key !== outputKey) {
    outputKey = key;
    $('output').replaceChildren();
    $('error').hidden = true;
    if (s.tab === 'parts')
        renderParts(s);
    else if (s.tab === 'equiv')
        renderEquiv(s);
    else
        renderSteps(s);
} $('board').classList.toggle('solution-hidden', exam); document.body.classList.toggle('room-readonly', !editable()); $('controls').querySelectorAll('button').forEach(b => b.disabled = !editable()); $('output').querySelectorAll('button').forEach(b => { if (!editable())
    b.disabled = true; }); const items = adapter.getState().fields.drawing || [], dk = JSON.stringify(items); if (drawing && dk !== drawingKey) {
    drawingKey = dk;
    drawing.set(items);
} drawing?.refresh(); }
for (const button of document.querySelectorAll('[data-tab]'))
    button.onclick = () => { revealed.clear(); update(s => s.tab = button.dataset.tab); };
$('hide-answers').onclick = () => { exam = true; revealed.clear(); $('board').classList.add('solution-hidden'); };
$('show-answers').onclick = () => { exam = false; $('board').classList.remove('solution-hidden'); };
$('practice-mode').onchange = () => { exam = $('practice-mode').value === 'student'; $('mode-hint').textContent = exam ? 'Inventa un ejercicio, inténtalo y después descubre la solución.' : 'Elige un ejercicio, pinta y explica paso a paso.'; $('board').classList.toggle('solution-hidden', exam); };
$('toggle-top').onclick = () => { const hidden = $('controls').hidden = !$('controls').hidden; $('toggle-top').textContent = hidden ? 'Mostrar controles' : 'Ocultar controles'; };
$('theme-toggle').onclick = () => { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('theme-toggle').textContent = dark ? 'Tema claro' : 'Tema oscuro'; };
const by = id => $(id);
drawing = attachDrawing({ canvas: $('annotation-canvas'), toolbar: $('toolbar'), canEdit: editable, onChange: items => { drawingKey = JSON.stringify(items); adapter.commit(state => state.fields.drawing = items); }, textUI: { button: by('text-button'), panel: by('text-options'), editor: by('text-editor'), up: by('text-up'), down: by('text-down'), size: by('text-size'), color: by('text-color'), close: by('text-close'), error: by('text-error'), signs: [...document.querySelectorAll('[data-text-sign]')] }, fractionUI: { panel: $('fraction-options'), n: $('fraction-n'), d: $('fraction-d'), error: $('drawing-error') } });
adapter.subscribe(render);
live = attachLive(adapter, { boardId: 'fracciones', workspace: $('workspace'), slot: $('live-slot') });
live.subscribe(view => { $('room-status').hidden = view.status === 'active' && !view.error; $('room-status').textContent = view.error || (view.status === 'waiting' ? 'Esperando la aceptación del profesor…' : view.status === 'paused' ? 'La clase está en pausa.' : 'Conectando a la sala…'); });
if (live.mode === 'solo' && location.protocol !== 'file:') {
    const b = button('Clase', () => location.assign('/profesor/?board=fracciones'));
    $('live-slot').append(b);
}
if (location.protocol === 'file:') {
    $('download').hidden = true;
    document.querySelector('.academy>a').hidden = true;
}
render();

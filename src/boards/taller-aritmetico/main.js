import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/fredoka/latin-600.css';
import '../fracciones/style.css';
import './style.css';
import { initialWorkshop, workshopLesson, TOPICS } from './engine.js';
import { attachDrawing } from '../fracciones/annotations.js';
import { decorateMathText } from '../fracciones/math-text.js';
import { CombinedAdapter } from '../operaciones-combinadas/adapter';
import { attachLive } from '../../live/attach';
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
const icons = { pencil, text, ruler, image, hand, eraser, undo, trash, 'eye-closed': eyeClosed, eye };
const $ = id => document.getElementById(id), el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined)
    n.textContent = text; if (cls)
    n.className = cls; return n; };
document.querySelectorAll('[data-icon]').forEach(n => { const img = el('img'); img.src = icons[n.dataset.icon]; img.alt = ''; n.append(img); });
const query = new URLSearchParams(location.search), adapter = new CombinedAdapter(query.has('room') && query.get('role') !== 'teacher' ? 'student' : 'teacher');
let drawing, key = '', controlsKey = '', drawingKey = '', exam = false, large = false;
const revealed = new Set(), editable = () => adapter.canEdit, lesson = () => adapter.getState().fields.exercise || initialWorkshop();
function update(fn) { if (!editable())
    return; adapter.commit(state => { const next = structuredClone(state.fields.exercise || initialWorkshop()); fn(next); state.fields.exercise = next; }); }
const set = (path, value) => update(s => { const parts = path.split('.'), last = parts.pop(); parts.reduce((o, k) => o[k], s)[last] = value; s.shown = 0; revealed.clear(); });
const get = (s, path) => path.split('.').reduce((o, k) => o[k], s);
const button = (text, action, cls) => { const n = el('button', text, cls); n.type = 'button'; n.onclick = action; return n; };
function input(label, path, type = 'text', min, max) { const wrap = el('label', label), n = el('input'); n.dataset.path = path; n.type = type; n.setAttribute('aria-label', label); if (type === 'text')
    n.maxLength = path === 'fractions' ? 160 : path === 'bases.value' ? 24 : 100;
else {
    n.min = min;
    n.max = max;
} n.oninput = () => { if (type === 'number') {
    if (!n.value)
        return;
    set(path, Math.max(min, Math.min(max, Math.trunc(Number(n.value)))));
}
else
    set(path, n.value); }; n.onblur = () => n.value = get(lesson(), path); wrap.append(n); return wrap; }
function select(label, path, options) { const wrap = el('label', label), n = el('select'); n.dataset.path = path; n.setAttribute('aria-label', label); options.forEach(([id, text]) => { const o = el('option', text); o.value = id; n.append(o); }); n.onchange = () => set(path, n.value); wrap.append(n); return wrap; }
function math(source) { const n = el('div', undefined, 'workshop-math'), runs = []; let at = 0; for (const match of source.matchAll(/\^(-?\d+)/g)) {
    if (match.index > at)
        runs.push({ text: source.slice(at, match.index), sup: false });
    runs.push({ text: match[1], sup: true });
    at = match.index + match[0].length;
} if (at < source.length)
    runs.push({ text: source.slice(at), sup: false }); decorateMathText(n, runs); return n; }
const EXAMPLES = { mcm: ['12, 18, 24', '8, 12', '15, 25, 30'], mcd: ['24, 36, 60', '18, 30', '48, 72, 120'], powers: ['3^4', '(-2)^5', '5^0'], fractions: ['4/7 + 3/4', '1/2 ÷ 3/4', '(2/3 + 1/6) × 3/5'], decomposition: ['360', '840', '1024'], bases: ['125', '10,625', '0,1'], free: [] };
function useExample(value) { update(s => { if (s.topic === 'powers') {
    const match = /\(?(-?\d+)\)?\^(\d+)/.exec(value);
    s.powers = { base: match[1], exponent: Number(match[2]) };
}
else if (s.topic === 'bases')
    s.bases = { value, from: 10, to: 2 };
else
    s[s.topic] = value; s.shown = 0; revealed.clear(); }); }
function renderControls(s) {
    if (controlsKey === s.topic)
        return;
    controlsKey = s.topic;
    const controls = $('controls');
    controls.replaceChildren();
    if (s.topic === 'mcm' || s.topic === 'mcd')
        controls.append(input('Números separados por comas', s.topic));
    else if (s.topic === 'powers')
        controls.append(input('Base', 'powers.base'), input('Exponente', 'powers.exponent', 'number', 0, 20));
    else if (s.topic === 'fractions')
        controls.append(input('Operación', 'fractions'), el('small', 'Ejemplo: 4/7 + 3/4 · Usa ÷ para dividir fracciones.'));
    else if (s.topic === 'decomposition')
        controls.append(input('Número', 'decomposition'), select('Forma', 'decompositionMode', [['prime', 'Factores primos'], ['decimal', 'Valor posicional']]));
    else if (s.topic === 'bases')
        controls.append(input('Número', 'bases.value'), input('Base de origen', 'bases.from', 'number', 2, 36), input('Base de destino', 'bases.to', 'number', 2, 36), el('small', 'Coma o punto para decimales; A=10, B=11… hasta Z=35.'));
    else
        controls.append(el('p', 'El lienzo está listo. Dibuja con el mouse o con tu tableta gráfica, pega imágenes o escribe con Texto.'));
    if (s.topic !== 'free')
        controls.append(button('Resolver paso a paso', () => update(s => s.shown = 1), 'resolve'));
    $('examples').replaceChildren();
    if (EXAMPLES[s.topic].length) {
        $('examples').append(el('span', 'Prueba:'));
        EXAMPLES[s.topic].forEach(value => $('examples').append(button(value, () => useExample(value))));
    }
}
function render() {
    const s = lesson();
    renderControls(s);
    document.querySelectorAll('[data-path]').forEach(n => { if (n !== document.activeElement)
        n.value = get(s, n.dataset.path); n.disabled = !editable(); });
    document.querySelectorAll('[data-topic]').forEach(n => { n.setAttribute('aria-selected', String(s.topic === n.dataset.topic)); n.disabled = !editable(); });
    const nextKey = JSON.stringify(s) + '|' + editable();
    if (nextKey !== key) {
        key = nextKey;
        $('error').hidden = true;
        $('output').replaceChildren();
        try {
            const compiled = workshopLesson(s), head = el('div', undefined, 'exercise-title');
            head.append(el('span', s.topic === 'free' ? 'Pizarra libre' : 'Ejercicio'), math(compiled.exercise));
            $('output').append(head);
            if (compiled.steps.length) {
                const actions = el('div', undefined, 'solution-actions'), shown = Math.min(s.shown, compiled.steps.length), next = button('Siguiente paso →', () => update(s => s.shown = Math.min(compiled.steps.length, s.shown + 1)), 'next');
                next.disabled = !editable() || shown === compiled.steps.length;
                const all = button('Mostrar todos', () => update(s => s.shown = compiled.steps.length));
                const reset = button('Reiniciar pasos', () => update(s => { s.shown = 0; revealed.clear(); }));
                actions.append(next, all, reset, el('span', `${shown} de ${compiled.steps.length} pasos`));
                $('output').append(actions);
                const steps = el('div', undefined, 'worked-steps');
                compiled.steps.slice(0, shown).forEach((step, i) => { const box = el('div', undefined, 'worked-step' + (step.answer ? ' final-answer' : '')); box.classList.add('concealable'); if (revealed.has(i))
                    box.classList.add('revealed'); box.append(el('h2', `${i + 1}. ${step.title}`), math(step.text)); box.onclick = () => { if (exam) {
                    revealed.has(i) ? revealed.delete(i) : revealed.add(i);
                    box.classList.toggle('revealed', revealed.has(i));
                } }; steps.append(box); });
                $('output').append(steps);
                if (!shown)
                    $('output').append(el('p', 'Resuelve aquí con tus herramientas. Muestra cada paso cuando lo necesites.', 'scratch-hint'));
            }
            else
                $('output').append(el('p', '↑ escribe exponentes · ↓ vuelve al renglón normal · Enter continúa abajo', 'scratch-hint'));
        }
        catch (error) {
            $('error').hidden = false;
            $('error').textContent = error.message;
            $('output').append(el('p', 'Puedes corregir el ejercicio y continuar escribiendo en el lienzo.', 'scratch-hint'));
        }
    }
    $('board').classList.toggle('solution-hidden', exam);
    for (const id of ['controls', 'examples'])
        $(id).querySelectorAll('button').forEach(b => b.disabled = !editable());
    if (!editable())
        $('output').querySelectorAll('button').forEach(b => b.disabled = true);
    const items = adapter.getState().fields.drawing || [], dk = JSON.stringify(items);
    if (drawing && drawingKey !== dk) {
        drawingKey = dk;
        drawing.set(items);
    }
    drawing?.refresh();
}
TOPICS.forEach(([id, title]) => { const b = button(title, () => update(s => { s.topic = id; s.shown = 0; revealed.clear(); })); b.dataset.topic = id; $('topics').append(b); });
$('toggle-upper').onclick = () => { const hidden = $('upper-area').hidden = !$('upper-area').hidden; $('toggle-upper').textContent = hidden ? 'Mostrar menú superior' : 'Ocultar menú superior'; };
$('toggle-lower').onclick = () => { const hidden = $('toolbar').hidden = !$('toolbar').hidden; $('toggle-lower').textContent = hidden ? 'Mostrar herramientas' : 'Ocultar herramientas'; };
$('large-board').onclick = () => { large = !large; document.body.classList.toggle('large-board', large); $('large-board').textContent = large ? 'Tamaño normal' : 'Pizarra grande'; };
$('hide-answers').onclick = () => { exam = true; revealed.clear(); $('board').classList.add('solution-hidden'); };
$('show-answers').onclick = () => { exam = false; $('board').classList.remove('solution-hidden'); };
const by = id => $(id);
drawing = attachDrawing({ canvas: $('annotation-canvas'), toolbar: $('toolbar'), canEdit: editable, onChange: items => { drawingKey = JSON.stringify(items); adapter.commit(state => state.fields.drawing = items); }, textUI: { button: by('text-button'), panel: by('text-options'), editor: by('text-editor'), up: by('text-up'), down: by('text-down'), size: by('text-size'), color: by('text-color'), close: by('text-close'), error: by('text-error'), signs: [...document.querySelectorAll('[data-text-sign]')] }, fractionUI: { panel: $('fraction-options'), n: $('fraction-n'), d: $('fraction-d'), error: $('drawing-error') } });
adapter.subscribe(render);
const live = attachLive(adapter, { boardId: 'taller-aritmetico', workspace: $('workspace'), slot: $('live-slot') });
live.subscribe(view => { $('room-status').hidden = view.status === 'active' && !view.error; $('room-status').textContent = view.error || (view.status === 'waiting' ? 'Esperando la aceptación del profesor…' : view.status === 'paused' ? 'La clase está en pausa.' : 'Conectando a la sala…'); });
if (live.mode === 'solo')
    $('live-slot').append(button('Clase', () => location.assign('/profesor/?board=taller-aritmetico')));
render();

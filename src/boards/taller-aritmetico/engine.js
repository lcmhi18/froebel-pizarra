import { rat, gcd, lcm, add, sub, mul, div, power } from '../fracciones/engine.js';
const MAX = 1000000;
export const TOPICS = [['mcm', 'MCM'], ['mcd', 'MCD'], ['powers', 'Exponentes'], ['fractions', 'Fracciones'], ['decomposition', 'Descomposición'], ['bases', 'Cambio de base'], ['free', 'Pizarra libre']];
export function initialWorkshop() { return { topic: 'mcm', mcm: '12, 18, 24', mcd: '24, 36, 60', powers: { base: '3', exponent: 4 }, fractions: '4/7 + 3/4', decomposition: '360', decompositionMode: 'prime', bases: { value: '125', from: 10, to: 2 }, shown: 0 }; }
const object = x => !!x && typeof x === 'object' && !Array.isArray(x), only = (o, keys) => Object.keys(o).every(k => keys.includes(k)), str = (x, n) => typeof x === 'string' && x.length <= n;
export function validWorkshop(s) { return object(s) && only(s, ['topic', 'mcm', 'mcd', 'powers', 'fractions', 'decomposition', 'decompositionMode', 'bases', 'shown']) && TOPICS.some(([id]) => id === s.topic) && str(s.mcm, 100) && str(s.mcd, 100) && object(s.powers) && only(s.powers, ['base', 'exponent']) && str(s.powers.base, 24) && Number.isInteger(s.powers.exponent) && s.powers.exponent >= 0 && s.powers.exponent <= 20 && str(s.fractions, 160) && str(s.decomposition, 16) && ['prime', 'decimal'].includes(s.decompositionMode) && object(s.bases) && only(s.bases, ['value', 'from', 'to']) && str(s.bases.value, 64) && [s.bases.from, s.bases.to].every(n => Number.isInteger(n) && n >= 2 && n <= 36) && Number.isInteger(s.shown) && s.shown >= 0 && s.shown <= 200; }
function integer(raw, min = 1, max = MAX) { if (!/^\d+$/.test(raw.trim()))
    throw Error('Escribe un número entero.'); const n = Number(raw); if (!Number.isSafeInteger(n) || n < min || n > max)
    throw Error(`Usa números entre ${min} y ${max.toLocaleString('es-PE')}.`); return n; }
export function primeFactors(n) { const result = []; for (let p = 2; p * p <= n; p += (p === 2 ? 1 : 2)) {
    let exponent = 0;
    while (n % p === 0) {
        n /= p;
        exponent++;
    }
    if (exponent)
        result.push([p, exponent]);
} if (n > 1)
    result.push([n, 1]); return result; }
const factorText = f => f.length ? f.map(([p, e]) => e === 1 ? String(p) : `${p}^${e}`).join(' × ') : '1';
const step = (title, text, answer = false) => ({ title, text, answer });
export function commonLesson(raw, kind) { const values = raw.split(/[,;\s]+/).filter(Boolean).map(x => integer(x)); if (values.length < 2 || values.length > 6)
    throw Error('Escribe de 2 a 6 números separados por comas.'); const factors = values.map(primeFactors), primes = [...new Set(factors.flatMap(f => f.map(x => x[0])))].sort((a, b) => a - b), chosen = primes.map(p => [p, (kind === 'mcm' ? Math.max : Math.min)(...factors.map(f => f.find(x => x[0] === p)?.[1] || 0))]).filter(x => x[1]); const answer = values.map(BigInt).reduce(kind === 'mcm' ? lcm : gcd); return { exercise: `${kind.toUpperCase()}(${values.join(', ')})`, steps: [...values.map((n, i) => step(`Descomponemos ${n}`, `${n} = ${factorText(factors[i])}`)), step('Elegimos los factores', kind === 'mcm' ? 'Tomamos todos los primos con su mayor exponente.' : 'Tomamos solo los primos comunes con su menor exponente.'), step('Multiplicamos los factores elegidos', `${factorText(chosen)} = ${answer}`), step(`Respuesta: ${kind.toUpperCase()}`, String(answer), true)], result: answer }; }
export function decompositionLesson(raw, mode) { const n = integer(raw, 1, 999999999), steps = []; if (mode === 'decimal') {
    const terms = String(n).split('').map((digit, i, a) => ({ digit: Number(digit), exp: a.length - i - 1 })).filter(t => t.digit);
    steps.push(step('Valor de cada cifra', terms.map(t => `${t.digit} × 10^${t.exp}`).join(' + ')));
    steps.push(step('Descomposición aditiva', terms.map(t => String(t.digit * 10 ** t.exp)).join(' + ') + ' = ' + n, true));
}
else {
    let remainder = n;
    for (const [p, e] of primeFactors(n))
        for (let i = 0; i < e; i++) {
            const q = remainder / p;
            steps.push(step(`Dividimos entre ${p}`, `${remainder} ÷ ${p} = ${q}`));
            remainder = q;
        }
    if (n === 1)
        steps.push(step('El número 1', '1 no es primo y no tiene factores primos.'));
    steps.push(step('Descomposición en factores primos', `${n} = ${factorText(primeFactors(n))}`, true));
} return { exercise: `Descomponer ${n}`, steps, result: BigInt(n) }; }
export function powersLesson(base, exponent) { if (!/^[+-]?\d{1,8}$/.test(base.trim()))
    throw Error('Escribe una base entera de hasta 8 cifras.'); const b = BigInt(base), e = exponent; if (!Number.isInteger(e) || e < 0 || e > 20)
    throw Error('Usa un exponente entre 0 y 20.'); if (b === 0n && e === 0)
    throw Error('0 elevado a 0 no está definido.'); const answer = b ** BigInt(e), steps = []; if (e === 0)
    steps.push(step('Exponente cero', 'Todo número distinto de cero elevado a cero es 1.'));
else {
    steps.push(step('Multiplicación repetida', Array(e).fill(b < 0n ? `(${b})` : String(b)).join(' × ')));
    let partial = 1n;
    for (let i = 1; i <= e; i++) {
        const before = partial;
        partial *= b;
        steps.push(step(`Multiplicación ${i}`, `${before} × ${b < 0n ? `(${b})` : b} = ${partial}`));
    }
} steps.push(step('Resultado de la potencia', `${b < 0n ? `(${b})` : b}^${e} = ${answer}`, true)); return { exercise: `${b < 0n ? `(${b})` : b}^${e}`, steps, result: answer }; }
// Closed arithmetic grammar: no eval, arbitrary code, implicit multiplication or silent leftovers.
export function fractionLesson(raw) {
    if (raw.length > 160)
        throw Error('Usa un ejercicio de hasta 160 caracteres.');
    if (/\d\s+\d/.test(raw))
        throw Error('Separa los números con un signo de operación. Para un mixto, escribe (1 + 1/2).');
    const source = raw.replaceAll('−', '-').replaceAll('×', '*').replaceAll('÷', ':');
    const compact = source.replace(/\s/g, '');
    const tokens = compact.match(/\d+\/[+-]?\d+|\d+|[+\-*/:^()]/g) || [];
    if (tokens.join('') !== compact)
        throw Error('Usa enteros, fracciones y los signos +, −, ×, ÷, ^ y paréntesis.');
    let at = 0, operations = 0;
    const steps = [];
    const show = a => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
    const literal = () => { if (tokens[at] === '(') {
        at++;
        const a = sum();
        if (tokens[at++] !== ')')
            throw Error('Falta cerrar un paréntesis.');
        return a;
    } const t = tokens[at++]; if (!t || !/^\d{1,12}(?:\/[+-]?\d{1,12})?$/.test(t))
        throw Error('Escribe un entero o una fracción con hasta 12 cifras.'); const [n, d = '1'] = t.split('/'); return rat(n, d); };
    const raised = () => { let a = literal(); if (tokens[at] === '^') {
        at++;
        const e = signed();
        if (e.d !== 1n || e.n < 0n || e.n > 8n)
            throw Error('En este ejercicio usa exponentes enteros de 0 a 8.');
        if ((a.n.toString().length + a.d.toString().length) * Number(e.n) > 250)
            throw Error('La potencia es demasiado grande. Usa números o exponentes más pequeños.');
        const v = power(a, Number(e.n));
        steps.push(step('Resolvemos la potencia', `(${show(a)})^${e.n} = ${show(v)}`));
        a = v;
    } return a; };
    const signed = () => { if (tokens[at] === '+' || tokens[at] === '-') {
        const sign = tokens[at++], a = signed();
        return sign === '-' ? rat(-a.n, a.d) : a;
    } return raised(); };
    const calculate = (a, b, op) => { if (++operations > 40)
        throw Error('Usa hasta 40 operaciones por ejercicio.'); if ((op === '+' || op === '-') && a.d !== b.d) {
        const common = lcm(a.d, b.d);
        steps.push(step('Buscamos un denominador común', `${a.n * (common / a.d)}/${common} ${op} ${b.n * (common / b.d)}/${common}`));
    } if (op === ':')
        steps.push(step('Multiplicamos por la inversa', `(${show(a)}) × (${show(rat(b.d, b.n))})`)); const value = ({ '+': add, '-': sub, '*': mul, '/': div, ':': div }[op])(a, b); steps.push(step(op === '/' ? 'Formamos la fracción y simplificamos' : 'Resolvemos y simplificamos', `(${show(a)}) ${op === '*' ? '×' : op === '/' || op === ':' ? '÷' : op} (${show(b)}) = ${show(value)}`)); if (value.n.toString().length > 250 || value.d.toString().length > 250)
        throw Error('El resultado es demasiado grande. Prueba un ejercicio más corto.'); return value; };
    const product = () => { let a = signed(); while (['*', '/', ':'].includes(tokens[at])) {
        const op = tokens[at++];
        a = calculate(a, signed(), op);
    } return a; };
    const sum = () => { let a = product(); while (['+', '-'].includes(tokens[at])) {
        const op = tokens[at++];
        a = calculate(a, product(), op);
    } return a; };
    if (!tokens.length)
        throw Error('Escribe una operación, por ejemplo 4/7 + 3/4.');
    const answer = sum();
    if (at !== tokens.length)
        throw Error('Revisa los signos y los paréntesis del ejercicio.');
    steps.push(step('Respuesta simplificada', show(answer), true));
    return { exercise: raw, steps, result: answer };
}
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function readBase(raw, base) { if (!Number.isInteger(base) || base < 2 || base > 36)
    throw Error('Usa bases entre 2 y 36.'); const source = raw.trim().toUpperCase().replace(',', '.'); const m = /^([+-]?)([0-9A-Z]+)(?:\.([0-9A-Z]+))?$/.exec(source); if (!m || source.length > 24)
    throw Error('Escribe un número de hasta 24 caracteres; usa coma o punto para la parte decimal.'); const parse = text => [...text].reduce((n, c) => { const d = DIGITS.indexOf(c); if (d >= base)
    throw Error(`La cifra ${c} no existe en base ${base}.`); return n * BigInt(base) + BigInt(d); }, 0n), integer = parse(m[2]), fraction = m[3] || '', denominator = BigInt(base) ** BigInt(fraction.length), value = rat((integer * denominator + parse(fraction)) * (m[1] === '-' ? -1n : 1n), denominator); return { value, whole: m[2], fraction, negative: m[1] === '-' }; }
export function baseLesson(raw, from, to) {
    if (!Number.isInteger(to) || to < 2 || to > 36)
        throw Error('Usa bases entre 2 y 36.');
    const parsed = readBase(raw, from), value = parsed.value, absolute = value.n < 0n ? -value.n : value.n, whole = absolute / value.d;
    let remainder = absolute % value.d, n = whole;
    const steps = [], integerDigits = [], decimalDigits = [], seen = new Map();
    const sourceTerms = [...parsed.whole + parsed.fraction].map((c, i) => `${DIGITS.indexOf(c)} × ${from}^${parsed.whole.length - i - 1}`);
    steps.push(step(`Interpretamos el número en base ${from}`, sourceTerms.join(' + ') + (parsed.negative ? ' (aplicamos el signo − al resultado)' : '')));
    steps.push(step('Valor exacto antes de convertir', `${value.n}/${value.d}`));
    if (n === 0n)
        integerDigits.push('0');
    while (n > 0n) {
        const q = n / BigInt(to), r = n % BigInt(to);
        integerDigits.push(DIGITS[Number(r)]);
        steps.push(step('División sucesiva de la parte entera', `${n} ÷ ${to} = ${q}; residuo ${r}${r >= 10n ? ' (' + DIGITS[Number(r)] + ')' : ''}`));
        n = q;
    }
    steps.push(step('Leemos los residuos de abajo hacia arriba', integerDigits.toReversed().join('')));
    while (remainder && !seen.has(remainder) && decimalDigits.length < 32) {
        seen.set(remainder, decimalDigits.length);
        const before = remainder, product = remainder * BigInt(to), digit = product / value.d;
        remainder = product % value.d;
        decimalDigits.push(DIGITS[Number(digit)]);
        steps.push(step('Multiplicación sucesiva de la parte fraccionaria', `${before}/${value.d} × ${to} = ${digit} + ${remainder}/${value.d}; guardamos ${DIGITS[Number(digit)]}`));
    }
    let fractional = decimalDigits.join(''), approximate = false;
    if (remainder) {
        if (seen.has(remainder)) {
            const start = seen.get(remainder);
            fractional = fractional.slice(0, start) + '(' + fractional.slice(start) + ')';
            steps.push(step('Aparece un período', 'El residuo se repite. Las cifras entre paréntesis se repiten sin terminar.'));
        }
        else {
            approximate = true;
            fractional += '…';
            steps.push(step('La expansión continúa', 'Mostramos las primeras 32 cifras fraccionarias; el resultado mostrado es una aproximación.'));
        }
    }
    const answer = (value.n < 0n ? '-' : '') + integerDigits.toReversed().join('') + (fractional ? ',' + fractional : '');
    steps.push(step(approximate ? 'Resultado aproximado' : 'Resultado', `${raw} (base ${from}) = ${answer} (base ${to})`, true));
    return { exercise: `${raw} (base ${from}) → base ${to}`, steps, result: answer, approximate, value };
}
export function workshopLesson(s) { switch (s.topic) {
    case 'mcm':
    case 'mcd': return commonLesson(s[s.topic], s.topic);
    case 'powers': return powersLesson(s.powers.base, s.powers.exponent);
    case 'fractions': return fractionLesson(s.fractions);
    case 'decomposition': return decompositionLesson(s.decomposition, s.decompositionMode);
    case 'bases': return baseLesson(s.bases.value, s.bases.from, s.bases.to);
    default: return { exercise: 'Tu espacio para resolver y explicar', steps: [] };
} }

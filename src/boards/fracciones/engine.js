export const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) {
    [a, b] = [b, a % b];
} return a; };
export const lcm = (a, b) => a / gcd(a, b) * b;
export function rat(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d === 0n)
    throw Error('No se puede dividir entre cero.'); if (d < 0n) {
    n = -n;
    d = -d;
} const g = gcd(n, d); return { n: n / g, d: d / g }; }
export const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d), sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d), mul = (a, b) => rat(a.n * b.n, a.d * b.d), div = (a, b) => { if (!b.n)
    throw Error('No se puede dividir entre cero.'); return rat(a.n * b.d, a.d * b.n); };
export function power(a, e) { e = Number(e); if (!Number.isInteger(e) || Math.abs(e) > 8)
    throw Error('Usa exponentes enteros entre −8 y 8.'); if (!a.n && e === 0)
    throw Error('0 elevado a 0 no está definido.'); if (e < 0) {
    if (!a.n)
        throw Error('Cero no puede tener exponente negativo.');
    return rat(a.d ** BigInt(-e), a.n ** BigInt(-e));
} return rat(a.n ** BigInt(e), a.d ** BigInt(e)); }
export const compare = (a, b) => a.n * b.d === b.n * a.d ? 0 : a.n * b.d > b.n * a.d ? 1 : -1;
export function decimalFraction(raw) { if (typeof raw !== 'string' || raw.length > 128)
    throw Error('No entendí ese decimal.'); const m = /^([+-]?)(\d+)(?:[.,](\d*)(?:\((\d+)\))?)?$/.exec(raw.trim()); if (!m)
    throw Error('No entendí ese decimal. Ejemplos: 0,72 · 0,(35) · 1,2(3).'); const sign = m[1] === '-' ? -1n : 1n, A = BigInt(m[2]), digits = m[3] || '', period = m[4] || '', base = 10n ** BigInt(digits.length); if (period) {
    const nines = 10n ** BigInt(period.length) - 1n;
    return rat(sign * (A * base * nines + BigInt(digits || '0') * nines + BigInt(period)), base * nines);
} return rat(sign * (A * base + BigInt(digits || '0')), base); }
export function fractionDecimal(value, maxDigits = 200) { const a = rat(value.n, value.d), sign = a.n < 0n ? '-' : '', n = a.n < 0n ? -a.n : a.n, whole = n / a.d; let rem = n % a.d, digits = '', seen = new Map(); while (rem && !seen.has(rem) && digits.length < maxDigits) {
    seen.set(rem, digits.length);
    rem *= 10n;
    digits += String(rem / a.d);
    rem %= a.d;
} const at = rem && seen.has(rem) ? seen.get(rem) : -1; return { sign, whole: String(whole), nonrepeat: at < 0 ? digits : digits.slice(0, at), repeat: at < 0 ? '' : digits.slice(at), truncated: !!rem && at < 0 }; }
export function mixed(a) { const sign = a.n < 0n ? -1n : 1n, n = a.n < 0n ? -a.n : a.n; return { whole: sign * (n / a.d), remainder: n % a.d, denominator: a.d, negative: sign < 0n }; }
export function operandValue(o) { if (o.type === 'decimal')
    return decimalFraction(o.decimal); const base = rat(o.n, o.d); if (o.type === 'mixed') {
    const w = BigInt(o.whole);
    return w < 0n ? rat(w * base.d - (base.n < 0n ? -base.n : base.n), base.d) : rat(w * base.d + base.n, base.d);
} return base; }
export function operationLesson(operands, operators) { if (operands.length < 2 || operands.length > 6 || operators.length !== operands.length - 1)
    throw Error('Usa de dos a seis números.'); const steps = [], values = operands.map((o, i) => { const a = operandValue(o); if (o.type !== 'fraction')
    steps.push({ title: `Convertimos el número ${i + 1} a fracción`, parts: [...(o.type === 'decimal' ? [{ decimal: fractionDecimal(a) }] : [String(o.whole), rat(o.n, o.d)]), ' = ', a] }); const e = Number(o.exp); const v = power(a, e); if (e !== 1)
    steps.push({ title: `Aplicamos la potencia ${e}`, parts: [a, ` elevado a ${e} = `, v] }); return v; }); const ops = [...operators]; const calculate = i => { const a = values[i], b = values[i + 1], op = ops[i]; if (['+', '-'].includes(op) && a.d !== b.d) {
    const common = lcm(a.d, b.d);
    steps.push({ title: `Denominador común: mcm(${a.d}, ${b.d}) = ${common}`, parts: [{ n: a.n * (common / a.d), d: common }, op === '+' ? ' + ' : ' − ', { n: b.n * (common / b.d), d: common }] });
} if (op === '/') {
    if (!b.n)
        throw Error('No se puede dividir entre cero.');
    steps.push({ title: 'Para dividir, multiplicamos por la inversa', parts: [a, ' × ', rat(b.d, b.n)] });
} const result = ({ '+': add, '-': sub, '*': mul, '/': div }[op])(a, b); steps.push({ title: ({ '+': 'Sumamos', '-': 'Restamos', '*': 'Multiplicamos', '/': 'Dividimos' }[op]) + ' y simplificamos', parts: [a, { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ' }[op], b, ' = ', result] }); values.splice(i, 2, result); ops.splice(i, 1); }; for (let i = 0; i < ops.length;)
    if (['*', '/'].includes(ops[i]))
        calculate(i);
    else
        i++; while (ops.length)
    calculate(0); const result = values[0]; steps.push({ title: 'Respuesta simplificada', parts: [result], answer: true }); if ((result.n < 0n ? -result.n : result.n) > result.d && result.d !== 1n)
    steps.push({ title: 'También como número mixto', parts: [{ mixed: mixed(result) }], answer: true }); return { steps, result }; }
export function decimalLesson(direction, { n, d, decimal }) { if (direction === 'toFraction') {
    const value = decimalFraction(decimal), m = /^([+-]?)(\d+)[.,](\d*)(?:\((\d+)\))?$/.exec(decimal.trim()), steps = [];
    if (m?.[4]) {
        const digits = m[3].length, period = m[4].length;
        steps.push({ title: 'Llamamos x al decimal', parts: ['x = ', { decimal: fractionDecimal(value) }] });
        steps.push({ title: 'Desplazamos y restamos para eliminar el período', parts: [`${10n ** BigInt(digits + period)}x − ${10n ** BigInt(digits)}x`, '; el período se cancela.'] });
        const sign = m[1] === '-' ? -1n : 1n, upper = BigInt(m[2] + m[3] + m[4]), lower = BigInt(m[2] + m[3]), denominator = (10n ** BigInt(period) - 1n) * 10n ** BigInt(digits);
        steps.push({ title: 'Restamos las partes enteras y despejamos x', parts: [`${denominator}x = ${sign * (upper - lower)}; x = `, { n: sign * (upper - lower), d: denominator }] });
    }
    else
        steps.push({ title: 'Quitamos la coma y dividimos por una potencia de 10', parts: [{ n: BigInt((m?.[2] || decimal.split(/[.,]/)[0]) + (m?.[3] || '')) * (m?.[1] === '-' ? -1n : 1n), d: 10n ** BigInt(m?.[3]?.length || 0) }] });
    steps.push({ title: 'Simplificamos la fracción', parts: [value], answer: true });
    return { steps, result: value };
} const value = rat(n, d), representation = fractionDecimal(value); return { result: value, steps: [{ title: 'Dividimos el numerador entre el denominador', parts: [value, ` → ${value.n} ÷ ${value.d}`] }, { title: representation.repeat ? 'El residuo se repite: aparece un período' : 'La división termina: decimal exacto', parts: [{ decimal: representation }] }, { title: 'Respuesta', parts: [{ decimal: representation }], answer: true }] }; }
export const FIGURES = [{ id: 'pizza', name: 'Pizza', d: null }, { id: 'circle', name: 'Círculo', d: null }, { id: 'square', name: 'Cuadrado', d: null }, { id: 'rectangle', name: 'Rectángulo', d: null }, { id: 'chicken', name: 'Pollo', d: null }, { id: 'chocolate', name: 'Chocolate', d: null }, { id: 'donut', name: 'Dona', d: null }, { id: 'triangles', name: 'Rectángulo de triángulos', d: 16 }, { id: 'thirds', name: 'Cuadrado en 4 con tercios', d: 12 }, { id: 'weighted', name: 'Rectángulo 3×2', d: 36 }];
export const weightsFor = (figure, d) => figure === 'weighted' ? [2, 2, 2, 3, 3, 6, 6, 6, 6] : Array(figure === 'triangles' ? 16 : figure === 'thirds' ? 12 : d).fill(1);
export function chooseParts(weights, total) { const sums = new Map([[0, []]]); weights.forEach((w, i) => { for (const [n, list] of [...sums])
    if (!sums.has(n + w))
        sums.set(n + w, [...list, i]); }); for (let n = total; n >= 0; n--)
    if (sums.has(n))
        return { total: n, indices: sums.get(n) }; return { total: 0, indices: [] }; }

const ns = 'http://www.w3.org/2000/svg';
const svg = (tag, attributes = {}) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attributes))
    e.setAttribute(k, String(v)); return e; };
export function regionsFor(type, d) {
    const regions = [];
    const rect = (x, y, w, h, weight = 1) => ({ tag: 'rect', attrs: { x, y, width: w, height: h }, weight });
    if (['pizza', 'circle', 'donut'].includes(type)) {
        for (let i = 0; i < d; i++) {
            const a = -Math.PI / 2 + i * 2 * Math.PI / d, b = -Math.PI / 2 + (i + 1) * 2 * Math.PI / d, R = 127, r = type === 'donut' ? 47 : 0, cx = 200, cy = 150;
            if (d === 1) {
                regions.push({ tag: 'path', attrs: { d: r ? `M${cx + R} ${cy}a${R} ${R} 0 1 0 ${-R * 2} 0a${R} ${R} 0 1 0 ${R * 2} 0M${cx + r} ${cy}a${r} ${r} 0 1 1 ${-r * 2} 0a${r} ${r} 0 1 1 ${r * 2} 0` : `M${cx + R} ${cy}a${R} ${R} 0 1 0 ${-R * 2} 0a${R} ${R} 0 1 0 ${R * 2} 0`, 'fill-rule': 'evenodd' }, weight: 1 });
                continue;
            }
            const p = t => [cx + R * Math.cos(t), cy + R * Math.sin(t)], q = t => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
            regions.push({ tag: 'path', attrs: { d: r ? `M${p(a)}A${R} ${R} 0 ${b - a > Math.PI ? 1 : 0} 1 ${p(b)}L${q(b)}A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 0 ${q(a)}Z` : `M${cx},${cy}L${p(a)}A${R} ${R} 0 ${b - a > Math.PI ? 1 : 0} 1 ${p(b)}Z` }, weight: 1 });
        }
        return regions;
    }
    if (type === 'triangles') {
        for (let y = 0; y < 2; y++)
            for (let x = 0; x < 4; x++) {
                const X = 40 + x * 80, Y = 70 + y * 80;
                regions.push({ tag: 'polygon', attrs: { points: `${X},${Y} ${X + 80},${Y} ${X},${Y + 80}` }, weight: 1 }, { tag: 'polygon', attrs: { points: `${X + 80},${Y} ${X + 80},${Y + 80} ${X},${Y + 80}` }, weight: 1 });
            }
        return regions;
    }
    if (type === 'thirds') {
        for (let y = 0; y < 2; y++)
            for (let x = 0; x < 2; x++)
                for (let i = 0; i < 3; i++)
                    regions.push({ ...rect(80 + x * 120 + i * 40, 30 + y * 120, 40, 120), blue: x === 1 && y === 0 });
        return regions;
    }
    if (type === 'weighted') {
        for (let cell = 0; cell < 6; cell++) {
            const x = 35 + (cell % 3) * 110, y = 45 + Math.floor(cell / 3) * 105;
            if (cell === 0)
                for (let i = 0; i < 3; i++)
                    regions.push(rect(x + i * 110 / 3, y, 110 / 3, 105, 2));
            else if (cell === 1)
                regions.push({ tag: 'polygon', attrs: { points: `${x},${y} ${x + 110},${y} ${x},${y + 105}` }, weight: 3 }, { tag: 'polygon', attrs: { points: `${x + 110},${y} ${x + 110},${y + 105} ${x},${y + 105}` }, weight: 3 });
            else
                regions.push(rect(x, y, 110, 105, 6));
        }
        return regions;
    }
    const square = type === 'square', W = square ? 240 : 330, H = square ? 240 : 210, X = (400 - W) / 2, Y = (300 - H) / 2;
    for (let i = 0; i < d; i++)
        regions.push(rect(X + i * W / d, Y, W / d, H));
    return regions;
}
export function figureNode(type, d, colors, { line, lineWidth }, onPick, copy = 0) { const root = svg('svg', { viewBox: '0 0 400 300', role: 'group', 'aria-label': `Figura ${copy + 1}` }), defs = svg('defs'); root.append(defs); const regions = regionsFor(type, d), texture = ['pizza', 'donut', 'chocolate', 'chicken'].includes(type) ? `/assets/fracciones/${type}.png` : null; regions.forEach((region, i) => { const shape = svg(region.tag, { ...region.attrs }), group = svg('g', { class: 'fraction-piece', role: 'button', tabindex: 0, 'aria-label': `Parte ${i + 1}${region.weight > 1 ? ', vale ' + region.weight + ' de ' + d : ''}`, 'aria-pressed': String(!!colors[i]) }); const selected = !!colors[i], fill = colors[i]; const clip = svg('clipPath', { id: `fraction-${copy}-${i}` }); clip.append(shape.cloneNode()); defs.append(clip); shape.setAttribute('fill', fill && fill !== 'original' ? fill : type === 'chocolate' ? '#88552e' : type === 'chicken' ? '#efb45e' : type === 'pizza' ? '#ffc93c' : type === 'donut' ? '#f3a4c5' : '#4d96ff'); shape.setAttribute('opacity', selected ? '1' : '.18'); group.append(shape); if (texture) {
    const image = svg('image', { href: texture, ...(type === 'chocolate' ? { x: 27, y: -140, width: 346, height: 580 } : type === 'chicken' ? { x: 26, y: -68, width: 348, height: 421 } : { x: 65, y: 15, width: 270, height: 270 }), preserveAspectRatio: type === 'chocolate' || type === 'chicken' ? 'none' : 'xMidYMid meet', 'clip-path': `url(#fraction-${copy}-${i})`, opacity: selected ? '1' : '.22' });
    group.append(image);
    if (fill && fill !== 'original')
        group.append(svg(region.tag, { ...region.attrs, fill, opacity: .5 }));
} const outline = svg(region.tag, { ...region.attrs, fill: 'none', stroke: line === 'original' ? (region.blue ? '#1675ef' : '#252654') : line, 'stroke-width': (region.blue ? 4 : 2) * lineWidth, 'stroke-linejoin': 'round' }); group.append(outline); group.addEventListener('click', () => onPick(i)); group.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) {
    event.preventDefault();
    onPick(i);
} }); root.append(group); }); return root; }

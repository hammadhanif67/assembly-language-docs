// Tiny diagram toolkit: produces theme-aware SVG using the .d-* classes from src/css/main.css.
// Boxes return their geometry so connectors can be routed between box edges.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// rough text width (Inter, 13px) used for label backgrounds and centering decisions
export const tw = (s, size = 13) => String(s).length * size * 0.56;

const KIND = { box: 'd-box', alt: 'd-box-2', tint: 'd-box-3', red: 'd-box-a', dark: 'd-box-k', group: 'd-group' };

export class Diagram {
  constructor(w, h, { minw } = {}) {
    this.w = w; this.h = h; this.minw = minw ?? Math.min(w, 560);
    this.back = []; this.mid = []; this.front = [];
  }

  // ---- primitives ----
  raw(s, layer = 'mid') { this[layer].push(s); return this; }

  text(x, y, s, { cls = 'd-text', anchor = 'middle', layer = 'front', rotate } = {}) {
    const lines = Array.isArray(s) ? s : [s];
    const lh = /d-small|d-caps/.test(cls) ? 14 : /d-title/.test(cls) ? 18 : 16;
    const y0 = y - ((lines.length - 1) * lh) / 2;
    const tr = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
    lines.forEach((ln, i) => this[layer].push(`<text class="${cls}" x="${x}" y="${(y0 + i * lh).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central"${tr}>${esc(ln)}</text>`));
    return this;
  }

  // label with a white backing so connector lines never run through text
  tag(x, y, s, { cls = 'd-small', anchor = 'middle' } = {}) {
    const size = /d-small/.test(cls) ? 11.5 : 13;
    const w = tw(s, size) + 8, h = size + 6;
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + 4 : x - 4;
    this.front.push(`<rect x="${x0.toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h}" fill="var(--d-canvas)"/>`);
    return this.text(x, y, s, { cls, anchor });
  }

  box(x, y, w, h, o = {}) {
    const kind = o.kind || 'box';
    const r = o.r ?? (kind === 'group' ? 0 : 2);
    this[kind === 'group' ? 'back' : 'mid'].push(`<rect class="${KIND[kind]}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`);
    const onDark = kind === 'red' || kind === 'dark';
    const cx = x + w / 2, cy = y + h / 2;
    if (kind === 'group' && o.label) {
      this.text(x + 10, y + 14, o.label, { cls: 'd-caps', anchor: 'start' });
    } else if (o.title || o.label || o.sub) {
      const lines = [];
      if (o.title) lines.push(...[].concat(o.title).map((t) => ['d-title', t]));
      if (o.label) lines.push(...[].concat(o.label).map((t) => [o.mono ? 'd-mono' : 'd-label', t]));
      if (o.sub) lines.push(...[].concat(o.sub).map((t) => ['d-small', t]));
      const lh = 16, y0 = cy - ((lines.length - 1) * lh) / 2;
      const ax = o.align === 'left' ? x + 10 : cx;
      lines.forEach(([cls, t], i) => this.text(ax, y0 + i * lh, t, { cls: cls + (onDark ? ' d-on-accent' : ''), anchor: o.align === 'left' ? 'start' : 'middle' }));
    }
    const g = { x, y, w, h, cx, cy, top: [cx, y], bottom: [cx, y + h], left: [x, cy], right: [x + w, cy] };
    // point on a side at fraction t (0..1) along it
    g.at = (side, t) => side === 'top' ? [x + w * t, y] : side === 'bottom' ? [x + w * t, y + h] : side === 'left' ? [x, y + h * t] : [x + w, y + h * t];
    return g;
  }

  // a column of equal cells (register files, memory, queues)
  cells(x, y, w, h, labels, o = {}) {
    const n = labels.length;
    const vertical = o.dir !== 'row';
    const cw = vertical ? w : w / n, ch = vertical ? h / n : h;
    return labels.map((lab, i) => {
      const k = (o.kinds && o.kinds[i]) || o.kind || 'box';
      return this.box(vertical ? x : x + i * cw, vertical ? y + i * ch : y, cw, ch, { label: lab, mono: o.mono ?? true, kind: k, r: 0 });
    });
  }

  path(pts, { cls = 'd-line', arrow = 'end', dash = false, label, labelAt, labelCls = 'd-small', layer = 'mid' } = {}) {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${(+p[0]).toFixed(1)} ${(+p[1]).toFixed(1)}`).join(' ');
    const acc = /acc/.test(cls) ? '-acc' : /mut/.test(cls) ? '-mut' : '';
    const mk = arrow === 'end' ? ` d-arr${acc === '-mut' ? '-mut' : acc}` : arrow === 'both' ? ` d-arr2${acc === '-acc' ? '-acc' : ''}` : '';
    this[layer].push(`<path class="${cls}${mk}${dash ? ' d-dash' : ''}" d="${d}"/>`);
    if (label) {
      let lx, ly;
      if (labelAt) [lx, ly] = labelAt;
      else {
        // middle of the longest segment
        let best = 0;
        for (let i = 1; i < pts.length; i++) {
          const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          if (L > best) { best = L; lx = (pts[i][0] + pts[i - 1][0]) / 2; ly = (pts[i][1] + pts[i - 1][1]) / 2; }
        }
      }
      this.tag(lx, ly, label, { cls: labelCls });
    }
    return this;
  }

  // orthogonal connector between two points that leave/enter from the given sides
  conn(p1, s1, p2, s2, o = {}) {
    const H = (s) => s === 'left' || s === 'right';
    let pts;
    if (H(s1) && H(s2)) {
      if (Math.abs(p1[1] - p2[1]) < 0.5) pts = [p1, p2];
      else { const mx = o.via ?? (p1[0] + p2[0]) / 2; pts = [p1, [mx, p1[1]], [mx, p2[1]], p2]; }
    } else if (!H(s1) && !H(s2)) {
      if (Math.abs(p1[0] - p2[0]) < 0.5) pts = [p1, p2];
      else { const my = o.via ?? (p1[1] + p2[1]) / 2; pts = [p1, [p1[0], my], [p2[0], my], p2]; }
    } else if (H(s1)) pts = [p1, [p2[0], p1[1]], p2];
    else pts = [p1, [p1[0], p2[1]], p2];
    return this.path(pts, o);
  }

  // horizontal dimension line with end ticks and a centered label
  dim(x1, x2, y, label) {
    this.path([[x1, y], [x2, y]], { cls: 'd-line-mut', arrow: 'both' });
    this.path([[x1, y - 6], [x1, y + 6]], { cls: 'd-line-mut', arrow: null });
    this.path([[x2, y - 6], [x2, y + 6]], { cls: 'd-line-mut', arrow: null });
    if (label) this.text((x1 + x2) / 2, y - 13, label, { cls: 'd-small' });
    return this;
  }

  svg() {
    return `<svg viewBox="0 0 ${this.w} ${this.h}" xmlns="http://www.w3.org/2000/svg" style="min-width:${this.minw}px">\n${[...this.back, ...this.mid, ...this.front].join('\n')}\n</svg>\n`;
  }
}

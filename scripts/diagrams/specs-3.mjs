// Diagrams for the researched topics added to complete the curriculum.
import { Diagram } from './lib.mjs';

export const specs = {};

// ---------- IEEE 754 single & double precision layout ----------
specs['ieee754-layout'] = () => {
  const d = new Diagram(760, 300, { minw: 620 });
  const row = (y, title, e, f, total) => {
    d.text(20, y - 16, title, { cls: 'd-caps', anchor: 'start' });
    const W = 700, unit = W / total;
    const s = d.box(20, y, unit * 1 < 34 ? 34 : unit, 46, { label: 'S', mono: true, kind: 'red', r: 0 });
    const sw = s.w;
    const ex = d.box(20 + sw, y, unit * e, 46, { label: `exponent · ${e} bits`, kind: 'tint', r: 0 });
    d.box(20 + sw + unit * e, y, W - sw - unit * e, 46, { label: `fraction (mantissa) · ${f} bits`, kind: 'alt', r: 0 });
    d.text(20 + sw / 2, y + 62, '1', { cls: 'd-small' });
    d.text(ex.cx, y + 62, `bias ${e === 8 ? 127 : 1023}`, { cls: 'd-small' });
    d.text(720, y + 62, `${total} bits`, { cls: 'd-small', anchor: 'end' });
  };
  row(40, 'Single precision (float, 32 bits)', 8, 23, 32);
  row(150, 'Double precision (double, 64 bits)', 11, 52, 64);
  d.text(380, 268, 'value = (−1)^S × 1.fraction × 2^(exponent − bias)', { cls: 'd-mono' });
  return d;
};

// ---------- Logic gate symbols ----------
const gate = (d, x, y, type) => {
  // body 60×40, inputs at y+12 and y+28, output at right
  const ins = type === 'NOT' ? [y + 20] : [y + 12, y + 28];
  ins.forEach((iy) => d.path([[x - 24, iy], [x + (type.includes('OR') ? 8 : 0), iy]], { arrow: null }));
  let body;
  if (type === 'NOT') body = `M${x} ${y + 4} L${x} ${y + 36} L${x + 40} ${y + 20} Z`;
  else if (type === 'AND' || type === 'NAND') body = `M${x} ${y} L${x + 30} ${y} A20 20 0 0 1 ${x + 30} ${y + 40} L${x} ${y + 40} Z`;
  else body = `M${x - 4} ${y} Q${x + 28} ${y} ${x + 52} ${y + 20} Q${x + 28} ${y + 40} ${x - 4} ${y + 40} Q${x + 10} ${y + 20} ${x - 4} ${y} Z`;
  d.raw(`<path class="d-box-3" d="${body}"/>`);
  if (type === 'XOR') d.raw(`<path class="d-line-acc" d="M${x - 12} ${y} Q${x + 2} ${y + 20} ${x - 12} ${y + 40}"/>`);
  const bubble = type === 'NOT' || type.startsWith('N');
  const ox = type === 'NOT' ? x + 40 : type.includes('AND') ? x + 50 : x + 52;
  if (bubble) d.raw(`<circle class="d-box" cx="${ox + 5}" cy="${y + 20}" r="5"/>`);
  d.path([[ox + (bubble ? 10 : 0), y + 20], [x + 92, y + 20]], { arrow: null });
};
specs['logic-gates'] = () => {
  const d = new Diagram(760, 330, { minw: 620 });
  const g = [['AND', 'A · B'], ['OR', 'A + B'], ['NOT', 'A̅'], ['NAND', '(A · B)̅'], ['NOR', '(A + B)̅'], ['XOR', 'A ⊕ B']];
  g.forEach(([t, f], i) => {
    const x = 60 + (i % 3) * 250, y = 40 + Math.floor(i / 3) * 150;
    gate(d, x, y, t);
    d.text(x - 30, y + (t === 'NOT' ? 20 : 12), 'A', { cls: 'd-small', anchor: 'end' });
    if (t !== 'NOT') d.text(x - 30, y + 28, 'B', { cls: 'd-small', anchor: 'end' });
    d.text(x + 100, y + 20, 'Y', { cls: 'd-small', anchor: 'start' });
    d.text(x + 30, y + 70, t, { cls: 'd-title' });
    d.text(x + 30, y + 92, `Y = ${f}`, { cls: 'd-mono' });
  });
  return d;
};
specs['half-adder'] = () => {
  const d = new Diagram(560, 220, { minw: 440 });
  d.text(30, 60, 'A', { cls: 'd-label' }); d.text(30, 150, 'B', { cls: 'd-label' });
  d.path([[44, 60], [200, 60]], { arrow: null }); d.path([[44, 150], [200, 150]], { arrow: null });
  d.raw('<circle class="d-box-k" cx="120" cy="60" r="3"/><circle class="d-box-k" cx="150" cy="150" r="3"/>');
  // XOR on top (inputs at 60 & 76), AND below (inputs at 134 & 150)
  d.path([[200, 60], [200, 50], [236, 50]], { arrow: null }); d.path([[150, 150], [150, 66], [236, 66]], { arrow: null });
  d.path([[120, 60], [120, 134], [236, 134]], { arrow: null }); d.path([[200, 150], [236, 150]], { arrow: null });
  gate(d, 260, 38, 'XOR'); gate(d, 260, 122, 'AND');
  d.text(360, 58, 'Sum = A ⊕ B', { cls: 'd-label', anchor: 'start' });
  d.text(360, 142, 'Carry = A · B', { cls: 'd-label', anchor: 'start' });
  return d;
};

// ---------- 8086 instruction encoding ----------
specs['x86-encoding'] = () => {
  const d = new Diagram(780, 330, { minw: 640 });
  const parts = [['Prefix', 'optional, 0–4 bytes', 'box', 90], ['Opcode', '1–2 bytes', 'red', 120], ['ModR/M', '0–1 byte', 'tint', 120], ['Displacement', '0, 1 or 2 bytes', 'alt', 160], ['Immediate data', '0, 1 or 2 bytes', 'alt', 160]];
  let x = 40;
  const pos = {};
  parts.forEach(([t, s, k, w]) => { pos[t] = d.box(x, 30, w, 54, { label: t, sub: s, kind: k, r: 0 }); x += w; });
  // opcode byte expanded
  d.text(40, 126, 'OPCODE BYTE', { cls: 'd-caps', anchor: 'start' });
  const op = d.cells(40, 140, 320, 40, ['1', '0', '0', '0', '1', '0', 'd', 'w'], { dir: 'row', kinds: ['alt', 'alt', 'alt', 'alt', 'alt', 'alt', 'red', 'red'] });
  d.text(40, 196, ['6-bit operation code (100010 = MOV)'], { cls: 'd-small', anchor: 'start' });
  d.text(40, 220, ['d = direction: 1 → reg is the destination'], { cls: 'd-small', anchor: 'start' });
  d.text(40, 238, ['w = width: 1 → word (16-bit), 0 → byte'], { cls: 'd-small', anchor: 'start' });
  // modrm expanded
  d.text(420, 126, 'MODR/M BYTE', { cls: 'd-caps', anchor: 'start' });
  d.box(420, 140, 80, 40, { label: 'mod', mono: true, kind: 'tint', r: 0 });
  d.box(500, 140, 120, 40, { label: 'reg', mono: true, kind: 'tint', r: 0 });
  d.box(620, 140, 120, 40, { label: 'r/m', mono: true, kind: 'tint', r: 0 });
  d.text(460, 196, '2 bits', { cls: 'd-small' }); d.text(560, 196, '3 bits', { cls: 'd-small' }); d.text(680, 196, '3 bits', { cls: 'd-small' });
  d.text(420, 220, 'mod: 11 = register, 00/01/10 = memory (+0/8/16-bit disp.)', { cls: 'd-small', anchor: 'start' });
  d.text(420, 238, 'reg: a register · r/m: register or memory operand', { cls: 'd-small', anchor: 'start' });
  d.path([pos['Opcode'].bottom, [200, 140]], { cls: 'd-line-mut', dash: true });
  d.path([pos['ModR/M'].bottom, [580, 140]], { cls: 'd-line-mut', dash: true });
  d.text(40, 290, 'Example:  MOV AX, BX  →  89 D8   (opcode 100010 0 1 = 89h · ModR/M 11 011 000 = D8h)', { cls: 'd-mono', anchor: 'start' });
  return d;
};

// ---------- Pipeline data hazard with stall ----------
specs['pipeline-hazard'] = () => {
  const d = new Diagram(760, 260, { minw: 640 });
  const X0 = 210, cw = 60;
  for (let c = 0; c < 8; c++) d.text(X0 + c * cw + cw / 2, 22, `${c + 1}`, { cls: 'd-mono' });
  d.text(X0 - 10, 22, 'cycle', { cls: 'd-small', anchor: 'end' });
  const rows = [
    ['ADD R1, R2, R3', ['IF', 'ID', 'EX', 'MEM', 'WB'], 0],
    ['SUB R4, R1, R5', ['IF', 'stall', 'stall', 'ID', 'EX', 'MEM', 'WB'], 1],
  ];
  rows.forEach(([ins, st, off], r) => {
    const y = 44 + r * 54;
    d.text(X0 - 10, y + 18, ins, { cls: 'd-mono', anchor: 'end' });
    st.forEach((s, k) => d.box(X0 + (off + k) * cw, y, cw, 36, { label: s === 'stall' ? 'bubble' : s, mono: s !== 'stall', kind: s === 'stall' ? 'tint' : s === 'WB' && r === 0 ? 'red' : 'alt', r: 0 }));
  });
  d.text(X0 + 4 * cw, 180, 'R1 is written in cycle 5 (WB of ADD) but SUB needs R1 when it decodes.', { cls: 'd-small' });
  d.text(X0 + 4 * cw, 200, 'Without forwarding the pipeline inserts two bubbles (stalls).', { cls: 'd-small' });
  d.text(X0 + 4 * cw, 228, 'With forwarding the EX result goes straight to the next instruction — no stall.', { cls: 'd-label' });
  return d;
};

// ---------- Direct-mapped cache ----------
specs['cache-direct'] = () => {
  const d = new Diagram(780, 380, { minw: 640 });
  d.text(40, 24, '16-BIT ADDRESS  =  3A7Ch', { cls: 'd-caps', anchor: 'start' });
  const t = d.box(40, 40, 160, 50, { label: 'Tag · 4 bits', sub: '0011 = 3', kind: 'red', r: 0 });
  const ix = d.box(200, 40, 320, 50, { label: 'Line (index) · 8 bits', sub: '1010 0111 = A7h = 167', kind: 'tint', r: 0 });
  const of = d.box(520, 40, 160, 50, { label: 'Offset · 4 bits', sub: '1100 = 12', kind: 'alt', r: 0 });
  // cache table
  d.text(200, 132, 'CACHE — 256 LINES × 16 BYTES = 4 KB', { cls: 'd-caps', anchor: 'start' });
  const hdr = [['V', 40], ['Tag', 70], ['Data block (16 bytes)', 270]];
  let x = 200; hdr.forEach(([h, w]) => { d.box(x, 146, w, 30, { label: h, kind: 'dark', r: 0 }); x += w; });
  const rows = [['0', '—', '—', ''], ['⋮', '', '', ''], ['166', '1', '7', '…'], ['167', '1', '3', 'byte 0 … byte 12 … byte 15'], ['168', '0', '—', '—'], ['⋮', '', '', ''], ['255', '1', '0', '…']];
  rows.forEach(([n, v, tg, data], i) => {
    const y = 176 + i * 28, hl = n === '167';
    d.text(188, y + 14, n, { cls: 'd-mono', anchor: 'end' });
    d.box(200, y, 40, 28, { label: v, mono: true, r: 0, kind: hl ? 'tint' : 'box' });
    d.box(240, y, 70, 28, { label: tg, mono: true, r: 0, kind: hl ? 'red' : 'box' });
    d.box(310, y, 270, 28, { label: data, mono: true, r: 0, kind: hl ? 'tint' : 'box' });
  });
  d.path([ix.bottom, [360, 120], [150, 120], [150, 274], [200, 274]], { cls: 'd-line-acc', label: 'selects line 167', labelAt: [150, 200] });
  d.path([t.bottom, [120, 104], [100, 104], [100, 360], [275, 360], [275, 288]], { cls: 'd-line-mut', label: 'compare tags', labelAt: [190, 360] });
  d.path([of.bottom, [600, 120], [640, 120], [640, 274], [580, 274]], { cls: 'd-line-mut', label: 'picks byte 12', labelAt: [690, 200] });
  d.text(620, 330, ['V = 1 and tags equal', '→ cache hit'], { cls: 'd-label', anchor: 'start' });
  return d;
};

// ---------- DMA ----------
specs['dma'] = () => {
  const d = new Diagram(760, 330, { minw: 620 });
  const cpu = d.box(40, 40, 160, 70, { title: 'CPU', sub: '8086', kind: 'red' });
  const dma = d.box(300, 40, 160, 70, { title: 'DMA controller', sub: 'e.g. 8237', kind: 'tint' });
  const dev = d.box(560, 40, 160, 70, { title: 'I/O device', sub: 'disk, sound…', kind: 'alt' });
  d.path([[200, 64], [300, 64]], { cls: 'd-line-acc', arrow: 'end' }); d.text(250, 54, 'HLDA', { cls: 'd-mono' });
  d.path([[300, 86], [200, 86]], { cls: 'd-line-acc', arrow: 'end' }); d.text(250, 100, 'HOLD', { cls: 'd-mono' });
  d.path([[560, 64], [460, 64]], { arrow: 'end' }); d.text(510, 54, 'DREQ', { cls: 'd-mono' });
  d.path([[460, 86], [560, 86]], { arrow: 'end' }); d.text(510, 100, 'DACK', { cls: 'd-mono' });
  d.path([[20, 200], [740, 200]], { cls: 'd-bus', arrow: null });
  d.text(30, 186, 'SYSTEM BUS (ADDRESS · DATA · CONTROL)', { cls: 'd-caps', anchor: 'start' });
  const mem = d.box(300, 240, 160, 60, { title: 'Memory', kind: 'alt' });
  [cpu, dma, dev].forEach((b) => d.path([b.bottom, [b.cx, 196]], { arrow: 'both' }));
  d.path([[mem.cx, 204], mem.top], { arrow: 'both' });
  d.text(560, 270, ['1  device raises DREQ', '2  DMA asks CPU with HOLD', '3  CPU frees the bus, answers HLDA', '4  DMA moves the block, then drops HOLD'], { cls: 'd-small', anchor: 'start' });
  return d;
};

// ---------- 8086 pin-out ----------
specs['i8086-pins'] = () => {
  const d = new Diagram(720, 620, { minw: 560 });
  const left = ['GND', 'AD14', 'AD13', 'AD12', 'AD11', 'AD10', 'AD9', 'AD8', 'AD7', 'AD6', 'AD5', 'AD4', 'AD3', 'AD2', 'AD1', 'AD0', 'NMI', 'INTR', 'CLK', 'GND'];
  const right = ['VCC', 'AD15', 'A16/S3', 'A17/S4', 'A18/S5', 'A19/S6', 'BHE̅/S7', 'MN/MX̅', 'RD̅', 'HOLD (RQ̅/GT̅0)', 'HLDA (RQ̅/GT̅1)', 'WR̅ (LOCK̅)', 'M/IO̅ (S̅2)', 'DT/R̅ (S̅1)', 'DEN̅ (S̅0)', 'ALE (QS0)', 'INTA̅ (QS1)', 'TEST̅', 'READY', 'RESET'];
  const X = 260, W = 200, top = 30, P = 28;
  d.box(X, top, W, P * 20 + 10, { kind: 'alt', r: 6 });
  d.raw(`<path class="d-line" d="M${X + W / 2 - 16} ${top} A16 16 0 0 0 ${X + W / 2 + 16} ${top}"/>`);
  d.text(X + W / 2, top + P * 10 + 5, ['8086', 'CPU'], { cls: 'd-title' });
  const grp = (n) => (/^AD|^A1|AD15/.test(n) ? 'd-label d-red' : /GND|VCC/.test(n) ? 'd-label' : 'd-label');
  left.forEach((n, i) => { const y = top + 19 + i * P; d.path([[X - 28, y], [X, y]], { arrow: null }); d.text(X - 34, y, n, { cls: grp(n), anchor: 'end' }); d.text(X + 8, y, `${i + 1}`, { cls: 'd-small', anchor: 'start' }); });
  right.forEach((n, i) => { const y = top + 19 + i * P; d.path([[X + W, y], [X + W + 28, y]], { arrow: null }); d.text(X + W + 34, y, n, { cls: grp(n), anchor: 'start' }); d.text(X + W - 8, y, `${40 - i}`, { cls: 'd-small', anchor: 'end' }); });
  d.text(20, 606, 'Red = multiplexed address/data and address/status lines. In brackets: the maximum-mode meaning of pins 24–31.', { cls: 'd-small', anchor: 'start' });
  return d;
};

// ---------- Arrays in memory ----------
specs['array-layout'] = () => {
  const d = new Diagram(760, 300, { minw: 620 });
  d.text(40, 24, 'WORD ARRAY   nums dw 10, 20, 30, 40', { cls: 'd-caps', anchor: 'start' });
  const bytes = ['0A', '00', '14', '00', '1E', '00', '28', '00'];
  bytes.forEach((b, i) => { d.box(40 + i * 60, 40, 60, 40, { label: b, mono: true, r: 0, kind: i % 2 ? 'alt' : 'tint' }); d.text(70 + i * 60, 96, `+${i}`, { cls: 'd-small' }); });
  [0, 1, 2, 3].forEach((k) => d.dim(40 + k * 120, 160 + k * 120, 118, `nums[${k}]`));
  d.text(560, 60, ['element k is at', 'offset nums + k × 2'], { cls: 'd-label', anchor: 'start' });
  d.text(40, 170, '2-D ARRAY  3 × 4 BYTES, ROW-MAJOR', { cls: 'd-caps', anchor: 'start' });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const i = r * 4 + c;
    d.box(40 + i * 50, 188, 50, 40, { label: `${r},${c}`, mono: true, r: 0, kind: r === 1 ? 'tint' : 'alt' });
  }
  d.text(40, 250, 'address of [row][col] = base + (row × columns + col) × element size', { cls: 'd-mono', anchor: 'start' });
  d.text(40, 272, 'example: [1][2] = base + (1 × 4 + 2) × 1 = base + 6', { cls: 'd-small', anchor: 'start' });
  return d;
};

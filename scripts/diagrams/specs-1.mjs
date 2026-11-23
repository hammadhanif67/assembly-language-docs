// Diagrams for chapters 1 (Fundamentals) and 3 (Processor).
import { Diagram } from './lib.mjs';

export const specs = {};

// ---------- Generations timeline ----------
specs['generations-timeline'] = () => {
  const d = new Diagram(760, 230, { minw: 620 });
  const gens = [
    ['1st', '1946–1955', 'Vacuum tubes'],
    ['2nd', '1956–1965', 'Transistors'],
    ['3rd', '1966–1975', 'Integrated circuits'],
    ['4th', '1976–1985', 'Microprocessors'],
    ['5th', '1986 →', 'ULSI · AI'],
  ];
  d.path([[20, 120], [740, 120]], { cls: 'd-line', arrow: 'end' });
  gens.forEach(([n, years, tech], i) => {
    const x = 30 + i * 145;
    d.box(x, 104, 32, 32, { kind: i === 4 ? 'red' : 'dark', label: n.replace(/\D/g, ''), r: 0 });
    d.text(x, 72, `${n} generation`, { cls: 'd-title', anchor: 'start' });
    d.text(x, 92, years, { cls: 'd-mono', anchor: 'start' });
    d.text(x, 160, tech, { cls: 'd-label', anchor: 'start' });
  });
  d.text(30, 205, ['Each generation replaced the switching technology of the last: smaller, faster, cheaper, more reliable.'], { cls: 'd-small', anchor: 'start' });
  return d;
};

// ---------- Architecture vs organization ----------
specs['arch-vs-org'] = () => {
  const d = new Diagram(700, 300, { minw: 560 });
  d.box(20, 20, 660, 110, { kind: 'group', label: 'Architecture — what the programmer sees' });
  ['Instruction set', 'Data representation', 'I/O mechanisms', 'Memory addressing'].forEach((t, i) => d.box(40 + i * 160, 56, 140, 52, { label: t, kind: 'tint' }));
  d.path([[350, 132], [350, 166]], { cls: 'd-line-acc', arrow: 'end', label: 'is implemented by', labelAt: [430, 149] });
  d.box(20, 170, 660, 110, { kind: 'group', label: 'Organization — how it is built (hidden from the programmer)' });
  ['Control signals', 'Peripheral interfaces', 'Memory technology', 'Operational units'].forEach((t, i) => d.box(40 + i * 160, 206, 140, 52, { label: t, kind: 'alt' }));
  return d;
};

// ---------- Top-level structure (hierarchy) ----------
specs['top-level-structure'] = () => {
  const d = new Diagram(760, 330, { minw: 620 });
  const col = (x, title, items, hi) => {
    d.box(x, 20, 220, 290, { kind: 'group', label: title });
    return items.map((t, i) => d.box(x + 20, 52 + i * 62, 180, 46, { label: t, kind: i === hi ? 'tint' : 'box' }));
  };
  const a = col(20, 'Computer', ['Central processing unit', 'Main memory', 'I/O', 'System bus'], 0);
  const b = col(270, 'CPU', ['Control unit', 'Arithmetic & logic unit', 'Registers', 'Internal bus'], 0);
  const c = col(520, 'Control unit', ['Sequencing logic', ['Control unit registers', '& decoders'], 'Control memory'], -1);
  d.path([a[0].right, [270, a[0].cy]], { cls: 'd-line-acc', arrow: 'end' });
  d.path([b[0].right, [520, b[0].cy]], { cls: 'd-line-acc', arrow: 'end' });
  return d;
};

// ---------- Four possible computer operations ----------
specs['computer-operations'] = () => {
  const d = new Diagram(760, 310, { minw: 640 });
  const titles = ['(a) Data movement', '(b) Storage', '(c) Processing from / to storage', '(d) Processing from storage to I/O'];
  titles.forEach((title, i) => {
    const x = 10 + i * 188;
    const mv = d.box(x + 54, 50, 80, 34, { label: 'Movement', kind: 'alt' });
    const ctl = d.box(x + 54, 130, 80, 34, { label: 'Control', kind: 'alt' });
    const st = d.box(x + 4, 210, 80, 34, { label: 'Storage', kind: 'alt' });
    const pr = d.box(x + 100, 210, 80, 34, { label: 'Processing', kind: 'alt' });
    d.path([mv.bottom, ctl.top], { cls: 'd-line-mut', arrow: null });
    d.path([ctl.at('left', 0.5), [st.cx, ctl.cy], st.top], { cls: 'd-line-mut', arrow: null });
    d.path([ctl.at('right', 0.5), [pr.cx, ctl.cy], pr.top], { cls: 'd-line-mut', arrow: null });
    const R = (pts) => d.path(pts, { cls: 'd-line-acc', arrow: 'end' });
    const IN = [[x + 80, 12], [x + 80, 50]], OUT = [[x + 108, 50], [x + 108, 12]];
    if (i === 0) { R(IN); R(OUT); }
    if (i === 1) { R(IN); R([[x + 104, 84], [x + 104, 130]]); R([[x + 60, 164], [x + 60, 186], [x + 30, 186], [x + 30, 210]]); }
    if (i === 2) { R([[x + 20, 210], [x + 20, 176], [x + 64, 176], [x + 64, 164]]); R([[x + 124, 164], [x + 124, 186], [x + 156, 186], [x + 156, 210]]); R([[pr.cx, 244], [pr.cx, 262], [st.cx, 262], [st.cx, 244]]); }
    if (i === 3) { R([[x + 20, 210], [x + 20, 176], [x + 64, 176], [x + 64, 164]]); R([[x + 124, 164], [x + 124, 186], [x + 156, 186], [x + 156, 210]]); R([[x + 176, 210], [x + 176, 67], mv.right]); R(OUT); }
    d.text(x + 94, 292, title, { cls: 'd-small' });
  });
  return d;
};

// ---------- Von Neumann / Harvard ----------
const cpuBlock = (d, x, y) => {
  d.box(x, y, 300, 190, { kind: 'group', label: 'Central processing unit' });
  d.box(x + 20, y + 34, 120, 44, { label: 'Registers' });
  d.box(x + 20, y + 84, 120, 44, { label: 'Program counter', kind: 'tint' });
  d.box(x + 160, y + 34, 120, 94, { label: ['Arithmetic &', 'logic unit'] });
  d.box(x + 20, y + 138, 260, 38, { label: 'Control unit', kind: 'alt' });
  return { top: y, bottom: y + 190, cx: x + 150 };
};
specs['von-neumann'] = () => {
  const d = new Diagram(560, 470, { minw: 420 });
  const mem = d.box(130, 20, 300, 56, { title: 'Main memory', sub: 'instructions + data together' , kind: 'tint'});
  const cpu = cpuBlock(d, 130, 140);
  d.path([[220, 140], [220, 78]], { cls: 'd-line', arrow: 'end', label: 'address' });
  d.path([[340, 78], [340, 140]], { cls: 'd-line-acc', arrow: 'both', label: 'data / instruction (one bus)' });
  const io = d.box(130, 390, 300, 50, { title: 'Input / Output' });
  d.path([[280, 330], [280, 390]], { arrow: 'both' });
  return d;
};
specs['harvard'] = () => {
  const d = new Diagram(640, 470, { minw: 480 });
  d.box(20, 20, 270, 56, { title: 'Instruction memory', sub: 'ROM / Flash', kind: 'tint' });
  d.box(350, 20, 270, 56, { title: 'Data memory', sub: 'RAM', kind: 'alt' });
  cpuBlock(d, 170, 140);
  d.path([[200, 140], [200, 78]], { cls: 'd-line', arrow: 'end', label: 'instr. address', labelAt: [200, 98] });
  d.path([[250, 78], [250, 140]], { cls: 'd-line-acc', arrow: 'end', label: 'instruction', labelAt: [256, 122] });
  d.path([[390, 140], [390, 78]], { cls: 'd-line', arrow: 'end', label: 'data address', labelAt: [390, 98] });
  d.path([[440, 78], [440, 140]], { cls: 'd-line-acc', arrow: 'both', label: 'data', labelAt: [444, 122] });
  d.box(170, 390, 300, 50, { title: 'Input / Output' });
  d.path([[320, 330], [320, 390]], { arrow: 'both' });
  return d;
};

// ---------- Instruction format ----------
specs['instruction-format'] = () => {
  const d = new Diagram(640, 250, { minw: 520 });
  d.text(40, 24, 'Format A — two operands', { cls: 'd-caps', anchor: 'start' });
  const parts = [['Opcode', 4, 'tint'], ['Operand reference', 6, 'alt'], ['Operand reference', 6, 'alt']];
  let x = 40;
  parts.forEach(([t, bits, k]) => { const w = bits * 32; d.box(x, 54, w, 46, { label: t, kind: k, r: 0 }); d.text(x + w / 2, 42, `${bits} bits`, { cls: 'd-small' }); x += w; });
  d.dim(40, x, 116, '16 bits');
  d.text(40, 160, 'Format B — one operand', { cls: 'd-caps', anchor: 'start' });
  d.box(40, 190, 128, 46, { label: 'Opcode', kind: 'tint', r: 0 });
  d.box(168, 190, 384, 46, { label: 'Operand', kind: 'alt', r: 0 });
  d.text(104, 178, '4 bits', { cls: 'd-small' });
  d.text(360, 178, '12 bits', { cls: 'd-small' });
  return d;
};

// ---------- Clock ----------
specs['clock-signal'] = () => {
  const d = new Diagram(640, 230, { minw: 500 });
  const lo = 150, hi = 90, x0 = 80, half = 48;
  const pts = [[x0, lo]];
  for (let x = x0 + half; x < 590; x += half * 2) { pts.push([x, lo], [x, hi], [x + half, hi], [x + half, lo]); }
  d.path(pts, { cls: 'd-line-acc', arrow: null });
  d.text(64, hi, '1', { cls: 'd-mono' });
  d.text(64, lo, '0', { cls: 'd-mono' });
  // annotations
  const r = x0 + half, f = x0 + half * 2;
  d.path([[r, 186], [r, 158]], { cls: 'd-line-mut', arrow: 'end' }); d.text(r, 198, 'rising edge', { cls: 'd-small' });
  d.path([[f + 40, 186], [f + 2, 158]], { cls: 'd-line-mut', arrow: 'end' }); d.text(f + 56, 198, 'falling edge', { cls: 'd-small' });
  d.dim(r + half * 4, r + half * 6, 62, 'one clock period');
  d.path([[460, 214], [580, 214]], { cls: 'd-line-mut', arrow: 'end' }); d.text(440, 214, 'time', { cls: 'd-small', anchor: 'end' });
  return d;
};

// ---------- Reading from memory ----------
specs['reading-from-memory'] = () => {
  const d = new Diagram(680, 260, { minw: 560 });
  d.box(20, 20, 290, 220, { kind: 'group', label: 'Microprocessor' });
  const cu = d.box(40, 52, 150, 44, { label: 'Control unit (CU)', kind: 'alt' });
  const pc = d.box(140, 118, 150, 42, { label: 'PC', kind: 'tint', mono: true });
  const db = d.box(140, 180, 150, 42, { label: 'Data buffer' });
  d.box(480, 20, 180, 220, { kind: 'group', label: 'Memory' });
  d.cells(520, 52, 100, 170, ['…', '0941', '0940', '…', '0301', '0300'], { mono: true });
  d.path([cu.right, [520, cu.cy]], { label: 'memory read' });
  d.path([pc.right, [520, pc.cy]], { cls: 'd-line-acc', label: 'address' });
  d.path([[520, db.cy], db.right], { label: 'data from memory' });
  return d;
};

// ---------- Fetch / execute ----------
specs['fetch-execute'] = () => {
  const d = new Diagram(680, 170, { minw: 560 });
  const s = d.box(20, 64, 100, 40, { label: 'START', kind: 'dark', r: 20 });
  const f = d.box(190, 56, 140, 56, { label: ['Fetch next', 'instruction'], kind: 'tint' });
  const e = d.box(400, 56, 140, 56, { label: ['Execute', 'instruction'], kind: 'alt' });
  const h = d.box(590, 64, 70, 40, { label: 'HALT', kind: 'dark', r: 20 });
  d.path([s.right, f.left]); d.path([f.right, e.left]); d.path([e.right, h.left]);
  d.path([e.top, [e.cx, 24], [160, 24], [160, f.cy], f.left], { cls: 'd-line-acc', label: 'next instruction', labelAt: [360, 24] });
  d.text(f.cx, 138, 'FETCH CYCLE', { cls: 'd-caps' });
  d.text(e.cx, 138, 'EXECUTE CYCLE', { cls: 'd-caps' });
  return d;
};

// ---------- Top-level view ----------
specs['top-level-view'] = () => {
  const d = new Diagram(700, 420, { minw: 580 });
  d.box(20, 20, 270, 210, { kind: 'group', label: 'CPU' });
  const L = ['PC', 'IR'], R = ['MAR', 'MBR', 'I/O AR', 'I/O BR'];
  L.forEach((t, i) => d.box(40, 50 + i * 44, 90, 34, { label: t, mono: true, kind: 'tint' }));
  R.forEach((t, i) => d.box(180, 50 + i * 44, 90, 34, { label: t, mono: true }));
  d.box(40, 150, 90, 60, { label: ['Execution', 'unit'], kind: 'alt' });
  d.box(20, 270, 270, 130, { kind: 'group', label: 'I/O module' });
  d.cells(60, 300, 190, 84, ['', '', '', 'buffers'], { mono: false });
  // memory
  d.box(470, 20, 210, 380, { kind: 'group', label: 'Main memory' });
  const rows = ['0', '1', '2', 'Instruction', 'Instruction', 'Instruction', '⋮', 'Data', 'Data', 'Data', 'Data', '⋮', 'n−2', 'n−1'];
  const kinds = rows.map((r) => (r === 'Instruction' ? 'tint' : r === 'Data' ? 'alt' : 'box'));
  d.cells(500, 46, 150, 340, rows, { kinds, mono: true });
  // system bus
  d.path([[370, 60], [370, 360]], { cls: 'd-bus', arrow: null });
  d.text(370, 42, 'System bus', { cls: 'd-caps' });
  d.path([[290, 125], [370, 125]], { arrow: 'both' });
  d.path([[370, 215], [500, 215]], { arrow: 'both' });
  d.path([[290, 335], [370, 335]], { arrow: 'both' });
  return d;
};

// ---------- Instruction execution cycle ----------
specs['instruction-execution-cycle'] = () => {
  const d = new Diagram(700, 370, { minw: 580 });
  const pc = d.box(40, 30, 60, 32, { label: 'PC', mono: true, kind: 'dark' });
  d.text(140, 18, 'Program (RAM)', { cls: 'd-caps', anchor: 'start' });
  const prog = d.cells(140, 30, 240, 32, ['I-1', 'I-2', 'I-3', 'I-4'], { dir: 'row', kinds: ['tint'] });
  d.path([pc.right, prog[0].left]);
  const q = d.box(560, 110, 110, 90, { kind: 'box', label: '' });
  d.cells(560, 110, 110, 90, ['I-1', '', ''], { kinds: ['tint'] });
  d.text(552, 150, ['Instruction', 'queue'], { cls: 'd-small', anchor: 'end' });
  d.path([prog[0].bottom, [prog[0].cx, 86], [615, 86], [615, 110]], { cls: 'd-line-acc', label: 'fetch', labelAt: [400, 86] });
  d.text(95, 100, 'Data (RAM)', { cls: 'd-caps' });
  const data = d.cells(40, 110, 110, 150, ['op1', 'op2', '', ''], { kinds: ['alt', 'alt'] });
  d.text(275, 158, 'Registers', { cls: 'd-caps' });
  d.cells(220, 170, 110, 100, ['', '', '', ''], {});
  const alu = d.box(430, 250, 120, 56, { label: 'ALU', kind: 'red' });
  d.path([[150, 140], [455, 140], [455, 250]], { label: 'operands' });
  d.path([[330, 210], [520, 210], [520, 250]]);
  d.path([[615, 200], [615, 278], alu.right], { label: 'decode', labelAt: [640, 240] });
  d.path([alu.bottom, [490, 336], [95, 336], [95, 262]], { cls: 'd-line-acc', label: 'execute → store the output', labelAt: [300, 336] });
  d.path([[275, 336], [275, 272]], { cls: 'd-line-acc' });
  return d;
};

// ---------- Instruction cycle state diagram ----------
specs['instruction-cycle-state'] = () => {
  const d = new Diagram(740, 370, { minw: 640 });
  const W = 122, H = 54, xs = [20, 162, 304, 446, 588];
  d.text(20, 24, 'CPU ACCESS TO MEMORY OR I/O', { cls: 'd-caps', anchor: 'start' });
  d.text(150, 292, 'INTERNAL CPU OPERATIONS', { cls: 'd-caps', anchor: 'start' });
  const IF = d.box(xs[0], 44, W, H, { label: ['Instruction', 'fetch'], kind: 'tint' });
  const OF = d.box(xs[2], 44, W, H, { label: ['Operand', 'fetch'], kind: 'tint' });
  const OS = d.box(xs[4], 44, W, H, { label: ['Operand', 'store'], kind: 'tint' });
  const IAC = d.box(xs[0], 214, W, H, { label: ['Instruction', 'address calc.'], kind: 'alt' });
  const IOD = d.box(xs[1], 214, W, H, { label: ['Instruction', 'decoding'], kind: 'alt' });
  const OAC = d.box(xs[2], 214, W, H, { label: ['Operand', 'address calc.'], kind: 'alt' });
  const DO = d.box(xs[3], 214, W, H, { label: ['Data', 'operation'], kind: 'red' });
  const OAC2 = d.box(xs[4], 214, W, H, { label: ['Operand', 'address calc.'], kind: 'alt' });
  d.path([IAC.top, IF.bottom]);
  d.path([IF.right, [IOD.cx, IF.cy], IOD.top]);
  d.path([IOD.right, OAC.left]);
  d.path([OAC.at('top', 0.35), OF.at('bottom', 0.35)]);
  d.path([OF.at('bottom', 0.65), OAC.at('top', 0.65)], { cls: 'd-line-mut', label: 'multiple operands', labelAt: [OF.x + W * 0.65 + 52, 156] });
  d.path([OF.right, [DO.cx, OF.cy], DO.top]);
  d.path([DO.right, OAC2.left]);
  d.path([OAC2.at('top', 0.35), OS.at('bottom', 0.35)]);
  d.path([OS.at('bottom', 0.65), OAC2.at('top', 0.65)], { cls: 'd-line-mut', label: 'multiple results', labelAt: [OS.x + W * 0.65 - 50, 156] });
  d.path([OS.right, [726, OS.cy], [726, 320], [IAC.cx, 320], IAC.bottom], { cls: 'd-line-acc', label: 'instruction complete — fetch next instruction', labelAt: [220, 320] });
  d.path([[OAC.cx, 320], OAC.bottom], { cls: 'd-line-acc' });
  d.tag(OAC.cx + 96, 344, 'return for string or vector data');
  return d;
};

// ---------- Pipelining: laundry analogy ----------
const laundry = (rows, top, endMin) => {
  const d = new Diagram(720, 330, { minw: 600 });
  const X0 = 110, W = 580, px = W / 360;
  ['6 PM', '7', '8', '9', '10', '11', '12'].forEach((t, i) => d.text(X0 + i * 60 * px, 22, t, { cls: 'd-mono' }));
  d.path([[X0, 40], [X0 + W, 40]], { cls: 'd-line-mut', arrow: 'end' });
  for (let i = 0; i <= 6; i++) d.path([[X0 + i * 60 * px, 36], [X0 + i * 60 * px, 300]], { cls: 'd-line-mut', arrow: null, dash: true, layer: 'back' });
  const names = { w: '30', r: '40', f: '20' }, K = { w: 'dark', r: 'red', f: 'alt' };
  [['dark', 'Wash'], ['red', 'Dry'], ['alt', 'Fold']].forEach(([k, t], i) => { d.box(460 + i * 80, 302, 14, 14, { kind: k, r: 0 }); d.text(480 + i * 80, 309, t, { cls: 'd-small', anchor: 'start' }); });
  rows.forEach(([name, segs], r) => {
    const y = 66 + r * 56;
    d.text(70, y + 18, `Load ${name}`, { cls: 'd-label', anchor: 'end' });
    segs.forEach(([s, e, k]) => d.box(X0 + s * px, y, (e - s) * px, 36, { label: names[k], kind: K[k], r: 0 }));
  });
  d.path([[X0 + endMin * px, 280], [X0 + endMin * px, 300]], { cls: 'd-line-acc', arrow: null });
  const ex = X0 + endMin * px, nearEnd = ex > 560;
  d.text(nearEnd ? ex - 6 : ex + 6, 292, `done at ${top}`, { cls: 'd-small', anchor: nearEnd ? 'end' : 'start' });
  return d;
};
specs['laundry-sequential'] = () => laundry(['A', 'B', 'C', 'D'].map((n, i) => { const o = i * 90; return [n, [[o, o + 30, 'w'], [o + 30, o + 70, 'r'], [o + 70, o + 90, 'f']]]; }), 'midnight — 6 hours', 360);
specs['laundry-pipelined'] = () => laundry(['A', 'B', 'C', 'D'].map((n, i) => { const ws = i === 0 ? 0 : 30 + (i - 1) * 40, ds = 30 + i * 40; return [n, [[ws, ws + 30, 'w'], [ds, ds + 40, 'r'], [ds + 40, ds + 60, 'f']]]; }), '9:30 PM — 3.5 hours', 210);

// ---------- RISC 5-stage pipeline ----------
specs['risc-pipeline'] = () => {
  const d = new Diagram(720, 330, { minw: 600 });
  const st = ['IF', 'ID', 'EX', 'MEM', 'WB'], X0 = 120, cw = 64;
  for (let c = 0; c < 9; c++) d.text(X0 + c * cw + cw / 2, 24, `${c + 1}`, { cls: 'd-mono' });
  d.text(X0 - 12, 24, 'clock cycle', { cls: 'd-small', anchor: 'end' });
  for (let i = 0; i < 5; i++) {
    const y = 44 + i * 46;
    d.text(X0 - 12, y + 18, `Instruction ${i + 1}`, { cls: 'd-label', anchor: 'end' });
    st.forEach((s, k) => d.box(X0 + (i + k) * cw, y, cw, 36, { label: s, mono: true, kind: k === 2 ? 'red' : k % 2 ? 'alt' : 'box', r: 0 }));
  }
  const legend = ['IF fetch instruction', 'ID read registers & decode', 'EX execute / calculate address', 'MEM access operand in memory', 'WB write result to register'];
  legend.forEach((t, i) => d.text(20 + (i % 3) * 240, 286 + Math.floor(i / 3) * 22, t, { cls: 'd-small', anchor: 'start' }));
  return d;
};

// ---------- CISC vs RISC code size ----------
specs['code-size'] = () => {
  const d = new Diagram(640, 300, { minw: 480 });
  d.text(170, 24, 'CISC', { cls: 'd-title' });
  d.text(470, 24, 'RISC', { cls: 'd-title' });
  d.box(110, 60, 120, 120, { kind: 'tint', r: 0, label: ['fewer, more', 'complex', 'instructions'] });
  d.dim(110, 230, 46);
  d.box(430, 60, 80, 190, { kind: 'alt', r: 0, label: ['more,', 'simpler', 'instr.'] });
  d.dim(430, 510, 46);
  d.text(170, 210, 'Code size is smaller but complicated.', { cls: 'd-text' });
  d.text(470, 276, 'Code size is larger but simpler.', { cls: 'd-text' });
  return d;
};

// ---------- Performance equation ----------
specs['performance-equation'] = () => {
  const d = new Diagram(720, 280, { minw: 600 });
  const frac = (x, top, bot, w, cls = 'd-line') => { d.text(x, 40, top, { cls: 'd-label' }); d.path([[x - w / 2, 56], [x + w / 2, 56]], { cls, arrow: null }); d.text(x, 72, bot, { cls: 'd-label' }); };
  frac(90, 'time', 'program', 90);
  d.text(170, 56, '=', { cls: 'd-title' });
  frac(250, 'time', 'cycle', 80);
  d.text(320, 56, '×', { cls: 'd-title' });
  frac(420, 'cycles', 'instruction', 120, 'd-line-acc');
  d.text(510, 56, '×', { cls: 'd-title' });
  frac(610, 'instructions', 'program', 130, 'd-line-acc');
  const c = d.box(380, 150, 320, 110, { kind: 'alt' });
  d.text(c.cx, 172, 'CISC', { cls: 'd-title' });
  d.text(c.cx, 210, ['minimizes instructions per program,', 'sacrificing cycles per instruction'], { cls: 'd-text' });
  const r = d.box(20, 150, 320, 110, { kind: 'tint' });
  d.text(r.cx, 172, 'RISC', { cls: 'd-title' });
  d.text(r.cx, 210, ['reduces cycles per instruction,', 'at the cost of instructions per program'], { cls: 'd-text' });
  d.path([[610, 88], [610, 120], [540, 120], [540, 150]], { cls: 'd-line-mut' });
  d.path([[420, 88], [420, 120], [180, 120], [180, 150]], { cls: 'd-line-mut' });
  return d;
};

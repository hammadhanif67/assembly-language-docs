// Diagrams for chapters 4 (Registers, Memory & I/O) and 5 (Microprocessors).
import { Diagram } from './lib.mjs';

export const specs = {};

// ---------- 8086 organization: EU + BIU ----------
const eu8086 = (d, x, y, withLabels = true) => {
  d.box(x, y, 330, 380, { kind: 'group', label: 'Execution unit (EU)' });
  d.text(x + 20, y + 40, 'GENERAL REGISTERS', { cls: 'd-caps', anchor: 'start' });
  const gp = [['AH', 'AL'], ['BH', 'BL'], ['CH', 'CL'], ['DH', 'DL']];
  gp.forEach(([h, l], i) => { d.box(x + 60, y + 52 + i * 28, 70, 28, { label: h, mono: true, r: 0, kind: 'tint' }); d.box(x + 130, y + 52 + i * 28, 70, 28, { label: l, mono: true, r: 0, kind: 'tint' }); d.text(x + 44, y + 66 + i * 28, ['AX', 'BX', 'CX', 'DX'][i], { cls: 'd-mono', anchor: 'end' }); });
  ['SP', 'BP', 'SI', 'DI'].forEach((r, i) => d.box(x + 60, y + 172 + i * 28, 140, 28, { label: r, mono: true, r: 0 }));
  if (withLabels) { d.text(x + 212, y + 108, 'data', { cls: 'd-small', anchor: 'start' }); d.text(x + 212, y + 228, ['pointer &', 'index'], { cls: 'd-small', anchor: 'start' }); }
  const alu = d.box(x + 60, y + 300, 140, 50, { label: 'ALU', kind: 'red' });
  const fl = d.box(x + 220, y + 300, 90, 50, { label: 'Flags', kind: 'alt' });
  d.path([alu.right, fl.left], { arrow: 'end' });
  return { alu, right: x + 330 };
};
const biu8086 = (d, x, y) => {
  d.box(x, y, 300, 380, { kind: 'group', label: 'Bus interface unit (BIU)' });
  d.text(x + 20, y + 40, 'SEGMENT REGISTERS', { cls: 'd-caps', anchor: 'start' });
  d.cells(x + 20, y + 52, 110, 140, ['CS', 'DS', 'SS', 'ES', 'IP'], { kinds: ['box', 'box', 'box', 'box', 'tint'] });
  const sum = d.box(x + 160, y + 80, 120, 70, { label: ['Σ address', 'adder'], sub: 'seg × 10h + offset', kind: 'alt' });
  const bus = d.box(x + 160, y + 190, 120, 54, { label: ['Bus control', 'logic'] });
  d.text(x + 20, y + 280, 'INSTRUCTION QUEUE (6 BYTES)', { cls: 'd-caps', anchor: 'start' });
  const q = d.cells(x + 20, y + 296, 260, 40, ['1', '2', '3', '4', '5', '6'], { dir: 'row', kinds: ['tint'] });
  d.path([[x + 130, y + 115], sum.left]);
  d.path([sum.bottom, bus.top]);
  return { bus, q };
};
specs['i8086-organization'] = () => {
  const d = new Diagram(760, 500, { minw: 640 });
  const eu = eu8086(d, 20, 20);
  const biu = biu8086(d, 440, 20);
  // internal bus
  d.path([[200, 440], [700, 440]], { cls: 'd-bus', arrow: null });
  d.text(450, 462, 'Internal bus (16-bit)', { cls: 'd-small' });
  d.path([[130, 370], [130, 440]], { arrow: 'both' });
  d.path([[590, 356], [590, 440]], { arrow: 'both' });
  d.path([biu.bus.right, [756, biu.bus.cy]], { arrow: 'both' });
  d.text(700, biu.bus.y + biu.bus.h + 14, 'external bus', { cls: 'd-small' });
  return d;
};
specs['i8086-block'] = () => {
  const d = new Diagram(760, 470, { minw: 640 });
  d.box(20, 20, 720, 170, { kind: 'group', label: 'BIU: fetches instructions and computes addresses' });
  d.cells(40, 50, 110, 125, ['CS', 'SS', 'DS', 'ES', 'IP'], { kinds: ['box', 'box', 'box', 'box', 'tint'] });
  const sum = d.box(190, 70, 160, 80, { label: 'Σ', sub: ['physical address =', 'segment × 10h + offset'], kind: 'alt' });
  d.text(450, 52, '6-BYTE PRE-FETCH QUEUE', { cls: 'd-caps', anchor: 'start' });
  d.cells(450, 66, 270, 44, ['1', '2', '3', '4', '5', '6'], { dir: 'row', kinds: ['tint'] });
  d.path([[150, 110], sum.left]);
  d.path([sum.right, [420, 110], [420, 88], [450, 88]], { label: 'to memory / I/O', labelAt: [420, 140] });
  d.box(20, 220, 720, 230, { kind: 'group', label: 'EU: decodes and executes' });
  const gp = [['AH', 'AL', 'AX'], ['BH', 'BL', 'BX'], ['CH', 'CL', 'CX'], ['DH', 'DL', 'DX']];
  gp.forEach(([h, l, n], i) => { d.box(70, 250 + i * 26, 60, 26, { label: h, mono: true, r: 0, kind: 'tint' }); d.box(130, 250 + i * 26, 60, 26, { label: l, mono: true, r: 0, kind: 'tint' }); d.text(56, 263 + i * 26, n, { cls: 'd-mono', anchor: 'end' }); });
  d.cells(70, 356, 120, 80, ['SP', 'BP', 'SI', 'DI'], {});
  d.text(205, 302, 'general purpose', { cls: 'd-small', anchor: 'start' });
  const cu = d.box(330, 250, 160, 56, { label: 'Control unit', kind: 'dark' });
  const alu = d.box(330, 340, 160, 56, { label: 'ALU', kind: 'red' });
  d.box(540, 340, 90, 26, { label: 'Operands', r: 0, kind: 'alt' });
  d.box(540, 366, 90, 26, { label: 'Flags', r: 0 });
  d.path([[585, 110], [585, 200], [410, 200], cu.top], { cls: 'd-line-acc', label: 'instruction bytes', labelAt: [500, 200] });
  d.path([cu.bottom, alu.top]);
  d.path([alu.right, [540, 366]]);
  d.path([[190, 323], [330, 323], [330, 368]], { arrow: null, cls: 'd-line-mut' });
  return d;
};

// ---------- Register file (8086) ----------
specs['i8086-registers'] = () => {
  const d = new Diagram(720, 460, { minw: 560 });
  const row = (y, name, cells, desc) => { d.text(60, y + 14, name, { cls: 'd-mono', anchor: 'end' }); cells(); d.text(250, y + 14, desc, { cls: 'd-text', anchor: 'start' }); };
  const sect = (y, title, note) => { d.text(80, y, title, { cls: 'd-caps', anchor: 'start' }); d.text(430, y, note, { cls: 'd-small', anchor: 'start' }); };
  sect(24, 'Data group', 'two bytes each; high and low byte usable on their own');
  [['AX', 'AH', 'AL', 'Accumulator'], ['BX', 'BH', 'BL', 'Base'], ['CX', 'CH', 'CL', 'Count'], ['DX', 'DH', 'DL', 'Data']].forEach(([n, h, l, t], i) => {
    const y = 38 + i * 28; row(y, n, () => { d.box(80, y, 75, 28, { label: h, mono: true, r: 0, kind: 'tint' }); d.box(155, y, 75, 28, { label: l, mono: true, r: 0, kind: 'tint' }); }, t);
  });
  sect(176, 'Pointer & index group', 'used as memory pointers');
  [['SP', 'Stack pointer'], ['BP', 'Base pointer'], ['SI', 'Source index'], ['DI', 'Destination index'], ['IP', 'Instruction pointer']].forEach(([n, t], i) => {
    const y = 190 + i * 28; row(y, n, () => d.box(80, y, 150, 28, { label: n, mono: true, r: 0 }), t);
  });
  sect(348, 'Segment group', 'base address of a 64 KB segment');
  [['CS', 'Code'], ['DS', 'Data'], ['SS', 'Stack'], ['ES', 'Extra']].forEach(([n, t], i) => {
    const x = 80 + i * 150; d.box(x, 362, 140, 30, { label: `${n} · ${t}`, mono: true, r: 0, kind: 'alt' });
  });
  d.text(80, 420, 'FLAGS', { cls: 'd-caps', anchor: 'start' });
  d.box(80, 432, 150, 24, { label: 'FLAGS (16-bit)', mono: true, r: 0, kind: 'dark' });
  d.text(250, 444, '6 status flags · 3 control flags · 7 unused bits', { cls: 'd-text', anchor: 'start' });
  return d;
};

// ---------- Bits, bytes, word ----------
specs['bits-bytes-word'] = () => {
  const d = new Diagram(640, 200, { minw: 520 });
  const bits = '0010011001101010'.split('');
  bits.forEach((b, i) => d.box(40 + i * 35, 70, 35, 40, { label: b, mono: true, r: 0, kind: i < 8 ? 'tint' : 'alt' }));
  d.dim(40, 320, 40, 'byte (8 bits)');
  d.dim(320, 600, 40, 'byte (8 bits)');
  d.dim(40, 180, 130, 'nibble');
  d.dim(40, 600, 162, 'word (16 bits), two words make a double word (32 bits)');
  return d;
};

// ---------- Memory hierarchy ----------
specs['memory-hierarchy'] = () => {
  const d = new Diagram(680, 340, { minw: 540 });
  const lv = [['Registers', 'inside the CPU', 'red'], ['Cache', 'SRAM, on/near the chip', 'tint'], ['Main memory (RAM)', 'DRAM', 'alt'], ['Disk', 'magnetic / SSD', 'box'], ['Removable media', 'tape, optical, USB', 'box']];
  lv.forEach(([t, s, k], i) => { const w = 180 + i * 80, x = 340 - w / 2; d.box(x, 30 + i * 56, w, 46, { label: t, sub: s, kind: k, r: 0 }); });
  d.path([[50, 300], [50, 40]], { cls: 'd-line-acc', arrow: 'end' });
  d.text(36, 170, 'faster · smaller · more cost per bit', { cls: 'd-small', rotate: -90 });
  d.path([[630, 40], [630, 300]], { cls: 'd-line-mut', arrow: 'end' });
  d.text(644, 170, 'slower · larger · cheaper per bit', { cls: 'd-small', rotate: 90 });
  return d;
};

// ---------- Memory connections ----------
specs['memory-connections'] = () => {
  const d = new Diagram(700, 240, { minw: 560 });
  const aux = d.box(20, 40, 140, 50, { label: 'Auxiliary memory', kind: 'alt' });
  const iop = d.box(220, 40, 140, 50, { label: 'I/O processor' });
  const mm = d.box(420, 40, 140, 50, { label: 'Main memory', kind: 'tint' });
  const cache = d.box(560, 150, 120, 50, { label: 'Cache', kind: 'alt' });
  const cpu = d.box(380, 150, 120, 50, { label: 'CPU', kind: 'red' });
  d.path([aux.right, iop.left], { arrow: 'both' });
  d.path([iop.right, mm.left], { arrow: 'both' });
  d.path([[440, 90], [440, 150]], { arrow: 'both' });
  d.path([[540, 90], [540, 120], [620, 120], [620, 150]], { arrow: 'both' });
  d.path([cpu.right, cache.left], { arrow: 'both', cls: 'd-line-acc' });
  return d;
};

// ---------- Memory segments ----------
specs['memory-segments'] = () => {
  const d = new Diagram(620, 470, { minw: 480 });
  const addr = ['F0000', 'E0000', 'D0000', 'C0000', 'B0000', 'A0000', '90000', '80000', '70000', '60000', '50000', '40000', '30000', '20000', '10000', '00000'];
  addr.forEach((a, i) => { d.box(110, 20 + i * 26, 150, 26, { r: 0, kind: a === '80000' ? 'red' : 'box' }); d.text(98, 33 + i * 26, a, { cls: 'd-mono', anchor: 'end' }); });
  const seg = d.box(400, 170, 190, 90, { kind: 'tint', label: 'One segment', sub: '64 KB = 2¹⁶ bytes' });
  d.path([[260, 215], [400, 215]], { cls: 'd-line-acc' });
  d.text(495, 152, '8000:FFFF  (last byte)', { cls: 'd-mono' });
  d.text(495, 278, '8000:0000  (first byte)', { cls: 'd-mono' });
  d.text(430, 320, 'segment', { cls: 'd-small' }); d.text(530, 320, 'offset', { cls: 'd-small' });
  d.path([[430, 310], [440, 290]], { cls: 'd-line-mut', arrow: 'end' });
  d.path([[530, 310], [520, 290]], { cls: 'd-line-mut', arrow: 'end' });
  return d;
};

// ---------- System bus ----------
specs['system-bus'] = () => {
  const d = new Diagram(860, 280, { minw: 640 });
  const cpu = d.box(40, 30, 150, 60, { label: 'CPU', kind: 'red' });
  const mem = d.box(265, 30, 150, 60, { label: 'Memory', kind: 'tint' });
  const io = d.box(490, 30, 150, 60, { label: 'I/O', kind: 'alt' });
  const buses = [['Address bus', 140, 'd-s1', 'one-way: CPU → memory / I/O'], ['Data bus', 190, 'd-s2', 'two-way'], ['Control bus', 240, 'd-s3', 'read/write, interrupt, clock']];
  buses.forEach(([n, y, s]) => d.raw(`<path class="d-bus ${s}" d="M40 ${y} L640 ${y}"/>`, 'back'));
  [cpu, mem, io].forEach((b, i) => {
    buses.forEach(([, y], k) => {
      const x = b.x + 40 + k * 35;
      const up = k === 0 && i > 0 ? 'end' : 'both';
      d.path(k === 0 && i === 0 ? [[x, 90], [x, y - 6]] : [[x, y - 6], [x, 92]], { arrow: k === 0 ? 'end' : 'both', cls: 'd-line' });
    });
  });
  buses.forEach(([n, y, , note]) => { d.text(656, y - 8, n, { cls: 'd-label', anchor: 'start' }); d.text(656, y + 10, note, { cls: 'd-small', anchor: 'start' }); });
  return d;
};

// ---------- Interconnection structure ----------
specs['interconnection'] = () => {
  const mods = [['Memory', ['Read', 'Write', 'Address', 'Data'], ['Data'], 'tint'],
    ['I/O module', ['Read', 'Write', 'Address', 'Internal data', 'External data'], ['Internal data', 'External data', 'Interrupt signals'], 'alt'],
    ['CPU', ['Instructions', 'Data', 'Interrupt signals'], ['Address', 'Control signals', 'Data'], 'red']];
  const rowH = (m) => Math.max(m[1].length, m[2].length) * 30 + 20;
  const H = mods.reduce((s, m) => s + rowH(m) + 24, 20) + 30;
  const d = new Diagram(660, H, { minw: 520 });
  let y0 = 20;
  mods.forEach(([title, ins, outs, kind]) => {
    const h = rowH([title, ins, outs]);
    d.box(250, y0, 160, h, { title, kind });
    const line = (list, x1, x2, tx, anchor) => list.forEach((t, i) => { const y = y0 + h / 2 + (i - (list.length - 1) / 2) * 30; d.path([[x1, y], [x2, y]]); d.text(tx, y - 11, t, { cls: 'd-text', anchor }); });
    line(ins, 60, 250, 64, 'start');
    line(outs, 410, 600, 596, 'end');
    y0 += h + 24;
  });
  d.text(330, H - 14, 'Inputs enter on the left, outputs leave on the right; the bus links one module’s outputs to another’s inputs.', { cls: 'd-small' });
  return d;
};

// ---------- CPU register pages ----------
specs['data-flow-registers'] = () => {
  const d = new Diagram(700, 170, { minw: 560 });
  const items = [['Hard disk', 'box', 'slowest'], ['RAM', 'alt', ''], ['Cache', 'tint', ''], ['Registers', 'red', 'fastest']];
  d.box(500, 30, 180, 110, { kind: 'group', label: 'CPU' });
  const bx = items.map(([t, k], i) => d.box(20 + i * 170, 64, 140, 50, { label: t, kind: k }));
  bx.slice(1).forEach((b, i) => d.path([bx[i].right, b.left], { cls: 'd-line-acc' }));
  d.text(90, 140, 'slowest, largest', { cls: 'd-small' });
  d.text(600, 158, 'fastest, smallest', { cls: 'd-small' });
  return d;
};
specs['cpu-block-registers'] = () => {
  const d = new Diagram(640, 480, { minw: 520 });
  const out = d.box(240, 20, 160, 44, { label: 'Output', kind: 'alt' });
  d.box(40, 100, 560, 280, { kind: 'group', label: 'Central processing unit (CPU)' });
  d.box(60, 130, 220, 140, { kind: 'group', label: 'Control unit' });
  d.box(80, 160, 180, 40, { label: 'Program counter', kind: 'tint' });
  d.box(80, 212, 180, 40, { label: 'Current instruction register', kind: 'tint' });
  d.box(60, 290, 220, 74, { kind: 'group', label: 'Arithmetic logic unit' });
  d.box(80, 314, 180, 38, { label: 'Accumulator', kind: 'red' });
  d.box(360, 130, 220, 140, { kind: 'group', label: 'Registers' });
  d.box(380, 160, 180, 40, { label: 'Memory data register' });
  d.box(380, 212, 180, 40, { label: 'Memory address register' });
  d.path([[280, 200], [360, 200]], { arrow: 'both' });
  d.path([[170, 270], [170, 290]], { arrow: 'both' });
  const inp = d.box(80, 420, 160, 44, { label: 'Input', kind: 'alt' });
  const mem = d.box(380, 420, 180, 44, { label: 'Memory', kind: 'alt' });
  d.path([[320, 100], out.bottom]);
  d.path([inp.top, [160, 380]]);
  d.path([[470, 380], mem.top], { arrow: 'both' });
  return d;
};
specs['fde-cycle'] = () => {
  const d = new Diagram(440, 330, { minw: 320 });
  const f = d.box(160, 20, 120, 48, { label: 'Fetch', kind: 'tint' });
  const de = d.box(300, 230, 120, 48, { label: 'Decode', kind: 'alt' });
  const ex = d.box(20, 230, 120, 48, { label: 'Execute', kind: 'red' });
  d.path([f.right, [360, 44], de.top], { cls: 'd-line-acc' });
  d.path([de.left, ex.right], { cls: 'd-line-acc' });
  d.path([ex.top, [80, 44], f.left], { cls: 'd-line-acc' });
  d.text(220, 160, ['repeats for every', 'instruction'], { cls: 'd-small' });
  return d;
};
specs['gp-registers'] = () => {
  const d = new Diagram(600, 420, { minw: 480 });
  d.dim(150, 410, 20, '16 bits');
  d.dim(150, 280, 50, '8 bits');
  d.dim(280, 410, 50, '8 bits');
  [['AX', 'AH', 'AL', 'Accumulator'], ['BX', 'BH', 'BL', 'Base'], ['CX', 'CH', 'CL', 'Count'], ['DX', 'DH', 'DL', 'Data']].forEach(([n, h, l, t], i) => {
    const y = 74 + i * 40; d.text(130, y + 20, n, { cls: 'd-mono', anchor: 'end' });
    d.box(150, y, 130, 40, { label: h, mono: true, r: 0, kind: 'tint' }); d.box(280, y, 130, 40, { label: l, mono: true, r: 0, kind: 'tint' });
    d.text(426, y + 20, t, { cls: 'd-label', anchor: 'start' });
  });
  [['SP', 'Stack pointer'], ['BP', 'Base pointer'], ['SI', 'Source index'], ['DI', 'Destination index']].forEach(([n, t], i) => {
    const y = 250 + i * 40; d.box(150, y, 260, 40, { label: n, mono: true, r: 0, kind: i < 2 ? 'alt' : 'box' }); d.text(426, y + 20, t, { cls: 'd-label', anchor: 'start' });
  });
  d.text(60, 290, 'POINTER', { cls: 'd-caps' }); d.text(60, 370, 'INDEX', { cls: 'd-caps' });
  return d;
};
specs['segment-registers'] = () => {
  const d = new Diagram(560, 420, { minw: 420 });
  d.box(200, 30, 200, 370, { r: 0 });
  [['CS', 'Code segment', 70], ['DS', 'Data segment', 160], ['SS', 'Stack segment', 250], ['ES', 'Extra segment', 340]].forEach(([n, t, y], i) => {
    d.box(200, y, 200, 46, { label: t, r: 0, kind: i === 0 ? 'tint' : 'alt' });
    const r = d.box(60, y + 6, 70, 34, { label: n, mono: true, kind: 'dark' });
    d.path([r.right, [200, y + 23]]);
  });
  d.text(300, 14, 'MEMORY', { cls: 'd-caps' });
  d.text(440, 210, ['each register holds', 'the starting address', 'of its segment'], { cls: 'd-small', anchor: 'start' });
  return d;
};
specs['flags-8086'] = () => {
  const d = new Diagram(720, 300, { minw: 600 });
  const bits = ['-', '-', '-', '-', 'OF', 'DF', 'IF', 'TF', 'SF', 'ZF', '-', 'AF', '-', 'PF', '-', 'CF'];
  const status = new Set(['OF', 'SF', 'ZF', 'AF', 'PF', 'CF']), control = new Set(['DF', 'IF', 'TF']);
  bits.forEach((b, i) => {
    const x = 40 + i * 40;
    d.box(x, 60, 40, 40, { label: b, mono: true, r: 0, kind: status.has(b) ? 'red' : control.has(b) ? 'dark' : 'box' });
    d.text(x + 20, 46, String(15 - i), { cls: 'd-small' });
  });
  const names = { OF: 'Overflow', DF: 'Direction', IF: 'Interrupt enable', TF: 'Trap', SF: 'Sign', ZF: 'Zero', AF: 'Auxiliary carry', PF: 'Parity', CF: 'Carry' };
  let k = 0;
  bits.forEach((b, i) => {
    if (!names[b]) return;
    const x = 60 + i * 40, y = 130 + (k % 3) * 34; k++;
    d.path([[x, 100], [x, y - 8]], { cls: 'd-line-mut', arrow: null });
    d.text(x, y, names[b], { cls: status.has(b) ? 'd-label d-red' : 'd-label' });
  });
  d.box(40, 250, 20, 20, { kind: 'red', r: 0 }); d.text(68, 260, 'status flags (6): result of the last operation', { cls: 'd-small', anchor: 'start' });
  d.box(380, 250, 20, 20, { kind: 'dark', r: 0 }); d.text(408, 260, 'control flags (3): change how the CPU runs', { cls: 'd-small', anchor: 'start' });
  return d;
};

// ---------- 8085 ----------
specs['i8085-architecture'] = () => {
  const d = new Diagram(780, 500, { minw: 660 });
  const ic = d.box(100, 20, 190, 40, { label: 'Interrupt control', kind: 'alt' });
  const sc = d.box(430, 20, 190, 40, { label: 'Serial I/O control', kind: 'alt' });
  d.text(205, 74, 'INTR · RST 5.5 · 6.5 · 7.5 · TRAP', { cls: 'd-small', anchor: 'start' });
  d.path([[20, 100], [760, 100]], { cls: 'd-bus', arrow: null });
  d.text(30, 88, '8-BIT INTERNAL DATA BUS', { cls: 'd-caps', anchor: 'start' });
  d.path([[ic.cx, 60], [ic.cx, 96]], { arrow: 'both' });
  d.path([[sc.cx, 60], [sc.cx, 96]], { arrow: 'both' });
  const acc = d.box(20, 130, 110, 40, { label: 'Accumulator', kind: 'red' });
  const tmp = d.box(150, 130, 110, 40, { label: 'Temp register' });
  const flg = d.box(150, 190, 110, 40, { label: 'Flag flip-flops', kind: 'tint' });
  const alu = d.box(20, 250, 240, 50, { label: 'ALU', kind: 'dark' });
  d.path([[75, 104], acc.top], { arrow: 'both' }); d.path([[205, 104], tmp.top]);
  d.path([acc.bottom, [75, 250]]); d.path([[180, 170], [180, 190]]); d.path([[205, 230], [205, 250]], { arrow: 'both' });
  d.path([[20, 275], [10, 275], [10, 104]], { cls: 'd-line-mut' });
  const ir = d.box(300, 130, 150, 40, { label: 'Instruction register', kind: 'tint' });
  const dec = d.box(300, 190, 150, 70, { label: ['Instruction decoder', '& machine cycle', 'encoding'] });
  d.path([[375, 104], ir.top]); d.path([ir.bottom, dec.top]);
  // register array
  d.box(500, 112, 260, 268, { kind: 'group', label: 'Register array' });
  const pairs = [['W (temp)', 'Z (temp)'], ['B', 'C'], ['D', 'E'], ['H', 'L']];
  pairs.forEach(([a, b], i) => { d.box(520, 140 + i * 34, 110, 34, { label: a, mono: true, r: 0, kind: i ? 'box' : 'alt' }); d.box(630, 140 + i * 34, 110, 34, { label: b, mono: true, r: 0, kind: i ? 'box' : 'alt' }); });
  d.cells(520, 280, 220, 90, ['Stack pointer (16)', 'Program counter (16)', 'Incr/decr latch (16)'], { mono: false });
  d.path([[690, 104], [690, 140]], { arrow: 'both' });
  // timing & control
  const tc = d.box(20, 340, 430, 70, { title: 'Timing & control', sub: 'CLK · READY · RD · WR · ALE · S0 S1 · IO/M · HOLD · HLDA · RESET', kind: 'alt' });
  d.path([dec.bottom, [375, 340]]);
  const ab = d.box(500, 410, 125, 40, { label: 'Address buffer' });
  const db = d.box(635, 410, 140, 40, { label: ['Data / address', 'buffer'] });
  d.path([[560, 380], ab.top]); d.path([[705, 380], db.top], { arrow: 'both' });
  d.text(560, 476, 'A15-A8 address bus', { cls: 'd-small' });
  d.text(705, 476, 'AD7-AD0 address/data bus', { cls: 'd-small' });
  d.path([ab.bottom, [560, 464]]); d.path([db.bottom, [705, 464]], { arrow: 'both' });
  return d;
};
specs['flags-8085'] = () => {
  const d = new Diagram(560, 176, { minw: 440 });
  const f = [['S', 'Sign'], ['Z', 'Zero'], ['-', ''], ['AC', 'Aux. carry'], ['-', ''], ['P', 'Parity'], ['-', ''], ['CY', 'Carry']];
  f.forEach(([b, n], i) => { const x = 40 + i * 60; d.text(x + 30, 22, `D${7 - i}`, { cls: 'd-small' }); d.box(x, 34, 60, 44, { label: b, mono: true, r: 0, kind: n ? 'red' : 'box' }); if (n) d.text(x + 30, 96, n, { cls: 'd-small' }); });
  d.text(40, 138, ['Cells marked - are unused bits.', 'The ALU sets these five flags after arithmetic and logic operations.'], { cls: 'd-small', anchor: 'start' });
  return d;
};
specs['interrupt-priority-8085'] = () => {
  const d = new Diagram(680, 150, { minw: 540 });
  const v = ['TRAP', 'RST 7.5', 'RST 6.5', 'RST 5.5', 'INTR'];
  v.forEach((t, i) => { const b = d.box(20 + i * 132, 40, 110, 48, { label: t, mono: true, kind: i === 0 ? 'red' : i === 4 ? 'box' : 'tint' }); if (i) d.text(b.x - 11, 64, '>', { cls: 'd-title' }); });
  d.path([[20, 112], [660, 112]], { cls: 'd-line-mut', arrow: 'end' });
  d.text(20, 132, 'highest priority (non-maskable)', { cls: 'd-small', anchor: 'start' });
  d.text(660, 132, 'lowest priority', { cls: 'd-small', anchor: 'end' });
  return d;
};
specs['pipelining-8086'] = () => {
  const d = new Diagram(640, 326, { minw: 520 });
  d.text(20, 24, 'NON-PIPELINED (8085)', { cls: 'd-caps', anchor: 'start' });
  ['fetch 1', 'exec 1', 'fetch 2', 'exec 2', 'fetch 3', 'exec 3'].forEach((t, i) => d.box(140 + i * 80, 40, 80, 40, { label: t, r: 0, kind: t.startsWith('f') ? 'alt' : 'tint' }));
  d.text(20, 146, 'PIPELINED (8086)', { cls: 'd-caps', anchor: 'start' });
  [0, 1, 2].forEach((i) => { const y = 162 + i * 46; d.box(140 + i * 80, y, 80, 40, { label: `fetch ${i + 1}`, r: 0, kind: 'alt' }); d.box(220 + i * 80, y, 80, 40, { label: `exec ${i + 1}`, r: 0, kind: 'tint' }); });
  d.dim(140, 620, 98, '6 time slots', { below: true });
  d.path([[140, 310], [380, 310]], { cls: 'd-line-acc', arrow: 'both' });
  d.text(390, 310, '4 time slots for the same 3 instructions', { cls: 'd-small', anchor: 'start' });
  return d;
};

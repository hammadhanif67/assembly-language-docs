// Diagrams for the assembly-programming lessons.
import { Diagram } from './lib.mjs';

export const specs = {};

// ---------- Little-endian data layout ----------
specs['data-layout'] = () => {
  const d = new Diagram(720, 230, { minw: 580 });
  d.text(40, 24, 'w  DW 1234h          d  DD 0A1B2C3D4h', { cls: 'd-mono', anchor: 'start' });
  const bytes = [['34', 'w'], ['12', 'w'], ['D4', 'd'], ['C3', 'd'], ['B2', 'd'], ['A1', 'd']];
  bytes.forEach(([b, v], i) => {
    const x = 40 + i * 100;
    d.box(x, 60, 100, 50, { label: b, mono: true, r: 0, kind: v === 'w' ? 'tint' : 'alt' });
    d.text(x + 50, 128, `offset ${String(i).padStart(4, '0')}`, { cls: 'd-small' });
  });
  d.dim(40, 240, 152, 'w = 1234h  (low byte first)', { below: true });
  d.dim(240, 640, 152, 'd = A1B2C3D4h  (lowest byte at the lowest address)', { below: true });
  d.path([[40, 206], [560, 206]], { cls: 'd-line-mut', arrow: 'end' });
  d.text(572, 206, 'higher addresses', { cls: 'd-small', anchor: 'start' });
  return d;
};

// ---------- MOV rules ----------
specs['mov-rules'] = () => {
  const d = new Diagram(720, 340, { minw: 580 });
  const reg = d.box(260, 40, 200, 60, { title: 'General register', sub: 'AX BX CX DX SI DI BP SP', kind: 'tint' });
  const mem = d.box(500, 230, 180, 60, { title: 'Memory', sub: '[BX], var, [BP+4] …', kind: 'alt' });
  const seg = d.box(40, 230, 180, 60, { title: 'Segment register', sub: 'DS ES SS (CS read-only)', kind: 'alt' });
  const imm = d.box(260, 240, 160, 50, { title: 'Immediate', sub: 'a constant: 5, 1234h' });
  d.path([[reg.x + 170, 100], [reg.x + 170, 165], [590, 165], [590, 230]], { arrow: 'both', cls: 'd-line', label: 'reg ↔ mem', labelAt: [560, 165] });
  d.path([[reg.x + 30, 100], [reg.x + 30, 165], [130, 165], [130, 230]], { arrow: 'both', cls: 'd-line', label: 'reg ↔ seg', labelAt: [190, 165] });
  d.path([[340, 240], [340, 100]], { arrow: 'end', cls: 'd-line-acc', label: 'imm → reg', labelAt: [340, 200] });
  d.path([imm.right, [mem.x, 265]], { arrow: 'end', cls: 'd-line-acc' });
  d.text(460, 248, 'imm → mem', { cls: 'd-small' });
  d.text(40, 318, '✗ not allowed: memory → memory · immediate → segment · segment → segment · anything → CS', { cls: 'd-label d-red', anchor: 'start' });
  return d;
};

// ---------- MUL / DIV registers ----------
specs['mul-div'] = () => {
  const d = new Diagram(740, 300, { minw: 600 });
  const row = (y, title, a, op, b, res) => {
    d.text(20, y + 20, title, { cls: 'd-caps', anchor: 'start' });
    d.box(160, y, 90, 40, { label: a, mono: true, kind: 'tint', r: 0 });
    d.text(270, y + 20, op, { cls: 'd-title' });
    d.box(290, y, 110, 40, { label: b, mono: true, kind: 'alt', r: 0 });
    d.text(420, y + 20, '→', { cls: 'd-title' });
    let x = 440; res.forEach(([t, w, k]) => { d.box(x, y, w, 40, { label: t, mono: true, kind: k, r: 0 }); x += w; });
  };
  row(20, 'MUL byte', 'AL', '×', 'r/m8', [['AX = product', 200, 'red']]);
  row(80, 'MUL word', 'AX', '×', 'r/m16', [['DX', 100, 'red'], ['AX', 100, 'red']]);
  row(160, 'DIV byte', 'AX', '÷', 'r/m8', [['AH = rem.', 120, 'box'], ['AL = quot.', 120, 'red']]);
  row(220, 'DIV word', 'DX:AX', '÷', 'r/m16', [['DX = rem.', 120, 'box'], ['AX = quot.', 120, 'red']]);
  d.text(440, 140, 'high word in DX · low word in AX', { cls: 'd-small', anchor: 'start' });
  d.text(20, 286, 'IMUL / IDIV use the same registers for signed numbers. Clear DX (or CWD) before a word division.', { cls: 'd-small', anchor: 'start' });
  return d;
};

// ---------- Effective address ----------
specs['ea-calc'] = () => {
  const d = new Diagram(760, 260, { minw: 620 });
  const base = d.box(20, 40, 130, 70, { title: 'Base', sub: 'BX or BP (optional)', kind: 'tint' });
  d.text(170, 75, '+', { cls: 'd-title' });
  const idx = d.box(190, 40, 130, 70, { title: 'Index', sub: 'SI or DI (optional)', kind: 'tint' });
  d.text(340, 75, '+', { cls: 'd-title' });
  const disp = d.box(360, 40, 130, 70, { title: 'Displacement', sub: '8 / 16-bit (optional)', kind: 'tint' });
  const ea = d.box(560, 40, 170, 70, { title: 'Effective address', sub: '16-bit offset', kind: 'red' });
  d.path([disp.right, ea.left], { cls: 'd-line-acc' });
  const seg = d.box(20, 160, 200, 70, { title: 'Segment × 10h', sub: 'DS (SS if BP is used)', kind: 'alt' });
  d.text(240, 195, '+', { cls: 'd-title' });
  const off = d.box(260, 160, 160, 70, { title: 'Effective address', sub: 'from above' });
  const pa = d.box(560, 160, 170, 70, { title: 'Physical address', sub: '20-bit', kind: 'dark' });
  d.path([off.right, pa.left]);
  d.path([ea.bottom, [645, 135], [340, 135], off.top], { cls: 'd-line-mut' });
  return d;
};

// ---------- Shifts and rotates ----------
specs['shift-rotate'] = () => {
  const d = new Diagram(760, 470, { minw: 620 });
  const reg = (y, name, fillIn, toCF, wrap, note) => {
    d.text(20, y + 18, name, { cls: 'd-mono', anchor: 'start' });
    const x0 = 230;
    for (let i = 0; i < 8; i++) d.box(x0 + i * 30, y, 30, 36, { label: i === 0 ? 'b7' : i === 7 ? 'b0' : '', mono: true, kind: 'alt', r: 0 });
    const cf = d.box(toCF === 'left' ? 160 : 520, y, 44, 36, { label: 'CF', mono: true, kind: 'red', r: 0 });
    if (toCF === 'left') {
      d.path([[x0, y + 18], [cf.x + 44, y + 18]], { cls: 'd-line-acc' });
      if (fillIn) d.path([[x0 + 240 + 50, y + 18], [x0 + 240, y + 18]], { cls: 'd-line' }), d.text(x0 + 300, y + 18, fillIn, { cls: 'd-small', anchor: 'start' });
    } else {
      d.path([[x0 + 240, y + 18], [cf.x, y + 18]], { cls: 'd-line-acc' });
      if (fillIn) d.path([[x0 - 50, y + 18], [x0, y + 18]], { cls: 'd-line' }), d.text(x0 - 56, y + 18, fillIn, { cls: 'd-small', anchor: 'end' });
    }
    if (wrap === 'reg') d.path(toCF === 'left' ? [[x0 + 15, y], [x0 + 15, y - 10], [x0 + 225, y - 10], [x0 + 225, y]] : [[x0 + 225, y], [x0 + 225, y - 10], [x0 + 15, y - 10], [x0 + 15, y]], { cls: 'd-line' });
    if (wrap === 'cf') d.path(toCF === 'left' ? [[cf.x + 22, y + 36], [cf.x + 22, y + 48], [x0 + 225, y + 48], [x0 + 225, y + 36]] : [[cf.x + 22, y + 36], [cf.x + 22, y + 48], [x0 + 15, y + 48], [x0 + 15, y + 36]], { cls: 'd-line' });
    d.text(600, y + 18, note, { cls: 'd-small', anchor: 'start' });
  };
  reg(30, 'SHL / SAL', '0', 'left', null, '× 2 (unsigned & signed)');
  reg(100, 'SHR', '0', 'right', null, '÷ 2 unsigned');
  reg(170, 'SAR', 'sign', 'right', null, '÷ 2 signed');
  reg(250, 'ROL', null, 'left', 'reg', 'b7 → b0 and CF');
  reg(320, 'ROR', null, 'right', 'reg', 'b0 → b7 and CF');
  reg(390, 'RCL', null, 'left', 'cf', '9-bit rotate through CF');
  return d;
};

// ---------- MOVSB with REP ----------
specs['movsb'] = () => {
  const d = new Diagram(740, 300, { minw: 600 });
  d.text(20, 24, 'SOURCE  DS:SI', { cls: 'd-caps', anchor: 'start' });
  d.text(420, 24, 'DESTINATION  ES:DI', { cls: 'd-caps', anchor: 'start' });
  const src = 'COAL'.split('');
  src.forEach((c, i) => { d.box(20 + i * 70, 40, 70, 46, { label: `'${c}'`, mono: true, r: 0, kind: i === 1 ? 'red' : 'tint' }); d.box(420 + i * 70, 40, 70, 46, { label: i === 0 ? `'C'` : '', mono: true, r: 0, kind: i === 0 ? 'tint' : 'box' }); });
  d.path([[125, 86], [125, 120], [525, 120], [525, 86]], { cls: 'd-line-acc', label: 'MOVSB copies one byte', labelAt: [325, 120] });
  d.path([[125, 160], [125, 90]], { cls: 'd-line', arrow: 'end' }); d.text(125, 172, 'SI', { cls: 'd-mono' });
  d.path([[525, 160], [525, 90]], { cls: 'd-line', arrow: 'end' }); d.text(525, 172, 'DI', { cls: 'd-mono' });
  d.box(20, 200, 700, 80, { kind: 'alt' });
  d.text(40, 222, 'After each byte:  SI ← SI ± 1,  DI ← DI ± 1   (+ if DF = 0 after CLD,  − if DF = 1 after STD)', { cls: 'd-text', anchor: 'start' });
  d.text(40, 252, 'With REP:  repeat while CX ≠ 0, decrementing CX each time, copies CX bytes in one instruction.', { cls: 'd-text', anchor: 'start' });
  return d;
};

// ---------- Interrupt vector table ----------
specs['ivt'] = () => {
  const d = new Diagram(760, 380, { minw: 620 });
  d.text(40, 24, 'INTERRUPT VECTOR TABLE  0000:0000-0000:03FF', { cls: 'd-caps', anchor: 'start' });
  const rows = [['0000', 'INT 00h', 'divide error'], ['0004', 'INT 01h', 'single step'], ['0008', 'INT 02h', 'NMI'], ['⋮', '', ''], ['0040', 'INT 10h', 'BIOS video'], ['⋮', '', ''], ['0084', 'INT 21h', 'DOS services'], ['⋮', '', ''], ['03FC', 'INT FFh', '']];
  rows.forEach(([a, n, t], i) => {
    const y = 40 + i * 34, hl = n === 'INT 21h';
    d.text(100, y + 17, a, { cls: 'd-mono', anchor: 'end' });
    d.box(110, y, 120, 34, { label: n ? 'IP (offset)' : '', mono: !!n, r: 0, kind: hl ? 'red' : 'box' });
    d.box(230, y, 120, 34, { label: n ? 'CS (segment)' : '', mono: !!n, r: 0, kind: hl ? 'red' : 'box' });
    if (n) d.text(366, hl ? y + 11 : y + 17, `${n} · ${t}`.replace(/ · $/, ''), { cls: hl ? 'd-label d-red' : 'd-small', anchor: 'start' });
  });
  const h = d.box(560, 236, 170, 60, { title: 'DOS handler', sub: 'interrupt service routine', kind: 'tint' });
  d.path([[350, 270], [520, 270], [520, 266], h.left], { cls: 'd-line-acc' });
  d.text(645, 222, 'CS:IP of the handler', { cls: 'd-small' });
  d.text(560, 330, ['vector address = n × 4', '21h × 4 = 84h'], { cls: 'd-mono', anchor: 'start' });
  return d;
};

/* COAL Docs — calculator workbench (tools page). Each tool registers as a widget. */
(function () {
  'use strict';
  const W = window.COAL_WIDGETS;
  if (!W) return;

  // ---------- helpers ----------
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
  const $ = (s, r) => r.querySelector(s);
  const hex = (n, digits) => (n >>> 0).toString(16).toUpperCase().padStart(digits, '0');
  const bin = (n, bits) => (n >>> 0).toString(2).padStart(bits, '0').slice(-bits).replace(/(.{4})(?=.)/g, '$1 ');
  const mask = (bits) => (bits === 32 ? 0xffffffff : (1 << bits) - 1);
  const toSigned = (n, bits) => { n = (n >>> 0) & mask(bits); return n >= 2 ** (bits - 1) ? n - 2 ** bits : n; };
  const parity = (n) => { let c = 0; n &= 0xff; while (n) { c += n & 1; n >>= 1; } return c % 2 === 0; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // accepts 200, -56, 0C8h, 0xC8, 11001000b, 0b1100, 310o, 'A'
  function parseNum(raw) {
    let s = String(raw).trim().replace(/[\s_]/g, '');
    if (!s) return null;
    if (/^'.'$/.test(s)) return s.charCodeAt(1);
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    let v;
    if (/^0x[0-9a-f]+$/i.test(s)) v = parseInt(s.slice(2), 16);
    else if (/^[0-9][0-9a-f]*h$/i.test(s)) v = parseInt(s.slice(0, -1), 16);
    else if (/^[a-f][0-9a-f]*h$/i.test(s)) v = parseInt(s.slice(0, -1), 16);
    else if (/^0b[01]+$/i.test(s)) v = parseInt(s.slice(2), 2);
    else if (/^[01]+b$/i.test(s)) v = parseInt(s.slice(0, -1), 2);
    else if (/^[0-7]+[oq]$/i.test(s)) v = parseInt(s.slice(0, -1), 8);
    else if (/^\d+$/.test(s)) v = parseInt(s, 10);
    else return null;
    if (!Number.isFinite(v)) return null;
    return neg ? -v : v;
  }
  const field = (label, name, value, extra = '') => `<label class="t-field"><span>${label}</span><input name="${name}" value="${esc(value)}" autocomplete="off" spellcheck="false" ${extra}></label>`;
  const select = (label, name, opts, sel) => `<label class="t-field"><span>${label}</span><select name="${name}">${opts.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${v}"${String(v) === String(sel) ? ' selected' : ''}>${t}</option>`; }).join('')}</select></label>`;
  const rows = (pairs) => `<dl class="t-out">${pairs.map(([k, v, cls]) => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const err = (msg) => `<p class="t-err">${esc(msg)}</p>`;
  function bind(el, form, out, compute) {
    const run = () => {
      const v = Object.fromEntries([...form.querySelectorAll('input,select')].map((i) => [i.name, i.type === 'checkbox' ? i.checked : i.value]));
      try { out.innerHTML = compute(v); } catch (e) { out.innerHTML = err(e.message); }
    };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    run();
    return run;
  }
  const mount = (el, formHtml) => {
    el.append(h(`<form class="t-form" onsubmit="return false">${formHtml}</form><div class="t-result" aria-live="polite"></div>`));
    return [$('.t-form', el), $('.t-result', el)];
  };
  const need = (v, name) => { if (v === null) throw new Error(`${name}: enter a number such as 200, -56, 0C8h, 11001000b or 'A'.`); return v; };

  // ---------- 1. Base converter with clickable bits ----------
  W.register('tool-base', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Value (any base)', 'v', '200')}${select('Width', 'w', [[8, '8-bit byte'], [16, '16-bit word'], [32, '32-bit dword']], 16)}</div><p class="t-hint">Type decimal, hex (<code>0C8h</code>, <code>0xC8</code>), binary (<code>11001000b</code>), octal (<code>310o</code>) or a character (<code>'A'</code>). Click a bit to flip it.</p>`);
    const input = $('[name=v]', form);
    bind(el, form, out, (v) => {
      const bits = +v.w;
      let n = need(parseNum(v.v), 'Value');
      if (n < -(2 ** (bits - 1)) || n > mask(bits)) throw new Error(`Does not fit in ${bits} bits (range ${-(2 ** (bits - 1))} … ${mask(bits) >>> 0}).`);
      n = (n >>> 0) & mask(bits);
      const cells = Array.from({ length: bits }, (_, i) => { const b = bits - 1 - i; const on = (n >>> b) & 1; return `<button type="button" class="t-bit${on ? ' on' : ''}" data-b="${b}" title="bit ${b}">${on}</button>`; }).join('');
      const ch = n >= 32 && n < 127 ? `'${String.fromCharCode(n)}'` : '—';
      return `<div class="t-bits" style="--n:${Math.min(bits, 16)}">${cells}</div>` + rows([
        ['Unsigned decimal', n >>> 0], ['Signed decimal', toSigned(n, bits)], ['Hexadecimal', hex(n, bits / 4) + 'h'],
        ['Binary', bin(n, bits) + 'b'], ['Octal', (n >>> 0).toString(8) + 'o'], ['ASCII (low byte)', esc(String.fromCharCode(n & 0xff)).trim() && (n & 0xff) >= 32 && (n & 0xff) < 127 ? `'${esc(String.fromCharCode(n & 0xff))}'` : '—'],
      ]);
    });
    out.addEventListener('click', (e) => {
      const b = e.target.closest('.t-bit'); if (!b) return;
      const bits = +$('[name=w]', form).value;
      let n = (parseNum(input.value) >>> 0) & mask(bits);
      n = (n ^ (2 ** +b.dataset.b)) >>> 0;
      input.value = hex(n, bits / 4) + 'h';
      form.dispatchEvent(new Event('input'));
    });
  });

  // ---------- 2. Two's complement, step by step ----------
  W.register('tool-twos', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Decimal number', 'v', '-6')}${select('Width', 'w', [[8, '8-bit'], [16, '16-bit'], [32, '32-bit']], 8)}</div>`);
    bind(el, form, out, (v) => {
      const bits = +v.w, n = need(parseNum(v.v), 'Number');
      const lo = -(2 ** (bits - 1)), hi = 2 ** (bits - 1) - 1;
      if (n < lo || n > hi) throw new Error(`Out of the signed ${bits}-bit range ${lo} … ${hi}.`);
      const abs = Math.abs(n), m = mask(bits);
      const res = (n >>> 0) & m;
      if (n >= 0) return rows([['Positive — stored as is', bin(abs, bits)], ['Hex', hex(res, bits / 4) + 'h'], ['Signed range', `${lo} … ${hi}`]]);
      const inv = (~abs >>> 0) & m;
      return rows([
        [`1. |${n}| in binary`, bin(abs, bits)], ['2. Invert every bit', bin(inv, bits)], ['3. Add 1', `<b>${bin(res, bits)}</b>`],
        ['Result (hex)', `<b>${hex(res, bits / 4)}h</b>`], ['Same bits read unsigned', res >>> 0], ['Signed range', `${lo} … ${hi}`],
      ]);
    });
  });

  // ---------- 3. ALU & flags ----------
  const flagsOf = (op, a, b, r, bits, cf) => {
    const m = mask(bits), sb = 2 ** (bits - 1), R = (r >>> 0) & m;
    const f = { ZF: R === 0, SF: !!(R & sb), PF: parity(R), CF: false, OF: false, AF: false };
    const sa = !!(a & sb), sbb = !!(b & sb), sr = !!(R & sb);
    if (op === 'ADD' || op === 'ADC' || op === 'INC') { f.CF = op === 'INC' ? cf : r > m; f.OF = sa === sbb && sr !== sa; f.AF = ((a & 0xf) + (b & 0xf) + (op === 'ADC' && cf ? 1 : 0)) > 0xf; }
    else if (op === 'SUB' || op === 'SBB' || op === 'CMP' || op === 'DEC' || op === 'NEG') { f.CF = op === 'DEC' ? cf : op === 'NEG' ? b !== 0 : r < 0; f.OF = sa !== sbb && sr !== sa; f.AF = (a & 0xf) - (b & 0xf) - (op === 'SBB' && cf ? 1 : 0) < 0; }
    else { f.CF = false; f.OF = false; f.AF = false; }
    return f;
  };
  W.register('tool-alu', (el) => {
    const ops = ['ADD', 'ADC', 'SUB', 'SBB', 'CMP', 'AND', 'OR', 'XOR', 'TEST', 'INC', 'DEC', 'NEG'];
    const [form, out] = mount(el, `<div class="t-row">${select('Instruction', 'op', ops, 'ADD')}${select('Width', 'w', [[8, '8-bit (AL…)'], [16, '16-bit (AX…)']], 8)}${field('Destination', 'a', '0FFh')}${field('Source', 'b', '1')}<label class="t-check"><input type="checkbox" name="cf"><span>CF before (ADC/SBB)</span></label></div>`);
    bind(el, form, out, (v) => {
      const bits = +v.w, m = mask(bits), op = v.op, cf = !!v.cf;
      const unary = ['INC', 'DEC', 'NEG'].includes(op);
      let a = need(parseNum(v.a), 'Destination'), b = unary ? 1 : need(parseNum(v.b), 'Source');
      a = (a >>> 0) & m; b = (b >>> 0) & m;
      let r;
      switch (op) {
        case 'ADD': r = a + b; break; case 'ADC': r = a + b + (cf ? 1 : 0); break;
        case 'SUB': case 'CMP': r = a - b; break; case 'SBB': r = a - b - (cf ? 1 : 0); break;
        case 'AND': case 'TEST': r = a & b; break; case 'OR': r = a | b; break; case 'XOR': r = a ^ b; break;
        case 'INC': r = a + 1; break; case 'DEC': r = a - 1; break; case 'NEG': r = 0 - a; break;
      }
      const f = flagsOf(op, op === 'NEG' ? 0 : a, op === 'NEG' ? a : (op === 'INC' || op === 'DEC' ? 1 : b), r, bits, cf);
      const R = (r >>> 0) & m, d = bits / 4;
      const flagInfo = { CF: 'carry/borrow out of the top bit (unsigned overflow)', ZF: 'result is zero', SF: 'top bit of the result (negative if signed)', OF: 'signed overflow', PF: 'even number of 1s in the low byte', AF: 'carry/borrow out of bit 3 (BCD)' };
      const chips = Object.entries(flagInfo).map(([k, t]) => `<span class="t-flag${f[k] ? ' on' : ''}" title="${t}">${k}=${f[k] ? 1 : 0}</span>`).join('');
      const kept = op === 'CMP' || op === 'TEST' ? ' <em>(not stored — only flags change)</em>' : '';
      const unchangedCF = op === 'INC' || op === 'DEC' ? '<p class="t-hint">INC and DEC leave CF unchanged.</p>' : '';
      return rows([
        ['Operation', unary ? `${op} ${hex(a, d)}h` : `${op} ${hex(a, d)}h, ${hex(b, d)}h`],
        ['Result', `<b>${hex(R, d)}h</b>${kept}`], ['Binary', bin(R, bits)], ['Unsigned / signed', `${R} / ${toSigned(R, bits)}`],
      ]) + `<div class="t-flags">${chips}</div>${unchangedCF}`;
    });
  });

  // ---------- 4. Shift & rotate ----------
  W.register('tool-shift', (el) => {
    const ops = ['SHL', 'SAL', 'SHR', 'SAR', 'ROL', 'ROR', 'RCL', 'RCR'];
    const [form, out] = mount(el, `<div class="t-row">${select('Instruction', 'op', ops, 'SHL')}${select('Width', 'w', [[8, '8-bit'], [16, '16-bit']], 8)}${field('Value', 'v', '10110011b')}${field('Count (1 or CL)', 'c', '1', 'inputmode="numeric"')}<label class="t-check"><input type="checkbox" name="cf"><span>CF before</span></label></div>`);
    bind(el, form, out, (v) => {
      const bits = +v.w, m = mask(bits), top = 2 ** (bits - 1);
      let x = (need(parseNum(v.v), 'Value') >>> 0) & m, cf = v.cf ? 1 : 0;
      const count = need(parseNum(v.c), 'Count');
      if (count < 0 || count > 31) throw new Error('Count must be 0–31 (the 8086 uses CL; later CPUs mask it to 5 bits).');
      const steps = [[0, x, cf]];
      for (let i = 0; i < count; i++) {
        const msb = x & top ? 1 : 0, lsb = x & 1;
        switch (v.op) {
          case 'SHL': case 'SAL': cf = msb; x = (x << 1) & m; break;
          case 'SHR': cf = lsb; x = x >>> 1; break;
          case 'SAR': cf = lsb; x = (x >>> 1) | (x & top); break;
          case 'ROL': cf = msb; x = ((x << 1) | msb) & m; break;
          case 'ROR': cf = lsb; x = (x >>> 1) | (lsb ? top : 0); break;
          case 'RCL': x = ((x << 1) | cf) & m; cf = msb; break;
          case 'RCR': x = (x >>> 1) | (cf ? top : 0); cf = lsb; break;
        }
        steps.push([i + 1, x, cf]);
      }
      const table = `<table class="t-table"><thead><tr><th>Step</th><th>Value</th><th>Hex</th><th>CF</th></tr></thead><tbody>${steps.map(([i, n, c]) => `<tr><td>${i}</td><td class="mono">${bin(n, bits)}</td><td class="mono">${hex(n, bits / 4)}h</td><td>${c}</td></tr>`).join('')}</tbody></table>`;
      return rows([['Result', `<b>${hex(x, bits / 4)}h</b> = ${x} unsigned, ${toSigned(x, bits)} signed`], ['CF after', cf]]) + table;
    });
  });

  // ---------- 5. MUL / DIV ----------
  W.register('tool-muldiv', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${select('Instruction', 'op', ['MUL', 'IMUL', 'DIV', 'IDIV'], 'MUL')}${select('Operand size', 'w', [[8, 'byte (r/m8)'], [16, 'word (r/m16)']], 8)}${field('AX', 'ax', '12')}${field('DX (word div only)', 'dx', '0')}${field('Operand', 'src', '10')}</div>`);
    bind(el, form, out, (v) => {
      const bits = +v.w, signed = v.op[0] === 'I', isDiv = v.op.includes('DIV');
      const AX = (need(parseNum(v.ax), 'AX') >>> 0) & 0xffff, DX = (need(parseNum(v.dx), 'DX') >>> 0) & 0xffff;
      const src = (need(parseNum(v.src), 'Operand') >>> 0) & mask(bits);
      const sv = signed ? toSigned(src, bits) : src;
      if (!isDiv) {
        if (bits === 8) {
          const a = signed ? toSigned(AX & 0xff, 8) : AX & 0xff, p = a * sv, P = p & 0xffff;
          const of = signed ? toSigned(P, 16) !== toSigned(P & 0xff, 8) : (P >> 8) !== 0;
          return rows([['Computes', `AL × operand = ${a} × ${sv}`], ['AX', `<b>${hex(P, 4)}h</b> = ${p}`], ['CF = OF', `${of ? 1 : 0} (${of ? 'AH holds significant bits' : 'result fits in AL'})`]]);
        }
        const a = signed ? toSigned(AX, 16) : AX, p = BigInt(a) * BigInt(sv), P = Number(BigInt.asUintN(32, p));
        const of = signed ? Number(BigInt.asIntN(32, p)) !== toSigned(P & 0xffff, 16) : (P >>> 16) !== 0;
        return rows([['Computes', `AX × operand = ${a} × ${sv}`], ['DX', `<b>${hex(P >>> 16, 4)}h</b>`], ['AX', `<b>${hex(P & 0xffff, 4)}h</b>`], ['DX:AX', `${p}`], ['CF = OF', `${of ? 1 : 0} (${of ? 'DX holds significant bits' : 'result fits in AX'})`]]);
      }
      if (sv === 0) return rows([['Result', '<span class="t-bad">Divide error — INT 0 (division by zero)</span>']]);
      const dividend = bits === 8 ? (signed ? toSigned(AX, 16) : AX) : (signed ? toSigned(((DX << 16) | AX) >>> 0, 32) : ((DX << 16) | AX) >>> 0);
      const q = Math.trunc(dividend / sv), r = dividend - q * sv;
      const qmax = signed ? 2 ** (bits - 1) - 1 : mask(bits), qmin = signed ? -(2 ** (bits - 1)) : 0;
      if (q > qmax || q < qmin) return rows([['Computes', `${dividend} ÷ ${sv} = ${q}`], ['Result', `<span class="t-bad">Divide overflow — quotient does not fit in ${bits === 8 ? 'AL' : 'AX'} (INT 0)</span>`]]);
      const qn = q & mask(bits), rn = r & mask(bits);
      return bits === 8
        ? rows([['Computes', `AX ÷ operand = ${dividend} ÷ ${sv}`], ['AL (quotient)', `<b>${hex(qn, 2)}h</b> = ${q}`], ['AH (remainder)', `<b>${hex(rn, 2)}h</b> = ${r}`]])
        : rows([['Computes', `DX:AX ÷ operand = ${dividend} ÷ ${sv}`], ['AX (quotient)', `<b>${hex(qn, 4)}h</b> = ${q}`], ['DX (remainder)', `<b>${hex(rn, 4)}h</b> = ${r}`]]);
    });
  });

  // ---------- 6. Segment : offset ----------
  W.register('tool-segoff', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${select('Find', 'mode', [['pa', 'Physical address'], ['off', 'Offset'], ['seg', 'Segment']], 'pa')}${field('Segment (hex)', 'seg', '40FF')}${field('Offset (hex)', 'off', '938B')}${field('Physical (hex)', 'pa', '4A37B')}</div><p class="t-hint">Physical address = segment × 10h + offset. Fill the two values you know.</p>`);
    const hx = (s, name, max) => { const v = parseInt(String(s).trim().replace(/h$/i, ''), 16); if (!/^[0-9a-f]+h?$/i.test(String(s).trim()) || v > max) throw new Error(`${name}: enter up to ${max.toString(16).length} hex digits.`); return v; };
    bind(el, form, out, (v) => {
      if (v.mode === 'pa') {
        const s = hx(v.seg, 'Segment', 0xffff), o = hx(v.off, 'Offset', 0xffff), p = s * 16 + o;
        return rows([['Logical address', `${hex(s, 4)}:${hex(o, 4)}`], ['Segment × 10h', `${hex(s * 16, 5)}h`], ['+ Offset', `${hex(o, 4)}h`], ['Physical address', `<b>${hex(p & 0xfffff, 5)}h</b>${p > 0xfffff ? ' <em>(wrapped past 1 MB)</em>' : ''}`]]);
      }
      const p = hx(v.pa, 'Physical', 0xfffff);
      if (v.mode === 'off') {
        const s = hx(v.seg, 'Segment', 0xffff), o = p - s * 16;
        if (o < 0 || o > 0xffff) return rows([['Offset', `<span class="t-bad">Not reachable: ${hex(p, 5)}h is outside segment ${hex(s, 4)}h (offset would be ${o})</span>`]]);
        return rows([['Offset = physical − segment × 10h', `${hex(p, 5)}h − ${hex(s * 16, 5)}h`], ['Offset', `<b>${hex(o, 4)}h</b>`]]);
      }
      const o = hx(v.off, 'Offset', 0xffff), d = p - o;
      if (d < 0 || d % 16) return rows([['Segment', `<span class="t-bad">No exact segment: (physical − offset) = ${d.toString(16).toUpperCase()}h is not a multiple of 10h</span>`]]);
      return rows([['Segment = (physical − offset) ÷ 10h', `(${hex(p, 5)}h − ${hex(o, 4)}h) ÷ 10h`], ['Segment', `<b>${hex(d / 16, 4)}h</b>`]]);
    });
  });

  // ---------- 7. Effective address ----------
  W.register('tool-ea', (el) => {
    const modes = ['[BX]', '[BP]', '[SI]', '[DI]', '[BX+SI]', '[BX+DI]', '[BP+SI]', '[BP+DI]', '[BX+disp]', '[BP+disp]', '[SI+disp]', '[DI+disp]', '[BX+SI+disp]', '[BX+DI+disp]', '[BP+SI+disp]', '[BP+DI+disp]', '[disp] (direct)'];
    const [form, out] = mount(el, `<div class="t-row">${select('Addressing mode', 'mode', modes, '[BX+SI+disp]')}${field('Displacement', 'disp', '4')}${select('Segment override', 'ovr', [['', 'none (default)'], ['DS', 'DS:'], ['ES', 'ES:'], ['SS', 'SS:'], ['CS', 'CS:']], '')}</div>
      <div class="t-row">${field('BX', 'BX', '0100h')}${field('BP', 'BP', '0FF0h')}${field('SI', 'SI', '0020h')}${field('DI', 'DI', '0030h')}${field('DS', 'DS', '2000h')}${field('SS', 'SS', '3000h')}${field('ES', 'ES', '4000h')}${field('CS', 'CS', '1000h')}</div>`);
    bind(el, form, out, (v) => {
      const parts = v.mode.replace(/ \(direct\)/, '').replace(/[[\]]/g, '').split('+');
      let ea = 0; const terms = [];
      parts.forEach((p) => {
        const val = p === 'disp' ? need(parseNum(v.disp), 'Displacement') : need(parseNum(v[p]), p);
        ea += val; terms.push(`${p === 'disp' ? 'disp' : p} (${hex(val & 0xffff, 4)}h)`);
      });
      ea &= 0xffff;
      const seg = v.ovr || (parts.includes('BP') ? 'SS' : 'DS');
      const sv = (need(parseNum(v[seg]), seg) >>> 0) & 0xffff, pa = (sv * 16 + ea) & 0xfffff;
      return rows([['EA', `${terms.join(' + ')} = <b>${hex(ea, 4)}h</b>`], ['Segment used', `${seg}${v.ovr ? ' (override)' : parts.includes('BP') ? ' (default for BP)' : ' (default)'} = ${hex(sv, 4)}h`], ['Physical address', `${hex(sv, 4)}h × 10h + ${hex(ea, 4)}h = <b>${hex(pa, 5)}h</b>`]]);
    });
  });

  // ---------- 8. IEEE 754 ----------
  W.register('tool-ieee', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${select('Convert', 'dir', [['d2h', 'Decimal → bits'], ['h2d', 'Hex bits → decimal']], 'd2h')}${select('Precision', 'p', [[32, 'single (32-bit)'], [64, 'double (64-bit)']], 32)}${field('Input', 'v', '-6.75')}</div>`);
    bind(el, form, out, (v) => {
      const b64 = +v.p === 64, buf = new DataView(new ArrayBuffer(8));
      let bitsStr, value;
      if (v.dir === 'd2h') {
        value = Number(v.v); if (v.v.trim() === '' || Number.isNaN(value) && !/nan/i.test(v.v)) throw new Error('Enter a decimal number such as -6.75, 0.1 or 1e-5.');
        if (b64) buf.setFloat64(0, value); else buf.setFloat32(0, value);
      } else {
        const hs = v.v.trim().replace(/^0x/i, '').replace(/h$/i, '');
        const len = b64 ? 16 : 8;
        if (!new RegExp(`^[0-9a-f]{1,${len}}$`, 'i').test(hs)) throw new Error(`Enter up to ${len} hex digits, e.g. ${b64 ? '401B000000000000' : 'C0D80000'}.`);
        const p = hs.padStart(len, '0');
        for (let i = 0; i < len / 2; i++) buf.setUint8(i, parseInt(p.slice(i * 2, i * 2 + 2), 16));
        value = b64 ? buf.getFloat64(0) : buf.getFloat32(0);
      }
      const nb = b64 ? 8 : 4;
      bitsStr = Array.from({ length: nb }, (_, i) => buf.getUint8(i).toString(2).padStart(8, '0')).join('');
      const eb = b64 ? 11 : 8, bias = b64 ? 1023 : 127;
      const S = bitsStr[0], E = bitsStr.slice(1, 1 + eb), F = bitsStr.slice(1 + eb);
      const e = parseInt(E, 2), hexStr = Array.from({ length: nb }, (_, i) => buf.getUint8(i).toString(16).padStart(2, '0')).join('').toUpperCase();
      const kind = e === 0 ? (/^0+$/.test(F) ? 'zero' : 'subnormal') : e === 2 ** eb - 1 ? (/^0+$/.test(F) ? 'infinity' : 'NaN') : 'normal';
      const stored = b64 ? value : Math.fround(value);
      return `<div class="t-ieee"><span class="s">${S}</span><span class="e">${E}</span><span class="f">${F}</span></div>` + rows([
        ['Hex', `<b>${hexStr}h</b>`], ['Sign', S === '1' ? '1 (negative)' : '0 (positive)'],
        ['Exponent', kind === 'normal' ? `${E}b = ${e} → ${e} − ${bias} = <b>${e - bias}</b>` : `${E}b (${kind})`],
        ['Type', kind], ['Value actually stored', `${stored}`],
      ]);
    });
  });

  // ---------- 9. ASCII ----------
  W.register('tool-ascii', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${select('Convert', 'dir', [['t2c', 'Text → codes'], ['c2t', 'Hex codes → text']], 't2c')}${field('Input', 'v', 'COAL', 'class="t-wide"')}</div><p class="t-hint">For codes, separate bytes with spaces: <code>48 65 6C 6C 6F</code>. Assembly strings end with <code>'$'</code> (24h) for DOS function 09h.</p>`);
    bind(el, form, out, (v) => {
      let codes;
      if (v.dir === 't2c') codes = [...v.v].map((c) => c.charCodeAt(0));
      else { codes = v.v.trim().split(/[\s,]+/).filter(Boolean).map((x) => parseInt(x.replace(/h$/i, ''), 16)); if (codes.some((c) => Number.isNaN(c) || c > 255)) throw new Error('Enter hex bytes 00–FF separated by spaces.'); }
      if (!codes.length) return '';
      if (codes.length > 64) codes = codes.slice(0, 64);
      const name = (c) => ({ 0: 'NUL', 9: 'TAB', 10: 'LF', 13: 'CR', 27: 'ESC', 32: 'space' }[c] || (c < 32 || c === 127 ? 'ctrl' : c > 127 ? 'ext.' : esc(String.fromCharCode(c))));
      const tbl = `<table class="t-table"><thead><tr><th>Char</th><th>Dec</th><th>Hex</th><th>Binary</th></tr></thead><tbody>${codes.map((c) => `<tr><td>${name(c)}</td><td>${c}</td><td class="mono">${hex(c, 2)}h</td><td class="mono">${bin(c, 8)}</td></tr>`).join('')}</tbody></table>`;
      const db = `db ${codes.map((c) => (c >= 32 && c < 127 && c !== 39 ? null : c)).every((x) => x === null) ? `'${String.fromCharCode(...codes)}'` : codes.map((c) => hex(c, 2) + 'h').join(', ')}`;
      return rows([['As text', esc(String.fromCharCode(...codes))], ['As assembly', `<code>${esc(db)}</code>`]]) + tbl;
    });
  });

  // ---------- 10. Address bus & memory size ----------
  W.register('tool-memory', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${select('Find', 'mode', [['size', 'Memory size from address lines'], ['lines', 'Address lines from memory size']], 'size')}${field('Address lines', 'n', '20', 'inputmode="numeric"')}${field('Memory size', 'm', '64')}${select('Unit', 'u', [['B', 'bytes'], ['KB', 'KB'], ['MB', 'MB'], ['GB', 'GB']], 'KB')}</div>`);
    const fmt = (b) => (b >= 2 ** 30 ? `${b / 2 ** 30} GB` : b >= 2 ** 20 ? `${b / 2 ** 20} MB` : b >= 1024 ? `${b / 1024} KB` : `${b} bytes`);
    bind(el, form, out, (v) => {
      if (v.mode === 'size') {
        const n = need(parseNum(v.n), 'Address lines');
        if (n < 1 || n > 48) throw new Error('Use 1–48 address lines.');
        const bytes = 2 ** n;
        return rows([['Addressable locations', `2^${n} = <b>${bytes.toLocaleString('en-US')}</b>`], ['Memory size', `<b>${fmt(bytes)}</b>`], ['Address range', `${'0'.padStart(Math.ceil(n / 4), '0')}h … ${(bytes - 1).toString(16).toUpperCase()}h`], ['Examples', '8085: 16 lines → 64 KB · 8086: 20 → 1 MB · 80286: 24 → 16 MB · 80386: 32 → 4 GB']]);
      }
      const m = need(parseNum(v.m), 'Memory size'), mult = { B: 1, KB: 1024, MB: 2 ** 20, GB: 2 ** 30 }[v.u], bytes = m * mult;
      if (bytes <= 0) throw new Error('Memory size must be positive.');
      const n = Math.ceil(Math.log2(bytes));
      return rows([['Address lines needed', `log₂(${bytes.toLocaleString('en-US')}) → <b>${n}</b>`], ['Exact power of two?', 2 ** n === bytes ? 'yes' : `no — ${n} lines address ${fmt(2 ** n)}`]]);
    });
  });

  // ---------- 11. Cache address split ----------
  W.register('tool-cache', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Address bits', 'a', '16', 'inputmode="numeric"')}${field('Cache size (bytes)', 'c', '4096')}${field('Block size (bytes)', 'b', '16')}${select('Mapping', 'k', [[1, 'direct-mapped'], [2, '2-way set-associative'], [4, '4-way'], [8, '8-way'], [0, 'fully associative']], 1)}${field('Address (hex)', 'x', '3A7C')}</div>`);
    const lg = (x, name) => { const l = Math.log2(x); if (!Number.isInteger(l) || x < 1) throw new Error(`${name} must be a power of two.`); return l; };
    bind(el, form, out, (v) => {
      const A = need(parseNum(v.a), 'Address bits'), C = need(parseNum(v.c), 'Cache size'), B = need(parseNum(v.b), 'Block size'), k = +v.k;
      if (A < 4 || A > 32) throw new Error('Address bits: 4–32.');
      const ob = lg(B, 'Block size'), lines = C / B; lg(C, 'Cache size');
      if (lines < 1) throw new Error('Cache must hold at least one block.');
      const sets = k === 0 ? 1 : lines / k;
      if (!Number.isInteger(sets) || sets < 1) throw new Error('Associativity is larger than the number of lines.');
      const ib = lg(sets, 'Number of sets'), tb = A - ib - ob;
      if (tb < 0) throw new Error('Cache is larger than the address space.');
      const x = parseInt(String(v.x).replace(/h$/i, ''), 16);
      if (Number.isNaN(x) || x >= 2 ** A) throw new Error(`Address must be a hex value below ${(2 ** A).toString(16).toUpperCase()}h.`);
      const s = x.toString(2).padStart(A, '0');
      const tag = s.slice(0, tb), idx = s.slice(tb, tb + ib), off = s.slice(tb + ib);
      const val = (b) => (b ? parseInt(b, 2) : 0);
      return `<div class="t-ieee t-cache">${tb ? `<span class="s">${tag}</span>` : ''}${ib ? `<span class="e">${idx}</span>` : ''}<span class="f">${off}</span></div>` + rows([
        ['Lines / sets', `${lines} lines · ${sets} set${sets > 1 ? 's' : ''}${k > 1 ? ` of ${k}` : ''}`],
        ['Tag', `${tb} bits = ${val(tag)} (${val(tag).toString(16).toUpperCase()}h)`],
        [k === 1 ? 'Line (index)' : 'Set (index)', ib ? `${ib} bits = ${val(idx)}` : 'none (fully associative)'],
        ['Offset', `${ob} bits = byte ${val(off)} of the block`],
      ]);
    });
  });
})();

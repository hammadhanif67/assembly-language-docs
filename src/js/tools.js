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

  // ---------- step-by-step helpers ----------
  const work = (items, title = 'Step-by-step working') => `<div class="t-work"><p class="t-work-h">${title}</p><ol>${items.filter(Boolean).map((s) => `<li>${s}</li>`).join('')}</ol></div>`;
  const fold = (title, body, open = false) => `<details class="t-fold"${open ? ' open' : ''}><summary>${title}</summary><div class="t-fold-b">${body}</div></details>`;
  const fmtN = (x) => {
    if (!Number.isFinite(x)) return String(x);
    if (x !== 0 && Math.abs(x) < 1e-4) return x.toExponential(4).replace('e', ' × 10^');
    if (Number.isInteger(x) && Math.abs(x) < 1e21) return x.toLocaleString('en-US');
    return Number(x.toPrecision(8)).toLocaleString('en-US', { maximumFractionDigits: 8 });
  };
  const pow = (b, e) => `${b}<sup>${e}</sup>`;
  const DIG = '0123456789ABCDEF';
  // repeated division: decimal → base
  function divTable(n, base) {
    if (n === 0) return `<p class="t-hint">0 in any base is 0.</p>`;
    const r = [];
    for (let x = n; x > 0; x = Math.floor(x / base)) r.push([x, Math.floor(x / base), x % base]);
    const digits = r.map((t) => DIG[t[2]]).reverse().join('');
    return `<table class="t-table"><thead><tr><th>Divide</th><th>Quotient</th><th>Remainder</th></tr></thead><tbody>${r.map(([x, q, m]) => `<tr><td class="mono">${fmtN(x)} ÷ ${base}</td><td class="mono">${fmtN(q)}</td><td class="mono"><b>${m}${base === 16 && m > 9 ? ` (${DIG[m]})` : ''}</b></td></tr>`).join('')}</tbody></table><p class="t-hint">Stop when the quotient is 0, then read the remainders from <b>bottom to top</b>: <code>${digits}</code></p>`;
  }
  // positional weights: base → decimal
  function weightSum(str, base) {
    const d = str.toUpperCase().split('');
    const terms = d.map((c, i) => [DIG.indexOf(c), d.length - 1 - i]);
    const shown = base === 2 ? terms.filter(([v]) => v) : terms;
    const sum = terms.reduce((s, [v, p]) => s + v * base ** p, 0);
    return `<p class="t-hint">Multiply each digit by its place value ${base}<sup>position</sup> (rightmost position = 0) and add${base === 2 ? ' — only the 1 bits count' : ''}:</p>
      <p class="t-math">${shown.map(([v, p]) => `${v}×${pow(base, p)}`).join(' + ') || '0'}</p>
      <p class="t-math">= ${shown.map(([v, p]) => fmtN(v * base ** p)).join(' + ') || '0'} = <b>${fmtN(sum)}</b></p>`;
  }
  // grouping bits (4 → hex, 3 → octal)
  function groupBits(binStr, size) {
    const pad = binStr.padStart(Math.ceil(binStr.length / size) * size, '0');
    const g = pad.match(new RegExp(`.{${size}}`, 'g'));
    return `<p class="t-hint">Split the bits into groups of ${size} from the right (pad the left with 0s), then replace each group by one ${size === 4 ? 'hex' : 'octal'} digit:</p>
      <table class="t-table"><thead><tr><th>Group</th>${g.map((x) => `<td class="mono">${x}</td>`).join('')}</tr></thead><tbody><tr><th>Digit</th>${g.map((x) => `<td class="mono"><b>${DIG[parseInt(x, 2)]}</b></td>`).join('')}</tr></tbody></table>`;
  }
  // each hex digit → 4 bits
  function expandHex(hs) {
    const d = hs.toUpperCase().split('');
    return `<p class="t-hint">Replace every hex digit by its 4-bit pattern (8 4 2 1):</p>
      <table class="t-table"><thead><tr><th>Hex</th>${d.map((x) => `<td class="mono">${x}</td>`).join('')}</tr></thead><tbody><tr><th>Bits</th>${d.map((x) => `<td class="mono"><b>${parseInt(x, 16).toString(2).padStart(4, '0')}</b></td>`).join('')}</tr></tbody></table>`;
  }

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
      // working: from the base the value was typed in, to the others
      const raw = v.v.trim(), u = n >>> 0, bs = u.toString(2), hs = u.toString(16).toUpperCase();
      const src = /^0x|h$/i.test(raw) ? 16 : /^[01]+b$/i.test(raw) ? 2 : /^[0-7]+o$/i.test(raw) ? 8 : /^'.'$/.test(raw) ? 'c' : 10;
      let wk = raw.startsWith('-') ? `<p class="t-hint">Negative input: the working below uses the stored ${bits}-bit pattern (${fmtN(u)}). Tool 02 shows how that pattern is formed.</p>` : '';
      if (src === 'c') wk += `<p class="t-hint">${esc(raw)} is stored as its ASCII code <b>${u}</b>.</p>`;
      if (src === 10 || src === 'c') wk += fold(`Decimal ${fmtN(u)} → binary: divide by 2`, divTable(u, 2), true) + fold('Decimal → hexadecimal: divide by 16', divTable(u, 16)) + fold('Decimal → octal: divide by 8', divTable(u, 8)) + fold('Check: binary → decimal', weightSum(bs, 2));
      if (src === 2) wk += fold('Binary → decimal: add the place values', weightSum(bs, 2), true) + fold('Binary → hexadecimal: groups of 4 bits', groupBits(bs, 4)) + fold('Binary → octal: groups of 3 bits', groupBits(bs, 3));
      if (src === 16) wk += fold('Hexadecimal → decimal: add the place values', weightSum(hs, 16), true) + fold('Hexadecimal → binary: 4 bits per digit', expandHex(hs)) + fold('Binary → octal: groups of 3 bits', groupBits(bs, 3));
      if (src === 8) wk += fold('Octal → decimal: add the place values', weightSum(u.toString(8), 8), true) + fold('Octal → binary: 3 bits per digit', groupBits(bs, 3)) + fold('Binary → hexadecimal: groups of 4 bits', groupBits(bs, 4));
      return `<div class="t-bits" style="--n:${Math.min(bits, 16)}">${cells}</div>` + rows([
        ['Unsigned decimal', n >>> 0], ['Signed decimal', toSigned(n, bits)], ['Hexadecimal', hex(n, bits / 4) + 'h'],
        ['Binary', bin(n, bits) + 'b'], ['Octal', (n >>> 0).toString(8) + 'o'], ['ASCII (low byte)', esc(String.fromCharCode(n & 0xff)).trim() && (n & 0xff) >= 32 && (n & 0xff) < 127 ? `'${esc(String.fromCharCode(n & 0xff))}'` : '—'],
      ]) + `<div class="t-work"><p class="t-work-h">Step-by-step working</p>${wk}</div>`;
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
      if (n >= 0) return rows([['Positive — stored as is', bin(abs, bits)], ['Hex', hex(res, bits / 4) + 'h'], ['Signed range', `${lo} … ${hi}`]]) + work([`A positive number (sign bit 0) is simply converted to binary: ${fmtN(abs)} = ${bin(abs, bits)}`, `Range for ${bits} bits: −2<sup>${bits - 1}</sup> … 2<sup>${bits - 1}</sup> − 1 = ${lo} … ${hi}`]);
      const inv = (~abs >>> 0) & m;
      return rows([
        [`1. |${n}| in binary`, bin(abs, bits)], ['2. Invert every bit', bin(inv, bits)], ['3. Add 1', `<b>${bin(res, bits)}</b>`],
        ['Result (hex)', `<b>${hex(res, bits / 4)}h</b>`], ['Same bits read unsigned', res >>> 0], ['Signed range', `${lo} … ${hi}`],
      ]) + work([
        `Write |${n}| = ${abs} in ${bits}-bit binary: <span class="t-math">${bin(abs, bits)}</span>`,
        `One's complement — flip every 0 to 1 and 1 to 0: <span class="t-math">${bin(inv, bits)}</span>`,
        `Add 1: <span class="t-math">${bin(inv, bits)} + 1 = <b>${bin(res, bits)}</b></span>`,
        `Shortcut formula: 2<sup>${bits}</sup> − |x| = ${fmtN(2 ** bits)} − ${abs} = <b>${fmtN(res >>> 0)}</b> = ${hex(res, bits / 4)}h`,
        `Check: the sign bit (leftmost) is 1, so the number is negative. Reading it back: −2<sup>${bits - 1}</sup> + ${fmtN((res >>> 0) - 2 ** (bits - 1))} = ${n} ✓`,
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
      // working: column layout of the operation, then the reason for every flag
      const B2 = op === 'NEG' ? a : op === 'INC' || op === 'DEC' ? 1 : b;
      const sym = { ADD: '+', ADC: '+', INC: '+', SUB: '−', SBB: '−', CMP: '−', DEC: '−', NEG: '−', AND: 'AND', TEST: 'AND', OR: 'OR', XOR: 'XOR' }[op];
      const A2 = op === 'NEG' ? 0 : a;
      const col = `<pre class="t-col">  ${bin(A2, bits)}   ${hex(A2, d)}h   (${A2})\n${sym.padEnd(2)}${bin(B2, bits)}   ${hex(B2, d)}h   (${B2})${(op === 'ADC' || op === 'SBB') && cf ? `\n${sym} ${'1'.padStart(bits + Math.floor((bits - 1) / 4))}   CF` : ''}\n${'─'.repeat(bits + Math.floor((bits - 1) / 4) + 2)}\n= ${bin(R, bits)}   ${hex(R, d)}h   (${R})${r > m || r < 0 ? `   ← the true result ${r} does not fit in ${bits} bits` : ''}</pre>`;
      const arith = ['ADD', 'ADC', 'SUB', 'SBB', 'CMP', 'INC', 'DEC', 'NEG'].includes(op);
      const ones = R.toString(2).slice(-8).split('').filter((x) => x === '1').length + (bits > 8 ? 0 : 0);
      const ls = (x) => toSigned(x, bits), lo = -(2 ** (bits - 1)), hi = 2 ** (bits - 1) - 1;
      const trueSigned = { ADD: ls(a) + ls(b), ADC: ls(a) + ls(b) + (cf ? 1 : 0), INC: ls(a) + 1, SUB: ls(a) - ls(b), SBB: ls(a) - ls(b) - (cf ? 1 : 0), CMP: ls(a) - ls(b), DEC: ls(a) - 1, NEG: -ls(a) }[op];
      const reasons = [
        arith && op !== 'INC' && op !== 'DEC' ? `<b>CF = ${f.CF ? 1 : 0}</b> — unsigned: ${['ADD', 'ADC'].includes(op) ? `${a} + ${b}${op === 'ADC' && cf ? ' + 1' : ''} = ${r} ${r > m ? `&gt; ${m}, a carry leaves the top bit` : `≤ ${m}, no carry`}` : op === 'NEG' ? `NEG sets CF unless the operand is 0` : `${a} ${a < b + (op === 'SBB' && cf ? 1 : 0) ? '&lt;' : '≥'} ${b}${op === 'SBB' && cf ? ' + 1' : ''} → ${r < 0 ? 'a borrow is needed' : 'no borrow'}`}` : `<b>CF = ${f.CF ? 1 : 0}</b> — ${op === 'INC' || op === 'DEC' ? 'unchanged by INC/DEC' : 'logic instructions always clear CF'}`,
        `<b>ZF = ${f.ZF ? 1 : 0}</b> — the ${bits}-bit result ${R === 0 ? 'is' : 'is not'} zero`,
        `<b>SF = ${f.SF ? 1 : 0}</b> — copy of the top bit (bit ${bits - 1}) of the result`,
        arith ? `<b>OF = ${f.OF ? 1 : 0}</b> — signed: ${trueSigned} ${trueSigned < lo || trueSigned > hi ? `is outside ${lo} … ${hi}, so the signed result is wrong` : `fits in ${lo} … ${hi}`}` : `<b>OF = 0</b> — logic instructions always clear OF`,
        `<b>PF = ${f.PF ? 1 : 0}</b> — the low byte ${bin(R & 0xff, 8)} has ${ones} one-bit${ones === 1 ? '' : 's'} (${ones % 2 ? 'odd' : 'even'})`,
        arith ? `<b>AF = ${f.AF ? 1 : 0}</b> — low nibbles ${hex(A2 & 0xf, 1)}h ${sym} ${hex(B2 & 0xf, 1)}h ${f.AF ? (sym === '+' ? 'carry out of bit 3' : 'borrow into bit 3') : 'no carry/borrow at bit 3'}` : `<b>AF</b> — undefined after logic instructions`,
      ];
      return rows([
        ['Operation', unary ? `${op} ${hex(a, d)}h` : `${op} ${hex(a, d)}h, ${hex(b, d)}h`],
        ['Result', `<b>${hex(R, d)}h</b>${kept}`], ['Binary', bin(R, bits)], ['Unsigned / signed', `${R} / ${toSigned(R, bits)}`],
      ]) + `<div class="t-flags">${chips}</div>${unchangedCF}` + `<div class="t-work"><p class="t-work-h">Step-by-step working</p>${col}<ol>${reasons.map((x) => `<li>${x}</li>`).join('')}</ol></div>`;
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
      const x0 = steps[0][1], rule = {
        SHL: `Shifting left by ${count} multiplies an unsigned number by 2<sup>${count}</sup>: ${x0} × ${2 ** count} = ${x0 * 2 ** count}${x0 * 2 ** count > m ? ` → only the low ${bits} bits are kept = ${x}` : ''}`,
        SHR: `Shifting right by ${count} divides an unsigned number by 2<sup>${count}</sup> (remainder dropped): ${x0} ÷ ${2 ** count} = ${Math.floor(x0 / 2 ** count)}`,
        SAR: `SAR keeps the sign bit, so it divides a signed number by 2<sup>${count}</sup> rounding down: ${toSigned(x0, bits)} ÷ ${2 ** count} → ${Math.floor(toSigned(x0, bits) / 2 ** count)}`,
        ROL: 'Rotate: the bit leaving on the left re-enters on the right and is also copied to CF; nothing is lost.',
        ROR: 'Rotate: the bit leaving on the right re-enters on the left and is also copied to CF; nothing is lost.',
        RCL: `Rotate through carry: CF acts as a ${bits + 1}th bit — the top bit goes to CF and the old CF enters bit 0.`,
        RCR: `Rotate through carry: CF acts as a ${bits + 1}th bit — bit 0 goes to CF and the old CF enters the top bit.`,
      }[v.op === 'SAL' ? 'SHL' : v.op];
      return rows([['Result', `<b>${hex(x, bits / 4)}h</b> = ${x} unsigned, ${toSigned(x, bits)} signed`], ['CF after', cf]]) + work([rule, 'The table shows every single-bit step; CF holds the last bit shifted out.']) + table;
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
          return rows([['Computes', `AL × operand = ${a} × ${sv}`], ['AX', `<b>${hex(P, 4)}h</b> = ${p}`], ['CF = OF', `${of ? 1 : 0} (${of ? 'AH holds significant bits' : 'result fits in AL'})`]]) + work([
            `A byte ${v.op} always uses AL as the other factor: AL = ${hex(AX & 0xff, 2)}h = ${a}${signed ? ' (signed)' : ''}`,
            `Multiply: ${a} × ${sv} = <b>${p}</b>`,
            `The 16-bit product goes to AX: ${p} = ${hex(P, 4)}h → AH = ${hex(P >> 8, 2)}h, AL = ${hex(P & 0xff, 2)}h`,
            `CF = OF = ${of ? 1 : 0}: ${of ? 'AH is needed to hold the product' : signed ? 'AH is only the sign extension of AL' : 'AH = 0, the product fits in AL'}`,
          ]);
        }
        const a = signed ? toSigned(AX, 16) : AX, p = BigInt(a) * BigInt(sv), P = Number(BigInt.asUintN(32, p));
        const of = signed ? Number(BigInt.asIntN(32, p)) !== toSigned(P & 0xffff, 16) : (P >>> 16) !== 0;
        return rows([['Computes', `AX × operand = ${a} × ${sv}`], ['DX', `<b>${hex(P >>> 16, 4)}h</b>`], ['AX', `<b>${hex(P & 0xffff, 4)}h</b>`], ['DX:AX', `${p}`], ['CF = OF', `${of ? 1 : 0} (${of ? 'DX holds significant bits' : 'result fits in AX'})`]]) + work([
          `A word ${v.op} uses AX as the other factor: AX = ${hex(AX, 4)}h = ${a}`,
          `Multiply: ${a} × ${sv} = <b>${p}</b> = ${hex(P, 8)}h (32 bits)`,
          `High word → DX = ${hex(P >>> 16, 4)}h, low word → AX = ${hex(P & 0xffff, 4)}h`,
          `CF = OF = ${of ? 1 : 0}`,
        ]);
      }
      if (sv === 0) return rows([['Result', '<span class="t-bad">Divide error — INT 0 (division by zero)</span>']]);
      const dividend = bits === 8 ? (signed ? toSigned(AX, 16) : AX) : (signed ? toSigned(((DX << 16) | AX) >>> 0, 32) : ((DX << 16) | AX) >>> 0);
      const q = Math.trunc(dividend / sv), r = dividend - q * sv;
      const qmax = signed ? 2 ** (bits - 1) - 1 : mask(bits), qmin = signed ? -(2 ** (bits - 1)) : 0;
      if (q > qmax || q < qmin) return rows([['Computes', `${dividend} ÷ ${sv} = ${q}`], ['Result', `<span class="t-bad">Divide overflow — quotient does not fit in ${bits === 8 ? 'AL' : 'AX'} (INT 0)</span>`]]);
      const qn = q & mask(bits), rn = r & mask(bits);
      const dwork = work([
        `Dividend: ${bits === 8 ? `AX = ${hex(AX, 4)}h` : `DX:AX = ${hex(DX, 4)}:${hex(AX, 4)}h`} = ${dividend}`,
        `Quotient = ${dividend} ÷ ${sv} = <b>${q}</b> (${signed ? 'rounded toward zero' : 'whole part only'})`,
        `Remainder = ${dividend} − ${q} × ${sv} = <b>${r}</b>`,
        `Check the quotient fits in ${bits === 8 ? 'AL' : 'AX'} (${qmin} … ${qmax}): yes`,
        `${bits === 8 ? 'AL' : 'AX'} ← quotient ${bits === 8 ? hex(qn, 2) : hex(qn, 4)}h, ${bits === 8 ? 'AH' : 'DX'} ← remainder ${bits === 8 ? hex(rn, 2) : hex(rn, 4)}h`,
      ]);
      return (bits === 8
        ? rows([['Computes', `AX ÷ operand = ${dividend} ÷ ${sv}`], ['AL (quotient)', `<b>${hex(qn, 2)}h</b> = ${q}`], ['AH (remainder)', `<b>${hex(rn, 2)}h</b> = ${r}`]])
        : rows([['Computes', `DX:AX ÷ operand = ${dividend} ÷ ${sv}`], ['AX (quotient)', `<b>${hex(qn, 4)}h</b> = ${q}`], ['DX (remainder)', `<b>${hex(rn, 4)}h</b> = ${r}`]])) + dwork;
    });
  });

  // ---------- 6. Segment : offset ----------
  W.register('tool-segoff', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${select('Find', 'mode', [['pa', 'Physical address'], ['off', 'Offset'], ['seg', 'Segment']], 'pa')}${field('Segment (hex)', 'seg', '40FF')}${field('Offset (hex)', 'off', '938B')}${field('Physical (hex)', 'pa', '4A37B')}</div><p class="t-hint">Physical address = segment × 10h + offset. Fill the two values you know.</p>`);
    const hx = (s, name, max) => { const v = parseInt(String(s).trim().replace(/h$/i, ''), 16); if (!/^[0-9a-f]+h?$/i.test(String(s).trim()) || v > max) throw new Error(`${name}: enter up to ${max.toString(16).length} hex digits.`); return v; };
    bind(el, form, out, (v) => {
      if (v.mode === 'pa') {
        const s = hx(v.seg, 'Segment', 0xffff), o = hx(v.off, 'Offset', 0xffff), p = s * 16 + o;
        return rows([['Logical address', `${hex(s, 4)}:${hex(o, 4)}`], ['Segment × 10h', `${hex(s * 16, 5)}h`], ['+ Offset', `${hex(o, 4)}h`], ['Physical address', `<b>${hex(p & 0xfffff, 5)}h</b>${p > 0xfffff ? ' <em>(wrapped past 1 MB)</em>' : ''}`]]) + work([
          'Formula: Physical address = Segment × 10h + Offset (20-bit result)',
          `Segment × 10h = shift left one hex digit, i.e. write a 0 on the right: ${hex(s, 4)}h → <b>${hex(s * 16, 5)}h</b>`,
          `Add the offset (line up the digits on the right):<pre class="t-col">  ${hex(s * 16, 5)}h\n+  ${hex(o, 4)}h\n───────\n  ${hex(p & 0xfffff, 5)}h</pre>`,
          `In decimal: ${s} × 16 + ${o} = ${p}${p > 0xfffff ? ` → above FFFFFh, the 8086 drops the 21st bit` : ''}`,
        ]);
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
      return rows([['EA', `${terms.join(' + ')} = <b>${hex(ea, 4)}h</b>`], ['Segment used', `${seg}${v.ovr ? ' (override)' : parts.includes('BP') ? ' (default for BP)' : ' (default)'} = ${hex(sv, 4)}h`], ['Physical address', `${hex(sv, 4)}h × 10h + ${hex(ea, 4)}h = <b>${hex(pa, 5)}h</b>`]]) + work([
        `Read the operand ${v.mode}: EA = ${parts.join(' + ')}`,
        `Substitute the values: EA = ${terms.join(' + ')} = <b>${hex(ea, 4)}h</b> (kept to 16 bits)`,
        `Choose the segment: ${v.ovr ? `the override ${seg}: wins` : parts.includes('BP') ? 'BP in the address → SS is the default segment' : 'no BP → DS is the default segment'}`,
        `Physical address = ${seg} × 10h + EA = ${hex(sv * 16, 5)}h + ${hex(ea, 4)}h = <b>${hex(pa, 5)}h</b>`,
      ]);
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
      let iw = '';
      if (kind === 'normal') {
        const e2 = e - bias, fb = F.length, mant = Math.abs(stored) / 2 ** e2, Ft = F.replace(/0+$/, '') || '0';
        const groups = bitsStr.match(/.{4}/g);
        const assemble = `Join sign | exponent | fraction and read 4 bits at a time as hex: <span class="t-math">${groups.join(' ')}</span> → <b>${hexStr}h</b>`;
        if (v.dir === 'd2h') {
          const ax = Math.abs(value), ip = Math.floor(ax); let fr = ax - ip; const tr = [];
          for (let i = 0; i < 12 && fr > 0; i++) { const t = fr * 2; tr.push([fr, t, Math.floor(t)]); fr = t - Math.floor(t); }
          const fs = tr.map((x) => x[2]).join('');
          iw = work([
            `Sign: ${value < 0 ? 'the number is negative → S = <b>1</b>' : 'the number is positive → S = <b>0</b>'}`,
            `Integer part ${ip} → binary (divide by 2): <b>${ip.toString(2)}</b>`,
            tr.length ? `Fraction part ${fmtN(ax - ip)} → binary: multiply by 2 and take the integer digit each time${fold('Show the ×2 table', `<table class="t-table"><thead><tr><th>Fraction × 2</th><th>Result</th><th>Bit</th></tr></thead><tbody>${tr.map(([a, t, d]) => `<tr><td class="mono">${fmtN(a)} × 2</td><td class="mono">${fmtN(t)}</td><td class="mono"><b>${d}</b></td></tr>`).join('')}</tbody></table>${fr > 0 ? '<p class="t-hint">The fraction does not end — it repeats, so it is rounded to fit the fraction field.</p>' : ''}`)}→ <b>.${fs}${fr > 0 ? '…' : ''}</b>` : 'No fraction part.',
            `Together: <span class="t-math">${ip.toString(2)}.${fs || '0'}${fr > 0 ? '…' : ''}</span>`,
            `Normalise — move the binary point so a single 1 is left of it: <span class="t-math">1.${Ft.slice(0, 24)}${Ft.length > 24 ? '…' : ''} × 2<sup>${e2}</sup></span>`,
            `Biased exponent = ${e2} + ${bias} = ${e} = <b>${E}</b>b (${eb} bits)`,
            `Fraction field = the bits after the leading 1, padded with 0s to ${fb} bits: <span class="t-math">${F.slice(0, 32)}${fb > 32 ? '…' : ''}</span>`,
            assemble,
          ], 'Step-by-step working · decimal → IEEE 754');
        } else {
          iw = work([
            `Split the ${b64 ? 64 : 32} bits: S = ${S}, E = ${E}b, F = ${F.slice(0, 32)}${fb > 32 ? '…' : ''}`,
            `Exponent: E − bias = ${e} − ${bias} = <b>${e2}</b>`,
            `Significand: 1.F = 1.${Ft.slice(0, 24)}${Ft.length > 24 ? '…' : ''}b = <b>${fmtN(mant)}</b>`,
            `Value = (−1)<sup>S</sup> × 1.F × 2<sup>E − bias</sup> = ${S === '1' ? '−' : '+'}${fmtN(mant)} × 2<sup>${e2}</sup> = <b>${fmtN(stored)}</b>`,
          ], 'Step-by-step working · IEEE 754 → decimal');
        }
      }
      return `<div class="t-ieee"><span class="s">${S}</span><span class="e">${E}</span><span class="f">${F}</span></div>` + rows([
        ['Hex', `<b>${hexStr}h</b>`], ['Sign', S === '1' ? '1 (negative)' : '0 (positive)'],
        ['Exponent', kind === 'normal' ? `${E}b = ${e} → ${e} − ${bias} = <b>${e - bias}</b>` : `${E}b (${kind})`],
        ['Type', kind], ['Value actually stored', `${stored}`],
      ]) + iw;
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
        const ladder = [];
        let val = bytes, u = 0; const names = ['bytes', 'KB', 'MB', 'GB', 'TB'];
        while (val >= 1024 && u < 4) { ladder.push(`${fmtN(val)} ${names[u]} ÷ 1024 = <b>${fmtN(val / 1024)} ${names[u + 1]}</b>`); val /= 1024; u++; }
        return rows([['Addressable locations', `2^${n} = <b>${bytes.toLocaleString('en-US')}</b>`], ['Memory size', `<b>${fmt(bytes)}</b>`], ['Address range', `${'0'.padStart(Math.ceil(n / 4), '0')}h … ${(bytes - 1).toString(16).toUpperCase()}h`], ['Examples', '8085: 16 lines → 64 KB · 8086: 20 → 1 MB · 80286: 24 → 16 MB · 80386: 32 → 4 GB']]) + work([
          `Each address line carries one bit, so n lines give 2<sup>n</sup> different addresses: 2<sup>${n}</sup> = <b>${fmtN(bytes)}</b> locations`,
          'With one byte per location (byte-addressable memory) that is the same number of bytes.',
          ...ladder,
          `Shortcut: 2<sup>10</sup> = 1 K, 2<sup>20</sup> = 1 M, 2<sup>30</sup> = 1 G → 2<sup>${n}</sup> = 2<sup>${n % 10}</sup> × 2<sup>${n - (n % 10)}</sup> = ${2 ** (n % 10)} ${['', 'K', 'M', 'G', 'T'][Math.floor(n / 10)] || ''}B`,
          `Highest address = 2<sup>${n}</sup> − 1 = ${(bytes - 1).toString(16).toUpperCase()}h (all ${n} bits = 1)`,
        ]);
      }
      const m = need(parseNum(v.m), 'Memory size'), mult = { B: 1, KB: 1024, MB: 2 ** 20, GB: 2 ** 30 }[v.u], bytes = m * mult;
      if (bytes <= 0) throw new Error('Memory size must be positive.');
      const n = Math.ceil(Math.log2(bytes));
      return rows([['Address lines needed', `log₂(${bytes.toLocaleString('en-US')}) → <b>${n}</b>`], ['Exact power of two?', 2 ** n === bytes ? 'yes' : `no — ${n} lines address ${fmt(2 ** n)}`]]) + work([
        `Convert the size to bytes: ${fmtN(m)} ${v.u} × ${fmtN(mult)} = <b>${fmtN(bytes)} bytes</b>`,
        `Find n with 2<sup>n</sup> ≥ ${fmtN(bytes)}: n = log₂(${fmtN(bytes)}) = ${fmtN(Math.log2(bytes))}${Number.isInteger(Math.log2(bytes)) ? '' : ` → round up to ${n}`}`,
        `Answer: <b>${n} address lines</b> (2<sup>${n}</sup> = ${fmtN(2 ** n)})`,
      ]);
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
      ]) + work([
        `Offset bits = log₂(block size) = log₂(${B}) = <b>${ob}</b>`,
        `Number of lines = cache size ÷ block size = ${C} ÷ ${B} = <b>${lines}</b>`,
        k === 0 ? 'Fully associative: one set, so there are no index bits' : `Number of sets = lines ÷ ways = ${lines} ÷ ${k} = <b>${sets}</b> → ${k === 1 ? 'line' : 'set'} bits = log₂(${sets}) = <b>${ib}</b>`,
        `Tag bits = address bits − ${k === 0 ? '' : 'index − '}offset = ${A} − ${k === 0 ? '' : `${ib} − `}${ob} = <b>${tb}</b>`,
        `Write the address ${x.toString(16).toUpperCase()}h in ${A} bits and cut it: <span class="t-math">${tag || '—'} | ${idx || '—'} | ${off}</span> (tag | ${k === 1 ? 'line' : 'set'} | offset)`,
        `So the block goes to ${k === 0 ? 'any line' : `${k === 1 ? 'line' : 'set'} ${val(idx)}`}; the cache stores tag ${val(tag).toString(16).toUpperCase()}h to recognise it later.`,
      ]);
    });
  });
  // ---------- 12. Data units: bit, byte, KB … TB ----------
  const UNITS = [['bit', 'bit'], ['nibble', 'nibble (4 bits)'], ['B', 'byte (8 bits)'], ['KB', 'KB'], ['MB', 'MB'], ['GB', 'GB'], ['TB', 'TB'], ['PB', 'PB']];
  const unitBits = (u, base) => ({ bit: 1, nibble: 4, B: 8 }[u] || 8 * base ** ['KB', 'MB', 'GB', 'TB', 'PB'].indexOf(u) * base);
  const posNum = (s, name) => { const x = Number(String(s).replace(/,/g, '').trim()); if (String(s).trim() === '' || !Number.isFinite(x) || x < 0) throw new Error(`${name}: enter a positive number.`); return x; };
  W.register('tool-units', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Value', 'v', '2')}${select('From', 'f', UNITS, 'GB')}${select('To', 't', UNITS, 'bit')}${select('Standard', 's', [[1024, 'binary — 1 KB = 1024 B (memory)'], [1000, 'decimal — 1 KB = 1000 B (disks, networks)']], 1024)}</div><p class="t-hint">Memory sizes use powers of two (1 KB = 2<sup>10</sup> = 1024 bytes; IEC name KiB). Disk makers and network speeds use powers of ten (1 KB = 1000 bytes).</p>`);
    bind(el, form, out, (v) => {
      const x = posNum(v.v, 'Value'), base = +v.s, order = UNITS.map((u) => u[0]);
      const fromBits = x * unitBits(v.f, base), res = fromBits / unitBits(v.t, base);
      // ladder of single steps from the source unit to the target unit
      const i = order.indexOf(v.f), j = order.indexOf(v.t), steps = [];
      let cur = x;
      // the nibble is only a stop on the ladder when it is the source or the target
      const skip = (k) => order[k] === 'nibble' && v.f !== 'nibble' && v.t !== 'nibble';
      if (i !== j) {
        const dir = j > i ? 1 : -1;
        let a = i;
        for (let k = i + dir; dir > 0 ? k <= j : k >= j; k += dir) {
          if (skip(k)) continue;
          if (dir < 0) { // to a smaller unit: multiply
            const m = unitBits(order[a], base) / unitBits(order[k], base);
            steps.push(`${fmtN(cur)} ${order[a]} × ${fmtN(m)} = <b>${fmtN(cur * m)} ${order[k]}</b> <em>(1 ${order[a]} = ${fmtN(m)} ${order[k]})</em>`); cur *= m;
          } else { // to a bigger unit: divide
            const m = unitBits(order[k], base) / unitBits(order[a], base);
            steps.push(`${fmtN(cur)} ${order[a]} ÷ ${fmtN(m)} = <b>${fmtN(cur / m)} ${order[k]}</b> <em>(1 ${order[k]} = ${fmtN(m)} ${order[a]})</em>`); cur /= m;
          }
          a = k;
        }
      }
      const rule = j < i ? 'Going to a <b>smaller</b> unit → <b>multiply</b>.' : j > i ? 'Going to a <b>bigger</b> unit → <b>divide</b>.' : 'Same unit.';
      const all = order.map((u) => [u, fromBits / unitBits(u, base)]);
      const tbl = `<table class="t-table"><thead><tr><th>Unit</th><th>Value</th><th>Size of 1 unit</th></tr></thead><tbody>${all.map(([u, val]) => `<tr${u === v.t ? ' class="t-hl"' : ''}><td>${u}</td><td class="mono">${fmtN(val)}</td><td class="mono">${u === 'bit' ? '1 bit' : u === 'nibble' ? '4 bits' : u === 'B' ? '8 bits' : `${base === 1024 ? pow(2, 10 * (order.indexOf(u) - 2)) : pow(10, 3 * (order.indexOf(u) - 2))} = ${fmtN(unitBits(u, base) / 8)} B`}</td></tr>`).join('')}</tbody></table>`;
      return rows([['Answer', `${fmtN(x)} ${v.f} = <b>${fmtN(res)} ${v.t}</b>`], ['In one step', `${fmtN(x)} × ${fmtN(unitBits(v.f, base))} bits ÷ ${fmtN(unitBits(v.t, base))} bits`]])
        + work([rule, ...steps]) + tbl;
    });
  });

  // ---------- 13. Transfer / download time ----------
  W.register('tool-transfer', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('File size', 'v', '700')}${select('Unit', 'u', UNITS.slice(2), 'MB')}${field('Speed', 'r', '8')}${select('Speed unit', 'ru', [['1', 'bps (bits/s)'], ['1e3', 'Kbps'], ['1e6', 'Mbps'], ['1e9', 'Gbps'], ['8', 'B/s (bytes/s)'], ['8e3', 'KB/s'], ['8e6', 'MB/s']], '1e6')}${select('File size standard', 's', [[1024, 'binary (1 MB = 1024 KB)'], [1000, 'decimal (1 MB = 1000 KB)']], 1024)}</div><p class="t-hint">Time = size in bits ÷ speed in bits per second. Network speeds are always decimal (1 Mbps = 1,000,000 bit/s) and use a small <b>b</b> for bits.</p>`);
    bind(el, form, out, (v) => {
      const x = posNum(v.v, 'File size'), r = posNum(v.r, 'Speed'), base = +v.s;
      if (r === 0) throw new Error('Speed must be greater than 0.');
      const bytes = x * unitBits(v.u, base) / 8, bits = bytes * 8, bps = r * Number(v.ru);
      const t = bits / bps;
      const hms = t >= 60 ? ` = ${Math.floor(t / 3600) ? Math.floor(t / 3600) + ' h ' : ''}${Math.floor((t % 3600) / 60)} min ${fmtN(Math.round((t % 60) * 100) / 100)} s` : '';
      const ruName = form.querySelector('[name=ru]').selectedOptions[0].textContent.split(' ')[0];
      return rows([['Time', `<b>${fmtN(t)} s</b>${hms}`]]) + work([
        `Size in bytes: ${fmtN(x)} ${v.u} × ${fmtN(unitBits(v.u, base) / 8)} = <b>${fmtN(bytes)} B</b>`,
        `Size in bits: ${fmtN(bytes)} B × 8 = <b>${fmtN(bits)} bits</b>`,
        `Speed in bits/s: ${fmtN(r)} ${ruName} × ${fmtN(Number(v.ru))} = <b>${fmtN(bps)} bit/s</b>`,
        `Time = bits ÷ speed = ${fmtN(bits)} ÷ ${fmtN(bps)} = <b>${fmtN(t)} s</b>`,
      ]);
    });
  });

  // ---------- 14. CPU performance equation ----------
  W.register('tool-perf', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Clock rate', 'f', '2')}${select('Unit', 'fu', [['1e6', 'MHz'], ['1e9', 'GHz']], '1e9')}${field('Instruction count', 'ic', '1000000')}${field('CPI (or mix)', 'cpi', '50%:1, 30%:2, 20%:3', 'class="t-wide"')}</div><p class="t-hint">CPI can be one number (<code>1.7</code>) or an instruction mix <code>share:cycles</code>, e.g. <code>50%:1, 30%:2, 20%:3</code>.</p>`);
    bind(el, form, out, (v) => {
      const f = posNum(v.f, 'Clock rate') * Number(v.fu), ic = posNum(v.ic, 'Instruction count');
      if (!f) throw new Error('Clock rate must be greater than 0.');
      let cpi, mixStep = '';
      if (v.cpi.includes(':')) {
        const parts = v.cpi.split(',').map((p) => p.split(':').map((s) => s.trim()));
        const mix = parts.map(([sh, c]) => [sh.endsWith('%') ? Number(sh.slice(0, -1)) / 100 : Number(sh), Number(c)]);
        if (mix.some(([a, b]) => !Number.isFinite(a) || !Number.isFinite(b))) throw new Error('Mix: write share:cycles pairs, e.g. 50%:1, 30%:2, 20%:3.');
        const tot = mix.reduce((s, [a]) => s + a, 0);
        if (Math.abs(tot - 1) > 1e-6) throw new Error(`The shares add up to ${fmtN(tot * 100)}% — they must add up to 100%.`);
        cpi = mix.reduce((s, [a, c]) => s + a * c, 0);
        mixStep = `Average CPI = Σ (share × cycles) = ${mix.map(([a, c]) => `${fmtN(a)}×${fmtN(c)}`).join(' + ')} = <b>${fmtN(cpi)}</b>`;
      } else cpi = posNum(v.cpi, 'CPI');
      const T = 1 / f, cycles = ic * cpi, time = cycles * T, mips = f / (cpi * 1e6);
      return rows([['CPU time', `<b>${fmtN(time * 1e3)} ms</b> (${fmtN(time)} s)`], ['MIPS', `<b>${fmtN(mips)}</b>`]]) + work([
        `Clock period T = 1 ÷ f = 1 ÷ ${fmtN(f)} Hz = <b>${fmtN(T * 1e9)} ns</b>`,
        mixStep,
        `Total clock cycles = IC × CPI = ${fmtN(ic)} × ${fmtN(cpi)} = <b>${fmtN(cycles)}</b>`,
        `CPU time = cycles × T = ${fmtN(cycles)} ÷ ${fmtN(f)} = <b>${fmtN(time)} s</b>`,
        `MIPS = f ÷ (CPI × 10<sup>6</sup>) = ${fmtN(f)} ÷ (${fmtN(cpi)} × 10<sup>6</sup>) = <b>${fmtN(mips)}</b>`,
      ], 'Step-by-step working · CPU time = IC × CPI × T');
    });
  });

  // ---------- 15. Pipeline speed-up ----------
  W.register('tool-pipeline', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Stages k', 'k', '5', 'inputmode="numeric"')}${field('Instructions n', 'n', '100', 'inputmode="numeric"')}${field('Stage time τ (ns)', 't', '10')}${field('Non-pipelined time per instruction (ns, optional)', 'tn', '')}</div>`);
    bind(el, form, out, (v) => {
      const k = posNum(v.k, 'Stages'), n = posNum(v.n, 'Instructions'), tau = posNum(v.t, 'Stage time');
      if (!Number.isInteger(k) || !Number.isInteger(n) || k < 1 || n < 1) throw new Error('k and n must be whole numbers ≥ 1.');
      const tn = v.tn.trim() ? posNum(v.tn, 'Non-pipelined time') : k * tau;
      const seq = n * tn, pipe = (k + n - 1) * tau, S = seq / pipe;
      return rows([['Speed-up', `<b>${fmtN(S)}×</b> (maximum k = ${k} as n → ∞)`], ['Efficiency', `${fmtN((S / k) * 100)}%`], ['Throughput', `${fmtN(n / pipe * 1e3)} instructions/µs`]]) + work([
        `Without pipeline each instruction takes ${v.tn.trim() ? `t<sub>n</sub> = ${fmtN(tn)} ns` : `k × τ = ${k} × ${fmtN(tau)} = ${fmtN(tn)} ns`}`,
        `Non-pipelined time = n × t<sub>n</sub> = ${n} × ${fmtN(tn)} = <b>${fmtN(seq)} ns</b>`,
        `Pipelined: the first instruction needs k cycles, every other one finishes 1 cycle later → (k + n − 1) × τ = (${k} + ${n} − 1) × ${fmtN(tau)} = <b>${fmtN(pipe)} ns</b>`,
        `Speed-up S = ${fmtN(seq)} ÷ ${fmtN(pipe)} = <b>${fmtN(S)}</b>`,
        `Efficiency = S ÷ k = ${fmtN(S)} ÷ ${k} = <b>${fmtN(S / k)}</b>`,
        `Throughput = n ÷ pipelined time = ${n} ÷ ${fmtN(pipe)} ns`,
      ]);
    });
  });

  // ---------- 16. Cache: hit ratio & average access time ----------
  W.register('tool-amat', (el) => {
    const [form, out] = mount(el, `<div class="t-row">${field('Hit ratio h (0.9, 90% or hits/total)', 'h', '0.95', 'class="t-wide"')}${field('Cache time Tc (ns)', 'tc', '10')}${field('Memory time Tm (ns)', 'tm', '100')}${select('Access type', 'm', [['h', 'hierarchical — cache first, then memory'], ['s', 'simultaneous — both looked up together']], 'h')}</div>`);
    bind(el, form, out, (v) => {
      const raw = v.h.trim(); let h, hStep = '';
      if (raw.includes('/')) { const [a, b] = raw.split('/').map(Number); if (!(b > 0) || a < 0 || a > b) throw new Error('Write hits/total, e.g. 950/1000.'); h = a / b; hStep = `Hit ratio h = hits ÷ total = ${fmtN(a)} ÷ ${fmtN(b)} = <b>${fmtN(h)}</b>; miss ratio = 1 − h = ${fmtN(1 - h)}`; }
      else { h = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw); if (!(h >= 0 && h <= 1)) throw new Error('Hit ratio must be between 0 and 1 (or 0–100%).'); hStep = `Hit ratio h = ${fmtN(h)}, miss ratio = 1 − h = ${fmtN(1 - h)}`; }
      const tc = posNum(v.tc, 'Cache time'), tm = posNum(v.tm, 'Memory time');
      const t = v.m === 'h' ? h * tc + (1 - h) * (tc + tm) : h * tc + (1 - h) * tm;
      const formula = v.m === 'h' ? 'T = h × Tc + (1 − h) × (Tc + Tm)' : 'T = h × Tc + (1 − h) × Tm';
      const sub = v.m === 'h' ? `${fmtN(h)} × ${fmtN(tc)} + ${fmtN(1 - h)} × (${fmtN(tc)} + ${fmtN(tm)})` : `${fmtN(h)} × ${fmtN(tc)} + ${fmtN(1 - h)} × ${fmtN(tm)}`;
      const parts = v.m === 'h' ? [h * tc, (1 - h) * (tc + tm)] : [h * tc, (1 - h) * tm];
      return rows([['Average access time', `<b>${fmtN(t)} ns</b>`], ['Speed-up vs. no cache', `${fmtN(tm)} ÷ ${fmtN(t)} = ${fmtN(tm / t)}×`]]) + work([
        hStep, `Formula (${v.m === 'h' ? 'a miss costs Tc + Tm' : 'a miss costs Tm'}): ${formula}`, `Substitute: ${sub}`, `= ${fmtN(parts[0])} + ${fmtN(parts[1])} = <b>${fmtN(t)} ns</b>`,
      ]);
    });
  });

})();

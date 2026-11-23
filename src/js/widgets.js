/* COAL Documentation, small interactive widgets. Mount points: <div class="widget" data-widget="name"> */
(function () {
  'use strict';
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
  const hex = (n, w) => (n >>> 0).toString(16).toUpperCase().padStart(w, '0');

  /* 1. Example Program Execution (Basic Processor.pdf, page 17): six steps */
  function programExecution(el) {
    const mem0 = { 0x300: '1940', 0x301: '5941', 0x302: '2941', 0x940: '0003', 0x941: '0002' };
    const steps = [
      { pc: '300', ac: '', ir: '1940', mem: {}, hl: [0x300], note: 'Step 1, The PC holds 300, the address of the first instruction. The instruction 1940 is loaded into the instruction register IR (fetch). Opcode 1 = “load AC from memory”, address 940.' },
      { pc: '301', ac: '0003', ir: '1940', mem: {}, hl: [0x940], note: 'Step 2, The PC is incremented to 301. The instruction executes: the word at address 940 (0003) is loaded into the accumulator AC.' },
      { pc: '301', ac: '0003', ir: '5941', mem: {}, hl: [0x301], note: 'Step 3, The next instruction 5941 is fetched from location 301 into IR. Opcode 5 = “add to AC from memory”, address 941.' },
      { pc: '302', ac: '0005', ir: '5941', mem: {}, hl: [0x941], note: 'Step 4, The PC is incremented to 302. The old contents of AC and the contents of location 941 are added: 3 + 2 = 5, and the result is stored in AC.' },
      { pc: '302', ac: '0005', ir: '2941', mem: {}, hl: [0x302], note: 'Step 5, The next instruction 2941 is fetched from location 302 into IR. Opcode 2 = “store AC to memory”, address 941.' },
      { pc: '303', ac: '0005', ir: '2941', mem: { 0x941: '0005' }, hl: [0x941], note: 'Step 6, The PC is incremented to 303. The contents of AC (0005) are stored in location 941.' },
    ];
    let i = 0;
    el.append(h(`<div class="stepper-panel">
      <div class="stepper-col"><h4>Memory</h4><div class="mem-table" data-mem></div></div>
      <div class="stepper-col"><h4>CPU Registers</h4><div class="mem-table" data-regs></div></div>
    </div>
    <div class="stepper-note" aria-live="polite" data-note></div>
    <div class="stepper-controls">
      <button class="btn btn--sm" type="button" data-prev><i data-lucide="chevron-left"></i>Previous</button>
      <button class="btn btn--sm btn--primary" type="button" data-next>Next<i data-lucide="chevron-right"></i></button>
      <button class="btn btn--sm btn--ghost" type="button" data-reset><i data-lucide="rotate-ccw"></i>Reset</button>
      <span class="stepper-label" data-label></span>
    </div>`));
    const cell = (v) => `<span class="mem-cell">${(v || '    ').padEnd(4, ' ').split('').map((c) => `<span>${c.trim() ? c : '&nbsp;'}</span>`).join('')}</span>`;
    const render = () => {
      const s = steps[i];
      const mem = Object.assign({}, mem0);
      for (let k = 0; k <= i; k++) Object.assign(mem, steps[k].mem);
      const row = (a) => `<div class="mem-row${s.hl.includes(a) ? ' hl' : ''}"><span class="mem-addr">${hex(a, 3)}</span>${cell(mem[a])}</div>`;
      el.querySelector('[data-mem]').innerHTML = row(0x300) + row(0x301) + row(0x302) + '<div class="mem-gap">⋮</div>' + row(0x940) + row(0x941);
      const reg = (name, v, on) => `<div class="mem-row${on ? ' hl' : ''}"><span class="mem-addr">${name}</span>${cell(v ? v.padStart(name === 'PC' ? 3 : 4, '0') : '')}</div>`;
      const prev = steps[i - 1] || {};
      el.querySelector('[data-regs]').innerHTML = reg('PC', s.pc, s.pc !== prev.pc) + reg('AC', s.ac, s.ac !== prev.ac) + reg('IR', s.ir, s.ir !== prev.ir);
      el.querySelector('[data-note]').textContent = s.note;
      el.querySelector('[data-label]').textContent = `Step ${i + 1} / ${steps.length}`;
      el.querySelector('[data-prev]').disabled = i === 0;
      el.querySelector('[data-next]').disabled = i === steps.length - 1;
    };
    el.querySelector('[data-prev]').addEventListener('click', () => { if (i > 0) { i--; render(); } });
    el.querySelector('[data-next]').addEventListener('click', () => { if (i < steps.length - 1) { i++; render(); } });
    el.querySelector('[data-reset]').addEventListener('click', () => { i = 0; render(); });
    render();
  }

  /* 2. Segment:Offset → physical address (Register & Memory.pdf, page 29) */
  function addressCalculator(el) {
    el.append(h(`<div class="w-row">
      <label class="w-field">Segment (hex)<input data-seg value="A4FB" maxlength="4" inputmode="text" autocomplete="off" spellcheck="false"></label>
      <label class="w-field">Offset (hex)<input data-off value="4872" maxlength="4" inputmode="text" autocomplete="off" spellcheck="false"></label>
    </div><div class="w-out" aria-live="polite" data-out></div>`));
    const seg = el.querySelector('[data-seg]'), off = el.querySelector('[data-off]'), out = el.querySelector('[data-out]');
    const ok = (v) => /^[0-9a-f]{1,4}$/i.test(v);
    const run = () => {
      if (!ok(seg.value) || !ok(off.value)) { out.innerHTML = '<span class="w-err">Enter 1-4 hexadecimal digits (0-9, A-F) in each box.</span>'; return; }
      const s = parseInt(seg.value, 16), o = parseInt(off.value, 16);
      const pa = s * 16 + o, wrapped = pa & 0xfffff;
      out.innerHTML = `Logical address = <b>${hex(s, 4)}:${hex(o, 4)}</b><br>Segment × 10h = ${hex(s, 4)}h × 10h = ${hex(s * 16, 5)}h<br>Physical address = ${hex(s * 16, 5)}h + ${hex(o, 4)}h = <b>${hex(pa, 5)}h</b>${pa > 0xfffff ? ` <span class="w-err">(exceeds 20 bits, wraps to ${hex(wrapped, 5)}h on an 8086)</span>` : ''}`;
    };
    seg.addEventListener('input', run); off.addEventListener('input', run); run();
  }

  /* 3. Number system converter (researched page) */
  function numberConverter(el) {
    el.append(h(`<div class="w-row">
      <label class="w-field">Decimal<input data-b="10" value="200" autocomplete="off"></label>
      <label class="w-field">Hexadecimal<input data-b="16" autocomplete="off"></label>
      <label class="w-field">Binary<input data-b="2" style="width:14em" autocomplete="off"></label>
      <label class="w-field">Octal<input data-b="8" autocomplete="off"></label>
    </div><div class="w-out" aria-live="polite" data-out></div>`));
    const ins = Array.from(el.querySelectorAll('input')), out = el.querySelector('[data-out]');
    const valid = { 10: /^\d+$/, 16: /^[0-9a-f]+$/i, 2: /^[01]+$/, 8: /^[0-7]+$/ };
    const update = (src) => {
      const b = +src.dataset.b, v = src.value.trim().replace(/[\s_]/g, '');
      if (!valid[b].test(v)) { out.innerHTML = '<span class="w-err">That is not a valid base-' + b + ' number.</span>'; return; }
      const n = parseInt(v, b);
      if (n > 0xffffffff) { out.innerHTML = '<span class="w-err">Keep the value within 32 bits (≤ 4,294,967,295).</span>'; return; }
      ins.forEach((i) => { if (i !== src) i.value = n.toString(+i.dataset.b).toUpperCase(); });
      const bits = n.toString(2).padStart(n > 0xffff ? 32 : n > 0xff ? 16 : 8, '0').replace(/(.{4})(?=.)/g, '$1 ');
      const size = n > 0xffff ? 'doubleword (32-bit)' : n > 0xff ? 'word (16-bit)' : 'byte (8-bit)';
      const signed = n <= 0xff ? (n > 127 ? n - 256 : n) : n <= 0xffff ? (n > 32767 ? n - 65536 : n) : (n | 0);
      out.innerHTML = `Fits in a <b>${size}</b>: ${bits}<br>As a signed ${size.split(' ')[0]} (two's complement): <b>${signed}</b>`;
    };
    ins.forEach((i) => i.addEventListener('input', () => update(i)));
    update(ins[0]);
  }

  /* 4. Stack push/pop visualizer (researched page) */
  function stackVisualizer(el) {
    el.append(h(`<div class="w-row">
      <label class="w-field">Value (hex)<input data-v value="1234" maxlength="4" autocomplete="off"></label>
      <button class="btn btn--sm btn--primary" type="button" data-push>PUSH</button>
      <button class="btn btn--sm" type="button" data-pop>POP</button>
      <button class="btn btn--sm btn--ghost" type="button" data-reset>Reset</button>
    </div>
    <div class="stepper-panel" style="margin-top:14px"><div class="stepper-col"><h4>Stack segment (SS)</h4><div class="mem-table" data-stack></div></div>
    <div class="stepper-col"><h4>Registers</h4><div class="mem-table" data-regs></div></div></div>
    <div class="stepper-note" aria-live="polite" data-note>SP starts at 0100h. PUSH subtracts 2 from SP, then stores the word at SS:SP.</div>`));
    let sp = 0x100; const mem = {}; let ax = null;
    const v = el.querySelector('[data-v]'), note = el.querySelector('[data-note]');
    const cell = (x) => `<span class="mem-cell">${(x || '----').split('').map((c) => `<span>${c}</span>`).join('')}</span>`;
    const render = (hl) => {
      let rows = '';
      for (let a = 0xf8; a <= 0xfe; a += 2) rows += `<div class="mem-row${a === sp ? ' hl' : ''}"><span class="mem-addr">${hex(a, 4)}</span>${cell(mem[a])}${a === sp ? ' ← SP' : ''}</div>`;
      el.querySelector('[data-stack]').innerHTML = rows + `<div class="mem-row${sp === 0x100 ? ' hl' : ''}"><span class="mem-addr">0100</span><span class="mem-cell"><span>·</span><span>·</span><span>·</span><span>·</span></span>${sp === 0x100 ? ' ← SP (empty)' : ''}</div>`;
      el.querySelector('[data-regs]').innerHTML = `<div class="mem-row${hl === 'sp' ? ' hl' : ''}"><span class="mem-addr">SP</span>${cell(hex(sp, 4))}</div><div class="mem-row${hl === 'ax' ? ' hl' : ''}"><span class="mem-addr">AX</span>${cell(ax)}</div>`;
    };
    el.querySelector('[data-push]').addEventListener('click', () => {
      if (!/^[0-9a-f]{1,4}$/i.test(v.value)) { note.textContent = 'Enter 1-4 hex digits.'; return; }
      if (sp <= 0xf8) { note.textContent = 'This demo stack is full (stack overflow!). POP something first.'; return; }
      sp -= 2; mem[sp] = hex(parseInt(v.value, 16), 4);
      note.textContent = `PUSH ${mem[sp]}h → SP = SP − 2 = ${hex(sp, 4)}h, then [SS:${hex(sp, 4)}] = ${mem[sp]}h`;
      v.value = hex((parseInt(v.value, 16) + 0x1111) & 0xffff, 4); render('sp');
    });
    el.querySelector('[data-pop]').addEventListener('click', () => {
      if (sp >= 0x100) { note.textContent = 'The stack is empty (stack underflow!). PUSH something first.'; return; }
      ax = mem[sp]; delete mem[sp]; const old = sp; sp += 2;
      note.textContent = `POP AX → AX = [SS:${hex(old, 4)}] = ${ax}h, then SP = SP + 2 = ${hex(sp, 4)}h`; render('ax');
    });
    el.querySelector('[data-reset]').addEventListener('click', () => { sp = 0x100; ax = null; Object.keys(mem).forEach((k) => delete mem[k]); note.textContent = 'Reset. SP = 0100h.'; render(); });
    render();
  }

  const registry = { 'program-execution': programExecution, 'address-calculator': addressCalculator, 'number-converter': numberConverter, 'stack-visualizer': stackVisualizer };
  window.COAL_WIDGETS = {
    register(name, fn) { registry[name] = fn; },
    init() {
      document.querySelectorAll('.widget[data-widget]').forEach((el) => {
        const fn = registry[el.dataset.widget];
        if (fn && !el.dataset.ready) { el.dataset.ready = '1'; try { fn(el); } catch (e) { console.error(e); el.textContent = 'This interactive example could not load.'; } }
      });
    },
  };
})();

/* COAL Documentation, site behaviour (no framework). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* ---------- Syntax highlighting (x86 mnemonics/directives added to Prism's NASM grammar) ---------- */
  function setupPrism() {
    if (!window.Prism || !Prism.languages.nasm) return;
    const mnemonics = 'aaa|aad|aam|aas|adc|add|and|call|cbw|clc|cld|cli|cmc|cmp|cmpsb|cmpsw|cmps|cwd|daa|das|dec|div|hlt|idiv|imul|in|inc|int|into|iret|ja|jae|jb|jbe|jc|jcxz|je|jg|jge|jl|jle|jmp|jna|jnae|jnb|jnbe|jnc|jne|jng|jnge|jnl|jnle|jno|jnp|jns|jnz|jo|jp|jpe|jpo|js|jz|lahf|lds|lea|les|lodsb|lodsw|lods|loop|loope|loopne|loopnz|loopz|mov|movsb|movsw|movs|movzx|movsx|mul|neg|nop|not|or|out|pop|popf|push|pushf|rcl|rcr|rep|repe|repne|repnz|repz|ret|retf|rol|ror|sahf|sal|sar|sbb|scasb|scasw|scas|shl|shr|stc|std|sti|stosb|stosw|stos|sub|test|xchg|xlat|xor|lxi|mvi|lda|sta|lhld|shld|ldax|stax|xthl|sphl|pchl|inx|dcx|inr|dcr|adi|aci|sui|sbi|ani|ori|xri|cpi|rlc|rrc|ral|rar|cma|cmc|stc|jnz|jmp|hlt|rst|ei|di|rim|sim|syscall|leave|enter|pusha|popa|shld|shrd|bt|setc|sete';
    const directives = 'segment|ends|assume|proc|endp|db|dw|dd|dq|dt|equ|macro|endm|local|org|offset|ptr|byte|word|dword|far|near|dup|model|small|tiny|medium|large|stack|data|code|end|main|public|extrn|include|title|struc|label|times|resb|resw|resd|section|global|bits|seg|length|size|type|if|else|endif|rept|irp|exitm';
    Prism.languages.insertBefore('nasm', 'register', {
      directive: { pattern: new RegExp('(^|[^\\w.$@])\\.?(?:' + directives + ')\\b', 'im'), lookbehind: true, alias: 'keyword' },
      mnemonic: { pattern: new RegExp('(^|[^\\w.$@])(?:' + mnemonics + ')\\b', 'im'), lookbehind: true, alias: 'function' },
    });
    // Treat hex with trailing h (e.g. 0A9822h, 4C00h) as numbers
    Prism.languages.insertBefore('nasm', 'number', {
      hexh: { pattern: /\b[0-9][0-9a-f]*h\b|\b[01]+b\b/i, alias: 'number' },
    });
    // Prism's NASM grammar lacks 8086 segment registers in some versions; extend register token
    Prism.languages.nasm.register = {
      pattern: /\b(?:st\d|[xyz]mm\d\d?|[cdt]r\d|r\d\d?[bwd]?|[er]?[abcd]x|[abcd][hl]|[er]?(?:bp|di|si|sp|ip)|[cdefgs]s)\b/i,
      alias: 'variable',
    };
    Prism.highlightAll();
  }

  /* ---------- Icons ---------- */
  function icons() { if (window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } }); }

  /* ---------- Index menu (replaces the sidebar) & lesson strip ---------- */
  function setupNav() {
    const toggles = $$('.index-toggle, .menu-toggle'), openers = $$('[data-index-open]'), panel = $('#index-panel');
    if (toggles.length && panel) {
      let opener = toggles[0];
      const set = (open, from) => {
        panel.hidden = !open;
        toggles.forEach((t) => t.setAttribute('aria-expanded', String(open)));
        const mt = $('.menu-toggle'); if (mt) mt.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('index-open', open);
        if (open) {
          if (from) opener = from;
          const cur = $('[aria-current="page"]', panel);
          const first = cur || $('.ix-quick a, .ix-head', panel);
          if (first) { first.focus({ preventScroll: true }); if (cur) cur.scrollIntoView({ block: 'nearest' }); }
        }
      };
      const shut = () => { set(false); if (opener) opener.focus(); };
      toggles.forEach((t) => t.addEventListener('click', (e) => { e.stopPropagation(); set(panel.hidden, t); }));
      openers.forEach((t) => t.addEventListener('click', (e) => { e.stopPropagation(); set(true, t); }));
      $$('.index-close, .ix-drawer-close', panel).forEach((c) => c.addEventListener('click', shut));
      // a click on the dimmed backdrop (or anywhere outside) closes it
      document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !toggles.some((t) => t.contains(e.target))) set(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) shut(); });
      panel.addEventListener('click', (e) => {
        const exp = e.target.closest('.ix-exp');
        if (exp) { const sec = exp.closest('.ix-chapter'); const open = !sec.classList.contains('is-open'); sec.classList.toggle('is-open', open); exp.setAttribute('aria-expanded', String(open)); return; }
        if (e.target.closest('a, [data-search-open]')) set(false);
      });
    }
    // keep the current lesson visible in the horizontal lesson strip
    const strip = $('.lesson-strip ol'), cur = $('.lesson-strip [aria-current="page"]');
    if (strip && cur) strip.scrollTo({ left: Math.max(0, cur.offsetLeft - strip.clientWidth / 2 + cur.clientWidth / 2), behavior: 'instant' });
    // lesson tabs: arrow buttons scroll the row; they disable at either end
    const tabs = $('.ls-tabs');
    if (tabs) {
      const arrows = $$('.ls-arrow');
      const upd = () => arrows.forEach((b) => { b.disabled = +b.dataset.dir < 0 ? tabs.scrollLeft <= 2 : tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2; });
      arrows.forEach((b) => b.addEventListener('click', () => tabs.scrollBy({ left: +b.dataset.dir * tabs.clientWidth * 0.7, behavior: 'smooth' })));
      tabs.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    }
    // close the mobile TOC after choosing a section
    $$('.toc-mobile, .tools-jump').forEach((d) => d.addEventListener('click', (e) => { if (e.target.closest('a')) d.open = false; }));
  }

  /* ---------- Progress, back to top, TOC scrollspy ---------- */
  function setupScroll() {
    const bar = $('.progress-bar'), top = $('.back-to-top'), ring = $('.btt-prog'), RING = 2 * Math.PI * 22;
    if (ring) ring.style.strokeDasharray = String(RING);
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (top) { top.classList.toggle('show', h.scrollTop > 600); if (ring) ring.style.strokeDashoffset = String(RING * (1 - p)); }
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    top && top.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      const main = $('#main'); main && main.focus({ preventScroll: true });
    });

    const links = $$('.toc a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map(links.map((a) => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
    const heads = $$('.doc-body h2[id], .doc-body h3[id]').filter((h) => map.has(h.id));
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      let current = heads.find((h) => visible.has(h));
      if (!current) { current = heads.filter((h) => h.getBoundingClientRect().top < 120).pop() || heads[0]; }
      links.forEach((a) => a.classList.remove('active'));
      const a = current && map.get(current.id);
      if (a) { a.classList.add('active'); const toc = a.closest('.toc'); if (toc && toc.scrollHeight > toc.clientHeight) a.scrollIntoView({ block: 'nearest' }); }
    }, { rootMargin: '-80px 0px -65% 0px' });
    heads.forEach((h) => io.observe(h));
  }

  /* ---------- Smooth scrolling for in-page links (TOC, heading anchors) ---------- */
  function setupSmoothAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const header = $('.site-header');
      const y = target.getBoundingClientRect().top + window.scrollY - ((header ? header.offsetHeight : 64) + 16);
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', '#' + encodeURIComponent(id));
      if (a.closest('.toc')) { $$('.toc a').forEach((l) => l.classList.toggle('active', l === a)); }
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------- Copy buttons ---------- */
  function setupCopy() {
    $$('.copy-btn').forEach((btn) => btn.addEventListener('click', async () => {
      const code = btn.closest('.code-block').querySelector('code').innerText;
      try { await navigator.clipboard.writeText(code); }
      catch (e) { const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      const label = btn.querySelector('span');
      btn.classList.add('copied'); label.textContent = 'Copied!';
      setTimeout(() => { btn.classList.remove('copied'); label.textContent = 'Copy'; }, 1600);
    }));
  }

  /* ---------- Search (Fuse.js) ---------- */
  function setupSearch() {
    const modal = $('.search-modal'); if (!modal) return;
    const input = $('input', modal), list = $('.search-results', modal);
    const prefix = window.COAL_PREFIX || './';
    let fuse = null, sel = 0, results = [], lastFocus = null;
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ensure = () => {
      if (fuse || !window.Fuse || !window.COAL_SEARCH) return;
      fuse = new Fuse(window.COAL_SEARCH, {
        includeMatches: true, ignoreLocation: true, threshold: 0.32, minMatchCharLength: 2,
        keys: [{ name: 't', weight: 0.5 }, { name: 'h', weight: 0.3 }, { name: 'x', weight: 0.2 }],
      });
    };
    const snippet = (doc, q) => {
      const text = doc.x; const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      let i = -1; for (const w of words) { i = text.toLowerCase().indexOf(w); if (i >= 0) break; }
      if (i < 0) return esc(text.slice(0, 140)) + '…';
      const s = Math.max(0, i - 50); let out = esc(text.slice(s, s + 170));
      words.forEach((w) => { if (w.length > 1) out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      return (s > 0 ? '…' : '') + out + '…';
    };
    const anchorFor = (doc, q) => {
      const ql = q.toLowerCase(); const hit = (doc.hs || []).find(([t]) => t.toLowerCase().includes(ql));
      return hit ? '#' + hit[1] : '';
    };
    const render = () => {
      const q = input.value.trim();
      if (!q) {
        results = (window.COAL_SEARCH || []).slice(0, 8).map((item) => ({ item }));
      } else { ensure(); results = fuse ? fuse.search(q, { limit: 12 }) : []; }
      sel = 0;
      if (!results.length) { list.innerHTML = `<li class="search-empty">No results for “${esc(q)}”. Try a register (AX), a topic (cache) or an instruction (MOV).</li>`; return; }
      list.innerHTML = results.map((r, i) => {
        const d = r.item;
        return `<li role="option"><a href="${prefix}${d.u}${q ? anchorFor(d, q) : ''}" aria-selected="${i === 0}"><span class="sr-chapter">${esc(d.c)}${d.r ? ' · researched' : ''}</span><span class="sr-title">${esc(d.t)}</span><span class="sr-snippet">${q ? snippet(d, q) : esc(d.h.slice(0, 150))}</span></a></li>`;
      }).join('');
    };
    const move = (d) => {
      const as = $$('a', list); if (!as.length) return;
      as[sel] && as[sel].setAttribute('aria-selected', 'false');
      sel = (sel + d + as.length) % as.length;
      as[sel].setAttribute('aria-selected', 'true'); as[sel].scrollIntoView({ block: 'nearest' });
    };
    const open = () => {
      lastFocus = document.activeElement; modal.hidden = false; document.body.style.overflow = 'hidden';
      ensure(); render(); setTimeout(() => input.focus(), 10);
      if (window.gsap && !reduceMotion) gsap.fromTo('.search-panel', { y: -14, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .25, ease: 'power2.out' });
    };
    const close = () => { modal.hidden = true; document.body.style.overflow = ''; input.value = ''; lastFocus && lastFocus.focus && lastFocus.focus(); };
    $$('[data-search-open]').forEach((b) => b.addEventListener('click', open));
    $$('[data-search-close]').forEach((b) => b.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { const a = $$('a', list)[sel]; if (a) { e.preventDefault(); location.href = a.href; } }
    });
    document.addEventListener('keydown', (e) => {
      const typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '');
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing && modal.hidden)) { e.preventDefault(); modal.hidden ? open() : close(); }
      else if (e.key === 'Escape' && !modal.hidden) close();
      else if (e.key === 'Tab' && !modal.hidden) { // focus trap
        const f = $$('input, a, button', modal).filter((x) => x.offsetParent !== null);
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Lightbox for photos ---------- */
  function setupLightbox() {
    const box = $('.lightbox'); if (!box) return;
    const img = $('img', box), cap = $('figcaption', box), closeBtn = $('.lightbox-close', box);
    let last = null;
    const close = () => { box.hidden = true; img.src = ''; document.body.style.overflow = ''; last && last.focus(); };
    document.addEventListener('click', (e) => {
      const t = e.target.closest('.diagram-original, .photo-zoom'); if (!t) return;
      last = t; img.src = t.dataset.src; img.alt = t.dataset.caption || ''; cap.textContent = t.dataset.caption || '';
      box.hidden = false; document.body.style.overflow = 'hidden'; closeBtn.focus();
    });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });
  }

  /* ---------- Mermaid (only on pages that use it) ---------- */
  const mermaidSources = new Map();
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function mermaidTheme() {
    const solid = (v, fb) => (/rgba|transparent/.test(v) || !v ? fb : v);
    const dark = false;
    return {
      startOnLoad: false, securityLevel: 'strict', theme: 'base',
      themeVariables: {
        darkMode: dark, fontFamily: cssVar('--font-body'), fontSize: '14px',
        primaryColor: solid(cssVar('--d-fill-2'), dark ? '#2a2f5a' : '#e3ebfb'),
        primaryBorderColor: cssVar('--d-stroke'), primaryTextColor: cssVar('--d-text'),
        secondaryColor: solid(cssVar('--d-fill-3'), dark ? '#3a2a4a' : '#fff3dc'), tertiaryColor: solid(cssVar('--d-fill'), dark ? '#1a1a2e' : '#f3f6fc'),
        lineColor: cssVar('--d-stroke'), textColor: cssVar('--d-text'),
        mainBkg: solid(cssVar('--d-fill-2'), dark ? '#2a2f5a' : '#e3ebfb'), nodeBorder: cssVar('--d-stroke'),
        clusterBkg: solid(cssVar('--d-fill'), dark ? '#151528' : '#f7f7fb'), clusterBorder: cssVar('--d-stroke'),
        edgeLabelBackground: dark ? '#00000000' : '#ffffff', titleColor: cssVar('--d-text'),
        actorBkg: solid(cssVar('--d-fill-2'), '#e3ebfb'), actorBorder: cssVar('--d-stroke'), actorTextColor: cssVar('--d-text'), signalColor: cssVar('--d-stroke'), signalTextColor: cssVar('--d-text'),
        noteBkgColor: solid(cssVar('--d-fill-3'), '#fff3dc'), noteTextColor: cssVar('--d-text'), noteBorderColor: cssVar('--d-stroke'),
      },
    };
  }
  async function renderMermaid() {
    const nodes = $$('pre.mermaid'); if (!nodes.length || !window.mermaid) return;
    nodes.forEach((n) => { if (!mermaidSources.has(n)) mermaidSources.set(n, n.textContent); });
    mermaid.initialize(mermaidTheme());
    try { await mermaid.run({ nodes }); } catch (e) { console.warn('mermaid', e); }
  }
  function rerenderMermaid() {
    if (!window.mermaid || !mermaidSources.size) return;
    mermaidSources.forEach((src, n) => { n.removeAttribute('data-processed'); n.textContent = src; });
    renderMermaid();
  }

  /* ---------- Tools page: side nav highlights the calculator on screen ---------- */
  function setupToolsSpy() {
    const nav = $('.tools-nav nav');
    if (!nav || !('IntersectionObserver' in window)) return;
    const links = $$('a[href^="#"]', nav);
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const panels = $$('.tool-panel').filter((p) => map.has(p.id));
    const seen = new Set();
    const pick = () => {
      let cur = panels.find((p) => seen.has(p));
      if (!cur) cur = panels.filter((p) => p.getBoundingClientRect().top < 160).pop() || panels[0];
      links.forEach((a) => a.classList.toggle('active', map.get(cur.id) === a));
      const a = map.get(cur.id);
      if (a && nav.scrollHeight > nav.clientHeight) {
        const r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
        if (r.top < n.top + 40 || r.bottom > n.bottom - 40) nav.scrollTo({ top: a.offsetTop - nav.clientHeight / 2, behavior: 'smooth' });
      }
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))); pick(); }, { rootMargin: '-90px 0px -55% 0px' });
    panels.forEach((p) => io.observe(p));
    pick();
  }

  /* ---------- Home hero: 8086 programs that type themselves in, then run ---------- */
  function setupHeroDemo() {
    const demo = $('.cpu-demo');
    if (!demo) return;
    const L = (addr, bytes, code) => ({ addr, bytes, code });
    const sumSteps = [[0, { CX: 5, IP: 0 }], [1, { AX: 0, IP: 3 }]];
    for (let cx = 5, ax = 0; cx >= 1; cx--) { ax += cx; sumSteps.push([2, { AX: ax, IP: 6 }], [3, { CX: cx - 1, IP: 8 }]); }
    sumSteps.push([4, { IP: 0x0a }]);
    const facSteps = [[0, { CX: 4, IP: 0 }], [1, { AX: 1, IP: 3 }]];
    for (let cx = 4, ax = 1; cx >= 1; cx--) { ax *= cx; facSteps.push([2, { AX: ax, DX: 0, IP: 6 }], [3, { CX: cx - 1, IP: 8 }]); }
    facSteps.push([4, { IP: 0x0a }]);
    const PROGRAMS = [
      { file: 'sum.asm', regs: [['AX', 4], ['CX', 4], ['IP', 4], ['cyc', 0]], init: { AX: 0, CX: 0, IP: 0 },
        lines: [L('0000', 'B9 05 00', 'mov  cx, 5'), L('0003', 'B8 00 00', 'mov  ax, 0'), L('0006', '01 C8', 'L1: add  ax, cx'), L('0008', 'E2 FC', '    loop L1'), L('000A', 'F4', 'hlt')],
        steps: sumSteps, result: 'AX = 000Fh = 5 + 4 + 3 + 2 + 1 = 15' },
      { file: 'factorial.asm', regs: [['AX', 4], ['CX', 4], ['IP', 4], ['cyc', 0]], init: { AX: 0, CX: 0, DX: 0, IP: 0 },
        lines: [L('0000', 'B9 04 00', 'mov  cx, 4'), L('0003', 'B8 01 00', 'mov  ax, 1'), L('0006', 'F7 E1', 'L1: mul  cx'), L('0008', 'E2 FC', '    loop L1'), L('000A', 'F4', 'hlt')],
        steps: facSteps, result: 'AX = 0018h = 4! = 4 × 3 × 2 × 1 = 24' },
      { file: 'swap.asm', regs: [['AX', 4], ['BX', 4], ['SP', 4], ['IP', 4]], init: { AX: 0, BX: 0, SP: 0x100, IP: 0 },
        lines: [L('0000', 'B8 34 12', 'mov  ax, 1234h'), L('0003', 'BB 78 56', 'mov  bx, 5678h'), L('0006', '50', 'push ax'), L('0007', '53', 'push bx'), L('0008', '58', 'pop  ax'), L('0009', '5B', 'pop  bx'), L('000A', 'F4', 'hlt')],
        steps: [[0, { AX: 0x1234, IP: 0 }], [1, { BX: 0x5678, IP: 3 }], [2, { SP: 0xfe, IP: 6 }], [3, { SP: 0xfc, IP: 7 }], [4, { AX: 0x5678, SP: 0xfe, IP: 8 }], [5, { BX: 0x1234, SP: 0x100, IP: 9 }], [6, { IP: 0x0a }]],
        result: 'Swapped through the stack: AX = 5678h, BX = 1234h' },
      { file: 'shift.asm', regs: [['AL', 2], ['CF', 1], ['IP', 4], ['cyc', 0]], init: { AL: 0, CF: 0, IP: 0 },
        lines: [L('0000', 'B0 B3', 'mov  al, 0B3h'), L('0002', 'D0 E0', 'shl  al, 1'), L('0004', 'D0 E8', 'shr  al, 1'), L('0006', 'D0 C8', 'ror  al, 1'), L('0008', 'F4', 'hlt')],
        steps: [[0, { AL: 0xb3, IP: 0 }], [1, { AL: 0x66, CF: 1, IP: 2 }], [2, { AL: 0x33, CF: 0, IP: 4 }], [3, { AL: 0x99, CF: 1, IP: 6 }], [4, { IP: 8 }]],
        result: 'AL = 99h = 1001 1001b, CF = 1' },
    ];
    const MNEM = /^(\s*)(\w+:)?(\s*)(\w+)(.*)$/;
    const color = (code) => {
      const m = code.match(MNEM); if (!m) return code;
      const ops = m[5].replace(/\b(0[0-9A-F]*h|\d+h?)\b/gi, '<em>$1</em>');
      return `${m[1]}${m[2] ? `<u>${m[2]}</u>` : ''}${m[3]}<b>${m[4]}</b>${ops}`;
    };
    const fmt = (v, w) => (w === 0 ? String(v) : w === 1 ? String(v) : v.toString(16).toUpperCase().padStart(w, '0'));
    const codeEl = $('.cd-code', demo), regsEl = $('.cd-regs', demo), tabsEl = $('.cd-tabs', demo), resEl = $('.cd-result', demo), live = $('.cd-live b', demo);
    const stages = $$('.cd-stage', demo);
    tabsEl.innerHTML = PROGRAMS.map((p, k) => `<button type="button" class="cd-tab" data-k="${k}" title="${p.file}">${p.file.replace('.asm', '')}</button>`).join('');
    const tabs = $$('.cd-tab', tabsEl);

    let gen = 0, paused = false, cur = 0;
    const sleep = (ms, g) => new Promise((res) => {
      const t0 = Date.now();
      const go = () => { if (g !== gen) return res(false); if (paused) return setTimeout(go, 200); const el = Date.now() - t0; if (el >= ms) return res(true); setTimeout(go, Math.min(120, ms - el)); };
      go();
    });
    const setLive = (t, cls) => { live.textContent = t; demo.dataset.state = cls; };
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (p, state) => {
      regsEl.innerHTML = p.regs.map(([k, w]) => `<div class="cd-reg" data-k="${k}"><span>${k === 'cyc' ? 'Cycles' : k}</span><b>${fmt(state[k] ?? 0, w)}</b></div>`).join('');
    };
    const setReg = (p, state, k, flashIt) => {
      const box = $(`.cd-reg[data-k="${k}"]`, regsEl); if (!box) return;
      const w = p.regs.find((r) => r[0] === k)[1];
      $('b', box).textContent = fmt(state[k], w);
      if (flashIt) { box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash'); }
    };

    async function run(k, g) {
      const p = PROGRAMS[k]; cur = k;
      tabs.forEach((t, i) => t.classList.toggle('on', i === k));
      const state = { ...p.init, cyc: 0 };
      render(p, state);
      resEl.textContent = 'Result appears at hlt'; demo.classList.remove('done');
      codeEl.innerHTML = p.lines.map((l) => `<li class="cd-line"><span class="cd-addr">${l.addr}</span><span class="cd-bytes">${l.bytes}</span><code></code></li>`).join('');
      const items = $$('.cd-line', codeEl);
      if (still) { items.forEach((li, i) => { $('code', li).innerHTML = color(p.lines[i].code); }); }
      else {
        setLive('Typing', 'typing');
        for (let i = 0; i < items.length; i++) {
          const c = $('code', items[i]), text = p.lines[i].code;
          items[i].classList.add('typing');
          for (let n = 1; n <= text.length; n++) { c.textContent = text.slice(0, n); if (!(await sleep(22, g))) return; }
          c.innerHTML = color(text); items[i].classList.remove('typing');
          if (!(await sleep(90, g))) return;
        }
        if (!(await sleep(350, g))) return;
      }
      setLive('Running', 'running');
      for (const [ln, regs] of p.steps) {
        items.forEach((li, i) => li.classList.toggle('on', i === ln));
        stages.forEach((s) => { s.classList.remove('run'); void s.offsetWidth; s.classList.add('run'); });
        Object.entries(regs).forEach(([r, v]) => { const ch = state[r] !== v; state[r] = v; setReg(p, state, r, ch && r !== 'IP'); });
        state.cyc++; setReg(p, state, 'cyc', false);
        if (still) continue;
        if (!(await sleep(950, g))) return;
      }
      resEl.textContent = p.result; demo.classList.add('done'); setLive('Done', 'done');
      if (still) return;
      if (!(await sleep(2600, g))) return;
      run((k + 1) % PROGRAMS.length, g);
    }
    const restart = (k) => { gen++; run(k, gen); };
    tabs.forEach((t) => t.addEventListener('click', () => restart(+t.dataset.k)));
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { paused = !e.isIntersecting || document.hidden; }).observe(demo);
    document.addEventListener('visibilitychange', () => { paused = document.hidden; });
    restart(0);
  }

  /* ---------- Home hero: numbers count up ---------- */
  function setupCountUp() {
    const els = Array.from(document.querySelectorAll('.hv-stats [data-count]'));
    if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    els.forEach((el) => { el.textContent = '0'; });
    const go = () => {
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        els.forEach((el) => { el.textContent = String(Math.round(+el.dataset.count * e)); });
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      setTimeout(() => els.forEach((el) => { el.textContent = el.dataset.count; }), dur + 200);
    };
    setTimeout(go, 900);
  }

  /* ---------- Home hero: the COAL label plays a different animation each time ---------- */
  function setupEyebrow() {
    const box = document.querySelector('.hv-eyebrow');
    const el = box && box.querySelector('.ey-t');
    if (!el) return;
    const badge = box.querySelector('.ey-coal');
    const HTML = el.innerHTML, TEXT = el.textContent;
    const INITIALS = new Set([0, 9, 24, 33]); // C, O, A, L
    const done = () => box.classList.add('decoded');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }

    let paused = false;
    const sleep = (ms) => new Promise((res) => { const t0 = Date.now(); const go = () => (paused ? setTimeout(go, 200) : Date.now() - t0 >= ms ? res() : setTimeout(go, Math.min(60, ms - (Date.now() - t0)))); go(); });
    const restore = () => { el.innerHTML = HTML; box.className = 'hv-eyebrow decoded'; };
    const rand = (pool) => pool[(Math.random() * pool.length) | 0];
    const setBadge = (chars) => { badge.innerHTML = chars.map((c, i) => `<i style="--i:${i}">${c}</i>`).join(''); badge.classList.remove('swap'); void badge.offsetWidth; badge.classList.add('swap'); };

    // 1. decode: random hex settles into the text, left to right
    async function decode(pool = '01ABCDEF', start = null) {
      const total = TEXT.length;
      for (let f = 0; f <= 24; f++) {
        const shown = Math.floor((f / 24) * total);
        el.textContent = [...TEXT].map((ch, k) => (k < shown || ch === ' ' || ch === '&' ? ch : start ? start[k] || rand(pool) : rand(pool))).join('');
        await sleep(45);
      }
      restore();
    }
    // 2. typewriter: erase, then type it back with a caret
    async function typewriter() {
      box.classList.add('typing');
      for (let n = TEXT.length; n >= 0; n -= 2) { el.textContent = TEXT.slice(0, n); await sleep(14); }
      await sleep(200);
      for (let n = 0; n <= TEXT.length; n++) { el.textContent = TEXT.slice(0, n); await sleep(32); }
      await sleep(300);
      restore();
    }
    // 3. wave: every letter rises and glows in turn
    async function wave() {
      el.innerHTML = [...TEXT].map((ch, k) => (ch === ' ' ? ' ' : `<span class="lt${INITIALS.has(k) ? ' ac' : ''}" style="--n:${k}">${ch === '&' ? '&amp;' : ch}</span>`)).join('');
      box.classList.add('wave');
      await sleep(TEXT.length * 28 + 700);
      restore();
    }
    // 4. binary: the ASCII codes of C O A L, then back to text
    async function binary() {
      badge.classList.add('hex'); setBadge(['43', '4F', '41', '4C']);
      const bin = '01000011 01001111 01000001 01001100';
      box.classList.add('bin');
      for (let f = 0; f < 10; f++) { el.textContent = [...bin].map((c) => (c === ' ' ? ' ' : Math.random() < 0.15 ? (c === '0' ? '1' : '0') : c)).join(''); await sleep(70); }
      el.textContent = bin; await sleep(900);
      box.classList.remove('bin');
      await decode('01');
      await sleep(400);
      badge.classList.remove('hex'); setBadge(['C', 'O', 'A', 'L']);
    }
    // 5. spotlight: everything dims except the four initials
    async function spotlight() {
      box.classList.add('spot');
      await sleep(1900);
      restore();
    }

    const effects = [decode, spotlight, typewriter, wave, binary];
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { paused = !e.isIntersecting || document.hidden; }).observe(box);
    document.addEventListener('visibilitychange', () => { paused = document.hidden; });
    (async () => {
      await decode();
      done();
      for (let i = 1; ; i = (i + 1) % effects.length) { await sleep(4200); await effects[i](); }
    })();
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    setupPrism();
    icons();
    setupNav();
    setupScroll();
    setupSmoothAnchors();
    setupCopy();
    setupSearch();
    setupLightbox();
    setupToolsSpy();
    setupHeroDemo();
    setupCountUp();
    setupEyebrow();
    renderMermaid();
    if (window.COAL_WIDGETS) window.COAL_WIDGETS.init();
    icons();
  });
})();

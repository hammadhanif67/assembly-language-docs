/* COAL Documentation — site behaviour (no framework). */
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

  /* ---------- Sidebar ---------- */
  function setupSidebar() {
    $$('.nav-group-btn').forEach((btn) => btn.addEventListener('click', () => {
      const g = btn.parentElement; const open = g.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    }));
    const toggle = $('.nav-toggle'), scrim = $('.scrim');
    if (!toggle) return;
    const set = (open) => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (scrim) scrim.hidden = !open;
      if (open) { const a = $('.sidebar a.active') || $('.sidebar a, .sidebar button'); a && a.focus(); }
    };
    toggle.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
    scrim && scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { set(false); toggle.focus(); } });
    const active = $('.sidebar a.active');
    const scroller = $('.sidebar nav');
    if (active && scroller) {
      const r = active.getBoundingClientRect(), s = scroller.getBoundingClientRect();
      scroller.scrollTop += r.top - s.top - s.height / 2 + r.height / 2;
    }

    // Filter lessons: hide non-matching lessons, open chapters that contain matches
    const filter = $('.nav-filter input'), empty = $('.nav-empty');
    if (filter) {
      const groups = $$('.nav-group');
      const state = groups.map((g) => g.classList.contains('open'));
      filter.addEventListener('input', () => {
        const q = filter.value.trim().toLowerCase();
        let any = false;
        groups.forEach((g, gi) => {
          const chTitle = $('.ch-title', g).textContent.toLowerCase();
          const chMatch = q && chTitle.includes(q);
          let hits = 0;
          $$('.nav-items li', g).forEach((li) => {
            const show = !q || chMatch || li.textContent.toLowerCase().includes(q);
            li.classList.toggle('filtered-out', !show);
            if (show) hits++;
          });
          g.classList.toggle('filtered-out', !!q && hits === 0);
          const open = q ? hits > 0 : state[gi];
          g.classList.toggle('open', open);
          $('.nav-group-btn', g).setAttribute('aria-expanded', String(open));
          if (hits) any = true;
        });
        if (empty) empty.hidden = !q || any;
      });
      filter.addEventListener('keydown', (e) => { if (e.key === 'Escape') { filter.value = ''; filter.dispatchEvent(new Event('input')); } });
    }
  }

  /* ---------- Progress, back to top, TOC scrollspy ---------- */
  function setupScroll() {
    const bar = $('.progress-bar'), top = $('.back-to-top');
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (top) top.classList.toggle('show', h.scrollTop > 600);
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

  /* ---------- Lightbox for original slides & photos ---------- */
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

  /* ---------- Animations (GSAP; skipped for reduced motion) ---------- */
  function setupAnimations() {
    if (!window.gsap || reduceMotion) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const head = $$('.doc-head > *');
    if (head.length) gsap.from(head, { y: 14, opacity: 0, duration: .55, stagger: .06, ease: 'power2.out', clearProps: 'all' });
    if ($('.hero')) {
      gsap.from('.hero-copy > *', { y: 22, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out', clearProps: 'all' });
      gsap.from('.hero-term', { x: 30, opacity: 0, duration: .9, delay: .2, ease: 'power3.out', clearProps: 'all' });
    }
  }

  /* ---------- Home: typed terminal ---------- */
  function setupHero() {
    const target = $('#typed-target'); if (!target) return;
    const lines = ['.model small', '.data', "msg db 'Hello, COAL!$'", '.code', 'main proc', '    mov ax, @data   ; AX = 0B3Fh', '    mov ds, ax      ; DS = 0B3Fh', '    lea dx, msg     ; DX = 0002h', '    mov ah, 09h', '    int 21h         ; print string', '    mov ax, 4C00h', '    int 21h', 'main endp', 'end main'];
    const regs = { ax: $('[data-reg="ax"]'), ds: $('[data-reg="ds"]'), dx: $('[data-reg="dx"]'), ip: $('[data-reg="ip"]') };
    const steps = [[5, 'ax', '0B3F'], [6, 'ds', '0B3F'], [7, 'dx', '0002'], [8, 'ax', '093F'], [10, 'ax', '4C00']];
    const flash = (k, v) => { const el = regs[k]; if (!el) return; el.textContent = v; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 600); };
    if (reduceMotion) { target.textContent = lines.join('\n'); steps.forEach(([, k, v]) => regs[k] && (regs[k].textContent = v)); return; }
    // Type line by line; when a line finishes "executing", update the register strip.
    const cursor = document.createElement('span'); cursor.className = 'typed-cursor'; cursor.textContent = '█';
    const text = document.createTextNode('');
    target.append(text, cursor);
    let line = 0, ch = 0, ip = 0x100;
    const tick = () => {
      if (line >= lines.length) { cursor.style.animation = 'blink 1s steps(1) infinite'; return; }
      const l = lines[line];
      if (ch < l.length) { text.data += l[ch++]; setTimeout(tick, 18 + Math.random() * 30); return; }
      line++; ch = 0; ip += 2;
      if (regs.ip) regs.ip.textContent = ip.toString(16).toUpperCase().padStart(4, '0');
      steps.filter(([n]) => n === line - 1).forEach(([, k, v]) => flash(k, v));
      if (line < lines.length) text.data += '\n';
      setTimeout(tick, 180);
    };
    setTimeout(tick, 600);
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    setupPrism();
    icons();
    setupSidebar();
    setupScroll();
    setupSmoothAnchors();
    setupCopy();
    setupSearch();
    setupLightbox();
    renderMermaid();
    setupHero();
    if (window.COAL_WIDGETS) window.COAL_WIDGETS.init();
    icons();
  });
})();

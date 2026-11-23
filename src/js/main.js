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

  /* ---------- Home hero: an 8086 program that runs on screen ---------- */
  function setupHeroDemo() {
    const demo = $('.cpu-demo');
    if (!demo) return;
    const lines = $$('.cd-line', demo), stages = $$('.cd-stage', demo);
    const reg = (n) => $(`[data-reg="${n}"]`, demo);
    const hex = (n) => n.toString(16).toUpperCase().padStart(4, '0');
    // trace of: mov cx,5 / mov ax,0 / L1: add ax,cx / loop L1 / hlt
    const steps = [[0, { CX: 5, IP: 0x0000 }], [1, { AX: 0, IP: 0x0003 }]];
    let ax = 0;
    for (let cx = 5; cx >= 1; cx--) { ax += cx; steps.push([2, { AX: ax, IP: 0x0006 }]); steps.push([3, { CX: cx - 1, IP: 0x0008 }]); }
    steps.push([4, { IP: 0x000a }]);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { AX: 0, CX: 0, IP: 0, cyc: 0 };
    const show = (k) => { const el = reg(k); if (!el) return; el.textContent = k === 'cyc' ? String(state.cyc) : hex(state[k]); };
    const flash = (k) => { const el = reg(k); if (!el) return; const box = el.closest('.cd-reg'); box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash'); };
    if (still) { // final state, no motion
      Object.assign(state, { AX: 15, CX: 0, IP: 0x000a, cyc: steps.length }); ['AX', 'CX', 'IP', 'cyc'].forEach(show);
      lines[4].classList.add('on'); demo.classList.add('done'); return;
    }
    let i = 0, timer = null, visible = true;
    const tick = () => {
      if (i >= steps.length) { // pause on the result, then run again
        demo.classList.add('done');
        timer = setTimeout(() => { demo.classList.remove('done'); i = 0; Object.assign(state, { AX: 0, CX: 0, IP: 0, cyc: 0 }); ['AX', 'CX', 'IP', 'cyc'].forEach(show); tick(); }, 2600);
        return;
      }
      const [ln, regs] = steps[i++];
      lines.forEach((l, k) => l.classList.toggle('on', k === ln));
      stages.forEach((s) => { s.classList.remove('run'); void s.offsetWidth; s.classList.add('run'); });
      Object.entries(regs).forEach(([k, v]) => { const changed = state[k] !== v; state[k] = v; show(k); if (changed && k !== 'IP') flash(k); });
      state.cyc++; show('cyc'); show('IP');
      timer = setTimeout(tick, 1150);
    };
    const start = () => { if (!timer && visible && !document.hidden) tick(); };
    const stop = () => { clearTimeout(timer); timer = null; };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(demo);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
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
    renderMermaid();
    if (window.COAL_WIDGETS) window.COAL_WIDGETS.init();
    icons();
  });
})();

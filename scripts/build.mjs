// COAL Docs, static site builder.
// Reads content/<chapter>/*.md, renders with marked, writes plain HTML into dist/.
// Page types: home (index.html), chapter overview (<chapter>/index.html), lesson (<chapter>/<lesson>.html), 404.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
// photo credits (Wikimedia Commons): file → { title, page, license, artist }
const IMAGE_CREDITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'image-credits.json'), 'utf8'));
const SITE = {
  name: 'COAL Docs',
  full: 'Computer Organization & Assembly Language',
  repo: 'https://github.com/hammadhanif67/assembly-language-docs',
  base: '/assembly-language-docs/',
};

const CDN = {
  prism: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0',
  fuse: 'https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js',
  lucide: 'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js',
  mermaid: 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js',
  fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
};

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slugify = (s) => decode(stripTags(s)).toLowerCase().replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
const noNum = (s) => s.replace(/^\d+-/, '');
const pad = (n) => String(n).padStart(2, '0');
const isRefs = (t) => /^(sources|references)$/i.test(t.trim());

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const data = {};
  if (!m) return { data, body: raw };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    data[k] = v;
  }
  return { data, body: raw.slice(m[0].length) };
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

// ---------- diagrams ----------
const DIAGRAM_DIR = path.join(SRC, 'diagrams');
const usedDiagrams = new Set();

function renderDiagram(name, caption) {
  usedDiagrams.add(name);
  const file = path.join(DIAGRAM_DIR, `${name}.svg`);
  let inner;
  if (fs.existsSync(file)) {
    inner = fs.readFileSync(file, 'utf8').replace(/<\?xml[^>]*>/, '').trim().replace('<svg', `<svg role="img" aria-label="${esc(caption)}"`);
  } else {
    console.warn(`  ! missing diagram ${name}.svg`);
    inner = `<p class="diagram-missing">Diagram “${esc(name)}” is missing.</p>`;
  }
  return `<figure class="diagram" id="fig-${esc(name)}"><div class="diagram-canvas">${inner}</div><figcaption>${esc(caption)}</figcaption></figure>`;
}

// ---------- markdown ----------
function makeMarked(toc) {
  const used = new Map();
  const md = new Marked({ gfm: true, breaks: false });
  let sec = 0;
  md.use({
    renderer: {
      heading(text, depth, raw) {
        let id = slugify(raw);
        const n = used.get(id) || 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        const plain = stripTags(text);
        if (depth === 2 || depth === 3) toc.push({ id, text: isRefs(plain) ? 'References' : plain, depth });
        const anchor = depth > 1 ? `<a class="h-anchor" href="#${id}" aria-label="Link to this section">#</a>` : '';
        if (depth === 2 && isRefs(plain)) return `<h2 id="${id}" class="refs-h2">References${anchor}</h2>\n`;
        if (depth === 2) {
          sec++;
          return `<h2 id="${id}"><span class="sec-num" aria-hidden="true">${pad(sec)}</span><span class="sec-text">${text}</span>${anchor}</h2>\n`;
        }
        return `<h${depth} id="${id}">${text}${anchor}</h${depth}>\n`;
      },
      code(code, lang) {
        const l = (lang || '').trim().toLowerCase();
        if (l === 'mermaid') return `<div class="mermaid-wrap"><pre class="mermaid">${esc(code)}</pre></div>`;
        const map = { asm: 'nasm', masm: 'nasm', x86: 'nasm', nasm: 'nasm', '': 'none', text: 'none', c: 'c' };
        const pl = map[l] || l;
        const label = l === '' || l === 'text' ? 'Text' : ['nasm', 'masm', 'x86', 'asm'].includes(l) ? 'Assembly' : l.toUpperCase();
        return `<div class="code-block"><div class="code-head"><span class="code-lang">${esc(label)}</span><button class="copy-btn" type="button" aria-label="Copy code"><i data-lucide="copy"></i><span>Copy</span></button></div><pre class="line-numbers language-${esc(pl)}"><code class="language-${esc(pl)}">${esc(code)}</code></pre></div>`;
      },
      table(header, body) {
        return `<div class="table-wrap" tabindex="0"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
      },
    },
  });
  return md;
}

function preprocess(body, prefix, raws) {
  const keep = (html) => `\n\nCOALRAW${raws.push(html) - 1}X\n\n`;
  const photo = (file, caption) =>
    `<figure class="photo"><button class="photo-zoom" type="button" data-src="${prefix}assets/img/${esc(file)}" data-caption="${esc(caption)}" aria-label="Enlarge image: ${esc(caption)}"><img src="${prefix}assets/img/${esc(file)}" alt="${esc(caption)}" loading="lazy" decoding="async"></button><figcaption>${esc(caption)}</figcaption></figure>`;
  return body.replace(/^:::(diagram|figures|figure|widget|note|tip|warning|answer)(?:[ \t]+([^\n]+))?\n([\s\S]*?)\n:::[ \t]*$/gm, (_, kind, arg = '', text) => {
    const caption = text.trim().replace(/^Figure:\s*/, '');
    arg = arg.trim();
    // :::figures, one row of photos, each line "file.jpg | caption"
    if (kind === 'figures')
      return keep(`<div class="photo-row">${caption.split('\n').map((l) => l.split('|').map((x) => x.trim())).map(([f, c]) => photo(f, c || '')).join('')}</div>`);
    if (kind === 'diagram') return keep(renderDiagram(arg, caption));
    if (kind === 'figure') {
      const [file, mode] = arg.split(/\s+/);
      const cr = IMAGE_CREDITS[file];
      const credit = cr ? `<span class="photo-credit">Photo: <a href="${esc(cr.page)}" target="_blank" rel="noopener">${esc(cr.artist || 'Wikimedia Commons')}</a> · ${esc(cr.license)} · cropped</span>` : '';
      return keep(`<figure class="photo${mode === 'side' ? ' photo--side' : ''}"><button class="photo-zoom" type="button" data-src="${prefix}assets/img/${esc(file)}" data-caption="${esc(caption)}" aria-label="Enlarge image: ${esc(caption)}"><img src="${prefix}assets/img/${esc(file)}" alt="${esc(caption)}" width="880" height="660" loading="lazy" decoding="async"></button><figcaption>${esc(caption)}${credit}</figcaption></figure>`);
    }
    if (kind === 'widget') return keep(`<figure class="widget-figure"><div class="widget" data-widget="${esc(arg)}"></div><figcaption>${esc(caption)}</figcaption></figure>`);
    const icon = { note: 'info', tip: 'lightbulb', warning: 'triangle-alert', answer: 'circle-check' }[kind];
    const label = { note: 'Note', tip: 'Tip', warning: 'Watch out', answer: 'Answer' }[kind];
    return `\n<div class="callout callout--${kind}"><p class="callout-label"><i data-lucide="${icon}" aria-hidden="true"></i>${label}</p><div class="callout-body">\n\n${text.trim()}\n\n</div></div>\n`;
  });
}

// ---------- load content ----------
const chapters = JSON.parse(fs.readFileSync(path.join(CONTENT, 'chapters.json'), 'utf8'));
const pages = [];
for (const ch of chapters) {
  const dir = path.join(CONTENT, ch.dir);
  ch.slug = noNum(ch.dir);
  ch.url = `${ch.slug}/index.html`;
  ch.pages = [];
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const { data, body } = parseFrontMatter(fs.readFileSync(path.join(dir, f), 'utf8'));
    const page = { ...data, body, chapter: ch, slug: noNum(f.replace(/\.md$/, '')) };
    page.url = `${ch.slug}/${page.slug}.html`;
    ch.pages.push(page);
    pages.push(page);
  }
}
const chs = chapters.filter((c) => c.pages.length);
chs.forEach((c, i) => (c.num = i + 1));

// Render every lesson body first (needed for reading time + TOC on chapter pages)
for (const page of pages) {
  const toc = [];
  const raws = [];
  let html = makeMarked(toc).parse(preprocess(page.body, '../', raws));
  html = html.replace(/<p>COALRAW(\d+)X<\/p>|COALRAW(\d+)X/g, (_, a, b) => raws[Number(a ?? b)]);
  page.html = html;
  page.toc = toc;
  const text = decode(stripTags(html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<div class="mermaid-wrap">[\s\S]*?<\/div>/g, ' ').replace(/<a class="h-anchor"[^>]*>#<\/a>/g, '').replace(/<\/(p|li|h\d|td|th|figcaption)>/g, ' '))).replace(/\s+/g, ' ').trim();
  page.text = text;
  page.minutes = Math.max(1, Math.round(text.split(' ').length / 220));
  page.sections = toc.filter((t) => t.depth === 2 && t.text !== 'References').length;
}

// ---------- shared template parts ----------
const LOGO = fs.readFileSync(path.join(SRC, 'logo.svg'), 'utf8');
const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<marker id="d-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" style="fill:var(--d-stroke)"/></marker>
<marker id="d-arrowhead-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" style="fill:var(--d-accent)"/></marker>
<marker id="d-arrowhead-mut" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" style="fill:var(--d-muted)"/></marker>
</defs></svg>`;

function head({ title, description, prefix }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || SITE.full)}">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${prefix}assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${prefix}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${CDN.fonts}">
<link rel="stylesheet" href="${CDN.prism}/plugins/line-numbers/prism-line-numbers.min.css">
<link rel="stylesheet" href="${prefix}css/main.css">
</head>`;
}

function indexPanel(prefix, current) {
  const cols = chs
    .map(
      (c) => `<section class="ix-chapter${current && current.chapter === c ? ' is-current is-open' : ''}">
  <div class="ix-row"><a class="ix-head" href="${prefix}${c.url}"><span class="ix-num">${pad(c.num)}</span><span class="ix-title">${esc(c.title)}</span></a><button class="ix-exp" type="button" aria-expanded="${current && current.chapter === c ? 'true' : 'false'}" aria-label="Lessons in ${esc(c.title)}"><i data-lucide="chevron-down" aria-hidden="true"></i></button></div>
  <ol class="ix-lessons">${c.pages.map((p) => `<li><a href="${prefix}${p.url}"${current === p ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`).join('')}</ol>
</section>`
    )
    .join('');
  return `<div class="index-panel" id="index-panel" hidden>
  <div class="index-inner">
    <div class="ix-drawer-head"><a class="brand" href="${prefix}index.html">${LOGO.replaceAll('coal-logo', 'coal-logo-d')}<span class="brand-name">COAL<span class="brand-docs">Docs</span></span></a><button class="ix-drawer-close" type="button" aria-label="Close menu"><i data-lucide="x"></i></button></div>
    <nav class="ix-quick" aria-label="Quick links"><a href="${prefix}index.html"><i data-lucide="house"></i>Home</a><a href="${prefix}index.html#chapters"><i data-lucide="list"></i>Chapters</a><a href="${prefix}tools/index.html"><i data-lucide="calculator"></i>Calculators</a><a href="${prefix}solved-problems/index.html"><i data-lucide="pencil-ruler"></i>Solved problems</a><button type="button" data-search-open><i data-lucide="search"></i>Search</button></nav>
    <div class="index-top"><p class="eyebrow">Index · ${chs.length} chapters · ${pages.length} lessons</p><button class="index-close" type="button" aria-label="Close index"><i data-lucide="x"></i></button></div>
    <div class="index-grid">${cols}</div>
  </div>
</div>`;
}

function header(prefix, current = null) {
  return `${SVG_DEFS}<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><div class="progress-bar"></div></div>
<header class="site-header">
  <div class="hdr">
    <a class="brand" href="${prefix}index.html" aria-label="${SITE.name} home">${LOGO}<span class="brand-name">COAL<span class="brand-docs">Docs</span></span></a>
    <nav class="hdr-nav" aria-label="Main">
      <button class="index-toggle" type="button" aria-expanded="false" aria-controls="index-panel"><span>Index</span><i data-lucide="chevron-down" aria-hidden="true"></i></button>
      <a class="hdr-link" href="${prefix}index.html#chapters">Chapters</a>
      <a class="hdr-link" href="${prefix}tools/index.html">Tools</a>
      <a class="hdr-link" href="${prefix}solved-problems/index.html">Solved</a>
      <a class="hdr-link" href="${prefix}${pages[0].url}">Start</a>
    </nav>
    <button class="search-trigger" type="button" aria-label="Search" data-search-open><i data-lucide="search" aria-hidden="true"></i><span class="search-trigger-text">Search</span><kbd>Ctrl K</kbd></button>
    <a class="icon-btn hdr-gh" href="${SITE.repo}" target="_blank" rel="noopener" aria-label="GitHub repository"><i data-lucide="github"></i></a>
    <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="index-panel" aria-label="Open menu"><i data-lucide="menu" class="mi-open"></i><i data-lucide="x" class="mi-close"></i></button>
  </div>
  ${indexPanel(prefix, current)}
</header>`;
}

function footer(prefix, extraScripts = '') {
  const link = (c) => `<li><a href="${prefix}${c.url}"><span>${pad(c.num)}</span>${esc(c.title)}</a></li>`;
  const learn = chs.filter((c) => c.num <= 5).map(link).join('');
  const program = chs.filter((c) => c.num > 5).map(link).join('');
  const solvedCh = chs.find((c) => c.dir === '09-solved-problems');
  const formula = solvedCh && solvedCh.pages[0];
  const mark = LOGO.replaceAll('coal-logo', 'coal-logo-m').replace('<svg', '<svg class="ftr-mark-svg" aria-hidden="true" focusable="false"');
  return `<footer class="site-footer">
  <div class="ftr-mark" aria-hidden="true">${mark}</div>
  <div class="ftr-top">
    <div class="ftr-brand">
      <a class="brand" href="${prefix}index.html">${LOGO.replaceAll('coal-logo', 'coal-logo-f')}<span class="brand-name">COAL<span class="brand-docs">Docs</span></span></a>
      <p>${SITE.full}. Lessons, diagrams, calculators and solved problems, from computer generations down to the 8086 instruction set.</p>
    </div>
    <nav class="ftr-nav" aria-label="Computer organization chapters"><p class="eyebrow">Learn</p><ol>${learn}</ol></nav>
    <nav class="ftr-nav" aria-label="Assembly chapters"><p class="eyebrow">Program &amp; practise</p><ol>${program}</ol></nav>
    <nav class="ftr-nav" aria-label="Resources"><p class="eyebrow">Resources</p><ul>
      <li><a href="${prefix}tools/index.html"><i data-lucide="calculator" aria-hidden="true"></i>Calculators</a></li>
      ${formula ? `<li><a href="${prefix}${formula.url}"><i data-lucide="sigma" aria-hidden="true"></i>Formula sheet</a></li>` : ''}
      ${solvedCh ? `<li><a href="${prefix}${solvedCh.url}"><i data-lucide="pencil-ruler" aria-hidden="true"></i>Solved problems</a></li>` : ''}
      <li><button type="button" class="link-btn" data-index-open><i data-lucide="list-tree" aria-hidden="true"></i>Full index</button></li>
      <li><a href="${SITE.repo}" target="_blank" rel="noopener"><i data-lucide="github" aria-hidden="true"></i>Source on GitHub</a></li>
    </ul></nav>
  </div>
  <div class="ftr-bottom">
    <p>© ${new Date().getFullYear()} COAL Docs · Code MIT · Photos from Wikimedia Commons, credited on each page</p>
  </div>
</footer>
<button class="back-to-top" type="button" aria-label="Back to top"><svg class="btt-ring" viewBox="0 0 48 48" aria-hidden="true"><circle class="btt-track" cx="24" cy="24" r="22"/><circle class="btt-prog" cx="24" cy="24" r="22"/></svg><i data-lucide="arrow-up"></i></button>
<div class="search-modal" role="dialog" aria-modal="true" aria-label="Search" hidden>
  <div class="search-panel">
    <div class="search-box"><i data-lucide="search" aria-hidden="true"></i><input type="search" placeholder="Search lessons, registers, instructions…" aria-label="Search" autocomplete="off" spellcheck="false"><button class="icon-btn" type="button" data-search-close aria-label="Close search"><kbd>Esc</kbd></button></div>
    <ul class="search-results" role="listbox" aria-label="Results"></ul>
    <div class="search-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span></div>
  </div>
</div>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden><button class="icon-btn lightbox-close" type="button" aria-label="Close"><i data-lucide="x"></i></button><figure><img alt=""><figcaption></figcaption></figure></div>
<script>window.COAL_PREFIX=${JSON.stringify(prefix)};</script>
<script src="${prefix}search-index.js" defer></script>
<script src="${CDN.lucide}" defer></script>
<script src="${CDN.fuse}" defer></script>
<script src="${CDN.prism}/prism.min.js" data-manual defer></script>
<script src="${CDN.prism}/components/prism-nasm.min.js" defer></script>
<script src="${CDN.prism}/plugins/line-numbers/prism-line-numbers.min.js" defer></script>
<script src="${prefix}js/widgets.js" defer></script>
${extraScripts}
<script src="${prefix}js/main.js" defer></script>
</body>
</html>`;
}

const writePage = (rel, html) => {
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
};

// ---------- lesson page ----------
const searchIndex = [];

function renderLesson(page, i) {
  const prefix = '../';
  const ch = page.chapter;
  const idx = ch.pages.indexOf(page);
  const prev = pages[i - 1], next = pages[i + 1];
  const tocItems = page.toc.map((t) => `<li class="toc-l${t.depth}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('');
  const tocHtml = page.toc.length ? `<nav class="toc" aria-label="On this page"><p class="eyebrow">On this page</p><ol>${tocItems}</ol></nav>` : '';
  const strip = `<nav class="lesson-strip" aria-label="Lessons in ${esc(ch.title)}">
  <div class="ls-bar"><span class="ls-label">Lessons in this chapter</span>
    <span class="ls-arrows"><button class="ls-arrow" type="button" data-dir="-1" aria-label="Scroll lessons left"><i data-lucide="chevron-left"></i></button><button class="ls-arrow" type="button" data-dir="1" aria-label="Scroll lessons right"><i data-lucide="chevron-right"></i></button></span></div>
  <ol class="ls-tabs">${ch.pages
    .map((p, k) => `<li><a href="${prefix}${p.url}"${p === page ? ' aria-current="page"' : k < idx ? ' class="is-done"' : ''}><span class="ls-n">${pad(k + 1)}</span><span class="ls-t">${esc(p.title)}</span></a></li>`)
    .join('')}</ol></nav>`;
  const pager = `<nav class="pager" aria-label="Previous and next lesson">${
    prev ? `<a class="pager-link" href="${prefix}${prev.url}" rel="prev"><span class="eyebrow"><i data-lucide="arrow-left"></i>Previous</span><span class="pager-title">${esc(prev.title)}</span></a>` : '<span></span>'
  }${next ? `<a class="pager-link pager-next" href="${prefix}${next.url}" rel="next"><span class="eyebrow">Next<i data-lucide="arrow-right"></i></span><span class="pager-title">${esc(next.title)}</span></a>` : '<span></span>'}</nav>`;
  const usesMermaid = /class="mermaid"/.test(page.html);
  const out = `${head({ title: `${page.title} | ${SITE.name}`, description: page.description, prefix })}
<body class="lesson-page${page.research ? ' is-research' : ''}">
${header(prefix, page)}
<main id="main" tabindex="-1">
  <div class="wrap">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${prefix}index.html">Home</a></li><li><a href="${prefix}${ch.url}">${pad(ch.num)} ${esc(ch.title)}</a></li><li aria-current="page">${esc(page.title)}</li></ol></nav>
    <header class="lesson-head">
      <div class="lh-meta">
        <p class="lh-chapter"><span class="lh-num">${pad(ch.num)}.${idx + 1}</span></p>
        <p class="eyebrow">${esc(ch.title)}<br>Lesson ${idx + 1} of ${ch.pages.length}</p>
      </div>
      <div class="lh-main">
        <h1>${esc(page.title)}</h1>
        ${page.description ? `<p class="lede">${esc(page.description)}</p>` : ''}
        <p class="lh-facts">${page.sections ? `<span>${page.sections} sections</span>` : ''}${page.research ? '<span class="tag-research">Researched topic</span>' : ''}</p>
      </div>
    </header>
    ${strip}
    <div class="lesson-grid">
      <article class="doc-body">
${tocHtml ? `<details class="toc-mobile"><summary>On this page</summary><ol>${tocItems}</ol></details>` : ''}
${page.html}
      </article>
      ${tocHtml ? `<aside class="toc-rail">${tocHtml}</aside>` : ''}
    </div>
    ${pager}
  </div>
</main>
${footer(prefix, usesMermaid ? `<script src="${CDN.mermaid}" defer></script>` : '')}`;
  writePage(page.url, out);
  searchIndex.push({ t: page.title, u: page.url, c: ch.title, r: !!page.research, h: page.toc.map((x) => x.text).join(' · '), hs: page.toc.map((x) => [x.text, x.id]), x: page.text.slice(0, 6000) });
}

// ---------- chapter overview page ----------
function renderChapter(ch, ci) {
  const prefix = '../';
  const nextCh = chs[ci + 1], prevCh = chs[ci - 1];
  const total = ch.pages.reduce((s, p) => s + p.minutes, 0);
  const rows = ch.pages
    .map(
      (p, k) => `<li><a class="lesson-row" href="${prefix}${p.url}">
  <span class="lr-num">${pad(ch.num)}.${k + 1}</span>
  <span class="lr-body"><span class="lr-title">${esc(p.title)}${p.research ? ' <span class="tag-research">Researched</span>' : ''}</span><span class="lr-desc">${esc(p.description || '')}</span></span>
  <i data-lucide="arrow-right" aria-hidden="true"></i>
</a></li>`
    )
    .join('');
  const out = `${head({ title: `${ch.title} | ${SITE.name}`, description: ch.summary, prefix })}
<body class="chapter-page">
${header(prefix)}
<main id="main" tabindex="-1">
  <div class="wrap">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${prefix}index.html">Home</a></li><li aria-current="page">Chapter ${pad(ch.num)}</li></ol></nav>
    <header class="chapter-head">
      <p class="ch-big" aria-hidden="true">${pad(ch.num)}</p>
      <div>
        <p class="eyebrow">Chapter ${pad(ch.num)} of ${pad(chs.length)}</p>
        <h1>${esc(ch.title)}</h1>
        <p class="lede">${esc(ch.summary || '')}</p>
        <p class="lh-facts"><span>${ch.pages.length} lessons</span></p>
        <a class="btn btn--primary" href="${prefix}${ch.pages[0].url}">Start chapter<i data-lucide="arrow-right"></i></a>
      </div>
    </header>
    <ol class="lesson-list">${rows}</ol>
    <nav class="pager" aria-label="Other chapters">${
      prevCh ? `<a class="pager-link" href="${prefix}${prevCh.url}"><span class="eyebrow"><i data-lucide="arrow-left"></i>Chapter ${pad(prevCh.num)}</span><span class="pager-title">${esc(prevCh.title)}</span></a>` : '<span></span>'
    }${nextCh ? `<a class="pager-link pager-next" href="${prefix}${nextCh.url}"><span class="eyebrow">Chapter ${pad(nextCh.num)}<i data-lucide="arrow-right"></i></span><span class="pager-title">${esc(nextCh.title)}</span></a>` : '<span></span>'}</nav>
  </div>
</main>
${footer(prefix)}`;
  writePage(ch.url, out);
}

// ---------- tools (calculator workbench) ----------
const TOOL_GROUPS = [
  ['Numbers', [
    ['base', 'tool-base', 'Number converter', 'Decimal, hexadecimal, binary and octal in one place, for 8, 16 or 32 bits, with clickable bits.', 'binary'],
    ['twos', 'tool-twos', 'Two’s complement', 'See how a negative number is stored, step by step: invert the bits, add one.', 'minus'],
    ['ieee', 'tool-ieee', 'IEEE 754 floating point', 'Turn a decimal number into its sign, exponent and fraction bits, or back again.', 'sigma'],
    ['ascii', 'tool-ascii', 'ASCII codes', 'Characters to codes and codes to characters, ready to paste into a DB directive.', 'type'],
  ]],
  ['Instructions', [
    ['alu', 'tool-alu', 'ALU & flags', 'Run ADD, SUB, CMP, AND, OR, XOR, INC, DEC or NEG and see CF, ZF, SF, OF, PF and AF.', 'flag'],
    ['shift', 'tool-shift', 'Shift & rotate', 'SHL, SHR, SAR, ROL, ROR, RCL and RCR, bit by bit with the carry flag.', 'arrow-left-right'],
    ['muldiv', 'tool-muldiv', 'MUL & DIV', 'Exactly which registers hold the product, quotient and remainder, and when division overflows.', 'divide'],
  ]],
  ['Memory & addressing', [
    ['segoff', 'tool-segoff', 'Segment : offset', 'Physical address from segment and offset, or solve for the missing one.', 'map-pin'],
    ['ea', 'tool-ea', 'Effective address', 'Pick an 8086 addressing mode and register values; get the EA, segment and physical address.', 'crosshair'],
    ['memory', 'tool-memory', 'Address bus & memory size', 'How much memory n address lines can reach, and how many lines a memory needs.', 'memory-stick'],
    ['cache', 'tool-cache', 'Cache address split', 'Break an address into tag, index and offset for any cache size and mapping.', 'layers'],
  ]],
  ['Data units & performance', [
    ['units', 'tool-units', 'Data units: bits to TB', 'Bits, nibbles, bytes, KB, MB, GB, TB and PB, binary (1024) or decimal (1000), with every multiply and divide shown.', 'ruler'],
    ['transfer', 'tool-transfer', 'Transfer time', 'How long a file takes at a given speed: size in bits ÷ bits per second, step by step.', 'timer'],
    ['perf', 'tool-perf', 'CPU time, CPI & MIPS', 'The CPU performance equation from clock rate, instruction count and CPI or an instruction mix.', 'gauge'],
    ['pipeline', 'tool-pipeline', 'Pipeline speed-up', 'Time with and without a k-stage pipeline, speed-up, efficiency and throughput.', 'git-commit-horizontal'],
    ['amat', 'tool-amat', 'Cache access time', 'Hit ratio and average memory access time for hierarchical or simultaneous access.', 'zap'],
  ]],
];

// the formula each calculator uses, shown with it (HTML)
const TOOL_FORMULA = {
  base: ['N = Σ d<sub>i</sub> × b<sup>i</sup>', 'decimal → base b: divide by b, read remainders bottom to top'],
  twos: ['−x = (NOT x) + 1', '= 2<sup>n</sup> − x'],
  ieee: ['value = (−1)<sup>S</sup> × 1.F × 2<sup>E − bias</sup>', 'bias = 127 (single), 1023 (double)'],
  ascii: ["'A' = 41h, 'a' = 61h = 'A' + 20h", "'0' = 30h, digit = code − 30h"],
  alu: ['result = destination op source', 'CF: unsigned carry · OF: signed overflow · ZF: result = 0'],
  shift: ['SHL n: x × 2<sup>n</sup>', 'SHR n: x ÷ 2<sup>n</sup> · SAR n: signed x ÷ 2<sup>n</sup>'],
  muldiv: ['MUL: AX = AL × src · DX:AX = AX × src', 'DIV: AL = AX ÷ src, AH = remainder'],
  segoff: ['Physical address = Segment × 10h + Offset', 'Offset = PA − Segment × 10h'],
  ea: ['EA = Base + Index + Displacement', 'PA = Segment × 10h + EA'],
  memory: ['Memory size = 2<sup>n</sup> bytes', 'n = log₂(size in bytes)'],
  cache: ['offset = log₂(block) · index = log₂(lines ÷ ways)', 'tag = address bits − index − offset'],
  units: ['1 B = 8 bits · 1 KB = 2<sup>10</sup> B = 1024 B', 'to a bigger unit ÷ 1024 · to a smaller unit × 1024'],
  transfer: ['time = (size in bytes × 8) ÷ speed in bits/s', '1 Mbps = 10<sup>6</sup> bits/s'],
  perf: ['CPU time = IC × CPI × T = IC × CPI ÷ f', 'MIPS = f ÷ (CPI × 10<sup>6</sup>)'],
  pipeline: ['T<sub>pipe</sub> = (k + n − 1) × τ', 'speed-up = (n × k × τ) ÷ T<sub>pipe</sub>'],
  amat: ['T = h × T<sub>c</sub> + (1 − h) × (T<sub>c</sub> + T<sub>m</sub>)', 'simultaneous: T = h × T<sub>c</sub> + (1 − h) × T<sub>m</sub>'],
};
const formulaHTML = (id, cls = 'tp-formula') => (TOOL_FORMULA[id] ? `<p class="${cls}"><span class="tf-label">Formula</span>${TOOL_FORMULA[id].map((x) => `<span class="tf-eq">${x}</span>`).join('')}</p>` : '');

function renderTools() {
  const prefix = '../';
  const all = TOOL_GROUPS.flatMap(([, t]) => t);
  const nav = TOOL_GROUPS.map(([g, list]) => `<p class="eyebrow">${g}</p><ol>${list.map(([id, , title]) => `<li><a href="#${id}">${title}</a></li>`).join('')}</ol>`).join('');
  let n = 0;
  const panels = TOOL_GROUPS.map(([g, list]) => `<h2 class="tools-group">${g}</h2>` + list.map(([id, widget, title, desc, icon]) => {
    n++;
    return `<section class="tool-panel" id="${id}" aria-labelledby="${id}-t">
  <header class="tp-head"><span class="tp-num">${pad(n)}</span><div><h3 id="${id}-t"><i data-lucide="${icon}" aria-hidden="true"></i>${title}</h3><p>${desc}</p>${formulaHTML(id)}</div></header>
  <div class="widget tool-widget" data-widget="${widget}"></div>
</section>`;
  }).join('')).join('');
  const out = `${head({ title: `Calculators & Tools, ${SITE.name}`, description: 'Calculators for computer organization and assembly: number bases, two’s complement, flags, shifts, MUL/DIV, segment:offset, effective address, IEEE 754, ASCII, memory size and cache mapping.', prefix })}
<body class="tools-page">
${header(prefix)}
<main id="main" tabindex="-1">
  <div class="wrap">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${prefix}index.html">Home</a></li><li aria-current="page">Tools</li></ol></nav>
    <header class="chapter-head tools-head">
      <p class="ch-big" aria-hidden="true">±</p>
      <div>
        <p class="eyebrow">Workbench · ${all.length} calculators</p>
        <h1>Calculators &amp; Tools</h1>
        <p class="lede">Every calculation you meet in COAL, number bases, signed numbers, flags, shifts, multiplication and division, addresses, floating point and caches. Results update as you type.</p>
      </div>
    </header>
    <div class="tools-layout">
      <aside class="tools-nav" aria-label="Tools"><nav>${nav}</nav></aside>
      <div class="tools-main"><details class="tools-jump"><summary><i data-lucide="list" aria-hidden="true"></i>Jump to a calculator</summary><nav aria-label="Calculators">${nav}</nav></details>${panels}</div>
    </div>
  </div>
</main>
${footer(prefix, `<script src="${prefix}js/tools.js" defer></script>`)}`;
  writePage('tools/index.html', out);
  searchIndex.push({ t: 'Calculators & Tools', u: 'tools/index.html', c: 'Tools', r: false, h: all.map((t) => t[2]).join(' · '), hs: all.map((t) => [t[2], t[0]]), x: all.map((t) => `${t[2]}. ${t[3]}`).join(' ') + ' binary decimal hexadecimal octal convert calculator flags carry overflow physical address' });
}

// ---------- home ----------
function renderHome() {
  const prefix = './';
  const totalMin = pages.reduce((s, p) => s + p.minutes, 0);
  const allTools = TOOL_GROUPS.flatMap(([, t]) => t);
  const byDir = (d) => chs.find((c) => c.dir === d);
  const solved = byDir('09-solved-problems');

  // chapter cards
  const cards = chs
    .map((c) => {
      const min = c.pages.reduce((s, p) => s + p.minutes, 0);
      const first = c.pages.slice(0, 3).map((p) => `<li><a href="${prefix}${p.url}">${esc(p.title)}</a></li>`).join('');
      const more = c.pages.length > 3 ? `<li class="cc-more"><a href="${prefix}${c.url}">+ ${c.pages.length - 3} more</a></li>` : '';
      return `<li class="ch-card${c === solved ? ' ch-card--practice' : ''}">
  <a class="cc-head" href="${prefix}${c.url}"><span class="cc-num">${pad(c.num)}</span><i data-lucide="${esc(c.icon || 'book-open')}" aria-hidden="true"></i></a>
  <h3 class="cc-title"><a href="${prefix}${c.url}">${esc(c.title)}</a></h3>
  <p class="cc-desc">${esc(c.summary || '')}</p>
  <ul class="cc-lessons">${first}${more}</ul>
  <p class="cc-meta"><span>${c.pages.length} lessons</span><i data-lucide="arrow-right" aria-hidden="true"></i></p>
</li>`;
    })
    .join('');

  // learning path (three stages)
  const chip = (c) => `<a class="lp-chip" href="${prefix}${c.url}"><span>${pad(c.num)}</span>${esc(c.title)}</a>`;
  const stage = (n, title, text, list, cta) => `<li class="lp-step"><span class="lp-n">${n}</span><h3>${title}</h3><p>${text}</p><div class="lp-chips">${list.map(chip).join('')}${cta || ''}</div></li>`;
  const path1 = chs.filter((c) => c.num <= 5), path2 = chs.filter((c) => c.num >= 6 && c.num <= 8);
  const tools = allTools.slice(0, 8)
    .map(([id, , t, d, i]) => `<li><a class="tool" href="${prefix}tools/index.html#${id}"><i data-lucide="${i}" aria-hidden="true"></i><span class="tool-title">${t}</span><span class="tool-desc">${d}</span>${TOOL_FORMULA[id] ? `<span class="tool-formula">${TOOL_FORMULA[id][0]}</span>` : ''}</a></li>`)
    .join('');

  const out = `${head({ title: `${SITE.name} | ${SITE.full}`, description: 'Learn Computer Organization & Assembly Language: processors, registers, memory, the 8085 and 8086, and x86 assembly programming, with clear diagrams, step-by-step calculators and solved problems.', prefix })}
<body class="home-page">
${header(prefix)}
<main id="main" tabindex="-1">
  <section class="hv hv-a">
    <svg class="hv-circuit" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="tr" d="M0 120 H260 V60 H520"/><path class="tr-p" d="M0 120 H260 V60 H520" pathLength="1000" style="--k:0"/><path class="tr" d="M1440 90 H1180 V200 H980"/><path class="tr-p" d="M1440 90 H1180 V200 H980" pathLength="1000" style="--k:1"/><path class="tr" d="M0 520 H180 V420 H420 V470"/><path class="tr-p" d="M0 520 H180 V420 H420 V470" pathLength="1000" style="--k:2"/><path class="tr" d="M1440 600 H1260 V500 H1060"/><path class="tr-p" d="M1440 600 H1260 V500 H1060" pathLength="1000" style="--k:3"/><path class="tr" d="M640 0 V80 H760"/><path class="tr-p" d="M640 0 V80 H760" pathLength="1000" style="--k:4"/><path class="tr" d="M860 700 V610 H1000 V560"/><path class="tr-p" d="M860 700 V610 H1000 V560" pathLength="1000" style="--k:5"/><path class="tr" d="M0 330 H120"/><path class="tr-p" d="M0 330 H120" pathLength="1000" style="--k:6"/><path class="tr" d="M1440 360 H1320 V300"/><path class="tr-p" d="M1440 360 H1320 V300" pathLength="1000" style="--k:7"/></svg>
    <div class="wrap hv-grid">
      <div class="hv-main">
        <p class="hv-eyebrow">Computer Organization &amp; Assembly Language</p>
        <h1>Understand the machine. <span>Then program it.</span></h1>
        <p class="hv-lede">From the instruction cycle and registers to memory, buses and the 8086, explained clearly, drawn as diagrams and solved step by step.</p>
        <div class="hv-cta"><a class="btn btn--primary" href="${prefix}${pages[0].url}">Start learning<i data-lucide="arrow-right"></i></a><a class="btn hv-btn2" href="${prefix}${solved ? solved.url : 'tools/index.html'}">Solved problems</a></div>
        <dl class="hv-stats"><div><dt>Chapters</dt><dd>${chs.length}</dd></div><div><dt>Lessons</dt><dd>${pages.length}</dd></div><div><dt>Diagrams</dt><dd>${usedDiagrams.size}</dd></div><div><dt>Calculators</dt><dd>${allTools.length}</dd></div></dl>
      </div>
      <div class="cpu-demo" role="img" aria-label="Animation: an 8086 loop adds 5 + 4 + 3 + 2 + 1 into AX, one instruction at a time">
        <div class="cd-bar"><span class="cd-dots"><i></i><i></i><i></i></span><span class="cd-file">sum.asm · 8086</span><span class="cd-live"><i></i>Running</span></div>
        <ol class="cd-code"><li class="cd-line"><span class="cd-addr">0000</span><span class="cd-bytes">B9 05 00</span><code><b>mov</b>  cx, <em>5</em></code></li><li class="cd-line"><span class="cd-addr">0003</span><span class="cd-bytes">B8 00 00</span><code><b>mov</b>  ax, <em>0</em></code></li><li class="cd-line"><span class="cd-addr">0006</span><span class="cd-bytes">01 C8</span><code><u>L1:</u> <b>add</b>  ax, cx</code></li><li class="cd-line"><span class="cd-addr">0008</span><span class="cd-bytes">E2 FC</span><code>    <b>loop</b> L1</code></li><li class="cd-line"><span class="cd-addr">000A</span><span class="cd-bytes">F4</span><code><b>hlt</b></code></li></ol>
        <div class="cd-pipe"><span class="cd-stage" style="--d:0">Fetch</span><i class="cd-arrow"></i><span class="cd-stage" style="--d:1">Decode</span><i class="cd-arrow"></i><span class="cd-stage" style="--d:2">Execute</span><i class="cd-arrow"></i><span class="cd-stage" style="--d:3">Write back</span></div>
        <div class="cd-regs"><div class="cd-reg"><span>AX</span><b data-reg="AX">0000</b></div><div class="cd-reg"><span>CX</span><b data-reg="CX">0000</b></div><div class="cd-reg"><span>IP</span><b data-reg="IP">0000</b></div><div class="cd-reg"><span>Cycles</span><b data-reg="cyc">0</b></div></div>
        <p class="cd-result">AX = 000Fh = 5 + 4 + 3 + 2 + 1 = 15</p>
      </div>
    </div>
  </section>

  <section class="home-block home-block--path" aria-labelledby="path-h">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow">Learning path</p><h2 id="path-h">Three steps from zero to assembly</h2></div>
      <ol class="lp">
        ${stage('01', 'Understand the machine', 'Generations, number systems, the processor, registers, memory and the 8085/8086.', path1)}
        ${stage('02', 'Program the 8086', 'Program structure, directives, addressing modes, the instruction set, procedures, strings and interrupts.', path2)}
        ${stage('03', 'Practise and check', 'Exam-style questions solved step by step, and calculators that show their working.', solved ? [solved] : [], `<a class="lp-chip lp-chip--tools" href="${prefix}tools/index.html"><i data-lucide="calculator" aria-hidden="true"></i>${allTools.length} calculators</a>`)}
      </ol>
    </div>
  </section>

  <section class="home-block" id="chapters" aria-labelledby="chapters-h">
    <div class="wrap">
      <div class="sec-head sec-head--row"><div><p class="eyebrow">Contents</p><h2 id="chapters-h">All chapters</h2></div><button class="btn btn--ghost" type="button" data-index-open><i data-lucide="list-tree" aria-hidden="true"></i>Open the full index</button></div>
      <ol class="ch-cards">${cards}</ol>
    </div>
  </section>

  <section class="home-block home-block--alt" aria-labelledby="tools-h">
    <div class="wrap">
      <div class="sec-head sec-head--row"><div><p class="eyebrow">Workbench</p><h2 id="tools-h">Calculators that show their working</h2></div><a class="btn" href="${prefix}tools/index.html">All ${allTools.length} calculators<i data-lucide="arrow-right"></i></a></div>
      <ul class="tool-grid">${tools}</ul>
    </div>
  </section>

  <section class="home-block home-block--how" aria-labelledby="how-h">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow">How to use</p><h2 id="how-h">Find anything fast</h2></div>
      <ul class="how-tiles">
        <li><button class="how-tile" type="button" data-search-open><span class="ht-ico"><i data-lucide="search" aria-hidden="true"></i></span><span class="ht-title">Search <span class="keys"><kbd>Ctrl</kbd><kbd>K</kbd></span></span><span class="ht-text">Every lesson, register and instruction, results as you type. <kbd>/</kbd> works too.</span></button></li>
        <li><button class="how-tile" type="button" data-index-open><span class="ht-ico"><i data-lucide="list-tree" aria-hidden="true"></i></span><span class="ht-title">Index</span><span class="ht-text">The full table of contents, one click away in the header, or the ☰ menu on a phone.</span></button></li>
        <li><a class="how-tile" href="${prefix}${pages[0].url}"><span class="ht-ico"><i data-lucide="text-quote" aria-hidden="true"></i></span><span class="ht-title">On this page</span><span class="ht-text">Jump between the sections of a long lesson; the current one is highlighted.</span></a></li>
        <li><a class="how-tile" href="${prefix}tools/index.html"><span class="ht-ico"><i data-lucide="calculator" aria-hidden="true"></i></span><span class="ht-title">Check your answer</span><span class="ht-text">Type your own numbers into a calculator and compare every step.</span></a></li>
      </ul>
    </div>
  </section>
</main>
${footer(prefix)}`;
  writePage('index.html', out);
}

function render404() {
  const prefix = SITE.base;
  const out = `${head({ title: `Page not found, ${SITE.name}`, prefix })}
<body class="home-page">
${header(prefix)}
<main id="main" tabindex="-1"><div class="wrap not-found"><p class="eyebrow">Error 404</p><h1>JMP to an invalid address.</h1><p class="lede">This page doesn’t exist. Use search or the index to find what you need.</p><div class="hero-cta"><a class="btn btn--primary" href="${prefix}index.html">Go home</a><button class="btn" type="button" data-search-open>Search</button></div></div></main>
${footer(prefix)}`;
  writePage('404.html', out);
}

// ---------- run ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(SRC, 'css'), path.join(DIST, 'css'));
copyDir(path.join(SRC, 'js'), path.join(DIST, 'js'));
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
pages.forEach(renderLesson);
chs.forEach(renderChapter);
renderTools();
renderHome();
render404();
fs.writeFileSync(path.join(DIST, 'search-index.js'), `window.COAL_SEARCH=${JSON.stringify(searchIndex)};`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
const allDiagrams = fs.readdirSync(DIAGRAM_DIR).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
const unused = allDiagrams.filter((d) => !usedDiagrams.has(d));
if (unused.length) console.warn('  ! diagrams not used:', unused.join(', '));
console.log(`Built ${pages.length} lessons in ${chs.length} chapters (+${chs.length} chapter pages, home, 404) → dist/`);

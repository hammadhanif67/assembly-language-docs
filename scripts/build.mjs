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
  return `<footer class="site-footer">
  <div class="ftr">
    <div class="ftr-brand">
      <a class="brand" href="${prefix}index.html">${LOGO.replaceAll('coal-logo', 'coal-logo-f')}<span class="brand-name">COAL<span class="brand-docs">Docs</span></span></a>
      <p>${SITE.full}. Lessons, diagrams, calculators and solved problems, from computer generations to the 8086 instruction set.</p>
    </div>
    <nav class="ftr-nav" aria-label="Computer organization chapters"><p class="ftr-h">Learn</p><ol>${learn}</ol></nav>
    <nav class="ftr-nav" aria-label="Assembly chapters"><p class="ftr-h">Program and practise</p><ol>${program}</ol></nav>
    <nav class="ftr-nav" aria-label="Resources"><p class="ftr-h">Resources</p><ul>
      <li><a href="${prefix}tools/index.html">Calculators</a></li>
      ${formula ? `<li><a href="${prefix}${formula.url}">Formula sheet</a></li>` : ''}
      ${solvedCh ? `<li><a href="${prefix}${solvedCh.url}">Solved problems</a></li>` : ''}
      <li><button type="button" class="link-btn" data-index-open>Full index</button></li>
      <li><button type="button" class="link-btn" data-search-open>Search</button></li>
    </ul></nav>
  </div>
  <div class="ftr-bottom">
    <p>© ${new Date().getFullYear()} COAL Docs. Code under the MIT licence. Photos from Wikimedia Commons, credited under each photo.</p>
    <a class="ftr-gh" href="${SITE.repo}" target="_blank" rel="noopener"><i data-lucide="github" aria-hidden="true"></i>GitHub</a>
  </div>
</footer>
<button class="back-to-top" type="button" aria-label="Back to top"><i data-lucide="arrow-up"></i></button>
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
  const strip = `<nav class="lesson-strip" aria-label="Lessons in ${esc(ch.title)}"><ol>${ch.pages
    .map((p, k) => `<li><a href="${prefix}${p.url}"${p === page ? ' aria-current="page"' : ''} title="${esc(p.title)}"><span class="ls-n">${pad(k + 1)}</span><span class="ls-t">${esc(p.title)}</span></a></li>`)
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
        <p class="lh-facts"><span>${page.minutes} min read</span>${page.sections ? `<span>${page.sections} sections</span>` : ''}${page.research ? '<span class="tag-research">Researched topic</span>' : ''}</p>
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
  <span class="lr-time">${p.minutes} min</span>
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
        <p class="lh-facts"><span>${ch.pages.length} lessons</span><span>≈ ${total} min</span></p>
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

function renderTools() {
  const prefix = '../';
  const all = TOOL_GROUPS.flatMap(([, t]) => t);
  const nav = TOOL_GROUPS.map(([g, list]) => `<p class="eyebrow">${g}</p><ol>${list.map(([id, , title]) => `<li><a href="#${id}">${title}</a></li>`).join('')}</ol>`).join('');
  let n = 0;
  const panels = TOOL_GROUPS.map(([g, list]) => `<h2 class="tools-group">${g}</h2>` + list.map(([id, widget, title, desc, icon]) => {
    n++;
    return `<section class="tool-panel" id="${id}" aria-labelledby="${id}-t">
  <header class="tp-head"><span class="tp-num">${pad(n)}</span><div><h3 id="${id}-t"><i data-lucide="${icon}" aria-hidden="true"></i>${title}</h3><p>${desc}</p></div></header>
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
  const allTools = TOOL_GROUPS.flatMap(([, t]) => t);
  const solved = chs.find((c) => c.dir === '09-solved-problems');
  const popular = [
    ['MOV & data transfer', 'instruction-set/data-transfer.html'],
    ['Flags', 'registers-memory/registers.html'],
    ['8086', 'microprocessors/8086.html'],
    ['Addressing modes', 'assembly-basics/addressing-modes.html'],
    ['Cache', 'registers-memory/cache-mapping.html'],
    ['Number systems', 'data-representation/number-systems.html'],
  ].filter(([, u]) => pages.some((p) => p.url === u));

  const cards = chs.map((c) => {
    const shown = c.pages.slice(0, 4).map((p) => `<li><a href="${prefix}${p.url}">${esc(p.title)}</a></li>`).join('');
    const more = c.pages.length > 4 ? `<li class="pc-more"><a href="${prefix}${c.url}">All ${c.pages.length} lessons</a></li>` : '';
    return `<li class="pc">
  <a class="pc-top" href="${prefix}${c.url}"><span class="pc-ico"><i data-lucide="${esc(c.icon || 'book-open')}" aria-hidden="true"></i></span><span class="pc-num">Chapter ${pad(c.num)}</span></a>
  <h3 class="pc-title"><a href="${prefix}${c.url}">${esc(c.title)}</a></h3>
  <p class="pc-desc">${esc(c.summary || '')}</p>
  <ul class="pc-list">${shown}${more}</ul>
</li>`;
  }).join('');

  const quick = [
    ['tools/index.html', 'calculator', 'Calculators', `${allTools.length} calculators that show every step of the working.`],
    solved && solved.pages[0] ? [solved.pages[0].url, 'sigma', 'Formula sheet', 'Every COAL formula on one page, with a method to solve any question.'] : null,
    solved ? [solved.url, 'pencil-ruler', 'Solved problems', 'Exam-style questions worked out step by step.'] : null,
  ].filter(Boolean).map(([u, i, t, d]) => `<li><a class="qk" href="${prefix}${u}"><span class="pc-ico"><i data-lucide="${i}" aria-hidden="true"></i></span><span><span class="qk-title">${t}</span><span class="qk-desc">${d}</span></span><i data-lucide="arrow-right" class="qk-arrow" aria-hidden="true"></i></a></li>`).join('');

  const out = `${head({ title: `${SITE.name} | ${SITE.full}`, description: 'Learn Computer Organization & Assembly Language: processors, registers, memory, the 8085 and 8086, and x86 assembly programming, with clear diagrams, step-by-step calculators and solved problems.', prefix })}
<body class="home-page portal">
${header(prefix)}
<main id="main" tabindex="-1">
  <section class="portal-hero">
    <div class="wrap">
      <p class="portal-eyebrow">COAL Docs</p>
      <h1>Learn Computer Organization <span>&amp; Assembly Language</span></h1>
      <p class="portal-lede">${pages.length} lessons in ${chs.length} chapters, from how a computer works to programming the 8086.</p>
      <button class="portal-search" type="button" data-search-open><i data-lucide="search" aria-hidden="true"></i><span class="ps-text">Search lessons, registers, instructions</span><span class="keys"><kbd>Ctrl</kbd><kbd>K</kbd></span></button>
      <p class="popular"><span>Popular:</span>${popular.map(([t, u]) => `<a href="${prefix}${u}">${esc(t)}</a>`).join('')}</p>
    </div>
  </section>
  <section class="portal-body" id="chapters" aria-labelledby="chapters-h">
    <div class="wrap">
      <div class="portal-head"><h2 id="chapters-h">Chapters</h2><a href="${prefix}${pages[0].url}">Start from the first lesson<i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
      <ol class="pc-grid">${cards}</ol>
      <h2 class="portal-h2">Practice and tools</h2>
      <ul class="qk-grid">${quick}</ul>
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

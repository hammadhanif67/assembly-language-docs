// COAL Documentation — static site builder.
// Reads content/<chapter>/*.md, renders with marked, writes plain HTML into dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const SITE = {
  name: 'COAL Documentation',
  tagline: 'Computer Organization & Assembly Language',
  repo: 'https://github.com/hammadhanif67/assembly-language-docs',
};

const CDN = {
  prism: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0',
  fuse: 'https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js',
  gsap: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  scrollTrigger: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  lucide: 'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js',
  mermaid: 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js',
  typed: 'https://cdn.jsdelivr.net/npm/typed.js@2.1.0/dist/typed.umd.js',
  fonts:
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
};

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slugify = (s) =>
  decode(stripTags(s)).toLowerCase().replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
const noNum = (s) => s.replace(/^\d+-/, '');

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
const diagramMeta = JSON.parse(fs.readFileSync(path.join(DIAGRAM_DIR, '_meta.json'), 'utf8'));
const usedDiagrams = new Set();

function renderDiagram(name, caption, prefix) {
  usedDiagrams.add(name);
  const meta = diagramMeta[name] || {};
  const file = path.join(DIAGRAM_DIR, `${name}.svg`);
  let inner;
  if (fs.existsSync(file)) {
    inner = fs.readFileSync(file, 'utf8').replace(/<\?xml[^>]*>/, '').trim();
    // accessible name
    inner = inner.replace('<svg', `<svg role="img" aria-label="${esc(caption)}"`);
  } else {
    console.warn(`  ! missing diagram ${name}.svg`);
    inner = `<div class="diagram-missing">Diagram “${esc(name)}” is missing.</div>`;
  }
  const original = meta.original
    ? `<button class="diagram-original" type="button" data-src="${prefix}assets/originals/${esc(meta.original)}" data-caption="${esc(caption)}"><i data-lucide="image"></i><span>View original slide</span></button>`
    : '';
  const tag = meta.added ? `<span class="diagram-tag" title="Visual aid added to illustrate the text; not a figure in the source">illustration</span>` : '';
  return `<figure class="diagram${meta.wide ? ' diagram--wide' : ''}" id="fig-${esc(name)}"><div class="diagram-canvas">${inner}</div><figcaption>${tag}<span>${esc(caption)}</span>${original}</figcaption></figure>`;
}

// ---------- markdown ----------
function makeMarked(toc) {
  const used = new Map();
  const md = new Marked({ gfm: true, breaks: false });
  md.use({
    renderer: {
      heading(text, depth, raw) {
        let id = slugify(raw);
        const n = used.get(id) || 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) toc.push({ id, text: stripTags(text), depth });
        const anchor = depth > 1 ? `<a class="h-anchor" href="#${id}" aria-label="Link to this section">#</a>` : '';
        if (depth === 2 && !/^sources$/i.test(stripTags(text).trim())) {
          const n = toc.filter((t) => t.depth === 2 && !/^sources$/i.test(t.text.trim())).length;
          return `<h2 id="${id}" class="sec-h2"><span class="sec-num" aria-hidden="true">${String(n).padStart(2, '0')}</span><span class="sec-text">${text}</span>${anchor}</h2>\n`;
        }
        return `<h${depth} id="${id}"${depth === 2 ? ' class="sources-h2"' : ''}>${text}${anchor}</h${depth}>\n`;
      },
      code(code, lang) {
        const l = (lang || '').trim().toLowerCase();
        if (l === 'mermaid') return `<div class="mermaid-wrap"><pre class="mermaid">${esc(code)}</pre></div>`;
        const map = { asm: 'nasm', masm: 'nasm', x86: 'nasm', nasm: 'nasm', '': 'none', text: 'none', c: 'c', bash: 'bash', sh: 'bash', powershell: 'powershell' };
        const pl = map[l] || l;
        const label = l === '' || l === 'text' ? 'text' : l === 'nasm' || l === 'masm' || l === 'x86' ? 'asm' : l;
        return `<div class="code-block" data-lang="${esc(label)}"><div class="code-head"><span class="code-lang">${esc(label)}</span><button class="copy-btn" type="button" aria-label="Copy code"><i data-lucide="copy"></i><span>Copy</span></button></div><pre class="line-numbers language-${esc(pl)}"><code class="language-${esc(pl)}">${esc(code)}</code></pre></div>`;
      },
      table(header, body) {
        return `<div class="table-wrap" tabindex="0"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
      },
      blockquote(quote) {
        return `<blockquote class="deck-banner">${quote}</blockquote>`;
      },
    },
  });
  return md;
}

function preprocess(body, prefix, raws) {
  // :::diagram name / :::figure file / :::widget name / :::note … :::
  // Raw HTML is swapped for placeholders so Markdown never touches it.
  const keep = (html) => `\n\nCOALRAW${raws.push(html) - 1}X\n\n`;
  return body.replace(/^:::(diagram|figure|widget|note|tip|warning)(?:[ \t]+([^\n]+))?\n([\s\S]*?)\n:::[ \t]*$/gm, (_, kind, arg = '', text) => {
    const caption = text.trim();
    arg = arg.trim();
    if (kind === 'diagram') return keep(renderDiagram(arg, caption.replace(/^Figure:\s*/, ''), prefix));
    if (kind === 'figure')
      return keep(`<figure class="photo"><button class="photo-zoom" type="button" data-src="${prefix}assets/img/${esc(arg)}" data-caption="${esc(caption)}" aria-label="Enlarge image: ${esc(caption)}"><img src="${prefix}assets/img/${esc(arg)}" alt="${esc(caption)}" loading="lazy" decoding="async"></button><figcaption>${esc(caption)}</figcaption></figure>`);
    if (kind === 'widget')
      return keep(`<figure class="widget-figure"><div class="widget" data-widget="${esc(arg)}"></div><figcaption>${esc(caption)}</figcaption></figure>`);
    const icon = { note: 'info', tip: 'lightbulb', warning: 'triangle-alert' }[kind];
    return `\n<div class="callout callout--${kind}"><i data-lucide="${icon}" aria-hidden="true"></i><div>\n\n${caption}\n\n</div></div>\n`;
  });
}

// ---------- load content ----------
const chapters = JSON.parse(fs.readFileSync(path.join(CONTENT, 'chapters.json'), 'utf8'));
const pages = [];
for (const ch of chapters) {
  const dir = path.join(CONTENT, ch.dir);
  ch.slug = noNum(ch.dir);
  ch.pages = [];
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const page = { ...data, body, chapter: ch, slug: noNum(f.replace(/\.md$/, '')), file: `${ch.dir}/${f}` };
    page.url = `${ch.slug}/${page.slug}.html`;
    ch.pages.push(page);
    pages.push(page);
  }
}
const chaptersWithPages = chapters.filter((c) => c.pages.length);

// ---------- templates ----------
const LOGO = fs.readFileSync(path.join(SRC, 'logo.svg'), 'utf8');

function head({ title, description, prefix, extraHead = '' }) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || SITE.tagline)}">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${prefix}assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${prefix}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${CDN.fonts}">
<link rel="stylesheet" href="${CDN.prism}/plugins/line-numbers/prism-line-numbers.min.css">
<link rel="stylesheet" href="${prefix}css/main.css">
${extraHead}
</head>`;
}

const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<marker id="d-arrowhead" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--d-stroke)"/></marker>
<marker id="d-arrowhead-start" viewBox="0 0 10 10" refX="1.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--d-stroke)"/></marker>
<marker id="d-ah-acc" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--d-accent)"/></marker>
<marker id="d-ah-acc2" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--d-accent-2)"/></marker>
<marker id="d-ah-acc3" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--d-accent-3)"/></marker>
<marker id="d-ah-acc4" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--d-accent-4)"/></marker>
</defs></svg>`;

function header(prefix) {
  return `${SVG_DEFS}<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><div class="progress-bar"></div></div>
<header class="site-header">
  <button class="icon-btn nav-toggle" type="button" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false"><i data-lucide="menu"></i></button>
  <a class="brand" href="${prefix}index.html" aria-label="${SITE.name} — home">${LOGO}<span class="brand-name">COAL <span class="brand-docs">Docs</span></span></a>
  <button class="search-trigger" type="button" aria-label="Search documentation" data-search-open><i data-lucide="search"></i><span class="search-trigger-text">Search docs…</span><kbd>Ctrl K</kbd></button>
  <div class="header-actions">
    <a class="icon-btn" href="${SITE.repo}" target="_blank" rel="noopener" aria-label="GitHub repository"><i data-lucide="github"></i></a>
  </div>
</header>`;
}

function sidebar(prefix, current) {
  const curIndex = current ? pages.indexOf(current) : -1;
  const groups = chaptersWithPages
    .map((ch, ci) => {
      const open = current ? current.chapter === ch : ci === 0;
      const hasCurrent = current && current.chapter === ch;
      const items = ch.pages
        .map((p) => {
          const active = current === p;
          const done = curIndex >= 0 && pages.indexOf(p) < curIndex;
          const badge = p.research ? '<span class="nav-badge" title="Added by research">R</span>' : '';
          return `<li><a href="${prefix}${p.url}"${active ? ' aria-current="page" class="active"' : done ? ' class="done"' : ''}><span class="node" aria-hidden="true"></span><span class="nav-label">${esc(p.title)}</span>${badge}</a></li>`;
        })
        .join('');
      const num = String(ci + 1).padStart(2, '0');
      return `<li class="nav-group${open ? ' open' : ''}${hasCurrent ? ' current' : ''}"><button class="nav-group-btn" type="button" aria-expanded="${open}"><span class="ch-num" aria-hidden="true">${num}</span><span class="ch-text"><span class="ch-title">${esc(ch.title)}</span><span class="ch-meta">${ch.pages.length} lesson${ch.pages.length > 1 ? 's' : ''}</span></span><i class="chev" data-lucide="chevron-down" aria-hidden="true"></i></button><ul class="nav-items">${items}</ul></li>`;
    })
    .join('');
  const pct = curIndex >= 0 ? Math.round(((curIndex + 1) / pages.length) * 100) : 0;
  const progress =
    curIndex >= 0
      ? `<div class="course-progress"><div class="cp-row"><span>Lesson <b>${curIndex + 1}</b> of ${pages.length}</span><span>${pct}%</span></div><div class="cp-bar" role="progressbar" aria-label="Course progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></div>`
      : `<div class="course-progress"><div class="cp-row"><span><b>${pages.length}</b> lessons · ${chaptersWithPages.length} chapters</span></div></div>`;
  return `<aside class="sidebar" id="sidebar" aria-label="Course map">
<div class="sidebar-top"><p class="sidebar-kicker">Course map</p>${progress}<label class="nav-filter"><i data-lucide="filter" aria-hidden="true"></i><input type="search" placeholder="Filter lessons…" aria-label="Filter lessons" autocomplete="off" spellcheck="false"></label></div>
<nav><ul class="nav-root">${groups}</ul><p class="nav-empty" hidden>No lessons match.</p></nav>
<div class="sidebar-foot"><span class="legend"><span class="nav-badge">R</span> Added by research</span></div></aside><div class="scrim" hidden></div>`;
}

function footer(prefix, extraScripts = '') {
  return `<footer class="site-footer"><div class="footer-inner"><div class="footer-brand">${LOGO.replaceAll("coal-logo-g", "coal-logo-f")}<div><strong class="brand-name">COAL <span class="brand-docs">Docs</span></strong><p>${SITE.tagline}. Built from course lecture PDFs &amp; slides, plus researched topics.</p></div></div><nav class="footer-links" aria-label="Footer"><a href="${prefix}index.html">Home</a><a href="${prefix}${pages[0].url}">Start reading</a><a href="${SITE.repo}" target="_blank" rel="noopener">GitHub</a></nav></div></footer>
<button class="back-to-top" type="button" aria-label="Back to top"><i data-lucide="arrow-up"></i></button>
<div class="search-modal" role="dialog" aria-modal="true" aria-label="Search" hidden>
  <div class="search-panel">
    <div class="search-box"><i data-lucide="search" aria-hidden="true"></i><input type="search" placeholder="Search topics, registers, instructions…" aria-label="Search" autocomplete="off" spellcheck="false"><button class="icon-btn" type="button" data-search-close aria-label="Close search"><kbd>Esc</kbd></button></div>
    <ul class="search-results" role="listbox" aria-label="Results"></ul>
    <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span>Powered by Fuse.js</span></div>
  </div>
</div>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden><button class="icon-btn lightbox-close" type="button" aria-label="Close"><i data-lucide="x"></i></button><figure><img alt=""><figcaption></figcaption></figure></div>
<script>window.COAL_PREFIX=${JSON.stringify(prefix)};</script>
<script src="${prefix}search-index.js" defer></script>
<script src="${CDN.lucide}" defer></script>
<script src="${CDN.fuse}" defer></script>
<script src="${CDN.gsap}" defer></script>
<script src="${CDN.scrollTrigger}" defer></script>
<script src="${CDN.prism}/prism.min.js" data-manual defer></script>
<script src="${CDN.prism}/components/prism-nasm.min.js" defer></script>
<script src="${CDN.prism}/components/prism-c.min.js" defer></script>
<script src="${CDN.prism}/plugins/line-numbers/prism-line-numbers.min.js" defer></script>
${extraScripts}
<script src="${prefix}js/widgets.js" defer></script>
<script src="${prefix}js/main.js" defer></script>
</body>
</html>`;
}

// ---------- page render ----------
const searchIndex = [];

function renderPage(page, i) {
  const prefix = '../';
  const toc = [];
  const md = makeMarked(toc);
  const raws = [];
  let html = md.parse(preprocess(page.body, prefix, raws));
  html = html.replace(/<p>COALRAW(\d+)X<\/p>|COALRAW(\d+)X/g, (_, a, b) => raws[Number(a ?? b)]);
  const usesMermaid = /class="mermaid"/.test(html);
  const prev = pages[i - 1], next = pages[i + 1];
  const badge = page.research
    ? `<span class="badge badge--research"><i data-lucide="flask-conical" aria-hidden="true"></i>Added by research</span>`
    : `<span class="badge badge--source"><i data-lucide="file-text" aria-hidden="true"></i>From course material</span>`;
  const ocr = page.ocr ? `<span class="badge badge--ocr" title="Text transcribed from scanned slide images"><i data-lucide="scan-text" aria-hidden="true"></i>Transcribed from scanned slides</span>` : '';
  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="On this page"><p class="toc-title"><i data-lucide="list" aria-hidden="true"></i>On this page</p><ul>${toc
        .map((t) => `<li class="toc-l${t.depth}"><a href="#${t.id}">${esc(t.text)}</a></li>`)
        .join('')}</ul></nav>`
    : '';
  const pager = `<nav class="pager" aria-label="Previous and next lessons">${
    next
      ? `<a class="up-next" href="${prefix}${next.url}" rel="next"><span class="un-kicker">Up next · ${esc(next.chapter.title)}</span><span class="un-title">${esc(next.title)}</span>${next.description ? `<span class="un-desc">${esc(next.description)}</span>` : ''}<span class="un-go" aria-hidden="true"><i data-lucide="arrow-right"></i></span></a>`
      : `<div class="up-next up-next--done"><span class="un-kicker">Course complete</span><span class="un-title">You've reached the last lesson 🎉</span></div>`
  }${prev ? `<a class="pager-prev" href="${prefix}${prev.url}" rel="prev"><i data-lucide="arrow-left"></i><span>Previous: <b>${esc(prev.title)}</b></span></a>` : ''}</nav>`;
  const chIndex = chaptersWithPages.indexOf(page.chapter) + 1;
  const lessonNo = page.chapter.pages.indexOf(page) + 1;
  const words = decode(stripTags(html.replace(/<svg[\s\S]*?<\/svg>/g, ' '))).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const sections = toc.filter((t) => t.depth === 2).length;
  const mermaidScript = usesMermaid ? `<script src="${CDN.mermaid}" defer></script>` : '';

  const out = `${head({ title: `${page.title} · ${SITE.name}`, description: page.description, prefix })}
<body class="doc-page${page.research ? ' is-research' : ''}">
${header(prefix)}
<div class="layout">
${sidebar(prefix, page)}
<main id="main" class="content" tabindex="-1">
  <article class="doc">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${prefix}index.html"><i data-lucide="house" aria-hidden="true"></i><span class="sr-only">Home</span></a></li><li><a href="${prefix}${page.chapter.pages[0].url}">${esc(page.chapter.title)}</a></li><li aria-current="page">${esc(page.title)}</li></ol></nav>
    <header class="doc-head lesson-hero${page.research ? ' lesson-hero--research' : ''}">
      <p class="lesson-kicker"><span class="lk-chapter">Chapter ${String(chIndex).padStart(2, '0')} · ${esc(page.chapter.title)}</span><span class="lk-lesson">Lesson ${lessonNo} of ${page.chapter.pages.length}</span></p>
      <h1>${esc(page.title)}</h1>
      ${page.description ? `<p class="lede">${esc(page.description)}</p>` : ''}
      <ul class="lesson-meta">
        <li><i data-lucide="clock" aria-hidden="true"></i>${minutes} min read</li>
        ${sections ? `<li><i data-lucide="layout-list" aria-hidden="true"></i>${sections} section${sections > 1 ? 's' : ''}</li>` : ''}
        ${page.source ? `<li class="lm-source"><i data-lucide="${page.research ? 'globe' : 'paperclip'}" aria-hidden="true"></i>${esc(page.source)}</li>` : ''}
      </ul>
      <div class="badges">${badge}${ocr}</div>
    </header>
    <div class="doc-body">
${html}
    </div>
    ${pager}
  </article>
  ${tocHtml ? `<aside class="toc-rail">${tocHtml}</aside>` : ''}
</main>
</div>
${footer(prefix, mermaidScript)}`;
  const dest = path.join(DIST, page.url);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);

  const text = decode(
    stripTags(
      html
        .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
        .replace(/<div class="mermaid-wrap">[\s\S]*?<\/div>/g, ' ')
        .replace(/<a class="h-anchor"[^>]*>#<\/a>/g, '')
        .replace(/<\/(p|li|h\d|td|th|figcaption)>/g, ' ')
    )
  ).replace(/\s+/g, ' ').trim();
  searchIndex.push({
    t: page.title,
    u: page.url,
    c: page.chapter.title,
    r: !!page.research,
    h: toc.map((x) => x.text).join(' · '),
    hs: toc.map((x) => [x.text, x.id]),
    x: text.slice(0, 6000),
  });
}

function renderHome() {
  const prefix = './';
  const cards = chaptersWithPages
    .map(
      (ch, i) => `<a class="chapter-card" href="${prefix}${ch.pages[0].url}" data-reveal>
  <span class="chapter-num">${String(i + 1).padStart(2, '0')}</span>
  <i data-lucide="${ch.icon}" aria-hidden="true"></i>
  <h3>${esc(ch.title)}</h3>
  <p>${ch.pages.map((p) => esc(p.title)).slice(0, 4).join(' · ')}${ch.pages.length > 4 ? ' …' : ''}</p>
  <span class="chapter-meta">${ch.pages.length} page${ch.pages.length > 1 ? 's' : ''}${ch.pages.some((p) => p.research) ? ' · research' : ''}</span>
</a>`
    )
    .join('');
  const pdfCount = pages.filter((p) => !p.research).length;
  const resCount = pages.length - pdfCount;
  const diagramCount = Object.keys(diagramMeta).length;
  const out = `${head({ title: `${SITE.name} — ${SITE.tagline}`, description: 'A complete, themeable documentation site for Computer Organization & Assembly Language: processors, registers, memory, 8085/8086, and x86 assembly programming.', prefix })}
<body class="home-page">
${header(prefix)}
<div class="layout layout--home">
${sidebar(prefix, null)}
<main id="main" class="content content--home" tabindex="-1">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow"><span class="dot"></span>Computer Organization &amp; Assembly Language</p>
      <h1 class="hero-title">Read the machine,<br><span class="hero-accent">one register at a time.</span></h1>
      <p class="hero-lede">Lecture notes on processors, registers, memory, buses, the 8085 and 8086, turned into searchable pages with every slide diagram redrawn. Extra topics on writing x86 assembly fill in what the slides don't cover.</p>
      <div class="hero-cta"><a class="btn btn--primary" href="${prefix}${pages[0].url}"><i data-lucide="book-open"></i>Start reading</a><button class="btn btn--ghost" type="button" data-search-open><i data-lucide="search"></i>Search topics</button></div>
      <dl class="hero-stats"><div><dt>Pages from slides</dt><dd>${pdfCount}</dd></div><div><dt>Researched pages</dt><dd>${resCount}</dd></div><div><dt>Diagrams</dt><dd>${diagramCount}</dd></div><div><dt>Interactive widgets</dt><dd>4</dd></div></dl>
    </div>
    <div class="hero-term" aria-label="Example assembly session">
      <div class="term-bar"><span></span><span></span><span></span><em>hello.asm — 8086</em></div>
      <pre class="term-body"><code><span class="term-static">; COAL Documentation</span>
<span id="typed-target"></span><noscript>mov ax, @data
mov ds, ax
mov ah, 09h
lea dx, msg
int 21h</noscript></code></pre>
      <div class="term-regs" aria-hidden="true"><span>AX <b data-reg="ax">0000</b></span><span>DS <b data-reg="ds">0000</b></span><span>DX <b data-reg="dx">0000</b></span><span>IP <b data-reg="ip">0100</b></span></div>
    </div>
  </section>
  <section class="home-section">
    <h2 class="section-title" data-reveal>Chapters</h2>
    <div class="chapter-grid">${cards}</div>
  </section>
</main>
</div>
${footer(prefix)}`;
  fs.writeFileSync(path.join(DIST, 'index.html'), out);
}

function render404() {
  const prefix = '/assembly-language-docs/';
  const out = `${head({ title: `Page not found · ${SITE.name}`, prefix })}
<body class="home-page">
${header(prefix)}
<div class="layout layout--home">
${sidebar(prefix, null)}
<main id="main" class="content content--home" tabindex="-1"><section class="not-found"><p class="eyebrow">Error 404</p><h1>JMP to an invalid address</h1><p>The page you tried to open doesn't exist. Try search, or go back home.</p><div class="hero-cta"><a class="btn btn--primary" href="${prefix}index.html">Home</a><button class="btn btn--ghost" type="button" data-search-open>Search</button></div></section></main>
</div>
${footer(prefix)}`;
  fs.writeFileSync(path.join(DIST, '404.html'), out);
}

// ---------- run ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(SRC, 'css'), path.join(DIST, 'css'));
copyDir(path.join(SRC, 'js'), path.join(DIST, 'js'));
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
pages.forEach(renderPage);
renderHome();
render404();
fs.writeFileSync(path.join(DIST, 'search-index.js'), `window.COAL_SEARCH=${JSON.stringify(searchIndex)};`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
const unused = Object.keys(diagramMeta).filter((d) => !usedDiagrams.has(d));
if (unused.length) console.warn('  ! diagrams in _meta.json not used:', unused.join(', '));
console.log(`Built ${pages.length} pages (${pages.filter((p) => p.research).length} researched) in ${chaptersWithPages.length} chapters → dist/`);

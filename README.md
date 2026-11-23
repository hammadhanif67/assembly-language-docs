# COAL Documentation

**Computer Organization & Assembly Language** as a static documentation site, built from the
course's lecture PDFs and slides and extended with researched assembly-programming chapters.

🔗 **Live site:** https://hammadhanif67.github.io/assembly-language-docs/

<p align="center"><img src="src/assets/favicon.svg" width="96" alt="COAL Docs logo: a black block with an orange offset shadow holding a CPU chip with an orange C"></p>

The logo is a black square block with a hard orange offset shadow, holding a paper-colored CPU chip
with an orange **C**. The wordmark is **COAL DOCS**, with “DOCS” on an orange block.

## What's inside

| Chapter | Pages | Source |
|---|---|---|
| 1. Foundations | generations of computers, architecture vs. organization, structure & function, von Neumann vs. Harvard | course PDFs |
| 2. Processor Basics | machine instructions, clock & PC, instruction cycle, RISC, CISC vs RISC | course PDFs |
| 3. Registers & Memory | CPU (EU/BIU), 8086 registers, memory, segmentation, system bus, CPU registers, register types | course PDF + PPTX |
| 4. Microprocessors | 8085, 8086 | course PPTX |
| 5. Assembly Basics | number systems, data representation, program structure, directives, addressing modes | 🔬 researched |
| 6. Instruction Set | data transfer, arithmetic, logic/shift/rotate, jumps & loops | 🔬 researched |
| 7. Advanced Assembly | stack & procedures, interrupts & I/O, string instructions, macros, debugging | 🔬 researched |

- **38 pages** (24 from the course material, 14 marked *Added by research* with cited sources)
- **37 SVG diagrams** drawn with the site palette, each linked to the original slide image
- Interactive widgets: program-execution stepper, segment:offset calculator, number converter, stack visualizer
- See [`CONTENT_MAP.md`](CONTENT_MAP.md) (source → page mapping, OCR notes, overlaps) and [`MISSING_TOPICS.md`](MISSING_TOPICS.md)

## Features

- Collapsible sidebar grouped by chapter, current page highlighted
- “On this page” table of contents with scroll-spy
- Breadcrumbs, previous/next links, reading-progress bar, back-to-top button
- Full-text search (Fuse.js), opened with **Ctrl K** or **/**
- Syntax highlighting (Prism.js) with x86 mnemonics, line numbers and copy buttons
- Mermaid flowcharts on the researched pages, styled to match the site
- Smooth scrolling for “On this page” links; hard “press-down” button motion instead of fades
- Responsive from 320 px phones to wide desktops; keyboard navigable; alt text on all images; skip link

## Design

**Brutalist Editorial.** Newsprint paper with a faint grid, black ink, thick black rules and hard
offset shadows (no blur, no rounded corners), plus a signal-orange accent (`#FF4D00`). Researched
lessons use blue instead of orange.

- **Type:** condensed uppercase **Archivo** headlines, **Newsreader** serif for reading, **JetBrains Mono** for labels and metadata
- **Sidebar:** a “Course map” with numbered chapter blocks, square lesson nodes on a rail, a progress bar and a lesson filter
- **Lesson pages:** a framed headline block (chapter / lesson strip, reading time, sections), a drop cap, outlined section numbers, “FIG.01” captions and a black “Up next” slab

All colors are CSS variables at the top of `src/css/main.css`, and the diagrams use the same variables.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev        # build + serve at http://localhost:4173
npm run check      # build + check every internal link, anchor, image and alt text
```

The output is plain static files in `dist/`. Opening `dist/index.html` directly also works.

## Project structure

```text
content/
  chapters.json            chapter order, titles, icons
  01-foundations/*.md      one Markdown file per page (front matter + body)
  …
  07-advanced/*.md
src/
  css/main.css             layout + design tokens
  js/main.js               sidebar, TOC, search, copy, lightbox, animations
  js/widgets.js            interactive widgets
  diagrams/*.svg           diagrams (+ _meta.json: original slide, “illustration” flag)
  assets/img/              photos extracted from the PDFs
  assets/originals/        original slide images for “View original slide”
  logo.svg
scripts/
  build.mjs                Markdown → HTML static site generator
  serve.mjs                tiny dev server
  check.mjs                link / anchor / alt-text checker
.github/workflows/pages.yml  build + deploy to GitHub Pages
```

## Add a new topic

1. Create `content/<chapter-folder>/NN-my-topic.md` (the number sets the order):

   ```markdown
   ---
   title: My Topic
   description: One-sentence summary used for SEO and search.
   source: My Lecture.pdf — pages 3–7
   ocr: false          # true if transcribed from scanned images
   research: false     # true adds the “Added by research” badge (then add a ## Sources section)
   ---

   ## First section
   Normal Markdown, tables, and ```asm code fences.
   ```

2. Optional blocks:

   ```text
   :::diagram my-diagram        → inlines src/diagrams/my-diagram.svg (register it in _meta.json)
   Figure: caption
   :::

   :::figure photo.jpg          → image from src/assets/img/
   Caption / alt text
   :::

   :::note | :::tip | :::warning
   Callout text
   :::
   ```

   A ` ```mermaid ` fence renders a Mermaid diagram.
3. For a new chapter, add a folder and an entry in `content/chapters.json`.
4. Run `npm run check`, commit, push. GitHub Actions rebuilds and deploys.

Diagrams should use the `d-*` classes (`d-box`, `d-text`, `d-line d-arrow`, …) instead of hard-coded
colors, so they match the site palette.

## Source material

The lecture PDFs/PPTX files are used as the content source but are **not committed** (`.gitignore`),
since they are course material that may not be yours to redistribute. The extracted text, transcriptions
and figures live in `content/` and `src/assets/`. To commit the originals as well, remove the
`/*.pdf` and `/*.pptx` lines from `.gitignore`.

## Credits

- Content: CSC 222 / COAL lecture slides (Computer Organization & Assembly Language). The slides
  themselves cite W. Stallings, *Computer Organization and Architecture*, techtarget.com,
  stanford.edu (RISC project) and embeddedcraft.org.
- Researched chapters cite Intel's *8086 Family User's Manual*, Microsoft Learn (MASM), R. Hyde's
  *Art of Assembly*, UMBC CMSC 211 notes, R. Duncan's *MS-DOS Functions* and Wikipedia. Each page has
  its own Sources section.
- Libraries (all via CDN): [Prism.js](https://prismjs.com) (MIT), [Fuse.js](https://fusejs.io) (Apache-2.0),
  [Lucide](https://lucide.dev) (ISC),
  [Mermaid](https://mermaid.js.org) (MIT), [marked](https://marked.js.org) (MIT, build-time).
- Fonts: Archivo, Newsreader, JetBrains Mono (Google Fonts, SIL OFL).
- Layout ideas inspired by open-source docs sites such as Docusaurus and VitePress. No code was copied.

## License

Site code: MIT. Lecture-derived content belongs to its original authors and is reproduced for educational use.

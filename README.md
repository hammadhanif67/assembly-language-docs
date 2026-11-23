# COAL Docs

**Computer Organization & Assembly Language** — a course-style documentation site: 42 lessons in
8 chapters, 53 diagrams and a calculator workbench with 11 tools, from computer generations to 8086 assembly programming.

🔗 **Live site:** https://hammadhanif67.github.io/assembly-language-docs/

<p align="center"><img src="src/assets/favicon.svg" width="88" alt="COAL Docs logo: a 3×3 grid of squares forming a C, with a red centre square"></p>

The logo is a 3×3 grid of cells, like memory cells: the black cells form a **C** and the centre cell is red —
the core.

## Chapters

| # | Chapter | Lessons |
|---|---|---|
| 01 | Computer Fundamentals | Generations of computers, architecture vs organization, structure & function, von Neumann & Harvard |
| 02 | Data Representation | Number systems, signed numbers & characters, floating point (IEEE 754), logic gates & Boolean algebra |
| 03 | The Processor | Machine instructions, clock & PC, instruction cycle, instruction encoding, pipelining & hazards, RISC, CISC vs RISC |
| 04 | Registers, Memory & I/O | CPU (EU/BIU), 8086 registers, CPU registers, memory, cache mapping, segmentation, system bus, I/O techniques & DMA |
| 05 | Microprocessors | 8085, 8086, 8086 pins & operating modes |
| 06 | Assembly Basics | Program structure, assembler/linker/loader, directives, addressing modes |
| 07 | The Instruction Set | Data transfer, arithmetic, logic/shift/rotate, jumps & loops |
| 08 | Advanced Assembly | Stack & procedures, arrays & number I/O, strings, interrupts & I/O, macros, debugging |

Lessons marked **Researched topic** were written to complete the curriculum and end with a References
section. See [`CONTENT_MAP.md`](CONTENT_MAP.md) and [`MISSING_TOPICS.md`](MISSING_TOPICS.md).

## Calculators & tools

`tools/index.html` is a separate workbench (also linked as **Tools** in the header):

| Group | Calculators |
|---|---|
| Numbers | number converter (8/16/32-bit, clickable bits) · two’s complement step by step · IEEE 754 float ⇄ bits · ASCII ⇄ codes |
| Instructions | ALU & flags (ADD, ADC, SUB, SBB, CMP, AND, OR, XOR, TEST, INC, DEC, NEG → CF ZF SF OF PF AF) · shift & rotate with CF per step · MUL/IMUL/DIV/IDIV registers and overflow |
| Memory & addressing | segment:offset ⇄ physical · effective address for every 8086 mode · address lines ⇄ memory size · cache tag/index/offset split |

Inputs accept `200`, `-56`, `0C8h`, `0xC8`, `11001000b`, `310o` or `'A'`. The code is in `src/js/tools.js`.

## Design

**Swiss design** (International Typographic Style): white space, a strict 12-column grid, one red accent
(`#E30613`), Inter / Inter Tight type, and no decoration that does not carry information.

- **No sidebar.** Navigation is an **Index** menu in the header (every chapter and lesson), a page per
  chapter, a lesson strip at the top of each lesson, “On this page” in the left margin and large
  Previous / Next links.
- Search everything with **Ctrl K** or **/** (Fuse.js).
- Code blocks with x86 syntax highlighting, line numbers and a Copy button (Prism.js).
- Smooth scrolling, reading-progress bar, back-to-top button, keyboard support and skip link.
- Responsive from 320 px phones to wide screens; wide diagrams scroll inside their frame.

## Diagrams

All diagrams are **generated** SVG (and checked so no label overflows its box), so they share one visual language and use the CSS colour variables.
Each diagram is a short spec in `scripts/diagrams/specs-*.mjs` built with a small toolkit
(`scripts/diagrams/lib.mjs`): boxes, cell rows, orthogonal connectors routed between box edges, labels
with a white backing so lines never cut through text.

```bash
npm run diagrams   # regenerate src/diagrams/*.svg
```

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev        # build (diagrams + site) and serve at http://localhost:4173
npm run check      # build, then check every link, anchor, image and alt text
```

## Project structure

```text
content/
  chapters.json            chapter order, titles, summaries
  01-fundamentals/*.md     one Markdown file per lesson
  …
  08-advanced/*.md
scripts/
  build.mjs                Markdown → static HTML (home, chapter pages, lessons, 404)
  diagrams/                diagram toolkit + specs → src/diagrams/*.svg
  check.mjs                link / anchor / alt-text checker
  serve.mjs                dev server
src/
  css/main.css             Swiss design (tokens at the top)
  js/main.js               index menu, search, TOC, copy, lightbox, Mermaid
  js/widgets.js            in-lesson interactive widgets
  js/tools.js              calculator workbench (tools page)
  assets/                  logo, favicons, photos
.github/workflows/pages.yml  build + deploy to GitHub Pages on every push to main
```

## Add a lesson

1. Create `content/<chapter>/NN-my-topic.md` (the number sets the order):

   ```markdown
   ---
   title: My Topic
   description: One sentence shown under the title, in search and on the chapter page.
   research: false      # true shows the “Researched topic” tag
   ---

   ## First section
   Markdown, tables and ```asm code fences.
   ```

2. Optional blocks: `:::diagram name` (an SVG in `src/diagrams/`), `:::figure photo.jpg`,
   `:::note` / `:::tip` / `:::warning`, and ```` ```mermaid ```` fences. A `## Sources` section is shown as
   “References”.
3. For a new diagram, add a spec to `scripts/diagrams/specs-*.mjs`.
4. Run `npm run check`, commit and push — GitHub Actions deploys automatically.

## Source material

The original lecture PDFs/PPTX are **not** committed (`.gitignore`) and are not referenced on the site.
Their text was transcribed into `content/`; diagrams were redrawn.

## Credits

- Libraries (CDN): [Prism.js](https://prismjs.com) (MIT), [Fuse.js](https://fusejs.io) (Apache-2.0),
  [Lucide](https://lucide.dev) (ISC), [Mermaid](https://mermaid.js.org) (MIT); [marked](https://marked.js.org) (MIT, build time).
- Fonts: Inter, Inter Tight, JetBrains Mono (Google Fonts, SIL OFL).
- Researched lessons cite Intel’s 8086 manuals, Microsoft Learn (MASM), Stallings, Patterson & Hennessy,
  Irvine and others in their References sections.

## License

Site code: MIT. Lecture-derived content belongs to its original authors and is used for education.

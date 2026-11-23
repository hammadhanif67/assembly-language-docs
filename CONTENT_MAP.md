# Content Map

Every source file, every topic extracted from it, and the page it became.
Page paths are relative to the site root (`dist/` when built, the GitHub Pages URL when deployed).

**Legend:** OCR = the source pages were scanned images with no text layer; their text was transcribed
from the rendered page images (no Tesseract was available, so transcription was done visually and
proof-read against the slides).

## Source files

| # | File | Type | Pages / slides | Text layer? |
|---|---|---|---|---|
| 1 | `Computer Generation.pdf` | PDF | 34 | ❌ scanned — **all 34 pages OCR** |
| 2 | `Computer Architecture.pdf` | PDF | 17 | ✅ |
| 3 | `Sturuture and Function.pdf` | PDF | 12 | ✅ (pages 5 and 11 are figure-only images) |
| 4 | `Von Neumann,s.pdf` | PDF | 10 | ✅ (pages 4 and 7 are figure-only images) |
| 5 | `Basic Processor.pdf` | PDF | 20 | ❌ scanned — **all 20 pages OCR** |
| 6 | `RISC and CISC.pdf` | PDF | 23 | ❌ scanned — **all 23 pages OCR** |
| 7 | `Register & Memory.pdf` | PDF | 40 | ❌ scanned — **all 40 pages OCR** |
| 8 | `CPU Register.pptx` | PowerPoint | 24 | ✅ (slides 4, 5, 7, 15, 17, 23 are images) |
| 9 | `8085.pptx` | PowerPoint | 15 | ✅ (slides 5, 9 contain images; slide 9's image is text, transcribed) |
| 10 | `8086.pptx` | PowerPoint | 14 | ✅ (slides 5, 11 are images) |

The files were found in the project root (not in `./pdfs/`); they were read in place and were **not modified**.
They are excluded from the Git repository by `.gitignore` (see README → *Source material*).

## Topic → page mapping

### Chapter 1 — Foundations

| Source | Pages | Topics | Site page |
|---|---|---|---|
| Computer Generation.pdf | 1–3, 33 | Computer definition, five generations list, Difference table | `foundations/generations-overview.html` |
| Computer Generation.pdf | 4–9 | 1st gen, ENIAC, material used, 1GL, advantages, disadvantages | `foundations/first-generation.html` |
| Computer Generation.pdf | 10–15 | 2nd gen, material, 2GL (assembly), advantages, disadvantages | `foundations/second-generation.html` |
| Computer Generation.pdf | 16–21 | 3rd gen, ICs, material, 3GL, advantages, disadvantages | `foundations/third-generation.html` |
| Computer Generation.pdf | 22–27 | 4th gen, microprocessors, material, 4GL, advantages, disadvantages | `foundations/fourth-generation.html` |
| Computer Generation.pdf | 28–32, 34 | 5th gen, ULSI, 5GL, advantages, disadvantages, Artificial Intelligence | `foundations/fifth-generation.html` |
| Computer Architecture.pdf | 1–17 | Architecture vs organization, attributes, multiply instruction, IBM System/370, compatibility, microcomputers | `foundations/architecture-vs-organization.html` |
| Sturuture and Function.pdf | 1–12 | Hierarchical system, structure vs function, top-down approach, Fig 1.4, four basic functions, Fig 1.2 | `foundations/structure-and-function.html` |
| Von Neumann,s.pdf | 1–10 | Von Neumann architecture, bottleneck causes, Harvard architecture, comparison table | `foundations/von-neumann-harvard.html` |

### Chapter 2 — Processor Basics

| Source | Pages | Topics | Site page |
|---|---|---|---|
| Basic Processor.pdf | 1–9 | Outline, machine instruction elements, instruction representation, mnemonics, instruction types, number of addresses, types of operands | `processor/machine-instructions.html` |
| Basic Processor.pdf | 10–12 | Basic operations, processor clock, program counter, reading from memory | `processor/processor-clock.html` |
| Basic Processor.pdf | 13–20 | Basic instruction cycle, CPU registers, top-level view, detailed steps, example program execution, execution cycle, state diagram | `processor/instruction-cycle.html` |
| RISC and CISC.pdf | 1–11 | What is RISC, history, characteristics, pipelining (laundry analogy), RISC pipelines, hardware utilization | `processor/risc.html` |
| RISC and CISC.pdf | 12–16 | CISC vs RISC: instruction, code size, registers & addressing modes, execution | `processor/cisc-vs-risc.html` |
| RISC and CISC.pdf | 17–23 | RISC applications, ARM, performance equation, convergence, conclusion | `processor/risc-applications.html` |

### Chapter 3 — Registers & Memory

| Source | Pages / slides | Topics | Site page |
|---|---|---|---|
| Register & Memory.pdf | 1–8 | Outline, CPU, EU, BIU, internal bus, 8086 organization | `registers-memory/the-cpu.html` |
| Register & Memory.pdf | 9–15 | Registers, 8086 internal registers, GP/segment/pointer/index registers, 80386 extended registers | `registers-memory/registers.html` |
| Register & Memory.pdf | 16–24 | Bits/bytes/words, prefixes, memory, hierarchy, main/auxiliary memory, RAM/ROM, cache | `registers-memory/memory.html` |
| Register & Memory.pdf | 25–31 | Memory organization, segments, segment:offset, physical address, exercise, program segments | `registers-memory/memory-segmentation.html` |
| Register & Memory.pdf | 32–40 | Bus, data/address/control bus, types of transfer, interconnection structure | `registers-memory/system-bus.html` |
| CPU Register.pptx | 1–8 | What a register is, flow of data, why the CPU needs registers, fetch–decode–execute | `registers-memory/cpu-register.html` |
| CPU Register.pptx | 9–24 | Types of registers: GP (AX–DX), segment, index, pointer, flag register | `registers-memory/types-of-registers.html` |

### Chapter 4 — Microprocessors

| Source | Slides | Topics | Site page |
|---|---|---|---|
| 8085.pptx | 1–15 | Microprocessor, 8085 features & architecture, ALU, flags, accumulator, registers, PC, SP, W/Z, IR, timing & control, interrupts, buses | `microprocessors/8085.html` |
| 8086.pptx | 1–14 | 8086 introduction, specifications, internal architecture, BIU, EU, registers, segmentation, pipelining, working | `microprocessors/8086.html` |

## Overlaps between sources (both versions kept)

| Topic | Source A | Source B | How it's handled |
|---|---|---|---|
| 8086 registers (AX…DX, SP, BP, SI, DI, segments, flags) | Register & Memory.pdf p. 9–15 | CPU Register.pptx slides 9–24 and 8086.pptx slide 9 | All three kept on their own pages; wording differs and each adds unique detail (e.g. 80386 registers only in the PDF, DX:AX role only in the PPTX). |
| EU / BIU / instruction queue | Register & Memory.pdf p. 4–8 | 8086.pptx slides 6–8, 11–13 | Both kept: `registers-memory/the-cpu.html` and `microprocessors/8086.html`. |
| Fetch–decode–execute | Basic Processor.pdf p. 13–20 | CPU Register.pptx slides 7–8 | Both kept. |
| Pipelining | RISC and CISC.pdf p. 6–10 (laundry analogy) | 8086.pptx slides 11–12 (BIU/EU overlap) | Both kept. |
| 2GL = assembly language | Computer Generation.pdf p. 13 | — | Linked from research page *Program Structure*. |

## Figures

- **37 diagrams** recreated as theme-aware inline SVG (`src/diagrams/*.svg`). Each one from a slide has a
  **“View original slide”** button showing the untouched source image (`src/assets/originals/`).
  Three are marked *illustration* because they visualise text that had no figure
  (`arch-vs-org`, `flags-8085`, `interrupt-priority-8085`).
- **14 photos** extracted from Computer Generation.pdf and RISC and CISC.pdf (`src/assets/img/`).
- **1 interactive figure**: the six-step *Example Program Execution* (Basic Processor.pdf p. 17) as a stepper.
- Purely decorative clip-art on title/“thank you” slides (RISC and CISC.pdf p. 1, 2, 5, 12, 17, 22, 23) was not reproduced.

## Editorial notes (no meaning changed)

- Obvious typos in the originals were kept as written (e.g. “Characterstics”, “Hardare”, “nueral”, “pervious”), except `1,073,741,,824` → `1,073,741,824` (extraction artifact).
- Register & Memory.pdf p. 17 gives 2⁻²⁰ ≈ 0.0000000954; kept as-is with an editor's note giving the exact value.
- 8086.pptx slide 10 is titled “Features of 8085 Microprocessor” but describes the 8086; kept with a note.

## Researched pages

See [MISSING_TOPICS.md](MISSING_TOPICS.md) — 14 pages in chapters 5–7, each badged **Added by research** with sources.

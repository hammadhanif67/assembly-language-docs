# Content Map

Where every lesson on the site came from. Paths are relative to the site root.

The course material (7 PDFs and 3 PowerPoint decks in the project root) is **not** published and is not
referenced on the site. Four PDFs were scanned images with no text layer (Computer Generation, Basic
Processor, RISC and CISC, Register & Memory — 117 pages); their text was transcribed from the page images.

## Lessons from the course material

| Lesson | Site page | Source |
|---|---|---|
| Generations of Computers | `fundamentals/generations.html` | Computer Generation.pdf, p. 1–34 (six slide sections merged into one lesson) |
| Architecture vs. Organization | `fundamentals/architecture-vs-organization.html` | Computer Architecture.pdf, p. 1–17 |
| Structure and Function | `fundamentals/structure-and-function.html` | Sturuture and Function.pdf, p. 1–12 |
| Von Neumann & Harvard | `fundamentals/von-neumann-harvard.html` | Von Neumann,s.pdf, p. 1–10 |
| Machine Instruction Elements | `processor/machine-instructions.html` | Basic Processor.pdf, p. 1–9 |
| Processor Clock & Program Counter | `processor/processor-clock.html` | Basic Processor.pdf, p. 10–12 |
| Instruction Cycle | `processor/instruction-cycle.html` | Basic Processor.pdf, p. 13–20 |
| What is RISC? | `processor/risc.html` | RISC and CISC.pdf, p. 1–11 |
| CISC vs. RISC | `processor/cisc-vs-risc.html` | RISC and CISC.pdf, p. 12–16 |
| RISC Applications & Convergence | `processor/risc-applications.html` | RISC and CISC.pdf, p. 17–23 |
| The CPU — EU, BIU & Internal Bus | `registers-memory/the-cpu.html` | Register & Memory.pdf, p. 1–8 |
| Registers (8086) | `registers-memory/registers.html` | Register & Memory.pdf, p. 9–15 |
| CPU Register — What, Why & How | `registers-memory/cpu-register.html` | CPU Register.pptx, slides 1–8 |
| Types of Registers | `registers-memory/types-of-registers.html` | CPU Register.pptx, slides 9–24 |
| Memory | `registers-memory/memory.html` | Register & Memory.pdf, p. 16–24 |
| Memory Organization & Segmentation | `registers-memory/memory-segmentation.html` | Register & Memory.pdf, p. 25–31 |
| System Bus | `registers-memory/system-bus.html` | Register & Memory.pdf, p. 32–40 |
| 8085 Microprocessor | `microprocessors/8085.html` | 8085.pptx, slides 1–15 |
| 8086 Microprocessor | `microprocessors/8086.html` | 8086.pptx, slides 1–14 |

## Researched lessons (23)

`data-representation/`: number-systems, data-representation, floating-point, logic-gates ·
`processor/`: instruction-encoding, pipelining · `registers-memory/`: cache-mapping, io-techniques ·
`microprocessors/`: 8086-pins-and-modes · `assembly-basics/`: program-structure, assembler-linker-loader,
directives-and-data, addressing-modes · `instruction-set/`: data-transfer, arithmetic, logic-shift-rotate,
jumps-and-loops · `advanced/`: stack-and-procedures, arrays-and-number-io, string-instructions,
interrupts-and-io, macros, debugging. Each ends with a References section. See
[MISSING_TOPICS.md](MISSING_TOPICS.md).

## Overlaps kept

| Topic | Appears in | Handling |
|---|---|---|
| 8086 registers | Registers (8086), CPU Register, Types of Registers, 8086 Microprocessor | all kept; each adds detail the others lack |
| EU / BIU / queue | The CPU, 8086 Microprocessor | both kept |
| Fetch–decode–execute | Instruction Cycle, CPU Register | both kept |
| Pipelining | What is RISC?, 8086 Microprocessor, Pipelining & Hazards | intro, 8086 case and full treatment |

## Editorial changes

- Slide-only text removed: title/“Thank you” slides, outline banners, slide footers with web citations,
  “Contd..” headings.
- Six thin generation pages merged into one lesson with a section per generation.
- 2⁻²⁰ corrected to 0.00000095367 (the slide showed 0.0000000954).
- Original spelling in slide text otherwise kept.

## Figures

- **53 generated SVG diagrams** (`scripts/diagrams/specs-*.mjs` → `src/diagrams/`), redrawn from the
  slides plus new ones for the researched lessons.
- **12 photos**, shown in uniform 4:3 frames (generation photos paired side by side), from Computer Generation.pdf and RISC and CISC.pdf (`src/assets/img/`).
- **4 in-lesson widgets** (program-execution stepper, segment:offset calculator, number converter, stack simulator) and an **11-calculator workbench** at `tools/index.html`.

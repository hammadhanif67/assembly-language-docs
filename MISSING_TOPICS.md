# Missing Topics — gap analysis

The course material (7 PDFs + 3 PowerPoint decks, see [CONTENT_MAP.md](CONTENT_MAP.md)) covers the
*computer organization* half of COAL in depth: computer generations, architecture vs. organization,
von Neumann/Harvard, instruction formats and the instruction cycle, RISC/CISC, registers, memory,
segmentation, buses, and the 8085/8086 processors.

It does **not** teach how to *write* assembly programs. Compared with a standard Assembly Language
curriculum (e.g. Irvine, *Assembly Language for x86 Processors*; Intel *8086 Family User's Manual*;
typical CSC/COAL course outlines), these topics were missing and were researched and written for the
site. Every page below carries an **“Added by research”** badge and a *Sources* section.

| # | Missing topic | Why it is needed | Site page |
|---|---|---|---|
| 1 | Number systems (binary, octal, hex, conversions) | Every listing, address and register value is in hex/binary | `assembly-basics/number-systems.html` |
| 2 | Data representation (signed numbers, two's complement, ranges, ASCII, BCD) | Needed to understand flags, MUL/IMUL, CMP and character I/O | `assembly-basics/data-representation.html` |
| 3 | Assembly program structure & toolchain (assembler, linker, .MODEL, segments, first program) | The PDFs never show a complete program | `assembly-basics/program-structure.html` |
| 4 | Assembler directives & data definition (DB, DW, DD, DUP, EQU, OFFSET, PTR, PROC) | Required to declare variables and procedures | `assembly-basics/directives-and-data.html` |
| 5 | Addressing modes | Only mentioned in passing (CISC vs RISC slide) | `assembly-basics/addressing-modes.html` |
| 6 | Data transfer instructions (MOV, XCHG, LEA, PUSH/POP, XLAT, IN/OUT) | Core instruction group | `instruction-set/data-transfer.html` |
| 7 | Arithmetic instructions & flag effects (ADD…IDIV, CBW/CWD) | Core instruction group | `instruction-set/arithmetic.html` |
| 8 | Logic, shift & rotate instructions | Core instruction group | `instruction-set/logic-shift-rotate.html` |
| 9 | Jumps, comparisons & loops (JMP, Jcc, LOOP, if/while patterns) | “Transfer of control” is only named in the PDFs | `instruction-set/jumps-and-loops.html` |
| 10 | Stack & procedures (CALL/RET, parameters, stack frames) | The stack is introduced but never used | `advanced/stack-and-procedures.html` |
| 11 | Interrupts & I/O (IVT, INT/IRET, DOS INT 21h, BIOS, ports) | 8085 interrupts covered; 8086 software interrupts and I/O not | `advanced/interrupts-and-io.html` |
| 12 | String instructions (MOVS, CMPS, SCAS, LODS, STOS, REP) | Mentioned with SI/DI/ES but never explained | `advanced/string-instructions.html` |
| 13 | Macros | Standard curriculum topic, absent | `advanced/macros.html` |
| 14 | Debugging & tools (DEBUG, emu8086, DOSBox, common errors) | Needed to actually run the examples | `advanced/debugging.html` |

## Topics the PDFs already cover (no research page needed)

CPU architecture & organization · registers (8085, 8086, 80386) · flag register · memory hierarchy,
RAM/ROM/cache · memory organization & segmentation · physical address calculation · system bus ·
instruction cycle & pipelining · RISC vs CISC · interrupts on the 8085.

## Out of scope (deliberately not added)

Protected mode / 32- and 64-bit programming, floating point (x87/SSE), and OS internals — they go
beyond a typical first COAL course built around the 8086.

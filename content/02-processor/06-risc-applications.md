---
title: RISC Applications & Convergence
description: RISC applications, ARM architecture and products, the performance equation, RISC & CISC convergence and conclusion.
source: RISC and CISC.pdf — pages 17–23
ocr: true
---

## RISC Applications

| Low End & Mobile System | High End RISC & Supercomputing |
|---|---|
| **ARM ARCHITECTURE** — Android based systems/ Apple iPhone/ Nintendo GBA etc. | **MIPS** — used in embedded system in routers, used by Digital Equipment Corporation etc. |
| **MIPS line** — in PlayStations, Nintendo 64 etc. | **IBM'S Power Architecture** — In many IBM's supercomputers, workstations etc. |
| **Atmel AVR** — Xbox handheld controllers to BMW cars | **Alpha** — In Single-board computers, Servers & Supercomputers from Digital Equivalent Cooperation etc. |

<small>Sources : http://embeddedcraft.org/</small>

## ARM Based Products

:::figure rc-arm-products.jpg
ARM based products — Apple iPhone (ARM11), Lego Mindstrome Robot (ARM7), Paison Series game consoles (ARM7TDMI)
:::

## ARM Architecture

- Developed by Advanced RISC Machines (ARM).
- ARM makes 32-bit & 64-bit RISC multi-core processors.
- Features of ARM architecture:
  - A **load/store** architecture
  - An **orthogonal** instruction set.
  - Fixed instruction width
  - Mostly single clock-cycle execution.
  - Enhanced power-saving design.
  - Hardware virtualization supports.

<small>Sources : http://embeddedcraft.org/ · http://whatis.techtarget.com/definition/ARM-processor</small>

## Performance Equation

:::diagram performance-equation
Figure: time/program = time/cycle × cycles/instruction × instructions/program
:::

- The **CISC** approach attempts to **minimize the number of instructions per program**, sacrificing the number of cycles per instruction.
- **RISC** does the opposite, **reducing the cycles per instruction** at the cost of the number of instructions per program.

<small>Sources : https://cs.stanford.edu/people/eroberts/courses/soco/projects/risc/risccisc/index.html</small>

## RISC & CISC Convergence

With time and developments, it was observed that the line of distinction between two hardware began to blur.

**In fact two hardware seem to have adopted the strategies of the other.**

- CISC - now **executes more than one instruction within a single clock.**
- This also allows CISC chips to make use of pipelining.
- With other technological improvements, it is now possible to fit many more transistors on a single chip.
- RISC - **incorporate more complicated, CISC-like commands.**

:::diagram risc-cisc-convergence
Figure: RISC and CISC converging
:::

<small>Sources : https://cs.stanford.edu/people/eroberts/courses/soco/projects/risc/developments/index.html</small>

## Conclusion

- Experts' talk - we are in a **"post-RISC" era**, in which the two styles have become so similar that distinguishing between them is no longer relevant.
- RISC chips still retain some important traits.
  - utilize uniform, single-cycle instructions.
  - register-to-register, load/store architecture.
  - still have a large number of general purpose registers.

<small>Sources : https://cs.stanford.edu/people/eroberts/courses/soco/projects/risc/developments/index.html</small>

> Thank You For Your Time

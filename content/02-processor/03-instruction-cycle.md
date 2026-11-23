---
title: Instruction Cycle
description: The basic fetch–decode–execute cycle, CPU registers used in it, a step-by-step example program execution and the instruction cycle state diagram.
source: Basic Processor.pdf — pages 13–20
ocr: true
---

## Basic Instruction Cycle

- Fetch → Decode → Execute
- Fetch
  1. Fetch an instruction from memory
  2. Decode the instruction to determine the operation
  3. Fetch data from memory if necessary
- Execute
  4. Perform the operation on the data
  5. Store the result in memory if needed

:::diagram fetch-execute
Figure: Basic instruction cycle — Fetch Cycle and Execute Cycle
:::

### Contd..

- Internal CPU Registers used in instruction cycle:
  - Program Counter (PC) = Address of instruction
  - Instruction Register (IR) = Instruction being executed
  - Accumulator (AC) = Temporary Storage

## Computer Components: Top Level View

:::diagram top-level-view
Figure: Computer Components — Top Level View
:::

| Abbreviation | Meaning |
|---|---|
| PC | Program counter |
| IR | Instruction register |
| MAR | Memory address register |
| MBR | Memory buffer register |
| I/O AR | Input/output address register |
| I/O BR | Input/output buffer register |

## Detailed Steps

- Address in the Program Counter register
  - Program Counter (PC) holds address of next instruction to fetch
- Fetch the instruction from the memory
- Increment the Program Counter
  - Unless told otherwise
- Instruction loaded into Instruction Register (IR)
- Decode the type of instruction
- Fetch the operands
- Execute the instruction
- Store the results

## Example Program Execution

:::widget program-execution
Figure: Example Program Execution (Steps 1–6). Use the buttons to step through the six panels of the slide.
:::

<small>The memory and register values are exactly those on the slide. The step-by-step explanations in the widget are added for clarity; they follow the standard description of this figure (opcode 1 = load AC from memory, 5 = add to AC from memory, 2 = store AC to memory) in W. Stallings, <em>Computer Organization and Architecture</em>, Fig. 3.5. <a href="../assets/originals/bp-17.jpg">View the original slide</a>.</small>

## Instruction Execution Cycle

:::diagram instruction-execution-cycle
Figure: Instruction Execution Cycle — fetch, decode, execute, store the output
:::

## Instruction Cycle State Diagram

:::diagram instruction-cycle-state
Figure: Instruction Cycle State Diagram
:::

### Contd..

- **Instruction Fetch**
  - Read instruction from memory into processor
- **Instruction Operation Decoding**
  - Determine the type of operation to be performed and operand(s) to be used.
- **Operand Address Calculation**
  - If operation involves reference to an operand in memory or I/O, then determine the address of operand.
- **Operand Fetch**
  - Fetch from memory or read from I/O
- **Data Operation**
  - Perform the operation
- **Operand Store**
  - Write into memory or out to I/O if required

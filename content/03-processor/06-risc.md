---
title: What is RISC?
description: Introduction to RISC, background and history, characteristics of RISC, pipelining (the laundry analogy), RISC pipelines and hardware utilization.
---

## Introduction

- RISC, Reduced Instruction Set Computer
- RISC is a type of microprocessor architecture that utilizes
  - a small, highly-optimized set of instructions
  - rather than a more specialized set of instructions.
- The main alternative for RISC is CISC ,which stands for **complex instruction set computer.**
- CISC is the older approach, that came about to maximize performance of earlier computer's. Where instructions were executed sequentially.

:::note
The instruction set is the hardware language that tells the processor what to do.
:::

## Background and History

- RISC approach developed as a result of development in 1970's
  - increase in memory size
  - decrease in cost
  - advanced compilers
- In late 1970's IBM was the first to start.
- In 1980 , David Patterson ,began the project that gives this approach RISC.
- After some years ,Stanford MIPS was developed.

## Characterstics of RISC

- **Simplified instructions** , taking 1 clock cycle.
- Large no. of **general purpose registers**.
- **Circuit** is much **simpler**.
- Fast to decode.
- Fast to execute.
- **Pipelining-** fetching of next instruction while previous instruction executes.

## Pipelining

Pipelining, a standard feature in RISC processors, is much like an assembly line.

A useful method of demonstrating this is the laundry analogy.

Let's say that there are four loads of dirty laundry that need to be washed, dried, and folded.

- **Washer** - 30 minutes
- **Dry** - 40 minutes
- **Folding** - 20 minutes

:::diagram laundry-sequential
Figure: Sequential laundry, tasks A, B, C, D from 6 PM to Midnight (30 · 40 · 20 for each load)
:::

:::diagram laundry-pipelined
Figure: Pipelined laundry, 30 · 40 · 40 · 40 · 40 · 20
:::

## RISC Pipelines

A RISC processor pipeline operates in much the same way, although the stages in the pipeline are different

1. **fetch instructions** from memory
2. **read registers** and **decode** the instruction
3. **execute the instruction** or calculate an address
4. **access an operand** in data memory
5. **write the result** into a register

:::diagram risc-pipeline
Figure: The five stages of a RISC pipeline (Step 1 → Step 5)
:::

:::note
The length of the pipeline is dependent on the length of the longest step.
:::

## Hardare Utilization

- For any given level of general performance, a RISC chip will **typically have far fewer transistors** dedicated to the core logic which originally allowed designers to increase the size of the register set.
- RISC designs are also more likely planning to feature a **Harvard memory model**, where the instruction stream and the data stream are conceptually separated.


---
title: Pipelining & Hazards
description: How instruction pipelining speeds up a processor, how to compute speed-up, and the three hazards that slow it down — structural, data and control — with their fixes.
research: true
---

Pipelining overlaps the steps of different instructions, like an assembly line. The
[RISC](risc.html#pipelining) lesson introduces the idea with the laundry analogy; this lesson covers the
numbers and the problems.

## Pipeline timing

A **k-stage** pipeline finishes one instruction per clock once it is full. For **n** instructions:

```text
Without pipelining:  n × k cycles
With pipelining:     k + (n − 1) cycles
Speed-up          =  (n × k) / (k + n − 1)   → approaches k as n grows
```

**Example:** a 5-stage pipeline running 100 instructions needs 5 + 99 = **104** cycles instead of 500, a
speed-up of about **4.8×**.

:::diagram risc-pipeline
Five instructions in a five-stage pipeline: from cycle 5 on, one instruction completes every cycle
:::

## Hazards

A **hazard** is a situation that stops the next instruction from entering the pipeline in the next cycle.

### 1. Structural hazards

Two instructions need the **same hardware** in the same cycle, for example one fetching an instruction while
another reads data from a single shared memory.

- **Fix:** duplicate the resource, such as separate instruction and data caches (a
  [Harvard-style](../fundamentals/von-neumann-harvard.html#harvard-architecture) design).

### 2. Data hazards

An instruction needs a result that an earlier instruction has **not written yet**. This is a
read-after-write (RAW) hazard:

```asm
ADD R1, R2, R3   ; R1 = R2 + R3   (written in WB, cycle 5)
SUB R4, R1, R5   ; needs R1 in ID — too early!
```

:::diagram pipeline-hazard
A data hazard: without forwarding the second instruction waits two cycles
:::

- **Stall:** insert bubbles until the value is ready (costs cycles).
- **Forwarding (bypassing):** send the ALU result straight to the next instruction’s input. This removes
  most stalls.
- **Instruction scheduling:** the compiler moves an independent instruction between the two.

### 3. Control hazards

A **branch** is not resolved until EX, but the pipeline has already fetched the instructions after it. If
the branch is taken, those must be thrown away (**flushed**).

- **Branch prediction:** guess the outcome (for example “backward branches are taken”, since they usually
  close loops) and fetch along the guess.
- **Delayed branch:** always execute the instruction right after the branch.
- **Flush:** discard wrongly fetched instructions — the cost is the **branch penalty**.

| Hazard | Cause | Typical fix |
|---|---|---|
| Structural | two stages need one resource | duplicate hardware |
| Data | result not ready yet | forwarding, stalls, reordering |
| Control | branch target not known yet | prediction, flush, delay slot |

## Pipelining on the 8086

The 8086 has a simple two-stage pipeline: the [BIU prefetches](../microprocessors/8086.html#pipelining-in-8086)
instruction bytes into a 6-byte queue while the EU executes. A jump empties the queue, which is the 8086’s
version of a control hazard.

## Sources

- D. Patterson & J. Hennessy, *Computer Organization and Design*, ch. 4 “The Processor” (pipelining and hazards).
- W. Stallings, *Computer Organization and Architecture*, ch. 14 “Instruction pipelining”.
- Wikipedia, *Hazard (computer architecture)* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Hazard_(computer_architecture))
- Wikipedia, *Instruction pipelining* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Instruction_pipelining)

---
title: Processor Clock & Program Counter
description: Basic operations of a processor, the processor clock signal, and the program counter used to read from memory.
source: Basic Processor.pdf — pages 10–12
ocr: true
---

## Basic Operations – Processor

- Execute the software by fetching instruction from memory
- Look for any external signal and react accordingly
  - Input signals from keyboard or mouse etc.

## Processor Clock

- Heart of any processor
- Simple digital signals at equal time intervals
  - Alternate On Off states
- All activity within the CPU is synchronized with the edges (rising or falling) of this clock signal.

:::diagram clock-signal
Figure: Clock signal — rising edge, falling edge and one clock “period”
:::

**Reference**: http://www.plantation-productions.com/Webster/www.artofasm.com/Linux/HTML/SystemOrganizationa4.html

## Program Counter (a.k.a. Binary Counter)

- With every falling edge or rising edge (depending upon processor) of clock signal, the counter is incremented by one.
- Width varies from processor to processor
- The contents of PC are used as target address for the memory area

:::diagram reading-from-memory
Figure: Reading from memory
:::

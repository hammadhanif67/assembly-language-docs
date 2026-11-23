---
title: Memory
description: Bits, bytes and double words, common prefixes, memory, memory hierarchy, main and auxiliary memory, main memory circuits (RAM/ROM) and cache.
---

## Bits, Bytes and Double words

:::diagram bits-bytes-word
Figure: Two bytes form a word, 0 0 1 0 0 1 1 0 · 0 1 1 0 1 0 1 0
:::

- Each 1 or 0 is called a *bit*.
- Group of 4 bits = **N**ibble
- Group of 8 bits = **B**yte
- Group of 16 bits = **W**ord
- Group of 32 bits = **D**ouble words

## Common Prefixes

| Prefix | Abbr. | Metric Meaning | | CS Approximation | |
|---|---|---|---|---|---|
| Kilo | K | 10<sup>3</sup> | 1,000 | 2<sup>10</sup> | 1,024 |
| Mega | M | 10<sup>6</sup> | 1,000,000 | 2<sup>20</sup> | 1,048,576 |
| Giga | G | 10<sup>9</sup> | 1,000,000,000 | 2<sup>30</sup> | 1,073,741,824 |
| Tera | T | 10<sup>12</sup> | | 2<sup>40</sup> | |
| Peta | P | 10<sup>15</sup> | | 2<sup>50</sup> | |
| Milli | m | 10<sup>-3</sup> | 0.001 | 2<sup>-10</sup> | 0.0009765625 |
| Micro | µ | 10<sup>-6</sup> | 0.000001 | 2<sup>-20</sup> | 0.00000095367 |
| Nano | n | 10<sup>-9</sup> | 0.000000001 | 2<sup>-30</sup> | |
| Pico | p | 10<sup>-12</sup> | | 2<sup>-40</sup> | |
| Femto | f | 10<sup>-15</sup> | | 2<sup>-50</sup> | |


## Memory

:::figure img-core-memory.jpg side
Magnetic-core memory plane, each tiny ring stored one bit
:::

- Information processed by the computer is stored in its memory.
  - Program
  - Data
- Not all accumulated information is needed by the CPU at the same time
  - Therefore, it is more economical to use low-cost storage devices to serve as a backup for storing the information that is not currently used by CPU
- Memory Operations:
  - Read (Fetch contents of a location)
  - Write (Store data at a location)

## Memory Hierarchy

:::diagram memory-hierarchy
Figure: Memory Hierarchy, regs, cache, RAM, DISK, Removeable Media
:::


- The memory unit that directly communicate with CPU is called the *main memory*
- Devices that provide backup storage are called *auxiliary memory*
- The main memory occupies a central position by being able to communicate directly with the CPU and with auxiliary memory devices through an I/O processor
- A special very-high-speed memory called **cache** is used to increase the speed of processing by making current programs and data available to the CPU at a rapid rate

:::diagram memory-connections
Figure: Auxiliary memory ↔ I/O processor ↔ Main Memory ↔ CPU, with Cache between Main Memory and CPU
:::

## Main Memory

:::figure img-ram-module.jpg side
RAM modules, main memory is built from RAM integrated circuits
:::

- Most of the main memory in a general purpose computer is made up of RAM integrated circuits chips, but a portion of the memory may be constructed with ROM chips
- Memory Circuits:
  - RAM
    - Program Data and Instructions
    - Read and Write
  - ROM
    - Used for storing an initial program called *bootstrap loader,* which is required to start the computer software operating when power is turned off.
    - Only Read

## Cache

- A special very-high-speed memory called **cache** is used to increase the speed of processing by making current programs and data available to the CPU at a rapid rate.
- To reduce memory access time thus program execution time.

---
title: Von Neumann & Harvard Architecture
description: John von Neumann architecture, the stored-program concept, the von Neumann bottleneck and the Harvard architecture compared.
---

## Overview

- John Von Neumann Architecture
- Bottleneck in Von Neumann
- Harvard Architecture

## John Von Neumann

- The von Neumann architecture is a computer design model first described by mathematician and physicist John von Neumann in 1945.
- **Stored-Program Concept:** Both program instructions and data are held together in the same single primary memory space.
- **Sequential Execution:** The processor fetches, decodes, and executes instructions one at a time in a continuous cycle.

:::diagram von-neumann
Figure: Von Neumann Architecture
:::

## Key Causes of the Bottleneck

- **Shared Bus / Media Channel:** In the Von Neumann architecture, both the program instructions and the data reside in the same memory space. Because they share a single communication bus, the system cannot fetch an instruction and read/write data at the exact same time.
- **The Speed Gap (Memory Wall):** Over the decades, CPU processing speeds have increased exponentially, while memory access speeds (RAM) have grown at a much slower rate. This widening performance gap means the CPU can process data much faster than the bus can deliver it.
- **Sequential Execution:** The architecture relies on a strict fetch-decode-execute cycle. The CPU handles tasks one by one, making the slow transit through the bus an unavoidable structural speed limit.

## Harvard architecture

- Harvard architecture is a computer design model where program instructions and data are stored in separate memory units that are accessed through independent buses. This separation allows the processor to fetch instructions and access data simultaneously, which helps avoid the bottleneck present in traditional Von Neumann systems.
- Eliminates the Von Neumann bottleneck.
- Faster and predictable performance (suitable for real-time systems).
- Parallel access to both instructions and data..

:::diagram harvard
Figure: Harvard Architecture
:::

### Key Characteristics & Working Principle

- **Separate Memory Systems:** In a pure Harvard architecture, instruction memory and data memory are physically separate and use separate buses.
- **Instruction Memory:** Stores program instructions. ROM or Flash memory is commonly used because program code usually remains unchanged during execution.
- **Data Memory:** Stores variables, temporary data, and intermediate results during program execution. RAM is commonly used because the CPU needs to read and write this data.

## Harvard vs. Von Neumann Architecture

| Feature | Von Neumann Architecture | Harvard Architecture |
|---|---|---|
| Memory Allocation | Instructions and data share the same memory. | Instructions and data use separate memories. |
| Bus Structure | Uses a single shared set of buses. | Uses separate buses for instructions and data. |
| Bottleneck | Cannot normally fetch instructions and access data simultaneously through the shared bus. | Can fetch instructions and access data simultaneously. |
| Complexity & Cost | Simpler design and generally cheaper. | More complex design and generally costlier. |
| Primary Use Cases | PCs, laptops, and general-purpose computers. | Microcontrollers, embedded systems, and DSPs. |

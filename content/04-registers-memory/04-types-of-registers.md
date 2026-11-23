---
title: Types of Registers
description: General-purpose registers (AX, BX, CX, DX), segment registers, index registers, pointer registers and the flag register of the x86/8086.
---

## Types of Register

- General-Purpose Registers
- Segment Registers
- Pointer & Index Registers
- Instruction Pointer
- Flag Register

## General Purpose Register

The Intel 8086 microprocessor has four main 16-bit general-purpose registers—AX, BX, CX, and DX—which can also be split into eight independent 8-bit registers (AH, AL, BH, BL, CH, CL, DH, and DL) for flexible data manipulation.

## The Four Main General-Purpose Registers

### AX (Accumulator Register)

- **Size:** 16 bits (divisible into AH high-order and AL low-order 8-bit bytes).
- **Function:** Used for arithmetic (like addition and subtraction), logical operations, and data transfer. It is heavily used implicitly in multiplication, division, and input/output (I/O) instructions.

### BX (Base Register)

- **Size:** 16 bits (divisible into BH and BL).
- **Function:** Acts as a pointer or base address for memory access, frequently utilized in base-indexed and indirect addressing modes to find data in memory.

### CX (Count Register)

- **Size:** 16 bits (divisible into CH and CL).
- **Function:** Functions as a counter for looping (LOOP) and string manipulation (REP) instructions, automatically decrementing as the operation repeats.

### DX (Data Register)

- **Size:** 16 bits (divisible into DH and DL).
- **Function:** Used alongside AX during complex arithmetic like multiplication and division to hold the higher-order 16 bits of a 32-bit result (DX:AX). It also stores I/O port addresses during input/output operations.

:::diagram gp-registers
Figure: 16-bit general purpose, pointer and index registers — AX (AH/AL) Accumulator, BX (BH/BL) Base, CX (CH/CL) Count, DX (DH/DL) Data, SP Stack Pointer, BP Base Pointer, SI Source Index, DI Destination Index
:::

## Segment Register

Segment register is a 16-bit CPU register that holds the base (starting) address of a memory segment in x86 architectures.

Main Types of Segment Registers:

- Code Segment (CS)
- Data Segment (DS)
- Stack Segment (SS)
- Extra Segment (ES)

:::diagram segment-registers
Figure: Segment Registers — CS (Code Segment), DS (Data Segment), SS (Stack Segment), ES (Extra Segment)
:::


The classic x86 architecture (like the 8086) features four primary segment registers located in the Bus Interface Unit:

- **Code Segment (CS):** Points to the Code Segment where executable program instructions are stored. Hold base or starting address of all executable instruction.
- **Data Segment (DS):** Acts as the default base for storing and accessing general program data.
- **Stack Segment (SS):** Points to the memory area reserved for the call stack, handling pushes, pops, and stack frames. Contain the base location for different stack operation.
- **Extra Segment (ES):** Functions as an additional data segment, traditionally used for string and memory-transfer operations.

## Index Register

An index register is a processor register inside a computer's Central Processing Unit (CPU) used to modify operand addresses during program execution, typically for accessing arrays, vectors, or strings.

In standard architectures like the x86/8086 microprocessor family, the primary index registers are divided into two main types:

- **Source Index (SI) Register:** A 16-bit register used as a pointer for the source data in string manipulation, memory copy, and array traversal operations. It typically pairs with the Data Segment (DS) register to calculate the physical memory address.
- **Destination Index (DI) Register:** A 16-bit register used as a pointer for the destination data in string movement and block copy operations. It typically pairs with the Extra Segment (ES) register.

## Pointer Register

A pointer register is a special CPU storage location that holds a memory address instead of regular data.

### Key Types of Pointer Registers

- **Instruction Pointer (IP) / Program Counter (PC):** Stores the memory address of the next instruction the processor will run. Work with CS Register
- **Stack Pointer (SP):** Points to the current top of the program stack for managing data pushed or popped during function calls. Work with SS
- **Base Pointer (BP) / Frame Pointer:** Helps reference local variables and parameters passed inside a function's stack frame. Work with SS Register.

## Flag Register

A flag register is a special-purpose processor register that holds individual 1-bit flags reflecting the outcome of arithmetic and logical operations or controlling specific CPU functions.

In the Intel 8086 microprocessor, the flag register is a 16-bit register where 9 bits are active and use flip-flops to store 0 or 1, while the remaining bits are unused. These 9 active bits split into two main categories:

- Status Flag
- Control Flag

:::diagram flags-8086
Figure: Flags — 6 are status flags (Carry, Parity, Auxiliary, Zero, Sign, Overflow), 3 are control flag (Trap, Interrupt enable, Direction). Bits marked X are undefined.
:::

A status flag reflects the outcome of a CPU arithmetic or logical operation, while a control flag dictates how the CPU behaves or executes future operations

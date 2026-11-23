---
title: Registers (8086)
description: What registers are, general types of registers, 8086 internal registers, general purpose/data registers, segment registers, pointer and index registers and 80386 extended registers.
---

## Registers

- Registers are high-speed storage locations inside the microprocessor.
- Designed to be accessed at much higher speed than conventional memory.
- Registers are classified according to the functions they perform.
- General Types of Registers:
  - **Data Registers**: To hold data for an operation.
  - **Address Registers**: To hold the address of an instruction or data.
  - **Status/Flag Register**: keeps the current status of the processor or result of an arithmetic operation.

## 8086 Internal registers 16 bits (2 bytes each)

:::diagram i8086-registers
Figure: 8086 Internal registers, data group, pointer and index group, status and control flags, segment group
:::

- AX, BX, CX and DX are two bytes wide and each byte can be accessed separately
- These registers are used as memory *pointers*.
- **6 status; 3 control ; 7 unused**
- Segment registers are used as base address for a segment

## General Purpose/Data Registers

- Following four registers are available to the programmer for general data manipulation:
- **AX (Accumulator):** Used in arithmetic, logic and data transfer instructions. Also required in multiplication, division and input/output operations.
- **BX (Base):** It can hold a memory address that points to a variable.
- **CX (Counter):** Act as a counter for repeating or looping instructions. These instructions automatically repeat and decrement CX and quit when equals to 0.
- **DX (Data):** It has a special role in multiply and divide operations. Also used in input/output operations.

## Segment Registers

- Store addresses of instruction and data in memory.
- These values are used by the processor to access memory locations.
- **CS (Code)**: Defines the starting address of the section of memory holding code.
- **DS (Data)**: Defines the section of memory that holds most of the data used by programs.
- **ES (Extra)**: This is an additional data segment that is used by some of the string instructions.
- **SS (Stack)**: It defines the area of the memory used for stack

## Pointers and Index Registers

- These can be accessed only as 16 bit registers.
- **IP - instruction pointer**: Always points to next instruction to be executed. IP register always works together with CS segment register and it points to currently executing instruction.
- **SI - source index register**: Can be used for pointer addressing of data. Offset address relative to DS
- **DI - destination index register**: Can be used for pointer addressing of data . Offset address relative to ES
- **SI** and **DI** used in string movement instructions.
- **SP** and **BP** are used to access data inside the stack segment
- **BP - base pointer**: Primarily used to access parameters passed via the stack. Offset address relative to SS
- **SP, stack pointer**: Always points to top item on the stack. Offset address relative to SS

## 80386 Extended Registers

- The 80386/80486 processor contain 32-bit registers which greatly improve the efficiency of program that take advantage of them.
  - EAX, EBX, ECX, EDX,
  - EFLAGS
  - EIP
  - EBP, ESP, ESI, EDI.

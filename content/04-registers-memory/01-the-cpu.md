---
title: The CPU — EU, BIU & Internal Bus
description: The components of a microcomputer system, the CPU, the Execution Unit, the Bus Interface Unit, the internal bus and the Intel 8086 microprocessor organization.
---

## Outline

- The Components of Microcomputer System
  - The CPU
    - Registers
  - Memory
    - Types: RAM, ROM, Cache
    - Memory Organization & Segmentation
  - System Bus
    - Data, Address & Control

## CPU

- Brain of Computer; controls all operations
  - Uses Memory Circuits to store information
  - Uses I/O Circuits to communicate with I/O Devices
- Executes programs stored in memory
  - System programs
  - Application programs
- **Instruction Set:** Instructions performed by CPU
- Two main components:
  - Execution Unit (EU)
  - Bus Interface Unit (BIU)

## Execution Unit (EU)

- Purpose: Execute instructions
- Contains ALU (Arithmetic & Logic Unit)
  - To perform arithmetic (+, -, x,/) and logic (AND, OR, NOT) operations.
- The data for the operations are stored in circuits called **Registers**.
- A register is like a memory location except that it is referred by a name not a number (address).
- EU uses registers for:
  - Storing data.
  - Holding operands for ALU
  - To reflect result of a computation – FLAG register

## Bus Interface Unit (BIU)

- Facilitates communication between the EU and the memory or I/O circuits.
- Responsible for transmitting address, data and control signals on the buses.

## Internal Bus

- The EU and BIU are connected by an internal bus and they work together.
- While EU is executing, the BIU fetches up to six bytes of the next instruction and places them in the instruction queue.
  - Instruction Pre-fetch
  - Purpose: Speed up the processor
- If the EU needs to communicate with memory or the peripherals, the BIU suspends instruction pre-fetch and performs the needed operations.

## Intel 8086 Microprocessor Organization

:::diagram i8086-organization
Figure: Intel 8086 Microprocessor Organization — Execution Unit (EU) and BUS Interface Unit (BIU)
:::

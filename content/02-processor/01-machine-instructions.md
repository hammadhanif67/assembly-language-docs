---
title: Machine Instruction Elements
description: Opcode, operand references, instruction representation, mnemonics, instruction types, number of addresses and types of operands.
source: Basic Processor.pdf — pages 1–9
ocr: true
---

> **Computer Organization & Assembly Language — 1-Processor Basics**
>
> **Outline:** Basic Operational Concepts — Processor Clock · Instruction Representation · Instruction Cycle

## Machine Instruction Elements

- Each instruction must have elements that contain the information required by the CPU for execution.
- These elements can be:
  - **Operation code**: Specifies the operation to be performed (e.g.. ADD, I/O). The operation is specified by a binary code, known as the operation code, or opcode.
  - **Source operand reference**: The operation may involve one or more source operands, that is, operands that are inputs for the operation.
  - **Result operand reference**: The operation may produce a result. Also called destination operand.
  - **Next instruction reference**: This tells the CPU where to fetch the next instruction.

## Instruction Representation

- Within the computer, each instruction is represented by a sequence of bits.
- 16 bits instruction
  - 4 bit opcode, 6 bit operand 1, 6 bit operand 2
  - 4 bit opcode, 12 bit operand
- 32 bits instruction
- 64 bits instruction

:::diagram instruction-format
Figure: A Simple Instruction Format
:::

### Contd..

- Binary representations of machine instructions is difficult to remember.
- Use a symbolic representation of machine instructions.
- Opcodes are represented by abbreviations, called mnemonics, that indicate the operation. Common examples include:

| Mnemonic | Meaning |
|---|---|
| ADD | Add |
| SUB | Subtract |
| MPY | Multiply |
| DIV | Divide |
| LOAD | Load data from memory |
| STOR | Store data to memory |

## Instruction Types

- **Data processing**: Arithmetic and logic instructions
- **Data storage**: Memory instructions
- **Data movement**: I/O instructions
- **Transfer of Control**: Test and branch instructions

## No. of Addresses in an Instruction

- Three addresses
  - Operand 1, operand 2, result
- Two addresses
  - Source
  - Destination
- One addresses
  - Source or Destination
- Zero address
  - Zero-address instructions are applicable to a special memory organization, called a Stack. A stack is a last-in-first-out set of locations.

## Types of Operands

- Machine instructions operate on data.
- The most important general categories of data are:
  - Addresses
  - Numbers
  - Characters
  - Logical data

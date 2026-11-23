---
title: Instruction Encoding (8086 Machine Code)
description: How an 8086 instruction becomes bytes — opcode with d and w bits, the ModR/M byte, register codes, displacement and immediate data — with worked examples.
research: true
---

The [instruction format](machine-instructions.html#instruction-representation) lesson showed that an
instruction is a sequence of bits: an opcode plus operand references. This lesson shows the real format the
8086 uses, so you can read the bytes an assembler produces.

## The general format

:::diagram x86-encoding
Fields of an 8086 instruction, with the opcode and ModR/M bytes expanded
:::

An 8086 instruction is **1 to 6 bytes** long (plus optional prefixes):

| Field | Size | Purpose |
|---|---|---|
| Prefix | 0–4 bytes | segment override (`ES:`), `REP`, `LOCK` |
| Opcode | 1–2 bytes | the operation; often ends in a **d** (direction) and **w** (width) bit |
| ModR/M | 0–1 byte | which registers or memory addressing mode the operands use |
| Displacement | 0, 1 or 2 bytes | the constant part of a memory address, e.g. the `4` in `[BX+4]` |
| Immediate | 0, 1 or 2 bytes | a constant operand, e.g. the `1234h` in `MOV AX, 1234h` |

## Register codes

The 3-bit **reg** and **r/m** fields name registers with these codes. The **w** bit picks the 8- or 16-bit
register:

| Code | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| w = 1 (16-bit) | AX | CX | DX | BX | SP | BP | SI | DI |
| w = 0 (8-bit) | AL | CL | DL | BL | AH | CH | DH | BH |

## The mod and r/m fields

| mod | Meaning |
|---|---|
| 11 | r/m is a **register** (register-to-register instruction) |
| 00 | memory operand, **no** displacement (except r/m = 110: a direct 16-bit address) |
| 01 | memory operand + **8-bit** displacement |
| 10 | memory operand + **16-bit** displacement |

When mod is not 11, r/m chooses the [addressing mode](../assembly-basics/addressing-modes.html):

| r/m | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| Address | [BX+SI] | [BX+DI] | [BP+SI] | [BP+DI] | [SI] | [DI] | [BP] or direct | [BX] |

## Worked examples

### MOV AX, BX → 89 D8

- `MOV r/m16, r16` has opcode **100010 d w** with d = 0 (reg is the source) and w = 1 → `1000 1001` = **89h**.
- ModR/M: mod = **11** (register), reg = BX = **011**, r/m = AX = **000** → `11 011 000` = **D8h**.

### MOV AL, [BX+SI+4] → 8A 40 04

- Opcode 100010, d = 1 (reg AL is the destination), w = 0 (byte) → **8Ah**.
- ModR/M: mod = **01** (8-bit displacement), reg = AL = **000**, r/m = [BX+SI] = **000** → **40h**.
- Displacement byte: **04h**.

### MOV AX, 1234h → B8 34 12

A short form: opcode `1011 w reg`, so `1011 1 000` = **B8h**, followed by the immediate word stored
little-endian: **34 12**.

```text
Address  Bytes      Instruction
0100     89 D8      MOV AX, BX
0102     8A 40 04   MOV AL, [BX+SI+4]
0105     B8 34 12   MOV AX, 1234h
```

:::tip
Assemble a program with a listing file (`masm prog.asm,,prog.lst;`) or use `U` in DEBUG to see these bytes
next to each instruction. It is the quickest way to check this table.
:::

## Why this matters

- Instruction **length** decides how many bytes the 8086’s [6-byte queue](../microprocessors/8086.html#pipelining-in-8086) can hold ahead of time.
- **CISC** variety shows up here: lengths from 1 to 6 bytes, unlike the fixed-width encodings of [RISC](risc.html).
- Disassemblers and debuggers decode exactly these fields.

## Sources

- Intel, *The 8086 Family User's Manual* (1979), “Machine Instruction Encoding and Decoding” — [archive.org](https://ia801302.us.archive.org/2/items/bitsavers_intel80869lyUsersManualOct79_62967963/9800722-03_The_8086_Family_Users_Manual_Oct79.pdf)
- Wikipedia, *ModR/M* — [en.wikipedia.org](https://en.wikipedia.org/wiki/ModR/M)
- WSU EE314, *x86 instruction reference* — [eecs.wsu.edu](https://eecs.wsu.edu/~ee314/handouts/x86ref.pdf)

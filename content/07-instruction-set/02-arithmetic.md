---
title: Arithmetic Instructions
description: ADD, ADC, SUB, SBB, INC, DEC, NEG, CMP, MUL, IMUL, DIV, IDIV, CBW, CWD and how each affects the flags.
research: true
---

Arithmetic is done by the [ALU](../registers-memory/the-cpu.html#execution-unit-eu). After most
arithmetic instructions the **status flags** (CF, PF, AF, ZF, SF, OF) describe the result, so a
following conditional jump can test them.

## Addition and subtraction

| Instruction | Operation | Notes |
|---|---|---|
| `ADD d, s` | d = d + s | |
| `ADC d, s` | d = d + s + CF | add with carry — multi-word addition |
| `SUB d, s` | d = d − s | |
| `SBB d, s` | d = d − s − CF | subtract with borrow |
| `INC d` | d = d + 1 | does **not** change CF |
| `DEC d` | d = d − 1 | does **not** change CF |
| `NEG d` | d = 0 − d | two's complement |
| `CMP d, s` | d − s (result discarded) | only sets flags, used before a jump |

```asm
mov al, 250
add al, 10        ; AL = 4 (260 - 256), CF = 1, ZF = 0

; 32-bit addition with 16-bit registers: DX:AX = DX:AX + CX:BX
add ax, bx        ; low words, may set CF
adc dx, cx        ; high words + carry from the low part
```

## Which flags change?

| Flag | Set to 1 when… |
|---|---|
| **CF** | unsigned carry out of / borrow into the MSB |
| **ZF** | result is zero |
| **SF** | MSB of the result is 1 (negative if signed) |
| **OF** | signed overflow (see [Data Representation](../data-representation/data-representation.html)) |
| **PF** | the low byte of the result has an even number of 1 bits |
| **AF** | carry out of bit 3 (used for BCD) |

## Multiplication

`MUL` (unsigned) and `IMUL` (signed) take **one operand**. The other factor is always the accumulator:

| Operand size | Multiplies | Result in |
|---|---|---|
| byte: `mul bl` | AL × BL | **AX** |
| word: `mul bx` | AX × BX | **DX:AX** (high word in DX) |

```asm
mov al, 12
mov bl, 10
mul bl            ; AX = 120 (0078h)

mov ax, 1000h
mov bx, 0100h
mul bx            ; DX:AX = 0010h:0000h  (= 100000h)
```

CF and OF are set if the high half (AH or DX) holds significant bits.

## Division

`DIV` (unsigned) and `IDIV` (signed) divide the accumulator (double size) by the operand:

| Divisor size | Dividend | Quotient | Remainder |
|---|---|---|---|
| byte: `div bl` | AX | AL | AH |
| word: `div bx` | DX:AX | AX | DX |

```asm
mov ax, 100
mov bl, 7
div bl            ; AL = 14 (quotient), AH = 2 (remainder)

mov ax, -100      ; signed word division
cwd               ; sign-extend AX into DX first!
mov bx, 7
idiv bx           ; AX = -14, DX = -2
```

:::warning
**Divide overflow:** if the quotient doesn't fit in AL/AX, or the divisor is 0, the CPU raises
**interrupt 0** (“Divide overflow”) and DOS usually terminates the program. Before a word `DIV`, clear
DX (`xor dx, dx`); before `IDIV`, sign-extend with `CWD`.
:::

## Example: average of an array

```asm
.data
marks dw 72, 85, 90, 64, 79
avg   dw ?
.code
      mov ax, @data
      mov ds, ax
      xor ax, ax            ; sum = 0
      xor si, si
      mov cx, 5
add_loop:
      add ax, marks[si]
      add si, 2             ; words are 2 bytes apart
      loop add_loop         ; AX = 390
      xor dx, dx            ; DX:AX = 390
      mov bx, 5
      div bx                ; AX = 78, DX = 0
      mov avg, ax
```

## Sources

- Intel, *The 8086 Family User's Manual* (1979), ch. 2 — Arithmetic Instructions and flag effects — [archive.org](https://ia801302.us.archive.org/2/items/bitsavers_intel80869lyUsersManualOct79_62967963/9800722-03_The_8086_Family_Users_Manual_Oct79.pdf)
- Wikipedia, *FLAGS register* — [en.wikipedia.org/wiki/FLAGS_register](https://en.wikipedia.org/wiki/FLAGS_register)
- WSU EE314, *x86 instruction reference* — [eecs.wsu.edu](https://eecs.wsu.edu/~ee314/handouts/x86ref.pdf)

---
title: Tracing Code — Solved
description: How to trace 8086 code by hand with a register table — MOV and ADD with flags, loops, shifts and rotates, MUL and DIV, the stack, and CMP with signed and unsigned jumps.
research: true
---

## How to trace a program

“What is in AX after this code?” questions are solved with a **trace table**:

1. Make one column per register or memory location the code touches (and one for the flags if they are asked).
2. Go through the code **one instruction at a time**. Write the new value only in the column that changes.
3. Work in hex, and convert to decimal only when you need to compare or check.
4. For a loop, add one row per pass and watch the counter (CX for `LOOP`).
5. The last row is the answer.

## Question 1 — ADD and the flags

```asm
MOV AL, 25h
MOV BL, 0E7h
ADD AL, BL
```

**Find AL, CF, ZF, SF, OF and PF.**

| Step | Instruction | AL | BL | Note |
|---|---|---|---|---|
| 1 | `MOV AL, 25h` | 25h | — | MOV does not change flags |
| 2 | `MOV BL, 0E7h` | 25h | E7h | |
| 3 | `ADD AL, BL` | 0Ch | E7h | 25h + E7h = 10Ch → only 8 bits kept |

```text
  0010 0101   25h  (37, or +37 signed)
+ 1110 0111   E7h  (231, or −25 signed)
-----------
1 0000 1100   10Ch → AL = 0Ch, the 1 goes to CF
```

- **CF = 1** — unsigned 37 + 231 = 268 > 255.
- **ZF = 0**, **SF = 0** (bit 7 of 0Ch is 0).
- **OF = 0** — signed 37 + (−25) = 12 fits.
- **PF = 1** — `0000 1100` has two 1 bits (even).

:::answer
AL = **0Ch**; CF = 1, ZF = 0, SF = 0, OF = 0, PF = 1
:::

## Question 2 — A LOOP

```asm
    MOV CX, 5
    MOV AX, 0
L1: ADD AX, CX
    LOOP L1
```

**What are AX and CX at the end?** `LOOP` means: CX = CX − 1, then jump to the label if CX ≠ 0.

| Pass | CX before ADD | AX after `ADD AX, CX` | CX after LOOP | Jump? |
|---|---|---|---|---|
| 1 | 5 | 0 + 5 = 5 | 4 | yes |
| 2 | 4 | 5 + 4 = 9 | 3 | yes |
| 3 | 3 | 9 + 3 = 12 | 2 | yes |
| 4 | 2 | 12 + 2 = 14 | 1 | yes |
| 5 | 1 | 14 + 1 = 15 | 0 | no — fall through |

:::answer
AX = 15 = **000Fh** (5 + 4 + 3 + 2 + 1), CX = **0**. The loop body ran 5 times.
:::

## Question 3 — Shifts and rotates

```asm
MOV AL, 10110011b
SHL AL, 1
SHR AL, 1
ROR AL, 1
```

| Instruction | What happens | AL | CF |
|---|---|---|---|
| `MOV AL, 10110011b` | load | 1011 0011 (B3h) | — |
| `SHL AL, 1` | all bits move left, bit 7 → CF, a 0 enters bit 0 | 0110 0110 (66h) | 1 |
| `SHR AL, 1` | all bits move right, bit 0 → CF, a 0 enters bit 7 | 0011 0011 (33h) | 0 |
| `ROR AL, 1` | bit 0 goes round to bit 7 and also to CF | 1001 1001 (99h) | 1 |

:::tip
SHL by 1 doubles an unsigned number and SHR by 1 halves it: 66h = 102, 33h = 51. The original 1 in bit 7 was lost by SHL, so SHR does **not** give back B3h.
:::

:::answer
AL = **99h**, CF = **1**
:::

## Question 4 — MUL and DIV

```asm
MOV AX, 0
MOV AL, 25
MOV BL, 4
MUL BL
MOV BL, 7
DIV BL
```

1. `MUL BL` (byte): AX = AL × BL = 25 × 4 = 100 = **0064h**.
2. `DIV BL` (byte): AX ÷ BL = 100 ÷ 7 → quotient 14, remainder 2 (7 × 14 = 98, 100 − 98 = 2).
3. Byte division puts the **quotient in AL** and the **remainder in AH**: AL = 14 = 0Eh, AH = 02h.

:::answer
AX = **020Eh** (AH = 02h remainder, AL = 0Eh quotient)
:::

## Question 5 — Swapping with the stack

```asm
MOV AX, 1234h
MOV BX, 5678h
PUSH AX
PUSH BX
POP AX
POP BX
```

**SP starts at 0100h.** The stack is *last in, first out*.

| Instruction | AX | BX | SP | Stack (top first) |
|---|---|---|---|---|
| start | 1234h | 5678h | 0100h | empty |
| `PUSH AX` | 1234h | 5678h | 00FEh | 1234h |
| `PUSH BX` | 1234h | 5678h | 00FCh | 5678h, 1234h |
| `POP AX` | **5678h** | 5678h | 00FEh | 1234h |
| `POP BX` | 5678h | **1234h** | 0100h | empty |

:::answer
AX = **5678h**, BX = **1234h** (swapped), SP = **0100h** again
:::

## Question 6 — CMP with signed and unsigned jumps

```asm
    MOV AL, 80h
    CMP AL, 7Fh
    JA  above      ; unsigned: jump if CF = 0 and ZF = 0
    ...
above:
    JG  greater    ; signed:   jump if ZF = 0 and SF = OF
```

1. `CMP` subtracts without storing: 80h − 7Fh = 01h.
2. Flags: **CF = 0** (unsigned 128 ≥ 127), **ZF = 0**, **SF = 0**, **OF = 1** (signed −128 − 127 = −255 does not fit).
3. `JA`: CF = 0 and ZF = 0 → **jumps** — as unsigned numbers 128 > 127.
4. `JG`: ZF = 0 but SF (0) ≠ OF (1) → **does not jump** — as signed numbers −128 < 127.

:::answer
`JA` jumps, `JG` does not. The **same bits** compare differently: use JA/JB for unsigned values and JG/JL for signed values.
:::

## Sources

- Intel, *iAPX 86/88 User’s Manual* — instruction descriptions and flag effects.
- K. Irvine, *Assembly Language for x86 Processors* — tracing and conditional jumps.

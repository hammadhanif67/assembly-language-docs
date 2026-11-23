---
title: Segments & Addressing: Solved
description: 8086 physical addresses, finding the offset or segment, segment ranges, effective addresses for every addressing mode and the stack after PUSH, solved step by step.
research: true
---

All questions use the 8086 rule **Physical address = Segment × 10h + Offset**. Multiplying by 10h simply writes a 0 on the right of the hex number. Try your own values in the [segment : offset](../tools/index.html#segoff) and [effective address](../tools/index.html#ea) calculators.

## Question 1: Physical address

**Find the physical address of the logical address 40FF:938B.**

1. Formula: PA = Segment × 10h + Offset.
2. Segment × 10h: `40FFh` → `40FF0h` (write a 0 on the right).
3. Add the offset, digits lined up on the right:

```text
  4 0 F F 0 h
+   9 3 8 B h
-------------
  4 A 3 7 B h
```

Column by column from the right: 0 + B = B; F + 8 = 17h → write 7, carry 1; F + 3 + 1 = 13h → write 3, carry 1; 0 + 9 + 1 = A; 4 → 4.

:::answer
40FF:938B → **4A37Bh**
:::

## Question 2: Finding the offset

**The physical address 4A37Bh is in the segment 4A00h. What is the offset?**

1. Offset = PA − Segment × 10h.
2. Segment × 10h = 4A000h.
3. Offset = 4A37Bh − 4A000h = **037Bh**.

:::answer
Offset = **037Bh**, so 4A00:037B and 40FF:938B are the **same** byte, many logical addresses can point to one physical address.
:::

## Question 3: Finding the segment

**The physical address is 2C5A4h and the offset is 05A4h. Find the segment.**

1. Segment = (PA − Offset) ÷ 10h.
2. 2C5A4h − 05A4h = 2C000h.
3. 2C000h ÷ 10h = remove the last 0 → **2C00h**.

:::answer
Segment = **2C00h** (check: 2C000h + 05A4h = 2C5A4h ✓)
:::

## Question 4: Range of a segment

**DS = 2000h. Which physical addresses does the data segment cover?**

1. Start = DS × 10h + 0000h = **20000h**.
2. End = DS × 10h + FFFFh = 20000h + FFFFh = **2FFFFh**.
3. Size = 10000h bytes = 65,536 = 64 KB.

:::answer
**20000h, 2FFFFh** (64 KB)
:::

## Question 5: Effective and physical address for each mode

**Given BX = 0100h, BP = 0FF0h, SI = 0020h, DI = 0030h, DS = 2000h, SS = 3000h, ES = 4000h, find the effective address (EA) and physical address (PA) of the source operand.**

| Instruction | Mode | EA | Segment | PA |
|---|---|---|---|---|
| `MOV AX, [BX]` | register indirect | 0100h | DS | 20000h + 0100h = **20100h** |
| `MOV AX, [1234h]` | direct | 1234h | DS | 20000h + 1234h = **21234h** |
| `MOV AX, [BP+SI]` | based indexed | 0FF0h + 0020h = 1010h | SS (BP) | 30000h + 1010h = **31010h** |
| `MOV AX, [BX+DI+4]` | based indexed + disp | 0100h + 0030h + 4 = 0134h | DS | 20000h + 0134h = **20134h** |
| `MOV AX, [SI+10h]` | indexed + disp | 0020h + 10h = 0030h | DS | 20000h + 0030h = **20030h** |
| `MOV AX, ES:[SI]` | segment override | 0020h | ES | 40000h + 0020h = **40020h** |

**Steps for every row:**

1. Add the registers and displacement inside `[ ]` → EA (16 bits).
2. Choose the segment: if **BP** is used it is **SS**, otherwise **DS**, unless a prefix such as `ES:` overrides it.
3. PA = segment × 10h + EA.

:::warning
`[BP+SI]` uses **SS**, not DS. Forgetting the BP → SS rule is the most common error in these questions.
:::

## Question 6: The stack after PUSH

**SS = 3000h, SP = 0100h, AX = 1234h. After `PUSH AX`, what is SP, and where in memory are the bytes?**

1. PUSH first decrements SP by 2: SP = 0100h − 2 = **00FEh**.
2. Top of stack: PA = SS × 10h + SP = 30000h + 00FEh = **300FEh**.
3. The word is stored **little-endian** (low byte at the lower address): `[300FEh] = 34h`, `[300FFh] = 12h`.
4. A later `POP BX` reads 1234h into BX and sets SP back to 0100h.

:::answer
SP = **00FEh**; 34h at **300FEh**, 12h at **300FFh**
:::

## Question 7: Words in memory

**`MOV [2000h], AX` with DS = 1000h and AX = 0ABCDh. Which bytes change?**

1. PA = 10000h + 2000h = 12000h.
2. A word takes two bytes, low byte first: `[12000h] = CDh`, `[12001h] = ABh`.

:::answer
**12000h ← CDh** and **12001h ← ABh**
:::

## Sources

- Intel, *iAPX 86/88 User’s Manual*, segmentation, addressing modes, default segments, PUSH/POP.
- K. Irvine, *Assembly Language for x86 Processors*, effective address examples.

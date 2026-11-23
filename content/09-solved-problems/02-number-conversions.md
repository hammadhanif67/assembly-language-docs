---
title: Number Conversions — Solved
description: Decimal, binary, hexadecimal and octal conversions, fractions, two’s complement, binary arithmetic with flags and IEEE 754 — each solved step by step.
research: true
---

Each question shows the formula first, then every step. Try it yourself before reading the solution, then check your own numbers with the [number converter](../tools/index.html#base).

## Question 1 — Decimal to binary, hex and octal

**Convert 156 to binary, hexadecimal and octal.**

**Rule:** divide by the new base again and again; the remainders read from the **bottom up** are the answer.

**Step 1 — divide by 2 (binary):**

| Divide | Quotient | Remainder |
|---|---|---|
| 156 ÷ 2 | 78 | 0 |
| 78 ÷ 2 | 39 | 0 |
| 39 ÷ 2 | 19 | 1 |
| 19 ÷ 2 | 9 | 1 |
| 9 ÷ 2 | 4 | 1 |
| 4 ÷ 2 | 2 | 0 |
| 2 ÷ 2 | 1 | 0 |
| 1 ÷ 2 | 0 | 1 |

Reading bottom to top: **10011100b**.

**Step 2 — divide by 16 (hex):** 156 ÷ 16 = 9 remainder **12 (C)**; 9 ÷ 16 = 0 remainder **9** → **9Ch**.

**Step 3 — divide by 8 (octal):** 156 ÷ 8 = 19 r **4**; 19 ÷ 8 = 2 r **3**; 2 ÷ 8 = 0 r **2** → **234o**.

**Step 4 — check** by grouping the binary: `1001 1100` = `9 C` ✓ and `10 011 100` = `2 3 4` ✓.

:::answer
156 = **10011100b** = **9Ch** = **234o**
:::

## Question 2 — Binary to decimal

**Convert 10110101b to decimal.**

**Formula:** value = Σ bit × 2<sup>position</sup>, with the rightmost position 0.

| Bit | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 |
|---|---|---|---|---|---|---|---|---|
| Position | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
| Weight 2<sup>p</sup> | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

Add the weights where the bit is 1: 128 + 32 + 16 + 4 + 1 = **181**.

:::answer
10110101b = **181** (and = B5h, by grouping `1011 0101`)
:::

## Question 3 — Hexadecimal to decimal and binary

**Convert 3AFh to decimal and binary.**

**Step 1 — decimal**, with weights 16<sup>2</sup> = 256, 16<sup>1</sup> = 16, 16<sup>0</sup> = 1 and A = 10, F = 15:

3 × 256 + 10 × 16 + 15 × 1 = 768 + 160 + 15 = **943**

**Step 2 — binary:** replace each hex digit by 4 bits: 3 = `0011`, A = `1010`, F = `1111` → **0011 1010 1111b**.

:::answer
3AFh = **943** = **001110101111b**
:::

## Question 4 — A decimal fraction to binary

**Convert 13.375 to binary.**

**Step 1 — integer part 13:** 13 ÷ 2 = 6 r 1; 6 ÷ 2 = 3 r 0; 3 ÷ 2 = 1 r 1; 1 ÷ 2 = 0 r 1 → bottom-up `1101`.

**Step 2 — fraction 0.375:** multiply by 2 and keep the integer part, reading **top to bottom**:

| Fraction × 2 | Result | Bit |
|---|---|---|
| 0.375 × 2 | 0.75 | 0 |
| 0.75 × 2 | 1.5 | 1 |
| 0.5 × 2 | 1.0 | 1 |

The fraction is now 0, so stop → `.011`.

**Step 3 — check:** 8 + 4 + 1 + 0.25 + 0.125 = 13.375 ✓

:::answer
13.375 = **1101.011b**
:::

## Question 5 — Octal to binary and hexadecimal

**Convert 725o to binary, hexadecimal and decimal.**

1. Each octal digit → 3 bits: 7 = `111`, 2 = `010`, 5 = `101` → `111010101b`.
2. Regroup in 4s from the right: `1 1101 0101` → `0001 1101 0101` → **1D5h**.
3. Decimal: 7 × 64 + 2 × 8 + 5 = 448 + 16 + 5 = **469**.

:::answer
725o = **111010101b** = **1D5h** = **469**
:::

## Question 6 — Two’s complement

**Represent −45 as an 8-bit two’s complement number.**

1. Write +45 in 8 bits: 45 = 32 + 8 + 4 + 1 → `0010 1101`.
2. Invert every bit (one’s complement): `1101 0010`.
3. Add 1: `1101 0010` + 1 = `1101 0011`.
4. Check with the shortcut 2<sup>8</sup> − 45 = 256 − 45 = 211 = D3h ✓. The sign bit is 1, so the number is negative.

:::answer
−45 = **11010011b = D3h** (8-bit)
:::

## Question 7 — Addition with flags

**AL = 7Fh. After `ADD AL, 01h`, give AL and the flags CF, ZF, SF, OF, PF, AF.**

```text
  0111 1111   7Fh   (+127)
+ 0000 0001   01h   (+1)
-----------
  1000 0000   80h
```

1. **Result** AL = 80h.
2. **CF = 0** — unsigned 127 + 1 = 128 fits in 0 … 255, no carry out of bit 7.
3. **ZF = 0** — the result is not zero.
4. **SF = 1** — bit 7 of the result is 1.
5. **OF = 1** — two positive numbers gave a negative result: signed 127 + 1 = 128 is outside −128 … 127.
6. **PF = 0** — `1000 0000` has one 1 bit (odd).
7. **AF = 1** — the low nibbles F + 1 = 10h carry out of bit 3.

:::answer
AL = **80h**; CF = 0, ZF = 0, SF = 1, **OF = 1**, PF = 0, AF = 1
:::

## Question 8 — Subtraction with a borrow

**AL = 30h, BL = 50h. After `SUB AL, BL`, give AL and the flags.**

```text
  0011 0000   30h   (48)
- 0101 0000   50h   (80)
-----------
  1110 0000   E0h   (borrow out of bit 7)
```

1. **AL = E0h** (48 − 80 = −32, and −32 in 8 bits is E0h).
2. **CF = 1** — unsigned 48 < 80, so a borrow was needed.
3. **ZF = 0**, **SF = 1** (bit 7 is 1).
4. **OF = 0** — signed 48 − 80 = −32 fits in −128 … 127.
5. **PF = 0** — `1110 0000` has three 1 bits (odd). **AF = 0** — 0 − 0 in the low nibble needs no borrow.

:::answer
AL = **E0h** (−32); CF = 1, ZF = 0, SF = 1, OF = 0, PF = 0, AF = 0
:::

## Question 9 — IEEE 754 single precision

**Store 12.5 as a 32-bit IEEE 754 number.**

1. **Sign:** positive → S = `0`.
2. **Binary:** 12 = `1100`, 0.5 = `.1` → 12.5 = `1100.1b`.
3. **Normalise:** move the point 3 places left → `1.1001 × 2^3`.
4. **Exponent:** biased E = 3 + 127 = 130 = `10000010b`.
5. **Fraction:** the bits after the leading 1, padded to 23 bits: `1001 0000 0000 0000 0000 000`.
6. **Assemble** S | E | F: `0 10000010 10010000000000000000000`.
7. **Group in 4s for hex:** `0100 0001 0100 1000 0000 0000 0000 0000` = **41480000h**.

:::answer
12.5 = **41480000h** (S = 0, E = 130, F = 1001…)
:::

Check it with the [IEEE 754 calculator](../tools/index.html#ieee).

## Sources

- M. Morris Mano, *Digital Design* and *Computer System Architecture* — number systems and complements.
- Intel, *iAPX 86/88 User’s Manual* — ADD, SUB and how each flag is set.
- IEEE Std 754-2019 — binary floating-point formats.

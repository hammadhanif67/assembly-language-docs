---
title: Formula Sheet & How to Solve
description: Every formula used in COAL numericals on one page, and a four-step method for solving any assembly or computer-organization question.
research: true
---

## How to solve any question

Almost every COAL question — a conversion, an address, a trace or a program — is solved the same way:

1. **Write what is given.** List every value with its unit or base (`40FFh`, `2 GHz`, `16 KB`, `AL = 25h`).
2. **Pick the formula or rule.** Find it in the tables below. Write it down before putting numbers in — most marks are for the method.
3. **Substitute and work in small steps.** One operation per line; keep hex, binary and decimal clearly labelled (`h`, `b`, no suffix).
4. **Check the answer.** Convert back, check the range (does it fit in 8 or 16 bits?), check the unit, and test it with the [calculators](../tools/index.html).

:::tip
Always write the base: `10` could be ten, two (`10b`) or sixteen (`10h`). In assembly, a hex number that starts with a letter needs a leading zero: `0FFh`, not `FFh`.
:::

## Number systems

| Question | Formula / rule |
|---|---|
| Decimal → base *b* (integer) | Divide by *b* repeatedly; read the remainders **bottom to top** |
| Decimal fraction → base *b* | Multiply the fraction by *b* repeatedly; read the integer parts **top to bottom** |
| Base *b* → decimal | Σ digit × *b*<sup>position</sup> (rightmost position = 0, after the point −1, −2 …) |
| Binary → hex / octal | Group 4 bits (hex) or 3 bits (octal) from the right |
| Hex / octal → binary | Write each digit as 4 bits (hex) or 3 bits (octal) |
| Two’s complement of −*x* (*n* bits) | Invert the bits of *x* and add 1 — or 2<sup>*n*</sup> − *x* |
| Signed range (*n* bits) | −2<sup>*n*−1</sup> … 2<sup>*n*−1</sup> − 1 (8-bit: −128 … 127) |
| Unsigned range (*n* bits) | 0 … 2<sup>*n*</sup> − 1 (8-bit: 0 … 255) |
| IEEE 754 single | value = (−1)<sup>S</sup> × 1.F × 2<sup>E − 127</sup>; 1 + 8 + 23 bits |
| IEEE 754 double | value = (−1)<sup>S</sup> × 1.F × 2<sup>E − 1023</sup>; 1 + 11 + 52 bits |

## Data units

| Unit | Binary (memory) | Decimal (disks, networks) |
|---|---|---|
| 1 nibble | 4 bits | 4 bits |
| 1 byte (B) | 8 bits | 8 bits |
| 1 KB | 2<sup>10</sup> = 1,024 B | 10<sup>3</sup> = 1,000 B |
| 1 MB | 2<sup>20</sup> = 1,048,576 B | 10<sup>6</sup> B |
| 1 GB | 2<sup>30</sup> = 1,073,741,824 B | 10<sup>9</sup> B |
| 1 TB | 2<sup>40</sup> = 1,099,511,627,776 B | 10<sup>12</sup> B |

- To a **smaller** unit → **multiply** (GB → MB: × 1024). To a **bigger** unit → **divide**.
- Bytes → bits: × 8. Bits → bytes: ÷ 8. A small **b** means bits (Mbps), a capital **B** bytes (MB/s).
- Transfer time = size in bits ÷ speed in bits per second.

## Memory and addressing

| Question | Formula |
|---|---|
| Memory size from *n* address lines | 2<sup>*n*</sup> locations (bytes) — 16 lines → 64 KB, 20 → 1 MB |
| Address lines for a memory | *n* = log₂(size in bytes), rounded up |
| Highest address | 2<sup>*n*</sup> − 1 (all address bits 1) |
| Chips needed | total memory ÷ memory per chip |
| 8086 physical address | Segment × 10h + Offset |
| Offset | Physical − Segment × 10h |
| Segment range | Segment × 10h … Segment × 10h + FFFFh (64 KB) |
| Effective address (EA) | Base (BX/BP) + Index (SI/DI) + Displacement |
| Default segment | BP in the address → SS; IP → CS; SP → SS; everything else → DS |
| After PUSH / POP (16-bit) | PUSH: SP = SP − 2, then store; POP: load, then SP = SP + 2 |

## Cache and performance

| Question | Formula |
|---|---|
| Offset bits | log₂(block size) |
| Lines | cache size ÷ block size |
| Sets (*k*-way) | lines ÷ *k*; index bits = log₂(sets) |
| Tag bits | address bits − index bits − offset bits |
| Hit ratio *h* | hits ÷ (hits + misses) |
| Average access time (hierarchical) | *h* × T<sub>c</sub> + (1 − *h*) × (T<sub>c</sub> + T<sub>m</sub>) |
| Average access time (simultaneous) | *h* × T<sub>c</sub> + (1 − *h*) × T<sub>m</sub> |
| Clock period | T = 1 ÷ f (1 GHz → 1 ns) |
| Average CPI (instruction mix) | Σ (fraction × cycles) |
| CPU time | IC × CPI × T = IC × CPI ÷ f |
| MIPS | f ÷ (CPI × 10<sup>6</sup>) |
| Pipeline time (*k* stages, *n* instructions) | (*k* + *n* − 1) × τ |
| Pipeline speed-up | (*n* × *k* × τ) ÷ ((*k* + *n* − 1) × τ) → *k* for large *n* |

## Flags after arithmetic

| Flag | Set to 1 when … |
|---|---|
| CF | the unsigned result does not fit (carry out of the top bit, or a borrow) |
| ZF | the result is zero |
| SF | the top bit of the result is 1 |
| OF | the signed result does not fit (two positives give a negative, or two negatives a positive) |
| PF | the low byte of the result has an even number of 1s |
| AF | there is a carry/borrow between bit 3 and bit 4 |

## Sources

- Intel, *8086 16-bit HMOS Microprocessor* data sheet and *iAPX 86/88 User’s Manual* — physical addresses, flags, PUSH/POP.
- W. Stallings, *Computer Organization and Architecture* — cache mapping, performance equation, pipelining.
- D. Patterson & J. Hennessy, *Computer Organization and Design* — CPU time, CPI and MIPS.
- IEC 80000-13 — binary prefixes (KiB, MiB, GiB) versus decimal prefixes.

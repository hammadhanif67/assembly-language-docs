---
title: Memory, Units & Performance — Solved
description: Bits, bytes, KB, MB, GB and TB conversions, address lines and memory size, memory chips, transfer time, cache mapping, average access time, CPU time and pipelining — solved step by step.
research: true
---

The [data-unit](../tools/index.html#units), [memory](../tools/index.html#memory), [cache](../tools/index.html#cache) and [performance](../tools/index.html#perf) calculators show the same working for any numbers you type.

## Question 1 — Gigabytes to bits

**How many bits are in 3 GB of memory?**

**Rule:** to a smaller unit → multiply. Memory uses binary units: 1 GB = 1024 MB, 1 MB = 1024 KB, 1 KB = 1024 B, 1 B = 8 bits.

1. 3 GB × 1024 = 3,072 MB
2. 3,072 MB × 1024 = 3,145,728 KB
3. 3,145,728 KB × 1024 = 3,221,225,472 B
4. 3,221,225,472 B × 8 = **25,769,803,776 bits**

In one line: 3 × 2<sup>30</sup> × 8 = 3 × 2<sup>33</sup>.

:::answer
3 GB = **25,769,803,776 bits** (= 3 × 2<sup>33</sup>)
:::

## Question 2 — Bytes and bits to larger units

**(a) How many MB is 4096 KB? (b) How many KB is 12,288 bits?**

**Rule:** to a bigger unit → divide.

- (a) 4096 KB ÷ 1024 = **4 MB**
- (b) 12,288 bits ÷ 8 = 1,536 B; 1,536 B ÷ 1024 = **1.5 KB**

:::answer
(a) **4 MB** (b) **1.5 KB**
:::

## Question 3 — Why a “1 TB” disk shows 931 GB

**A disk is sold as 1 TB. Windows reports 931 GB. Explain with a calculation.**

1. Disk makers use **decimal** units: 1 TB = 10<sup>12</sup> = 1,000,000,000,000 bytes.
2. The operating system divides by **binary** units: 1 GB = 2<sup>30</sup> = 1,073,741,824 bytes.
3. 1,000,000,000,000 ÷ 1,073,741,824 = **931.32 GB** (more exactly GiB).

:::answer
No space is missing — 10<sup>12</sup> bytes ÷ 2<sup>30</sup> = **931.3 GB**. The two numbers use different units.
:::

## Question 4 — Memory size from address lines

**The 8086 has 20 address lines. How much memory can it address, and what is the address range?**

1. Formula: locations = 2<sup>n</sup> → 2<sup>20</sup> = 1,048,576.
2. One byte per location → 1,048,576 B ÷ 1024 = 1024 KB ÷ 1024 = **1 MB**.
3. Range: lowest address all 0s = **00000h**; highest = 2<sup>20</sup> − 1 = all twenty bits 1 = **FFFFFh**.

:::answer
**1 MB**, addresses **00000h – FFFFFh**. (The 8085, with 16 lines, reaches 2<sup>16</sup> = 64 KB: 0000h – FFFFh.)
:::

## Question 5 — Address lines for a memory

**How many address lines are needed for 64 KB? For 256 MB?**

1. 64 KB = 64 × 1024 = 65,536 B = 2<sup>16</sup> → **16 lines**.
2. 256 MB = 2<sup>8</sup> × 2<sup>20</sup> = 2<sup>28</sup> B → **28 lines**.

:::tip
Write the size as a power of two: K = 2<sup>10</sup>, M = 2<sup>20</sup>, G = 2<sup>30</sup>. Then the exponent is the number of lines: 64 K = 2<sup>6</sup> × 2<sup>10</sup> = 2<sup>16</sup>.
:::

:::answer
64 KB → **16** address lines; 256 MB → **28** address lines
:::

## Question 6 — Building memory from chips

**A 16 KB memory is built from 2K × 8 RAM chips. How many chips are needed, how many address lines go to each chip, and how many lines select the chip?**

1. Chips = total ÷ per chip = 16 KB ÷ 2 KB = **8 chips** (each chip is 8 bits wide, so no chips are needed side by side).
2. Each chip has 2K = 2<sup>11</sup> locations → **11 address lines** (A0–A10) go to every chip.
3. The whole memory is 16 KB = 2<sup>14</sup> → 14 lines in total.
4. Lines left for chip select = 14 − 11 = **3** (A11–A13) → a **3-to-8 decoder** picks one of the 8 chips.

:::answer
**8 chips**; **11** lines to each chip; **3** lines into a 3-to-8 decoder
:::

## Question 7 — Download time

**How long does a 500 MB file take to download at 20 Mbps?**

1. Size in bytes: 500 MB × 1,048,576 = 524,288,000 B.
2. Size in bits: 524,288,000 × 8 = 4,194,304,000 bits.
3. Speed: 20 Mbps = 20 × 1,000,000 = 20,000,000 bit/s (network speeds are always decimal).
4. Time = bits ÷ speed = 4,194,304,000 ÷ 20,000,000 = **209.7 s ≈ 3 min 30 s**.

:::warning
The most common mistake is forgetting × 8: **MB** (capital B) is megabytes, but **Mbps** (small b) is megabits per second.
:::

:::answer
≈ **209.7 seconds** (3 min 29.7 s)
:::

## Question 8 — Direct-mapped cache address split

**A computer has 16-bit addresses and a 4 KB direct-mapped cache with 16-byte blocks. Split the address 3A7Ch into tag, line and offset.**

1. Offset bits = log₂(16) = **4**.
2. Lines = 4 KB ÷ 16 B = 4096 ÷ 16 = 256 → line bits = log₂(256) = **8**.
3. Tag bits = 16 − 8 − 4 = **4**.
4. Address in binary: 3A7Ch = `0011 1010 0111 1100`.
5. Cut it 4 | 8 | 4: tag `0011` = 3, line `1010 0111` = A7h = 167, offset `1100` = 12.

:::answer
Tag = **3h**, line = **A7h (167)**, offset = **Ch (12)** — byte 12 of the block in line 167
:::

## Question 9 — Average memory access time

**Cache access 10 ns, main memory 100 ns, hit ratio 95 %. Find the average access time (a) when memory is accessed after a miss, (b) when both are accessed at the same time.**

(a) Hierarchical — a miss costs T<sub>c</sub> + T<sub>m</sub>:

T = h × T<sub>c</sub> + (1 − h)(T<sub>c</sub> + T<sub>m</sub>) = 0.95 × 10 + 0.05 × (10 + 100) = 9.5 + 5.5 = **15 ns**

(b) Simultaneous — a miss costs only T<sub>m</sub>:

T = h × T<sub>c</sub> + (1 − h) × T<sub>m</sub> = 0.95 × 10 + 0.05 × 100 = 9.5 + 5 = **14.5 ns**

:::answer
(a) **15 ns** (b) **14.5 ns** — almost 7 times faster than 100 ns without a cache
:::

## Question 10 — CPU time, CPI and MIPS

**A 2 GHz processor runs 1,000,000 instructions: 50 % take 1 cycle, 30 % take 2 cycles and 20 % take 3 cycles. Find the average CPI, the CPU time and the MIPS rating.**

1. Average CPI = Σ (fraction × cycles) = 0.5 × 1 + 0.3 × 2 + 0.2 × 3 = 0.5 + 0.6 + 0.6 = **1.7**
2. Clock period T = 1 ÷ 2 × 10<sup>9</sup> = 0.5 ns.
3. Total cycles = IC × CPI = 1,000,000 × 1.7 = 1,700,000.
4. CPU time = cycles × T = 1,700,000 × 0.5 ns = 850,000 ns = **0.85 ms**.
5. MIPS = f ÷ (CPI × 10<sup>6</sup>) = 2 × 10<sup>9</sup> ÷ (1.7 × 10<sup>6</sup>) = **1176.5**.

:::answer
CPI = **1.7**, CPU time = **0.85 ms**, **1176.5 MIPS**
:::

## Question 11 — Pipeline speed-up

**A 5-stage pipeline has a stage time of 10 ns. How long do 100 instructions take with and without pipelining, and what is the speed-up?**

1. Without a pipeline each instruction takes k × τ = 5 × 10 = 50 ns → 100 × 50 = **5000 ns**.
2. With a pipeline the first instruction needs k = 5 cycles and each of the other 99 finishes one cycle later: (k + n − 1) × τ = (5 + 100 − 1) × 10 = **1040 ns**.
3. Speed-up = 5000 ÷ 1040 = **4.81** (close to the ideal k = 5).
4. Efficiency = 4.81 ÷ 5 = 96 %.

:::answer
**5000 ns** vs **1040 ns** → speed-up **≈ 4.81**
:::

## Sources

- W. Stallings, *Computer Organization and Architecture* — cache mapping, memory organization and pipelining.
- D. Patterson & J. Hennessy, *Computer Organization and Design* — CPU performance equation.
- Intel, *8086* and *8085* data sheets — address bus widths.
- IEC 80000-13 — binary and decimal prefixes.

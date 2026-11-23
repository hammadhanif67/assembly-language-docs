---
title: Cache Memory & Mapping
description: Why caches work (locality), hits, misses and average access time, and the three mapping techniques — direct, fully associative and set-associative — plus replacement and write policies.
research: true
---

The [memory hierarchy](memory.html#memory-hierarchy) places a small, fast **cache** between the CPU and main
memory. This lesson explains how the cache decides where a memory block goes and how it finds it again.

## Why a small cache helps: locality

- **Temporal locality:** a byte used now will probably be used again soon (loop counters, variables).
- **Spatial locality:** bytes near it will probably be used soon (array elements, the next instruction).

So the cache keeps recently used **blocks** (lines) of 16–64 bytes, not single bytes.

## Hits, misses and average access time

- **Hit:** the data is in the cache. **Miss:** it must be fetched from main memory (and copied into the cache).
- **Hit ratio H** = hits ÷ total accesses.

```text
Average access time = H × Tcache + (1 − H) × (Tcache + Tmain)
```

**Example:** H = 0.95, Tcache = 2 ns, Tmain = 60 ns →
0.95 × 2 + 0.05 × 62 = 1.9 + 3.1 = **5.0 ns**, compared with 60 ns without a cache.

## Splitting the address

The cache treats every memory address as three fields:

| Field | Selects |
|---|---|
| **Offset** | the byte inside a block (block of 2ᵇ bytes → b bits) |
| **Index / line** | which cache line (or set) to look in |
| **Tag** | the rest of the address — stored with the line to tell blocks apart |

## 1. Direct mapping

Each memory block can go into **exactly one** line: `line = block number mod number of lines`.

:::diagram cache-direct
Direct-mapped cache: address 3A7Ch looks only in line 167 and compares the tag
:::

**Example:** a 4 KB cache with 16-byte lines has 256 lines. A 16-bit address splits into
tag 4 bits · line 8 bits · offset 4 bits. Address `3A7Ch` = `0011 1010 0111 1100` → tag 3, line 167, byte 12.

- ✔ Simple and fast — one comparison.
- ✘ Two blocks that map to the same line keep evicting each other (**conflict misses**).

## 2. Fully associative mapping

A block can go into **any** line. The address is just tag + offset, and every line’s tag is compared in
parallel.

- ✔ No conflict misses.
- ✘ Expensive: one comparator per line. Used only for small caches such as TLBs.

## 3. Set-associative mapping

A compromise: lines are grouped into **sets** of k lines (k-way). A block maps to one set, and can use any
line within it.

- The index field selects the **set**; k tags are compared.
- 2-, 4- and 8-way caches are common in real CPUs.

| | Direct | Set-associative (k-way) | Fully associative |
|---|---|---|---|
| Places a block can go | 1 | k | any |
| Tag comparisons | 1 | k | all lines |
| Conflict misses | most | few | none |
| Hardware cost | lowest | medium | highest |

## Replacement and write policies

When a set is full, a **replacement policy** chooses the victim: **LRU** (least recently used — the usual
choice), **FIFO**, or **random**.

When the CPU writes:

- **Write-through:** update cache and main memory together. Simple; more memory traffic.
- **Write-back:** update only the cache and mark the line *dirty*; write it to memory when it is evicted.
  Faster, but memory is temporarily out of date.

## Sources

- W. Stallings, *Computer Organization and Architecture*, ch. 4 “Cache Memory”.
- Wikipedia, *Cache placement policies* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Cache_placement_policies)
- Wikipedia, *CPU cache* — [en.wikipedia.org](https://en.wikipedia.org/wiki/CPU_cache)
- Wikipedia, *Locality of reference* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Locality_of_reference)

---
title: Memory Organization & Segmentation
description: Memory organization, addresses and contents, memory segments, segment:offset addressing, physical address calculation, an exercise and program segments.
source: Register & Memory.pdf — pages 25–31
ocr: true
---

## Memory Organization

- Memory is organized into a collection of bytes.
- Each byte is identified by a number – **Address**
  - Number of bits in an address depends on the processor
  - Example:- Intel 8086: 20-bit address, Intel 80286: 24-bit address
- Data stored in a memory byte – **Contents**

### Contd..

- Number of bits used in the address determines the number of bytes that can be accessed by the processor.
- **Example**: If processor uses 20-bit address, it can access 2<sup>20</sup> = 1048576 bytes = 1 MB of memory
- **Question**: If processor uses 24-bit address, how many bytes of memory can be accessed?

## Memory Segments

- A memory segment is a block of 2<sup>16</sup> (or 64 K) consecutive memory bytes.
- Each segment has a number.
- Within a segment, memory location is specified by an offset. This is the number of bytes from the beginning of the segment.

:::diagram memory-segments
Figure: One Segment — 8000:0000 to 8000:FFFF (segment : offset)
:::

## Segment : Offset Address

- **Logical Address = Segment : Offset**
  - 16-bit segment, 16-bit offset
- **Physical Address = Segment * 10h + Offset**
  - 20-bit address
- Example:
  - Logical Address = A4FB:4872
  - Physical Address = A4FB0h + 4872h = 0A9822h

:::widget address-calculator
Try it: physical address calculator (Physical Address = Segment × 10h + Offset)
:::

## Exercise

**A memory location has a physical address 4A37Bh. Compute:**

a. The offset address if the segment number is 40FFh.

b. The segment number if the offset address is 123Bh.

## Program Segments

- A typical machine language program is loaded into following different memory segments:
  - Code Segment
  - Data Segment
  - Stack Segment
- Stack is a data structure used by processor to implement procedure calls.

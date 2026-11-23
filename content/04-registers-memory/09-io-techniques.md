---
title: I/O Techniques — Polling, Interrupts & DMA
description: How the CPU exchanges data with devices — I/O-mapped vs memory-mapped I/O, programmed I/O (polling), interrupt-driven I/O and direct memory access (DMA).
research: true
---

The [system bus](system-bus.html#types-of-transfer) lists transfers between the processor, memory and I/O.
This lesson covers the three ways a CPU can organize those transfers, from simplest to fastest.

## Addressing devices: two schemes

| | Isolated (I/O-mapped) | Memory-mapped |
|---|---|---|
| Device registers live in | a separate I/O address space (ports) | the normal memory address space |
| Instructions | special: `IN`, `OUT` | any memory instruction: `MOV`, `AND`, … |
| On the 8086 | 64 K ports; M/IO̅ pin tells them apart | used for video memory at `B800:0000` |

```asm
in  al, 60h        ; isolated I/O: read keyboard port 60h
mov ax, 0B800h
mov es, ax
mov byte ptr es:[0], 'A'   ; memory-mapped: put 'A' at the top-left of the text screen
```

## 1. Programmed I/O (polling)

The CPU repeatedly reads a device’s **status register** until it is ready, then moves the data itself.

```asm
wait_ready:
    in   al, STATUS_PORT
    test al, 01h          ; bit 0 = "data ready"
    jz   wait_ready       ; busy-wait
    in   al, DATA_PORT    ; transfer one byte
```

- ✔ Simple, no extra hardware.
- ✘ The CPU wastes time looping while the (slow) device is not ready.

## 2. Interrupt-driven I/O

The CPU starts the device and continues other work. When the device is ready it raises an **interrupt**;
the CPU pauses, runs the device’s interrupt service routine to move the data, and resumes — see
[Interrupts & I/O](../advanced/interrupts-and-io.html#what-int-n-does).

- ✔ No busy-waiting.
- ✘ The CPU still moves every byte, and each interrupt has overhead. Too slow for disks and network cards.

## 3. Direct memory access (DMA)

A **DMA controller** moves a whole block between a device and memory **without the CPU**. The CPU only sets
it up (start address, count, direction) and is told when the block is done.

:::diagram dma
DMA: the controller borrows the system bus from the CPU with HOLD/HLDA
:::

1. The device asks the DMA controller for service (**DREQ**).
2. The controller asks the CPU for the bus by raising **HOLD**.
3. The 8086 finishes its current bus cycle, floats its bus lines and answers **HLDA** (hold acknowledge).
4. The controller drives the address and control lines and moves the data directly (**DACK** to the device).
5. It drops HOLD; the CPU takes the bus back. At the end of the block it usually interrupts the CPU.

DMA can **burst** the whole block at once or **cycle-steal** one bus cycle at a time so the CPU is not
blocked for long.

## Comparison

| | Programmed I/O | Interrupt-driven | DMA |
|---|---|---|---|
| Who moves the data | CPU | CPU (in the ISR) | DMA controller |
| CPU busy-waits | yes | no | no |
| CPU involvement per byte | high | medium | none (only setup + finish) |
| Best for | very simple or fast-polled devices | keyboards, serial ports | disks, sound, network |

## Sources

- W. Stallings, *Computer Organization and Architecture*, ch. 7 “Input/Output”.
- Intel, *8237A High Performance Programmable DMA Controller* datasheet.
- Wikipedia, *Direct memory access* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Direct_memory_access)
- Wikipedia, *Memory-mapped I/O and port-mapped I/O* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Memory-mapped_I/O_and_port-mapped_I/O)

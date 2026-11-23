---
title: System Bus
description: What a bus is, data bus, address bus, control bus, types of transfer and the interconnection structure of memory, I/O module and CPU.
---

## What is a Bus?

:::figure img-motherboard.jpg side
A motherboard, the copper traces between CPU socket, memory slots and expansion slots are the buses
:::

- A communication pathway connecting two or more devices
- Often grouped
  - A number of channels in one bus
  - e.g. 32 bit data bus is 32 separate single bit channels

:::diagram system-bus
Figure: CPU, Memory and I/O connected by the Address Bus, Control Bus and Data Bus
:::

## Data Bus

- Carries data
  - Remember that there is no difference between “data” and “instruction” at this level
- Width is a key determinant of performance
  - 8, 16, 32, 64 bit

## Address bus

- Identify the source or destination of data
  - e.g. CPU needs to read an instruction (data) from a given location in memory
- Bus width determines maximum memory capacity of system
  - e.g. 8080 has 16 bit address bus giving 64k address space

## Control Bus

- Control and timing information
  - Memory read/write signal
  - Interrupt request
  - Clock signals

## Types of Transfer

- Memory to Processor
- Processor to Memory
- I/O to Processor
- Processor to I/O
- I/O to and from Memory

## Interconnection Structure

- Memory
  - N words of equal length, each word having a unique address
  - Unit of Transfer (read/Write): Word
  - Operation: Read/Write indicated by Control Signal
  - Location of operation specified by an address
- I/O Module
  - Two operations: read and write
  - May control other external devices
  - Port: interface between I/O module and device
  - Able to send interrupt signal to CPU


- CPU
  - Reads in instruction and data
  - Writes out data
  - Uses control signal to control all operations
  - Receives interrupt signal

:::diagram interconnection
Figure: Interconnection structure, Memory, I/O Module and CPU (Address, Data Read, Data Write, Interrupt Signals)
:::

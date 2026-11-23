---
title: Data Transfer Instructions
description: MOV and its rules, XCHG, LEA, LDS/LES, XLAT, PUSH/POP, PUSHF/POPF, LAHF/SAHF and IN/OUT.
research: true
---

Data transfer instructions copy data between registers, memory, the stack and I/O ports. On the
8086, **none of them change the arithmetic flags** (except `POPF` and `SAHF`, which load the flags on
purpose).

## MOV: copy

`MOV destination, source` copies the source into the destination. The source is unchanged.

```asm
mov ax, bx          ; register  ← register
mov al, 12h         ; register  ← immediate
mov cx, [si]        ; register  ← memory
mov count, dl       ; memory    ← register
mov word ptr [bx], 5 ; memory   ← immediate (size must be given)
mov ds, ax          ; segment   ← register
```

### MOV rules (what is *not* allowed)

| Not allowed | Why / fix |
|---|---|
| `mov var1, var2` (memory → memory) | only one memory operand per instruction → go through a register |
| `mov ds, 1000h` (immediate → segment) | use `mov ax, 1000h` then `mov ds, ax` |
| `mov es, ds` (segment → segment) | go through a general register |
| `mov cs, ax` | CS can only change through jumps/calls |
| `mov al, bx` | operand sizes must match |
| `mov 5, al` | the destination can't be an immediate |

:::diagram mov-rules
Which operand combinations MOV allows
:::

## XCHG: swap

```asm
xchg ax, bx        ; swap two registers
xchg al, [si]      ; swap register with memory
```

## LEA, LDS, LES: load addresses

```asm
lea dx, msg            ; DX = offset of msg (address, not contents)
lea bx, [bx+si+4]      ; BX = BX + SI + 4, LEA can also do quick arithmetic
lds si, farptr         ; SI = word at farptr, DS = word at farptr+2
les di, farptr         ; same, loading ES:DI
```

| Instruction | Loads | Example result |
|---|---|---|
| `mov dx, word ptr msg` | the **contents** of msg (its first 2 bytes) | for `msg db 'CO…'`: DX = 4F43h ('O','C', little-endian) |
| `lea dx, msg` | the **address** (offset) of msg | DX = offset of msg, e.g. 0002h |

## XLAT: table lookup

`XLAT` replaces AL with the byte at `DS:[BX + AL]`, i.e. table translation:

```asm
.data
hex  db '0123456789ABCDEF'
.code
     lea bx, hex
     mov al, 0Ch        ; a value 0..15
     xlat               ; AL = 'C' (43h)
```

## Stack transfers

```asm
push ax       ; SP = SP - 2, [SS:SP] = AX
pop  bx       ; BX = [SS:SP], SP = SP + 2
pushf         ; push the FLAGS register
popf          ; pop into FLAGS
```

The 8086 pushes and pops **words only** (16-bit). See [Stack & Procedures](../advanced/stack-and-procedures.html) for an interactive stack.

## Flag transfers

```asm
lahf          ; AH = low byte of FLAGS (SF ZF, AF, PF, CF)
sahf          ; low byte of FLAGS = AH
```

## Port I/O: IN / OUT

The 8086 has a separate 64 K **I/O address space** (ports). Data goes through AL (byte) or AX (word):

```asm
in  al, 60h       ; read a byte from port 60h (8-bit port number in the instruction)
mov dx, 3F8h
out dx, al        ; write AL to port 3F8h (16-bit port numbers go in DX)
```

## Sources

- Intel, *The 8086 Family User's Manual* (1979), ch. 2, Data Transfer Instructions, [archive.org](https://ia801302.us.archive.org/2/items/bitsavers_intel80869lyUsersManualOct79_62967963/9800722-03_The_8086_Family_Users_Manual_Oct79.pdf)
- WSU EE314, *x86 instruction reference*, [eecs.wsu.edu](https://eecs.wsu.edu/~ee314/handouts/x86ref.pdf)
- Wikipedia, *x86 instruction listings*, [en.wikipedia.org/wiki/X86_instruction_listings](https://en.wikipedia.org/wiki/X86_instruction_listings)

---
title: Assembler Directives & Data Definition
description: Directives vs. instructions; DB, DW, DD, DUP; EQU and =; OFFSET, PTR, TYPE/LENGTH/SIZE; ORG; labels and how variables are laid out in memory.
research: true
---

An **instruction** (MOV, ADD, …) is translated into machine code that the CPU executes. A
**directive** (also called a *pseudo-op*) is a command to the **assembler**. It reserves memory,
defines constants or marks segments, and produces no instruction of its own.

## Data allocation directives

| Directive | Allocates | Example | Bytes |
|---|---|---|---|
| `DB` | byte(s) | `count db 10` | 1 |
| `DW` | word(s), 16-bit | `total dw 1234h` | 2 |
| `DD` | double word(s), 32-bit | `big dd 12345678h` | 4 |
| `DQ` / `DT` | 8 / 10 bytes | `x dq 0` | 8 / 10 |
| `DUP` | repeats an initializer | `buf db 20 dup(?)` | 20 |
| `?` | uninitialized value | `ans dw ?` | 2 |

```asm
.data
msg     db  'COAL', '$'        ; string: one byte per character
nums    db  1, 2, 3, 4, 5      ; array of 5 bytes
table   dw  10 dup(0)          ; 10 words, all zero (20 bytes)
grid    db  3 dup(4 dup('*'))  ; nested DUP: 12 stars
ptr2msg dw  msg                ; a word holding the offset of msg
```

## Little-endian layout

The 8086 stores multi-byte values **least significant byte first** (little-endian):

```asm
.data
w   dw 1234h          ; at offset 0000
d   dd 0A1B2C3D4h     ; at offset 0002
```

| Offset | 0000 | 0001 | 0002 | 0003 | 0004 | 0005 |
|---|---|---|---|---|---|---|
| Byte | `34` | `12` | `D4` | `C3` | `B2` | `A1` |
| Belongs to | w (low) | w (high) | d byte 0 | d byte 1 | d byte 2 | d byte 3 |

:::diagram data-layout
Little-endian storage: the least significant byte is at the lowest address
:::

## Constants: EQU and =

```asm
CR      equ 0Dh           ; EQU: a constant that cannot be redefined
LF      equ 0Ah
MAX     =   100           ; = : numeric constant that may be redefined later
PROMPT  equ <'Enter: $'>  ; text equate
```

Equates take **no memory**. The assembler substitutes the value wherever the name appears.

## Operators you'll use constantly

| Operator | Meaning | Example |
|---|---|---|
| `OFFSET name` | offset (address within its segment) of a label | `mov dx, offset msg` (same as `lea dx, msg` here) |
| `SEG name` | segment of a label | `mov ax, seg msg` |
| `BYTE PTR` / `WORD PTR` | tells the size of a memory operand when it's ambiguous | `mov byte ptr [bx], 5` |
| `TYPE x` | size of one element (1, 2, 4) | `mov cx, type table` → 2 |
| `LENGTH x` | number of elements in a DUP | `mov cx, length table` → 10 |
| `SIZE x` | LENGTH × TYPE | `mov cx, size table` → 20 |
| `$` | current location counter | `len equ $ - msg` |

```asm
msg db 'Hello'
len equ $ - msg          ; = 5, computed by the assembler
```

:::tip
`mov [bx], 5` is an error ("operand must have size") because the assembler can't tell whether you
mean a byte or a word. Write `mov byte ptr [bx], 5` or `mov word ptr [bx], 5`.
:::

## Other common directives

| Directive | Purpose |
|---|---|
| `.MODEL`, `.STACK`, `.DATA`, `.CODE` | simplified segment definitions (see [Program Structure](program-structure.html)) |
| `SEGMENT` / `ENDS` / `ASSUME` | full segment definitions (older style) |
| `PROC` / `ENDP` | start/end a procedure (`NEAR` or `FAR`) |
| `ORG n` | set the location counter (e.g. `org 100h` for .COM programs) |
| `INCLUDE file` | insert another source file |
| `MACRO` / `ENDM` | define a [macro](../advanced/macros.html) |
| `END label` | end of program, entry point |

## Sources

- Microsoft Learn, *MASM Directives reference* (Data allocation, Equates, Segments, Procedures) — [learn.microsoft.com](https://learn.microsoft.com/en-us/cpp/assembler/masm/directives-reference)
- HelpPC 2.10, *Macro Assembler Directives* — [panthema.net](https://panthema.net/2006/helppc21/HelpPC-2.10-HTML/asm-directives.html)
- Wikipedia, *Endianness* — [en.wikipedia.org/wiki/Endianness](https://en.wikipedia.org/wiki/Endianness)
- K. Irvine, *Assembly Language for x86 Processors*, ch. 3 “Assembly Language Fundamentals”.

---
title: Arrays & Number Input/Output
description: Declaring and indexing byte, word and 2-D arrays, finding a maximum, bubble sort, and reading or printing multi-digit decimal numbers with DOS.
research: true
---

DOS can only read and print **characters**. Real programs work with arrays of numbers, so they need two
skills: indexing arrays correctly, and converting between numbers and digit characters.

## Arrays in memory

:::diagram array-layout
A word array and a row-major 2-D array in memory
:::

```asm
.data
marks  db 72, 85, 90, 64, 79        ; byte array: element k at marks + k
nums   dw 10, 20, 30, 40            ; word array: element k at nums + 2k
grid   db 3 dup(4 dup(0))           ; 3 rows × 4 columns of bytes
N      equ 5
```

| Array | Address of element k | Indexing code |
|---|---|---|
| bytes | `base + k` | `mov al, marks[si]` with SI = k |
| words | `base + 2k` | `mov ax, nums[si]` with SI = 2k (`shl si, 1`) |
| 2-D bytes, C columns | `base + (row × C + col)` | compute in BX, then `grid[bx]` |

## Example: find the largest element

```asm
    lea  si, marks
    mov  cx, N
    mov  al, [si]          ; assume the first is the largest
next:
    cmp  al, [si]
    jae  skip              ; unsigned compare
    mov  al, [si]          ; found a larger one
skip:
    inc  si
    loop next              ; AL = 90
```

## Example: bubble sort (ascending, bytes)

```asm
    mov  cx, N - 1         ; outer loop: N-1 passes
outer:
    push cx
    lea  si, marks
inner:
    mov  al, [si]
    cmp  al, [si+1]
    jbe  no_swap
    xchg al, [si+1]        ; swap the pair
    mov  [si], al
no_swap:
    inc  si
    loop inner
    pop  cx
    loop outer             ; marks = 64, 72, 79, 85, 90
```

## Reading a decimal number from the keyboard

Read digits one at a time and build the value with **n = n × 10 + digit** until Enter (0Dh):

```asm
; read_num: returns the number typed by the user in AX (0..65535)
read_num proc
    push bx
    push cx
    xor  bx, bx            ; BX = n = 0
rd: mov  ah, 01h           ; read a character with echo → AL
    int  21h
    cmp  al, 0Dh           ; Enter ends the number
    je   rd_done
    sub  al, '0'           ; ASCII digit → value 0..9
    mov  cl, al
    mov  ax, bx
    mov  bx, 10
    mul  bx                ; DX:AX = n × 10
    xor  ch, ch
    add  ax, cx            ; + digit
    mov  bx, ax
    jmp  rd
rd_done:
    mov  ax, bx
    pop  cx
    pop  bx
    ret
read_num endp
```

## Printing a decimal number

Divide by 10 repeatedly; the remainders are the digits in **reverse** order, so push them and pop them back
out. The full `print_num` procedure is in [Stack & Procedures](stack-and-procedures.html#a-complete-example).

```text
1234 ÷ 10 = 123 r 4   → push 4
 123 ÷ 10 =  12 r 3   → push 3
  12 ÷ 10 =   1 r 2   → push 2
   1 ÷ 10 =   0 r 1   → push 1      pop: 1 2 3 4 → prints "1234"
```

## Printing a number in hexadecimal

Hex is easier: each 4-bit nibble is one digit. Rotate the top nibble into place and look it up:

```asm
; print AX as four hex digits
    mov  cx, 4
hx: rol  ax, 1             ; rotate left 4 bits (the 8086 rotates 1 bit or CL bits)
    rol  ax, 1
    rol  ax, 1
    rol  ax, 1
    push ax
    and  al, 0Fh           ; low nibble now = next digit
    add  al, '0'
    cmp  al, '9'
    jbe  pr
    add  al, 7             ; 'A'..'F'
pr: mov  dl, al
    mov  ah, 02h
    int  21h
    pop  ax
    loop hx
```

## Sources

- K. Irvine, *Assembly Language for x86 Processors*, ch. 4 “Data Transfers, Addressing, and Arithmetic” and ch. 9 “Strings and Arrays”.
- UMBC CMSC 211, *INT 21h functions*, [csee.umbc.edu](https://www.csee.umbc.edu/courses/undergraduate/CMSC211/fall01/burt/tech_help/int21.html)
- Wikipedia, *Row- and column-major order*, [en.wikipedia.org](https://en.wikipedia.org/wiki/Row-_and_column-major_order)

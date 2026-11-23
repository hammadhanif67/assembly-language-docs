---
title: Writing Programs: Solved
description: A method for writing any 8086 assembly program, and seven complete programs solved step by step, array sum, largest number, counting even numbers, reversing a string, factorial, printing a number and converting to upper case.
research: true
---

## A method for any program question

1. **Understand the task.** What is the input, what is the output, where are they (memory, register, screen)?
2. **Choose the registers.** For example: SI = pointer into the array, CX = counter, AX = result. Write this down, it is your plan.
3. **Write pseudocode** in plain words: *set total = 0; repeat n times: total = total + next element*.
4. **Translate line by line** into instructions. Loops use `LOOP` (counts CX down) or `CMP` + a conditional jump.
5. **Add the frame:** `.model`, `.stack`, `.data`, `.code`, load DS, and end with `INT 21h` function `4Ch`.
6. **Trace it** with a small example (see [Tracing Code](tracing-code.html)) before you say it is finished.

The programs run in EMU8086 or DOSBox with MASM/TASM. Program 1 shows the full frame; Programs 2-4 and 7 start at `.data`, put `.model small` and `.stack 100h` above them. Programs 5 and 6 show only the working lines: place them inside `main` after DS is loaded.

## Program 1: Sum of an array

**Add the bytes 12, 7, 25, 3, 9 and store the total in the word `sum`.**

*Plan:* SI → current element, CX = 5 (count), AX = running total. Each byte is copied into BX (with BH = 0) so it can be added to the 16-bit AX.

```asm
.model small
.stack 100h
.data
    arr  db 12, 7, 25, 3, 9
    n    equ 5
    sum  dw ?
.code
main proc
    mov  ax, @data
    mov  ds, ax          ; DS must point to our data
    mov  si, offset arr  ; SI -> first element
    mov  cx, n           ; loop 5 times
    xor  ax, ax          ; total = 0
next:
    mov  bl, [si]        ; BL = current element
    mov  bh, 0           ; BX = element as a word
    add  ax, bx          ; total = total + element
    inc  si              ; move to the next byte
    loop next            ; CX = CX - 1, repeat while CX != 0
    mov  sum, ax         ; sum = 56 = 0038h
    mov  ah, 4Ch
    int  21h             ; return to DOS
main endp
end main
```

**Trace:** AX = 12 → 19 → 44 → 47 → 56.

:::answer
`sum` = **56 (0038h)**
:::

## Program 2: Largest number in an array

**Find the largest of 12, 7, 25, 3, 9.**

*Plan:* take the first element as the largest (AL), then compare it with each of the other n − 1 elements; if an element is bigger, it becomes the new largest.

```asm
.data
    arr  db 12, 7, 25, 3, 9
    n    equ 5
    big  db ?
.code
main proc
    mov  ax, @data
    mov  ds, ax
    mov  si, offset arr
    mov  al, [si]        ; largest so far = first element
    mov  cx, n - 1       ; 4 more elements to check
again:
    inc  si
    cmp  al, [si]        ; largest so far vs. next element
    jae  keep            ; unsigned: AL >= element, keep AL
    mov  al, [si]        ; found a bigger one
keep:
    loop again
    mov  big, al         ; big = 25
    mov  ah, 4Ch
    int  21h
main endp
end main
```

**Trace:** AL = 12; compare 7 (keep 12); 25 (AL = 25); 3 (keep); 9 (keep).

:::answer
`big` = **25 (19h)**. For signed numbers use `JGE` instead of `JAE`.
:::

## Program 3: Count the even numbers

**How many of 12, 7, 26, 3, 8 are even?**

*Idea:* a number is even when bit 0 is 0. `TEST AL, 1` checks bit 0 without changing AL: ZF = 1 means even.

```asm
.data
    arr   db 12, 7, 26, 3, 8
    n     equ 5
    evens db 0
.code
main proc
    mov  ax, @data
    mov  ds, ax
    mov  si, offset arr
    mov  cx, n
check:
    mov  al, [si]
    test al, 1           ; bit 0 = 1 means odd
    jnz  odd
    inc  evens           ; even: count it
odd:
    inc  si
    loop check
    mov  ah, 4Ch
    int  21h
main endp
end main
```

**Trace:** 12 even (1), 7 odd, 26 even (2), 3 odd, 8 even (3).

:::answer
`evens` = **3**
:::

## Program 4: Reverse a string with the stack

**Print `COAL` backwards.**

*Idea:* push every character, then pop them, the stack gives them back in reverse order. PUSH works on words, so the character is pushed in AX (AL = character).

```asm
.data
    msg  db 'COAL'
    len  equ $ - msg     ; = 4, the assembler counts the bytes
.code
main proc
    mov  ax, @data
    mov  ds, ax
    mov  si, offset msg
    mov  cx, len
push_all:
    mov  al, [si]
    push ax              ; push C, O, A, L
    inc  si
    loop push_all

    mov  cx, len
pop_all:
    pop  dx              ; DL = L, A, O, C
    mov  ah, 02h         ; DOS: print the character in DL
    int  21h
    loop pop_all

    mov  ah, 4Ch
    int  21h
main endp
end main
```

:::answer
The screen shows **LAOC**
:::

## Program 5: Factorial

**Compute 5! = 5 × 4 × 3 × 2 × 1.**

*Plan:* AX = 1, CX = 5. `MUL CX` multiplies AX by CX (result in DX:AX), then `LOOP` counts CX down.

```asm
    mov  cx, 5
    mov  ax, 1
fact:
    mul  cx              ; DX:AX = AX * CX
    loop fact            ; CX = 4, 3, 2, 1, 0
    ; AX = 120 = 0078h
```

| CX | AX after `MUL CX` |
|---|---|
| 5 | 1 × 5 = 5 |
| 4 | 5 × 4 = 20 |
| 3 | 20 × 3 = 60 |
| 2 | 60 × 2 = 120 |
| 1 | 120 × 1 = 120 |

:::answer
AX = **120 (0078h)**. 8! = 40,320 is the largest factorial that fits in AX; 9! needs DX:AX.
:::

## Program 6: Print a number in decimal

**Print the value 2468 that is stored in AX.**

*Idea:* divide by 10 again and again; each remainder is one digit, but they come out **last digit first**. Push them, then pop and print, the stack puts them back in order. Add `'0'` (30h) to turn a digit into its ASCII character.

```asm
    mov  ax, 2468
    mov  bx, 10
    xor  cx, cx          ; CX counts the digits
divide:
    xor  dx, dx          ; DX:AX is the dividend, clear DX
    div  bx              ; AX = quotient, DX = remainder (0-9)
    push dx              ; save the digit
    inc  cx
    cmp  ax, 0
    jne  divide          ; until the quotient is 0
print:
    pop  dx
    add  dl, '0'         ; 2 -> '2' (32h)
    mov  ah, 02h
    int  21h
    loop print
```

| Divide | Quotient (AX) | Remainder (pushed) |
|---|---|---|
| 2468 ÷ 10 | 246 | 8 |
| 246 ÷ 10 | 24 | 6 |
| 24 ÷ 10 | 2 | 4 |
| 2 ÷ 10 | 0 | 2 |

Popped in reverse: 2, 4, 6, 8.

:::answer
The screen shows **2468**
:::

## Program 7: Convert a string to upper case

**Change `hello, coal!` to upper case and print it.**

*Idea:* a lower-case letter is 20h more than its capital (`'a'` = 61h, `'A'` = 41h). Only change characters from `'a'` to `'z'`; stop at the `'$'` terminator.

```asm
.data
    txt  db 'hello, coal!$'
.code
main proc
    mov  ax, @data
    mov  ds, ax
    mov  si, offset txt
conv:
    mov  al, [si]
    cmp  al, '$'         ; end of string?
    je   done
    cmp  al, 'a'
    jb   skip            ; below 'a': not a lower-case letter
    cmp  al, 'z'
    ja   skip            ; above 'z': not a lower-case letter
    sub  al, 20h         ; 'h' (68h) -> 'H' (48h)
    mov  [si], al
skip:
    inc  si
    jmp  conv
done:
    mov  dx, offset txt
    mov  ah, 09h         ; DOS: print the string up to '$'
    int  21h
    mov  ah, 4Ch
    int  21h
main endp
end main
```

:::answer
The screen shows **HELLO, COAL!**, the comma, space and `!` are unchanged.
:::

## Sources

- Microsoft, *MASM 6.1 Programmer’s Guide*, `.model`, `.data`, `.code`, `equ`, `$`.
- Ralf Brown’s Interrupt List, INT 21h functions 02h, 09h and 4Ch.
- K. Irvine, *Assembly Language for x86 Processors*, loops, arrays and string processing.

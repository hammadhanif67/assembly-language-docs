---
title: Logic Gates & Boolean Algebra
description: The basic gates (AND, OR, NOT, NAND, NOR, XOR), truth tables, Boolean laws including De Morgan's theorem, and building an adder from gates.
research: true
---

Every operation the ALU performs, adding, comparing, ANDing, is built from **logic gates**: tiny circuits
that combine binary inputs into a binary output. Boolean algebra is the mathematics used to describe and
simplify them.

## The basic gates

:::diagram logic-gates
Standard symbols and Boolean expressions of the six basic gates
:::

| A | B | AND | OR | NAND | NOR | XOR | XNOR |
|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 1 | 1 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 |
| 1 | 0 | 0 | 1 | 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 |

NOT has a single input: NOT 0 = 1 and NOT 1 = 0.

:::note
**NAND** and **NOR** are *universal* gates: any circuit at all can be built from NAND gates alone (or NOR
gates alone). Chip makers use this because one kind of gate is cheaper to manufacture in bulk.
:::

## Boolean laws

| Law | AND form | OR form |
|---|---|---|
| Identity | A · 1 = A | A + 0 = A |
| Null | A · 0 = 0 | A + 1 = 1 |
| Idempotent | A · A = A | A + A = A |
| Complement | A · A̅ = 0 | A + A̅ = 1 |
| Commutative | A · B = B · A | A + B = B + A |
| Distributive | A · (B + C) = A·B + A·C | A + B·C = (A + B)(A + C) |
| Absorption | A · (A + B) = A | A + A·B = A |
| **De Morgan** | (A · B)̅ = A̅ + B̅ | (A + B)̅ = A̅ · B̅ |

De Morgan’s theorem says: break the bar and change the operator. It is how a NAND gate can stand in for an
OR gate with inverted inputs.

## From gates to arithmetic: the half adder

Adding two single bits gives a **sum** bit and a **carry** bit:

| A | B | Carry | Sum |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 0 |

The Sum column is exactly XOR and the Carry column is exactly AND:

:::diagram half-adder
A half adder: one XOR gate and one AND gate
:::

A **full adder** also takes a carry-in from the previous bit: Sum = A ⊕ B ⊕ Cᵢₙ and
Cₒᵤₜ = A·B + Cᵢₙ·(A ⊕ B). Chaining 16 full adders gives the 16-bit adder inside the 8086’s ALU; the carry
out of the top bit becomes the **CF** flag.

## The same operations in assembly

The [logic instructions](../instruction-set/logic-shift-rotate.html) apply these gates to every bit of a
register at once:

```asm
mov al, 11001010b
and al, 11110000b   ; AL = 11000000b  (AND, bit by bit)
or  al, 00000011b   ; AL = 11000011b  (OR)
xor al, 11111111b   ; AL = 00111100b  (XOR with 1s = NOT)
not al              ; AL = 11000011b
```

## Sources

- M. Morris Mano, *Digital Design*, ch. 2 “Boolean Algebra and Logic Gates”.
- Wikipedia, *Logic gate*, [en.wikipedia.org](https://en.wikipedia.org/wiki/Logic_gate)
- Wikipedia, *De Morgan's laws*, [en.wikipedia.org](https://en.wikipedia.org/wiki/De_Morgan%27s_laws)
- Wikipedia, *Adder (electronics)*, [en.wikipedia.org](https://en.wikipedia.org/wiki/Adder_(electronics))

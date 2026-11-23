---
title: CISC vs. RISC
description: Instruction, code size, registers and addressing modes, and execution/decoding differences between CISC and RISC.
source: RISC and CISC.pdf — pages 12–16
ocr: true
---

## Instruction

| CISC | RISC |
|---|---|
| Complex Instructions. | Simpler or reduced instructions. |
| `ADD AX,[BX + SI + 600H]` | `LOAD R1, addresss1`<br>`LOAD R2, address2`<br>`ADD R1, R2`<br>`STORE address1, R1` |
| Many operations in single instruction. | One instruction one operation. |

```asm
; CISC
ADD AX,[BX + SI + 600H]
```

```asm
; RISC
LOAD R1, addresss1
LOAD R2, address2
ADD R1, R2
STORE address1, R1
```

## Code Size

:::diagram code-size
Figure: CISC — Code size is smaller but complicated. RISC — Code size is larger but simpler.
:::

| CISC | RISC |
|---|---|
| Code size is smaller but complicated. | Code size is larger but simpler. |

## Registers and Addressing Mode

| CISC | RISC |
|---|---|
| Fewer register. | Large number of registers. |
| These registers are designed for special purposes. | Here registers are identical so any register can be used for any purpose. |
| CISC designs provide a large number of addressing modes. | RISC designs have single addressing modes. |

## Execution and Design

| CISC | RISC |
|---|---|
| Slower to execute. | Faster execution. |
| Difficult to decode. | Easy to decode. |
| Instruction size varies in different instructions. | Same instruction size in every instructions. |
| Complex circuit design. | Circuit design is simpler. |

<small>Sources : http://techupdates.in/difference-between-risc-and-cisc-processor-architectures/</small>

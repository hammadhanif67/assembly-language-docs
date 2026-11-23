---
title: Floating-Point Numbers (IEEE 754)
description: How computers store real numbers — sign, exponent and fraction, the bias, converting a decimal number by hand, special values, and why 0.1 is not exact.
research: true
---

Integers cover whole numbers. Real numbers such as 3.14 or −0.000052 need a **floating-point** format: the
number is stored like scientific notation, a significant part multiplied by a power of two. Almost every
processor uses the **IEEE 754** standard.

## The three fields

:::diagram ieee754-layout
IEEE 754 single and double precision formats
:::

| Field | Single (32-bit) | Double (64-bit) | Meaning |
|---|---|---|---|
| Sign **S** | 1 bit | 1 bit | 0 = positive, 1 = negative |
| Exponent **E** | 8 bits, bias 127 | 11 bits, bias 1023 | power of two, stored with a bias so it is never negative |
| Fraction **F** | 23 bits | 52 bits | digits after the binary point; the leading `1.` is implied |

For normal numbers:

```text
value = (−1)^S × 1.F × 2^(E − bias)
```

The implied leading 1 gives one free bit of precision: single precision keeps about **7 decimal digits**,
double precision about **15–16**.

## Converting a decimal number by hand

Store **−6.75** as a single-precision float:

1. **Sign:** negative → S = 1.
2. **Binary:** 6 = `110`, 0.75 = 0.5 + 0.25 = `.11` → 6.75 = `110.11`.
3. **Normalize:** `110.11` = `1.1011 × 2²`.
4. **Exponent:** 2 + 127 = 129 = `1000 0001`.
5. **Fraction:** the bits after the point, padded to 23 bits: `1011 0000 0000 0000 0000 000`.

```text
S  Exponent   Fraction
1  10000001   10110000000000000000000
= 1100 0000 1101 1000 0000 0000 0000 0000 = C0D80000h
```

## Special values

| Exponent bits | Fraction | Meaning |
|---|---|---|
| all 0 | 0 | ±0 (there is a positive and a negative zero) |
| all 0 | ≠ 0 | subnormal number (very close to zero, no implied 1) |
| all 1 | 0 | ±infinity (for example 1.0 / 0.0) |
| all 1 | ≠ 0 | NaN, “not a number” (for example 0.0 / 0.0) |

## Range and precision

| | Single | Double |
|---|---|---|
| Largest value | ≈ 3.4 × 10³⁸ | ≈ 1.8 × 10³⁰⁸ |
| Smallest normal value | ≈ 1.2 × 10⁻³⁸ | ≈ 2.2 × 10⁻³⁰⁸ |
| Decimal digits of precision | ≈ 7 | ≈ 15–16 |

## Why 0.1 is not exact

Only fractions whose denominator is a power of two have a finite binary expansion. 0.1 = 1/10 becomes
`0.000110011001100…` repeating forever, so it is rounded. That is why `0.1 + 0.2` prints as
`0.30000000000000004` in many languages.

:::tip
Never compare floating-point results with `==`. Check whether the difference is smaller than a tolerance
instead, for example `|a − b| < 1e-9`.
:::

## Floating point and the 8086

The 8086 itself has **no floating-point instructions**. Real numbers were handled either in software or by
the **8087 math coprocessor**, which added an 80-bit internal format and instructions such as `FADD`,
`FMUL` and `FSQRT`. From the 80486 onward the floating-point unit is built into the CPU.

## Sources

- IEEE, *IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019)* — [standards.ieee.org](https://standards.ieee.org/ieee/754/6210/)
- Wikipedia, *Single-precision floating-point format* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Single-precision_floating-point_format)
- Wikipedia, *Intel 8087* — [en.wikipedia.org](https://en.wikipedia.org/wiki/Intel_8087)
- D. Goldberg, *What Every Computer Scientist Should Know About Floating-Point Arithmetic* (1991) — [docs.oracle.com](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)

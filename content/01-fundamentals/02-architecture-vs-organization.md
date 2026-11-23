---
title: Architecture vs. Organization
description: Computer architecture and computer organization, their attributes, the multiply instruction example, the IBM System/370 family and microcomputers.
---

## Organization and Architecture

In describing computers, a distinction is often made between:

- Computer Architecture
- Computer Organization

Although it is difficult to give precise definitions for these terms, there is general agreement about the areas covered by each.

## Computer Architecture

Computer Architecture refers to those attributes of a system that are:

- Visible to a programmer
- Directly related to the logical execution of a program

In other words, architecture deals with the features of a computer system that a programmer can observe or that affect program execution.

## Architectural Attributes

Examples of architectural attributes include:

- Instruction set
- Number of bits used to represent various data types
  - Numbers
  - Characters
- I/O mechanisms
- Techniques for addressing memory

These attributes have a direct impact on how a program is executed.

## Computer Organization

Computer Organization refers to:

- The operational units and their interconnections that realize the architectural specifications.
- Organization deals with the internal implementation of the computer system.
- It includes hardware details that are generally transparent to the programmer.

## Organizational Attributes

Examples of organizational attributes include:

- Control signals
- Interfaces between the computer and peripherals
- Memory technology used
- Operational units and their interconnections

These hardware details implement the specifications defined by the architecture.

## Architecture vs. Organization

:::diagram arch-vs-org
Figure: Architecture (visible to the programmer) vs. Organization (how it is implemented)
:::

**Computer Architecture**

Concerned with attributes visible to the programmer.

Examples:

- Instruction set
- Data representation
- I/O mechanisms
- Memory addressing

**Computer Organization**

Concerned with operational units and their interconnections.

Examples:

- Control signals
- Peripheral interfaces
- Memory technology

## Multiply Instruction

Will a computer have a multiply instruction?

This is an architectural design issue because the instruction is part of the instruction set visible to the programmer.

The next question is:

How will the multiply instruction be implemented?

This is an organizational issue.

## Implementation of Multiply

The multiply instruction may be implemented by:

- A special multiply unit

or

- A mechanism that makes repeated use of the add unit of the system.

The choice is an organizational decision.

## Factors Affecting the Organizational Decision

The organizational decision may be based on:

- Anticipated frequency of use of the multiply instruction
- Relative speed of the two approaches
- Cost of a special multiply unit
- Physical size of a special multiply unit
- Thus, different implementation choices can provide different price and performance characteristics.

## Same Architecture, Different Organization

Many computer manufacturers offer a family of computer models.

These models may have:

- The same architecture
- Different organizations

Consequently, different models in the same family can have different:

- Price
- Performance

## Architecture Across Different Models

A particular architecture may:

- Span many years
- Include different computer models
- Have its organization changed according to changing technology

The architecture can remain the same while the underlying organization changes.

## IBM System/370 Example

A prominent example is the IBM System/370 architecture.

- Introduced in 1970
- Included a number of different models
- Models had different price and performance characteristics

A customer with modest requirements could choose a cheaper, slower model.

If requirements increased, the customer could later upgrade to a more expensive, faster model.

## Software Compatibility

- The newer IBM System/370 models retained the same architecture.
- Therefore, customers could upgrade their computer without abandoning the software that had already been developed.
- The organization changed with improved technology while the architecture remained compatible.
- This protected the customer's software investment.

## Microcomputers

In a class of computers called microcomputers, the relationship between architecture and organization is very close.

Changes in technology:

- Influence organization
- Can also result in more powerful and complex architectures

There is generally less requirement for generation-to-generation compatibility for these smaller machines.

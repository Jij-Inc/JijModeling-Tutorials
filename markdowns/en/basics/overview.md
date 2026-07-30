---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# Overview

In the following sections, we will go through the essential basics for working with mathematical optimization problems in JijModeling.
We will also introduce the Plain API and the Decorator API side by side when it is helpful, as mentioned in the {doc}`../introduction` section.
Before moving on, it helps to skim at least one of the quickstarts ({doc}`SCIP <../quickstart/scip>` or {doc}`OpenJij <../quickstart/openjij>` versions) to get a feel for the overall workflow.

:::{seealso}
For a general introduction to mathematical optimization, see other references such as JijZept's "[Basics of Mathematical Optimization](https://www.jijzept.com/ja/docs/tutorials/optimization_basics/01-introduction/)".
:::

This section covers the following topics:

1. **{doc}`problem`**: In JijModeling, variables and constraints are always registered into a specific mathematical model. We start with how to declare a model.
2. **{doc}`variables`**: We discuss the kinds of **variables** that are basic components of mathematical models, such as placeholders and decision variables.
   + **{doc}`placeholders`**: How to declare **placeholders**, variables whose values are provided by users when compiling a mathematical model, and **category labels**.
   + **{doc}`decision_variables`**: How to declare **decision variables**, variables whose values are determined by a solver after compilation.
3. **{doc}`expressions`**: How to build expressions in JijModeling, used for objectives, constraints, and variable shapes.
4. **{doc}`modeling`**: How to set objectives and constraints using the elements above.
5. **{doc}`instance_generation`**: How to provide instance data and generate instances, with a brief note on the configuration of constraint detection.

## Terminology

Throughout  this document, "natural numbers" mean non-negative integers including $0$.
We also use "scalar" to collectively refer to natural numbers, integers, and real numbers.
A constant expression that represents a concrete numeric value without any variables, such as $1, 2, 3$ or $5.2$, is called a "constant literal".

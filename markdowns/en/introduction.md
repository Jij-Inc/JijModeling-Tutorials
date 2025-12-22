---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# Introduction

## What is JijModeling?

**JijModeling** is a Python package designed to describe optimization problems intuitively. Its main characteristics include:

- You can describe the definition of a mathematical model separately from its parameters, which accelerates model validation and makes reuse easier. The size of each instance does not affect the performance of writing or manipulating the model description.
- It serves as a common interface for a variety of optimization problems—such as linear programming, mixed-integer programming, and nonlinear programming—so you can describe problems in a solver-agnostic way.
- Mathematical models can be manipulated programmatically, allowing you to build them step by step or capture more complex problems more easily.
- It integrates into the existing Python ecosystem and works seamlessly with tools such as Jupyter, NumPy, and pandas.
- LaTeX output is supported, and when used together with Jupyter you can quickly and interactively verify that a model is constructed as intended.
- The symbolic structure of an optimization problem can be detected and utilized to automatically speed up solving.
- The described expressions are type-checked as needed, so most modeling mistakes—such as index mismatches—can be detected before providing data.

JijModeling is a mathematical optimization modeler, that is, a tool for describing mathematical models in Python code. It does not include a specific solver. After you formulate a model with JijModeling, you provide real parameters, convert the model into an intermediate format called an OMMX message, and pass it to various solvers to obtain solutions.
By separating the algebraic structure of a mathematical model from its input data, you can reason about, validate, and modify the model more quickly. Because each model can swap input data, it also serves as a schema for generating solver inputs from parameters.

To solve a model described in JijModeling with a solver, combine it with actual instance data and convert it into the solver's input format using tools provided by [JijZept services](https://www.jijzept.com), such as the [OMMX Adapter](https://jij-inc.github.io/ommx/en/introduction.html).

+++

## Installation

If you use `pip`, install `jijmodeling` with the following command:

```bash
pip install 'jijmodeling>=2.0.0b8'
```

If you are using uv, run:

<!-- FIXME: After the official release, drop the version spec >=2.0.0b8 -->

```bash
uv add 'jijmodeling>=2.0.0b8'
```

Note that `jijmodeling` requires Python 3.11 or later.

```{code-cell} ipython3
import jijmodeling
jijmodeling.__version__
```

:::{caution}
When running the code in this document, we strongly recommend using the same version of `jijmodeling` as shown above.
:::

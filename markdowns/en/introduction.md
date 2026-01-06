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

**JijModeling** is a mathematical optimization modeler—a tool that lets you describe mathematical models in Python code.
It is not tightly coupled to a specific solver. After you supply real parameters into a model formulated with JijModeling, it is converted into an intermediate format called an OMMX message. Then, you can pass it to various solvers to obtain solutions.
By separating the algebraic structure of a mathematical model from its input data, you can reason about, validate, and modify the model more quickly. Because each model can swap input data, it also serves as a schema for generating solver inputs from parameters.

To solve a model described in JijModeling with a solver, combine it with actual instance data and convert it into the solver's input format using tools provided by [JijZept services](https://www.jijzept.com), such as the [OMMX Adapter](https://jij-inc.github.io/ommx/en/introduction.html).

The main features of JijModeling are as follows.

### Separation of model definitions and parameters

Separating definitions from data accelerates model verification and makes reuse easier.
The size of an instance never affects the performance of writing or manipulating the model description.

### Solver-agnostic general-purpose modeler

JijModeling is designed as a general-purpose modeler that serves as a common interface for a wide range of optimization problems, including linear, mixed-integer, and nonlinear programming.
Because JijModeling eventually compiles to the [OMMX format](https://jij-inc.github.io/ommx/en/introduction.html), model descriptions are solver-agnostic.

### Symbolic treatment of models

Mathematical models are described symbolically, allowing you to build them step by step or implement symbolic transformations of existing models so that more complex problems are easier to capture.
JijModeling can detect the symbolic structure of an optimization problem and use it to accelerate solving automatically.
Furthermore, the expressions are type-checked as needed, so most modeling mistakes—such as index mismatches—are detected before providing data.

### Integration with the Python ecosystem

JijModeling integrates seamlessly with Jupyter, NumPy, pandas, and the broader Python ecosystem.
When you work in Jupyter, the LaTeX output functionality lets you verify interactively that a mathematical model is constructed as intended.

From version 2.0 onward, JijModeling also supports a **Decorator API**, a shorthand that uses `@`-prefixed function definitions (decorators) on top of the regular API.
It enables a more "Pythonic" modeling style, such as omitting explicit names when defining variables and using comprehensions to express symbolic summations.

Without the Decorator API, you might write the following:

```python
problem = jm.Problem("My Problem")
N = problem.Length("N")
x = problem.BinaryVar("x", shape=N)
problem += jm.sum(N.filter(lambda i: i % 2 == 0).map(lambda i: x[i]))
```

With the Decorator API, the same formulation becomes more natural:

```python
@jm.Problem.define("My Problem")
def my_problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=N)
    problem += jm.sum(x[i] for i in N if i % 2 == 0)
```

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

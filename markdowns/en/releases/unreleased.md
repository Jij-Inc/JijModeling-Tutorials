---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Comprehension syntax for `jm.min`, `jm.max`, and `jm.set` in the Decorator API

Previously, when using the Decorator API, only {py:func}`jm.sum <jijmodeling.sum>` and {py:func}`jm.prod <jijmodeling.prod>` accepted a comprehension (Python generator) expression as their single argument.

Starting with this version, unary calls to {py:func}`jm.min <jijmodeling.min>`, {py:func}`jm.max <jijmodeling.max>`, and {py:func}`jm.set <jijmodeling.set>` also accept comprehension expressions in the same way.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("min/max/set comprehension example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=N)

    nonzero = jm.set(i for i in N if i != 0)
    problem += jm.min(x[i] for i in N) + jm.max(x[i] for i in nonzero)


problem
```

## Bug Fixes

+++

### Fix bug where operations between subscript elements and numeric types failed

Fixed an issue where numeric operations on `Constraint` subscript elements, as shown below, were incorrectly treated as type errors.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Example")
def problem(problem: jm.DecoratedProblem):
    K = problem.Float(ndim=1)
    x = problem.BinaryVar()
    problem += problem.Constraint("c", [k * x <= 0 for k in K])

problem
```

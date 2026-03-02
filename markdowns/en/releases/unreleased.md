---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Added `jm.range()`

With the {py:func}`jijmodeling.range()` function you can now represent sequences by using {py:class}`~jijmodeling.Expression`s. Its usage is similar to python's built-in {py:class}`range() <range>`.

Example usage:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("RangeProblem")
def problem(problem: jm.DecoratedProblem):
    S = problem.Natural()
    F = problem.Natural()
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(x[i] for i in jm.range(S, F, N))
```

## Bugfixes

+++

### Bugfix: Proper handling of bound variables in slice notation

The handling of bound variables in slice notation has been fixed, ensuring that variables bound in comprehensions or constraint indices are correctly handled within slice notation.

## Other Changes

- Change 1

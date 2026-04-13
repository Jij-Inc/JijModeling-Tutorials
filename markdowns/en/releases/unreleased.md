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

### Generating arrays with a shape and generator function

Starting with this version, the {py:func}`~jijmodeling.genarray` function can be used to generate arrays by specifying a shape and a generator function.
This is similar to {py:func}`~numpy.fromfunction` in NumPy.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("genarray example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=N)
    Sums = problem.NamedExpr(jm.genarray(lambda i, j: a[i, j] * x[i], (N, M)))


problem
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Relaxed version bounds to allow installation on any Python 3 version from Python 3.11 onwards.

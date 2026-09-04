---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Improved LaTeX output for folding methods

Methods like `sum` or `max` will now use type information when available to expand the notation.
And when `axis` is specified, they now render as comprehensions with partial convolution:

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("myproblem")
N = problem.Natural("N")
a = problem.Integer("a", shape=(N, N))
A = problem.NamedExpr("A", a.sum())
B = problem.NamedExpr("B", a.sum(axis=1))

problem
```

### Simplify operations on constants in LaTeX output

Basic operations involving constants will now be simplified when displaying LaTeX. This generally makes equations easier to read, particularly summations which often involved `- 1`s for the termination, and basic coefficients like `-2 * x`.

```{code-cell} ipython3
problem = jm.Problem("TestProblem")
V = problem.Natural("V")
problem += jm.map(lambda x: x + 3 - 2, V - 1).sum() 
problem += - 2 * V + - 2 - 1
problem
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1

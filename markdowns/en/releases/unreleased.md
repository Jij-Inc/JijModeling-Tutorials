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

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Improved LaTeX output for methods specifying `axis`

Methods like `sum` or `max` with a specified `axis` now render as comprehensions with partial convolution when type information is available:

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("myproblem")
N = problem.Natural("N")
a = problem.Integer("a", shape=(N, N))
A = problem.NamedExpr("A", a.sum(axis=1))

problem
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1

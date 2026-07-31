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

### Improvement to gendict's LaTeX output 

The $\LaTeX$ output for `gendict` expressions is now styled closer to `genarray`s.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("gendict example")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
x = problem.BinaryVar("x", dict_keys=K)
Sums = problem.NamedExpr("Sums", jm.gendict(K, lambda k: a[k] * x[k]))


problem
+++

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1
```

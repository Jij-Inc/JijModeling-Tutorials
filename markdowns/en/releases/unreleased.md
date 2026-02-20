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

### Feature 1

+++

## Bugfixes

+++

### Bugfix 2: Flatten nested subscripts in LaTeX output

Nested subscripts like `x[i][j]` nodes now render as ${x}_{i,j}$ instead of the ${{x}_{i}}_{j}$ in LaTeX output.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
x = problem.BinaryVar("x", shape=(2, 2))
x[0][1]
```

### Bugfix 1: Fix issue where constraint detection could not handle indexed constraints correctly

In previous releases, when generating instances of optimization problems with indexed constraints, an unexpected error occurred if constraint detection was enabled (default state). This issue has been fixed.

## Other Changes

- Change 1
```

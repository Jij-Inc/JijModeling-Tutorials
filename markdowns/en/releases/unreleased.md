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

### Feature 1: Fix dictionary sum and convolution behavior

Formerly, summation or folding on dictionaries were intended to be performed via {py:meth}`~jijmodeling.Expression.items`, {py:meth}`~jijmodeling.Expression.values`, and {py:meth}`~jijmodeling.Expression.keys`, and direct folding was not planned to be supported.
However, up to the previous version, dictionary folding was mistakenly available, and it operated over the set of *keys* in the same way as Python dictionaries.
From the standpoint of consistency with how Placeholder and DecisionVar multi-dimensional arrays, it is more natural for dictionaries to be folded over the set of values rather than keys.
Given these, we have formalized this behavior as the official specification and re-implemented it accordingly.

Below is an example of the fix.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
I = problem.CategoryLabel("I")
x = problem.BinaryVar("x", dict_keys=I)

x.sum() # Now behaves like the old x.values().sum()
```

## Bugfixes

+++

### Bugfix 1: Fix issue where constraint detection could not handle indexed constraints correctly

In previous releases, when generating instances of optimization problems with indexed constraints, an unexpected error occurred if constraint detection was enabled (default state). This issue has been fixed.

+++

### Bugfix 2: Flatten nested subscripts in LaTeX output

Nested subscripts like `x[i][j]` nodes now render as ${x}_{i,j}$ instead of the ${{x}_{i}}_{j}$ in LaTeX output.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
x = problem.BinaryVar("x", shape=(2, 2))
x[0][1]
```

## Other Changes

- Change 1

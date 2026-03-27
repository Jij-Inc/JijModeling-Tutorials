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

### Major performance improvement in constraint detection

Constraint detection has been significantly accelerated. Models that previously did not finish even after an hour can now complete within one second.
If you disabled constraint detection by setting `constraint_detection=False` in {py:meth}`jijmodeling.Problem.eval` or {py:meth}`jijmodeling.Compiler.eval_problem` for performance reasons, try running them again with constraint detection enabled by omitting the `constraint_detection` option.

### {py:class}`~jijmodeling.NamedExpr` can now be specified directly as a shape

In previous versions, defining a one-dimensional array whose length was a {py:class}`~jijmodeling.NamedExpr` by specifying it directly as the shape, as shown below, resulted in an error:

```python
import jijmodeling as jm

problem = jm.Problem("Test Problem")
w = problem.Float("w", ndim=1)
N = problem.NamedExpr("N", w.len_at(0))
v = problem.Float("v", shape=N)  # Errors!
```

```text
Invalid comprehension syntax detected! Perhaps you used comprehension syntax outside decorator API, or used Python's builtin `sum` function etc., instead of `jijmodeling.sum`?
```

Starting with this release, the following now works without issue:

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("Test Problem")
w = problem.Float("w", ndim=1)
N = problem.NamedExpr("N", w.len_at(0))
v = problem.Float("v", shape=N)
x = problem.BinaryVar("x", shape=N)

problem
```

## Other Changes

- Added a type hint for the `-=` operator of `DecoratedProblem`.

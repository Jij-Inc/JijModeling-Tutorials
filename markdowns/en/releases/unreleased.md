---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Streams and partial dictionaries as placeholder `dtype`

You can now use the collection types `jm.DataType.STREAM` and `jm.DataType.PARTIAL_DICT` as your
placeholder datatype, allowing more freeform data without using `jagged=True`.

For example, here we define one placeholder that has a collection of routes, including the nodes
traversed and their weights, where each route can have a different length.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def _(problem: jm.DecoratedProblem):
    N = problem.Natural("N")
    x = problem.BinaryVar("x", shape=N)
    A = problem.Placeholder("A", dtype=jm.DataType.STREAM[(float, N)], ndim=1)
    problem += problem.Constraint(
        "at-most-one", [jm.sum(c * x[i] for c, i in route) <= 1 for route in A]
    )
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1

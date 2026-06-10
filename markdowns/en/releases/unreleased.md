---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
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

## Bug Fixes

+++

### Fix bug where `problem.eval()` failed when using a comprehension over a singleton list in a constraint family definition

As of JijModeling 2.5.0, a problem definition like the following passed JijModeling's type checks, as it should, but calling {py:meth}`Problem.eval <jijmodeling.Problem.eval>` raised the error `Could not convert value from function of decision variable to SubscriptItem.`.

```{code-cell} ipython3
@jm.Problem.define("Min fail")
def min_fail(problem: jm.DecoratedProblem):
    x = problem.BinaryVar("x", shape=(1,))
    problem += problem.Constraint(
        "c", [x[j] == 0 for i in jm.range(1) for j in [i + 0]]
    )
```

This version fixes the issue so that {py:meth}`Problem.eval <jijmodeling.Problem.eval>` works correctly for definitions like the one above.

## Other Changes

- Change 1:

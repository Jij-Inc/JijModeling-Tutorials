---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.4
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Improvements to the [Type Mismatch error](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-TE0004.html)

The Type Mismatch error now includes the term whose type actually mismatched when needed.

```{code-cell} ipython3
import jijmodeling as jm


try:
    @jm.Problem.define("MyProblem")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Length()
        W = problem.Float()
        x = problem.BinaryVar(shape=N)

        problem += x[W] # Error!
except Exception as e:
    print(e)
```

The corresponding entry in the Error Code Index is now also more detailed.

### Improved math output for subscripted variables

Subscripted variables are now displayed in a more readable way.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Vars Beautiful")
def problem(problem: jm.DecoratedProblem):
    C = problem.CategoryLabel()
    N = problem.Natural()
    M = problem.Natural()
    w = problem.Float(shape=(N, M))

    x = problem.ContinuousVar(
        shape=(N, M),
        lower_bound=w,
        upper_bound=2,
        description="添え字がわかりやすくなった",
    )
    z = problem.IntegerVar(
        dict_keys=(C, N),
        lower_bound=lambda c, i: i,
        upper_bound=42,
    )


problem
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

-

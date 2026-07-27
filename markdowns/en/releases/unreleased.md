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

### Automatically obtain parameters when using the update decorator API

Previously, when using `@Problem.update`, you'd have to manually obtain
already-defined objects (eg. decision variables, placeholders) manually by
accessing `problems.decision_vars` and the like. Now, you can define additional
parameters to the function which will be automatically obtained (by name) from
that problem.

```{code-cell} ipython3
import jijmodeling as jm
@jm.Problem.define("MyProblem")
def problem(problem):
  w = problem.Float(ndim=1, description="Weights of the items")
  N = w.len_at(0)
  W = problem.Float(description="Total weight")
  x = problem.BinaryVar(shape=(N,), description="Selected items")

@problem.update
def _myupdate(
    problem: jm.DecoratedProblem,
    w: jm.Placeholder,
    W: jm.Placeholder,
    x: jm.DecisionVar,
):
    problem += problem.Constraint("weight", jm.sum(w * x) <= W)
    
    # as before, you can still define new variables and placeholders:
    v = problem.Float(ndim=1, description="Values of the items")
    problem += jm.sum(v * x)
```

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
    u = problem.BinaryVar()

problem
```

## Bugfixes

+++

### Fixed an internal error for `jm.range` with computed arguments

Previously, passing a computed expression such as `N - 1` as a argument of `jm.range` caused an internal error ([E-CE0007](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-CE0007.html)) when the model was evaluated, showing a message that asked users to report it as a bug in JijModeling. This affected not only `domain=` of constraints but every place where `jm.range` is evaluated, such as the index set of a summation (ranges with literal or bare-placeholder arguments like `jm.range(N)` were unaffected).

With this fix, ranges whose arguments contain expressions now evaluate correctly.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("RangeWithComputedBounds")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(x[i] for i in jm.range(N - 1))
    problem += problem.Constraint("fix", lambda i: x[i] == 0, domain=jm.range(N - 1))

display(problem)

problem.eval({"N": 4})
```

## Other Changes

-

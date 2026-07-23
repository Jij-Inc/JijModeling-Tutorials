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

### Achieved speed and memory efficiency equal to or better than JijModeling v1

The compiler infrastructure has been substantially redesigned, achieving approximately a 10x speed improvement over the previous implementation in some benchmarks.

<!-- TODO: Insert graph -->

Memory usage has also improved. <!-- TODO: Add numbers -->

With these improvements, JijModeling 2 now achieves performance equal to or much better than the previous JijModeling 1, so please consider migrating to JijModeling 2.

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

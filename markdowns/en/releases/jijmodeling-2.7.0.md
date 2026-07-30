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

# JijModeling 2.7.0 Release Notes

+++

## Feature Enhancements

+++

### Improved compiler speed and memory efficiency

Major compiler optimizations have substantially improved execution speed and memory efficiency 🎉

Benchmarks show speedups of up to 8x over JijModeling 2.6.0 and up to 5x over 1.14.2. The representative execution times below are normalized to 1.0 for 2.7.0. A larger value means that the comparison version took longer than this release.

:::{figure} ../images/compiler-ir-timing.svg
:alt: Vertical bar chart comparing relative execution time for JijModeling 1.14.2, 2.6.0, and 2.7.0 across representative Knapsack, supportcase18, and FMA workloads
:width: 100%

Relative compilation time in representative benchmarks. The labels above the bars are ratios to 2.7.0 (1.0 or higher means that 2.7.0 is as fast or faster).
:::

Memory allocation per compilation has also decreased substantially. Specifically, the total memory allocated per compilation decreased by 76–97% compared with 2.6.0 and by 51–94% compared with 1.14.2.

:::{figure} ../images/compiler-ir-memory.svg
:alt: Vertical bar chart comparing total memory allocated per compilation for JijModeling 1.14.2, 2.6.0, and 2.7.0 across the same ordered Knapsack, supportcase18, and FMA workloads as the timing chart
:width: 100%

Total memory allocated per compilation in representative benchmarks
:::

All benchmarks were run on a Google Cloud `n2-standard-8` VM (8 vCPUs, 32 GB, Ubuntu 26.04 LTS, x86_64).

Models whose compilation time is a bottleneck can benefit substantially from these improvements, so please consider migrating to JijModeling 2.

### Automatically obtain parameters when using the update decorator API

Previously, when using `@Problem.update`, you'd have to manually obtain
already-defined objects (eg. decision variables, placeholders) by
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


problem
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

        problem += x[W]  # Error!
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

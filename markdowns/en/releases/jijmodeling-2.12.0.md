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

# JijModeling 2.12.0 Release Notes

+++

## Feature Enhancements

+++

### Streams and dictionaries as placeholder `dtype`

You can now use the collection types `jm.DataType.STREAM`, `jm.DataType.PARTIAL_DICT`, and
`jm.DataType.TOTAL_DICT` as your placeholder datatype, allowing more freeform data without using
`jagged=True`.

In the following example, `x` is an array of `N` binary decision variables. Placeholder `A` is a one-dimensional array whose elements are streams of pairs consisting of a coefficient `c` and an index `i` into `x`. Each stream defines a weighted sum constrained to be at most 1, and the number of terms can vary between streams.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural("N")
    x = problem.BinaryVar("x", shape=N)
    A = problem.Placeholder("A", dtype=jm.DataType.STREAM[(float, N)], ndim=1)
    problem += problem.Constraint(
        "weighted-sum", [jm.sum(c * x[i] for c, i in terms) <= 1 for terms in A]
    )
```

In the instance data, each stream is a list of `(coefficient, index)` tuples. The following example sets `N = 3` and evaluates the model with two streams in `A`: one containing two terms and the other containing one term.

```{code-cell} ipython3
problem.eval({
    "N": 3,
    "A": [
        [(0.5, 0), (0.75, 1)],
        [(1.0, 2)],
    ],
})
```

The elements of this `A` correspond to the following constraints, respectively:

$$
\begin{aligned}
0.5 x_0 + 0.75 x_1 &\le 1, \\
x_2 &\le 1.
\end{aligned}
$$

## Bugfixes

+++

### Bugfix: Fix compilation of constraints with a stream of tuples as its domain

Fixed an issue where using a stream of tuples, such as dictionary placeholder's `keys()`, as a constraint's `domain` parameter would raise type error {external+api_reference:doc}`E-TE0014 <error_codes/error/E-TE0014>`.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("fixed", [x[i, j] == 1 for i, j in c.keys()])

problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

### Bugfix: Fix infinite loops in constraint detection caused by floating-point rounding errors

Fixed a bug that could cause constraint detection to loop indefinitely when variable bounds or subexpressions in the objective function or constraints contained values that could not be handled exactly in floating-point arithmetic.
This did not occur when constants were modeled as placeholders and floating-point values were supplied as instance data. However, specifying floating-point values directly in the model, as in the following example, could cause an infinite loop.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("decimal bounds")

problem.ContinuousVar("ratio", lower_bound=0.1, upper_bound=0.5)
instance = problem.eval({})
```

Starting with this release, constant folding is performed only when the arithmetic is exact, preventing this issue.
As a result, some transcendental functions now appear without simplification in $\LaTeX$ output.

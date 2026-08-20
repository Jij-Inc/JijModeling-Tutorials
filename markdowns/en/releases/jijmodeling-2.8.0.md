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

# JijModeling 2.8.0 Release Notes

+++

## Feature Enhancements

+++

### "Set" is now called "Stream"

Previously, JijModeling called the type representing "a sequence of values that can be iterated over" `Set`. However, because a mathematical "set" is a collection with neither duplicates nor order, this terminology could be misleading.

Starting with this release, what was previously called `Set` is now called `Stream`, and {py:func}`jm.stream <jijmodeling.stream>` has been introduced in place of the deprecated {py:func}`jm.set <jijmodeling.set>` function.
This follows the convention in general-purpose programming languages of calling such "an ordered sequence of values that may contain duplicates" a **stream**.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("stream example")
N = problem.Natural("N")
problem.infer(jm.stream(N))
```

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem, N: jm.Placeholder):
    # Comprehensions are also supported in the Decorator API.
    print(problem.infer(jm.stream(2 * i for i in N if i % 2 == 0)))
```

{py:func}`jm.set <jijmodeling.set>` remains available as an alias of {py:func}`jm.stream <jijmodeling.stream>`, but because it is **scheduled for removal**, we recommend migrating to {py:func}`jm.stream <jijmodeling.stream>` as soon as possible.

+++

### Improvement to gendict's LaTeX output 

The $\LaTeX$ output for `gendict` expressions is now styled closer to `genarray`s.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("gendict example")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
x = problem.BinaryVar("x", dict_keys=K)
Sums = problem.NamedExpr("Sums", jm.gendict(lambda k: a[k] * x[k], K))


problem
```

### `if` clauses in `gendict` comprehensions

The Decorator API now supports an `if` clause after a single `for` clause in a `gendict` comprehension.
This makes it possible to flexibly define dictionaries with restricted domains using `gendict` comprehensions.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("gendict-if")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.Float(dict_keys=N)
    A = problem.NamedExpr(jm.gendict(c[i] * 2 for i in N if i != 0))


problem
```

The following example uses multiple `if` clauses.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("gendict-tuple-if")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    L = problem.CategoryLabel()
    avoid = problem.Placeholder(dtype=L)
    c = problem.Float(dict_keys=(N, L))
    OffDiag = problem.NamedExpr(
        jm.gendict(i + c[i, l] for (i, l) in (N, L) if i % 2 != 0 if l != avoid)
    )


problem
```

## Bugfixes

### Fixed excessive memory consumption during constraint detection with unbounded decision variables

Compiling a model in which a decision variable was made unbounded by giving it an infinite bound — for example, `upper_bound=float("inf")` — could consume memory without limit when constraint detection was enabled.

This bug has been fixed in this release, and such models now compile successfully even when constraint detection is enabled.
In addition, an error is now raised at definition time when a bound is `NaN` or when the bounds are inherently infeasible, such as when the upper bound is negative infinity.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("production", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    T = problem.Length()
    demand = problem.Float(shape=(T,))
    x = problem.ContinuousVar(
        lower_bound=0.0, upper_bound=float("inf"), shape=(T,)
    )

    problem += jm.sum(x[t] for t in T)
    problem += problem.Constraint("constr", [x[t] >= demand[t] for t in T])


problem.eval({"T": 3, "demand": [1.0, 2.0, 3.0]})
```

### Fixed an issue where dictionaries could not be mapped

{py:func}`~jijmodeling.map` on a dictionary should return a dictionary whose values have been transformed by the given function, but previously it raised an exception during type checking.
Starting with this release, it returns a dictionary with the same set of keys as the original and with the function applied to corresponding values.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("Mapped Dicts")
N = problem.Natural("N")
L = problem.CategoryLabel("L")
x = problem.PartialDict(
    "x",
    dict_keys=(L, L),
    dtype=(L, N),
)
problem.infer(x)
```

```{code-cell} ipython3
problem.infer(x.map(lambda l, n: n))
```

The example above uses a `PartialDict`, but a `TotalDict` produces the similar result.

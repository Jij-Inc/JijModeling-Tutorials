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

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### What we used to call a "set" is now called a **stream**: `jm.set` is deprecated in favour of `jm.stream`

JijModeling has always had a type for "a sequence of values you can iterate over" — the thing you pass to `jm.sum`, `jm.map`, `jm.filter`, or a constraint's `domain`.
Until now we called it a **set**, and the explicit conversion function was `jm.set`.

That name was misleading. A mathematical set has no duplicates and no ordering, whereas this type has **always** preserved order and allowed duplicates — it is a *stream* (or an *iterator*, in general programming terms).
So we are renaming the concept: it is called a **stream** everywhere from now on, and the conversion function is {py:func}`jijmodeling.stream`.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("stream example")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=N)
problem += jm.map(lambda i: x[i], jm.stream(N)).sum()


problem
```

`jm.set` remains available as a **deprecated alias** of `jm.stream`. It builds exactly the same expression, and everything it accepted before still works — including the comprehension syntax of the Decorator API:

```{code-cell} ipython3
import warnings

import jijmodeling as jm


with warnings.catch_warnings():
    # Calling `jm.set` now emits a DeprecationWarning.
    warnings.simplefilter("ignore", DeprecationWarning)

    @jm.Problem.define("deprecated jm.set still works")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Length()
        x = problem.BinaryVar(shape=N)
        domain = jm.set(i for i in N if i != 0)
        problem += problem.Constraint("fix", lambda i: x[i] == 0, domain=domain)


problem
```

Migrating is a plain rename: replace `jm.set(...)` with `jm.stream(...)`.
The terminology change is also reflected in error messages and in the pretty-printed form of models: types now print as `Stream[...]` instead of `Set[...]`, and the operation prints as `stream(...)` instead of `set(...)`.

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

### Bugfix 1


## Other Changes

- Change 1

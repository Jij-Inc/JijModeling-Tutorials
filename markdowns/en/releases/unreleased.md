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

### Trailing `if` clauses in `gendict` comprehensions

The Decorator API now supports an `if` clause after a single `for` clause in a
`gendict` comprehension. This makes it possible to flexibly define dictionaries
with restricted domains using `gendict` comprehensions.

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

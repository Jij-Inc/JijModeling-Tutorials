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

### A first-class `Set` type

JijModeling now has a real *set*: finite, unordered, duplicate-free, and indexable by component. Declare one with `Problem.Set` and use it as the key domain of a sparse decision variable, so that variables exist only for admissible index combinations.

A set can be *sectioned* with the familiar subscript syntax — binding some components and keeping the rest with `:` — which is what makes sparse constraint families natural to write:

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("sparse-knapsack")
N = problem.Natural("N")
K = problem.Natural("K")
mask = problem.Set("mask", dtype=(N, K))
w = problem.Float("w", ndim=1, shape=(N,))
C = problem.Float("C", ndim=1, shape=(K,))
x = problem.BinaryVar("x", dict_keys=mask)

problem += jm.sum(mask, lambda i, k: w[i] * x[i, k])
problem += problem.Constraint(
    "one-truck", lambda i: jm.sum(mask[i, :], lambda k: x[i, k]) <= 1, domain=N
)
problem += problem.Constraint(
    "capacity", lambda k: jm.sum(mask[:, k], lambda i: w[i] * x[i, k]) <= C[k], domain=K
)

problem
```

Sets also support *projection* onto chosen components (duplicate-free by construction), *membership tests*, explicit conversion from any stream, and the set algebra `|`, `&`, `^`, and `jm.diff`:

```{code-cell} ipython3
items = jm.project(mask, 0)  # the distinct items occurring in some pair
trucks = mask.project(1)  # method form; [0], (0,) and separate arguments all work
is_admissible = jm.member((0, 1), mask)  # x ∈ S; equivalently mask.contains((0, 1))
evens = jm.to_set(jm.filter(lambda i: i % 2 == 0, jm.stream(N)))
items
```

Note that Python's `in` operator cannot build a membership test — Python converts its result to a plain `True`/`False`, so JijModeling raises a dedicated error (`E-SE0014`) pointing at the four spellings above instead of silently guessing.

### `genset`: generate a set from a key collection

`jm.genset` is `gendict`'s sibling: it applies a generator function over a key collection and collects the *set* of generated values, deduplicating them. The Decorator API accepts the comprehension spelling, including trailing `if` clauses:

```{code-cell} ipython3
@jm.Problem.define("genset-example")
def genset_problem(p: jm.DecoratedProblem):
    K = p.CategoryLabel()
    C = p.Natural(dict_keys=K)
    A = jm.genset(C[k] * 2 for k in K if C[k] >= 2)
    x = p.BinaryVar(dict_keys=A)
    p += jm.sum(A, lambda v: x[v])


genset_problem
```

### `keys()` and `indices()` now return sets

A dictionary's `keys()` and an array's `indices()` are now `Set`-typed, so they can be sectioned, projected, and tested for membership like any other set. One intended behaviour change comes with this: a dictionary's keys are iterated in *canonical order* — integers before strings, each ascending — instead of the order the instance data happened to supply them, so decision-variable identifiers derived from `keys()` are reproducible across runs and data orderings.

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

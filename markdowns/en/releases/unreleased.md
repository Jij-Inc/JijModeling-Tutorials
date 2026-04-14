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

### Generating arrays with a shape and generator function

Starting with this version, the {py:func}`~jijmodeling.genarray` function can be used to generate arrays by specifying a shape and a generator function.
This is similar to {py:func}`~numpy.fromfunction` in NumPy.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("genarray example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=N)
    Sums = problem.NamedExpr(jm.genarray(lambda i, j: a[i, j] * x[i], (N, M)))


problem
```

## Bugfixes

+++

### Bugfixes in random instance data generation

We fixed the following two bugs in random instance data generation:

#### Placeholders that depend on `NamedExpr` were not handled correctly

We fixed a bug where placeholders whose shape (length) or key set depends on `NamedExpr` were not handled correctly.
For example, consider the following problem:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = problem.NamedExpr(a.len_at(0))
    b = problem.Natural(shape=(N, None))
    M = problem.NamedExpr(b.len_at(1))
    problem += jm.sum(a[i] * b[i, j] for i in N for j in M)


problem
```

In previous versions, calling `generate_random_dataset()` on this `problem` raised an exception. Starting with this release, the data is generated correctly.

```{code-cell} ipython3
problem.generate_random_dataset(seed=17)
```

#### Fixed a bug where generation failed when unused placeholders were present

Data generation failed when there were unused placeholders not included in `used_placeholder()`.
For example, in the following code, `N` is defined but never used, and previous versions raised a runtime exception.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
N = problem.Natural("N")

problem.generate_random_dataset(seed=17)
```

Starting with this release, data is generated successfully in cases like the example above.


## Other Changes

- Relaxed version bounds to allow installation on any Python 3 version from Python 3.11 onwards.

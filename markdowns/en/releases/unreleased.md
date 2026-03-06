---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Added `jm.range()`

With the {py:func}`jijmodeling.range()` function you can now represent sequences by using {py:class}`~jijmodeling.Expression`s. Its usage is similar to python's built-in {py:class}`range() <range>`.

Example usage:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("RangeProblem")
def problem(problem: jm.DecoratedProblem):
    S = problem.Natural()
    F = problem.Natural()
    N = problem.Natural()
    x = problem.BinaryVar(shape=(10,))
    problem += jm.sum(x[i] for i in jm.range(S, F, N))
```

### Support `-=` operator to update a `Problem`'s objective function

You can now use `-=` to add subtracted terms from a {py:class}`~jijmodeling.Problem`'s objective function. 

Unlike `+=`, `-=` does not support removing constraints.

```{code-cell} ipython3
problem = jm.Problem("problem")
x = problem.ContinuousVar("x", lower_bound=0, upper_bound=5)
y = problem.ContinuousVar("y", lower_bound=0, upper_bound=5)

problem += x
problem -= y
assert jm.is_same(problem.objective, x - y)
```

## Bugfixes

+++

### Bugfix: Proper handling of bound variables in slice notation

The handling of bound variables in slice notation has been fixed, ensuring that variables bound in comprehensions or constraint indices are correctly handled within slice notation.

### Bugfix: LaTeX output for sums and membership relations over natural numbers in indexed constraints

In previous versions, when the domain of an indexed constraint or the range of a summation was over natural numbers, the membership relation was output using $\in$, for example:

$$
\text{c1}:\quad\sum _{j\in {N}_{1}}{{x}_{i,j}}=1\quad \forall i\;\text{s.t.}\;i\in {N}_{0}
$$

Starting in this release, the output is made natural in the same way as objective functions and standalone constraints:

```{code-cell} ipython3
problem = jm.Problem("P")
N = problem.Natural("N", shape=2)
x = problem.BinaryVar("x", shape=(N[0], N[1]))
problem.Constraint("c1", lambda i: jm.sum(N[1], lambda j: x[i, j]) == 1, domain=N[0])
```

## Other Changes

- Change 1:

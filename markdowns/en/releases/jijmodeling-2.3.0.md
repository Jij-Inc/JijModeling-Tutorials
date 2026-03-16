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

# JijModeling 2.3.0 Release Notes

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

### Dependent Variable information is now included in OMMX instance

Since this version, the definitions of the dependent variables are included in the OMMX instance, if the following conditions are satisfied:

- The dependent variable is scalar-valued, or
- The dependent variable is an array or dictionary of scalar values.

They are now registered as dummy decision variables with decision_variable_dependency, and will be evaluated in OMMX Solution object after the optimization.
This feature should be particularly useful, for example, when you want to check the value of a specific subterm in the objective function.
If you declare the term of interest as a {py:class}`~jijmodeling.DependentVar`, you can check its post-optimization value from the OMMX Solution.

+++

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

### Bugfix: Fixes unrecoverable error in random instance generation under unused placeholder

We have fixed the bug where the random instance generation panics under the presence of an unused placeholder in the problem definition.

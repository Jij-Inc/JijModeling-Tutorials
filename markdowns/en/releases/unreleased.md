---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Feature 1

+++

## Bugfixes

+++

### Bugfix 1: Fix type errors that reported a mismatch between identical types

Fixed an issue where type checking could report that two types displayed identically do not match, as in ``Could not match actual type `T` with expected `T` `` ({external+api_reference:doc}`E-TE0004 <error_codes/error/E-TE0004>`).

For example, the error occurred in a case like the following:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    T = problem.Length()
    x = problem.BinaryVar(dict_keys=jm.stream((i, t) for i in T for t in T))
    problem += problem.Constraint(
        "one-hot", jm.sum(x[i, t] for i in T for t in T) == 1
    )


instance = problem.eval({"T": 2})
instance.constraint_hints.one_hot_constraints
```

Previously, this example failed with the following error unless constraint detection was disabled:

```text
error[E-TE0004] Could not match actual type `T` with expected `T` on an expression `t_0_...`
```

Starting with this release, the model is evaluated and the one-hot constraint is detected, as the output above shows.

In addition, even with constraint detection disabled, a similar error occurred for expressions given a custom $\LaTeX$ representation with `latex=`, as in the following example:

```{code-cell} ipython3
problem = jm.Problem("problem")
w = problem.Float("w", ndim=1)
N = w.len_at(0)
M = w.len_at(0, latex="M")
a = problem.Float("a", shape=(N,))
b = problem.Float("b", shape=(M,))

problem.infer(a + b)
```

Previously, `a + b` was rejected with the following error, and `jm.is_same(N, M)` returned `False`:

```text
error[E-TE0015] `numeric operator +` is not supported between types `Array[w.len_at(0); float]` and `Array[w.len_at(0); float]`
```

### Bugfix 2: Fix type errors that could occur on subscript access when the key set is defined by a comprehension

In previous releases, when the `dict_keys` of a decision variable was a stream defined by a comprehension with two or more `for` clauses, as for `x` below, the elements of the variable could only be accessed inside a comprehension with the same `for` clauses as the one that defines the keys.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    T = problem.Length()
    x = problem.BinaryVar(dict_keys=jm.stream((i, t) for i in T for t in T))
    problem += problem.Constraint(
        "one-hot", [jm.sum(x[i, t] for t in T) == 1 for i in T]
    )


problem
```

Previously, the definition above failed at the definition of the `one-hot` constraint with the following error:

```text
error[E-TE0004] Could not match actual type `natural` with expected `T` on an expression `t_...`
```

Starting with this release, it runs without an error.

## Other Changes

- Change 1

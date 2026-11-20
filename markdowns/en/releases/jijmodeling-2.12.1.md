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

# JijModeling 2.12.1 Release Notes

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

### Bugfix 3: Fix $\LaTeX$ output of placeholders with partially determined shape

The $\LaTeX$ output of a problem now shows the range of each index of a placeholder array even when the shape is partially undetermined with `None`.
Previously, such placeholders fully fell back to output like $\forall (i,j) \in \mathop{\mathtt{indices}}(c)$.
Now each index ranges over its own axis: the length given in `shape` for axes where it is known, and `len_at` of the array for axes specified as `None`.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Partially determined shape")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.Float(shape=(N, None))


problem
```

### Bugfix 4: Add missing type hints for `element_latex` and `subscript_styles` to `DecoratedProblem`

The decision variable, placeholder, `CategoryLabel`, and `NamedExpr` constructors of `DecoratedProblem` accepted `element_latex` and `subscript_styles` at runtime, but their type hints did not include them, so type checkers reported errors on valid code.
Their type hints now match those of the corresponding `Problem` methods.

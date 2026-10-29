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

### Improved handling of functions with argument-dependent return types

JijModeling has supported functions whose return types depend on their arguments. This release makes their handling more systematic and fixes several related bugs.
The types of these functions are now displayed accurately.

This release also fixes an issue where unexpected variable names such as `__dangling_*` appeared in previews.

+++

## Bugfixes

+++

### Fix constraint detection errors when destructuring dictionary keys

Fixed an issue where constraints containing comprehensions that unpack dictionary (`PartialDict` / `TotalDict`) keys into their individual components caused unexpected errors during constraint detection.
Previously, the following example raised an `E-TE0014` error. Starting with this release, it runs successfully:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("onehot", jm.sum(x[i, j] for i, j in c.keys()) == 1)

problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

### Fix panics when accessing keys of dictionaries created with `gendict`

Accessing the keys of a dictionary created with `gendict` could cause an unrecoverable panic, as in the following example:

```{code-cell} ipython3
import jijmodeling as jm
@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    keys = problem.Natural("keys", ndim=1)
    a = problem.Natural("a", ndim=1)
    d = problem.NamedExpr("d", jm.gendict(k for k in keys))
    problem += jm.sum(a[i] for n in d.keys() for i in n)

problem
```

Previously, the code above caused the following unrecoverable error:

```python
PanicException: internal error: entered unreachable code: ElementOf[stream(keys)] must wrap a set type, but got: Array[:; natural]
```

Starting with this release, this code works as expected.

## Other Changes

- Change 1

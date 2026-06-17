---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### SOS1 constraints can now be detected for variables with multiple subscripts

Previously, the constraint detection feature could detect SOS1 constraints only for non-negative variables with at most one subscript. This release adds support for detecting them when variables have multiple subscripts.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    C = problem.Natural(shape=(N, M))
    x = problem.IntegerVar(shape=(N, M), lower_bound=0, upper_bound=C)
    d = problem.BinaryVar(shape=(M, N))

    problem += problem.Constraint(
        "sos1 on binaries",
        jm.sum(d[m, n] for n in N for m in M) <= 1
    )
    problem += problem.Constraint(
        "upper bound",
        [x[n, m] <= d[m, n] * C[n, m] for n in N for m in M]
    )

problem
```

```{code-cell} ipython3
instance_data = problem.generate_random_dataset(options={"N": {"value": 4}, "M": {"value": 3}, "C": {"value": (1, 100)}}, seed=43)
compiler = jm.Compiler.from_problem(problem, instance_data)
instance = compiler.eval_problem(problem)

# Two SOS1 constraints should be detected: one for d and one for x
sos1s = instance.constraint_hints.sos1_constraints
assert len(sos1s) == 2
```

```{code-cell} ipython3
# There is an SOS1 constraint for d
d_ids = set(compiler.get_decision_variable_by_name("d", [j, i]).id for i in range(4) for j in range(3))
next(sos1 for sos1 in sos1s if set(sos1.variables) == d_ids)
```

```{code-cell} ipython3
# There is also an SOS1 constraint for x
x_ids = set(compiler.get_decision_variable_by_name("x", [i, j]).id for i in range(4) for j in range(3))
next(sos1 for sos1 in sos1s if set(sos1.variables) == x_ids)
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1

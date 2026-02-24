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

### Fix dictionary sum and convolution behavior

Formerly, summation or folding on dictionaries were intended to be performed via {py:meth}`~jijmodeling.Expression.items`, {py:meth}`~jijmodeling.Expression.values`, and {py:meth}`~jijmodeling.Expression.keys`, and direct folding was not planned to be supported.
However, up to the previous version, dictionary folding was mistakenly available, and it operated over the set of *keys* in the same way as Python dictionaries.
From the standpoint of consistency with how Placeholder and DecisionVar multi-dimensional arrays, it is more natural for dictionaries to be folded over the set of values rather than keys.
Given these, we have formalized this behavior as the official specification and re-implemented it accordingly.

Below is an example of the fix.

```{code-cell} ipython3
import jijmodeling as jm
import ommx.v1

problem = jm.Problem("My Problem")
I = problem.CategoryLabel("I")
x = problem.BinaryVar("x", dict_keys=I)

x.sum()  # Now behaves like the old x.values().sum()
```

### Improve display of decision variable bounds

The bounds of decision variables are now displayed more clearly in $\LaTeX$ output.

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N")
M = problem.Natural("M")
d = problem.Float("d", shape=(M,))
L = problem.Float("L", shape=(N, M))
x = problem.ContinuousVar(
    "s", shape=(N, M), lower_bound=L, upper_bound=lambda i, j: d[j]
)
problem += x.sum()

problem
```

### Add a feature to fix decision variable values

We added a feature to (partially) fix decision variable values in {py:meth}`Problem.eval <jijmodeling.Problem.eval>` and {py:meth}`Compiler.from_problem <jijmodeling.Compiler.from_problem>`.
You can pass a dictionary to the optional keyword argument `fixed_variables`, where the keys are variable names and the values are either fixed values or a dictionary mapping indices to fixed values.
The substituted value will be stored in `fixed_value` attribute in the corresponding ommx decision variable(s).

```{code-cell} ipython3
problem = jm.Problem("My Problem")
N = problem.Length("N")
x = problem.ContinuousVar("x", shape=(N, N), lower_bound=-10, upper_bound=10)
y = problem.IntegerVar("y", lower_bound=0, upper_bound=10)
problem += x.sum() + y

compiler = jm.Compiler.from_problem(
    problem,
    {"N": 2},
    fixed_variables={
        "x": {(0, 1): 1, (1, 1): 5},
        "y": 3,  # You may also write {(): 3}
    },
)
instance = compiler.eval_problem(problem)

instance.objective
```

```{code-cell} ipython3
x00 = compiler.get_decision_variable_by_name("x", (0, 0))
x10 = compiler.get_decision_variable_by_name("x", (1, 0))
assert instance.objective.almost_equal(ommx.v1.Function(x00 + x10 + 9))
```

## Bugfixes

+++

### Fix issue where constraint detection could not handle indexed constraints correctly

In previous releases, when generating instances of optimization problems with indexed constraints, an unexpected error occurred if constraint detection was enabled (default state). This issue has been fixed.

+++

### Flatten nested subscripts in LaTeX output

Nested subscripts like `x[i][j]` nodes now render as ${x}_{i,j}$ instead of the ${{x}_{i}}_{j}$ in LaTeX output.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
x = problem.BinaryVar("x", shape=(2, 2))
x[0][1]
```

## Other Changes

- Change 1:

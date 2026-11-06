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

### Bugfix 1: Fix compilation of constraints with a stream of tuples as its domain.

Fixed an issue where using a stream of tuples, such as dictionary placeholder's `keys()`, as a constraint's `domain` parameter would raise type error {external+api_reference:doc}`E-TE0014 <error_codes/error/E-TE0014>`.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("fixed", [x[i, j] == 1 for i, j in c.keys()])

problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

### Bugfix: Fix infinite loops in constraint detection caused by floating-point rounding errors

Fixed a bug that could cause constraint detection to loop indefinitely when variable bounds or subexpressions in the objective function or constraints contained values that could not be handled exactly in floating-point arithmetic.
This did not occur when constants were modeled as placeholders and floating-point values were supplied as instance data. However, specifying floating-point values directly in the model, as in the following example, could cause an infinite loop.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("decimal bounds")

problem.ContinuousVar("ratio", lower_bound=0.1, upper_bound=0.5)
instance = problem.eval({})
```

Starting with this release, constant folding is performed only when the arithmetic is exact, preventing this issue.
As a result, some transcendental functions now appear without simplification in $\LaTeX$ output.

## Other Changes

- Change 1

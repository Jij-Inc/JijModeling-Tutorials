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

### Random Instance Data Generation

JijModeling 2 now supports random instance data generation via {py:meth}`Problem.generate_random_dataset <jijmodeling.Problem.generate_random_dataset>` and {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>`!
Please refer to the API documentation for more details.

Example usage:

```{code-cell} ipython3
import jijmodeling as jm
import builtins
problem = jm.Problem("problem")
N = problem.Natural("N")
c = problem.Float("c", shape=(N,))
x = problem.BinaryVar("x", shape=(N,))
problem += jm.sum(N, lambda i: c[i] * x[i])
inputs = problem.generate_random_dataset(
    options={
        'N': {"value": builtins.range(10, 20)},
        'c': {"value": jm.range.value.closed(-1.0, 1.0)}
         # You can also specify "size" for the range of jagged array dimension size.
    },
    seed=123 # omittable
)
assert set(inputs.keys()) == {"N", "c"}
inputs
```

## Bugfixes

+++

### Bugfix 1: Division containing decision variables only on left-hand side now compiles

In JijModeling 2.0.0, divisions where no decision variable appears on the right-hand side, e.g. `x / 2`, incorrectly triggered a compile-time error.
With this release, division now compiles correctly as long as the right-hand side does not contain decision variables.

## Other Changes

- `Problem` now provides {py:meth}`Problem.name` and {py:meth}`Problem.sense` properties.

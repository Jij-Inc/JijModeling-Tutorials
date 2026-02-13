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
N = problem.Integer("N")
c = problem.Float("c", shape=(N,))
x = problem.BinaryVar("x", shape=(N,))
i = jm.Element("i", belong_to=N)
problem += jm.sum(i, c[i] * x[i])
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

### Bugfix 1


## Other Changes

- `Problem` now provides {py:meth}`Problem.name` and {py:meth}`Problem.sense` properties.

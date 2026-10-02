---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Specify category label elements directly as a list when generating random instances

Previously, fixing category label values when generating random instances required specifying them under `keys`, as in `{"C": {"keys": ["A", "B", "C"]}}`. You can now specify them directly as a list.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
  C = problem.CategoryLabel()

  a = problem.Float(dict_keys=C)
  x = problem.BinaryVar(dict_keys=C)

  problem += (a * x).sum()

problem.generate_random_dataset(
    seed=42,
    options={"C": ["A", "B", "C"]} # Equivalent to {"C": {"keys": [...]}}
)
```

Lists are supported only for category labels. Other placeholders must still use the existing format.

+++

## Bugfixes

+++

### Bugfix 1: Include category label information in randomly generated datasets

Fixed an issue where randomly generated datasets did not include the category label definitions themselves.
Previously, the following `dataset` did not contain `C`, causing `eval` to fail. Starting with this release, the example runs successfully.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
  C = problem.CategoryLabel()

  a = problem.Float(dict_keys=C)
  x = problem.BinaryVar(dict_keys=C)

  problem += (a * x).sum()

dataset = problem.generate_random_dataset(
    seed=42,
    options={"C": {"keys": ["A", "B", "C"]}}
)

dataset
```

```{code-cell} ipython3
problem.eval(dataset)
```

## Other Changes

- Change 1

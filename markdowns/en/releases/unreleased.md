---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: Python 3 (ipykernel)
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

### Additional LaTeX display customization

Constructors for `Placeholder`, `DecisionVar`, `NamedExpr` and `CategoryLabel` now accept `element_latex` and `subscript_styles`
as additional configuration parameters to how these objects are displayed in $\LaTeX$, in addition to `latex` the latex parameter.

`element_latex` sets a standard name for indices ranging over that object (such as when doing sums) to replace our automatically
assigned names (eg. `i`, `j`, etc.). Note that this may override whatever name the user writes in a `lambda` or `for` clause

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N", element_latex="n")
c = problem.Float("c", shape=N)
x = problem.BinaryVar("x", shape=N)
problem += jm.sum(c * x)
problem += c.map(lambda v: v * 2).sum()
problem
```

For tuple sets, `element_latex` accepts a list of names. Elements not assigned a name will fallback
to regular naming behavior.

`subscript_styles` allows customizing how the subscripts are actually displayed, eg. changing it to
a superscript, parentheses, or bracket-style display. For multi-dimensional arrays, passing a single
style applies it to all indices, but you can also pass a list, so that each index position is
displayed in a different style.

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N, N), subscript_styles=jm.SubscriptStyle.BRACKET)
y = problem.BinaryVar(
    "y", shape=(N, N), subscript_styles=[jm.SubscriptStyle.SUP, jm.SubscriptStyle.SUB]
)
problem += x[0, 1] + y[0, 1]
problem
```

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

### Accept empty lists and arrays as placeholder inputs

Previously, empty arrays or lists could be provided as instance data for one-dimensional arrays, but caused compilation errors for arrays with two or more dimensions.

Starting with this release, if the array shape allows empty data, the input is interpreted as a multidimensional array with at least one unspecified axis of length 0.

```{code-cell} ipython3
@jm.Problem.define("p")
def problem(problem: jm.DecoratedProblem):
    cuts = problem.Float(ndim=2)

problem.eval({"cuts": []}) # Interpreted as a 0 x 0 array
```

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

## Other Changes

- Change 1

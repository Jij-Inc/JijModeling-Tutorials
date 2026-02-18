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

# JijModeling 2.1.0 Release Notes

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
        'c': {"value": jm.generation.value.closed(-1.0, 1.0)}
         # You can also specify "size" for the range of jagged array dimension size.
    },
    seed=123 # omittable
)
assert set(inputs.keys()) == {"N", "c"}
inputs
```

### Support for the `jm.Expression()` constructor

The {py:class}`~jijmodeling.Expression` class now provides a constructor, allowing you to explicitly convert any value that is convertible to {py:class}`~jijmodeling.Expression` (i.e., {py:data}`~jijmodeling.ExpressionLike`) into an {py:class}`~jijmodeling.Expression` object.

### Improved Type Hints

The bundled type hints are now more accurate, making it easier for IDEs to provide assistance.

## Bugfixes

+++

### Bugfix 1: Division containing decision variables only on left-hand side now compiles

In JijModeling 2.0.0, divisions where no decision variable appears on the right-hand side, e.g. `x / 2`, incorrectly triggered a compile-time error.
With this release, division now compiles correctly as long as the right-hand side does not contain decision variables.

### Bugfix 2: Index/value comparison inside `map` and `filter` now compiles

There was a bug where code comparing indices and values inside nested `map` or `filter` would fail to compile.
For example, the previous version produced an error like:

```python
@jm.Problem.define("TestProblem")
def problem(problem: jm.DecoratedProblem):
    V = problem.Natural(ndim=1)
    W = problem.Natural()
    x = problem.BinaryVar( shape=(W,))
    problem += problem.Constraint(
        "constr",
        [jm.sum(x[j] for j in W if j <= i) == 1 for i in V],
    )
# TypeError: Traceback (most recent last):
# ...
#     9  |          [jm.sum(x[j] for j in W if j <= i) == 1 for i in V],
#                                              ^^^^^^

# Type Error: Instance for comparison operator not found for type natural and ElementOf[set(V)]
```

Since this version, this compiles correctly.

### Bugfix 3: Indexing with tuples now works correctly

In previous releases, there was a bug where indexing with tuples could cause the compiler to crash with a PanicException under certain conditions.
With this release, the bug has been fixed, and indexing dictionaries with single tuples now evaluates correctly.

### Bugfix 4: `Problem.infer()` now correctly converts to expressions

In previous releases, {py:meth}`Problem.infer() <jijmodeling.Problem.infer>` raised a runtime error if its argument was not a {py:class}`~jijmodeling.Expression` object.
With this release, arguments that can be converted to expressions (such as numeric values or {py:class}`~jijmodeling.Placeholder` objects) are now converted to expressions before type inference.

### Bugfix 5: Missing parentheses in formula output

Previously, exponentiation of summation symbols and addition/subtraction within summation symbols were not properly enclosed in parentheses, leading to ambiguity in the formulas. This issue has been fixed.

## Other Changes

- `Problem` now provides {py:attr}`Problem.name` and {py:attr}`Problem.sense` properties.

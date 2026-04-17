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

### Generating arrays with a shape and generator function

Starting with this version, the {py:func}`~jijmodeling.genarray` function can be used to generate arrays by specifying a shape and a generator function.
This is similar to {py:func}`~numpy.fromfunction` in NumPy.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("genarray example")
N = problem.Natural("N")
M = problem.Natural("M")
a = problem.Float("a", shape=(N, M))
x = problem.BinaryVar("x", shape=N)
Sums = problem.NamedExpr("Sums", jm.genarray(lambda i, j: a[i, j] * x[i], (N, M)))


problem
```

When using the Decorator API, you can also use a comprehension syntax with `jm.genarray` as follows:

```{code-cell} ipython3
@jm.Problem.define("genarray example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=N)
    Sums = problem.NamedExpr(jm.genarray(a[i, j] * x[i] for i, j in (N, M)))


problem
```

Only one `for .. in ...` clause is allowed in a `genarray` comprehension.
The following is an example that raises an error because it uses multiple `for` clauses:

```{code-cell} ipython3
try:

    @jm.Problem.define("genarray example")
    def problem(problem):
        N = problem.Natural()
        M = problem.Natural()
        a = problem.Float(shape=(N, M))
        x = problem.BinaryVar(shape=N)
        Sums = problem.NamedExpr(jm.genarray(a[i, j] * x[i] for i in N for j in M))
except SyntaxError as e:
    print(str(e))
```

### Support for `min` / `max` along axes

Previously, {py:func}`jm.sum <jijmodeling.sum>` and {py:meth}`Expression.sum <jijmodeling.Expression.sum>` supported taking sums along a specific axis of a multidimensional array via the `axis` keyword argument.
Starting with this version, the same functionality has been added to {py:func}`jm.min <jijmodeling.min>` and {py:func}`jm.max <jijmodeling.max>` as well as their corresponding `Expression` methods.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("min/max along axes example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    a_min_0 = problem.NamedExpr(a.min(axis=0), save_in_ommx=True)
    a_max_1 = problem.NamedExpr(jm.max(a, axis=1), save_in_ommx=True)
    a_min_both = problem.NamedExpr(jm.min(a, axis=[1, 0]), save_in_ommx=True)


problem
```

Now let's create an instance and inspect the included Named Functions together with the value of `a`.

```{code-cell} ipython3
import numpy as np

a_data = np.array([[1, 5, 3], [4, 2, 6]])
compiler = jm.Compiler.from_problem(problem, {"N": 2, "M": 3, "a": a_data})
instance = compiler.eval_problem(problem)

display(instance.named_functions_df)
print(f"a == {a_data}")
```

Since the Named Functions in the OMMX Instance are split apart by index, the table above may be a bit hard to read.
So let's regroup them by variable using `compiler`, build arrays from them, and compare the results.

First, consider `a_min_0 = a.min(axis=0)`, which takes the minimum along axis 0 (columns).
This leaves axis 1 (rows), producing a vector whose entries are the minima of each column.

```{code-cell} ipython3
a_min_0_ids = compiler.get_named_function_id_by_name("a_min_0")
a_min_0_values = [
    instance.get_named_function_by_id(a_min_0_ids[(i,)]).function.constant_term
    for i in range(3)
]
assert np.all(a_min_0_values == np.min(a_data, axis=0))  # Matches NumPy's behavior!
print(f"a.min(axis=0) == {a_min_0_values}")
```

In contrast, `a_max_1 = a.max(axis=1)` takes the maximum along axis 1 (rows),
producing a vector whose entries are the maxima of each row.

```{code-cell} ipython3
a_max_1_ids = compiler.get_named_function_id_by_name("a_max_1")
a_max_1_values = [
    instance.get_named_function_by_id(a_max_1_ids[(i,)]).function.constant_term
    for i in range(2)
]
assert np.all(a_max_1_values == np.max(a_data, axis=1))  # Matches NumPy's behavior!
print(f"a.max(axis=1) == {a_max_1_values}")
```

For `a_min_both = a.min(axis=[1, 0])`, the minimum is taken along multiple axes.
Since the input here is two-dimensional, this simply becomes the overall minimum.

```{code-cell} ipython3
a_min_both_ids = compiler.get_named_function_id_by_name("a_min_both")
a_min_both_value = instance.get_named_function_by_id(
    a_min_both_ids[()]
).function.constant_term
assert a_min_both_value == np.min(a_data)  # Matches NumPy's behavior!
print(f"a.min(axis=[1, 0]) == {a_min_both_value}")
```

## Bugfixes

+++

### Bugfixes in random instance data generation

We fixed the following two bugs in random instance data generation:

#### Placeholders that depend on `NamedExpr` were not handled correctly

We fixed a bug where placeholders whose shape (length) or key set depends on `NamedExpr` were not handled correctly.
For example, consider the following problem:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = problem.NamedExpr(a.len_at(0))
    b = problem.Natural(shape=(N, None))
    M = problem.NamedExpr(b.len_at(1))
    problem += jm.sum(a[i] * b[i, j] for i in N for j in M)


problem
```

In previous versions, calling `generate_random_dataset()` on this `problem` raised an exception. Starting with this release, the data is generated correctly.

```{code-cell} ipython3
problem.generate_random_dataset(seed=17)
```

#### Fixed a bug where generation failed when unused placeholders were present

Data generation failed when there were unused placeholders not included in `used_placeholder()`.
For example, in the following code, `N` is defined but never used, and previous versions raised a runtime exception.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
N = problem.Natural("N")

problem.generate_random_dataset(seed=17)
```

Starting with this release, data is generated successfully in cases like the example above.

#### Fixed a bug where `latex` specifications were ignored in LaTeX output for decision variable bounds

We fixed a bug where the values of the `latex=` keyword argument for other variables were ignored when outputting decision variable bounds in $\LaTeX$.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("LaTeX bugfix example")
L = problem.Float("L", latex=r"\ell")
U = problem.Float("U", latex=r"\mathcal{U}")
x = problem.ContinuousVar("x", lower_bound=L, upper_bound=U)
problem += x

problem
```

In previous releases, the `latex` specifications were ignored in the code above, and the bounds were displayed as $L \leq x \leq U$.
Starting with this release, the settings are preserved as shown above, and the bounds are displayed as $\ell \leq x \leq \mathcal{U}$.

## Other Changes

- Relaxed version bounds to allow installation on any Python 3 version from Python 3.11 onwards.
- Error messages for invalid comprehensions used with the Decorator API in `sum` and similar constructs now report the specific location in the source code.

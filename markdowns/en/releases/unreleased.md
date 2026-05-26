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

### Comprehension syntax for `jm.min`, `jm.max`, and `jm.set` in the Decorator API

Previously, when using the Decorator API, only {py:func}`jm.sum <jijmodeling.sum>` and {py:func}`jm.prod <jijmodeling.prod>` accepted a comprehension (Python generator) expression as their single argument.

Starting with this version, unary calls to {py:func}`jm.min <jijmodeling.min>`, {py:func}`jm.max <jijmodeling.max>`, and {py:func}`jm.set <jijmodeling.set>` also accept comprehension expressions in the same way.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("min/max/set comprehension example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=N)

    nonzero = jm.set(i for i in N if i != 0)
    problem += jm.min(x[i] for i in N) + jm.max(x[i] for i in nonzero)


problem
```

### Math output: More readable constraint indices

Constraints created by directly comparing dictionaries or arrays are now rendered in $\LaTeX$ output using $\forall$, improving readability.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("container-vs-scalar-comp")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(shape=N)
    y = problem.BinaryVar(dict_keys=(L, N - 1))
    z = problem.BinaryVar(dict_keys=(L, N - 1))

    problem += problem.Constraint(
        "scalar-vs-tensor",
        1 <= x
    )
    problem += problem.Constraint(
        "tensor-vs-tensor",
        x <= x
    )
    problem += problem.Constraint(
        "dict-vs-scalar",
        y <= 5
    )
    problem += problem.Constraint(
        "dict-vs-dict",
        y <= z
    )

problem
```

### Bounded naturals and category labels are now allowed as a `Placeholder` `dtype`

The `dtype` argument of {py:meth}`Problem.Placeholder <jijmodeling.Problem.Placeholder>` (and its shorthands such as `Graph`, `PartialDict`, and `TotalDict`) used to be limited to a `jm.DataType`, a NumPy scalar type, or a tuple built out of those.
Starting with this version, `dtype` additionally accepts:

- a natural-number expression `n`, declaring that the values are natural numbers strictly less than `n` (i.e. drawn from $\{0, 1, \dots, n - 1\}$); the bound `n` may also be a Python integer literal or another placeholder/named expression of natural-number type.
- a {py:class}`~jijmodeling.CategoryLabel` `L`, declaring that the values are labels drawn from `L`.
- a tuple `(T, T, ...)` whose components are any of the above (or any other accepted `dtype`).

For example, consider the the following optimization problem involving an undirected graph $G = (V, E)$. Previously, edge endpoints had to be declared as plain naturals; with this release you can express the intent that they must lie in $[0, V)$:

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("max cut", sense=jm.ProblemSense.MAXIMIZE)
V = problem.Natural("V")
# We can now say that each entry of `E` is a pair of vertices in [0, V)
# (previously we had to write dtype=(jm.DataType.Natural, jm.DataType.Natural)).
# Alternatively, we may write this as problem.graph("E", dtype=V)
E = problem.Placeholder("E", dtype=(V, V), ndim=1)
x = problem.BinaryVar("x", shape=(V,))
problem += jm.map(lambda u, v: (x[u] - x[v]) ** 2, E).sum()

problem
```

When the vertices of a graph are named rather than indexed, a {py:class}`~jijmodeling.CategoryLabel` can now be used directly as the `dtype`.
Here is the same problem, written with {py:meth}`Problem.Graph`, but on a graph whose vertices are identified by labels rather than integer indices:

```{code-cell} ipython3
problem = jm.Problem("max cut on a labeled graph", sense=jm.ProblemSense.MAXIMIZE)
L = problem.CategoryLabel("L")
edges = problem.Graph("edges", dtype=L)
x = problem.BinaryVar("x", dict_keys=L)
problem += jm.map(lambda u, v: (x[u] - x[v]) ** 2, edges).sum()

compiler = jm.Compiler.from_problem(
    problem,
    {
        "L": ["A", "B", "C"],
        "edges": [("A", "B"), ("B", "C"), ("C", "A")],
    },
)
instance = compiler.eval_problem(problem)
```

When a value supplied through the instance data is not consistent with the declared `dtype` (for example a vertex index $\geq V$, or a label not in `L`), the compiler will report an out-of-range error instead of silently accepting the value.


## Bug Fixes

+++

### Fix bug where operations between subscript elements and numeric types failed

Fixed an issue where numeric operations on `Constraint` subscript elements, as shown below, were incorrectly treated as type errors.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Example")
def problem(problem: jm.DecoratedProblem):
    K = problem.Float(ndim=1)
    x = problem.BinaryVar()
    problem += problem.Constraint("c", [k * x <= 0 for k in K])

problem
```

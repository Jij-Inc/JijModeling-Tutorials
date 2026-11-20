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

# Modeling irregular data with compound placeholders

Starting with JijModeling 2.12.0, you can declare placeholders with composite types that combine containers such as dictionaries, arrays, and tuples.
We call these **compound placeholders**.
To declare one, pass a nested type to the `dtype` keyword argument of {py:meth}`Problem.Placeholder <jijmodeling.Problem.Placeholder>`.
You can build composite types with the following constructors.

| Constructor | Meaning |
| :---- | :--- |
| {py:attr}`jm.DataType.STREAM[T] <jijmodeling.DataType.STREAM>` | A {doc}`stream <../basics/folding_and_stream>` of values of type `T` |
| `(T1, ..., Tn)` or {py:class}`tuple[T1, ..., Tn] <tuple>` | A tuple whose components have types `T1` through `Tn`, respectively |
| {py:attr}`jm.DataType.PARTIAL_DICT[K, V] <jijmodeling.DataType.PARTIAL_DICT>` | A partial dictionary with keys of type `K` and values of type `V` |
| {py:attr}`jm.DataType.TOTAL_DICT[K, V] <jijmodeling.DataType.TOTAL_DICT>` | A total dictionary with keys of type `K` and values of type `V` |

The rules for `K` are the same as for keys in an ordinary {doc}`placeholder dictionary <../basics/placeholders>`.
For `V` and `T`, you can use any type specifier that `dtype` accepts.
To declare a multidimensional array as the outermost container, use `shape` or `ndim`. There is currently no `dtype` constructor for nested multidimensional arrays.
For example, `A` below is an $N \times M$ array. Each entry is a stream of pairs consisting of a label from $L$ and an integer.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    M = problem.Natural()
    L = problem.CategoryLabel()

    A = problem.Placeholder(shape=(N, M), dtype=jm.DataType.STREAM[(L, int)])


problem
```

The following optimization problem shows how a compound placeholder can represent data whose shape varies from one entry to the next.

## A multiple knapsack problem with assignment restrictions

Suppose we have several knapsacks, each of which can hold only certain items.
Let $\mathrm{Item}$ be the category label for the set of items. Each item $i$ has value $v_i$ and weight $w_i$.
For each of the $N$ knapsacks, we are given its capacity $W_n$ and a list $\mathrm{avail}_n$ of the items it can hold.
Each item can go in at most one knapsack. The binary decision variable $x_{i,n}$ records whether item $i$ goes in knapsack $n$. Our goal is to maximize the total value of the packed items.

The number of eligible items in $\mathrm{avail}_n$ can vary with $n$.
Earlier versions of JijModeling often used jagged arrays for data of this kind. When rows have different lengths, JijModeling cannot guarantee at model definition time that an index into a row is in bounds. For this reason, jagged arrays are deprecated in JijModeling 2.
Here we can use a compound placeholder and iterate over the items in each row. This lets JijModeling type-check the model without requiring an index into the variable-length dimension.

First, declare the placeholders.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Multiple Knapsack Problem", sense=jm.ProblemSense.MAXIMIZE)
def problem(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel(description="Items", element_latex=r"\ell")
    N = problem.Natural(description="Number of knapsacks", element_latex=r"n")
    v = problem.Float(dict_keys=L, description="Value of each item")
    w = problem.Float(dict_keys=L, description="Weight of each item")

    W = problem.Float(shape=N, description="Capacity of each knapsack")
    avail = problem.Placeholder(
        shape=N,
        dtype=jm.DataType.STREAM[L],
        description="Items each knapsack can hold",
        latex=r"\mathrm{avail}",
    )


problem
```

Here $\mathrm{avail}$ is a compound placeholder. It is a one-dimensional array of length $N$, and each entry is a stream of items.
We can index the outer array to get the stream for knapsack $n$. A stream does not support random access, but we only need to iterate over its items.

We can now define $x_{\ell,n}$ only for pairs $(\ell,n)$ where knapsack $n$ can hold item $\ell$.

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem, avail: jm.Placeholder):
    domain = problem.NamedExpr(
        jm.stream((l, n) for n, items in avail.enumerate() for l in items),
        element_latex=[r"\ell", r"n"],
    )
    x = problem.BinaryVar(
        dict_keys=domain,
        description=r"$x_{\ell,n} = 1$ if and only if item $\ell$ is assigned to knapsack $n$",
    )


problem
```

With these definitions in place, we can add the constraints and the objective.

```{code-cell} ipython3
@problem.update
def _(
    problem: jm.DecoratedProblem,
    x: jm.DecisionVar,
    L: jm.CategoryLabel,
    N: jm.Placeholder,
    v: jm.Placeholder,
    avail: jm.Placeholder,
    w: jm.Placeholder,
    W: jm.Placeholder,
):
    problem += problem.Constraint(
        "one-knapsack",
        [jm.sum(x[l, n] for l2, n in x.keys() if l2 == l) <= 1 for l in L],
    )
    problem += problem.Constraint(
        "weight", [jm.sum(w[l] * x[l, n] for l in avail[n]) <= W[n] for n in N]
    )

    problem += jm.sum(v[l] * x[l, n] for l, n in x.keys())


problem
```

The `one-knapsack` constraint assigns each item to at most one knapsack. The `weight` constraint keeps the total weight of the items in each knapsack within its capacity.

Finally, solve the problem with the following data for three knapsacks and five items.

```{code-cell} ipython3
instance_data = {
    "w": {
        "Apple": 2.4,
        "iPhone": 2.4,
        "Gold": 7.8,
        "Mac Mini": 9.7,
        "ChatGPT": 2.1,
    },
    "W": [29, 42, 14],
    "avail": [
        ["Mac Mini"],
        ["ChatGPT", "Mac Mini", "Apple", "Gold"],
        ["ChatGPT", "Mac Mini", "iPhone"],
    ],
    "N": 3,
    "v": {
        "Apple": 5,
        "iPhone": 7.8,
        "Gold": 3,
        "Mac Mini": 8,
        "ChatGPT": 1,
    },
    "L": ["Apple", "iPhone", "Gold", "Mac Mini", "ChatGPT"],
}

instance_data
```

```{code-cell} ipython3
from ommx_pyscipopt_adapter import OMMXPySCIPOptAdapter

instance = problem.eval(instance_data)
solution = OMMXPySCIPOptAdapter.solve(instance)

solution.decision_variables_df
```

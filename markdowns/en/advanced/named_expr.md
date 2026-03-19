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

# Naming Expressions and Saving Them in Instances

JijModeling provides a way to assign a name to a specific expression, which is useful in situations such as:

1. Naming complex expressions to make mathematical output easier to read
2. Saving information about expressions, such as partial terms of the objective whose values you want to inspect after solving, into OMMX so they can be evaluated automatically

This section explains how to define named expressions in JijModeling with these use cases in mind.

## {py:class}`~jijmodeling.NamedExpr` class

JijModeling provides the {py:class}`~jijmodeling.NamedExpr` class to represent named expressions.
Like decision variables and placeholders, it can be declared using the {py:meth}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` method.
{py:meth}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` accepts the following arguments:

| Argument | Type | Description |
| :-- | :--: | :-- |
| `name` | `str` | The name of the named expression. Optional in the Decorator API. |
| `definition` | Required. {py:data}`~jijmodeling.ExpressionLike` | The definition of the named expression. You can pass JijModeling expression objects or any object that can be converted into an expression, such as Python numbers, strings, tuples, lists, dictionaries, and NumPy arrays. |
| `description` | `Optional[str]` | Optional. A description of the named expression. It is used in mathematical output and in expressions saved to OMMX. |
| `latex` | `Optional[str]` | Optional. A $\LaTeX$ representation of the named expression. It is used when rendering mathematical output. |
| `save_in_ommx` | `bool` | Optional, default `False`. If set to `True`, and the conditions described later are satisfied, the expression is saved in the OMMX instance as an {py:class}`ommx.v1.NamedFunction`. |

Let's look at an example. In the knapsack problem, suppose we want to infer the number $N$ of items from the length of the placeholder array $w$ representing the weight of each item, without specifying $N$ explicitly.
First, here is a formulation that does not use {py:meth}`~jijmodeling.Problem.NamedExpr`:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (Unnamed)", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_unnamed(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    N = w.len_at(0)
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack_unnamed
```

As expected, only the three instance data values $W$, $w$, and $v$ are needed. However, the definition `len_at(w, 0)` for $N$ is expanded inline, which makes the math output, especially the summation ranges, harder to read.
Now let us define $N$ using {py:meth}`~jijmodeling.Problem.NamedExpr`:

```{code-cell} ipython3
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    # N is wrapped in NamedExpr.
    N = problem.NamedExpr(w.len_at(0), description="Length of w")
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack
```

The definition of $N$ now appears in the `Named Expressions` section at the end, and the rest of the formulation displays it simply as $N$.
You can also inspect the dictionary of `NamedExpr`s defined in the problem via `problem.named_exprs`:

```{code-cell} ipython3
knapsack.named_exprs
```

Although $N$ is treated as an independent variable in the JijModeling model, its definition is expanded automatically when compiling to an instance, so the resulting instance is equivalent to the one obtained without using `NamedExpr`.

```{code-cell} ipython3
knapsack_instance_data = {
    "v": [10, 13, 18, 31, 7, 15],
    "w": [11, 15, 20, 35, 10, 33],
    "W": 47,
}

instance_named = knapsack.eval(knapsack_instance_data)
instance_unnamed = knapsack_unnamed.eval(knapsack_instance_data)

assert instance_named.objective.almost_equal(instance_unnamed.objective)
assert instance_named.constraints[0].function.almost_equal(
    instance_unnamed.constraints[0].function
)
```

## Saving {py:class}`~jijmodeling.NamedExpr` in OMMX instances

:::{admonition} Available in OMMX v2.5.0 or later
:class: important

The functionality required for the saving feature described below was added in OMMX v2.5.0.
If you want to use this feature, use OMMX v2.5.0 or later.
:::

In the example above, the definition of {py:class}`~jijmodeling.NamedExpr` contains only placeholders, but in fact you can name arbitrary expressions, including expressions that contain decision variables.
As mentioned earlier, if `save_in_ommx` is set to `True`, the expression is saved in the OMMX instance as an {py:class}`ommx.v1.NamedFunction` when certain conditions are met.
{py:class}`ommx.v1.NamedFunction` is the OMMX counterpart of {py:class}`jijmodeling.NamedExpr`. In particular, it can store names for OMMX functions ({py:class}`ommx.v1.Function`), that is, real-valued functions of decision variables, which we will call **scalar expressions** below.
Another important feature is that, in the {py:class}`ommx.v1.Solution` object obtained after solving, these values are computed automatically based on the values of the decision variables.

With that in mind, a `NamedExpr` can be saved in an OMMX instance with `save_in_ommx=True` only if it is one of the following:

1. A scalar expression
2. An array or dictionary whose elements are scalar expressions
   - In this case, the expression is decomposed and saved as separate `NamedFunction`s for each index.

If `save_in_ommx=True` is specified for any other kind of expression, an exception is raised when the `NamedExpr` is declared, as in the following examples.

```{code-cell} ipython3
problem = jm.Problem("Errornous Problem")
N = problem.Natural("N")
try:
    # Try saving a boolean expression.
    problem.NamedExpr("bool", N == 2, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
L = problem.CategoryLabel("L")
try:
    # Try saving a list of category labels.
    problem.NamedExpr("category_labels", L, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
x = problem.BinaryVar("M", shape=(N, N, N))

try:
    # Try saving an array whose elements are the "inner arrays" of x.
    # This becomes a one-dimensional array of two-dimensional arrays of scalar expressions.
    # Current JijModeling does not support saving nested arrays into OMMX,
    # so this raises an error.
    problem.NamedExpr("array_of_array", x.rows(), save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
# x itself is just a plain three-dimensional array, so it can be saved without issues.
problem.NamedExpr("threed", x, save_in_ommx=True)
```

On the other hand, if `save_in_ommx` is omitted or set to `False`, such expressions can still be declared as `NamedExpr`s without any problem.

+++

Let's look at an example. In the knapsack problem, suppose we want to inspect the total weight of the items actually placed in the knapsack after evaluation, as well as the contribution of each item in terms of value per unit weight.

```{code-cell} ipython3
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_weight(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    N = problem.NamedExpr(w.len_at(0), description="Length of w")
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )
    total_weight = problem.NamedExpr(
        jm.sum(w[i] * x[i] for i in N),
        description="Total weight of items in the knapsack",
        save_in_ommx=True,
    )
    problem.NamedExpr(
        "V",
        v / w * x,
        description="Contribution of each item to the value per unit weight",
        save_in_ommx=True,
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", total_weight <= W)


knapsack_weight
```

Here, we bind the total weight term to the named expression `total_weight`, and the per-item contribution to the named expression `V`, and save both in the OMMX instance with `save_in_ommx=True`.
First, let us create a compiler and generate an instance.

```{code-cell} ipython3
compiler = jm.Compiler.from_problem(knapsack_weight, knapsack_instance_data)
instance = compiler.eval_problem(knapsack_weight)
```

You can inspect the list of `NamedFunction`s contained in the instance via the {py:meth}`ommx.v1.Instance.named_functions` and {py:meth}`ommx.v1.Instance.named_functions_df` properties:

```{code-cell} ipython3
instance.named_functions_df
```

If you want the information for the `NamedFunction`s corresponding to a specific `NamedExpr`, pass the `NamedExpr` name to {py:meth}`Compiler.get_named_function_id_by_name() <jijmodeling.Compiler.get_named_function_id_by_name>`.
When `save_in_ommx=True`, this returns a dictionary from indices to `NamedFunction` IDs, where the index is `()` for a scalar expression:

```{code-cell} ipython3
contrib_dict = compiler.get_named_function_id_by_name("V")
print(contrib_dict)
assert contrib_dict is not None
instance.get_named_function_by_id(contrib_dict[(0,)])
```

By contrast, when `save_in_ommx=False` as in the case of `N`, it is not saved as a `NamedFunction`, so `get_named_function_id_by_name()` returns `None`:

```{code-cell} ipython3
assert compiler.get_named_function_id_by_name("N") is None
```

Now let us solve this with OpenJij and inspect the value of `total_weight` in the solution:

```{code-cell} ipython3
from ommx_openjij_adapter import OMMXOpenJijSAAdapter

solution = OMMXOpenJijSAAdapter.solve(
    instance,
    num_reads=100,
    num_sweeps=10,
    uniform_penalty_weight=1.6,
)

solution.named_functions_df
```

This gives us the total weight corresponding to the solution, as well as the value of each item's contribution.
In a simple case like this one, you could also inspect the total weight by comparing the `value` of the `Weight` constraint with `W`.
Still, saving `NamedExpr`s in the OMMX instance is useful in situations like this, and also when you want to inspect the evaluated value of specific terms in the objective function.

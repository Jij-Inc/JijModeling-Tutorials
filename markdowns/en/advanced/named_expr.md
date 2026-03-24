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

{py:class}`~jijmodeling.NamedExpr` has the following two main use cases:

1. Give a specific expression a name to make the $\LaTeX$ output easier to read
2. Save a specific expression in an OMMX instance and evaluate its value after solving

This document explains these uses of {py:class}`~jijmodeling.NamedExpr` with concrete examples.

+++

# Naming Expressions

Let us look at an example of naming a specific expression to make the $\LaTeX$ output easier to read. In the knapsack problem, suppose we want to infer the number of items $N$ from the length of the placeholder array $w$ representing the weight of each item, rather than providing $N$ explicitly as instance data.
First, here is a formulation that does not use {py:meth}`~jijmodeling.Problem.NamedExpr`:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (Unnamed)", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_unnamed(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    # Infer N from the length of w.
    N = w.len_at(0)
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack_unnamed
```

As you can see from the $\LaTeX$ output, the definition `len_at(w, 0)` for $N$ is expanded inline, which makes the formulation, especially the summation ranges, harder to read.
Now let us define $N$ using {py:meth}`~jijmodeling.Problem.NamedExpr`:

```{code-cell} ipython3
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    # Use NamedExpr to give the length of w the name N.
    N = problem.NamedExpr(w.len_at(0), description="Length of w")
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack
```

The definition of $N$ now appears in the `Named Expressions` section at the end, while the rest of the formulation displays it simply as $N$, which makes the $\LaTeX$ output easier to read.

+++

Also, although $N$ defined by {py:meth}`~jijmodeling.Problem.NamedExpr` is treated as a kind of variable in the JijModeling model, it is automatically expanded during compilation. Therefore, whether or not you use {py:meth}`~jijmodeling.Problem.NamedExpr` does not change the resulting OMMX instance.

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

:::{tip}
You can inspect the list of {py:class}`~jijmodeling.NamedExpr` objects registered in a model using {py:meth}`jijmodeling.Problem.named_exprs`.
:::

+++

## Saving in Instances

By setting the `save_in_ommx` argument of {py:class}`~jijmodeling.Problem.NamedExpr` to `True`, you can save an expression in an OMMX instance only when it satisfies one of the following conditions:

1. An expression whose possible values are scalars
2. An array of expressions whose possible values are scalars
3. A dictionary of expressions whose possible values are scalars

More concretely, expressions like the following can be saved in an OMMX instance.

```{code-cell} ipython3
# An expression whose possible values are scalars
# Example: a sum of binary variables
problem = jm.Problem("Scalar")
x = problem.BinaryVar("x", shape=(5,))
S = problem.NamedExpr("scalar", x.sum(), save_in_ommx=True)
problem
```

```{code-cell} ipython3
# An array of expressions whose possible values are scalars
# Example: the difference of two arrays of integer variables
problem = jm.Problem("Tensor of Scalars")
y = problem.IntegerVar("y", shape=(5,), lower_bound=0, upper_bound=10)
z = problem.IntegerVar("z", shape=(5,), lower_bound=0, upper_bound=10)
T = problem.NamedExpr("tensor_of_scalars", y - z, save_in_ommx=True)
problem
```

```{code-cell} ipython3
# A dictionary of expressions whose possible values are scalars
# Example: the product of a placeholder dictionary and a real-valued variable dictionary
problem = jm.Problem("Dict of Scalars")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
w = problem.ContinuousVar("w", dict_keys=K, lower_bound=0, upper_bound=10)
U = problem.NamedExpr("dict_of_scalars", a * w, save_in_ommx=True)
problem
```

On the other hand, expressions like the following cannot be saved in an OMMX instance.

```{code-cell} ipython3
problem = jm.Problem("Errornous Problem")
```

```{code-cell} ipython3
# Comparison expressions cannot be saved.
a = problem.IntegerVar("a", lower_bound=0, upper_bound=10)
try:
    problem.NamedExpr("comparison", a == 2, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
# Category labels cannot be saved.
L = problem.CategoryLabel("L")
try:
    problem.NamedExpr("category_labels", L, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
# `rows()` returns an array of arrays, so it cannot be saved.
x = problem.BinaryVar("M", shape=(5, 5))
try:
    problem.NamedExpr("array_of_array", x.rows(), save_in_ommx=True)
except Exception as e:
    print(e)
```

:::{tip}
Even for expressions that cannot be saved in an OMMX instance, you can still declare them as `NamedExpr` by setting `save_in_ommx=False` or leaving it unspecified.
:::

+++

Now let us look at an example of saving a specific expression in an OMMX instance and evaluating its value after solving. In the knapsack problem, suppose that in addition to the objective value, which is the total value of the selected items, we also want to know the total weight of the items.

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

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", total_weight <= W)


knapsack_weight
```

In the code above, we give the total-weight expression the name `total_weight`, and enable saving it in the OMMX instance by setting `save_in_ommx=True`. Now let us compile this model and generate the OMMX instance.

```{code-cell} ipython3
instance = knapsack_weight.eval(knapsack_instance_data)
```

You can inspect the expressions saved in the OMMX instance via the {py:meth}`ommx.v1.Instance.named_functions` and {py:meth}`ommx.v1.Instance.named_functions_df` properties.

```{code-cell} ipython3
instance.named_functions_df
```

:::{tip}
To get the `NamedFunction` IDs corresponding to expressions saved in the OMMX instance, use {py:meth}`Compiler.get_named_function_id_by_name() <jijmodeling.Compiler.get_named_function_id_by_name>`.
:::

+++

Now let us solve this OMMX instance with OpenJij and inspect the value of `total_weight` in the resulting solution.

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

This confirms that the value of the expression `total_weight` saved in the OMMX instance can be evaluated.
Besides this kind of usage, saving specific expressions in OMMX instances is also useful in cases such as weighted multi-objective optimization.

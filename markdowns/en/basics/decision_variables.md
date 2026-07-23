---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.4
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# Solver-determined variables: decision variables

This chapter explains how to declare **decision variables**, one of the central components of mathematical optimization models, in JijModeling.
As usual, start by importing the module.

## Declaring single decision variables and their bounds

Decision variables are variables whose values are determined by solvers based on constraints and objectives.
Since JijModeling is a general-purpose modeler, it supports the following representative types:

| Type | Mathematical Notation | Description |
| :---- | :------------------: | :--- |
| {py:meth}`~jijmodeling.Problem.BinaryVar` | $\{0, 1\}$ | A binary variable taking value $0$ or $1$. Bounds are not required. |
| {py:meth}`~jijmodeling.Problem.IntegerVar` | $\mathbb{Z}$ | An integer variable. Bounds are required. |
| {py:meth}`~jijmodeling.Problem.ContinuousVar` | $\mathbb{R}$ | A continuous real-valued variable. Bounds are required. |
| {py:meth}`~jijmodeling.Problem.SemiIntegerVar` | - | A variable that takes integer values within bounds or zero. Bounds are required. |
| {py:meth}`~jijmodeling.Problem.SemiContinuousVar` | - | A variable that takes continuous values within bounds or zero. Bounds are required. |

These constructors are broadly similar to placeholder constructors, but constructors ending in `*Var` are for decision variables, while those without `*Var` are for placeholders.
Also note that real-valued decision variables are declared with `ContinuousVar`, not `FloatVar`.

To declare a specific type of decision variable, call the method with the corresponding type name on the `Problem` object to which the variable should be registered.
For example, define a mathematical model with a binary variable $x$ and a continuous variable $C' \in[-5, 10.5]$.
With the Plain API, this is:

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("Model with Variables")
x = problem.BinaryVar("x", description="Some binary variable")
C = problem.ContinuousVar(
    "C'",
    lower_bound=-5,
    upper_bound=10.5,
    description="Another continuous variable",
)

problem
```

The first argument is required and specifies the variable name.
The keyword arguments `upper_bound` and `lower_bound` specify the variable bounds, and must be provided for all variable types except binary variables.
`description`, like the one for `Problem`, is an optional keyword argument for a human-readable explanation.

:::{admonition} Bounds for single decision variables
:class: tip

You can write any JijModeling expression **without decision variables** for `upper_bound` and `lower_bound`.
See {doc}`./expressions` for what expressions are allowed.
:::

With the **Decorator API**, you can omit the variable name; in that case the Python variable name is used automatically.
The next example defines the same model with the Decorator API.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Model with Variables")
def deco_problem(deco_problem: jm.DecoratedProblem):
    # Inside the Decorator API, omit the name for x.
    x = deco_problem.BinaryVar(description="Some binary variable")
    # You can also explicitly specify a name even inside the Decorator API.
    C = deco_problem.ContinuousVar(
        "C'",
        lower_bound=-5,
        upper_bound=10.5,
        description="Another continuous variable",
    )


deco_problem
```

In this example, the variable name of $x$ is omitted, but it is printed as $x$ as expected.
Name omission inside the Decorator API is optional, and you can still specify a name explicitly as shown for $C'$.

:::{admonition} When you can omit variable names
:class: caution

In the Decorator API, you can omit a variable name only when the declaration has the form `x = problem.*Var(...)`, i.e. one variable on the left and one `Var` constructor call on the right.
If you declare multiple variables at once, such as `x, y = (problem.BinaryVar(), problem.BinaryVar())`, it will raise an error.
:::

(var_info)=
## Retrieving decision-variable information

As with placeholders, the list of decision variables can be obtained from the `Problem` object's {py:attr}`~jijmodeling.DecoratedProblem.decision_vars` property.
This list also includes information for indexed variables discussed below.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Model with Variables")
def deco_problem(deco_problem: jm.DecoratedProblem):
    x = deco_problem.BinaryVar(description="Some binary variable")
    C = deco_problem.ContinuousVar(
        "C'",
        lower_bound=-5,
        upper_bound=10.5,
        description="Another continuous variable",
    )


deco_problem.decision_vars
```

Decision-variable metadata obtained this way is represented by {py:class}`~jijmodeling.DecisionVar` objects, the same objects returned at declaration time.
Therefore, {py:class}`~jijmodeling.DecisionVar` objects contained in {py:attr}`~jijmodeling.Problem.decision_vars` can also be used as variable expressions.
This is especially useful when you update a `Problem` incrementally with multiple `@problem.update` or `@jm.Problem.define()` decorators and need to refer to variables defined in earlier decorator blocks.

:::{tip}
In the future, `@problem.update` is planned to accept already-defined variables as arguments. Stay tuned.
:::

(family)=
## Declaring indexed decision variables

Now let's look at how to declare indexed decision variables.

(array_of_dec_vars)=
### Arrays of decision variables

Decision-variable arrays are declared in the same way as placeholder arrays, by passing a `shape=` keyword argument to constructors such as `BinaryVar`.
The `shape` keyword argument can take an expression representing a fixed-length tuple of natural numbers.
When the dimension is $1$, it can also be given directly as a natural-valued expression.

:::{admonition} Specifying the shape of decision-variable arrays
:class: important

Because the number of decision variables must be determined only from placeholder values, unlike placeholders, **you cannot specify `None` as a component of `shape`**, and **you cannot use the `ndim=` keyword argument**.
:::

Define a model with a binary variable array $x$ consisting of $N$ decision variables:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Example Problem", sense=jm.ProblemSense.MAXIMIZE)
def problem(problem: jm.DecoratedProblem):
    # Declare placeholder N so the number of variables is determined.
    N = problem.Length()

    # Declare x.
    x = problem.BinaryVar(shape=N)


problem
```

:::{tip}
This example uses the Decorator API, but the `shape` argument works the same in the Plain API, except that the variable name cannot be omitted.
:::

As another example, here is a two-dimensional array declared by passing a tuple to `shape`:

(multidim_arrays)=

```{code-cell} ipython3
import jijmodeling as jm


multidim_arrays = jm.Problem("multidimensional arrays", sense=jm.ProblemSense.MINIMIZE)
N = multidim_arrays.Length("N")  # Plain API, so the name is required.
M = multidim_arrays.Length("M")
x = multidim_arrays.BinaryVar(
    "x",
    shape=(N, M),  # N x M array
)

multidim_arrays
```

(dec_var_array_bounds)=
#### Specifying bounds for decision-variable arrays

For arrays of decision variables, the following kinds of expressions can be specified for `upper_bound` and `lower_bound`:

1. A scalar
2. An array expression with the same shape and scalar entries
3. A function expression from indices to scalar bounds

In all cases, the expression must not include decision variables.

You can use different approaches for the upper and lower bounds.
The next example uses (1) and (2).

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("Bounds for variable arrays")
N = problem.Length("N")
lb = problem.Integer("lb")
ubs = problem.Integer("ub", shape=N)
a = problem.IntegerVar("a", shape=N, lower_bound=lb + 1, upper_bound=ubs)

problem
```

Here, `lb` is a zero-dimensional scalar, and `ub` is a one-dimensional placeholder array of length $N$.
Based on these, the one-dimensional decision-variable array $a$ of length $N$ has the following bounds:

- Lower bound: $a_i \geq \mathit{lb} + 1$ for all indices, corresponding to (1) above
- Upper bound: $a_i \leq \mathit{ub}_i$ for each $i = 0, \ldots, N - 1$, corresponding to (2) above

As an example of (3), a slightly artificial but illustrative example is:

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("Another bound examples with lambda")

N = problem.Length("N")
M = problem.Length("M")
s = problem.ContinuousVar(
    "s",
    shape=(N, M),
    lower_bound=0,
    upper_bound=lambda i, j: i + j,
)

problem
```

For the two-dimensional array $s$ of shape $N \times M$, this gives the following bounds:

- Lower bound: $s_{i,j} \geq 0$ regardless of indices, corresponding to (1) above
- Upper bound: $s_{i,j} \leq i + j$ for each $i = 0, \ldots, N - 1$ and $j = 0, \ldots, M - 1$, corresponding to (3) above

By preparing arrays with the same shape, or using functions from indices for more complex expressions, you can flexibly specify bounds even for decision-variable arrays.

### Dictionaries of decision variables

As discussed in the note on the number of decision variables in {doc}`./variables`, decision-variable dictionaries must have their number of variables determined after compilation, so only `TotalDict` can be declared.
To declare a dictionary of decision variables, pass the `dict_keys` keyword argument to constructors such as `BinaryVar`, `IntegerVar`, and so on.
This is analogous to passing `shape` when declaring decision-variable arrays.

The following expressions can be passed to `dict_keys` when declaring a decision-variable dictionary:

1. A natural-valued expression $n$ without decision variables, identified with the set $\mathbb{N}_{<n} = \{0, \ldots, n - 1\}$
2. A Python list of strings
3. A category label defined by `problem.CategoryLabel`
4. A tuple composed of (1) to (3)

:::{caution}
If you specify `dict_keys` together with `ndim` or `shape` in a decision-variable constructor, it raises an error because the container type cannot be determined.
:::

Here is an example of a decision-variable dictionary keyed by a tuple of a category label and a natural-number set:

```{code-cell} ipython3
import jijmodeling as jm


problem_for_dict = jm.Problem("Dec Var Keys demonstration")
N = problem_for_dict.Length("N")
L = problem_for_dict.CategoryLabel("L")
x = problem_for_dict.BinaryVar("x", dict_keys=(L, N))

problem_for_dict
```

#### Specifying bounds for decision-variable dictionaries

The `lower_bound` and `upper_bound` settings for decision-variable dictionaries can be specified in the same way as described in "[Bounds for decision-variable arrays](#dec_var_array_bounds)":

1. A scalar
2. A `TotalDict` with the same key set and scalar entries
3. A function expression from indices to scalar bounds

#### Example problem definition using dictionaries and category labels

Here is a knapsack formulation rewritten using category labels:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (vars only, CATEGORY LABEL)")
def knapsack_cat_dict(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    # Use the TotalDict constructor.
    v = problem.TotalDict(dtype=float, dict_keys=L, description="Value of each item")
    # Use dict_keys.
    w = problem.Float(dict_keys=L, description="Weight of each item")
    x = problem.BinaryVar(
        dict_keys=L, description="$x_i = 1$ only when item $i$ is included"
    )


knapsack_cat_dict
```

So far, this only replaces $N$ with $L$.
Next, consider an additional condition: for some item pairs $(i, j)$, packing them together gives an extra value, or synergy bonus, $s_{i,j}$.
In such cases, `PartialDict` is very useful:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (vars only, with synergy)")
def knapsack_synergy(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    v = problem.TotalDict(dtype=float, dict_keys=L, description="Value of each item")
    w = problem.Float(dict_keys=L, description="Weight of each item")
    x = problem.BinaryVar(
        dict_keys=L, description="$x_i = 1$ only when item $i$ is included"
    )
    # Use PartialDict to represent synergy bonuses.
    s = problem.PartialDict(
        dtype=float, dict_keys=(L, L), description="Synergy bonus for some item pairs"
    )


knapsack_synergy
```

The description "A *partial* dictionary of placeholders..." is important, because it expresses that $s$ is defined only for some combinations of $L$.
This could also be represented by a list of tuples and a real-valued array of the same length, but dictionaries make the description more direct and natural.

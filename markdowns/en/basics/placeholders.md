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

# User-provided variables: placeholders and category labels

In this chapter, we describe how to declare and inspect **placeholders**, the variables whose data is provided by users, and **category labels**, a related variant of placeholders.

(single_ph)=
## Declaring single placeholders

This section covers placeholder types and how to declare a single placeholder.

Placeholders require a type at declaration time.
Because placeholders represent values provided by users at compile time, JijModeling provides several types for representing input data appropriately.
Representative placeholder types are:

| Type | Mathematical Notation | Description | Alias |
| :--- | :------------------: | :-- | :-- |
| {py:meth}`~jijmodeling.Problem.Binary` | $\{0, 1\}$ | A binary placeholder taking value $0$ or $1$. | - |
| {py:meth}`~jijmodeling.Problem.Natural` | $\mathbb{N}$ or $\{0, \ldots, N-1\}$ | Natural numbers including zero. Used for array sizes and indices. Specify another natural-valued expression `N` with the `less_than` keyword argument to restrict the range to $\{0, \ldots, N-1\}$. | {py:meth}`~jijmodeling.Problem.Dim`, {py:meth}`~jijmodeling.Problem.Length` |
| {py:meth}`~jijmodeling.Problem.Integer` | $\mathbb{Z}$ | An integer value, including negatives. | - |
| {py:meth}`~jijmodeling.Problem.Float` | $\mathbb{R}$ | A general real-valued floating-point placeholder. | - |
| Tuples of the above | $\mathbb{Z} \times \mathbb{R}$ | Fixed-length tuples with per-component types, often used with lists. | - |

To declare a placeholder, call the method with the same name as one of the types above on a `Problem`.

:::{admonition} Choosing placeholder types
:class: hint

For simple models, it is usually enough to remember just {py:meth}`Natural <jijmodeling.Problem.Natural>` and {py:meth}`Float <jijmodeling.Problem.Float>`.
Keep the following guidelines in mind:

1. Use **natural numbers** for **array sizes and item counts**, declaring them as {py:meth}`Natural <jijmodeling.Problem.Natural>` or aliases like {py:meth}`Dim <jijmodeling.Problem.Dim>` and {py:meth}`Length <jijmodeling.Problem.Length>`.
2. Use {py:meth}`Float <jijmodeling.Problem.Float>`, or a more specific type when needed, for **other numeric values**.
:::

As an example, declare the single placeholders needed for a knapsack problem.
With the Plain API, this can be written as:

```{code-cell} ipython3
import jijmodeling as jm

knapsack_placeholders = jm.Problem("Knapsack (Placeholders only)", sense=jm.ProblemSense.MAXIMIZE)
W = knapsack_placeholders.Float("W", description="Knapsack capacity")
N = knapsack_placeholders.Length("N", description="Number of items")

knapsack_placeholders
```

Here we define a mathematical model with one real-valued placeholder `W` for the capacity and one natural-number placeholder `N` for the number of items.
Placeholders declared this way are represented as instances of {py:class}`~jijmodeling.Placeholder`, which stores their metadata.

```{code-cell} ipython3
W
```

```{code-cell} ipython3
N
```

When a placeholder appears in an expression, it is automatically treated as an expression that refers to the placeholder value.
For example, add $1$ to `W`:

```{code-cell} ipython3
W + 1
```

With the Decorator API, when the placeholder name matches the Python variable name, you can omit the name at declaration time.

(knapsack_placeholders_def)=

```{code-cell} ipython3
@jm.Problem.define("Another Problem with Placeholder")
def knapsack_placeholders(problem: jm.DecoratedProblem):
    W = problem.Float(description="Knapsack capacity")
    N = problem.Length(description="Number of items")


knapsack_placeholders
```

:::{admonition} When you can omit variable names
:class: caution

In the Decorator API, you can omit a variable name only when the declaration has the form `x = problem.Float(...)`, i.e. one variable on the left and one constructor call on the right.
If you declare multiple variables at once, such as `x, y = (problem.Float(), problem.Natural())`, it will raise an error.
:::

:::{admonition} The {py:meth}`~jijmodeling.Problem.Placeholder` constructor
:class: tip

The constructors listed above, such as {py:meth}`problem.Float <jijmodeling.Problem.Float>` and {py:meth}`problem.Natural <jijmodeling.Problem.Natural>`, are special cases of the more general {py:meth}`~jijmodeling.Problem.Placeholder` constructor.
For example, {py:meth}`problem.Natural <jijmodeling.Problem.Natural>` is implemented as shorthand for `problem.Placeholder(dtype=jm.DataType.NATURAL)`.
You can specify the following for `dtype`:

- {py:class}`jm.DataType <jijmodeling.DataType>` variants
- Python built-in type specifiers such as `float` and `int`
- NumPy type specifiers such as `numpy.uint*` and `numpy.int*` (the bit width after `*` is simply ignored)
- Natural-valued expressions, for specifying the type $\{0, \ldots, N-1\}$ of natural numbers **less than** a given natural number `N`
- Category labels
- Tuples of the above

For placeholders with more complex types, such as tuples, use the {py:meth}`Placeholder <jijmodeling.Problem.Placeholder>` constructor to specify the details.
Like the specialized constructors, {py:meth}`Placeholder <jijmodeling.Problem.Placeholder>` also supports name omission in the Decorator API.
:::

## Declaring category labels

As discussed in {doc}`./variables`, a category label is "a set of labels that can be used as dictionary keys, where the concrete candidates are provided at compile time".
Declaring a category label is similar to declaring a placeholder: call {py:meth}`~jijmodeling.Problem.CategoryLabel` on the mathematical model to register it.
With the Plain API, category labels are declared as follows:

```{code-cell} ipython3
import jijmodeling as jm


problem_catlab_plain = jm.Problem("Category Label Only")
L_plain = problem_catlab_plain.CategoryLabel("L", description="Some category label")

problem_catlab_plain
```

As with placeholders, it takes a required name and an optional `description` keyword argument for a human-readable explanation.
With the Decorator API, you can omit the category-label name in the same way as placeholders, although specifying it explicitly is also allowed:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Category Label Only")
def problem_catlab_deco(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel(description="Some category label")


problem_catlab_deco
```

The list of category labels registered on a `Problem` object can be obtained from the {py:attr}`~jijmodeling.Problem.category_labels` property.
You can also obtain an expression for the number of values belonging to an individual category label with {py:func}`jm.count() <jijmodeling.count>` or the {py:meth}`jm.CategoryLabel.count() <jijmodeling.CategoryLabel.count>` method.
In mathematical notation this is rendered as $\#L$.

(ph_cl_info)=
## Retrieving placeholder and category-label information

The list of placeholders registered in a mathematical model can be obtained from the {py:class}`Problem <jijmodeling.Problem>` object's {py:attr}`~jijmodeling.DecoratedProblem.placeholders` property.
This property returns a dictionary keyed by placeholder name, with the corresponding metadata as values.
It also includes information for indexed variables discussed below.
Similarly, category labels can be obtained from the {py:class}`Problem <jijmodeling.Problem>` object's {py:attr}`~jijmodeling.Problem.category_labels` property as a dictionary keyed by category-label name.

```{code-cell} ipython3
import jijmodeling as jm

ph_catlab_problem = jm.Problem("Placeholder and Category Label Info")
N = ph_catlab_problem.Length("N")
L = ph_catlab_problem.CategoryLabel("L", description="Some category label")
A = ph_catlab_problem.Float("A", dict_keys=(N, L))

print(f"Placeholders: {ph_catlab_problem.placeholders}")
print(f"Category Labels: {ph_catlab_problem.category_labels}")
```

The metadata obtained this way is represented by {py:class}`~jijmodeling.Placeholder` objects for placeholders and {py:class}`~jijmodeling.CategoryLabel` objects for category labels, the same objects returned at declaration time.
Therefore, objects contained in these dictionaries can also be used as variable expressions.

(ph_family)=
## Declaring indexed placeholders

This section explains how to declare **indexed placeholders**.
As discussed in {doc}`./variables`, indexed variables can be arrays or dictionaries, so we cover each in turn.

:::{admonition} There are no indexed category labels
:class: note

A category label is a concept for adding a new type that can appear as dictionary keys, and is one abstraction level above a placeholder that specifies a value of a particular type.
For this reason, unlike placeholders, there is no such thing as an "indexed category label".
:::

### Arrays of placeholders

There are two ways to declare arrays of placeholders.

#### Declaring placeholder arrays with `shape`

The recommended way to declare a placeholder array is to use the `shape` keyword argument.
The `shape` keyword argument can take an expression representing a fixed-length tuple of natural numbers.
When the dimension is $1$, it can also be given directly as a natural-valued expression.
Here we partially define a knapsack problem that has not only single placeholders such as $N$ and $W$, but also one-dimensional arrays `v` for item values and `w` for item weights:

(knapsack_placeholders_update)=

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack (Placeholders only, with arrays)", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_placeholders(problem: jm.DecoratedProblem):
    W = problem.Float(description="Knapsack capacity")
    N = problem.Length(description="Number of items")

    # Declare one-dimensional arrays of length N with the shape keyword argument.
    # Because they are one-dimensional, shape=N and shape=(N,) mean the same thing.
    v = problem.Float(description="Value of each item", shape=(N,))
    w = problem.Float(description="Weight of each item", shape=N)


knapsack_placeholders
```

You may also specify **`None` as a component of the `shape` of a placeholder array**.
In that case, the dimension marked with `None` is still required to have a fixed length, but that length is **inferred from the instance data provided at compile time**.
This is useful when you want to define an array whose shape is only partially constrained, as in the following example:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Partially determined shape")
def partial_shape(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = a.len_at(0)
    c = problem.Float(shape=(N, None))
    M = c.len_at(1)
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(a[i] * c[i, j] * x[i, j] for i in N for j in M)

partial_shape
```

#### Declaring arrays by dimension only

Another, less recommended, method uses the **`ndim` keyword argument**.
By passing a natural-number constant literal as the `ndim` keyword argument of a placeholder constructor, you can declare a placeholder array whose dimension is specified, while the concrete length of each axis is determined when instance data is provided at compile time.

:::{admonition} Specifying `shape` and `ndim` together
:class: tip

You can specify `ndim` and `shape` together, but in that case the number of components in `shape` must exactly match the value of `ndim`.
:::

For example, the `knapsack_placeholders` defined above can be written using `ndim` as follows:

(knapsack_placeholders_ndim)=

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (vars only, with ndim)", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_placeholders_ndim(problem: jm.DecoratedProblem):
    W = problem.Float(description="Knapsack capacity")
    v = problem.Float(ndim=1, description="Value of each item")
    N = v.len_at(0)
    w = problem.Float(shape=N, description="Weight of each item")


knapsack_placeholders_ndim
```

The {py:meth}`~jijmodeling.Expression.len_at` method returns the length of the $i$-th axis of the given array.
Since $w$, $v$, and $x$ all have the same length in the full knapsack model, we declare $v$ as a one-dimensional array first and use its length to specify the `shape` of the remaining arrays.

These two approaches define semantically similar models, but they differ in how instance data is provided.
In the first `knapsack_placeholders` example ([definition](#knapsack_placeholders_def) and [update](#knapsack_placeholders_update)), $N$ is also declared as a {py:meth}`Length <jijmodeling.Problem.Length>` placeholder, so when {doc}`generating an instance <./instance_generation>`, you must provide `N` as instance data in addition to `W`, `v`, and `w`.
In [`knapsack_placeholders_ndim`](#knapsack_placeholders_ndim), where $N$ is constructed as an expression using {py:meth}`len_at <jijmodeling.Expression.len_at>` instead of as a placeholder, the value of $N$ is inferred from input `v`, so at compile time you only need to provide values for `W`, `v`, and `w`.

So when should you introduce a length placeholder, and when should you use `ndim` + {py:meth}`len_at <jijmodeling.Expression.len_at>`?
A good rule of thumb is: **if there are dependencies between the lengths of multiple axes in a single array**, then you should define a length placeholder.

As an example, consider defining a distance matrix $d$ of shape $N \times N$:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Distance matrix")
def dist_matrix(problem: jm.DecoratedProblem):
    N = problem.Length()
    d = problem.Float(shape=(N, N))


dist_matrix
```

Here both axes of the two-dimensional array $d$ must have length $N$.
This constraint cannot be expressed with `ndim=2`, so you need to define $N$ and use it in `shape`.

In the older JijModeling 1 series, placeholders supported only `ndim` declarations for a long time, so `knapsack_placeholders_ndim`-style definitions were common:

```python
v = problem.Float(ndim=1, description="Value of each item")
w = problem.Float(ndim=1, description="Weight of each item")
```

However, this does not express the shape relationship between $v$ and $w$.
Therefore, in JijModeling 2 and later, such definitions that **cannot enforce length consistency** are strongly discouraged, and it is **strongly recommended** to specify `shape` somewhere whenever there is a non-trivial relationship between shapes.

:::{admonition} Graphs as arrays of tuples
:class: tip

For example, when `V` is a natural-valued expression representing the number of vertices, `G = problem.Graph(dtype=V)` declares a placeholder corresponding to the edge set of a graph with vertex set $\{0, \ldots, V-1\}$.
This constructor is actually equivalent to a one-dimensional array of tuples, as described in "[Single placeholders](#single_ph)", and can be written as:

```python
G = problem.Placeholder(dtype=(V, V), ndim=1)
```

Therefore, you can obtain the number of edges, counting multiplicities, via `N = G.len_at(0)`, and you can use array operations to work with graphs.
Dictionaries, described below, can also represent graphs with edge labels.
In this way, JijModeling lets you represent complex structures by combining tuples and arrays.
:::

:::{admonition} **Since 2.0.0: Jagged Array is strongly discouraged**
:class: danger

In JijModeling 1, a Jagged Array collection was available for non-uniform shapes.
However, due to that non-uniformity, Jagged Arrays are difficult to validate with type systems and similar checks.
In JijModeling 2, **Jagged Array is strongly discouraged** and planned to be removed in a future release.
You can express graph structures, non-zero-based indices, and sparse structures using combinations of arrays, tuples, and dictionaries, so we strongly recommend migrating away from Jagged Array.
:::

### Dictionaries of placeholders

Placeholder dictionaries are declared by passing the `dict_keys` keyword argument, instead of `shape`, to constructors such as {py:meth}`Float <jijmodeling.Problem.Float>` and {py:meth}`Length <jijmodeling.Problem.Length>`.
To align with decision-variable behavior, if only `dict_keys` is specified, the placeholder dictionary is declared as a `TotalDict`.
If you also pass `partial_dict=True`, it is declared as a `PartialDict`.

When declared as a `TotalDict`, meaning `partial_dict` is omitted or `False`, `dict_keys` can be:

1. A natural-valued expression $n$ without decision variables
2. A Python list of strings
3. A category label defined by {py:meth}`problem.CategoryLabel <jijmodeling.Problem.CategoryLabel>`
4. A tuple composed of (1) to (3)

When declared as a `PartialDict`, the following can be specified:

1. {py:attr}`jm.DataType.INTEGER <jijmodeling.DataType.INTEGER>`, the Python type identifier `int`, or `numpy.int*`, meaning an integer type
2. {py:attr}`jm.DataType.NATURAL <jijmodeling.DataType.NATURAL>` or `numpy.uint*`
3. A natural-valued expression $n$ without decision variables, identified with the set $\mathbb{N}_{<n} = \{0, \ldots, n - 1\}$
4. The Python type identifier `str`
5. A Python list of strings
6. A category label defined by {py:meth}`problem.CategoryLabel <jijmodeling.Problem.CategoryLabel>`
7. A tuple composed of (1) to (6)

You can also declare placeholder dictionaries by calling the {py:meth}`~jijmodeling.Problem.TotalDict` constructor or {py:meth}`~jijmodeling.Problem.PartialDict` constructor on the {py:class}`Problem <jijmodeling.Problem>` object.

:::{admonition} Why there is no `ndim`-like option for placeholder dictionaries
:class: caution

There is no argument corresponding to `ndim` for placeholder arrays.
If only the number of components were provided while omitting the key type, the concrete key type could not be determined without accessing instance data.
:::

The following example declares each item in the knapsack problem as a category label rather than a natural number, and declares the item values and weights as dictionaries over that label:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack with dict placeholders", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_dict(problem: jm.DecoratedProblem):
    W = problem.Float(description="Knapsack capacity")
    L = problem.CategoryLabel(description="Item category label")
    v = problem.Float(description="Value of each item", dict_keys=L)
    w = problem.Float(description="Weight of each item", dict_keys=L)


knapsack_dict
```

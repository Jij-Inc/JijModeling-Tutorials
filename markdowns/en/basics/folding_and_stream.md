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

# Folding and Streams

This chapter explains how to treat the collections introduced in the preceding chapters as **streams** and apply operations such as folding and filtering.
A stream is a sequence of values of a particular type that may contain duplicates. It is similar to what Python calls an **iterator**.
Streams are used when working with indices over a particular range, taking sums or products, and defining indexed constraints.

This chapter also explains logical operations on Boolean values and streams.

```{code-cell} ipython3
import jijmodeling as jm
```

:::{admonition} Renamed from “Set” in JijModeling 2.8.0
:class: note

Up to JijModeling 2.7.1, streams were called “sets,” and the explicit conversion function was named `jm.set`. Mathematically, however, a set is unordered and contains no duplicates, so the term “set” was misleading.
Since version 2.8.0, this concept has consistently been called a stream.
`jm.set` remains available as a deprecated alias for {py:func}`~jijmodeling.stream`, and existing comprehensions in the Decorator API continue to work, but calling it emits a `DeprecationWarning`.
:::

(folding)=
## Folding Streams: Sums, Products, Maximums, Minimums, and More

In JijModeling, operations such as sums and products are implemented as folds that process the elements of a stream in sequence.
The following examples explain the different notations available for sums and products.

:::{note}
For simplicity, the examples below use {py:func}`jm.sum() <jijmodeling.sum>` (or {py:meth}`Expression.sum() <jijmodeling.Expression.sum>`). Products with {py:func}`jm.prod() <jijmodeling.prod>` or {py:func}`Expression.prod() <jijmodeling.Expression.prod>`, and maximums and minimums with {py:func}`jm.max() <jijmodeling.max>` or {py:func}`jm.min() <jijmodeling.min>`, can be written in the same way.
:::

In the Decorator API, sums and products can be written intuitively as {external+python:ref}`comprehensions`.

The following example uses the Decorator API to write the sum of products of decision variables and placeholders:

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def sum_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(a[i] * x[i] for i in N)


sum_example
```

After `in`, you can use any stream obtained by the methods described in the following sections or any value of a type that is implicitly converted to a stream. In this example, the natural number `N` in `for i in N` is the stream being folded.

:::{admonition} Do Not Use Python's Built-in {py:func}`sum` Function
:class: caution

When writing a fold with a Decorator API comprehension, use JijModeling's {py:func}`jm.sum() <jijmodeling.sum>`, {py:func}`jm.prod() <jijmodeling.prod>`, {py:func}`jm.max() <jijmodeling.max>`, or {py:func}`jm.min() <jijmodeling.min>`.
Passing an expression such as `a[i] * x[i] for i in N` to Python's built-in {py:func}`sum` results in an error.
:::

The same program can be written entirely with the Plain API using {py:func}`jijmodeling.map`, which will be explained in a later section:

```{code-cell} ipython3
sum_example_plain = jm.Problem("Sum Example (Plain)")
N = sum_example_plain.Length("N")
a = sum_example_plain.Float("a", shape=(N,))
x = sum_example_plain.BinaryVar("x", shape=(N,))
sum_example_plain += jm.sum(jm.map(lambda i: a[i] * x[i], N))

sum_example_plain
```

For a simple sum like this, you can also pass two arguments to {py:func}`jm.sum() <jijmodeling.sum>`: the domain and a function that returns the term to sum.

```{code-cell} ipython3
sum_example_plain_alt = jm.Problem("Sum Example (Plain, Alt)")
N = sum_example_plain_alt.Length("N")
a = sum_example_plain_alt.Float("a", shape=(N,))
x = sum_example_plain_alt.BinaryVar("x", shape=(N,))
sum_example_plain_alt += jm.sum(N, lambda i: a[i] * x[i])

sum_example_plain_alt
```

:::{important}
Only {py:func}`jm.sum() <jijmodeling.sum>` and {py:func}`jm.prod() <jijmodeling.prod>` support the two-argument folding form; {py:func}`jm.max() <jijmodeling.max>` and {py:func}`jm.min() <jijmodeling.min>` do not.

When using only the Plain API, expressions that traverse indices must be constructed with Python {external+python:ref}`lambda expressions <lambda>`.
:::

:::{tip}
When {py:func}`jm.sum() <jijmodeling.sum>` or {py:func}`jm.prod() <jijmodeling.prod>` is called as a single-argument function or method, it takes the sum or product of a stream. To sum the elements of `x`, you can simply write {py:func}`jm.sum(x) <jijmodeling.sum>` or {py:meth}`x.sum() <jijmodeling.Expression.sum>`. With the limited broadcasting described earlier, the example above can also be written as {py:func}`jm.sum(a * x) <jijmodeling.sum>`. The same applies when `x` is a two- or higher-dimensional array.
:::

Combining these folding functions with `if` clauses in comprehensions allows more flexible folds to be expressed.
For example, the following code sums `a[i] * x[i]` over the even indices in `N`:

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def sum_with_ifs_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(a[i] * x[i] for i in N if i % 2 == 0)


sum_with_ifs_example
```

For more advanced examples, see {doc}`../references/cheat_sheet`.

## Constructing Streams

JijModeling provides various mechanisms and functions for converting values of other types into streams, either explicitly or automatically, and for constructing new streams.

### Automatic Conversion from Existing Types

Values of some types are automatically converted into streams. The following table shows specific examples:

| Expression type | Corresponding stream |
| :-------- | :------- |
| Multidimensional array | A stream that traverses elements in row-major order |
| Dictionary | A stream that traverses the dictionary's values |
| Natural-number expression $N$ containing no decision variables | A stream that traverses $0, 1, \ldots, N-1$ |
| Category label `L` | A stream that traverses all values of `L` supplied at compile time |

### Converting a Multidimensional Array into a Stream of Subarrays with {py:func}`~jijmodeling.rows`

As described above, a multidimensional array is automatically converted into a stream that **traverses each element in row-major order**.
To obtain a stream that instead traverses the inner rows in order, use {py:func}`~jijmodeling.rows`.
More precisely, {py:func}`~jijmodeling.rows` converts a multidimensional array of shape $N \times M_1 \times \cdots \times M_n$ into an array of length $N$ whose elements are subarrays of shape $M_1 \times \ldots \times M_n$. The resulting array is then converted into a stream through the automatic conversion described above.

```{code-cell} ipython3
problem = jm.Problem("Row Sum Example")
N = problem.Length("N")
M = problem.Length("M")
K = problem.Length("K")
x = problem.BinaryVar("x", shape=(N, M, K))
problem.infer(x.rows())
```

:::{admonition} Change from JijModeling 1: Array Traversal
:class: caution

In JijModeling 1, when a multidimensional array appeared in `belong_to=` or `forall=`, its inner rows were traversed in order.
To obtain this behavior, explicitly convert the array with {py:func}`~jijmodeling.rows`, using `jm.rows(A)` or `A.rows()`.
:::

### Obtaining a Stream of Array Indices with {py:meth}`~jijmodeling.Expression.indices`

{py:meth}`~jijmodeling.Expression.indices` returns a stream corresponding to the set of indices—the domain—of an array.

```{code-cell} ipython3
problem = jm.Problem("Index and Keys Example")
S = problem.Float("S", ndim=2)
problem.infer(S.indices())
```

### Explicitly Converting a Dictionary into a Stream

As described above, JijModeling's automatic conversion turns a dictionary expression into a stream over its **values, not its keys**.
This differs from Python's {py:class}`dict`, but is intentional so that dictionaries behave consistently with multidimensional arrays.
For example, if a placeholder or decision variable originally defined as a multidimensional array is changed to a dictionary, code such as {py:meth}`x.sum() <jijmodeling.Expression.sum>` does not need to change.
To obtain a stream that traverses key-value pairs, use {py:meth}`~jijmodeling.Expression.items`; to obtain one that traverses keys, use {py:meth}`~jijmodeling.Expression.keys`.
To make the default conversion to a stream of values explicit, use {py:meth}`~jijmodeling.Expression.values`.

```{code-cell} ipython3
problem = jm.Problem("Row Sum Example")
L = problem.CategoryLabel("L")
N = problem.Length("N")
M = problem.Length("M")
x = problem.TotalDict("x", dict_keys=L, dtype=float)
problem.infer(x.values())
```

```{code-cell} ipython3
problem.infer(x.items())
```

```{code-cell} ipython3
problem.infer(x.keys())
```

The following example defines a dictionary of decision variables with the same domain as a `PartialDict` placeholder:

```{code-cell} ipython3
problem = jm.Problem("Index and Keys Example")
N = problem.Length("N")
L = problem.CategoryLabel("L")
S = problem.PartialDict("S", dtype=float, dict_keys=(N, L))
x = problem.BinaryVar("x", dict_keys=S.keys())
problem
```

### Explicit Conversion to a Stream with {py:func}`~jijmodeling.stream`

Conversion to a stream generally happens automatically, but you can explicitly convert a value with {py:func}`~jijmodeling.stream`.
When using the Decorator API, you can also construct a stream directly by passing a comprehension to {py:func}`jm.stream <jijmodeling.stream>`.
Unlike {py:func}`~jijmodeling.genarray` and {py:func}`~jijmodeling.gendict`, {py:func}`~jijmodeling.stream` supports comprehensions containing any number of `for` and `if` clauses.

```{code-cell} ipython3
@jm.Problem.define("Stream Comprehension Example")
def stream_compr_problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(dict_keys=(L, N))
    display(jm.stream(i + x[l, i] for l in L for i in N if i % 2 == 0))
```

### Generating Arithmetic Progressions with {py:func}`~jijmodeling.range`

Since JijModeling 2.3.1, {py:func}`~jijmodeling.range`, corresponding to Python's built-in {py:class}`range() <range>`, has been available for defining streams of arithmetic progressions of integers.
Like Python's {py:class}`range() <range>`, when given one argument it traverses values starting from $0$; when given two arguments, it starts from the first and stops before the second; and when given a third argument, that value is used as the step.

```{code-cell} ipython3
range_problem = jm.Problem("Stream Range Example")
N = range_problem.Natural("N")

display(jm.range(N))  # 0, 1, ..., N-1
display(jm.range(1, N))  # 1, 2, ..., N-1
display(jm.range(1, N, 2))  # 1, 3, 5, ... (less than N)
```

## Processing Streams

So far, we have seen how to fold and construct streams.
The following sections explain how to transform existing streams and combine multiple streams to construct new ones.

### Filtering Streams

{py:func}`~jijmodeling.filter` constructs a new stream containing only the elements of an existing stream that satisfy a given condition.

```{code-cell} ipython3
filter_problem = jm.Problem("Stream Filter Example")
N = filter_problem.Natural("N")
N.filter(lambda i: i % 2 == 0)
```

### Removing Duplicates from a Stream

As noted above, a stream may contain duplicate values.
When duplicates must be removed, use {py:func}`~jijmodeling.unique`. For each value that appears multiple times, only its first occurrence is retained, producing a stream of unique values.

```{code-cell} ipython3
problem = jm.Problem("Stream Uniquifization Example")
A = problem.Natural("x", ndim=1)
problem += A.unique().sum()  # Treat the array as a stream, remove duplicates, then sum

instance_data = {"x": [1, 3, 1, 2, 2, 1]}
instance = problem.eval(instance_data)
assert instance.objective == 6  # Only 1, 3, and 2 remain, so the sum is 6
```

### Mapping Streams

{py:func}`~jijmodeling.map`, corresponding to the Python standard library's {py:func}`~map`, constructs a new stream from the results of applying a function to the elements of an existing stream.

```{code-cell} ipython3
map_problem = jm.Problem("Stream Map Example")
N = map_problem.Natural("N")
x = map_problem.BinaryVar("x", shape=N)
map_problem += jm.sum(jm.stream(N).map(lambda i: x[i] ** 2))

map_problem
```

:::{admonition} Mapping Arrays and Dictionaries
:class: info

{py:func}`~jijmodeling.map` can also be called directly on arrays and dictionaries. In this case, the result is not a stream but a new array or dictionary with the same shape or key set.
In particular, because {py:func}`map <jijmodeling.map>` preserves shape and key-set information for these types, mapped elements can be accessed with the same indices as the original container.
As noted above, these types are automatically converted into streams, so stream operations behave the same way on a mapped container.
:::

### Flat-Mapping Streams

If the function passed to {py:func}`~jijmodeling.map` returns a stream, the result is a stream of streams.
Use {py:func}`jm.flat_map() <jijmodeling.flat_map>` (or its method form, {py:meth}`Expression.flat_map() <jijmodeling.Expression.flat_map>`) to flatten the mapped result by one level.
This makes it possible to traverse multiple indices without using Decorator API comprehensions.

```{code-cell} ipython3
flat_map_problem = jm.Problem("Stream FlatMap Example")
N = flat_map_problem.Natural("N")
M = flat_map_problem.Natural("M")

# A stream containing (i, 0), (i, 1), ..., (i, M-1) for each i
jm.stream(N).flat_map(lambda i: jm.map(lambda j: (i, j), M))
```

### Cartesian Products of Streams

Use {py:func}`~jijmodeling.product` to take the Cartesian product of multiple streams.

```{code-cell} ipython3
product_problem = jm.Problem("Stream Product Example")
N = product_problem.Natural("N")
M = product_problem.Natural("M")
jm.product(N, M)
```

Semantically, this is equivalent to traversing the elements of multiple streams with successive `for` clauses:

```{code-cell} ipython3
@product_problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.stream((i, j) for i in N for j in M))
```

Where a stream is expected, a tuple can be written directly to represent a Cartesian product, omitting {py:func}`~jijmodeling.product`.
Examples include the right-hand side of `in` in a Decorator API comprehension and the `domain=` keyword argument to {py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>`.

```{code-cell} ipython3
@jm.Problem.define("Tuple Product Example")
def tuple_product_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    Q = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))

    # A tuple represents the Cartesian product instead of jm.product
    problem += jm.sum(Q[i, j] * x[i, j] for (i, j) in (N, M))


tuple_product_example
```

The same applies when passing `domain=` in the Plain API. Each component of the Cartesian product is passed to the `lambda` expression as a separate argument, in order.

```{code-cell} ipython3
tuple_domain_example = jm.Problem("Tuple Domain Example")
N = tuple_domain_example.Length("N")
M = tuple_domain_example.Length("M")
x = tuple_domain_example.BinaryVar("x", shape=(N, M))
tuple_domain_example += tuple_domain_example.Constraint(
    "bound", lambda i, j: x[i, j] <= 1, domain=(N, M)
)

tuple_domain_example
```

### Unions, Intersections, and Differences of Streams

Unions, intersections, and differences of streams can be expressed using Python's bitwise operators and JijModeling's built-in functions.
Specifically, use `|` or {py:func}`jijmodeling.bor` for a union, `&` or {py:func}`jijmodeling.band` for an intersection, and {py:func}`jijmodeling.diff` for a difference.
The following examples examine each operation in turn.

The union of two streams traverses the elements of the first stream in order, followed by the elements of the second stream in order.
The following example sums `x[i]` over the indices in the union of two index sets:

```{code-cell} ipython3
@jm.Problem.define("Stream Union Example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=N)
    target_a = problem.Natural(less_than=N, ndim=1)
    target_b = problem.Natural(less_than=N, ndim=1)

    problem += jm.sum(x[i] for i in jm.stream(target_a) | jm.stream(target_b))


problem
```

```{code-cell} ipython3
import ommx.v1

a_data = [1, 3, 5]
b_data = [7, 3, 4]

instance_data = {"N": 10, "target_a": a_data, "target_b": b_data}
compiler = jm.Compiler.from_problem(problem, instance_data)
xs = [compiler.get_decision_variable_by_name("x", [i]) for i in range(10)]

instance = compiler.eval_problem(problem)

expected = ommx.v1.Function(xs[1] + xs[3] + xs[5] + xs[7] + xs[3] + xs[4])
assert instance.objective.almost_equal(expected)
```

The intersection `A & B` is computed by traversing the elements of the first argument, `A`, in order and retaining only those contained in the second argument, `B`.
In particular, the order and duplicates of elements in `A` are preserved, while the order and number of duplicates in `B` are ignored.
The following example takes a set of indices $A$ and a partially defined dictionary of coefficients $B$, then sums coefficients only over indices defined in both:

```{code-cell} ipython3
@jm.Problem.define("Stream Intersection Example")
def problem(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    A = problem.Placeholder("A", ndim=1, dtype=L)
    B = problem.PartialDict("B", dict_keys=L, dtype=float)
    x = problem.BinaryVar(dict_keys=L)

    problem += jm.sum(B[l] * x[l] for l in jm.stream(A) & B.keys())


problem
```

```{code-cell} ipython3
import ommx.v1

L_data = ["a", "b", "c", "d", "e"]
A_data = ["a", "b", "c", "a"]
B_data = {"e": 1, "c": 10, "d": 100, "a": 1000}

instance_data = {"L": L_data, "A": A_data, "B": B_data}
compiler = jm.Compiler.from_problem(problem, instance_data)
xs = {i: compiler.get_decision_variable_by_name("x", [i]) for i in L_data}

instance = compiler.eval_problem(problem)
expected = ommx.v1.Function(
    B_data["a"] * xs["a"] + B_data["a"] * xs["a"] + B_data["c"] * xs["c"]
)

assert instance.objective.almost_equal(expected)
```

The difference `A.diff(B)` is computed by traversing the elements of the first argument, `A`, in order and retaining only those not contained in the second argument, `B`.
The two operations handle the order and duplicates of each argument identically; only the membership test against `B` is reversed.
The following example modifies the `A & B` intersection example to sum only over indices not contained in $A$.

```{code-cell} ipython3
@jm.Problem.define("Stream Intersection Example")
def problem(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    A = problem.Placeholder("A", ndim=1, dtype=L)
    B = problem.PartialDict("B", dict_keys=L, dtype=float)
    x = problem.BinaryVar(dict_keys=L)

    problem += jm.sum(B[l] * x[l] for l in B.keys().diff(jm.stream(A)))


problem
```

```{code-cell} ipython3
import ommx.v1

L_data = ["a", "b", "c", "d", "e"]
A_data = ["a", "b", "c", "a"]
B_data = {"e": 1, "c": 10, "d": 100, "a": 1000}

instance_data = {"L": L_data, "A": A_data, "B": B_data}
compiler = jm.Compiler.from_problem(problem, instance_data)
xs = {i: compiler.get_decision_variable_by_name("x", [i]) for i in L_data}

instance = compiler.eval_problem(problem)
expected = ommx.v1.Function(B_data["e"] * xs["e"] + B_data["d"] * xs["d"])

assert instance.objective.almost_equal(expected)
```

These logical operations do not guarantee unique elements in the resulting stream. Use the previously described {py:func}`~jijmodeling.unique` function to remove duplicates when necessary.

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

# Arithmetic and Conditional Expressions

In the preceding chapters, we learned about expressions and types in JijModeling and how to declare variables.
We will now look at how to construct more complex expressions, including arithmetic expressions for addition, subtraction, multiplication, and division, as well as conditional expressions involving comparisons.

```{code-cell} ipython3
import jijmodeling as jm
```

## Arithmetic Operations

Python's built-in arithmetic operations (addition, subtraction, multiplication, division, and so on, including {py:meth}`+ <jijmodeling.Expression.__add__>`, {py:meth}`- <jijmodeling.Expression.__sub__>`, {py:meth}`* <jijmodeling.Expression.__mul__>`, {py:meth}`/ <jijmodeling.Expression.__truediv__>`, and {py:meth}`% <jijmodeling.Expression.__mod__>`) can also be used with JijModeling expressions.
Operations between numeric expressions work as expected. Under certain conditions, operations can also be performed between multidimensional arrays and between {py:meth}`TotalDict <jijmodeling.Problem.TotalDict>` objects with identical key sets.
Specifically, arithmetic operations are supported for the following combinations, regardless of operand order:

1. Two scalars
2. A scalar and a multidimensional array
3. A scalar and a dictionary
4. Two multidimensional arrays with the same shape
5. Two total dictionaries ({py:meth}`TotalDict <jijmodeling.Problem.TotalDict>`) with the same key set

:::{admonition} Broadcasting in JijModeling
:class: note

Cases (2) and (3) correspond to **broadcasting**, as seen in NumPy, where a scalar is applied to every element of a collection. Cases (4) and (5), on the other hand, perform operations between corresponding elements.
**NumPy** also supports operations between more general combinations of shapes, such as $(N, M, L)$ and $(M, L)$.
Although such generalized NumPy broadcasting provides concise notation, its intent can often be unclear when the code is revisited later.
For this reason, **JijModeling intentionally limits broadcasting** and supports it **only when the operation is considered unambiguous to everyone**.
:::

This is easier to understand through examples.

```{code-cell} ipython3
problem = jm.Problem("Arithmetic Operations")
x = problem.BinaryVar("x", description="Scalar decision variable")
N = problem.Length("N")
M = problem.Length("M")
y = problem.IntegerVar(
    "y", lower_bound=0, upper_bound=10, shape=(N, M), description="2D array decision variable"
)
z = problem.ContinuousVar(
    "z",
    lower_bound=-1,
    upper_bound=42,
    shape=(N, M, N),
    description="3D array decision variable",
)
S = problem.TotalDict("S", dtype=float, dict_keys=N, description="Scalar total dictionary")
s = problem.ContinuousVar("s", lower_bound=0, upper_bound=10, dict_keys=N)
W = problem.Float("w", shape=(N, M))

problem
```

### Allowed Examples

```{code-cell} ipython3
problem.infer(x + 1)  # OK: addition of two scalars
```

```{code-cell} ipython3
problem.infer(y - x)  # OK: subtraction of a scalar from a multidimensional array
```

```{code-cell} ipython3
problem.infer(S * x)  # OK: multiplication of a dictionary by a scalar
```

```{code-cell} ipython3
problem.infer(y / W)  # OK: division of two arrays with the same shape (N, M)
```

```{code-cell} ipython3
problem.infer(S + s)  # OK: addition of total dictionaries with the same key set
```

### Disallowed Examples

```{code-cell} ipython3
try:
    # ERROR: multiplication of a dictionary and an array
    problem.infer(S * y)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
try:
    # ERROR: operation between arrays with different shapes
    problem.infer(y + z)
except Exception as e:
    print(e)
```

### Alternative Syntax: Constructing Arrays with {py:func}`genarray <jijmodeling.genarray>` or {py:func}`gendict <jijmodeling.gendict>`

In the example above, an operation involving nontrivial broadcasting, such as `y + z`, intentionally results in an error.
In such cases, you can construct the desired array or dictionary by using {py:func}`~jijmodeling.genarray` or {py:func}`~jijmodeling.gendict` and explicitly specifying its shape or key set and the expression for each element:

```{code-cell} ipython3
A = jm.genarray(lambda i, j, k: y[i, j] + z[i, j, k], (N, M, N))
display(A)
problem.infer(A)
```

When using the Decorator API, you can also use a comprehension as follows:

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem):
    A = jm.genarray(y[i, j] + z[i, j, k] for i, j, k in (N, M, N))
    display(A)
    display(problem.infer(A))
```

For details, see the [relevant section](#generators) of {doc}`arrays_and_dicts`.

:::{admonition} Division by Decision Variables
:class: caution

When constructing a model, expressions that may contain decision variables can appear on either side of addition, subtraction, multiplication, and division.
However, compiling an expression in which a decision variable appears on the right-hand side of division—such as `N / x` in the example above—currently results in an error.
The notation itself is allowed because some solvers support division by decision variables through specific encodings, but JijModeling and OMMX do not currently support those encodings.
In the future, JijModeling and OMMX are expected to support specifying such encodings, allowing some of these cases to be compiled into instances.
:::

:::{admonition} Elementary Transcendental Functions
:class: tip

In addition to arithmetic operations, JijModeling expressions support elementary transcendental functions, including trigonometric functions ({py:meth}`~jijmodeling.Expression.sin`, {py:meth}`~jijmodeling.Expression.cos`, and {py:meth}`~jijmodeling.Expression.tan`) and logarithmic functions ({py:meth}`~jijmodeling.Expression.log2`, {py:meth}`~jijmodeling.Expression.log10`, and {py:meth}`~jijmodeling.Expression.ln`).
These functions can be applied to expressions regardless of whether they contain decision variables. Currently, however, compiling an instance results in an error if one of these functions is applied to an expression containing a decision variable.
:::

## Comparison Operations

```{eval-rst}
Equality operators (:py:meth:`== <jijmodeling.Expression.__eq__>` and :py:meth:`\!= <jijmodeling.Expression.__ne__>`) and ordering operators (:py:meth:`< <jijmodeling.Expression.__lt__>`, :py:meth:`<= <jijmodeling.Expression.__le__>`, :py:meth:`> <jijmodeling.Expression.__gt__>`, and :py:meth:`>= <jijmodeling.Expression.__ge__>`) can also be used with JijModeling expressions.
```

If **neither side of a comparison operator contains a decision variable**, the result is inferred as an expression of the Boolean type `Bool`. If at least one side may contain a decision variable, the result is treated as a special **comparison type**. This distinction is necessary because constraint definitions must be able to compare expressions containing decision variables, while comparisons used in comprehensions and similar constructs must evaluate to a definite Boolean value.

Numeric scalars support both equality and ordering comparisons, while category-label values support only `==` and `!=`.
When a comparison operator is applied to arrays or dictionaries, their element types must support the comparison and the same shape or key-set conditions as arithmetic operations must be satisfied.

```{code-cell} ipython3
problem.infer(x == y)  # OK: equality comparison between a scalar and an array
```

```{code-cell} ipython3
problem.infer(N <= N)  # OK: ordering comparison between two scalars
```

```{code-cell} ipython3
problem.infer(y > W)  # OK: comparison between arrays with the same shape
```

## Logical Operations

JijModeling supports logical operations such as conjunction ("and"), disjunction ("or"), and negation ("not").
Because Python's logical operators `and`, `or`, and `not` cannot be overloaded, use the bitwise operators `&` (and), `|` (or), and `~` (not), or the functions {py:func}`jijmodeling.band` (and), {py:func}`jijmodeling.bor` (or), and {py:func}`jijmodeling.bnot` (not).

:::{admonition} Beware of Bitwise Operator Precedence
:class: caution

Unlike `and` and `or`, `&` and `|` have higher precedence than `==` and `!=`. For example, `a == b & c == d` is interpreted as `a == (b & c) == d`.
When using `&` or `|`, always enclose each comparison in parentheses, as in `(a >= b) & (c == d)`.
:::

The following example takes the sum only when `i` is even or `j` is odd:

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(
        a[i, j] * x[i, j] for i in N for j in M if (i % 2 == 0) | (j % 2 == 1)
    )


problem
```

:::{admonition} Example of a More Complex Conditional Expression
:class: hint

For a more realistic and complex conditional expression built with logical operations, see “{external+zept_tutor:doc}`src/30_radio_telescope_scheduling`” in the JijZept Typical Problem Collection.
:::

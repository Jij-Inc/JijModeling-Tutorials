---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.0
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# Mathematical Model Formulation

Based on the explanations in the previous sections, we now describe how to formulate a mathematical model.
Decision variables and placeholders are covered in {doc}`variables`, so here we focus on how to set objectives and constraints.

```{code-cell} ipython3
import jijmodeling as jm
```

:::{tip}
For convenience, we discuss objectives first and then constraints, but in actual code you can update them in any order.
:::

## Setting the objective

When you create a {py:class}`~jijmodeling.Problem`, setting `sense` to {py:attr}`~jijmodeling.ProblemSense.MAXIMIZE` makes it a maximization problem, and setting `sense` to {py:attr}`~jijmodeling.ProblemSense.MINIMIZE` makes it a minimization problem.
Right after a `Problem` is created, the objective is initialized to $0$, and you add terms to it using the {py:meth}`+= <jijmodeling.Problem.__iadd__>` operator on the {py:class}`~jijmodeling.Problem` object.
The {py:class}`~jijmodeling.Problem` object only accepts scalar {py:class}`~jijmodeling.Expression` objects as objective terms.
If you attempt to add array-typed or dictionary-typed expressions, a type error will be raised.

In JijModeling, you can add terms to the objective, but you cannot overwrite or delete the objective once set.
In particular, `+=` adds a new term and does not replace existing terms.
Consider the following example. First, we set the objective with only the term $x$.

```{code-cell} ipython3
problem = jm.Problem("Sample")
x = problem.BinaryVar("x")
problem += x

problem
```

Next, define a new decision variable $y$ and add it to the objective.

```{code-cell} ipython3
y = problem.BinaryVar("y")
problem += y

problem
```

You can see that the existing term was not replaced; instead, $y$ was added and the new objective is $x + y$.
If you might need to remove objective terms later, keep a list of terms in Python and set the objective from that list when needed.

As a more practical example, let's set the objective for the knapsack problem.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack Problem", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    N = problem.Length(description="Number of items")
    x = problem.BinaryVar(shape=(N,), description="$x_i = 1$ if item i is put in the knapsack")
    v = problem.Float(shape=(N,), description="value of each item")
    w = problem.Float(shape=(N,), description="weight of each item")
    W = problem.Float(description="maximum weight capacity of the knapsack")


    # Set the objective by passing an Expression object to the `+=` operator
    problem += jm.sum(v[i] * x[i] for i in N)
    # Alternatively, using broadcasting, the following is equivalent
    # problem += jm.sum(v * x)

knapsack_problem
```

## Setting constraints

Constraints are also added using the {py:meth}`+= <jijmodeling.Problem.__iadd__>` operator.
However, when adding constraints, you add {py:class}`~jijmodeling.Constraint` objects created by {py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>`.
{py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` takes a name and a constraint expression written with `==`, `<=`, or `>=` as its required arguments.

:::{important}
The only comparison operators available when building constraints are `==`, `<=`, and `>=`.
As shown below, operators such as `>` or `<`, or any logical operators, are not supported.

```python
problem.Constraint("BAD1", 1 < x) # ERROR! `>` cannot be used!
problem.Constraint("BAD2", (x + y) <= 1 or (y + z) >= 2) # ERROR! logical operators not allowed!
problem.Constraint("BAD2", (x + y) <= 1 |  (y + z) >= 2) # ERROR! logical operators not allowed!
```

:::

Now let's add a constraint to the knapsack model defined above and complete the model.

```{code-cell} ipython3
@knapsack_problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.placeholders['N']
    w = problem.placeholders['w']
    W = problem.placeholders['W']
    x = problem.decision_vars['x']
    problem += problem.Constraint("weight", jm.sum(w[i] * x[i] for i in N) <= W)

knapsack_problem
```

:::{admonition} Always use `+=` when adding constraints
:class: important

When adding a constraint, always use the {py:meth}`+= <jijmodeling.Problem.__iadd__>` operator.
Simply calling {py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` does not add the constraint to the model.
:::

+++

### Families of constraints

In JijModeling, you can add not only single constraints, but also a collection of constraints as a "family".
There are several ways to do this:

1. Indexed constraints using `domain=` or comprehensions
2. Comparison expressions between arrays

To see these patterns, consider the quadratic formulation of the traveling salesman problem (TSP).
Let $d_{i,j}$ be the distance matrix between cities $i$ and $j$, and let $x_{t,i}$ be a binary variable that is $1$ if city $i$ is visited at time $t$.
Then we can write:

$$
\begin{aligned}
\min & \sum_{i = 0}^{N-1} \sum_{j = 0}^{N-1} d_{i,j} x_{t,i} x_{(t + 1) \bmod N, j}\\
\text{s.t. } & \sum_{i = 0}^{N-1} x_{t,i} = 1 \quad (t = 0, \ldots, N-1)\\
& \sum_{t = 0}^{N-1} x_{t,i} = 1 \quad (i = 0, \ldots, N-1)\\
\end{aligned}
$$

There are two types of constraints here, and each is defined not as a single constraint but as a family indexed by parameters $t$ and $i$.

#### Indexed constraints

To define indexed constraints with the Decorator API, provide the second argument to
{py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` as a list comprehension or generator expression:

```{code-cell} ipython3
@jm.Problem.define("TSP, Decorated", sense=jm.ProblemSense.MINIMIZE)
def tsp_decorated(problem: jm.DecoratedProblem):
    C = problem.CategoryLabel(description="Labels of Cities")
    N = C.count()
    x = problem.BinaryVar(dict_keys=(N, C), description="$x_{t,i} = 1$ if City $i$ is visited at time $t$")
    d = problem.Float(dict_keys=(C, C), description="distance between cities")
    problem += jm.sum(d[i, j] * x[t, i] * x[(t + 1) % N, j] for t in N for i in C for j in C)
    
    # Definition using a list comprehension
    problem += problem.Constraint("one time", [jm.sum(x[t, i] for t in N) == 1 for i in C])
    # Definition using a generator expression
    problem += problem.Constraint("one city", (jm.sum(x[t, i] for i in C) == 1 for t in N))

tsp_decorated
```

With the Plain API only, provide a `lambda` that takes the indexing parameters as the second argument,
and specify the domain using the `domain=` keyword:

```{code-cell} ipython3
tsp_plain = jm.Problem("TSP, Decorated", sense=jm.ProblemSense.MINIMIZE)
C = tsp_plain.CategoryLabel("C", description="Labels of Cities")
N = C.count()
x = tsp_plain.BinaryVar("x", dict_keys=(N, C), description="$x_{t,i} = 1$ if City $i$ is visited at time $t$")
d = tsp_plain.Float("d", dict_keys=(C, C), description="distance between cities")
tsp_plain += jm.sum(jm.product(N, C, C), lambda t, i, j: d[i, j] * x[t, i] * x[(t + 1) % N, j])

# Each city is visited exactly once
tsp_plain += tsp_plain.Constraint("one time", lambda i: jm.sum(N, lambda t: x[t, i]) == 1, domain=C)
# Exactly one city is visited at each time
tsp_plain += tsp_plain.Constraint("one city", lambda t: jm.sum(C, lambda i: x[t, i]) == 1, domain=N)

tsp_plain
```

#### Array-to-array comparisons

Another way to define a family of constraints is to use comparison expressions between arrays or sets.
As mentioned in {doc}`./expressions`, comparison expressions also support broadcasting.
Specifically, the comparison expressions that can be used to construct constraints are those whose left and right sides are one of the following combinations:

1. Set and scalar
2. Arrays of the same shape
3. `TotalDict` objects with the same key set

Using this, we can define the TSP constraints as follows:

```{code-cell} ipython3
@jm.Problem.define("TSP, Decorated", sense=jm.ProblemSense.MINIMIZE)
def tsp_array_comparison(problem: jm.DecoratedProblem):
    N = problem.Natural(description="Number of cities")
    x = problem.BinaryVar(shape=(N, N), description="$x_{t,i} = 1$ if City $i$ is visited at time $t$")
    d = problem.Float(shape=(N, N), description="distance between cities")
    problem += jm.sum(d[i, j] * x[t, i] * x[(t + 1) % N, j] for t in N for i in N for j in N)
    
    # Definitions using set-scalar comparison
    problem += problem.Constraint("one time", x.sum(axis=0) == 1)
    problem += problem.Constraint("one city", x.sum(axis=1) == 1)

tsp_array_comparison
```

Here, giving an `axis=i` argument to {py:meth}`Expression.sum() <jijmodeling.Expression.sum>` or {py:meth}`jm.sum() <jijmodeling.sum>` works the same way as {py:func}`numpy.sum`: rather than a single total sum, it returns an array of sums along that axis.
You can also pass multiple axes as a list.

In the `one city` constraint above, `x.sum(axis=1)` (0-indexed) sums along the second axis, which corresponds to cities, and produces an array representing the number of cities visited at each time.
If you run type inference, you can see that it is a one-dimensional array.

```{code-cell} ipython3
tsp_array_comparison.infer(tsp_array_comparison.decision_vars["x"].sum(axis=1))
```

We then compare this one-dimensional array (the number of cities per time) with the scalar value $1$ to define a constraint family.
The same holds for `one time`.
In this example the comparison is array-to-scalar, but as mentioned earlier, you can also define constraint families by comparing arrays of the same shape.

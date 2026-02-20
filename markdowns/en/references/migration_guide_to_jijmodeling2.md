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

# JijModeling 2 Migration Guide

This guide helps the existing JijModeling 1 users migrate to JijModeling 2. JijModeling 2 introduces significant improvements while maintaining the core mathematical modeling concepts you're familiar with.

:::{admonition} Want to keep using JijModeling 1.x?
:class: important

If you keep using JijModeling 1, you can continue to use your existing code assets without changes. In that case, pin the version in pip or uv as follows:

```bash
pip install 'jijmodeling <2' # with pip
uv add jijmodeling<2         # with uv
```

The JijModeling 1 documentation remains available at:

https://jij-inc-jijmodeling-tutorials-en.readthedocs-hosted.com/en/jijmodeling1

However, **JijModeling 1 is already in maintenance mode**: updates beyond critical bug fixes are not planned, and **updates are expected to stop within a few months after the official 2.0.0 release**.
For these reasons, we **strongly recommend migrating to JijModeling 2** in the mid to long term.
:::

## Overview of Major Changes

JijModeling 2 introduces several key changes that improve usability and safety:

1. **Removal of `Element` nodes**: The old `Element` class has been replaced with Python generator / comprehension or lambda-based binding, providing more flexible and natural iteration patterns.

2. **Decision variables and placeholders must be created on Problem instances**: You can no longer call `jm.BinaryVar()`, `jm.IntegerVar()`, etc. directly. All decision variables now live in a Problem namespace and must be created through a `Problem` instance using `problem.BinaryVar()`, `problem.IntegerVar()`, `problem.Placeholder`, etc.

3. **Decorator API**: JijModeling 2 comes with two flavors of APIs: Plain API and Decorator API.
   - Plain API provides the notation similar to JijModeling 1.
   - Decorator API is built on top of Plain API, and they can be mixed freely.
   - With Decorator API, you can
       * use Python comprehension syntax for sums, products, and constraint families;
       * elide (omit) the symbol names of decision variables / placeholders (their Python variable names are used automatically).

4. **Compiler replaces Interpreter**: The `Interpreter` class has been replaced with `Compiler` and provides additional helper methods.

5. **Dedicated Static Type System**: JijModeling 2 introduces an internal type system that validates expressions and operator compatibility *at Problem / Constraint construction time and during compilation*. Type mismatches (e.g. mixing incompatible numeric / index types, invalid jagged indexing) are detected early with informative errors.

6. **Typed Placeholder Constructors (Recommended)**: Prefer constructors specialized to specific types over the generic `problem.Placeholder` whenever possible.
   - Currently, we have the following special constructors:
      * Natural numbers: `problem.Natural()` (particularly useful when used as array length, dimension, index, etc.),
        + You can use `problem.Length` and/or `problem.Dim` to indicate that they are array length/dimension (equivalent to `Natural`).
      * $0$ or $1$: `problem.Binary()`,
      * Integer: `problem.Integer`, and,
      * Real: `problem.Float()`.
   - They produce clearer intent, tighter static type checking, and better error messages. Use `Placeholder` only for advanced cases (tuple / custom `dtype`s).

7. **Introduction of Dependent Variables**: The newly introduced `problem.DependentVar(..)` declaration allows you to bind and reuse frequently appearing sub-expressions as dependent variables. This resolves the issue in traditional JijModeling where definitions of variables in LaTeX (defined with `with_latex()` or `latex=...`) were unclear.

8. **New Datatypes**: JijModeling 2 now shipped with dictionary and category label types!
   - Many cases formerly written using jagged arrays can now be written more simply with dictionaries!
      * Jagged arrays are notoriously error-prone, so we strongly recommend adopting dictionaries in the long term.
   - Category labels can be used as a non-contiguous or non-zero-origin labels of entities.

9.  **Supports Python >=3.11 Only**: We are using the modern language features (type hints and callstacks) of Python >=3.11 to improve user experience.

10. **Removed Dataset loader**: Since JijModeling 1.14.0, `jijmodeling.dataset` and related dataset loading feature like `load_qplib` has been removed. Use the corresponding features in OMMX.

**Recommendation**: For new code, we recommend using the **Decorator API** and **typed constructors**.

+++

### What's Missing in Current Version?

<div class="alert alert-block alert-info">
<b>Note:</b> This section lists the features that are not available in the current JijModeling 2.
</div>

Here is the list of features currently missing in JijModeling 2 that existed in JijModeling 1:

1. Complex AST traversal API
2. Random Instance Generation

These changes are planned after the official release of JijModeling 2:

1. Evaluation mechanism on dependent variables and encoding feature of dependent variable information into OMMX

These features are planned to be implemented gradually after the official release of JijModeling 2.

+++

### Reading Guide

In the next section [Example: Quadratic TSP in JijModeling 2](#example-quadratic-tsp-in-jijmodeling-2), we briefly illustrate the feel of JijModeling 2 through a TSP example.

After that section, you can proceed in one of two ways:

- If you want more examples without deep diving into the design details, skip to [JijModeling 2 (Decorator API) by Examples](#jijmodeling-2-decorator-api-by-examples), and read the intermediate sections as needed.
- If you want to understand the design philosophy and fine-grained changes first, continue to [Design Goals of JijModeling 2 - Why JijModeling 2?](#design-goals-of-jijmodeling-2-why-jijmodeling-2).

+++

(example-quadratic-tsp-in-jijmodeling-2)=
## Example: Quadratic TSP in JijModeling 2

Before diving into the details, let's see an example of quadratic TSP formulated in JijModeling 2 to grasp the intuition.

```{code-cell} ipython3
import jijmodeling as jm
import numpy as np

# JijModeling 2 with Decorator API
@jm.Problem.define("TSP", sense=jm.ProblemSense.MINIMIZE)
def tsp_problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    d = problem.Float(shape=(N, N), description="Distance matrix")
    x = problem.BinaryVar(shape=(N,N), description="$x_{i,t}$ is 1 if node $i$ is visited at time $t$")

    problem += problem.Constraint(
        "one-city",
        [jm.sum(x[i, t] for i in N) == 1 for t in N],
        description="Exactly one city is visited at each time step"
    )
    problem += problem.Constraint(
        "one-time",
        [jm.sum(x[i, t] for t in N) == 1 for i in N],
        description="Each city is visited exactly once"
    )
    
    problem += jm.sum(
        d[i, j] * x[i, t] * x[j, (t + 1) % N]
        for i in N for j in N for t in N
    )

tsp_problem
```

Let's compile this into OMMX instance with random data!

```{code-cell} ipython3
num_cities = 5
np.random.seed(42)
xs = np.random.rand(num_cities)
ys = np.random.rand(num_cities)
XX, XX_T = np.meshgrid(xs, xs)
YY, YY_T = np.meshgrid(ys, ys)
dist = np.sqrt((XX- XX_T)**2 + (YY-YY_T)**2)
instance_data = {"N": num_cities, "d": dist}

instance = tsp_problem.eval(instance_data)
instance.constraints_df
```

```{code-cell} ipython3
instance.objective
```

`tsp_problem.eval` is a shorthand of the following:

```{code-cell} ipython3
compiler = jm.Compiler.from_problem(tsp_problem, instance_data)
instance_2 = compiler.eval_problem(tsp_problem)
assert instance.objective.almost_equal(instance_2.objective)
assert all(instance.constraints[i].function.almost_equal(instance_2.constraints[i].function) for i in range(5))
```

... and now you can solve as before via [OMMX Adapters](https://jij-inc.github.io/ommx/en/user_guide/supported_ommx_adapters.html)!

+++

(design-goals-of-jijmodeling-2-why-jijmodeling-2)=
## Design Goals of JijModeling 2 - Why JijModeling 2?

JijModeling 2 is motivated by the following design goals:

- Introduces namespace: every parameter (decision variables, placeholders) belongs to an explicit `Problem`, and metadata of parameters are stored in Problem, not expression nodes.
- Make iteration & binding Pythonic: replace `Element` nodes with standard generator / comprehension syntax or raw lambda expressions.
- Reduce boilerplate: implicit (elided) names minimize repetition.
- Strengthen safety: a dedicated static type system validates expression structure (numeric kinds, comparison, jagged / tuple consistency, axis lengths) at construction & compilation time.
- Explicit compilation stage: `Compiler` makes evaluation & downstream tooling (IDs, diagnostics) consistent.
- Provide dual APIs: a high-level Decorator API (ergonomic) over a Plain API (precise / compositional).

## Major Difference Highlights

In this section, we will discuss the details of major difference in JijModeling 2.

### Conceptual Changes from JijModeling 1 and their Purposes

The semantics of some entities are changed in JijModeling 2, including:

- Decision variable / placeholder constructors (module-level) → Problem-bound factory (`problem.BinaryVar`, etc.).
- `Element` (index) → `Set`s (a stream of values) + iterator (`(f(i) for i in N if ...)`) or `lambda`-expressions.
- `jm.sum(Element, expr)` / `forall=` argument → Comprehension `jm.sum(expr for i in N if cond)` / constraint collection.
- `Interpreter` → `Compiler` (plus convenience `problem.eval(data)` path).
- 2D array as an edge set → Placeholders with tuple elements or `.rows()` helper.

To summarize:

| Category | Purpose | Typical Constructors | Notes |
|----------|---------|----------------------|-------|
| Problem  | Namespace / model root | `jm.Problem(name, sense=...)` | Owns every symbol & constraint. |
| Placeholders | Parameter multi-dimensional arrays (given at evaluation) | `problem.Placeholder(...)`, `problem.Natural(...)`, `problem.Float(...)` | Names can be elided with `@problem.update` or `@jm.Problem.define`; `Natural` is a typed shortcut. |
| Decision Vars | Optimization variables | `problem.BinaryVar`, `problem.IntegerVar`, `problem.FloatVar`, etc. | Must be constructed in Problem |
| Expressions | Syntax Tree | algebraic operations, `jm.sum()`、`.sum()`、`.prod()` | In JijModeling 2, expressions can have types other than scalars, and will be typechecked. |
| Sets | Iterable symbolic domains | placeholder itself (`for i in N`), `jm.product(A,B)`, `jm.filter(...)` | Used with lambdas or comprehensions, replaces `Element` objects. |
| Constraints | Comparison expressions over domains | `problem.Constraint(name, expr)` or family of expressions | Parametrized family of constraints can be expressed using comprehension or `domain` keyword args. |
| Compiler | evaluator | `Compiler.from_problem(problem, data)` | Compiler that converts optimization problems into OMMX messages/ |
| Instance | problem instance | `problem.eval(instance_data)` | OMMX Instance |

### Both Prefix and Method Styles are Provided

For convenience, most functions on expressions (such as `sum`, `prod`, `map`, `log2`) can be used both in method and prefix styles.
For example, `x.sum()` and `jm.sum(x)` (or `z.log2()` and `jm.log2(z)`) are interchangeable.

### Sets and Lambdas / Comprehensions instead of Elements

In JijModeling 1, users had to declare an `Element` belonging to a set (range / collection), which complicates the coding especially when treating higher-order multi-dimensional arrays.
Instead, JijModeling 2 removes `Element` node and introduces first-class `Set`s and provides an API to range over Sets using lambda expressions and/or Pythonic comprehension syntax.

Concretely, the following can be treated as a set:

- Natural number expressions (without decision variables): Natural number $N$ (and hence Length and Dim) is identified with set $\left\{0, \ldots, N-1\right\}$.
- Arrays: Arrays of any dimension can be treated as a set consisting of each component.
  - ⚠️ This is a breaking change! Formerly, $(N+1)$-dimensional array is regarded as a set of $N$-dimensional arrays. If you need this behavior, first use `array.rows()` (or `jm.rows(array)`) to convert an $(N+1)$-D array into 1D array of $N$-D arrays.
- Tuple of set-like values: `(L, R)` is interpreted as the cartesian product ($L \times R$) of $L$ and $R$ as sets.

These expressions are implicitly treated as Sets when appearing in positions that expect a Set (e.g. the iterable argument of `jm.sum` / `jm.prod`).
You can also convert expressions into a Set explicitly by calling `jm.set(expr)`.

<div class="alert alert-block alert-warning">
<b>WARNING:</b> Always use <code>jm.sum</code>, not Python's built-in <code>sum</code>, when reducing symbolic expressions. The built-in <code>sum</code> iterates concrete values and will error or yield unintended objects.
</div>

#### Component-wise lower/upper bounds

If you previously manipulated `Element` indices just to assign component-wise bounds to decision variables, JijModeling 2 lets you do that with the Set-based API plus the constructor arguments on `Problem.*Var`. There are two supported ways to supply bounds:

- **Pass containers that have the same shape**: When a decision variable is an $n$-dimensional array (declared via `shape`), you can pass an expression that evaluates to a multi-dimensional array with exactly the same shape to `lower_bound` / `upper_bound`. The same idea applies to dictionary variables (declared via `dict_keys`): provide a dictionary over the full key set and the bounds will be matched element-wise.
- **Provide lambdas from indices to values**: You can also pass functions like `lambda i, j: L[i, j] - U[j, i]` that accepts the subscript(s) and return the bound. The old `Element`-based recipes translate directly into plain Python functions.

Below is an example rewritten from an `Element`-based bound specification to the new API:

```python
# Before (JijModeling 1)
L = jm.Placeholder("L", ndim=2)
N = L.len_at(0)
M = L.len_at(1)
U = jm.Placeholder("U", shape=N)
i = jm.Element("i", N)
x = jm.IntegerVar(
    "x",
    shape=(N, M),
    lower_bound=lambda i, j: L[i, j],
    upper_bound=lambda i, j: U[i],
)
y = jm.IntegerVar(
    "y",
    shape=(N,),
    lower_bound=-5,
    upper_bound=lambda i: U[(i - 1) % N],
)
```

```python
# After (JijModeling 2)
N = problem.Natural("N")
M = problem.Natural("M")
L = problem.Float("L", shape=(N, M))
U = problem.Float("U", shape=N)
x = problem.IntegerVar(
    "x",
    shape=(N, M),
    lower_bound=L,                  # same-shape array for bounds
    upper_bound=lambda i, j: U[i],  # lambda over indices
)
y = problem.IntegerVar(
    "y",
    shape=N,
    lower_bound=-5,                 # Constant bounds are as-is
    upper_bound=U.roll(1),          # reuse array ops instead of Elements
)
```

In this way, component-wise bounds no longer require `Element`; stay entirely within the problem-bound constructors.

### Parametrized Family of Constraints

In JijModeling 1, users can create a parametrized family of constraints with `jm.Constraint(name, body, forall=i)` where i is an `Element` belonging to some set.
In JijModeling 2, you can either supply a **single comparison expression** (one constraint) or a **list / generator of comparison expressions** (a quantified collection):

```python
problem.Constraint("cap", [C[a] <= N for a in A])
```

You can use generator expressions (i.e. use `()` instead of `[]`) as well:

```python
problem.Constraint("cap", (C[a] <= N for a in A))
```

These are only available in Decorator API. If you want to stick to Plain API for some reason, it can be written with lambdas + `domain=` keyword argument:

```python
problem.Constraint("cap", lambda a: C[a] <= N, domain=A)
```

All these three forms are equivalent.

These styles are useful when expressing a complex constraint. But for this kind of simple constraint, we can use a simple comparison expression:

```python
problem.Constraint("cap", C <= N)
```

When you use a comparison expression as a body of `Constraint` constructor, it must obey the following rules:

- Comparison operator must be one of `==`, `<=` or `>=`.
- The comparison must be between either of:
  - Scalars,
  - Array-like structure and scalars, or
  - Arrays of exactly the same shapes.

### Available Decorator API

Currently, the Decorator API exposes two decorators: `@problem.update` and `@jm.Problem.define`.
Both decorate functions that accept a `DecoratedProblem`, and you can use the exact same Decorator API syntax inside either function.
Keep the following in mind:

- `@jm.Problem.define(name, ...)` creates a new `Problem` via the Decorator API.
  - `@jm.Problem.define(..)` takes the same arguments as the `Problem` constructor, constructs a `Problem`, and binds it to a Python variable with the same name as the decorated function.
- `@problem.update` updates an already-defined optimization problem `problem` via the Decorator API.
  - The decorated function executes immediately at definition time and mutates the original `problem`, so you never call the function manually. The name of the decorated function doesn't affect the result.
  - You can apply `@problem.update` to the same `problem` multiple times. Each invocation appends the parameters, objectives, and constraints defined in that block.
- Both decorators ignore the return value of the decorated function.

Each `@problem.update` / `@jm.Problem.define` block runs in its own function scope, so Python variables defined in one block aren't visible to the others. Consider:

```python
@jm.Problem.define("My Problem")
def my_problem(my_problem: jm.DecoratedProblem):
    N = my_problem.Length()
    x = my_problem.BinaryVar(shape=(N,))

@my_problem.update
def _update(my_problem: jm.DecoratedProblem):
    # ❗️ N and x are out of scope!
```

In this case, variables `N` and `x` (as Python locals) are out of scope in `_update`.
However, the metadata of `N` and `x` are still registered to `my_problem`, so you can retrieve them via the `Problem.placeholders` or `Problem.decision_vars` attributes:

```python
@my_problem.update
def _update(my_problem: jm.DecoratedProblem):
    N = my_problem.placeholders["N"]
    x = my_problem.decision_vars["x"]

    # ... code using N and x ...
```

This scoping is admittedly inconvenient, so we're planning to add helper interfaces for easier variable access. Stay tuned!

### Variable Name Elision in Decorator API

When you use the decorator API and don't give a name as an argument, JijModeling automatically uses the Python variable name as the symbol's name.
For example, `N = problem.Natural()` is the same as the old way: `N = problem.Natural("N")`.
If you clearly specify a name (for example: `N = problem.Natural("number_of_items")`), the system uses the string `"number_of_items"` that you provided, rather than the Python variable name N.

### Critical Change: Decision Variables on Problem Instances

In JijModeling 2, you **CANNOT** create decision variables directly from the module anymore.

**JijModeling 1 (OLD - NO LONGER WORKS):**

```python
# ❌ This will fail in JijModeling 2 - Calling module-level constructors!
N = jm.Placeholder(dtype=jm.DataType.NATURAL)
x = jm.BinaryVar("x", shape=(N,))
y = jm.IntegerVar("y", lower_bound=0, upper_bound=10)
```

**JijModeling 2 (REQUIRED):**

```python
# ✅ All decision variables must be created through Problem instances
problem = jm.Problem("MyProblem")
N = problem.Length() # Shorthand for problem.Placeholder(dtype=jm.DataType.NATURAL)
x = problem.BinaryVar("x", shape=(N,))
y = problem.IntegerVar("y", lower_bound=0, upper_bound=10)
```

This change ensures proper namespace management.
Metadata of placeholders and decision variables can be accessed via `Problem.placeholders` and `Problem.decision_vars`.

### Changes in Exceptions

JijModeling 2 has almost the same exception hierarchy, but uses some Python-native Exceptions when appropriate.

Here is the comparison table for exceptions in JijModeling 1 vs 2:

| JijModeling 2 (New) | JijModeling 1 (Legacy) | Notes |
|--------------|-----------|---------------|
| `jm.ModelingError` | `jm.ModelingError` | Exceptions raised by invalid expressions in model formulation. |
| `jm.CompileError` | `jm.InterpreterError` | Exceptions thrown while evaluation |
| `jm.TypeError` | N/A | Exception thrown on expressions with invalid types. NOTE: different from Python's built-in `TypeError`. |

### Dataset Loading Feature is Removed

Since JijModeling 1.14.0, dataset loading feature is removed from JijModeling.
Please use the corresponding feature in OMMX.

For migration to OMMX, see the following OMMX official documentations:

- [Downloading a MIPLIB Instance](https://jij-inc.github.io/ommx/en/tutorial/download_miplib_instance.html)
- [Downloading a QPLIB Instance](https://jij-inc.github.io/ommx/en/tutorial/download_qplib_instance.html)

(jijmodeling-2-decorator-api-by-examples)=
## JijModeling 2 (Decorator API) by Examples

In this section, we will compare the various patterns in JijModeling 2 with JijModeling 1 to get the intuition of the changes introduced in JijModeling 2.

### Basic Patterns

#### Pattern 1: Simple Summation

**JijModeling 1:**

```python
import jijmodeling as jm

N = jm.Placeholder("N") # ❌ - Placeholders cannot be constructed directly and you MUST specify dtype!
x = jm.BinaryVar("x", shape=(N,)) # ❌ - Same applies for decision vars.
i = jm.Element("i", belong_to=(0, N)) # ❌ - Further, there is no longer `Element` node!
objective = jm.sum(i, x[i]) # ❌ Element is no more!
```

**JijModeling 2 (Decorator API):**

```{code-cell} ipython3
# ✅ First create the Problem via the decorator.
@jm.Problem.define("SimpleSum", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    # ✅ Placeholders are constructed via already created `problem` instance.
    # Here, variable name `N` is elided thanks to the decorator API.
    N = problem.Length()
    # Equivalently:
    # N = problem.Natural()
    # or:
    # N = problem.Placeholder(dtype=jm.DataType.NATURAL)

    # Same applies for decision vars.
    # Of course, you can explicitly specify variable names even with Decorator API.
    x = problem.BinaryVar("x", shape=(N,))
    
    # Comprehension syntax - much cleaner!
    objective = jm.sum(x[i] for i in N)
    # Alternatively:
    # objective = x.sum()  # or jm.sum(x)
    problem += objective

problem
```

#### Pattern 2: Weighted Sum with Coefficients

**JijModeling 1:**

```python
N = jm.Placeholder("N")             # ❌ Direct construction of placeholder.
a = jm.Placeholder("a", ndim=1)     # ❌ Direct construction of placeholder.
x = jm.BinaryVar("x", shape=(N,))   # ❌ Direct construction of decision variable.
i = jm.Element("i", belong_to=(N,)) # ❌ Element node is no more!
objective = jm.sum(i, a[i] * x[i])
```

**JijModeling 2 (Decorator API):**

```{code-cell} ipython3
# You can also define the Problem first and then apply @problem.update.
problem = jm.Problem("WeightedSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    # ✅ Placeholder is constructed via `problem`, and the type is clear.
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))

    objective = jm.sum(a[i] * x[i] for i in N)
    # Alternatively (elementwise):
    # objective = jm.sum(a * x)
    problem += objective

problem
```

#### Pattern 3: Sum Along Index Sets

**JijModeling 1:**

```python
N = jm.Placeholder("N")           # ❌ Direct construction of placeholder.
C = jm.Placeholder("C", ndim=1)   # ❌ Direct construction of placeholder.
x = jm.BinaryVar("x", shape=(N,)) # ❌ Direct construction of decision variable.
i = jm.Element("i", belong_to=C)  # ❌ Element is no more.
objective = jm.sum(i, x[i])
```

**JijModeling 2 (Decorator API):**

```{code-cell} ipython3
@jm.Problem.define("SumAlongSet", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    C = problem.Natural(shape=(N,))  # Explicit dtype for index sets.
    x = problem.BinaryVar(shape=(N,))
    
    # Sum over index set.
    objective = jm.sum(x[i] for i in C)
    # Or Plain API style:
    # jm.sum(C.map(lambda i: x[i]))
    problem += objective

problem
```

#### Pattern 4: Edge Sets Using Tuples

**JijModeling 1:**

```python
V = jm.Placeholder("V") # ❌ Direct construction of placeholder.
E = jm.Placeholder("E", ndim=2) # ❌ Direct construction of placeholder.
x = jm.BinaryVar("x", shape=(V,))  # ❌ Direct construction of decision variable.
e = jm.Element("e", belong_to=E) # ❌ Element is no more.
objective = jm.sum(e, x[e[0]] * x[e[1]]) # ❌ Element is no more.
```

**JijModeling 2 (Decorator API):**

There are several ways of doing this.
One solution is to use a (1-dimensional) array of tuples:

```{code-cell} ipython3
from typing import Tuple

problem = jm.Problem("EdgeSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    V = problem.Natural() # Number of vertices
    # Method 1: Using tuple types for cleaner edge representation.
    E = problem.Graph()
    # Equivalently:
    # E = problem.Placeholder(dtype=Tuple[np.uint, np.uint], ndim=1)
    # By default, Graph requires vertices to be natural numbers,
    # but you can specify them with `vertex` keyword argument:
    # E = problem.Graph(vertex=jm.DataType.FLOAT) # Graph with vertices labelled with floating-point numbers.
    x = problem.BinaryVar(shape=(V,))
    
    # Tuple unpacking in comprehension.
    objective = jm.sum(x[i] * x[j] for (i, j) in E)
    problem += objective

problem
```

Alternatively, you can also use $(N \times 2)$-D array in combination with `rows()`:

```{code-cell} ipython3
# Alternative method using .rows()
@jm.Problem.define("EdgeSumRows", sense=jm.ProblemSense.MINIMIZE)
def problem2(problem: jm.DecoratedProblem):
    V = problem.Placeholder(dtype=np.uint)
    N = problem.Length()
    E = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(N, 2))
    x = problem.BinaryVar(shape=(V,))
    
    # Using .rows() for 2D edge representation.
    objective = jm.sum(x[l] * x[r] for (l, r) in E.rows())
    problem += objective

problem2
```

#### Pattern 5: Conditional Sums

**JijModeling 1:**

```python
N = jm.Placeholder("N")
J = jm.Placeholder("J", ndim=2)
x = jm.BinaryVar("x", shape=(N,))
i = jm.Element("i", belong_to=(0, N))
j = jm.Element("j", belong_to=(0, N))

# ❌ Conditions on the LHS are no longer supported!
objective = jm.sum([i, (j, i > j)], J[i,j] * x[i] * x[j])
```

**JijModeling 2 (Decorator API):**

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    J = problem.Placeholder(dtype=jm.DataType.FLOAT, shape=(N, N))
    x = problem.BinaryVar(shape=(N,))
    
    # ✅ Natural iteration with condition - much more readable!
    objective = jm.sum(J[i, j] * x[i] * x[j] for i in N for j in N if i > j)
    problem += objective

problem
```

Alternatively, leveraging that a natural expression `i` iterates over `0..i-1`:

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    J = problem.Placeholder(dtype=jm.DataType.FLOAT, shape=(N, N))
    x = problem.BinaryVar(shape=(N,))
    
    # ✅ Natural iteration with condition - much more readable!
    objective = jm.sum(J[i, j] * x[i] * x[j] for i in N for j in i)
    problem += objective

problem
```

#### Pattern 6: Expressing Sparse Data with Dictionaries and Category Labels

```{code-cell} ipython3
problem = jm.Problem("QuadraticKnapsackLogistics", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    # Define opaque "Category Labels" representing labels of parcels and trucks;
    # they are treated as a set of integers or strings.
    I = problem.CategoryLabel("I", description="The labels of parcels")
    J = problem.CategoryLabel(description="The labels of trucks")

    # By default the compiler expects values to be defined for every key in that domain.
    weights = problem.Integer(
        "w", dict_keys=I, description="The weight of each parcel"
    )
    base_revenues = problem.Integer(
        "r", dict_keys=I, description="The base revenue of each parcel"
    )
    capacities = problem.Integer(
        "C", dict_keys=J, description="The capacity of each truck"
    )

    # Setting `partial_dict=True` allows the dictionary to be defined only on a subset of keys.
    # Here `s` is defined only on the parcel pairs that actually have a synergy bonus.
    synergy_bonuses = problem.Integer(
        "s",
        dict_keys=(I, I),
        partial_dict=True,
        description="The synergy bonus between pairs of parcels",
    )

    # Alternatively, using the syntactic sugar:
    # synergy_bonus = problem.PartialDict(
    #     "s",
    #     dtype=int,
    #     keys=(I, I),
    #     description="The synergy bonus between pairs of parcels",
    # )

    # --- 4. Decision Variables ---
    # The number of decision variables has to be determined statically from placeholders,
    # so dictionaries of decision variables must be defined on the entire key domain (total).
    x = problem.BinaryVar(
        dict_keys=(I, J),
        description="x[i,j] = 1 if parcel i is assigned to truck j, else 0",
    )

    # --- 5. Objective Function ---
    problem += jm.sum(
        synergy_bonuses[i, k] * x[i, j] * x[k, j]
        for j in J
        # Use keys() to iterate over keys,
        # items() key-value-pairs,
        # values() or plain dictionary for values.
        for (i, k) in synergy_bonuses.keys()
    ) + jm.sum(base_revenues[i] * x[i, j] for i in I for j in J)

    # --- 6. Constraints ---
    problem += problem.Constraint(
        "parcel_assign", [jm.sum(x[i, j] for j in J) == 1 for i in I]
    )
    problem += problem.Constraint(
        "truck_capacity",
        [jm.sum(weights[i] * x[i, j] for i in I) <= capacities[j] for j in J],
    )

problem
```

```{code-cell} ipython3
synergies_data = {
    (1, 3): 25,
    (2, 5): 30,
    (2, 6): 20,
    (4, 8): 40,
    (5, 7): 22,
}
percels_data = [1, 2, 3, 4, 5, 6, 7, 8]
trucks_data = ["Truck A", "Truck B", "Truck C"]
r_data = {1: 50, 2: 75, 3: 40, 4: 80, 5: 60, 6: 65, 7: 35, 8: 90}
weight_data = {1: 35, 2: 45, 3: 25, 4: 50, 5: 30, 6: 40, 7: 20, 8: 55}
capacity_data = {"Truck A": 100, "Truck B": 120, "Truck C": 80}
data = {
    "I": percels_data,
    "J": trucks_data,
    "w": weight_data,
    "r": r_data,
    "C": capacity_data,
    "s": synergies_data,
}
compiler = jm.Compiler.from_problem(problem, data)
instance = compiler.eval_problem(problem)
```

### Constraint Patterns

Constraints in JijModeling 2 follow similar comprehension patterns:

#### One-hot Constraint

**JijModeling 1:**

```python
N = jm.Length("N")
x = jm.BinaryVar("x", shape=(N,))
i = jm.Element("i", belong_to=(0, N))
constraint = jm.Constraint("onehot", jm.sum(i, x[i]) == 1)
```

**JijModeling 2 (Decorator API):**

```{code-cell} ipython3
problem = jm.Problem("OneHot", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=(N,))

    # Clean constraint syntax.
    problem += problem.Constraint("onehot", jm.sum(x) == 1)

problem
```

#### K-hot Constraints over Sets

**JijModeling 1:**

```python
K = jm.Placeholder("K", ndim=1)
C = jm.Placeholder("C", ndim=2)
x = jm.BinaryVar("x", shape=(N,))
a = jm.Element("a", belong_to=(0, M))
i = jm.Element("i", belong_to=C[a])
constraint = jm.Constraint("k-hot", jm.sum(i, x[i]) == K[a], forall=a)
```

**JijModeling 2 (Decorator API):**

```{code-cell} ipython3
problem = jm.Problem("KHotOverSet", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    C = problem.Natural(jagged=True, ndim=2)
    M = problem.DependentVar(C.len_at(0))
    K = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(M,))
    x = problem.BinaryVar(shape=(N,))
    
    # Generator expression for constraints over sets.
    constraint = problem.Constraint(
        "k-hot_constraint", 
        [jm.sum(x[i] for i in C[a]) == K[a] for a in M]
    )
    problem += constraint

problem
```

Or equivalently:

```python
    constraint = problem.Constraint(
        "k-hot_constraint", 
    lambda a: jm.sum(x[i] for i in C[a]) == K[a],
        domain=M,
    )
```

### Compiler Migration

The `Interpreter` class has been replaced with `Compiler` in JijModeling 2, providing additional utility methods.

**JijModeling 1:**

```python
# JijModeling 1 pattern
interp = jm.Interpreter(problem)
instance = interp.eval_problem(data)
```

**JijModeling 2:**

```{code-cell} ipython3
# Create a simple problem for demonstration
problem = jm.Problem("CompilerDemo", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    v = problem.Placeholder(dtype=jm.DataType.FLOAT, ndim=1)
    w = problem.Placeholder(dtype=jm.DataType.FLOAT, ndim=1)
    N = problem.DependentVar(v.len_at(0))
    W = problem.Float()
    x = problem.BinaryVar(shape=(N,))
    
    problem += (v * x).sum()  # objective
    problem += problem.Constraint("weight", (w * x).sum() <= W)

display(problem)

# Sample data
instance_data = {
    "v": [10, 13, 18, 31, 7, 15],
    "w": [11, 15, 20, 35, 10, 33], 
    "W": 47
}

# Method 1: Direct evaluation (simple)
instance = problem.eval(instance_data)

# Method 2: Using Compiler (more control)
compiler = jm.Compiler.from_problem(problem, instance_data)
instance2 = compiler.eval_problem(problem)

print("Both methods produce equivalent results:", 
      instance2.objective.almost_equal(instance.objective))

# Compiler provides additional utility methods
constraint_ids = compiler.get_constraint_id_by_name("weight")
print(f"Constraint IDs for 'weight': {constraint_ids}")
```

## Migration Checklist

Follow this step-by-step checklist to migrate your JijModeling 1 code:

### Step 0: Migrate to Python >=3.11

- ✅ Make sure you are using Python >=3.11, modifying your `pyproject.toml` and/or `.python-version` and install newer interpreter if needed.

### Step 1: Update Imports and Problem Creation

- ✅ Import remains the same: `import jijmodeling as jm`
- ✅ Create problem: `problem = jm.Problem(name, sense)`
- ✅ Add a decorator (`@problem.update`, or `@jm.Problem.define` when creating a new problem) to your model definition function

### Step 2: **CRITICAL** - Replace Direct Variable / Placeholder Creation

Replace every direct module-level constructor with its Problem-bound equivalent:

- Decision variables:
    - e.g. ❌ `x = jm.BinaryVar("x", shape=(N,))` → ✅ `x = problem.BinaryVar("x", shape=(N,))`
- Placeholders (prefer typed):
    - ❌ `N = jm.Placeholder("N", dtype=jm.DataType.NATURAL)` → ✅ `N = problem.Natural("N")` or `N = problem.Length()`.
    - ❌ `a = jm.Placeholder("a", ndim=1)` → ✅ `a = problem.Float("a", shape=(N,))` (adjust shape as needed)
    - With Decorator API, you can also elide variable names.

### Step 3: Replace Element Usage

- ❌ **Remove**: `i = jm.Element("i", belong_to=(0, N))`
- ❌ **Replace**: `jm.sum(i, expression)`
  - ✅ **with**: `jm.sum(expression for i in N)`
  - ✅ **or with**: `jm.sum(N, lambda i: expression)`

### Step 4: Prefer Typed Placeholder Constructors

- ❌ **Generic (avoid)**: `N = problem.Placeholder(dtype=jm.DataType.NATURAL)` / `a = problem.Placeholder(ndim=1)`
- ✅ **Preferred (recommended)**: `N = problem.Length()` / `a = problem.Float(ndim=1)` / `W = problem.Float()` / `K = problem.Integer()` / `G = problem.Graph()`
- ▶︎ Use `Placeholder` only with explicit `dtype` argument.

### Step 5: Update Constraint Syntax

- ❌ **Old**: `jm.Constraint("name", expression, forall=element)`
- ✅ **New**: `problem.Constraint("name", (expression for element in domain))`, `problem.Constraint("name", [expression for element in domain])`, or `problem.Constraint("name", lambda element: expression, domain=domain)`.
  - Generator expression (`(exp for i in t)`) and list comprehension (`[exp for i in t]`) are equivalent; pick the one that best matches surrounding code.

### Step 6: Replace Interpreter with Compiler

- ❌ **Old**: `interp = jm.Interpreter(data)`
- ✅ **New**: `compiler = jm.Compiler.from_problem(problem, data)`
- ✅ **Or simple**: `instance = problem.eval(data)`

### Step 7: Test and Validate

- ✅ Verify that your problem compiles without errors (type system will report mismatches early)
- ✅ Test with sample data to ensure correct behavior
- ✅ Compare results with your JijModeling 1 implementation if available

## Common Pitfalls and Solutions

### Pitfall 1: Using Direct Variable Creation (Most Common Error!)

```python
# ❌ Wrong - will fail with AttributeError
x = jm.BinaryVar("x", shape=(N,))
y = jm.IntegerVar("y", lower_bound=0, upper_bound=10)

# ✅ Correct - create through Problem instance
problem = jm.Problem("MyProblem")
x = problem.BinaryVar("x", shape=(N,))
y = problem.IntegerVar("y", lower_bound=0, upper_bound=10)
```

### Pitfall 2: Not Using Typed Constructors

```python
# ❌ Generic placeholder defaults to Float, which can lead to unexpected typing.
a = problem.Placeholder(ndim=1)
# ✅ Typed constructor clarifies the intent, providing type-checker more accurate information.
a = problem.Float(ndim=1)
```

Typically, you will encounter the error if you failed to specify `dtype` for generic `Placeholder` for natural numbers.
Common mistake pattern:

```python
N = problem.Placeholder("N")            # ❗️ N is assumed to be float!
x = problem.BinaryVar("x", shape=(N,))  # ❌ shape must be a tuple of _natural numbers_!
```

This will result in the following error:

~~~text
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
jijmodeling.TypeError: Traceback (most recent last):
    while checking if expression `N' has type `natural',
        defined at File "<stdin>", line 1, col 5-38

Type Error: Could not match actual type `float' with expected `natural'
~~~

You can fix this situation by using `N = problem.Length("N")` instead of generic `Placeholder`.

### Pitfall 3: Forgetting the Decorator

```python
# ❌ Wrong - missing decorator
def define_model(problem: jm.DecoratedProblem):
    N = problem.Length()

# ✅ Correct
@problem.update
def define_model(problem: jm.DecoratedProblem):
    N = problem.Length()
```

### Pitfall 4: Incorrect Comprehension Syntax

```python
# ❌ Wrong - trying to use old Element syntax
i = jm.Element("i", belong_to=N)
jm.sum((i,), x[i])

# ✅ Correct
jm.sum(x[i] for i in N)
```

### Pitfall 5: `'... object is not iterable'` due to missing decorator or wrong `sum`

If you see something like the following error:

```bash
TypeError: 'jijmodeling.Placeholder' object is not iterable
```

In many cases, this occurs when:

1. You use comprehension syntax (e.g. `jm.sum(x[i] for i in N)` or `problem.Constraint("MyConstraint", [x[i] <= w[i] * v[i - 1] for i in N])`) OUTSIDE the decorators (e.g. `@problem.update` or `@jm.Problem.define`), or
2. You call Python's built-in `sum` instead of `jm.sum`.

### Pitfall 6: Using Python's built-in `sum`

```python
# ❌ Wrong
sum(a[i] * x[i] for i in N)           # built-in sum: will try to iterate symbolic terms

# ✅ Correct
jm.sum(a[i] * x[i] for i in N)
```

Always use `jm.sum` (or the method form `expr.sum()`). The built-in `sum` expects concrete iterables and either raises `TypeError` or produces unintended intermediate objects.

## Common Migration Cheat Sheet

The following table summarizes the common patterns in migration:

| Pattern Name | Legacy (JM1) | Replace (JM2) |
|--------------|-----------|---------------|
| Variable creation | `jm.BinaryVar("x", shape=...)` | `problem.BinaryVar("x", shape=...)` |
| Element for range | `i = jm.Element("i", belong_to=(0,N))` | `for i in N` in generator / comprehension |
| Sum | `jm.sum(i, expr)` | `jm.sum(expr for i in Domain)` or `x.sum()` |
| Conditional domain | `jm.sum([i,(j,cond)], expr)` | `jm.sum(expr for i in A for j in B if cond)` |
| Quantified constraint | `jm.Constraint(name, body, forall=a)` | `problem.Constraint(name, [body_for_a for a in A])` |
| Interpreter | `jm.Interpreter(problem)` | `jm.Compiler.from_problem(problem, data)` or `problem.eval(data)` |

## Best Practices

1. **Always create variables through Problem instances** – Mandatory in JijModeling 2
2. **Use typed placeholder constructors (`Natural`, `Float`, `Integer`, …)** – Improves readability & diagnostics
3. **Reserve generic `Placeholder` for advanced cases** – Only for compound `dtype`s such as tuples.
   - You can use specialized constructor synonym such as `Length` or `Dim`.
4. **Prefer Decorator API** – Cleaner and more maintainable
5. **Leverage name elision** – Let the system infer variable names when possible
6. **Use comprehensions with conditions** – Native Python semantics aid readability
7. **Use tuple types for edges in Graph** – Results in cleaner code and math output in Jupyter Notebook
   - There is `Problem.Graph` smart constructor for it.
8. **Use `problem.eval()` for simple cases** – Use `Compiler` for introspection or advanced workflows
9. **Use dictionaries instead of jagged arrays** – Jagged arrays tend to hide shape mismatches, so prefer dictionaries whenever possible

## Summary

JijModeling 2 represents a significant improvement in usability while maintaining the mathematical modeling power you expect. The key benefits of migration include:

- **More Pythonic-syntax, e.g. comprehensions**, can be used to define complex mathematical model.
- **Reduced boilerplate** through decorators and name elision
- **Early error detection** via the static type system and typed constructors
- **Better namespace management** with Problem-bound variables
- **Additional helper methods** with the new Compiler architecture

**Remember**: The most critical change is the removal of `Element` nodes and that all decision variables must now be created through Problem instances. Combine the Decorator API with typed constructors for the clearest, safest models, and migrate your existing JijModeling 1 code following the patterns and checklist provided in this guide.

+++

## Appendix: Advanced - Understanding the Plain API

The Decorator API is syntactic sugar around the Plain API, which uses lambda expressions instead of the old `Element` system. Understanding this helps when you need more control or when debugging.

As mentioned above, Decorator API is built on top of Plain API.
More precisely, program written using Decorator API will be *transformed* (or *desugared*) into an equivalent program that uses Plain API only under the hood.
Thus, the Decorator and Plain APIs have exactly the same expressive power—but the Decorator API yields more readable, idiomatic Python syntax.

The translation from Decorator API to Plain API does roughly the following:

- If there are any direct binding of decision variable or placeholder to a single variable *without* name, pass the Python variable name as the variable name.
- If a list or generator comprehension appears in any of the following positions, it is desugared with `jm.flat_map`, `jm.map`, and `jm.filter`:
  - The only argument to `jm.sum` or `jm.prod` (but not built-in Python `sum` function), or
  - The second argument of `problem.Constraint` without `domain` keyword argument, where `problem` is the first `DecoratedProblem` argument of decorated function.

### Lambda Expression Patterns

Here's the example desugaring result between decorator and plain APIs.

**Decorator API:**

```{code-cell} ipython3
@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length() # Synonym for problem.Natural(), but more clear intent
    x = problem.BinaryVar(shape=(N,N))
    problem += jm.sum(x[i, j] for i in N if i % 2 == 0 for j in i)

problem
```

**Plain API Equivalent:**

```{code-cell} ipython3
problem = jm.Problem("My Problem")
N = problem.Length("N")
x = problem.BinaryVar("x", shape=(N,N))
problem += jm.sum(
    N.filter(lambda i: i % 2 == 0).flat_map(lambda i: i.map(lambda j: x[i,j]))
    )

problem
```

### When to Use Plain API vs Decorator API

**Use Decorator API when:**

- Writing new code (recommended default)
- You want clean, readable Python-like syntax
- Using comprehensions and conditions

**Use Plain API when:** generally, you don't have to. You can still use Plain API when you encounter bugs in Decorator API.

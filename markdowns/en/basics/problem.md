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

# Declaring a mathematical model

In JijModeling, variables, constraints, and other elements are always registered and tied to a specific mathematical model.
Before we dive into the individual elements, this chapter briefly explains how to declare a model.

## Creating a {py:class}`Problem <jijmodeling.Problem>` object that represents a model

In JijModeling, a specific model is represented by a {py:class}`~jijmodeling.Problem` object, which you typically declare first when constructing a model.
First, import the JijModeling library under the name `jm`.

```{code-cell} ipython3
import jijmodeling as jm
```

### Creating a `Problem` object with the Plain API

There are two ways to create a {py:class}`Problem <jijmodeling.Problem>`: with the **Plain API** and with the **Decorator API**.
The first way is to directly construct a {py:class}`Problem <jijmodeling.Problem>` object using the Plain API.

```{code-cell} ipython3
plain_problem = jm.Problem(
    "Empty Problem",
    sense=jm.ProblemSense.MAXIMIZE,
    description="A mathematical model with no objective or constraints, for demonstration",
)
```

The first argument is required and specifies the name of the model. The remaining keyword arguments, `sense` and `description`, are both optional.
`sense` specifies whether the model is a maximization problem ({py:attr}`jm.ProblemSense.MAXIMIZE <jijmodeling.ProblemSense.MAXIMIZE>`) or a minimization problem ({py:attr}`jm.ProblemSense.MINIMIZE <jijmodeling.ProblemSense.MINIMIZE>`); if omitted, it defaults to minimization.
`description` is a human-readable description of the purpose of model, used in LaTeX output or OMMX metadata.
You can display the object to check such metadata within Jupyter:

```{code-cell} ipython3
plain_problem
```

Since no objective has been set yet, $0$ is shown as the objective at this stage.

:::{admonition} Writing mathematical notation in `description`
:class: important

In mathematical displays such as Jupyter Notebook output, `description` is interpreted as a normal string.
Therefore, when you write mathematical notation inside `description`, enclose the mathematical part in `$..$`.
For example, writing `description="when x_i = 1, ..."` makes `_` invalid as a LaTeX string, so write `description="when $x_i = 1$, ..."` to have it treated as mathematics.

This note also applies to `description` values on objects other than `Problem`.
:::

### Creating a `Problem` object with the Decorator API

Here is the same model defined with the Decorator API using {py:meth}`@jm.Problem.define() <jijmodeling.Problem.define>`:

```{code-cell} ipython3
@jm.Problem.define(
    "Empty Problem",
    sense=jm.ProblemSense.MAXIMIZE,
    description="A mathematical model with no objective or constraints, for demonstration",
)
def deco_problem(problem: jm.DecoratedProblem):
    pass  # do nothing


deco_problem
```

{py:meth}`@jm.Problem.define() <jijmodeling.Problem.define>` takes the same arguments as {py:class}`jm.Problem() <jijmodeling.Problem>`, but instead of binding directly to a variable, it decorates a function definition (here, `def deco_problem(...)`).
With {py:meth}`@jm.Problem.define() <jijmodeling.Problem.define>`, when the function definition ends, the actual {py:class}`Problem <jijmodeling.Problem>` instance is bound to a variable with the same name as the function (here, `deco_problem`).
In the example above, after the function definition, we can print-out `deco_problem` to check its definition.
A function definition preceded by an expression starting with `@` is called a **decorated** function.
Inside such a decorated function, you will call various methods on the first argument `problem` to update the model.

:::{admonition} What Is a {py:class}`DecoratedProblem <jijmodeling.DecoratedProblem>` Object?
:class: caution

Note that the first argument of a decorated function is **not** a {py:class}`Problem <jijmodeling.Problem>` object but a **{py:class}`DecoratedProblem <jijmodeling.DecoratedProblem>` object**.
{py:class}`DecoratedProblem <jijmodeling.DecoratedProblem>` is a dummy {py:class}`Problem <jijmodeling.Problem>` class that only appears inside decorated functions.
{py:class}`DecoratedProblem <jijmodeling.DecoratedProblem>` is provided with type hints tailored to the Decorator API, so you can benefit from editor completion and type checking.
:::

As we haven't made any updates on the problem, this style may look a bit verbose.
However, inside a function decorated by {py:meth}`@jm.Problem.define() <jijmodeling.Problem.define>`, you can use natural and intuitive Decorator API syntax, such as omitting variable names or using comprehensions for sums and products, which becomes very convenient in the model definitions shown in the following chapters.

Also, you can treat models defined with either API in the same way, so you never need to care which API was used.
In fact, both `plain_problem` and `deco_problem` above are identified as the same model as {py:class}`Problem <jijmodeling.Problem>` objects:

```{code-cell} ipython3
jm.is_same(plain_problem, deco_problem)
```

## Updating a {py:class}`Problem <jijmodeling.Problem>` object

We created almost empty `Problem` objects above, but in practice you update the {py:class}`Problem <jijmodeling.Problem>` incrementally as you build a model, adding decision variables, constraints, and objectives to the model.
Regardless of how a model is defined, you can always update it with the Plain API, and you can also update an existing {py:class}`Problem <jijmodeling.Problem>` object `problem` using the Decorator API via the {py:meth}`@problem.update <jijmodeling.Problem.update>` decorator.
You can also mix the two styles freely.
Let's add variables to the two problems we defined earlier.

```{code-cell} ipython3
# Update the previously Plain API-defined `plain_problem` using the Decorator API:
@plain_problem.update
def _(problem: jm.DecoratedProblem):
    # Define a new binary decision variable `x` and add it to the objective.
    x = problem.BinaryVar()  # Name can be omitted if it matches the Python variable.
    problem += x


# Now add another binary decision variable `y` using the Plain API.
y = plain_problem.BinaryVar("y")  # Plain API requires the name.
plain_problem += y
plain_problem
```

```{code-cell} ipython3
# Conversely, update a Decorator API-defined `deco_problem` using only the Plain API.
x = deco_problem.BinaryVar("x")
y = deco_problem.BinaryVar("y")
deco_problem += x + y

deco_problem
```

We use `_` as the function name in the {py:meth}`@problem.update <jijmodeling.Problem.update>` example -- the function name has no effect on the result, so you can choose any name you like.

(update_parameters)=
### Variable rebinding in the Decorator API

Python variables defined inside functions decorated with {py:meth}`@jm.Problem.define() <jijmodeling.Problem.define>` or {py:meth}`@problem.update <jijmodeling.Problem.update>` cannot be accessed directly from outside the function.
More precisely, while the model-level variables and constraints are registered in the corresponding {py:class}`Problem <jijmodeling.Problem>` object, the Python variables that refer to them stay inside the function scope.

To make such cases easy to handle, since JijModeling 2.7.0, the second and subsequent arguments of a {py:meth}`~jijmodeling.Problem.update` function can bind variables already defined in the {py:class}`~jijmodeling.Problem`, including placeholders, category labels, decision variables, and named expressions.
Starting with the second argument, declare arguments with the same names as the items you want to obtain and use the corresponding type annotations below.

| Item to obtain | Type annotation |
| :-- | :-- |
| Placeholder | {py:class}`jm.Placeholder <jijmodeling.Placeholder>` |
| Category label | {py:class}`jm.CategoryLabel <jijmodeling.CategoryLabel>` |
| Decision variable | {py:class}`jm.DecisionVar <jijmodeling.DecisionVar>` |
| Named expression | {py:class}`jm.NamedExpr <jijmodeling.NamedExpr>` |

Each argument name must match the name passed as the first argument to the corresponding constructor.
If the name was omitted through the Decorator API, it matches the Python variable name.
When type annotations are omitted, the appropriate variables are still matched by name, but specifying annotations is recommended whenever possible because it enables more precise type checking and editor completion.

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Updated Problem")
def updated_problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(shape=N)
    total = problem.NamedExpr(x.sum())

@updated_problem.update
def _(
    problem: jm.DecoratedProblem,
    N: jm.Placeholder,
    total: jm.NamedExpr,
):
    problem += problem.Constraint("select", total <= N)
```

As this example shows, the additional arguments to {py:meth}`@problem.update <jijmodeling.Problem.update>` need only include the variables required by that update, rather than every variable defined in the Problem.

If you are using a version earlier than 2.7.0, you can achieve the same result by retrieving items directly from metadata such as {py:attr}`placeholders <jijmodeling.Problem.placeholders>` held by the {py:class}`Problem <jijmodeling.Problem>` and binding them manually as described in the following chapters.

:::{tip}
At this point the benefits of the Decorator API may not be obvious, but they will become clear as you go through the following chapters.
:::

Now, let's move on to the concrete features you need to build models in the next chapter.

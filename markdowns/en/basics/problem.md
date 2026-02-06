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

# Declaring a mathematical model

In JijModeling, variables, constraints, and other elements are always registered and tied to a specific mathematical model.
Before we dive into the individual elements, this section briefly explains how to declare a model.

## Creating a `Problem` object that represents a model

In JijModeling, a specific model is represented by a {py:class}`~jijmodeling.Problem` object, which you typically declare first when constructing a model.
First, import the JijModeling library under the name `jm`.

```{code-cell} ipython3
import jijmodeling as jm
```

### Creating a `Problem` object with the Plain API

There are two ways to create a `Problem`: with the **Plain API** and with the **Decorator API**.
The first way is to directly construct a `Problem` object using the Plain API.

```{code-cell} ipython3
plain_problem = jm.Problem(
    "Empty Problem",
    sense=jm.ProblemSense.MAXIMIZE,
    description="An optimization problem with no objective or constraints, for demonstration",
)
```

The first argument is required and specifies the name of the model. The remaining keyword arguments, `sense` and `description`, are both optional.
`sense` specifies whether the model is a maximization problem (`jm.ProblemSense.MAXIMIZE`) or a minimization problem (`jm.ProblemSense.MINIMIZE`); if omitted, it defaults to minimization.
`description` is a human-readable description of the purpose of model, used in LaTeX output or OMMX metadata.
You can display the object to check such metadata within Jupyter:

```{code-cell} ipython3
plain_problem
```

Since no objective has been set yet, $0$ is shown as the objective at this stage.

### Creating a `Problem` object with the Decorator API

Here is the same model defined with the Decorator API using {py:meth}`@jm.Problem.define() <jijmodeling.Problem.define>`:

```{code-cell} ipython3
@jm.Problem.define(
    "Empty Problem",
    sense=jm.ProblemSense.MAXIMIZE,
    description="An optimization problem with no objective or constraints, for demonstration",
)
def deco_problem(problem: jm.DecoratedProblem):
    pass  # do nothing


deco_problem
```

`@jm.Problem.define()` takes the same arguments as `jm.Problem()`, but instead of binding directly to a variable, it decorates a function definition (here, `def deco_problem(...)`).
With `@jm.Problem.define`, when the function definition ends, the actual `Problem` instance is bound to a variable with the same name as the function (here, `deco_problem`).
In the example above, after the function definition, we can print-out `deco_problem` to check its definition.
A function definition preceded by an expression starting with `@` is called a **decorated** function.
Inside such a decorated function, you will call various methods on the first argument `problem` to update the model.

:::{admonition} What is a `DecoratedProblem` object?
:class: caution

Note that the first argument of a decorated function is **not** a `Problem` object but a **`DecoratedProblem` object**.
`DecoratedProblem` is a dummy class that only appears inside decorated functions.
It is provided with type hints tailored to the Decorator API, so you can benefit from editor completion and type checking.
:::

As we haven't made any updates on the problem, this style may look a bit verbose.
However, inside a function decorated by `@jm.Problem.define`, you can use natural and intuitive Decorator API syntax, such as omitting variable names or using comprehensions for sums and products, which becomes very convenient in real model definitions.

Also, you can treat models defined with either API in the same way, so you never need to care which API was used.
In fact, both `plain_problem` and `deco_problem` above are identified as the same model:

```{code-cell} ipython3
jm.is_same(plain_problem, deco_problem)
```

## Updating a `Problem` object

We created almost empty `Problem` objects above, but in practice you update the `Problem` incrementally as you build a model, adding decision variables, constraints, and objectives to the model.
Regardless of how a model is defined, you can always update it with the Plain API, and you can also update an existing `Problem` object `problem` using the Decorator API via the {py:meth}`@problem.update <jijmodeling.Problem.update>` decorator.
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

We use `_` as the function name in the `@problem.update` example -- the function name has no effect on the result, so you can choose any name you like.

:::{admonition} Decorated functions and variable scope
:class: caution

Python variables defined inside functions decorated with `@jm.Problem.define()` or `@problem.update` cannot be accessed outside the function.
More precisely, while the model-level variables and constraints are registered in the corresponding `Problem` object, the Python variables that refer to them stay inside the function scope.

Therefore, when you update a model incrementally with `@jm.Problem.define()` and multiple `@problem.update` decorators, keep in mind that you must retrieve previously declared items from the `Problem`'s metadata as described in later sections.
:::

Now, let's move on to the concrete features you need to build models in the next sections.

:::{tip}
At this point the benefits of the Decorator API may not be obvious, but they will become clear as you go through the following sections.
:::

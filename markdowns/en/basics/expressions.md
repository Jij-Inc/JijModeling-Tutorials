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

# JijModeling Expressions and Types

In JijModeling, models are described by combining **expressions**, and expressions are classified into several kinds, or **types**.
In addition to Python type hints, JijModeling provides its own more detailed type checker, which can detect common modeling mistakes during construction.
The following chapters explain how to construct individual expressions in detail. As preparation, this chapter provides a brief overview of expressions and types in JijModeling.

:::{tip}
We focus on basic common patterns here. For a complete list of expressions, see the API reference for the {py:class}`~jijmodeling.Expression` class and top-level functions in the {py:mod}`~jijmodeling` module.

The {doc}`Cheat Sheet <../references/cheat_sheet>` also provides more complex examples, so it is worth checking after reading this chapter.
:::

```{code-cell} ipython3
import jijmodeling as jm
```

## What is an expression?

JijModeling separates mathematical model definitions from input data to achieve various features and efficiency.
As a result, modeling in JijModeling does not embed input data directly into a mathematical model. Instead, you first build a "program that becomes a concrete mathematical model only after input data is given", then provide input data later and compile it into a specific mathematical model—an instance.
JijModeling calls this "program" an **expression**.

More precisely, JijModeling expressions do not store concrete computation results, but keep an abstract syntax tree (AST) built by connecting decision variables, placeholders, constants, and other elements through operations.
Consider the following example:

```{code-cell} ipython3
:label: test-problem

@jm.Problem.define("Test Problem")
def ast_examples(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar()
    y = problem.IntegerVar(lower_bound=0, upper_bound=42, shape=(N,))

    z = x + y[0]
    w = jm.sum(y[i] for i in N)
    display(repr(z))
    display(repr(w))
```

:::{figure} ./images/expressions-and-ast.svg
:alt: Python variables can bind arbitrary expressions and variables. Expressions are represented as syntax trees with operators as nodes and constants or parameters as leaves.
:width: 100%
:name: expression-as-an-ast

Decision variables, placeholders, and syntax trees bound to Python variables
:::

{numref}`Figure %s <expression-as-an-ast>` visualizes the definition of `Test Problem`.
Decision variables and placeholders in the model such as $x, y, N$ correspond to Python variables `x`, `y`, `N`.
This illustrates an ambiguity: when we say "variable", it can mean either a parameter in the model or a Python variable that temporarily binds it.
Expressions like `z = x + y[0]` and `w = jm.sum(y[i] for i in N)` are represented as symbolic ASTs that reference these variables.
In this way, a JijModeling expression combines individual components such as constants, placeholders, and decision variables through various operations.

:::{admonition} Function calls and method calls are equivalent for expressions
:class: tip

For an {py:class}`~jijmodeling.Expression` object `A`, unary operations can be written as prefix function calls like `jm.log(A)` or as postfix method calls like `A.log()`.
Both construct exactly the same expression, so use whichever you prefer. The same applies to {py:class}`~jijmodeling.DecisionVar` and {py:class}`~jijmodeling.Placeholder`.
However, Python builtin numbers do not support method calls, so for such cases you must use function calls like `jm.log(2)`.
:::

## Types of expressions in JijModeling

In JijModeling, expressions are classified by **type** and validated as needed.
You can use JijModeling without understanding the type system in detail.
Still, it is useful to know how the type checks are performed when you formulate models.
This chapter gives a brief overview.

JijModeling actually performs type checks in two stages:

1. Editor assistance and static checking via Python type hints
2. A built-in type checker in JijModeling during model construction

(1) is bundled as Python code in the library and enables editor completion and static checks with tools like `Pyright`, `ty`, and `pyrefly`.
However, Python type hints cannot express all constraints (for example, validating array index sizes).
To compensate, JijModeling includes (2), its own more expressive type checker.

The checker in (2) is not invoked directly by users. It is called when you add constraints or objective terms, declare `shape` for decision variables/placeholders, and so on, and it automatically validates modeling mistakes before any data is provided.
Python type hints distinguish API objects such as {py:class}`Expression <jijmodeling.Expression>`, {py:class}`~jijmodeling.Placeholder`, and {py:class}`~jijmodeling.DecisionVar`.
They cannot, however, fully represent detailed information such as an expression's shape or dictionary key set, or whether it contains decision variables. JijModeling's built-in type checker checks this information as well.
In other words, editor and Jupyter Notebook checks based on Python type hints are relatively coarse, while finer checks happen during model construction.

There are several expression types in JijModeling; representative ones are listed below:

| Kind | Notation (example) | Textual example | Description |
| :--- | :----------------- | :------------- | :--- |
| Numeric types | $\mathbb{N}, \mathbb{Z}, \mathbb{R}$ | `natural`, `int`, `float` | Natural numbers, integers, real-valued scalars, and related numeric types. |
| Category label types | $L$ | `CategoryLabel("L")` | Sets of labels provided later by users. |
| Higher-dimensional array types | $\mathrm{Array}[N_1, \ldots, N_k; A]$ | `Array[N1, ..., Nk; A]` | Multidimensional arrays of shape $N_1 \times \cdots \times N_k$ with elements of type `A`. |
| Dictionary types | $\mathrm{TotalDict}[K; V]$ / $\mathrm{PartialDict}[K; V]$ | `TotalDict[K; V]`, `PartialDict[K; V]` | Dictionaries with key set $K$ and value type $V$. |
| Tuple types | $T \times U$ | `Tuple[int, float]` | Fixed-length tuples with per-component types. |

With these in mind, let's look at operations that commonly appear in modeling.

:::{admonition} When errors are raised
:class: important

JijModeling's built-in type checking is performed **not right after an expression is created**, but at the following times:

1. When a term is added to a problem's objective
2. When a constraint is declared via {py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>`
3. When it appears in `ndim`, `shape`, or `dict_keys`
4. When compiling to an instance via {py:meth}`Problem.eval() <jijmodeling.Problem.eval>` or {py:class}`~jijmodeling.Compiler`
5. When type inference is explicitly triggered via {py:meth}`Problem.infer() <jijmodeling.Problem.infer>`

This is because expression types are determined only when placed in context.
So even if an expression is "invalid", it does not necessarily throw an error at construction time.
:::

Below, we use {py:meth}`Problem.infer() <jijmodeling.Problem.infer>` to show valid and invalid examples.
This method infers the type of a given expression based on the decision variables and placeholders defined in the {py:class}`Problem <jijmodeling.Problem>`, and it raises a type error for invalid expressions.
Let's look at an example. Here, we add a binary variable $x$ and an integer $N$, so $x + N$ is inferred as an integer-type expression $\mathbb{Z}$.

```{code-cell} ipython3
problem = jm.Problem("Type Inference Example")
x = problem.BinaryVar("x", description="Scalar decision variable")
N = problem.Integer("N")

problem.infer(x + N)  # OK! (scalar addition)
```

On the other hand, a scalar value cannot be added to a string, so the following example raises an error.

```{code-cell} ipython3
try:
    # ERROR! (string and scalar cannot be added)
    problem.infer(x + "hoge")
except Exception as e:
    print(e)
```

:::{admonition} What is the relationship between {py:class}`Expression <jijmodeling.Expression>` and {py:data}`ExpressionLike <jijmodeling.ExpressionLike>` / {py:data}`ExpressionFunction <jijmodeling.ExpressionFunction>`?
:class: note

In the {external+api_reference:doc}`API reference <index>` and editor completions/docs, you may see type names such as {py:data}`ExpressionLike <jijmodeling.ExpressionLike>` and {py:data}`ExpressionFunction <jijmodeling.ExpressionFunction>`.
These are dummy shorthand types that do not exist in the library implementation, and are used to represent types that can be converted to {py:class}`Expression <jijmodeling.Expression>`, or functions from `Expression` to `Expression`.
Specifically, you can think of them as follows:

| Type name | Description |
| --- | --- |
| {py:data}`ExpressionLike <jijmodeling.ExpressionLike>` | A type that can be converted to {py:class}`~jijmodeling.Expression`. Depending on the context, this includes {py:class}`~jijmodeling.Expression` itself, {py:class}`~jijmodeling.Placeholder`, {py:class}`~jijmodeling.DecisionVar`, {py:class}`~jijmodeling.NamedExpr`, as well as Python numbers, strings, tuples, lists, dictionaries, NumPy arrays, and so on. |
| {py:data}`ExpressionFunction <jijmodeling.ExpressionFunction>` | A function that takes one or more {py:class}`~jijmodeling.Expression` objects and returns a {py:class}`~jijmodeling.Expression`. In Python type hints, only up to 5 arguments are enumerated, but in practice there is no limit on the number of arguments. |

:::

## Placeholders and decision variables as expressions

As described in {doc}`variables`, decision variables and placeholders are defined with methods like {py:meth}`Problem.BinaryVar <jijmodeling.Problem.BinaryVar>` and {py:meth}`Problem.Placeholder <jijmodeling.Problem.Placeholder>`.
These methods return {py:class}`DecisionVar <jijmodeling.DecisionVar>` and {py:class}`Placeholder <jijmodeling.Placeholder>` objects that hold metadata, but when used in expression building they are automatically converted into {py:class}`Expression <jijmodeling.Expression>` objects.
In the `Test Problem` example above, Python variables `x` and `y` are {py:class}`DecisionVar <jijmodeling.DecisionVar>` objects, but in `z = x + y[0]`, they are converted to expressions that represent a decision variable and an array of decision variables.
Constants like `0` are plain Python numbers, but they are also automatically converted when they appear in expressions.

## How to construct expressions

The following chapters explain specific ways to construct expressions.

{doc}`arithmetic_and_comparison`
:   Explains how to construct expressions with arithmetic operations such as addition, subtraction, multiplication, and division, and with ordering and equality comparisons.

{doc}`arrays_and_dicts`
:   Explains how to declare multidimensional arrays and dictionaries and access their elements.

{doc}`folding_and_stream`
:   Introduces reductions over arrays and dictionaries using streams and the construction of expressions using logical operations.

For concrete examples of these constructs, see {doc}`../references/cheat_sheet`.

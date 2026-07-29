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

# Variables in JijModeling

In this chapter, we describe the two kinds of variables that appear in JijModeling: **decision variables** and **placeholders**.

## What are "variables" in JijModeling?

JijModeling has two broad kinds of **variables**.
One is the **decision variable**, a core component of mathematical optimization models whose value is determined by the solver.
In addition, JijModeling has variables called **placeholders**, whose values are substituted from instance data at compile time.
The placeholder concept separates input data from the model definition, and is one of JijModeling's distinctive features.
This separation enables type checking, constraint detection, and concise $\LaTeX$ output.

:::{figure} ./images/decision-vars-and-placeholders.svg
:name: two-kinds-of-vars
:alt: Placeholder receives instance data at compile time; decision variables remain for the solver
:width: 100%

Placeholders and decision variables
:::

{numref}`Figure %s <two-kinds-of-vars>` shows a simple example of both.
$N$ and $d$ are parameters whose values are assigned at compile time, i.e. **placeholders**, and are replaced by concrete values in an instance.
On the other hand, each $x_i$ is a **decision variable** whose value is chosen by the solver, and they remain in the instance.
In this example, the $x_n$ are indexed by the elements $n$ of the placeholder $N$, so their length is unknown at the modeling stage.
At compile time, a concrete value of $N$ is fixed, and in this example it expands to three independent decision variables.

As a variation of placeholders, JijModeling also has a kind of variable called a **category label**.
A category label represents "a set of labels that can be used as dictionary keys, where the concrete candidates are provided at compile time".
Each individual category label value is treated as having no structure beyond equality comparisons (`==` / `!=`), and it becomes concrete only when you provide a set of strings or integers **as part of instance data at compile time**.

:::{admonition} Category labels vs placeholders
:class: note

Category labels are similar to placeholders in that they are provided as part of instance data, but strictly speaking they are **not placeholders**.
Each category label adds a new kind of value that can be used by placeholders, so in a sense it corresponds to a user-defined class or type in languages like Python.
:::

:::{admonition} When to use category labels
:class: hint

Category labels are useful when:

1. The ordering of indices is not essential
2. You do not need numeric operations on indices
3. You want to assign human-readable names, such as strings
:::

:::{hint}
In the following chapters we explain placeholders first and decision variables second, but as long as dependencies between variables are respected, there is no restriction on the order of definition.
:::

## Arrays and dictionaries of variables

JijModeling variables can be defined as single variables, or multiple variables can be grouped as arrays or dictionaries.
Grouping variables is necessary when writing general mathematical formulations that involve summations and similar constructs.
For example, consider the classic knapsack problem used in the quickstart sections ({doc}`SCIP version <../quickstart/scip>`, {doc}`OpenJij version <../quickstart/openjij>`).

$$
\begin{alignedat}{2}
\max &&\quad& \sum_{i = 0}^{N - 1} v_i x_i\\
\text{s.t.} &&& \sum_{i = 0}^{N - 1} w_i x_i \leq W,\\
&&& x_i \in \{0, 1\}
\end{alignedat}
$$

We choose from $N$ items with values $v_i \in \mathbb{R}$ and weights $w_i \in \mathbb{R}$ to maximize value without exceeding capacity $W$.
The item count $N$ should depend on instance data, so rather than a fixed sum like $v_0 x_0 + v_1 x_1 + v_2 x_2$, it is useful to express it as a summation whose range depends on placeholder $N$.
To represent such "families of variables whose number of terms can change with input instance data", JijModeling uses **indexed variables**.

In JijModeling, decision variables and placeholders can be defined as two kinds of collections:

1. **Arrays** of variables, indexed continuously from $0$. Multi-dimensional arrays, like {py:class}`~numpy.ndarray`, are also supported.
2. **Dictionaries** of variables, discrete associative arrays whose keys are integers, strings, category labels, or tuples of them.

Dedicated constructors exist for these collections, but in many cases you can declare them by passing additional keyword arguments to the single-variable constructors introduced later.

:::{admonition} Choosing between arrays and dictionaries
:class: hint

Arrays and dictionaries can sometimes substitute for each other, but the following guidelines are helpful.

- When to use **arrays**
  1. Indices start at $0$ and are dense and contiguous
  2. The index order has temporal or spatial meaning, such as a traversal order
- When to use **dictionaries**
  1. Indices do not necessarily start at $0$, or are only partially defined
  2. Indices should carry special meaning via strings or similar labels
  3. Index order is not important
:::

Below we briefly summarize only the parts of arrays and dictionaries related to variable declarations.
For more general topics and operations, see {doc}`./expressions`.

### Overview of arrays

JijModeling can handle one-dimensional and multi-dimensional arrays, not limited to arrays of variables.
Even scalars are internally treated as zero-dimensional arrays.
Array lengths along each axis can depend on input placeholder values, but **the number of dimensions itself must be a natural-number constant literal, including zero**.

:::{admonition} Array type notation
:class: note

JijModeling array types separate dimensions and element types with a semicolon `;`:

| Example | Textual Notation | LaTeX Notation | Meaning |
| :-- | :--------------- | :------------- | :--- |
| 1D integer array | `Array[N; int]` | $\mathrm{Array}[N; \mathbb{Z}]$ | Integer array of length $N$ |
| 2D real array | `Array[N, M; float]` | $\mathrm{Array}[N \times M; \mathbb{R}]$ | $N \times M$ real-valued matrix |

:::

### Overview of dictionaries

In addition to arrays, JijModeling lets you declare dictionaries, or associative arrays, of variables.
Arrays are useful for structures with dense zero-based indices, while dictionaries are useful for sparse or partially defined indices, or for representing indices whose values are not natural numbers.

JijModeling dictionaries come in two types based on constraints on their domains: `PartialDict` and `TotalDict`.

| Dict type | Mathematical Notation | Description |
| :------- | :---: | :--- |
| `PartialDict[K; V]` | $\mathrm{PartialDict}[K; V]$ | A dictionary with keys of type `K` and values of type `V`. The key set may be any subset of `K`. |
| `TotalDict[K; V]` | $\mathrm{TotalDict}[K; V]$ | A dictionary that assigns a value of type `V` to **all possible values** of type `K`. Unlike `PartialDict`, it must be defined over the entire domain of `K`. |

The key types that can be used for dictionaries are basically only the following four:

1. Integers, excluding decision variables
2. Strings
3. Category labels
4. Tuples whose components are any of (1) to (3)

Because `TotalDict` can be used only when all possible values of the key type `K` can be enumerated, its key type must be "bounded" in this sense.
Specifically, the allowed keys for each dictionary type are shown below.

| | Integers | Strings | Category labels | Tuples |
| -----------: | :--: | :---: | :------------: | :---: |
| `PartialDict` | Yes | Yes | Yes | Any tuple composed of the left types |
| `TotalDict` | All naturals less than a decision-variable-free natural number $n$, i.e. $\mathbb{N}_{<n}$ | A predefined unique list of strings | Yes | Any tuple composed of the left types |

Here, "Yes" means anything that behaves as that type can be specified as a key type.
These are general conditions for dictionaries, not only dictionaries of variables.

:::{admonition} Note when defining decision variables
:class: important
:name: dec-var-count

Decision variables and placeholders can define arrays and dictionaries in almost the same way, but there is one important difference.

Because decision variables are values to be determined by a solver, the **number of decision variables must be fully determined** in the compiled instance.
In other words, **the number of decision variables included in the instance must be completely determined by placeholder values**.

This requirement appears as the following distinction: placeholder arrays may be specified only by dimension, and placeholder dictionaries may be partially defined, whereas decision-variable arrays and dictionaries must have their shapes or key sets fully specified, possibly by referring to placeholders.
:::

## Variables as expressions

Declared variables are represented as objects that store their metadata, but at the same time they also behave as **expressions**.
In particular, when a variable object appears as part of another expression, it is automatically converted into an expression that refers to the variable with that name.
When a variable appears in an expression, a single variable behaves as an expression of the corresponding type, while an indexed variable behaves as an array or dictionary expression made of variables, depending on how it is represented.

(update_parameters)=
## Obtaining previously defined items with `@problem.update`

When updating a Problem incrementally with multiple {py:meth}`@problem.update <jijmodeling.Problem.update>` decorators, you can obtain variables defined in earlier blocks as additional arguments.
Starting with the second argument, declare arguments with the same names as the items you want to obtain and use the corresponding type annotations below.

| Item to obtain | Type annotation |
| :-- | :-- |
| Placeholder | `jm.Placeholder` |
| Category label | `jm.CategoryLabel` |
| Decision variable | `jm.DecisionVar` |
| Named expression | `jm.NamedExpr` |

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

As this example shows, the additional arguments to `@problem.update` need only include the variables required by that update, rather than every variable defined in the Problem.

From the next chapter, we will look at how to declare placeholders and decision variables, both as single variables and as indexed variables.

---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Feature 1

+++

## Bugfixes

+++

### Bugfix 1: Fix the names of lambda parameters and `for`-clause loop variables being lost in deserialized mathematical models

Fixed an issue where deserializing, with `jm.from_protobuf`, a mathematical model serialized with `jm.to_protobuf` lost the names of lambda parameters and of loop variables in the `for` clauses of comprehensions, and replaced them with names such as `x` and `x1`.

For example, the names were replaced in a case like the following:

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
problem += jm.sum(N, lambda i: x[i])

deserialized = jm.from_protobuf(jm.to_protobuf(problem))
deserialized.objective
```

Previously, the objective function of the deserialized mathematical model was displayed as follows, with the lambda parameter `i` replaced by `x`, the same name as the decision variable:

$$
\sum_{x=0}^{N-1}{x}_{x}
$$

Starting with this release, it is displayed with the original name `i`.
Data serialized by earlier releases, however, does not get the original names back when it is deserialized, and is displayed with names such as `x` and `x1`.

The issue was limited to how expressions are displayed: it appeared in their $\LaTeX$ rendering, in their string representation, such as the one `print` shows, and in the expressions quoted in error messages.

### Bugfix 2: Fix `jm.is_same` sometimes judging mathematical models with the same contents to be different

Fixed an issue where comparing two mathematical models with the same contents by `jm.is_same` could return `False`, depending on how their objective functions were built.

For example, `False` was returned in a case like the following:

```{code-cell} ipython3
import jijmodeling as jm

problem_a = jm.Problem("problem")
x = problem_a.BinaryVar("x")
y = problem_a.BinaryVar("y")
problem_a += x
problem_a += y

problem_b = jm.Problem("problem")
x = problem_b.BinaryVar("x")
y = problem_b.BinaryVar("y")
problem_b += x + y

jm.is_same(problem_a, problem_b)
```

The two mathematical models above both have the objective function `x + y`, and the rest of their contents is the same as well.
Nevertheless, `jm.is_same` previously returned `False`.

In addition, a mathematical model deserialized from its serialized form could be judged to be different from the original.
A mathematical model with no objective function set is one example:

```{code-cell} ipython3
problem = jm.Problem("problem")
x = problem.BinaryVar("x")
problem += problem.Constraint("constraint", x <= 1)

deserialized = jm.from_protobuf(jm.to_protobuf(problem))
jm.is_same(deserialized, problem)
```

Starting with this release, both comparisons return `True`.
A mathematical model with a decision variable whose shape is given as a single expression, such as `(y + 1).shape()`, was also judged to be different from the original after deserialization; starting with this release, it is judged to be the same.

In addition, although `jm.is_same` is documented not to compare `description`, it returned `False` when mathematical models or constraints differed only in their `description`, or when mathematical models differed only in the `description` of a category label they contain.
Starting with this release, these descriptions are not compared either.

### Bugfix 3: Fix lambda parameters and loop variables being displayed under the same name as a decision variable or another variable of the model

Fixed an issue where a lambda parameter, or a loop variable in the `for` clause of a comprehension, that has the same name as a decision variable, a placeholder, or another variable of the model was displayed under that same name, so that the two could not be told apart.

For example, the two could not be told apart in a case like the following:

```{code-cell} ipython3
import jijmodeling as jm


def total(v, n):
    return jm.sum(n, lambda x: v[x])


problem = jm.Problem("problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))

total(x, N)
```

In the code above, the parameter of the lambda inside the function `total` and the decision variable are both named `x`.
Previously, this expression was displayed as follows, and the lambda parameter could not be told apart from the decision variable:

$$
\sum_{x=0}^{N-1}{x}_{x}
$$

Starting with this release, when the displayed expression or mathematical model contains a decision variable, a placeholder, or another variable with the same name, a lambda parameter or a loop variable is displayed under a name with a number appended, such as `x1`.

This fix applies to the $\LaTeX$ rendering of expressions, to their string representation, such as the one `print` shows, and to the expressions quoted in error messages.

## Other Changes

- Change 1

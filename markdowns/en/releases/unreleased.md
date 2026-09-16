---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Improved LaTeX output for folding methods

Methods like `sum` or `max` will now use type information when available to expand the notation.
And when `axis` is specified, they now render as comprehensions with partial convolution:

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("myproblem")
N = problem.Natural("N")
a = problem.Integer("a", shape=(N, N))
A = problem.NamedExpr("A", a.sum())
B = problem.NamedExpr("B", a.sum(axis=1))

problem
```

### Simplify operations on constants in LaTeX output

Basic operations involving constants will now be simplified when displaying $\LaTeX$. This generally makes equations easier to read, particularly summations which often involved `- 1`s for the termination, and basic coefficients like `-2 * x`.

```{code-cell} ipython3
problem = jm.Problem("TestProblem")
V = problem.Natural("V")
problem += jm.map(lambda x: x + 3 - 2, V - 1).sum() 
problem += - 2 * V + - 2 - 1
problem += 2 * (3 * V)
problem += 2 * (V * 3)
problem
```

### Change display of logical operators on streams 

When displaying $\LaTeX$, the operators for stream unions and intersections now display as $\cup$ and $\cap$.

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

## Bugfixes

+++

### Bugfix 1: Fix type errors when subscripting loop variables in `for`-clauses

Fixed a type-checking issue where subscripting a loop variable in `for`-clauses, such as `jm.sum (e[1] for e in G)` where `G` is a graph, could raise `[E-TE0017] An expression of type ElementOf[stream(..)] cannot be subscripted.`
The following code now compiles successfully with constraint detection enabled:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Erroring Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar("x", shape=(N,))
    G = problem.Graph(dtype=N)

    problem += problem.Constraint(
        "even-sources",
        (jm.sum(x[e[1]] for e in G if e[0] % 2 == 0) <= 1),
    )


display(problem)
instance = problem.eval({"N": 3, "G": [(0, 0), (0, 1), (1, 2)]})
```

The expected SOS1 constraint is now detected in this example as well.

```{code-cell} ipython3
instance.constraint_hints
```

## Other Changes

- Added the `jijmodeling` plugin for coding agents. See {doc}`../advanced/agent_plugin_installation` for installation instructions.

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

### Additional improvements to LaTeX output

We've improved how indices are displayed when indexing folds and genarray expressions. For example, when setting an `axis` in this TSP example:

```{code-cell} ipython3
import jijmodeling as jm 

@jm.Problem.define("tsp")
def tsp(problem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N, N))
    d = problem.Float(shape=(N,N))
    problem += jm.sum(d[i, j] * x[(t + 1) % N, j] for t in N for i in N for j in N)
    problem += problem.Constraint("one time", x.sum(axis=0) == 1)
    problem += problem.Constraint("one city", x.sum(axis=1) == 1)
tsp
```

Some other expressions which have been improved:

```{code-cell} ipython3
@jm.Problem.define("problem")
def prob(problem):
  N = problem.Natural()
  M = problem.Natural()
  x = problem.IntegerVar(shape=(M,N), lower_bound=1, upper_bound=10)
  a = problem.Integer(shape=(M,N))

  A = problem.NamedExpr(jm.genarray(x[m,n] * a[m] for (n, m) in (N, M)).sum())
  B = problem.NamedExpr(jm.sum(jm.genarray(x[m,n] * a[m] for (n, m) in (N, M))[i, j] for i in N for j in M))
 
prob
```

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1

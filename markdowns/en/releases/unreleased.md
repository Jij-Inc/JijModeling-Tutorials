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

## Performance Improvements

+++

### Faster construction of expressions and constraints

Creating expressions and constraints now takes less time.
The improvement is particularly noticeable in Jupyter notebooks and when running Python with `-m` or `-c` flags.
Previously, the time to create each expression or constraint in these environments grew with the number of loaded Python modules, and could be many times longer than when running a script directly with `python script.py`.
In these environments, model construction is now about as fast as in a script.

The following times are for building a model with 2,000 individually created constraints (CPython 3.14 on Linux):

| How the benchmark was run | Before | After |
|---|---:|---:|
| Jupyter notebook | about 35 s | about 0.14 s |
| `python -m` | about 6.6 s | about 0.26 s |
| `python script.py` | about 0.53 s | about 0.25 s |

Note, however, that creating many constraints of the same form one by one, as this benchmark does, is not the recommended way to write a model.
Define such constraints as a constraint family instead (see {doc}`../basics/objective_and_constraints`). JijModeling can then handle them as a single unit, which makes building the model, constraint detection, and compilation into an OMMX instance all faster than with individually created constraints.

## Feature Enhancements

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

```{code-cell} ipython3

```

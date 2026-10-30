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

### Improved handling of functions with argument-dependent return types

JijModeling has supported functions whose return types depend on their arguments. This release makes their handling more systematic and displays their types accurately, for example as `(n : natural) -> Array[n; natural]`.

Several related bugs have also been fixed. In the Bugfixes section of these release notes, fixes associated with this change are marked with `(Π)`.

#### Improved argument types for functions passed to `jm.map`

As part of this change, argument types for functions passed to operations such as `jm.map` and `jm.filter` are now handled more precisely.
In the following example, the function passed as the first argument to `jm.map` was previously inferred to take an arbitrary natural number (`natural`). Starting with this release, its argument is correctly typed as a natural number less than `N`.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("map argument types")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
problem += jm.map(lambda i: x[i], N).sum()

print(problem.objective)
```

As a result, programs that previous versions incorrectly accepted (even though they should have produced errors) are now correctly rejected.
One example is the following stream of arrays whose types depend on their position $n < N$ within the stream.
JijModeling currently has no mechanism for safely handling streams or arrays whose element types depend on their positions, so this program should produce an error.

```{code-cell} ipython3
import jijmodeling as jm

try:

    @jm.Problem.define("problem")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Natural()
        x = problem.NamedExpr(jm.map(lambda n: jm.genarray(lambda j: 42, n), N))

except Exception as e:
    print(e)
```

Previously, this program was incorrectly inferred to have a type such as `Stream[Array[n_1234, natural]]`, containing an undefined variable `n_1234`. Starting with this release, it is correctly reported as an error.

## Bugfixes

+++

### Bugfix (Π): Fix constraint detection errors when destructuring dictionary keys

Constraints containing comprehensions that unpack dictionary (`PartialDict` / `TotalDict`) keys into their individual components (such as `for i, j in c.keys()` in the example below) previously caused an `E-TE0014` error during constraint detection.
Starting with this release, these cases run successfully:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("onehot", jm.sum(x[i, j] for i, j in c.keys()) == 1)


problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

### Bugfix (Π): Fix constraint detection errors when using variables bound by earlier `for` clauses inside `genarray`

Fixed an issue where using a variable bound by an earlier `for` clause as the length of a subsequent `jm.genarray` caused an `E-TE0005` (unbound variable) error when constraint detection was enabled.
For example, the following code previously raised an error such as ``error[E-TE0005] Unbound variable `d_...` ``, but now compiles successfully.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    ub = problem.Natural(less_than=N)
    x = problem.BinaryVar(shape=(N,))
    problem += problem.Constraint(
        "onehot",
        jm.sum(
            x[t]
            for n in ub
            for j in n
            for s, d in [(n, j)]
            for t in jm.genarray(s + i for i in d)
        )
        == 1,
    )


problem.eval({"N": 3, "ub": 1})
```

### Bugfix (Π): Fix unexpected `__dangling_*` variable names in string representations

When displaying problems with nested `for` clauses as strings, for example with `print`, unexpected variable names such as `__dangling_*` could appear. Starting with this release, the correct variable names are displayed:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    a = problem.Placeholder(
        shape=(N,), dtype=(jm.DataType.NATURAL, jm.DataType.NATURAL)
    )
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(x[s] for n in N for s, d in [a[n]])


print(problem)
```

In previous releases, `[a[n]]` in the output above was displayed as `[a[__dangling_0]]`.

### Bugfix: Fix panics when accessing keys of dictionaries created with `gendict`

Accessing the keys of a dictionary created with `gendict` could cause an unrecoverable panic, as in the following example:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    keys = problem.Natural("keys", ndim=1)
    a = problem.Natural("a", ndim=1)
    d = problem.NamedExpr("d", jm.gendict(k for k in keys))
    problem += jm.sum(a[i] for n in d.keys() for i in n)


problem
```

Previously, the code above caused the following unrecoverable error:

```python
PanicException: internal error: entered unreachable code: ElementOf[stream(keys)] must wrap a set type, but got: Array[:; natural]
```

Starting with this release, this code works as expected.

### Bugfix: Correct result types for sums and products of bounded natural numbers

Fixed an issue where `sum` and `prod` over natural numbers less than `N` were incorrectly given a result type with the same bound `N`.
Even when each element is less than `N`, their sum or product can be `N` or greater. Starting with this release, the result type is `natural`, without an upper bound.
The result types of `min` and `max` remain `N`, since the minimum and maximum cannot exceed the elements' bound.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("sum and prod types")
N = problem.Natural("N")
a = problem.Natural("a", shape=(3,), less_than=N)

print("a:", problem.infer(a))
print("sum:", problem.infer(a.sum()))
print("prod:", problem.infer(a.prod()))
print("min:", problem.infer(a.min()))
print("max:", problem.infer(a.max()))
```

### Bugfix: Fix infinite loops in constraint detection caused by floating-point rounding errors

Fixed a bug that could cause constraint detection to loop indefinitely when variable bounds or subexpressions in the objective function or constraints contained values that could not be handled exactly in floating-point arithmetic.
This did not occur when constants were modeled as placeholders and floating-point values were supplied as instance data. However, specifying floating-point values directly in the model, as in the following example, could cause an infinite loop.

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("decimal bounds")

# 0.1 cannot be represented exactly in floating point, and arithmetic with 0.5
# introduces rounding errors that previously caused constraint detection
# to loop indefinitely.
problem.ContinuousVar("ratio", lower_bound=0.1, upper_bound=0.5)
instance = problem.eval({})
```

Starting with this release, constant folding is performed only when the arithmetic is exact, preventing this issue.
As a result, some transcendental functions now appear without simplification in $\LaTeX$ output.

## Other Changes

- Change 1

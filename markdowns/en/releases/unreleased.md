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

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Achieved speed and memory efficiency equal to or better than JijModeling v1

The compiler infrastructure has been substantially redesigned, achieving approximately a 10x speed improvement over the previous implementation in some benchmarks.

<!-- TODO: Insert graph -->

Memory usage has also improved. <!-- TODO: Add numbers -->

With these improvements, JijModeling 2 now achieves performance equal to or much better than the previous JijModeling 1, so please consider migrating to JijModeling 2.

### Improvements to the [Type Mismatch error](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-TE0004.html)

The Type Mismatch error now includes the term whose type actually mismatched when needed.

```{code-cell} ipython3
import jijmodeling as jm


try:
    @jm.Problem.define("MyProblem")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Length()
        W = problem.Float()
        x = problem.BinaryVar(shape=N)

        problem += x[W] # Error!
except Exception as e:
    print(e)
```

The corresponding entry in the Error Code Index is now also more detailed.

+++

## Bugfixes

+++

### Bugfix 1


## Other Changes

-

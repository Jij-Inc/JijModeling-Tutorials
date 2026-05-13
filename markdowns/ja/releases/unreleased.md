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

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### Decorator API における `jm.min`、`jm.max`、`jm.set` の内包表記サポート

旧来は、Decorator API を利用する際に内包表記（Python のジェネレータ式）を引数として受け取れるのは {py:func}`jm.sum <jijmodeling.sum>` と {py:func}`jm.prod <jijmodeling.prod>` のみでした。

本バージョンから、{py:func}`jm.min <jijmodeling.min>`、{py:func}`jm.max <jijmodeling.max>`、{py:func}`jm.set <jijmodeling.set>` の一引数呼び出しでも、同様に内包表記を受け取れるようになりました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("min/max/set comprehension example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=N)

    nonzero = jm.set(i for i in N if i != 0)
    problem += jm.min(x[i] for i in N) + jm.max(x[i] for i in nonzero)


problem
```

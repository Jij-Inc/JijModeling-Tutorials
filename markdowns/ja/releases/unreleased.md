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

### 数式出力：制約の添え字が読みやすく

辞書や配列同士の直接比較による制約条件が、$\LaTeX$ 出力では $\forall$ を使って出力されるようになり、可読性が向上しました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("container-vs-scalar-comp")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(shape=N)
    y = problem.BinaryVar(dict_keys=(L, N - 1))
    z = problem.BinaryVar(dict_keys=(L, N - 1))

    problem += problem.Constraint(
        "scalar-vs-tensor",
        1 <= x
    )
    problem += problem.Constraint(
        "tensor-vs-tensor",
        x <= x
    )
    problem += problem.Constraint(
        "dict-vs-scalar",
        y <= 5
    )
    problem += problem.Constraint(
        "dict-vs-dict",
        y <= z
    )

problem
```

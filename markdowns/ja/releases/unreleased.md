---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### `jm.range`追加

`jm.Expression`を使用した値シーケンスを表する関数、`jm.range`を追加しました。使い方は基本的にpython組み込みの`range`と似ています。

例は以下の通りです:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("RangeProblem")
def problem(problem: jm.DecoratedProblem):
    S = problem.Natural()
    F = problem.Natural()
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(x[i] for i in jm.range(S, F, N))
```

## バグ修正

+++

### バグ修正1：


## その他の変更

- 変更1：

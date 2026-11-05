---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### `dtype`でストリームと部分的辞書の対応

複合型の `jm.DataType.STREAM` と `jm.DataType.PARTIAL_DICT` を、プレースホルダーの `dtype`として指定できるようになりました。

以下の例では、通過したノードとその重みを含む経路を持つプレースホルダーを定義します。各経路の長さはそれぞれ異なっても問題ありません。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def _(problem: jm.DecoratedProblem):
    N = problem.Natural("N")
    x = problem.BinaryVar("x", shape=N)
    A = problem.Placeholder("A", dtype=jm.DataType.STREAM[(float, N)], ndim=1)
    problem += problem.Constraint(
        "at-most-one", [jm.sum(c * x[i] for c, i in route) <= 1 for route in A]
    )
```

## バグ修正

+++

### バグ修正 1：


## その他の変更

- 変更 1：

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

### `dtype`でストリームと辞書の対応

複合型の `jm.DataType.STREAM`、`jm.DataType.PARTIAL_DICT`および `jm.DataType.TOTAL_DICT` を、プレースホルダーの `dtype`として指定できるようになりました。

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

### バグ修正 1：制約条件の domain にタプルストリームを使った場合エラーになる問題の修正

辞書の`.keys()`など、タプルのストリームを制約条件の `domain`として eval した場合に、型エラー{external+api_reference:doc}`E-TE0014 <error_codes/error/E-TE0014>`エラーが発生する問題を修正しました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("fixed", [x[i, j] == 1 for i, j in c.keys()])

problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

## その他の変更

- 変更 1：

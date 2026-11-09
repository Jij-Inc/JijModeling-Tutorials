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

# JijModeling 2.12.0 リリースノート

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

### バグ修正：制約条件の domain にタプルストリームを使った場合エラーになる問題の修正

辞書の`.keys()`など、タプルのストリームを制約条件の `domain`として eval した場合に、型エラー{external+api_reference:doc}`E-TE0014 <error_codes/error/E-TE0014>`が発生する問題を修正しました。

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

### バグ修正：浮動小数点数の丸め誤差により制約検出が停止しなくなる問題の修正

変数の上下界や目的関数・制約条件の部分項などに、浮動小数点数として厳密な演算が不可能な値が登録されていた場合、制約検出が停止しなくなるバグを修正しました。
定数値をプレースホルダーとして定式化し、インスタンスデータとして浮動小数点数を入力した場合にはこうした問題は起きていませんでしたが、以下のように直接モデル中に浮動小数点数を指定すると停止しなくなる場合がありました。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("decimal bounds")

problem.ContinuousVar("ratio", lower_bound=0.1, upper_bound=0.5)
instance = problem.eval({})
```

本バージョンから、厳密な演算ができる場合のみ定数畳み込みを行うようにしたため、このような問題は発生しなくなっています。
また、これの影響として $\LaTeX$ 出力では一部の超越関数が簡約されずに表示されるようになりました。

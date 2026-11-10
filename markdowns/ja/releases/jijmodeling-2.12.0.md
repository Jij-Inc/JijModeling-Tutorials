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

プレースホルダーの `dtype`として`jm.DataType.STREAM` 、 `jm.DataType.PARTIAL_DICT` および `jm.DataType.TOTAL_DICT` を指定できるようになりました。

以下の例では、`N` のバイナリ変数の配列 `x` を定義し、加えて係数 `c` と `x` の添字 `i` の組を並べたストリームを要素とする $1$ 次元のプレースホルダー `A` を定義しています。
各ストリームから重み付き和が $1$ 以下となる制約を作り、和に含める項の数はストリームごとに変えられます。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural("N")
    x = problem.BinaryVar("x", shape=N)
    A = problem.Placeholder("A", dtype=jm.DataType.STREAM[(float, N)], ndim=1)
    problem += problem.Constraint(
        "weighted-sum", [jm.sum(c * x[i] for c, i in terms) <= 1 for terms in A]
    )
```

このストリームの実際の長さは一定である必要はなく、次のようなインスタンスデータを受け入れることができます。

```{code-cell} ipython3
problem.eval({
    "N": 3,
    "A": [
        [(0.5, 0), (0.75, 1)],
        [(1.0, 2)],
    ],
})
```

この `A` の各要素は、それぞれ次の制約に対応します。

$$
\begin{aligned}
0.5 x_0 + 0.75 x_1 &\le 1, \\
x_2 &\le 1.
\end{aligned}
$$

:::{tip}
このように複合型のプレースホルダーを使うことにより、行ごとに長さが不定であるようなデータ型を定義することができます。

旧来の JijModeling ではこうした用途には Jagged Array が用いられていましたが、Jagged Array は要素へのランダムアクセスを許可するかわりに型検査の恩恵を受けづらく、デバッグが難しいという問題があり、JijModeling 2 では非推奨となっていました。

こうした用途では添え字への直接のランダムアクセスが不要な場合が多く、このような場合には複合型のプレースホルダーを使って長さが不定なデータを表すことで、安全で扱いやすい形でモデルを定義できます。
:::

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

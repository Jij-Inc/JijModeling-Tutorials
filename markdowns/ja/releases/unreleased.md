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

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### コンパイラの実行速度とメモリ効率を改善

コンパイラの大規模な最適化により、実行速度とメモリ効率が大幅に向上しました :tada:

ベンチマークでは、JijModeling 2.6.0 に対して最大 7.6 倍、JijModeling 1.x に対して最大 4.5 倍の高速化が観測されました。以下は代表的な処理の実行時間を、2.7.0 を 1.0 として比較した結果です。値が大きいほど、今回のリリース版よりも時間がかかったことを示します。

:::{figure} ../images/compiler-ir-timing.svg
:alt: JijModeling 1.x、2.6.0、2.7.0 の相対実行時間を、ナップサック、supportcase18、FMA の代表的な処理で比較した縦棒グラフ
:width: 100%

代表的なベンチマークでコンパイルにかかった相対実行時間。棒上の数値は 2.7.0 に対する比率（1.0 以上＝2.7.0 の方が高速か同等）
:::

1 回のコンパイルあたりのメモリ確保量についても、大幅な削減が見られています。
具体的には、1 回のコンパイルあたりの累積確保量は 2.6.0 より 76–97%、JijModeling 1.x より 51–94% 削減されました。

:::{figure} ../images/compiler-ir-memory.svg
:alt: JijModeling 1.x、2.6.0、2.7.0 の 1 回のコンパイルあたりの累積メモリ確保量を、時間ベンチマークと同じ順序のナップサック、supportcase18、FMA で比較した縦棒グラフ
:width: 100%

代表的なベンチマークにおける 1 回のコンパイルあたりの累積メモリ確保量
:::

いずれも計測には Google Cloud の `n2-standard-8`（8 vCPU、32 GB、Ubuntu 26.04 LTS、x86_64）を使用しました。

特にコンパイル時間が課題となるモデルで大きな改善が得られていますので、これを機に JijModeling 2 への移行をぜひ検討してください。

### [Type Mismatch エラー](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-TE0004.html)の改善

Type Mismatch エラーが必要に応じて実際に型が合わなかった項を含むようになりました。

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

合わせて、エラーコードインデックスの当該エラーの内容がより詳細になりました。

### 添え字つき変数の数式出力の改善

添え字つきの変数の表示がより読みやすくなりました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Vars Beautiful")
def problem(problem: jm.DecoratedProblem):
    C = problem.CategoryLabel()
    N = problem.Natural()
    M = problem.Natural()
    w = problem.Float(shape=(N, M))

    x = problem.ContinuousVar(
        shape=(N, M),
        lower_bound=w,
        upper_bound=2,
        description="添え字がわかりやすくなった",
    )
    z = problem.IntegerVar(
        dict_keys=(C, N),
        lower_bound=lambda c, i: i,
        upper_bound=42,
    )
    u = problem.BinaryVar()

problem
```

## バグ修正

+++

### 引数に式を含む `jm.range` が内部エラーになる問題を修正

これまで、`jm.range` の引数に `N - 1` のような計算式を渡すと、モデルの評価時に内部エラー（[E-CE0007](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-CE0007.html)）が発生し、JijModeling 側のバグとして報告されていました。この問題は制約の `domain=` に限らず、総和の添字集合など `jm.range` を評価する全ての箇所で発生していました（リテラルや単独のプレースホルダーを引数とする `jm.range(N)` などは影響を受けません）。

今回の修正により、引数に式を含む range も正しく評価されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("RangeWithComputedBounds")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(x[i] for i in jm.range(N - 1))
    problem += problem.Constraint("fix", lambda i: x[i] == 0, domain=jm.range(N - 1))

display(problem)

problem.eval({"N": 4})
```

## その他の変更

-

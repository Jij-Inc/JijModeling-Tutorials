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

### JijModeling v1 以上の速度・メモリ効率を達成

コンパイラ基盤の大幅な見直しが行われ、一部のベンチマークでは従来に比べて約10倍の速度向上が達成されました。

<!-- TODO: グラフを挿入 -->

またメモリ使用量にも改善が見られています。 <!-- TODO: 数字を出す -->

この改善により、JijModeling 2 は以前の JijModeling 1 と同等かそれ以上のパフォーマンスを達成するようになりましたので、これを機に JijModeling 2 への移行を是非検討してください。

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

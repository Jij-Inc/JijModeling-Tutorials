---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### `Set` を `Stream` に改名

これまでの JijModeling では「走査できる値の列」を表す型は `Set` と呼ばれていましたが、数学的には "Set"（集合）とは重複も順番も持たないものの集まりであるため、誤解の元となっていました。

今回のリリースより、これまで `Set` と呼ばれていたものは `Stream` と呼ばれるようになり、非推奨となった {py:func}`jm.set <jijmodeling.set>` 関数のかわりに {py:func}`jm.stream <jijmodeling.stream>` 関数が導入されました。
これは、一般のプログラミング言語ではこのような「特定の順番を持ち、重複を持った値の列」を**ストリーム**と呼ぶことにならったものです。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("stream example")
N = problem.Natural("N")
problem.infer(jm.stream(N))
```

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem, N: jm.Placeholder):
    # Decorator API 内では内包表記も利用可能
    print(problem.infer(jm.stream(2 * i for i in N if i % 2 == 0)))
```

{py:func}`jm.set <jijmodeling.set>` は {py:func}`jm.stream <jijmodeling.stream>` の別名として引き続き利用できますが、**廃止予定**であるため {py:func}`jm.stream <jijmodeling.stream>` への速やかな移行を推奨します。

+++

### gendict の LaTeX 出力の改善

`gendict`関数の $\LaTeX$ 出力の体裁を `genarray` と合わせました。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("gendict example")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
x = problem.BinaryVar("x", dict_keys=K)
Sums = problem.NamedExpr("Sums", jm.gendict(lambda k: a[k] * x[k], K))


problem
```

### `gendict` 内包表記での `if` 節

Decorator API の `gendict` 内包表記で、単一の `for` 節のあとに `if` 節を書けるようになりました。
これにより、定義域を絞り込んだ辞書を `gendict` 内包表記で柔軟に定義できるようになりました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("gendict-if")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.Float(dict_keys=N)
    A = problem.NamedExpr(jm.gendict(c[i] * 2 for i in N if i != 0))


problem
```

以下は複数の `if` 節を使っている例です。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("gendict-tuple-if")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    L = problem.CategoryLabel()
    avoid = problem.Placeholder(dtype=L)
    c = problem.Float(dict_keys=(N, L))
    OffDiag = problem.NamedExpr(
        jm.gendict(i + c[i, l] for (i, l) in (N, L) if i % 2 != 0 if l != avoid)
    )


problem
```

## バグ修正

### 上限・下限が非有界な決定変数の存在下で制約検出がメモリを大量に消費する問題の修正

`upper_bound=float("inf")` のように決定変数へ無限大の上下界を与え非有界に指定したモデルを制約検出が有能な状態でコンパイルすると、メモリを際限なく消費することがありました。

今回のリリースではこのバグが修正され、制約検出が有効な状態でも問題なく実行されるようになりました。
また、併せて上下界に NaN を与えられたり、上界が負の無限大であるなどそもそも充足不能な場合には、定義時にエラーとなるようになりました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("production", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    T = problem.Length(description="number of periods")
    demand = problem.Float(shape=(T,), description="demand per period")
    # 1 期あたりの生産量に上限を設けない
    x = problem.ContinuousVar(
        lower_bound=0.0, upper_bound=float("inf"), shape=(T,)
    )

    problem += jm.sum(x[t] for t in T)
    problem += problem.Constraint("meet_demand", [x[t] >= demand[t] for t in T])


problem.eval({"T": 3, "demand": [1.0, 2.0, 3.0]})
```

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

### これまで「集合」と呼んでいたものを「ストリーム」に改称：`jm.set` を非推奨とし `jm.stream` を導入

JijModeling には以前から「走査できる値の列」を表す型があります。`jm.sum` や `jm.map`、`jm.filter` に渡したり、制約の `domain` に指定したりするものです。
これまでこの型を**集合**と呼び、明示的な変換関数の名前も `jm.set` としていました。

しかし、この名前は誤解を招くものでした。数学的な「集合」は重複を持たず順序も持ちませんが、この型は**元来、順序を保持し重複も許す**ものであり、一般のプログラミング言語でいう*ストリーム*（あるいは*イテレーター*）に相当するからです。
そこで、今後はこの概念を一貫して**ストリーム**と呼ぶことにし、変換関数も {py:func}`jijmodeling.stream` という名前にしました。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("stream example")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=N)
problem += jm.map(lambda i: x[i], jm.stream(N)).sum()


problem
```

`jm.set` は `jm.stream` の**非推奨の別名**として引き続き利用できます。構築される式はまったく同じであり、Decorator API の内包表記を含め、従来受け付けていた書き方はすべてそのまま使えます：

```{code-cell} ipython3
import warnings

import jijmodeling as jm


with warnings.catch_warnings():
    # `jm.set` を呼び出すと DeprecationWarning が発生します。
    warnings.simplefilter("ignore", DeprecationWarning)

    @jm.Problem.define("deprecated jm.set still works")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Length()
        x = problem.BinaryVar(shape=N)
        domain = jm.set(i for i in N if i != 0)
        problem += problem.Constraint("fix", lambda i: x[i] == 0, domain=domain)


problem
```

移行は単純な名前の置き換えで完了します。`jm.set(...)` を `jm.stream(...)` に書き換えてください。
この改称はエラーメッセージやモデルの文字列表現にも反映されており、型は `Set[...]` ではなく `Stream[...]` と、演算は `set(...)` ではなく `stream(...)` と表示されるようになります。

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

### バグ修正 1：


## その他の変更

- 変更 1：

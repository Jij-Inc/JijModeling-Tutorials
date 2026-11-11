---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### 機能1

+++

## バグ修正

+++

### バグ修正1：表示上は同じ型どうしが一致しないと報告される型エラーの修正

型検査時に ``Could not match actual type `T` with expected `T` ``（{external+api_reference:doc}`E-TE0004 <error_codes/error/E-TE0004>`）のように、表示上はまったく同じ二つの型が一致しないと報告される場合がある問題を修正しました。

例としては、以下のようなケースでエラーが発生していました：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    T = problem.Length()
    x = problem.BinaryVar(dict_keys=jm.stream((i, t) for i in T for t in T))
    problem += problem.Constraint(
        "one-hot", jm.sum(x[i, t] for i in T for t in T) == 1
    )


instance = problem.eval({"T": 2})
instance.constraint_hints.one_hot_constraints
```

この例は、これまで制約検出を無効にしない限り、以下のエラーで失敗していました：

```text
error[E-TE0004] Could not match actual type `T` with expected `T` on an expression `t_0_...`
```

本リリースからは問題なく評価され、上の出力のとおり one-hot 制約も検出されます。

また、制約検出が無効の場合であっても、以下のように `latex=` で独自の $\LaTeX$ 表示を指定した式について同様のエラーが発生していました：

```{code-cell} ipython3
problem = jm.Problem("problem")
w = problem.Float("w", ndim=1)
N = w.len_at(0)
M = w.len_at(0, latex="M")
a = problem.Float("a", shape=(N,))
b = problem.Float("b", shape=(M,))

problem.infer(a + b)
```

これまでは、`a + b` は以下のエラーになり、`jm.is_same(N, M)` は `False` を返していました：

```text
error[E-TE0015] `numeric operator +` is not supported between types `Array[w.len_at(0); float]` and `Array[w.len_at(0); float]`
```

### バグ修正2：キー集合を内包表記で定義した場合、添え字アクセスが型エラーになることがある問題の修正

以前のリリースでは、以下の `x` のように `for` 節を二つ以上持つ内包表記で定義したストリームを `dict_keys` に指定した決定変数について、その要素を参照できるのは、キーの定義と同じ `for` 節を持つ内包表記の中に限られていました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    T = problem.Length()
    x = problem.BinaryVar(dict_keys=jm.stream((i, t) for i in T for t in T))
    problem += problem.Constraint(
        "one-hot", [jm.sum(x[i, t] for t in T) == 1 for i in T]
    )


problem
```

これまでは、上の定義は `one-hot` 制約の定義部分で以下のエラーが発生していました：

```text
error[E-TE0004] Could not match actual type `natural` with expected `T` on an expression `t_...`
```

本リリースからは、問題なく実行されるようになりました。

## その他の変更

- 変更 1：

---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### 畳み込みメソッドの LaTeX 出力の改善

`sum`や`max`などの畳み込み演算は、型情報が明確な場合、性格な数値が表示されるように修正しました。
また、`axis`が指定された場合、内包表記と部分的な畳み込みの組み合わせで表示されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("myproblem")
N = problem.Natural("N")
a = problem.Integer("a", shape=(N, N))
A = problem.NamedExpr("A", a.sum())
B = problem.NamedExpr("B", a.sum(axis=1))

problem
```

### 定数に対する演算の LaTeX 簡略化

$\LaTeX$ 出力で定数式の簡約を行うようになりました。`-2*x`の単純な係数や、総和でよく見られる `- 1`などが簡約されるようになり、数式全体の可読性が向上しました。

```{code-cell} ipython3
problem = jm.Problem("TestProblem")
V = problem.Natural("V")
problem += jm.map(lambda x: x + 3 - 2, V - 1).sum() 
problem += - 2 * V + - 2 - 1
problem += 2 * (3 * V)
problem += 2 * (V * 3)
problem
```

### ストリームの論理演算の表記変更

$\LaTeX$ 出力で、ストリームの直和・共通部分をとる時の演算子は$\cup$・$\cap$で表示されるように修正しました。

```{code-cell} ipython3
@jm.Problem.define("Stream Union Example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=N)
    target_a = problem.Natural(less_than=N, ndim=1)
    target_b = problem.Natural(less_than=N, ndim=1)

    problem += jm.sum(x[i] for i in jm.stream(target_a) | jm.stream(target_b))
    
problem
```

## バグ修正

+++

### バグ修正 1：ループ変数への添え字アクセスで型エラーになる問題の修正

タプルを要素とするストリームなどで、ループ変数に `e[1]` のような添え字アクセスを行うと、型エラー `[E-TE0017] An expression of type ElementOf[stream(..)] cannot be subscripted.` が発生する場合があった問題を修正しました。
以下のようなコードは制約検出が有効でも問題なくコンパイルが通るようになりました：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Erroring Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar("x", shape=(N,))
    G = problem.Graph(dtype=N)

    problem += problem.Constraint(
        "even-sources",
        (jm.sum(x[e[1]] for e in G if e[0] % 2 == 0) <= 1),
    )


display(problem)
instance = problem.eval({"N": 3, "G": [(0, 0), (0, 1), (1, 2)]})
```

また、この例では期待される SOS1 制約が検出されるようになりました。

```{code-cell} ipython3
instance.constraint_hints
```

## その他の変更

- コーディングエージェント向けの `jijmodeling` プラグインを追加しました。インストール方法は {doc}`../advanced/agent_plugin_installation` を参照してください。

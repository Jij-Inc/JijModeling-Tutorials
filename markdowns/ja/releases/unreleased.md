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
それに、`axis`が指定された場合、内包表記と部分的な畳み込みの組み合わせで表示されるようになりました。

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

$\LaTeX$ 出力で定数式の簡約を行うようになりました。総和でよく見られる `- 1`などが簡約されるようになり、数式全体の可読性が向上しました。

```{code-cell} ipython3
problem = jm.Problem("TestProblem")
V = problem.Natural("V")
problem += jm.map(lambda x: x, V - 1).sum()
problem
```

## バグ修正

+++

### バグ修正 1：


## その他の変更

- 変更 1：

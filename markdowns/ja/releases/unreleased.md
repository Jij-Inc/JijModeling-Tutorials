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

### `axis`指定メソッドの LaTeX 出力の改善

`axis`が指定された`sum`や`max`などの畳み込み演算は、型情報が明確な場合、内包表記と部分的な畳み込みの組み合わせで表示されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("myproblem")
N = problem.Natural("N")
a = problem.Integer("a", shape=(N, N))
A = problem.NamedExpr("A", a.sum(axis=1))

problem
```

### 定数に対する演算の LaTeX 簡略化

定数に対する演算の $\LaTeX$ 出力に簡略化を適応しました。総和でよく見られる `- 1`などが簡略されるようになり、数式全体の可読性が向上しました。

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

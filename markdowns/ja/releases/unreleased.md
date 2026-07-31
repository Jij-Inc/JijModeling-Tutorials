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

### gendict の LaTeX 出力の改善

`gendict`関数の $\LaTeX$ 出力スタイリングを `genarray`と合わせました。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("gendict example")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
x = problem.BinaryVar("x", dict_keys=K)
Sums = problem.NamedExpr("Sums", jm.gendict(K, lambda k: a[k] * x[k]))


problem
```

## バグ修正

+++

### バグ修正 1：


## その他の変更

- 変更 1：

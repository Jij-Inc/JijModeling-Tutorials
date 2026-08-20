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

### `axis`指定メソッドの LaTeX 出力の改善


`axis`が指定された`sum`や`max`などのメソッドは、型情報が明確な場合、シグマ表記で表示されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("myproblem")
N = problem.Natural("N")
a = problem.Integer("a", shape=(N, N))
A = problem.NamedExpr("A", A.sum(axis=1))

problem
```

## バグ修正

+++

### バグ修正 1：


## その他の変更

- 変更 1：

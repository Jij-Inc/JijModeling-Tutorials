---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### シェイプと生成関数による配列の生成

本バージョンから、{py:func}`~jijmodeling.genarray` 関数により、シェイプと生成関数を指定して配列を生成できるようになりました。
これは numpy の {py:func}`~numpy.fromfunction` と類似の機能です。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("genarray example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=N)
    Sums = problem.NamedExpr(jm.genarray(lambda i, j: a[i, j] * x[i], (N, M)))


problem
```

## バグ修正

+++

### バグ修正1：


## その他の変更

- バージョン条件を緩和し、Python 3.11 以降の任意の Python 3 でのインストールを許容しました。

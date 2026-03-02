---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### `jm.range` 関数の追加

{py:class}`~jijmodeling.Expression` を使用した値シーケンスを表する関数、 {py:func}`jijmodeling.range` を追加しました。使い方は基本的に python 組み込みの {py:class}`range() <range>` と似ています。

例は以下の通りです:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("RangeProblem")
def problem(problem: jm.DecoratedProblem):
    S = problem.Natural()
    F = problem.Natural()
    N = problem.Natural()
    x = problem.BinaryVar(shape=(10,))
    problem += jm.sum(x[i] for i in jm.range(S, F, N))
```

## バグ修正

+++

### 修正：スライス記法内にバグ束縛変数が現れられるように

スライス記法内の束縛変数の扱いを修正し、内包表記や制約の添え字で束縛された変数がスライス記法内で正しく扱われるようになりました。

## その他の変更

- 変更 1：

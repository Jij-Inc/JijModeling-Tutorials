---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
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

### 制約族の定義で singleton list に対する comprehension をした時に `problem.eval()` が失敗するバグの修正

JijModeling 2.5.0 時点で、次の様な問題定義が、JijModeling の型検査は（通過するべくして）通過するものの、 {py:meth}`Problem.eval <jijmodeling.Problem.eval>` を呼び出すと `Could not convert value from function of decision variable to SubscriptItem.` というエラーが発生するバグがありました。

```{code-cell} ipython3
@jm.Problem.define("Min fail")
def min_fail(problem: jm.DecoratedProblem):
    x = problem.BinaryVar("x", shape=(1,))
    problem += problem.Constraint(
        "c", [x[j] == 0 for i in jm.range(1) for j in [i + 0]]
    )
```

本バージョンでは、上記の様な定義に対しても {py:meth}`Problem.eval <jijmodeling.Problem.eval>` が正常に動作するように修正しました。


## その他の変更

- 変更1：

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

### [Type Mismatch エラー](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-TE0004.html)の改善

Type Mismatch エラーが必要に応じて実際に型が合わなかった項を含むようになりました。

```{code-cell} ipython3
import jijmodeling as jm


try:
    @jm.Problem.define("MyProblem")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Length()
        W = problem.Float()
        x = problem.BinaryVar(shape=N)

        problem += x[W] # Error!
except Exception as e:
    print(e)
```

合わせて、エラーコードインデックスの当該エラーの内容がより詳細になりました。

+++

## バグ修正

+++

### バグ修正1：


## その他の変更

-

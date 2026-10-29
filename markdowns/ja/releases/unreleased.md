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

### バグ修正：辞書のキーに対するパターンマッチを含む制約条件が、制約検出時にエラーを引き起こす問題の修正

辞書（`PartialDict` / `TotalDict`）のキーに対して成分ごとに束縛を行う内包表記を含む制約条件があると、制約検出時に予期せぬエラーが発生していた問題を修正しました。
以下のケースではこれまで `E-TE0014` エラーが発生していましたが、本リリースからは問題なく動作するようになりました：

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("onehot", jm.sum(x[i, j] for i, j in c.keys()) == 1)

problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

## その他の変更

- 変更1：

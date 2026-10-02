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

### ランダムインスタンス生成でカテゴリーラベルの要素を直接リストで指定できるように

これまではランダムインスタンス生成でカテゴリーラベルの値を固定する場合、 `{"C": {"keys": ["A", "B", "C"]}}` のように `keys` として指定する必要がありましたが、リストで直接指定できるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
  C = problem.CategoryLabel()

  a = problem.Float(dict_keys=C)
  x = problem.BinaryVar(dict_keys=C)

  problem += (a * x).sum()
 
problem.generate_random_dataset(
    seed=42,
    options={"C": ["A", "B", "C"]} # {"C": {"keys": [...]}} と同値
)
```

リストが利用できるのはカテゴリーラベルのみであり、他のプレースホルダなどについてはこれまで通りの形式で指定する必要があります。

+++

## バグ修正

+++

### バグ修正1：ランダムインスタンス生成にカテゴリーラベルの情報が含まれるように

ランダムインスタンス生成で得られたデータセットにカテゴリーラベルそのものの定義が含まれていなかった問題を修正しました。
これまでは以下の `dataset` には `C` が含まれておらず `eval` に失敗していましたが、本リリースからは問題なく実行されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
  C = problem.CategoryLabel()

  a = problem.Float(dict_keys=C)
  x = problem.BinaryVar(dict_keys=C)

  problem += (a * x).sum()
 
dataset = problem.generate_random_dataset(
    seed=42,
    options={"C": {"keys": ["A", "B", "C"]}}
)

dataset
```

```{code-cell} ipython3
problem.eval(dataset)
```

## その他の変更

- 変更 1：

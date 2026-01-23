---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.0
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# 数理モデルの定式化

前節までの説明を踏まえ、本節ではいよいよ数理モデルの定式化方法について述べます。
決定変数やプレースホルダーについては「{doc}`variables`」で触れていますので、本節では目的関数と制約条件の設定方法について説明します。

```{code-cell} ipython3
import jijmodeling as jm
```

## 目的関数の設定

{py:class}`~jijmodeling.Problem`オブジェクトの生成時に `sense` を {py:attr}`~jijmodeling.ProblemSense.MAXIMIZE` にすると目的関数を最大化する問題、 `sense` を {py:attr}`~jijmodeling.ProblemSense.MINIMIZE` にすると最小化する問題として解釈されます。
Problem オブジェクトが作成された初期段階では目的関数は $0$ として設定され、{py:class}`~jijmodeling.Problem`オブジェクトに対し {py:meth}`+= <jijmodeling.Problem.__iadd__>` 演算子を使って目的関数の項を足していく形で設定します。

:::{admonition} 目的関数の項として受け付ける式の型
:class: important

{py:class}`~jijmodeling.Problem`オブジェクトが目的関数の項として受け付けるのは、数値型の {py:class}`~jijmodeling.Expression`オブジェクトのみです。
配列型や辞書型などの式を足そうとすると型エラーとなるので注意してください。
:::

:::{note}
JijModeling では、目的関数に項を追加することはできても、全体を書き換えたり削除したりすることはできません。
目的関数の項を削除する可能性がある場合は、目的関数の項の一覧を（Python の）リストなどで持っておき、あとからそれを使って目的関数を設定するなどするとよいでしょう。
:::

それでは、ナップザック問題の目的関数を設定してみましょう。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack Problem", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    N = problem.Length(description="# of items")
    x = problem.BinaryVar(shape=(N,), description="$x_i = 1$ if item i is put in the knapsack")
    v = problem.Float(shape=(N,), description="value of each item")
    w = problem.Float(shape=(N,), description="weight of each item")
    W = problem.Float(description="maximum weight capacity of the knapsack")


    # 目的関数: ナップザックに入れたアイテムの価値の総和を最大化
    problem += jm.sum(v[i] * x[i] for i in N)
    # あるいは、ブロードキャストを用いて次のように書いても「同値」
    # problem += jm.sum(v * x)

knapsack_problem
```

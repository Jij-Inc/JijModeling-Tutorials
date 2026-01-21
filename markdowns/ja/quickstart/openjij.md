---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: jijmodeling-tutorial
  language: python
  name: python3
---

# OpenJijで最適化問題を解く

`jijmodeling` の使い方を理解するために、このページではナップサック問題を解いてみましょう。ただし、`jijmodeling` は数理モデルを記述するためのツールであるため、単独では最適化問題を解くことはできません。なので、数理最適化サンプラー[OpenJij](https://tutorial.openjij.org/ja/intro.html)と組み合わせて解くこととします。

`jijmodeling` と OpenJij を組み合わせて使うには、 `ommx-openjij-adapter` ([GitHub](https://github.com/Jij-Inc/ommx/tree/main/python/ommx-openjij-adapter), [PyPI](https://pypi.org/project/ommx-openjij-adapter/)) という Python パッケージをインストールする必要があります。以下のコマンドでインストールしてください。

```bash
pip install ommx-openjij-adapter
```

+++

## 問題設定

ナップサック問題は以下のように数理モデルとして定式化することができます：

$$
\begin{align*}
\mathrm{maximize} \quad & \sum_{i=0}^{N-1} v_i x_i \\
\mathrm{s.t.} \quad & \sum_{i=0}^{N-1} w_i x_i \leq W, \\
& x_{i} \in \{ 0, 1\} 
\end{align*}
$$

:::{hint}
ナップサック問題の定式化について詳しく知りたい場合は [こちら](https://jij-inc.github.io/JijZept-Tutorials/ja/src/02_knapsack.html) を参照してください。
:::

この数理モデルにあるそれぞれのパラメーターの意味は以下の通りです：

| パラメーター | 説明 |
| --- | --- |
| $N$ |	アイテムの総数 |
| $v_{i}$ | アイテム $i$ の価値 |
| $w_{i}$ | アイテム $i$ の重さ |
| $W$ | ナップサックの耐荷重 |

今回の説明では、上記の数理モデルのパラメーター $v_{i}, w_{i}, W$ に、次の値を入力して得られる[インスタンス](what_is_instance_openjij)を解くことを考えます：

| パラメーター | 値 |
| --- | --- |
| $v_{i}$ | `[10, 13, 18, 31, 7, 15]` |
| $w_{i}$ | `[11, 15, 20, 35, 10, 33]` |
| $W$ | `47` |

(what_is_instance_openjij)=
:::{admonition} インスタンスとは
`jijmodeling` では、数理モデルのパラメーターの具体的な値を格納した辞書を"インスタンスデータ"と呼び、数理モデルのパラメーターに具体的な値を入れたものを”インスタンス”と呼んでいます。
:::

+++

## インスタンスの生成手順

`jijmodeling` を使うと、ソルバーに入力するためのインスタンスを次の 3 ステップで生成できます：

1. ナップサック問題を定式化する
2. インスタンスデータを用意する
3. インスタンスを生成する

:::{figure} ../images/model-and-instance-illustrated.svg
:alt: Diagram of the process to generate an instance from a mathematical model
:::

+++

## Step1. ナップサック問題を定式化する

`jijmodeling` を使用してナップサック問題を定式化すると、以下の Python コードになります：

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    # アイテムの総数
    N = problem.Natural("N")
    # アイテムの価値
    v = problem.Natural("v", shape=N)
    # アイテムの重さ
    w = problem.Natural("w", shape=N)
    # ナップサックの耐荷重
    W = problem.Natural("W")
    # アイテムiをナップサックに入れる場合は1, 入れない場合は0を取る決定変数
    x = problem.BinaryVar("x", shape=(N,)) 

    # 目的関数
    problem += jm.sum(v[i] * x[i] for i in N)
    # 制約条件: ナップサックの耐荷重を超えない
    problem += problem.Constraint("重量制限", jm.sum(w[i] * x[i] for i in N) <= W)

knapsack_problem
```

:::{hint}
`jijmodeling` での定式化の方法については詳しく知りたい場合は[こちら](../references/migration_guide_to_jijmodeling2.ipynb)を参照してください。
:::

+++

## Step2. インスタンスデータを用意する

次に、Step1 で定式化した数理モデルのパラメーター $v_i, w_i, W$ のインスタンスデータを用意します。

```{code-cell} ipython3
instance_data = {
    "N": 6,
    "v": [10, 13, 18, 31, 7, 15],  # アイテムの価値のデータ
    "w": [11, 15, 20, 35, 10, 33], # アイテムの重さのデータ
    "W": 47,                       # ナップサックの耐荷重のデータ
}
```

## Step3. インスタンスに変換する

最後に、定式化した数理モデルと用意したインスタンスデータを用いてインスタンスを生成しましょう。

```{code-cell} ipython3
instance = knapsack_problem.eval(instance_data)
```

:::{hint}
`Problem.eval` の返却値は `ommx.v1.Instance` オブジェクトです。詳しくは[こちら](https://jij-inc.github.io/ommx/ja/user_guide/instance.html)を参照してください。
:::

+++

## 最適化問題を解く

では、Step3 で得られたインスタンスを OpenJij のシュミレーテッドアニーリングで解いてみましょう。

```{code-cell} ipython3
from ommx_openjij_adapter import OMMXOpenJijSAAdapter

# OpenJijを介して問題を解き、ommx.v1.Solutionとして解を取得
solution = OMMXOpenJijSAAdapter.solve(
    instance,
    num_reads=100,
    num_sweeps=10,
    uniform_penalty_weight=1.6,
)
```

`OMMXOpenJijSAAdapter` を使えば、`ommx.v1.Instance` で定義されたインスタンスをペナルティ法やログエンコーディングで QUBO/HUBO 形式に変換して解く、という操作を簡単に行うことができます。
また、得られた解は `decision_variable_df` プロパティを使うことで `pandas.DataFrame` オブジェクトとして確認することができます:

```{code-cell} ipython3
df = solution.decision_variables_df
df[df["name"] == "x"][["name", "subscripts", "value"]]
```

:::{note}
`OMMXOpenJijSAAdapter` は内部で QUBO/HUBO 形式への変換を行うため、入力値のインスタンスから決定変数が追加されたり、目的関数が変化しています。そのため、上記のような `pandas.DataFrame` による要素の絞り込みが必要になっています。
:::

+++

:::{hint}
`OMMXPySCIPOptAdapter.solve` の返却値は `ommx.v1.Solution` オブジェクトです。詳しくは[こちら](https://jij-inc.github.io/ommx/ja/user_guide/solution.html)を参照してください。
:::

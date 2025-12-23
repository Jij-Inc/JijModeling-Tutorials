---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# OpenJijで最適化問題を解く

`jijmodeling` の使い方を理解するために、このページではナップサック問題を解いてみましょう。ただし、`jijmodeling` は数理モデルを記述するためのツールであるため、単独では最適化問題を解くことはできません。なので、数理最適化サンプラー[OpenJij](https://tutorial.openjij.org/ja/intro.html)と組み合わせて解くこととします。

`jijmodeling` とOpenJijを組み合わせて使うには、 `ommx-openjij-adapter` ([GitHub](https://github.com/Jij-Inc/ommx/tree/main/python/ommx-openjij-adapter), [PyPI](https://pypi.org/project/ommx-openjij-adapter/)) というPythonパッケージをインストールする必要があります。以下のコマンドでインストールしてください。

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

今回の説明では、上記の数理モデルのパラメーター $v_{i}, w_{i}, W$ に、次の値を入力して得られる[インスタンス](what_is_instance)を解くことを考えます：

| パラメーター | 値 |
| --- | --- |
| $v_{i}$ | `[10, 13, 18, 31, 7, 15]` |
| $w_{i}$ | `[11, 15, 20, 35, 10, 33]` |
| $W$ | `47` |

(what_is_instance)=
:::{admonition} インスタンスとは
`jijmodeling` では、数理モデルのパラメーターの具体的な値を格納した辞書を"インスタンスデータ"と呼び、数理モデルのパラメーターに具体的な値を入れたものを”インスタンス”と呼んでいます。
:::

+++

## インスタンスの生成手順

`jijmodeling` を使うと、ソルバーに入力するためのインスタンスを次の3ステップで生成できます：

1. ナップサック問題を定式化する
2. インスタンスデータを用意する
3. インスタンスを生成する

![Diagram of the process to generate an instance from a mathematical model](./assets/scip_01.png)

+++

## Step1. ナップサック問題を定式化する

`jijmodeling` を使用してナップサック問題を定式化すると、以下のPythonコードになります：

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    # アイテムの価値
    v = problem.Natural("v", ndim=1)
    # アイテムの重さ
    w = problem.Natural("w", ndim=1)
    # ナップサックの耐荷重
    W = problem.Natural("W")
    # アイテムの総数
    N = v.len_at(0, latex="N")
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

次に、Step1で定式化した数理モデルのパラメーター $v_i, w_i, W$ のインスタンスデータを用意します。

```{code-cell} ipython3
instance_data = {
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

では、Step3で得られたインスタンスを最適化サンプラーOpenJijで解いてみましょう。以下のPythonコードで目的関数の複数の解（サンプルセット）を得ることができます:

```{code-cell} ipython3
from ommx_openjij_adapter import OMMXOpenJijSAAdapter

# OpenJijを介して問題を解き、ommx.v1.SampleSetとしてサンプルセットを取得
sample_set = OMMXOpenJijSAAdapter.sample(instance, num_reads=10, uniform_penalty_weight=5)

sample_set.summary
```

上記のコードは`openjij`のシミュレーテッドアニーリングを使用しており、`num_reads=10`は10回サンプリングすることを示しています。`num_reads`の値を増やすことで複数回サンプリングできます。

+++

:::{hint}
`OMMXOpenJijSAAdapter.sample` の返却値は `ommx.v1.SampleSet` です。詳しくは [こちら](https://jij-inc.github.io/ommx/python/ommx/autoapi/ommx/v1/index.html#ommx.v1.SampleSet)を参照してください。
:::

+++

`ommx.v1.SampleSet.best_feasible`をもちいてインスタンスに入っている制約条件を満たす解 (実行可能解)の中で目的関数の値が最大 (最も大きい) となるものを選びます。

以下のPythonコードで目的関数の最適値を得ることができます:

```{code-cell} ipython3
# サンプルセットから最良の実行結果を取得
solution = sample_set.best_feasible_unrelaxed

print(f"目的関数の最適値: {solution.objective}")
```

また、`solution` の `decision_variables_df` プロパティを使うことで `pandas.DataFrame` オブジェクトとして決定変数の状態を表示できます:

```{code-cell} ipython3

df = solution.decision_variables_df
df[df["name"] == "x"][["name", "subscripts", "value"]]
```

:::{hint}
`ommx.v1.SampleSet.best_feasible` の返却値は `ommx.v1.Solution` オブジェクトです。詳しくは[こちら](https://jij-inc.github.io/ommx/ja/user_guide/solution.html)を参照してください。
:::

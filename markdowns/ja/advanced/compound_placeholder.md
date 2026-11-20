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

# 複合型プレースホルダーによる不定形データの表現

JijModeling 2.12.0 以降では、辞書、配列、タプルなどがネストした複雑な形のプレースホルダーを宣言できるようになっています。
このようなプレースホルダーを**複合型プレースホルダー**と呼びます。
現時点において、複合型プレースホルダーは {py:meth}`Problem.Placeholder <jijmodeling.Problem.Placeholder>` 構築子に渡す `dtype` キーワード引数にネストした {py:class}`jm.DataType <jijmodeling.DataType>` を渡すことで定義できます。
現時点では、以下のような複合型の {py:class}`~jijmodeling.DataType` が宣言できます：

| 構築子 | 意味 |
| :---- | :--- |
| {py:meth}`jm.DataType.STREAM[T] <jijmodeling.DataType.STREAM>` | `T` 型の値を要素に持つ{doc}`ストリーム型 <../basics/folding_and_stream.md>` |
| `(T1, ..., Tn)` または {py:meth}`tuple[T1, ..., Tn] <tuple>` | `T1`, ..., `Tn` 型の値を各成分に持つタプル型 |
| {py:meth}`jm.DataType.PARTIAL_DICT[K, V] <jijmodeling.DataType.PARTIAL_DICT>` | キー集合が `K` 型、値が `V` 型の部分辞書型 |
| {py:meth}`jm.DataType.TOTAL_DICT[K, V] <jijmodeling.DataType.TOTAL_DICT>` | キーが `K` 型、値が `V` 型の全域辞書型 |

辞書のキー型 `K` に現れることができる型は、通常の辞書のキーに使うことができるものと同じです。
`V` や `T` については、`dtype` キーワード引数と同じ任意の型指定子を指定することができます。
また、現時点では多次元配列を宣言する方法はありませんが、外側が配列であるものは `ndim` や `shape` キーワード引数などと組み合わせることで、一番外側の配列の宣言ができます。
以下は、$L$と整数のタプルを要素に持つストリームからなる二次元配列プレースホルダー $A$ を宣言している例です：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    M = problem.Natural()
    L = problem.CategoryLabel()

    A = problem.Placeholder(shape=(N, M), dtype=jm.DataType.STREAM[(L, int)])


problem
```

それでは、より現実的な最適化問題の例を通じて、複合型プレースホルダーによる不定形のデータ構造の表現方法を見ていきましょう。

## 問題設定：割り当て制限のある複数ナップサック問題

ここではナップサックが複数あり、それぞれごとに割り当てられるアイテムに制限があるような、ナップサック問題の変種を考えてみましょう。
アイテムの集合に相当するカテゴリーラベルを $\mathrm{Item}$ とし、各アイテムの価値および重さが、それぞれ $v_i$、$w_i$ で与えられているとします。
また、$N$ 個のナップサックについて、それぞれの耐荷重が $W_n$、各ナップサックが収容できるアイテムのリストが $\mathrm{avail}_n$ として与えられているとします。
各アイテムは高々一つのナップサックにしか収容されないものとして、アイテム $i$ がナップサック $n$ に収容されるかどうかを表すバイナリ決定変数 $x_{i,n}$ を使って、収容するアイテムの価値の合計を最大化しましょう。

特に、各ナップサックの収容できるアイテムの一覧$\mathrm{avail}_n$は、$n$によって要素数が異なる不定形になっています。
旧来の JijModeling では、このような不定形のデータはしばしば Jagged Array を使って表現されていましたが、シェイプが一定でないため、配列の要素外アクセスが起きないことを静的に保証できないという弱点があり、このような理由から、JijModeling 2 では Jagged Array は非推奨となっていました。
本稿では、不定な軸に対する添字のアクセスを諦めるかわりに、複合型プレースホルダーを用いることでより安全な形でこのような不定形のデータ構造を表現する方法を紹介します。

まずは必要なプレースホルダーを宣言しましょう。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Multiple Knapsack Problem", sense=jm.ProblemSense.MAXIMIZE)
def problem(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel(description="アイテム", element_latex=r"\ell")
    N = problem.Natural(description="ナップサックの数", element_latex=r"n")
    v = problem.Float(dict_keys=L, description="アイテムの価値")
    w = problem.Float(dict_keys=L, description="アイテムの重さ")

    W = problem.Float(shape=N, description="ナップサックの耐荷重")
    avail = problem.Placeholder(
        shape=N,
        dtype=jm.DataType.STREAM[L],
        description="各ナップサックが収容できるアイテムのリスト",
        latex=r"\mathrm{avail}",
    )


problem
```

$\mathrm{avail}$ がまさに複合型プレースホルダーとして定義されています。
特に、長さ$N$の一次元配列であって、その各要素がアイテムからなるストリームであるように宣言されています。
ストリームに対しては $n$ 番目のアイテムへのアクセスといったようなことはできませんが、今回の用途ではそのようなランダムアクセスは不要なので、このように宣言することで型検査の恩恵を受けつつ、不定形のデータ構造を宣言することができているのです。

これを使って、各ナップサックが収容可能なアイテムに対応する部分だけで定義された決定変数 $x_{\ell,n}$ を定義してみましょう。

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem, avail: jm.Placeholder):
    domain = problem.NamedExpr(
        jm.stream((l, n) for n, items in avail.enumerate() for l in items),
        element_latex=[r"\ell", r"n"],
    )
    x = problem.BinaryVar(
        dict_keys=domain,
        description=r"$x_{\ell,n} = 1$の時に限り、アイテム$\ell$をナップサック$n$に収容する",
    )


problem
```

以上の定義があれば、それぞれの制約と目的関数は以下のようにして設定できます：

```{code-cell} ipython3
@problem.update
def _(
    problem: jm.DecoratedProblem,
    x: jm.DecisionVar,
    L: jm.CategoryLabel,
    N: jm.Placeholder,
    v: jm.Placeholder,
    avail: jm.Placeholder,
    w: jm.Placeholder,
    W: jm.Placeholder,
):
    problem += problem.Constraint(
        "one-knapsack",
        [jm.sum(x[l, n] for l2, n in x.keys() if l2 == l) <= 1 for l in L],
    )
    problem += problem.Constraint(
        "weight", [jm.sum(w[l] * x[l, n] for l in avail[n]) <= W[n] for n in N]
    )

    problem += jm.sum(v[l] * x[l, n] for l, n in x.keys())


problem
```

`one-knapsack` 制約は各アイテムは最大で 1 つのナップサックにしか収容されないことを、`weight` 制約は各ナップサック内のアイテムが耐荷重を越えないことを要求しています。

実際に適当なデータで求解してみましょう：

```{code-cell} ipython3
instance_data = {
    "w": {
        "Apple": 2.4,
        "iPhone": 2.4,
        "Gold": 7.8,
        "Mac Mini": 9.7,
        "ChatGPT": 2.1,
    },
    "W": [29, 42, 14],
    "avail": [
        ["Mac Mini"],
        ["ChatGPT", "Mac Mini", "Apple", "Gold"],
        ["ChatGPT", "Mac Mini", "iPhone"],
    ],
    "N": 3,
    "v": {
        "Apple": 5,
        "iPhone": 7.8,
        "Gold": 3,
        "Mac Mini": 8,
        "ChatGPT": 1,
    },
    "L": ["Apple", "iPhone", "Gold", "Mac Mini", "ChatGPT"],
}

instance_data
```

```{code-cell} ipython3
from ommx_pyscipopt_adapter import OMMXPySCIPOptAdapter

instance = problem.eval(instance_data)
solution = OMMXPySCIPOptAdapter.solve(instance)

solution.decision_variables_df
```

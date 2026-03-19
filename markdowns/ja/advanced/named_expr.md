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

# 式の命名とインスタンスへの保存

JijModeling には特定の式に名前をつける機能があり、以下のような場面で効力を発揮します：

1. 複雑な式に対し名前をつけて、数式出力を見やすくする
2. 目的関数の部分項など、求解後に値を確認したい式の情報を OMMX に保存させ、自動的に評価させる

本節では、これらの用途を念頭に JijModeling で名前つきの式を定義する方法について説明します。

## {py:class}`~jijmodeling.NamedExpr` クラス

JijModeling では、名前つきの式を表すクラスとして {py:class}`~jijmodeling.NamedExpr` クラスが提供されています。
決定変数やプレースホルダーと同様に、{py:meth}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` メソッドを使って宣言することができます。
{py:meth}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` は以下の引数を取ります：

| 引数 | 型 | 説明 |
| :-- | :--: | :-- |
| `name` | `str` | 名前つき式の名前。Decorator API では省略可能。 |
| `definition` | 必須。{py:data}`~jijmodeling.ExpressionLike` | 名前つき式の定義。JijModeling の式オブジェクトや、Python の数値、文字列、タプル、リスト、辞書、NumPy 配列など、式に変換可能なオブジェクトを指定できます。 |
| `description` | `Optional[str]` | 省略可。名前つき式の説明。数式出力や OMMX に保存される式の説明に使用されます。 |
| `latex` | `Optional[str]` | 省略可。名前つき式の $\LaTeX$ 表現。数式出力時に使用されます。 |
| `save_in_ommx` | `bool` | 省略可（デフォルト：`False`）。`True` にすると、後述する条件を満たす場合、OMMX インスタンスに {py:class}`ommx.v1.NamedFunction` として保存されます。 |

例を見てみましょう。ナップサック問題において、アイテム数$N$をインスタンスデータとして与えるのではなく、各アイテムの重さを表すプレースホルダー配列 $w$ の長さから推論することを考えます。
まずは、{py:meth}`~jijmodeling.Problem.NamedExpr` を使わずに定式化すると以下のようになります：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (Unnamed)", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_unnamed(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    N = w.len_at(0)
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack_unnamed
```

期待通り $W, w, v$ のみの三つのインスタンスデータを与えればよいようになっていますが、$N$ の定義式 `len_at(w, 0)` が定義中で展開されてしまっており、特に総和の範囲などがみづらくなっています。
そこで、$N$ を {py:meth}`~jijmodeling.Problem.NamedExpr` を使って定義してみましょう：

```{code-cell} ipython3
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    # N が NamedExpr に 包まれている！
    N = problem.NamedExpr(w.len_at(0), description="Length of w")
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack
```

末尾の `Named Expressions` 節に $N$ の定義式が現れ、残りの数式中でも$N$として表示されるようになりました。
また、問題に対する `NamedExpr` の一覧辞書を `problem.named_exprs` で確認することができます：

```{code-cell} ipython3
knapsack.named_exprs
```

$N$ は JijModeling のモデル中では独立した変数として扱われますが、インスタンスへのコンパイル時には自動的に定義が展開され、NamedExpr を使わない場合と同値なインスタンスが得られます。

```{code-cell} ipython3
knapsack_instance_data = {
    "v": [10, 13, 18, 31, 7, 15],
    "w": [11, 15, 20, 35, 10, 33],
    "W": 47,
}

instance_named = knapsack.eval(knapsack_instance_data)
instance_unnamed = knapsack_unnamed.eval(knapsack_instance_data)

assert instance_named.objective.almost_equal(instance_unnamed.objective)
assert instance_named.constraints[0].function.almost_equal(
    instance_unnamed.constraints[0].function
)
```

## {py:class}`~jijmodeling.NamedExpr` の OMMX インタンスへの保存

:::{admonition} OMMX v2.5.0 以降で利用可能
:class: important

以下で説明する保存機能の前提となる機能が OMMX v2.5.0 で追加されています。そのため、保存機能を利用する場合は、OMMX v2.5.0 以降をご利用ください。
:::

上の例では {py:class}`~jijmodeling.NamedExpr` の定義式にはプレースホルダーしか現れませんでしたが、実際には任意の式に名前をつけることができ、特に決定変数が現れるような式も命名することができます。
また、上述の通り `save_in_ommx` を `True` に設定すると、特定の条件を満たす場合 OMMX インスタンスに {py:class}`ommx.v1.NamedFunction` として保存されます。
{py:class}`ommx.v1.NamedFunction` は OMMX における {py:class}`jijmodeling.NamedExpr` の対応物であり、特に OMMX の関数（{py:class}`ommx.v1.Function`）＝「決定変数に関する実数値の関数」（以下**スカラー式**と呼びます）に名前をつけて保存することができるものです。
また、求解後の {py:class}`ommx.v1.Solution` オブジェクトでは、決定変数の値に基づいて自動的に値が計算されるという特徴もあります。

以上を踏まえ、`save_in_ommx=True` により OMMX インスタンスに保存できる条件は以下のいずれかです：

1. スカラー式
2. スカラー式を成分に持つ配列または辞書である
   - この場合、式は添え字ごとに個別の NamedFunction として分解されて保存されます。

上記以外の式に対して `save_in_ommx=True` が指定された場合、以下のように `NamedExpr` の宣言時に例外となります。

```{code-cell} ipython3
problem = jm.Problem("Errornous Problem")
N = problem.Natural("N")
try:
    # bool 式を保存しようとしてみる
    problem.NamedExpr("bool", N == 2, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
L = problem.CategoryLabel("L")
try:
    # カテゴリラベルのリストを保存しようとしてみる
    problem.NamedExpr("category_labels", L, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
x = problem.BinaryVar("M", shape=(N, N, N))

try:
    # x の「内側の配列」からなる配列を保存しようとしてみる
    # これは「スカラー式の二次元配列」から成る一次元配列となり、
    # 現状の JijModeling ではネストされた配列の OMMX への保存には対応していないためエラーとなる
    problem.NamedExpr("array_of_array", x.rows(), save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
# x 自身は単なる（ネストしていない）三次元配列なので、問題なく保存できる
problem.NamedExpr("threed", x, save_in_ommx=True)
```

一方で、`save_in_ommx` を指定しないか `False` を指定した場合には、こうした式も問題なく `NamedExpr` として宣言することができます。

+++

例を見てみましょう。ナップサック問題において、評価後に実際にナップサックに入れられたアイテムの総重量や、個別のアイテムの単位重さ当りの価値の寄与を知りたかったとします。

```{code-cell} ipython3
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_weight(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    N = problem.NamedExpr(w.len_at(0), description="Length of w")
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )
    total_weight = problem.NamedExpr(
        jm.sum(w[i] * x[i] for i in N),
        description="Total weight of items in the knapsack",
        save_in_ommx=True,
    )
    problem.NamedExpr(
        "V",
        v / w * x,
        description="Contribution of each item to the value per unit weight",
        save_in_ommx=True,
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", total_weight <= W)


knapsack_weight
```

総重みの項を `total_weight`、個別のアイテムの寄与を `V` という名前つき式に束縛し、`save_in_ommx=True` として OMMX インスタンスに保存させています。
まずはコンパイラを作成し、インスタンスを生成してみましょう。

```{code-cell} ipython3
compiler = jm.Compiler.from_problem(knapsack_weight, knapsack_instance_data)
instance = compiler.eval_problem(knapsack_weight)
```

インスタンスに含まれる `NamedFunction` の一覧は {py:meth}`ommx.v1.Instance.named_functions` や {py:meth}`ommx.v1.Instance.named_functions_df` プロパティで確認することができます：

```{code-cell} ipython3
instance.named_functions_df
```

個別の NamedExpr に対応する NamedFunction の情報を得たい場合、{py:meth}`Compiler.get_named_function_id_by_name() <jijmodeling.Compiler.get_named_function_id_by_name>` メソッドに `NamedExpr` の名前を与えると、`save_in_ommx=True`の場合は添え字（スカラー式の場合は `()` のみ）から `NamedFunction` の ID への辞書が得られます：

```{code-cell} ipython3
contrib_dict = compiler.get_named_function_id_by_name("V")
print(contrib_dict)
assert contrib_dict is not None
instance.get_named_function_by_id(contrib_dict[(0,)])
```

一方、 `N` のように `save_in_ommx=False` の場合は、`NamedFunction` として保存されないため、`get_named_function_id_by_name()` は `None` を返します：

```{code-cell} ipython3
assert compiler.get_named_function_id_by_name("N") is None
```

それでは、これを OpenJij で解き、解の中の `total_weight` の値を確認してみましょう：

```{code-cell} ipython3
from ommx_openjij_adapter import OMMXOpenJijSAAdapter

solution = OMMXOpenJijSAAdapter.solve(
    instance,
    num_reads=100,
    num_sweeps=10,
    uniform_penalty_weight=1.6,
)

solution.named_functions_df
```

こうして解に対応する総重量や個別のアイテムの寄与の値が得られました。
今回のように単純な場合であれば、`weight` constraint の `value` の値を `W` と比較することで総重量を確認することもできます。
こうした用途の他にも、目的関数の一部の項の評価値を確認したい場合など、今回のように `NamedExpr` を OMMX インスタンスに保存すると便利なケースがあります。

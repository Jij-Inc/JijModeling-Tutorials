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

JijModeling では、名前つきの式を表すクラスとして {py:class}`~jijmodeling.NamedExpr` クラスが提供されており、
決定変数やプレースホルダーと同様に、 {py:meth}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` メソッドを使って宣言することができます。
{py:meth}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` の引数は以下の通りです。

| 引数 | 型 | 説明 |
| :-- | :--: | :-- |
| `name` | `str` | 名前つき式の名前。Decorator API では省略可能。 |
| `definition` | 必須。{py:data}`~jijmodeling.ExpressionLike` | 名前つき式の定義。JijModeling の式オブジェクトや、Python の数値、文字列、タプル、リスト、辞書、NumPy 配列など、式に変換可能なオブジェクトを指定できます。 |
| `description` | `Optional[str]` | 省略可。名前つき式の説明。数式出力や OMMX に保存される式の説明に使用されます。 |
| `latex` | `Optional[str]` | 省略可。名前つき式の $\LaTeX$ 表現。数式出力時に使用されます。 |
| `save_in_ommx` | `bool` | 省略可（デフォルト：`False`）。`True` にすると、後述する条件を満たす場合、OMMX インスタンスに {py:class}`ommx.v1.NamedFunction` として保存されます。 |

{py:class}`~jijmodeling.NamedExpr` には、以下の 2 つの使い方があります。

1. 特定の式に対して名前をつけて $\LaTeX$ 表示を見やすくする
2. 特定の式を OMMX インスタンスに保存して求解後にその式の値を評価する

本ドキュメントでは、 {py:class}`~jijmodeling.NamedExpr` のこれらの使い方について具体例を交えながら説明していきます。

+++

# 式の命名

特定の式に対して名前をつけて $\LaTeX$ 表示を見やすくする例を見てみましょう。ナップサック問題において、アイテム数 $N$ をインスタンスデータとして与えるのではなく、各アイテムの重さを表すプレースホルダー配列 $w$ の長さから推論することを考えます。
まずは、 {py:meth}`~jijmodeling.Problem.NamedExpr` を使わずに定式化すると以下のようになります。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack (Unnamed)", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_unnamed(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    # w の長さから N を推論させる
    N = w.len_at(0)
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack_unnamed
```

$\LaTeX$ 表示を見るとわかる通り、$N$ の定義式 `len_at(w, 0)` が定義中で展開されてしまっており、特に総和の範囲などがみづらくなっています。
そこで、$N$ を {py:meth}`~jijmodeling.Problem.NamedExpr` を使って定義してみましょう。

```{code-cell} ipython3
@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack(problem: jm.DecoratedProblem):
    W = problem.Float(description="maximum weight capacity of the knapsack")
    w = problem.Float(ndim=1, description="weight of each item")
    # w の長さに対して NamedExpr を利用して N という名前をつける
    N = problem.NamedExpr(w.len_at(0), description="Length of w")
    v = problem.Float(shape=(N,), description="value of each item")
    x = problem.BinaryVar(
        shape=(N,), description="$x_i = 1$ if item i is put in the knapsack"
    )

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", jm.sum(w[i] * x[i] for i in N) <= W)


knapsack
```

末尾の `Named Expressions` 節に $N$ の定義式が現れ、残りの数式中でも $N$ として表示されるようになり、$\LaTeX$ 表示としても見やすくなりました。

+++

また、 {py:meth}`~jijmodeling.Problem.NamedExpr` で定義された $N$ は JijModeling の数理モデルの中では変数の一種として扱われますが、コンパイル時に自動で展開されるため、 {py:meth}`~jijmodeling.Problem.NamedExpr` の有無で OMMX インスタンスが変わることはありません。

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

:::{tip}
数理モデルに登録されている {py:class}`~jijmodeling.NamedExpr` の一覧は、 {py:meth}`jijmodeling.Problem.named_exprs` で確認できます。
:::

+++

## インタンスへの保存

{py:class}`~jijmodeling.Problem.NamedExpr` の `save_in_ommx` 引数に `True` を設定することで、以下の条件を満たす場合に限り、その式を OMMX インスタンスに保存することができます。

1. 取りうる値がスカラーである式
2. 取りうる値がスカラーである式の配列
3. 取りうる値がスカラーである式の辞書

具体的には、以下のような式が OMMX インスタンスに保存できます。

```{code-cell} ipython3
# 取りうる値がスカラーである式（例: バイナリ変数の和）
problem = jm.Problem("Scalar")
x = problem.BinaryVar("x", shape=(5,))
S = problem.NamedExpr("scalar", x.sum(), save_in_ommx=True)
problem
```

```{code-cell} ipython3
# 取りうる値がスカラーである式の配列（例: 整数変数の配列の差）
problem = jm.Problem("Tensor of Scalars")
y = problem.IntegerVar("y", shape=(5,), lower_bound=0, upper_bound=10)
z = problem.IntegerVar("z", shape=(5,), lower_bound=0, upper_bound=10)
T = problem.NamedExpr("tensor_of_scalars", y - z, save_in_ommx=True)
problem
```

```{code-cell} ipython3
# 取りうる値がスカラーである式の辞書（例: プレースホルダと実数変数の辞書の積）
problem = jm.Problem("Dict of Scalars")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
w = problem.ContinuousVar("w", dict_keys=K, lower_bound=0, upper_bound=10)
U = problem.NamedExpr("dict_of_scalars", a * w, save_in_ommx=True)
problem
```

一方で、以下のような式は OMMX インスタンスに保存できません。

```{code-cell} ipython3
problem = jm.Problem("Errornous Problem")
```

```{code-cell} ipython3
# 比較式は保存できない
a = problem.IntegerVar("a", lower_bound=0, upper_bound=10)
try:
    problem.NamedExpr("comparison", a == 2, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
# カテゴリラベルは保存できない
L = problem.CategoryLabel("L")
try:
    problem.NamedExpr("category_labels", L, save_in_ommx=True)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
# rows() は配列の配列を返すので保存できない
x = problem.BinaryVar("M", shape=(5, 5))
try:
    problem.NamedExpr("array_of_array", x.rows(), save_in_ommx=True)
except Exception as e:
    print(e)
```

:::{tip}
これらの OMMX インスタンスに保存できない式についても、 `save_in_ommx=False`（あるいは、未指定）にすれば `NamedExpr` として宣言することができます。 
:::

+++

では、特定の式を OMMX インスタンスに保存して求解後にその式の値を評価する例を見てみましょう。ナップサック問題において、目的関数であるアイテムの価値の合計だけでなく、アイテムの総重量を知りたいというケースを考えます。

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

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += problem.Constraint("Weight", total_weight <= W)


knapsack_weight
```

上記のコードでは、総重量の式に `total_weight` という名前をつけ、`save_in_ommx=True` により OMMX インスタンスの保存を有効にしています。さて、この数理モデルをコンパイルして OMMX インスタンスを生成してみましょう。

```{code-cell} ipython3
instance = knapsack_weight.eval(knapsack_instance_data)
```

OMMX インスタンスに保存された式は、 {py:meth}`ommx.v1.Instance.named_functions` や {py:meth}`ommx.v1.Instance.named_functions_df` プロパティで確認することができます。

```{code-cell} ipython3
instance.named_functions_df
```

:::{tip}
OMMX インスタンスに保存された式に対応する NamedFunction の ID を得るには、{py:meth}`Compiler.get_named_function_id_by_name() <jijmodeling.Compiler.get_named_function_id_by_name>` メソッドを利用してください。
:::

+++

それでは、この OMMX インスタンスを OpenJij で解き、得られた解における `total_weight` の値を確認してみましょう。

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

確かに OMMX インスタンスに保存した式 `total_weight` の値を評価することができました。
このような用法以外にも、特定の式を OMMX インスタンスに保存する機能は、加重方式の多目的最適化を扱う場合などに利用できる便利なものとなっています。

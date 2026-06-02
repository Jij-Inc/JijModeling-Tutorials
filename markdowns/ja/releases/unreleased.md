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

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### Decorator API における `jm.min`、`jm.max`、`jm.set` の内包表記サポート

旧来は、Decorator API を利用する際に内包表記（Python のジェネレータ式）を引数として受け取れるのは {py:func}`jm.sum <jijmodeling.sum>` と {py:func}`jm.prod <jijmodeling.prod>` のみでした。

本バージョンから、{py:func}`jm.min <jijmodeling.min>`、{py:func}`jm.max <jijmodeling.max>`、{py:func}`jm.set <jijmodeling.set>` の一引数呼び出しでも、同様に内包表記を受け取れるようになりました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("min/max/set comprehension example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=N)

    nonzero = jm.set(i for i in N if i != 0)
    problem += jm.min(x[i] for i in N) + jm.max(x[i] for i in nonzero)


problem
```

### 数式出力：制約の添え字が読みやすく

辞書や配列同士の直接比較による制約条件が、$\LaTeX$ 出力では $\forall$ を使って出力されるようになり、可読性が向上しました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("container-vs-scalar-comp")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(shape=N)
    y = problem.BinaryVar(dict_keys=(L, N - 1))
    z = problem.BinaryVar(dict_keys=(L, N - 1))

    problem += problem.Constraint("scalar-vs-tensor", 1 <= x)
    problem += problem.Constraint("tensor-vs-tensor", x <= x)
    problem += problem.Constraint("dict-vs-scalar", y <= 5)
    problem += problem.Constraint("dict-vs-dict", y <= z)


problem
```

### `Placeholder` の `dtype` に上限付き自然数とカテゴリーラベルを指定できるように

{py:meth}`Problem.Placeholder <jijmodeling.Problem.Placeholder>`（および `Graph`、`PartialDict`、`TotalDict` などの型付き構築子）の `dtype` 引数は、これまで `jm.DataType`、NumPy のスカラー型、あるいはそれらから構成されるタプルに限られていました。
本バージョンから、`dtype` には次のものも追加で指定できるようになりました：

- 自然数式 `n`：値が `n` より真に小さい自然数（すなわち $\{0, 1, \dots, n - 1\}$ のいずれか）であることを表します。`n` には Python の整数リテラルのほか、自然数型の他のプレースホルダーや {py:class}`~jijmodeling.NamedExpr` などの式も渡せます。
- {py:class}`~jijmodeling.CategoryLabel` `L`：値が `L` のラベルのうちのいずれかであることを表します。
- 上記（あるいは他の指定可能な `dtype`）を要素とするタプル `(T, T, ...)`。

たとえば、以下の、無向グラフ $G = (V, E)$ についての最適化問題を考えます。以前のバージョンでは辺の端点の型は単なる自然数として宣言する必要がありましたが、本リリースから、端点が $[0, V)$ の範囲に収まることを `dtype` を通じて表現できるようになりました：

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("max cut", sense=jm.ProblemSense.MAXIMIZE)
V = problem.Natural("V")
# `E` の各要素が `[0, V)` のペアであることを直接宣言できるようになりました
# （従来は dtype=(jm.DataType.Natural, jm.DataType.Natural) と書く必要がありました）。
# この宣言は、 `problem.graph("E", dtype=V)` と書くこともできます。
E = problem.Placeholder("E", dtype=(V, V), ndim=1)
x = problem.BinaryVar("x", shape=(V,))
problem += jm.map(lambda u, v: (x[u] - x[v]) ** 2, E).sum()

problem
```

また、グラフの頂点にラベルを用いる場合を想定して、{py:class}`~jijmodeling.CategoryLabel` をそのまま `dtype` として指定することもできるようになりました。
以下の例は、ラベルが頂点として使われるグラフの上で（{py:meth}`Problem.Graph` を用いて）同じ問題を定義するものです。

```{code-cell} ipython3
problem = jm.Problem("max cut on a labeled graph", sense=jm.ProblemSense.MAXIMIZE)
L = problem.CategoryLabel("L")
edges = problem.Graph("edges", dtype=L)
x = problem.BinaryVar("x", dict_keys=L)
problem += jm.map(lambda u, v: (x[u] - x[v]) ** 2, edges).sum()

compiler = jm.Compiler.from_problem(
    problem,
    {
        "L": ["A", "B", "C"],
        "edges": [("A", "B"), ("B", "C"), ("C", "A")],
    },
)
instance = compiler.eval_problem(problem)
```

インスタンスデータとして与えられた値が宣言された `dtype` と整合しない場合（たとえば、頂点インデックスが `V` 以上であったり、`L` に含まれないラベルが渡されたりした場合）、コンパイラは範囲外エラーを報告します。

+++

### 目的関数を代入で再設定できるように

これまで目的関数は {py:meth}`+= <jijmodeling.Problem.__iadd__>` による加算で設定していましたが、本バージョンから {py:attr}`Problem.objective <jijmodeling.Problem.objective>` に直接代入して置き換えられるようになりました。
{py:class}`~jijmodeling.DecoratedProblem` でも同じように `problem.objective = ...` と書けます。

たとえば、一度設定した目的関数を別の式に置き換えたり、`problem.objective = 0` として目的関数を明示的にリセットしたりできます。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("set objective example")
x = problem.BinaryVar("x")
y = problem.BinaryVar("y")

problem.objective = x
problem.objective = y
problem.objective = 0


@problem.update
def _(problem: jm.DecoratedProblem):
    z = problem.BinaryVar()
    problem.objective = z


problem
```

## バグ修正

+++

### 添え字の要素と数値型の演算に失敗していたバグの修正

以下のように `Constraint` の添え字の要素に対する数値演算が誤って型エラーとして判定されていた問題を修正しました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Example")
def problem(problem: jm.DecoratedProblem):
    K = problem.Float(ndim=1)
    x = problem.BinaryVar()
    problem += problem.Constraint("c", [k * x <= 0 for k in K])


problem
```

### `product` や `filter` の絡む数式出力を改善

旧来は `product` や `filter` などを含む式が場合によって複雑な式として表示されていましたが、内包表記を使った読みやすい出力がされるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("product and filter example")
N = problem.Natural("N")
M = problem.Natural("M")
x = problem.BinaryVar("x", shape=(N, M))
jm.product(N, M).filter(lambda i, j: i == j)
```

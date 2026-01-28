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

:::{tip}
説明の便宜上、以下では目的関数→制約条件の順に扱いますが、実際のコードでは任意の順番で更新を行うことができます。
:::

## 目的関数の設定

{py:class}`~jijmodeling.Problem`オブジェクトの生成時に `sense` を {py:attr}`~jijmodeling.ProblemSense.MAXIMIZE` にすると目的関数を最大化する問題、 `sense` を {py:attr}`~jijmodeling.ProblemSense.MINIMIZE` にすると最小化する問題として解釈されます。
Problem オブジェクトが作成された初期段階では目的関数は $0$ として設定され、{py:class}`~jijmodeling.Problem`オブジェクトに対し {py:meth}`+= <jijmodeling.Problem.__iadd__>` 演算子を使って目的関数の項を足していく形で設定します。
{py:class}`~jijmodeling.Problem`オブジェクトが目的関数の項として受け付けるのは、数値型の {py:class}`~jijmodeling.Expression`オブジェクトのみです。
配列型や辞書型などの式を足そうとすると型エラーとなるので注意してください。

また、JijModeling では、目的関数に項を追加することはできても、全体を書き換えたり削除したりすることはできません。
特に、`+=` による目的関数の「追加」は新たな項の「追加」として振る舞い、既存の項を別の項で置き換えるものではありません。
次の例を考えます。ここではまず、$x$のみを項に持つ目的関数を設定しています。

```{code-cell} ipython3
problem = jm.Problem("Sample")
x = problem.BinaryVar("x")
problem += x

problem
```

更に、新たな決定変数 $y$ を定義し、目的関数に $y$ を追加してみましょう。

```{code-cell} ipython3
y = problem.BinaryVar("y")
problem += y

problem
```

既存の項が置き換えられたのではなく、$y$ が加算され $x + y$ が新たな目的関数となっていることが分かります。
目的関数の項を削除したい場合、目的関数の項の一覧を（Python の）リストなどで持っておき、あとからそれを使って目的関数を設定するなどするとよいでしょう。

より実用的な例として、ナップサック問題の目的関数を設定してみましょう。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack Problem", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    N = problem.Length(description="Number of items")
    x = problem.BinaryVar(shape=(N,), description="$x_i = 1$ if item i is put in the knapsack")
    v = problem.Float(shape=(N,), description="value of each item")
    w = problem.Float(shape=(N,), description="weight of each item")
    W = problem.Float(description="maximum weight capacity of the knapsack")


    # `+=` 演算子に `Expression` オブジェクトを与えることで目的関数が設定できる
    problem += jm.sum(v[i] * x[i] for i in N)
    # あるいは、ブロードキャストを用いて次のように書いても「同値」
    # problem += jm.sum(v * x)

knapsack_problem
```

## 制約条件の設定

制約条件の追加も同様に {py:meth}`+= <jijmodeling.Problem.__iadd__>` 演算子を使って行います。
ただし、制約条件の追加の際には、{py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` 関数を使って生成された {py:class}`~jijmodeling.Constraint` オブジェクトを足し合わせる形で追加します。
{py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` は必須引数として名前と、`==`、`<=`、または `>=` のいずれかで書かれた制約条件の式を受け取ります。

:::{important}
制約条件の構築に使える比較演算子は `==`、`<=`、`>=` のみです。
次に示すような `>` や `<`、あるいは論理演算などはサポートされていませんので注意してください。

```python
problem.Constraint("BAD1", 1 < x) # ERROR! `>` は使えない！
problem.Constraint("BAD2", (x + y) <= 1 or (y + z) >= 2) # ERROR! 論理演算は使えない！
problem.Constraint("BAD2", (x + y) <= 1 |  (y + z) >= 2) # ERROR! 論理演算は使えない！
```

:::

上で作成したナップサック問題のモデルに制約条件を追加し、モデルを完成させてみましょう。

```{code-cell} ipython3
@knapsack_problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.placeholders['N']
    w = problem.placeholders['w']
    W = problem.placeholders['W']
    x = problem.decision_vars['x']
    problem += problem.Constraint("weight", jm.sum(w[i] * x[i] for i in N) <= W)

knapsack_problem
```

:::{admonition} 制約条件の追加時には必ず `+=` を呼ぶこと！
:class: important

制約条件を追加する際には、必ず {py:meth}`+= <jijmodeling.Problem.__iadd__>` 演算子を使って追加してください。単純に {py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` を呼び出しただけでは、制約条件はモデルに追加されません。
:::

+++

### 制約条件の族

更に、JijModeling では単体の制約条件だけではなく、複数の制約条件をまとめて「制約条件の族」として追加することもできます。
これには複数の方法があります：

1. `domain=` や内包表記を使った添え字つき制約条件の定義
2. 配列に対する比較式

これらの用法を見るために、ここでは巡回セールスマン問題の二次定式化を考えてみましょう。
都市$i, j$の間の距離行列$d_{i,j}$、時刻$t$に都市$i$を訪問することを表すバイナリ変数$x_{t,i}$を用いて以下のように表される定式化です：

$$
\begin{aligned}
\min & \sum_{i = 0}^{N-1} \sum_{j = 0}^{N-1} d_{i,j} x_{t,i} x_{(t + 1) \bmod N, j}\\
\text{s.t. } & \sum_{i = 0}^{N-1} x_{t,i} = 1 \quad (t = 0, \ldots, N-1)\\
& \sum_{t = 0}^{N-1} x_{t,i} = 1 \quad (i = 0, \ldots, N-1)\\
\end{aligned}
$$

二種類の制約条件が設定されていますが、それぞれ単一の制約ではなく $t$ と $i$ というパラメータを渡る族として定式化されていることに注意しましょう。

#### 添え字つき制約条件

このように、添え字つきの制約条件を Decorator API で定義するには、{py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` メソッドの第二引数をリスト内包表記またはジェネレータ式によって与えればよいです：

```{code-cell} ipython3
@jm.Problem.define("TSP, Decorated", sense=jm.ProblemSense.MINIMIZE)
def tsp_decorated(problem: jm.DecoratedProblem):
    C = problem.CategoryLabel(description="Labels of Cities")
    N = C.count()
    x = problem.BinaryVar(dict_keys=(N, C), description="$x_{t,i} = 1$ if City $i$ is visited at time $t$")
    d = problem.Float(dict_keys=(C, C), description="distance between cities")
    problem += jm.sum(d[i, j] * x[t, i] * x[(t + 1) % N, j] for t in N for i in C for j in C)
    
    # 各都市は一度だけ訪問される
    problem += problem.Constraint("one time", [jm.sum(x[t, i] for t in N) == 1 for i in C])
    # 各時刻に一つの都市が訪問される
    problem += problem.Constraint("one city", (jm.sum(x[t, i] for i in C) == 1 for t in N))

tsp_decorated
```

Plain API のみで記述する場合は、次のようにパラメータを受け取る `lambda` 式を第二引数に与え、`domain=` キーワード引数を合わせて指定します：

```{code-cell} ipython3
tsp_plain = jm.Problem("TSP, Decorated", sense=jm.ProblemSense.MINIMIZE)
C = tsp_plain.CategoryLabel("C", description="Labels of Cities")
N = C.count()
x = tsp_plain.BinaryVar("x", dict_keys=(N, C), description="$x_{t,i} = 1$ if City $i$ is visited at time $t$")
d = tsp_plain.Float("d", dict_keys=(C, C), description="distance between cities")
tsp_plain += jm.sum(jm.product(N, C, C), lambda t, i, j: d[i, j] * x[t, i] * x[(t + 1) % N, j])

# 各都市は一度だけ訪問される
tsp_plain += tsp_plain.Constraint("one time", lambda i: jm.sum(N, lambda t: x[t, i]) == 1, domain=C)
# 各時刻に一つの都市が訪問される
tsp_plain += tsp_plain.Constraint("one city", lambda t: jm.sum(C, lambda i: x[t, i]) == 1, domain=N)

tsp_plain
```

#### 配列同士の比較

もう一つの方法は、配列や集合の間の比較式を用いて制約条件の族を定義する方法です。
{doc}`./expressions` で触れたように、比較式にもブロードキャストを用いることができます。
具体的には、制約条件の構築に使える比較式は、両辺が以下の組み合わせのものです：

1. 集合とスカラーの比較
2. 同一シェイプの配列同士の比較
3. 同一キー集合の `TotalDict` 同士の比較

これを使えば、次のように巡回セールスマン問題の制約条件を定義することができます：

```{code-cell} ipython3
@jm.Problem.define("TSP, Decorated", sense=jm.ProblemSense.MINIMIZE)
def tsp_array_comparison(problem: jm.DecoratedProblem):
    N = problem.Natural(description="Number of cities")
    x = problem.BinaryVar(shape=(N, N), description="$x_{t,i} = 1$ if City $i$ is visited at time $t$")
    d = problem.Float(shape=(N, N), description="distance between cities")
    problem += jm.sum(d[i, j] * x[t, i] * x[(t + 1) % N, j] for t in N for i in N for j in N)
    
    # 各都市は一度だけ訪問される
    problem += problem.Constraint("one time", x.sum(axis=0) == 1)
    # 各時刻に一つの都市が訪問される
    problem += problem.Constraint("one city", x.sum(axis=1) == 1)

tsp_array_comparison
```

ここで、{py:meth}`Expression.sum() <jijmodeling.Expression.sum>` や {py:meth}`jm.sum() <jijmodeling.sum>` メソッドに `axis=i` 引数を与えると、単純な総和ではなく、この仕様は Numpy の {py:func}`numpy.sum` 関数と同様にしてその軸に沿った和を計算した配列を返します（複数の軸をリストとして指定することもできます）。

このため、上の例の `one-city` では `x.sum(axis=1)` は（$0$起点なので）都市を表す$2$番目の軸に沿って和を取り、各時刻に訪問される都市の数を表す配列を計算させています。
実際に型を推論させてみると、一次元配列になっているのがわかります。

```{code-cell} ipython3
tsp_array_comparison.infer(tsp_array_comparison.decision_vars["x"].sum(axis=1))
```

このようにして得られた「時刻毎の都市数」の一元配列をスカラー値$1$と比較し、制約条件の族を定義しているのです。 `one-time`も同様です。
ここでは配列対スカラーの比較になっていますが、前述の通り同一シェイプの配列同士の比較による制約条件の族の定義も可能です。

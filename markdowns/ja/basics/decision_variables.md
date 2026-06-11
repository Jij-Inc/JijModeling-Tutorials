---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# ソルバーが決定する変数：決定変数

以下では、数理モデルの重要な構成要素の一つである**決定変数**について、JijModeling での宣言方法を見ていきます。
まずはいつも通りのモジュールのインポートから始めましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

## 単独の決定変数

決定変数は各種ソルバーが制約条件と目的関数に基づいて値を決定する変数です。JijModeling は汎用モデラーであるため、代表的な以下の種類をサポートしています：

| 種類 | 数式 | 説明 |
| :---- | :--: | :--- |
| {py:meth}`~jijmodeling.Problem.BinaryVar` | $\{0, 1\}$ | $0$ または $1$ の値を取るバイナリ変数。上下界の設定は不要。 |
| {py:meth}`~jijmodeling.Problem.IntegerVar` | $\mathbb{Z}$ | 整数変数。上下界の設定が必要。 |
| {py:meth}`~jijmodeling.Problem.ContinuousVar` | $\mathbb{R}$ | 実数値を取る連続変数。上下界の設定が必要。 |
| {py:meth}`~jijmodeling.Problem.SemiIntegerVar` | - | 上下界内の整数値またはゼロの値をとる変数。上下界の設定が必要。 |
| {py:meth}`~jijmodeling.Problem.SemiContinuousVar` | - | 上下界内の連続値またはゼロの値をとる変数。上下界の設定が必要。 |

概ねプレースホルダーの構築子と似ていますが、`*Var` で終わるものが決定変数、ついていないものがプレースホルダーの構築子になっています。
ただし、決定変数の場合は `Float` ではなく `ContinuousVar` となっている点に注意してください。

特定の種類の決定変数を宣言するには、その変数を登録する `Problem` オブジェクトに対して対応する「種類」と同じ名前のメソッドを呼び出してやれば大丈夫です。
それでは、バイナリ変数 $x$ と、$-5$ 以上 $10.5$ 以下の範囲に値を取る連続変数 $W' \in[-5, 10.5]$ を持つ数理モデルを定義してみましょう。
Plain API では次のように定義できます：

```{code-cell} ipython3
problem = jm.Problem("Model with Variables")
x = problem.BinaryVar("x", description="適当な二値変数")
C = problem.ContinuousVar(
    "C'",
    lower_bound=-5,
    upper_bound=10.5,
    description="これまた適当な連続変数",
)

problem
```

第 1 引数は変数の名前を表す必須引数です。また、`upper_bound`および`lower_bound`は変数の上下界を表すキーワード引数であり、バイナリ変数以外は必ず指定しなければいけません。
`description`は `Problem` のものと同様、人間があとでみてわかりやすい説明を書くための省略可能なキーワード引数です。

:::{admonition} 単独の決定変数の上下界
:class: tip

`upper_bound`および`lower_bound`には、**決定変数を含まない**任意の JijModeling の式を書くことができます。
どのような式が書けるのかは「{doc}`./expressions`」を参考にしてください。
:::

更に、**Decorator API を使うと名前の指定を省略**でき、この場合 Python 変数と同じ変数名が自動的に使われます。
次は Decorator API で同様のモデルを定義している例です。

```{code-cell} ipython3
@jm.Problem.define("Model with Variables")
def deco_problem(deco_problem: jm.DecoratedProblem):
    # Decorator API の内側なので、 x の名前を省略している
    x = deco_problem.BinaryVar(description="適当な二値変数")
    # Decorator API 内であっても、名前を明示することもできる
    C = deco_problem.ContinuousVar(
        "C'",
        lower_bound=-5,
        upper_bound=10.5,
        description="これまた適当な連続変数",
    )


deco_problem
```

この例では、$x$ の変数名を省略して宣言していますが、ちゃんと期待通りの $x$ として出力されています。
Decorator API 内での変数名の省略は義務ではなく、上のセルでの $W'$ のように名前を明示することもできます。

:::{admonition} 変数名省略の条件
:class: caution

Decorator API で変数名を省略できるのは、`x = problem.*Var(...)` のように「変数一つ `=` Var の宣言一つ」のような形をしているときのみです。
`x, y = (problem.BinaryVar(), problem.BinaryVar())` のように複数同時に宣言した場合などはエラーとなりますので注意してください。
:::

(var_info)=
## 決定変数の情報の取得

決定プレースホルダーの場合と同様、決定変数の一覧も`Problem` オブジェクトの {py:attr}`~jijmodeling.DecoratedProblem.decision_vars` プロパティにより取得でき、以下で扱う添え字つき変数の情報も含まれています。

```{code-cell} ipython3
deco_problem.decision_vars
```

このようにして得られる決定変数のメタデータは {py:class}`~jijmodeling.DecisionVar` オブジェクトであり、宣言時に返ってくるオブジェクトと同じものです。
従って、{py:attr}`~jijmodeling.Problem.decision_vars` に含まれる {py:class}`~jijmodeling.DecisionVar` オブジェクトも変数式として使うことができます。
特に、複数の `@problem.update` や `@jm.Problem.define()` デコレータで逐次的に Problem を更新していく場合、それ以前のデコレータブロック内で定義された変数を参照するために使うことができます。

:::{tip}
将来的には `@problem.update` が定義済の変数たちを引数として取れるようにする変更が予定されています。期待してお待ちください！
:::

(family)=
## 添え字つき決定変数の宣言

それでは、添え字つきの決定変数の宣言方法を見ていきましょう。

(array_of_dec_vars)=
### 決定変数の配列

以下ではナップサック問題の定義を例として使うため、プレースホルダーのみが宣言されたモデルを定義しておきましょう。

```{code-cell} ipython3
knapsack = jm.Problem("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
W = knapsack.Float("W", description="ナップサックの耐荷重")
N = knapsack.Length("N", description="アイテム数")
v = knapsack.Float("v", shape=(N,), description="各アイテムの価値")
w = knapsack.Float("w", shape=(N,), description="各アイテムの重量")
```

決定変数の配列は、プレースホルダーの場合と同様、`BinaryVar` などの構築子に `shape=` キーワード引数として自然数から成る固定長のタプルを表す式を指定することで宣言でき、$1$次元の場合は単に自然数を表す式で与えることもできます。

:::{admonition}
:class: important

決定変数の数はプレースホルダーの値のみから確定する必要があるため、プレースホルダーの場合と異なり **`shape` 引数の成分に `None` を指定することはできず**、また **`ndim=`  キーワード引数を使うこともできません**。
:::

試しに、ナップサック問題に「アイテム$i$を入れるときだけ$1$となる」決定変数$x_i$を追加しましょう。

(partial_knapsack_def)=

```{code-cell} ipython3
@knapsack.update
def knapsack(problem: jm.DecoratedProblem):
    x = problem.BinaryVar(shape=N, description="アイテム $i$ を入れるときだけ $1$")


knapsack
```

:::{tip}
ここでは Decorator API を使って定義していますが、`shape`の指定方法は（変数名が省略できない点を除けば）Plain API でも同様です。
:::

次は `shape` にタプルを渡して二次元配列を定義している例です：

(multidim_arrays)=

```{code-cell} ipython3
multidim_arrays = jm.Problem("multidimensional arrays", sense=jm.ProblemSense.MINIMIZE)
N = multidim_arrays.Length("N")  # Plain API なので変数名を指定している
M = multidim_arrays.Length("M")
x = multidim_arrays.BinaryVar(
    "x",
    shape=(N, M),  # N x M 配列
)

multidim_arrays
```

(dec_var_array_bounds)=
### 決定変数配列の上下界の指定

決定変数の配列に対しては、次に該当するような式を `upper_bound` / `lower_bound` に指定することができます：

1. スカラー
2. スカラーを要素に持ち、同じシェイプの配列の式
3. 添え字から上下界を表すスカラーへの関数式

ただし、いずれも決定変数を含まない式である必要があります。

これらの指定方法は、上下界でそれぞれ別のものを使うことができます。次は (1) と (2) を使って上下界が与えられている例です。

```python
N = problem.Length("N")
lb = problem.Integer("lb")
ubs = problem.Integer("ub", shape=N)
a = problem.IntegerVar("a", shape=N, lower_bound=lb + 1, upper_bound=ub)
```

 `lb` はゼロ次元のスカラー、 `ub` は長さ $N$ の一次元配列として宣言されたプレースホルダーです。
これらを基に、長さ $N$ の一次元決定変数配列 $a$ は次のような上下界が設定されています：

- 下界：添え字によらず $a_i \geq \mathit{lb} + 1$（上記の (1) に相当）
- 上界：添え字 $i = 0, \ldots, N - 1$ ごとに $a_i \leq \mathit{ub}_i$（上記の (2) に相当）

(3) の添え字からの関数式として与える例としては、やや人工的ですが次のような例が考えられます：

```python
N = problem.Length("N")
M = problem.Length("M")
s = problem.ContinuousVar(
    shape=(N,M),
    lower_bound=0,
    upper_bound=lambda i, j: i + j,
)
```

この例では、シェイプ $N \times M$ の二次元配列 $s$ に対し、以下のように上下界が設定されることになります：

- 下界：添え字 $i$ によらず、$s_{i,j} \geq 0$（上記の (1) に相当）
- 上界：添え字 $i = 0, \ldots, N - 1$ および $j = 0, \ldots, M - 1$ ごとに、$s_{i,j} \leq i + j$（上記の (3) に相当）

このように、同一シェイプの配列を用意したり、複雑な式には添え字からの関数を使うことによって、決定変数の配列に対しても柔軟に上下界を指定することができます。

### 決定変数の辞書

決定変数の辞書に関しては、『[決定変数の「個数」](#dec-var-count)』で触れたようにコンパイル後に個数が確定している必要があるため、`TotalDict` のみしか宣言できないようになっています。
決定変数の辞書を宣言するには、`BinaryVar`, `IntegerVar`, ... などの構築子に対して、`dict_keys` キーワード引数を渡すことで宣言できます。
これは、決定変数の配列の宣言に `shape` を渡す必要があったのと同じです。

決定変数の辞書を宣言する際に、`dict_keys` に渡すことができるのは次の式です：

1. 決定変数を含まない自然数式 $n$（$n$ 未満の自然数の集合 $\mathbb{N}_{<n} = \{0, \ldots, n - 1\}$ と同一視）
2. Python 上の文字列のリスト
3. `problem.CategoryLabel` によって定義されたカテゴリーラベル
4. (1)-(3) を要素に持つタプル

:::{caution}
決定変数構築子に `ndim` または `shape`の少なくとも一方と、`dict_keys` を同時に指定すると、コンテナの種類が確定できないためエラーとなります。
:::

以下は、カテゴリーラベルと自然数の集合のタプルをキーに持つ決定変数の辞書を定義している例です：

```{code-cell} ipython3
problem_for_dict = jm.Problem("Dec Var Keys demonstration")
N = problem_for_dict.Length("N")
L = problem_for_dict.CategoryLabel("L")
x = problem_for_dict.BinaryVar("x", dict_keys=(L, N))

problem_for_dict
```

また、決定変数辞書の `lower_bound` および `upper_bound` の設定についても、「[決定変数配列の上下界](#dec_var_array_bounds)」の節で紹介したのと同様に、以下の値を指定することができます：

1. スカラー
2. スカラーを要素に持ち、同じキー集合を持つ `TotalDict`
3. 添え字から上下界を表すスカラーへの関数式

#### 辞書とカテゴリーラベルを使った問題定義の例

以下はナップサック問題をカテゴリーラベルを使って定式化しなおしたものです：

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only, CATEGORY LABEL)")
def knapsack_cat_dict(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    # TotalDict 構築子を使ってみる
    v = problem.TotalDict(dtype=float, dict_keys=L, description="各アイテムの価値")
    # dict_keys を使ってみる
    w = problem.Float(dict_keys=L, description="各アイテムの重量")
    x = problem.BinaryVar(
        dict_keys=L, description="アイテム $i$ を入れるときのみ $x_i = 1$"
    )


knapsack_cat_dict
```

これだけだと、$N$のかわりに$L$を定義しているだけですね。
そこで、更に「一部のアイテムの組 $(i, j)$に対して、ナップサックに同時に詰めると追加の価値（シナジーボーナス）$s_{i, j}$が発生する」という追加条件を考えてみます。
このような場合に、`PartialDict` は大きな効力を発揮します：

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only, with synergy)")
def knapsack_synergy(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    v = problem.TotalDict(dtype=float, dict_keys=L, description="各アイテムの価値")
    w = problem.Float(dict_keys=L, description="各アイテムの重量")
    x = problem.BinaryVar(
        dict_keys=L, description="アイテム $i$ を入れるときのみ $x_i = 1$"
    )
    # PartialDict を使ってシナジーボーナスを表現！
    s = problem.PartialDict(
        dtype=float, dict_keys=(L, L), description="一部のアイテム間のシナジーボーナス"
    )


knapsack_synergy
```

$s$ が "A *partial* dictionary of placeholders..." と説明されているのが重要です。これにより、「$s$ は一部の$L$の組み合わせについてだけ定義されている」という条件が表現されているのです。
こうした定義はタプルのリストとそれと同じ長さの実数配列の組を使えば表現できなくもありませんが、辞書を使うことでより素直で自然な記述が可能になっています。

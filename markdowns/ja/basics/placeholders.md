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

# ユーザーが入力する変数：プレースホルダーとカテゴリーラベル

本節では、JijModeling において現れる二種類の変数のうち、ユーザーが入力するデータである**プレースホルダー**とその変種**カテゴリーラベル**について、その宣言方法や情報の取得方法について述べていきます。

```{code-cell} ipython3
import jijmodeling as jm
```

(single_phs)=
## 単独のプレースホルダーの宣言
この節では、プレースホルダーの種類と、単独のプレースホルダーの宣言方法について学びます。

プレースホルダーは宣言時に種類を指定する必要があります。
プレースホルダーはコンパイル時にユーザーが入力する値であり、入力データに関する情報を適切に表現するためにいくつかの種類があります。
代表的なプレースホルダーの型は以下の通りです：

| 種類 | 数式 | 説明 | 別名 |
| :--- | :--: | :-- | :-- |
| {py:meth}`~jijmodeling.Problem.Binary` | $\{0, 1\}$ | $0$ または $1$ の値をとる二値プレースホルダー。 | - |
| {py:meth}`~jijmodeling.Problem.Natural` | $\mathbb{N}$ または $\{0, \ldots, N-1\}$ | ゼロも含む自然数。配列のサイズや添え字などを表すのに使われる。`less_than` キーワード引数に別の自然数式 `N` を指定することで、$\{0, \ldots, N-1\}$ の範囲に制限できる。 | {py:meth}`~jijmodeling.Problem.Dim`, {py:meth}`~jijmodeling.Problem.Length` |
| {py:meth}`~jijmodeling.Problem.Integer` | $\mathbb{Z}$ | 負の数も含む整数値。 | - |
| {py:meth}`~jijmodeling.Problem.Float` | $\mathbb{R}$ | 一般の実数値（浮動小数点数値）プレースホルダー。 | - |
| これらのタプル | $\mathbb{Z} \times \mathbb{R}$ | 成分ごとに型の決まった、固定長のタプル。一般にリストと組み合わせて使う。 | - |

プレースホルダーを宣言するには、上記の種類と同じ名前の Problem のメソッドを呼ぶ必要があります。

:::{admonition} プレースホルダーの使い分け
:class: hint

プレースホルダーの種類については、`Natural` と `Float` だけ覚えておけば簡単なモデルの記述には十分でしょう。
特に、以下の基準を念頭に置いておくと使い分けがわかりやすいでしょう：

1. **配列のサイズやアイテムの個数**などを表すものは**自然数**として宣言し、`Natural` やよりわかりやすい `Dim`, `Length` といった別名で宣言する。
2. **それ以外の数値**は `Float` や、場合によってより細分された型の宣言を使えばよい。
:::

例を見るため、ここではナップサック問題に必要な単独のプレースホルダーを宣言してみましょう。
Plain API では次のようにして宣言できます：

```{code-cell} ipython3
partial_knapsack = jm.Problem("Knapsack (Placeholders only)", sense=jm.ProblemSense.MAXIMIZE)
W = partial_knapsack.Float("W", description="ナップサックの耐荷重")
N = partial_knapsack.Length("N", description="アイテム数")

partial_knapsack
```

ここでは、耐荷重を表す実数値のプレースホルダー `W` と、アイテム数を表す自然数のプレースホルダー `N` を一つずつ持つ数理モデルを定義しています。
このようにして宣言されたプレースホルダーは、{py:class}`~jijmodeling.Placeholder` クラスのインスタンスとして表され、プレースホルダーのメタデータを保持しています。

```{code-cell} ipython3
W
```

```{code-cell} ipython3
N
```

また、プレースホルダーが式中に現れた場合、自動的にその値を参照する式として扱われます。
試しに、`A` に $1$ を足してみましょう。

```{code-cell} ipython3
W + 1
```

また、Decorator API を使えば、Python 変数と同じ名前の場合、宣言時にプレースホルダーの名前を省略できます。

(partial_knapsack_def)=

```{code-cell} ipython3
@jm.Problem.define("Another Problem with Placeholder")
def partial_knapsack(problem: jm.DecoratedProblem):
    W = problem.Float(description="ナップサックの耐荷重")
    N = problem.Length(description="アイテム数")


partial_knapsack
```

:::{admonition} 変数名省略の条件
:class: caution

Decorator API で変数名を省略できるのは、`x = problem.Float(...)` のように「変数一つ `=` 変数の宣言一つ」のような形をしているときのみです。
`x, y = (problem.Float(), problem.Natural())` のように複数同時に宣言した場合などはエラーとなりますので注意してください。
:::

:::{admonition} {py:meth}`~jijmodeling.Problem.Placeholder` 構築子
:class: tip

上の表に掲げた `problem.Float`, `problem.Natural` などの構築子は、実はより一般的な {py:meth}`~jijmodeling.Problem.Placeholder` 構築子の特別な場合になっており、たとえば`problem.Natural` は `problem.Placeholder(dtype=jm.DataType.NATURAL)` の省略記法として実装されています。`dtype`には、

- `jm.DataType`列挙体のバリアント
- Python 組み込みの型指定子 `float`, `int`
- NumPy の型指定子 `numpy.uint*`, `numpy.int*`（`*` 以下のビット数の情報は単純に無視されます）
- （指定された自然数 `N` **未満**の自然数の型 $\{0, \ldots, N-1\}$ という指定をするための）自然数式
- カテゴリーラベル
- これらのタプル

などが指定できます。

タプルなどより複雑な型を持つようなものについては、`Placeholder` 構築子を使ってより詳細な仕様を指定することができるようになっています。また、`Placeholder` も他の特化型の構築子同様、Decorator API による変数名の省略もサポートしています。
:::

## カテゴリーラベルの宣言

「{doc}`./variables`」でも触れた通り、カテゴリーラベルは「辞書のキーとして使うことができ、具体的な値の候補はコンパイル時に与えられるラベルの集合」なのでした。
カテゴリーラベルの宣言方法はプレースホルダーとほぼ同様であり、数理モデルに対して {py:meth}`~jijmodeling.Problem.CategoryLabel` 関数を呼び出して登録することで宣言します。
Plain API でのカテゴリーラベルの宣言方法は以下のようになります：

```{code-cell} ipython3
problem_catlab_plain = jm.Problem("Category Label Only")
L_plain = problem_catlab_plain.CategoryLabel("L", description="適当なカテゴリーラベル")

problem_catlab_plain
```

プレースホルダーと同様、名前を表す必須引数と、必要に応じて人間向けの説明を書く省略可能な `description` キーワード引数を取ります。
また、Decorator API を使うとプレースホルダーの場合と同様にカテゴリーラベル名を省略できます（もちろん明示することもできます）：

```{code-cell} ipython3
@jm.Problem.define("Category Label Only")
def problem_catlab_deco(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel(description="適当なカテゴリーラベル")


problem_catlab_deco
```

Problem オブジェクトに登録されているカテゴリーラベルの一覧は、{py:attr}`~jijmodeling.Problem.category_labels` プロパティにより取得できます。
また、個別のカテゴリーラベルに属する値の個数を表す式は {py:func}`jm.count() <jijmodeling.count>` 関数や {py:meth}`jm.CategoryLabel.count() <jijmodeling.CategoryLabel.count>` メソッドにより取得できます（数式上は $\#L$と表記されます）。


(ph_cl_info)=
## プレースホルダーおよびカテゴリーラベルの情報の取得

数理モデルに登録されたプレースホルダーの一覧は、`Problem` オブジェクトの {py:attr}`~jijmodeling.DecoratedProblem.placeholders` プロパティにより取得できます。
このプロパティはプレースホルダー名をキーとし、それぞれのメタデータを値とする辞書を返します。
また、この一覧には、以下で扱う添え字つき変数の情報も含まれています。

```{code-cell} ipython3
partial_knapsack.placeholders
```

このようにして得られるプレースホルダーのメタデータは {py:class}`~jijmodeling.Placeholder` オブジェクトであり、宣言時に返ってくるオブジェクトと同じものです。
従って、{py:attr}`~jijmodeling.Problem.placeholders` に含まれる {py:class}`~jijmodeling.Placeholder` オブジェクトも変数式として使うことができます。
特に、複数の `@problem.update` や `@jm.Problem.define()` デコレータで逐次的に Problem を更新していく場合、それ以前のデコレータブロック内で定義された変数を参照するために使うことができます。

:::{tip}
将来的には `@problem.update` が定義済の変数たちを引数として取れるようにする変更が予定されています。期待してお待ちください！
:::

(ph_family)=
## 添え字つきプレースホルダーの宣言

以下では、**添え字つきプレースホルダー**の宣言方法について見ていきます。「{doc}`./variables`」で触れた通り、添え字つきの変数には配列によるものと辞書によるものの二種類がありますので、順に見ていきましょう。

:::{admonition} 添え字つきのカテゴリーラベルはない
:class: note

カテゴリーラベルは、辞書のキーとして出現できる型を新たに追加するための概念であり、特定の型の値を指定するプレースホルダーよりも一段上の抽象的な概念です。
このため、プレースホルダーと異なり、「添え字つきのカテゴリーラベル」のような概念はありません。

:::

### プレースホルダーの配列

プレースホルダーの配列を宣言する方法は二つあります。それぞれについて見ていきましょう。

#### シェイプを指定したプレースホルダー配列の宣言

プレースホルダー配列の宣言で最も推奨されるものは、 `shape` キーワード引数を使うことです。
`shape`キーワード引数には、自然数から成る固定長のタプルを表す式を指定することができます。
また、次元が$1$の場合は単に自然数を表す式で与えることもできます。
ここでは、[先程定義した](#partial_knapsack_def) 部分的なナップサック問題に対して、各アイテムの価値を表す一次元配列 `v` と、重さを表す一次元配列 `w` を追加で宣言してみましょう：

(partial_knapsack_update)=

```{code-cell} ipython3
@partial_knapsack.update
def _(problem: jm.DecoratedProblem):
    N = problem.placeholders["N"]  # 先程定義したプレースホルダー N を参照

    # shape キーワード引数を使い長さ N の一次元配列を宣言
    # 一次元なので、shape=N としても shape=(N,) としても同じ意味
    v = problem.Float(description="各アイテムの価値", shape=(N,))
    w = problem.Float(description="各アイテムの重さ", shape=N)


partial_knapsack
```

また、**プレースホルダーの配列の `shape` の成分には `None` を指定する**ことができます。
この場合、`None` に指定された次元も一定の長さであることが要求されますが、その長さはコンパイル時に与えられた**インスタンスデータの値から推論**されます。
この機能は、以下のように部分的に長さに制約がある配列を定義したい場合に便利です：

```{code-cell} ipython3
@jm.Problem.define("Partially determined shape")
def partial_shape(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = a.len_at(0)
    c = problem.Float(shape=(N, None))
    M = c.len_at(1)
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(a[i] * c[i, j] * x[i, j] for i in N for j in M)

partial_shape
```

#### 次元のみを指定した配列の宣言

もう一つの（あまり推奨されない）方法は、**`ndim` キーワード引数**を用いるものです。
プレースホルダーの構築子の `ndim` キーワード引数として自然数の定数リテラルを渡すことで、次元のみ指定し、各次元の具体的な長さはコンパイル時にインスタンスデータを与えた時に確定するようなプレースホルダー配列が宣言できます。

:::{admonition} `shape` と `ndim` の同時指定について
:class: tip

`ndim` と `shape` キーワード引数を同時に指定することもできますが、この場合 `shape`の成分数と `ndim` の値が正確に一致している必要があります。
:::

たとえば、上で定義した `partial_knapsack` は `ndim` を使って次のように定義することができます：

(partial_knapsack_ndim)=

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only, with ndim)", sense=jm.ProblemSense.MAXIMIZE)
def partial_knapsack_ndim(problem: jm.DecoratedProblem):
    W = problem.Float(description="ナップサックの耐荷重")
    v = problem.Float(ndim=1, description="各アイテムの価値")
    N = v.len_at(0)
    w = problem.Float(shape=N, description="各アイテムの重さ")


partial_knapsack_ndim
```

ここで、{py:meth}`~jijmodeling.Expression.len_at` 関数は与えられた配列 `array` の $i$ 番目の軸の長さを返す関数です。
$w, v, x$ の長さはいずれも同じ長さですので、$v$を 1 次元配列として宣言しておき、残る $w$, $x$ はその長さを使って `shape` を指定する形にしているのです。
このように、最初に $N$ を独立して定義する方法と、配列の長さから復元する方法とでは、定義される数理モデルは意味的には同じですが、インスタンスデータの与え方が異なります。
たとえば、最初の `partial_knapsack` の例（[定義](#partial_knapsack_def)およびその[更新](#partial_knapsack_update)）では、$N$ も `Length` プレースホルダーとして宣言しているため、**{doc}`インスタンスの生成 <./instance_generation>`時**に `W`, `v`, `w` だけではなく `N` の値もインスタンスデータとして与える必要があります。
一方で、$N$ をプレースホルダーではなく `len_at` を使って別の式として構築している [`partial_knapsack_ndim`](#partial_knapsack_ndim) では、$N$の値は入力値 `v` から推論されるため、コンパイル時には `W`, `v`, `w` の値のみを指定するだけで済みます。

どういう時に長さに相当するプレースホルダーを導入し、どういう時に `ndim` + `len_at` を使うべきでしょうか？
一つの目安は、**単一の配列内の複数軸の長さの間に依存関係がある場合**、長さに相当するプレースホルダーを定義するべき、というものです。

例として、距離行列を表すシェイプ $N \times N$ の多次元配列 $d$ を定義することを考えます：

```{code-cell} ipython3
@jm.Problem.define("Distance matrix")
def dist_matrix(problem: jm.DecoratedProblem):
    N = problem.Length()
    d = problem.Float(shape=(N, N))


dist_matrix
```

この例では、二次元配列$d$の二つの軸はどちらも長さ$N$を持つ必要があり、この制約は `ndim=2` という指定では表現できず、まず$N$を定義し `shape` に指定する必要があるのです。

また、旧来の JijModeling 1 系統では、Placeholder には永らく `ndim` 宣言しか存在しなかったため、たとえば上の `partial_knapsack_ndim` は次のように定義されることが多くありました：

```python
v = problem.Float(ndim=1, description="各アイテムの価値")
w = problem.Float(ndim=1, description="各アイテムの重量")
```

しかし、これでは $v, w$ の間のシェイプの関係が表現できないため、JijModeling 2 以降ではこのような**長さの一致性が強制できない定義は強く非推奨**としており、**シェイプの間に非自明な関係がある場合は必ずどこかで `shape` を指定する**ことを強く推奨します。

:::{admonition} タプルの配列としてのグラフ
:class: tip

たとえば、`V` が超点数を表す自然数式のとき、`G = problem.Graph(dtype=V)` とすると、$G$ は $\{0, \ldots, V-1\}$ を頂点集合として持つグラフの辺集合にあたるプレースホルダーとして宣言されます。
実は、この構築子は一次元配列と「[単独のプレースホルダー](#single_ph)」で触れたタプルの組み合わせで表現されており、次のように書いたのと同値です：

```python
G = problem.Placeholder(dtype=(V, V), ndim=1)
```

ですので、`N = G.len_at(0)` とすることで $G$ の（重複を込みで数えた）辺の総数を取得することができますし、配列に関する種々の演算を使ってグラフを操作することができるようになります。
このように、JijModeling ではタプルと配列を組み合わせて、複雑な構造を表現できるようになっているのです。
:::

:::{admonition} **2.0.0 以降は Jagged Array は強く非推奨**
:class: danger

JijModeling 1 系統には、シェイプが均一ではない Jagged Array というコレクションも用意されていました。
しかし、Jagged Array はその不均一性から型システムなどによる検証をうけづらいため、JijModeling 2 では**Jagged Array は強く非推奨**となっており、将来のリリースで取り除くことが計画されています。
こうした配列とタプルの組み合わせや後述する辞書を使うと、グラフ構造や $0$ 起点でなかったり疎な構造を表すことができますので、移行の際にはこうした新たな構成要素を用いて Jagged Array を用いない記述へと置き換えることを強く推奨します。
:::

### プレースホルダーの辞書

プレースホルダーの辞書は、同様に `Float` や `Length` などの構築子に `shape` のかわりに `dict_keys` キーワード引数を渡すことで宣言できます。
決定変数の挙動と合わせるため、`dict_keys`のみが指定された場合そのプレースホルダー辞書は `TotalDict` として宣言されますが、同時に `partial_dict=True` 引数を渡すと `PartialDict` として宣言されるようになります。

`TotalDict` として宣言されている場合（つまり、`partial_dict` が指定されていないか `False` に設定されている場合）、`dict_keys` に指定できるものは以下の通りです：

1. 決定変数を含まない自然数式 $n$
2. Python 上の文字列のリスト
3. `problem.CategoryLabel` によって定義されたカテゴリーラベル
4. (1)-(3) を要素に持つタプル

一方で、`PartialDict` として宣言されている場合、以下が指定できるようになります：

1. `jm.DataType.INTEGER`、Python の型識別子 `int`、または `numpy.int*`（整数を表す識別子）
2. `jm.DataType.NATURAL` または `numpy.uint*`
3. 決定変数を含まない自然数式 $n$（$n$ 未満の自然数の集合 $\mathbb{N}_{<n} = \{0, \ldots, n - 1\}$ と同一視）
4. Python の型識別子 `str`
5. Python 上の文字列のリスト
6. `problem.CategoryLabel` によって定義されたカテゴリーラベル
7. (1)-(6) を要素に持つタプル

また、{py:meth}`~jijmodeling.Problem.TotalDict` 構築子や {py:meth}`~jijmodeling.Problem.PartialDict` を `Problem` オブジェクトに対して呼び出すことでもプレースホルダーの辞書を宣言できます。

:::{admonition} プレースホルダー辞書に `ndim` 相当がない理由
:class: caution

プレースホルダー配列における `ndim` 相当の引数は存在しません。これは、キーの型を省略して成分数だけ与えた場合、インスタンスデータへのアクセスなしに具体的なキーの型を確定することができないためです。
:::

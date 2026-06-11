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

# コレクションの畳み込み（総和など）と論理演算

本章では、前章までで見てきたコレクション型に対し、「集合」型を経由して総和や総積などの畳み込み演算やフィルタリングなどを行う方法について説明します。
また、真偽値や集合に対する論理演算についても併せて説明します。

```{code-cell} ipython3
import jijmodeling as jm
```

## JijModeling における「集合」と他の型からの変換

JijModeling では、「特定の型の値からなる一連の値」を表す概念である**集合**をサポートしています。前章の最後で触れた {py:meth}`~jijmodeling.Expression.indices` や {py:meth}`~jijmodeling.Expression.keys` も、実際には**添え字の集合**を表す式を返します。
この集合の概念は、特定の範囲を渡る添え字を使いたい場合や総和・総積を取る場合、または添え字つきの制約条件を定義する際に使われます。

:::{admonition} JijModeling の集合はストリーム
:class: note

他のモデラーに倣い JijModeling でも「集合」と呼んでいますが、数学的には「集合」は重複を持たず、列挙する順番も関係ないものです。
一方で、**JijModeling の「集合」は要素の重複も許容し、要素の順番も保持**します。
厳密には、JijModeling の「集合」は一般のプログラミング言語では**ストリーム**や**イテレーター**（反復子）と呼ばれるものに相当します。
:::

一部の型の値は自動的に集合へと変換されます。具体例は次の通りです：

| 式の型 | 対応する集合 |
| :-------- | : ------- |
| 多次元配列 | 要素を行優先順に取り出す集合 |
| 辞書 | 辞書の値からなる集合 |
| 決定変数を含まない自然数式 $N$ | $N$ 未満の自然数の集合 $\{0, 1, \ldots, N-1\}$ |
| カテゴリーラベル `L` | コンパイル時に与えられる `L` の値全体の集合 |

:::{admonition} JijModeling 1 系統からの変更点：配列の「集合」としての振る舞い
:class: caution

JijModeling 1 系統では、多次元配列が `belong_to=` や `forall=` に現れていた場合、内側の行を順に走査する集合のように振る舞っていました。
つまり、JijModeling 1 では `A` がシェイプ `(N, M)` の配列である場合、`A` に対する走査は長さ `M` の一次元配列からなる `N` 個の要素を持つ集合として扱われていました。

JijModeling 2 からは、こうした振る舞いは廃止され、要素を順に走査する挙動になります。旧来の挙動を使いたい場合、{py:func}`~jijmodeling.rows`関数を使い`jm.rows(A)` または `A.rows()` と明示的に変換してください。
:::

:::{admonition} JijModeling における辞書の「集合」としての振る舞い
:class: important

JijModeling では、辞書型の式に対しても、**キーではなく値を走査する**集合のような振る舞いが定義されています。
これは Python の {py:class}`dict` 型の挙動とは異なりますが、多次元配列の振る舞いとの整合性からあえてこの挙動を定めています。
これにより、たとえば当初は多次元配列として定義されていたプレースホルダーや決定変数を、辞書として扱うようにコードを変更した際に、`x.sum()` のようなコードを変更せずに済むようになります。
キー値ペアやキーを走査する集合のような振る舞いが必要な場合は、{py:meth}`~jijmodeling.Expression.items` や {py:meth}`~jijmodeling.Expression.keys` メソッドを使ってください。
また、値を走査していることを明示したい場合は {py:meth}`~jijmodeling.Expression.values` メソッドを利用できます。
:::

## 集合の構築・合成

JijModeling では、他の型の値から自動的に変換する以外にも、新たに集合を構築したり、既存の集合を合成して新たな集合を得るための関数が用意されています。

### {py:func}`~jijmodeling.set` による明示的な集合への変換

基本的に集合への変換は自動的に行われますが、明示的に集合に変換したい場合は {py:func}`~jijmodeling.set` 関数を使うことができます。
また、Decorator API を使っている場合、`jm.set` に内包表記を与えることで直接集合を構築することもできます。
{py:func}`~jijmodeling.genarray` や {py:func}`~jijmodeling.gendict` と異なり、{py:func}`~jijmodeling.set` では任意の個数の `for` 節や `if` 節を含む内包表記をサポートしています。

```{code-cell} ipython3
@jm.Problem.define("Set Comprehension Example")
def set_compr_problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(dict_keys=(L, N))
    display(jm.set(i + x[l, i] for l in L for i in N if i % 2 == 0))
```

### 集合のフィルタリング

{py:func}`~jijmodeling.filter` 関数を使うと、既存の集合のうち特定の条件を満たす要素だけからなる新たな集合を構築することができます。

```{code-cell} ipython3
filter_problem = jm.Problem("Set Filter Example")
N = filter_problem.Natural("N")
N.filter(lambda i: i % 2 == 0)
```

### 集合の写像

Python 標準ライブラリの {py:func}`~map` 関数に対応する {py:func}`~jijmodeling.map` 関数を使うと、既存の集合の要素に対して特定の関数を適用した結果からなる新たな集合を構築することができます。

```{code-cell} ipython3
map_problem = jm.Problem("Set Map Example")
N = map_problem.Natural("N")
x = map_problem.BinaryVar("x", shape=N)
map_problem += jm.sum(jm.set(N).map(lambda i: x[i] ** 2))

map_problem
```

:::{admonition} 配列・辞書の写像
:class: info

配列や辞書に対しても {py:func}`~jijmodeling.map` 関数を直接呼び出すことができますが、この場合の結果は集合ではなく、同じシェイプやキー集合を持つ新たな配列や辞書になります。
特に、これらに対する `map によってシェイプやキー集合の情報は保たれるため、元のコンテナと同じ添え字を使って写像後の要素にアクセスすることができます。
また先述の通りこれらの型は自動的に集合に変換され、写像後のコンテナに対する集合演算の挙動の差はありません。

:::

### 集合の直積

{py:func}`~jijmodeling.product` 関数を使うと、複数の集合の直積（デカルト積）を取ることができます。

```{code-cell} ipython3
product_problem = jm.Problem("Set Product Example")
N = product_problem.Natural("N")
M = product_problem.Natural("M")
jm.product(N, M)
```

これは、意味的には以下のように順次 `for` により複数の集合の要素を走査するのと同じ効果を持ちます：

```{code-cell} ipython3
@product_problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.set((i, j) for i in N for j in M))
```

### 配列や辞書の添え字の集合の取得

配列型や辞書型を持つ式に対しては、その添え字の集合（定義域）を取得することができます。
配列に対しては {py:meth}`~jijmodeling.Expression.indices` によりインデックスの全体を、辞書に対しては {py:meth}`~jijmodeling.Expression.keys` によりキー集合を取得することができます。
これを使うと、たとえば `PartialDict` プレースホルダーと同じ定義域を持つような辞書型の決定変数を以下のようにして定義することができます。

```{code-cell} ipython3
problem = jm.Problem("Index and Keys Example")
N = problem.Length("N")
L = problem.CategoryLabel("L")
S = problem.PartialDict("S", dtype=float, dict_keys=(N, L))
x = problem.BinaryVar("x", dict_keys=S.keys())
problem
```

## 集合演算に対する総和・総積・最大・最小値などの畳み込み

添え字は総和・総積などの畳み込み演算と組み合わせると大きな威力を発揮します。以下ではさまざまな総和・総積の記法について説明していきます。

:::{note}
簡単のため以下では {py:func}`jm.sum() <jijmodeling.sum>`（または {py:meth}`Expression.sum() <jijmodeling.Expression.sum>`）関数を使った総和の例を示しますが、{py:func}`jm.prod() <jijmodeling.prod>` や {py:func}`Expression.prod() <jijmodeling.Expression.prod>`、 {py:func}`jm.max() <jijmodeling.max>` や {py:func}`jm.min() <jijmodeling.min>` を使った総積・最大・最小値関数も同様に記述できます。
:::

Decorator API では、総和・総積は直感的な{external+python:ref}`内包表記 <comprehensions>`の形で記述することができます。

以下は、決定変数とプレースホルダーの積の総和を Decorator API を使って書いた例です：

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def sum_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(a[i] * x[i] for i in N)


sum_example
```

:::{admonition} Python 組込みの `sum` 関数を使わないように注意！
:class: caution

内包表記を用いた畳み込みの記述に使えるのは、JijModeling の {py:func}`jm.sum() <jijmodeling.sum>`, {py:func}`jm.prod() <jijmodeling.prod>`, {py:func}`jm.max() <jijmodeling.max>`, {py:func}`jm.min() <jijmodeling.min>` のみです。
誤って Python 組込みの {py:func}`sum` 関数などを使ったり、Decorator API の外側で {py:func}`jm.sum() <jijmodeling.sum>` を使ったりすると、以下のようなエラーが出ますので注意してください：
:::

```{code-cell} ipython3
try:

    @jm.Problem.define("Wrong Sum Example")
    def wrong_sum_example(problem: jm.DecoratedProblem):
        N = problem.Length()
        a = problem.Float(shape=(N,))
        x = problem.BinaryVar(shape=(N,))
        # ERROR! jm.sum() ではなく、Python 組込みの sum を使っている
        problem += sum(a[i] * x[i] for i in N)
except Exception as e:
    print(e)
```

先述の {py:func}`jijmodeling.map` 関数を使えば、同じプログラムは Plain API のみで同じものを以下のように書けます：

```{code-cell} ipython3
sum_example_plain = jm.Problem("Sum Example (Plain)")
N = sum_example_plain.Length("N")
a = sum_example_plain.Float("a", shape=(N,))
x = sum_example_plain.BinaryVar("x", shape=(N,))
sum_example_plain += jm.sum(jm.map(lambda i: a[i] * x[i], N))

sum_example_plain
```

このような単純な総和の場合、{py:func}`jm.sum() <jijmodeling.sum>` に定義域と和を取る項を返す関数の二つの引数を渡すことでも、総和を表現することもできます：

```{code-cell} ipython3
sum_example_plain_alt = jm.Problem("Sum Example (Plain, Alt)")
N = sum_example_plain_alt.Length("N")
a = sum_example_plain_alt.Float("a", shape=(N,))
x = sum_example_plain_alt.BinaryVar("x", shape=(N,))
sum_example_plain_alt += jm.sum(N, lambda i: a[i] * x[i])

sum_example_plain_alt
```

:::{important}
このような二引数による畳み込みをサポートしているのは、 {py:func}`jm.sum() <jijmodeling.sum>` と {py:func}`jm.prod() <jijmodeling.prod>` のみで、{py:func}`jm.max() <jijmodeling.max>` や {py:func}`jm.min() <jijmodeling.min>` ではサポートされていません。

このように、Decorator API を使わずに Plain API のみで済ませる場合、添え字を渡る式を作成するには Python の {external+python:ref}`lambda 式 <lambda>` を使う必要があります。

:::{tip}
{py:func}`jm.sum() <jijmodeling.sum>` / {py:func}`jm.prod() <jijmodeling.prod>` が一引数関数やメソッドとして呼ばれた場合は集合の総和・総積を取るため、単に `x` の要素の和を取りたいだけであれば `jm.sum(x)` や `x.sum()` のように書いたり、また前項で採り上げた限定的なブロードキャストを使えば、上の例は `jm.sum(a * x)` のように書くこともできます。これは、`x` が二次元以上の配列であったとしても同様です。
:::

これらの畳み込み関数と内包表記の `if` 節などを組み合わせることで、より柔軟な畳み込みを表現することができます。
具体例については {doc}`../references/cheat_sheet` を参照してください。

## 条件式と集合の論理演算

上では内包表記の `if` や {py:func}`~jijmodeling.filter` 関数の中で使われる条件式は、単純な条件のみでしたが、一般には論理式として「かつ」や「または」を使って指定したい場合があります。
残念ながら、Python の `and` や `or`、`not` といった論理演算子はオーバーロードできないため、かわりにビット演算子 `&`（かつ）、`|`（または）、`~`（否定）や、関数{py:func}`jijmodeling.band`（かつ）、{py:func}`jijmodeling.bor`（または）、{py:func}`jijmodeling.bnot` を使って論理演算を表現します。

:::{admonition} ビット演算の優先順位に注意！
:class: caution

`and`, `or` などと異なり、`&` や `|` は `==` や `!=` よりも優先順位が低いため、たとえば `a == b & c == d` のように書くと `a == (b & c) == d` と解釈されてしまいます。
このため、`&` や `|` を使う場合は、常に各比較式を `(a >= b) & (c == d)` のように常に括弧で囲むようにしてください。
:::

また、論理演算は集合式に対しても使うことができ、和集合は `|`、共通部分集合を `&` により表すことができます。
ただし、集合の否定（補集合）は無限集合になり得るためサポートしておらず、かわりに {py:func}`jijmodeling.diff` 関数を使って特定の二つの集合の間の差集合を取る操作が提供されています。

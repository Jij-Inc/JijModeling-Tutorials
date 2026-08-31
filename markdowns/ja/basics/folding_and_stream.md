---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# 畳み込みとストリーム

本章では、前章までで見てきたコレクションを**ストリーム**として扱い、総和や総積などの畳み込み演算やフィルタリングなどを行う方法について説明します。
ストリームとは「特定の型の値からなる、重複を含み得る値の列」であり、Python の**イテレータ**と呼ばれるものに類似する概念です。
このストリームの概念は、特定の範囲を渡る添え字を使いたい場合や総和・総積を取る場合、または添え字つきの制約条件を定義する際に使われます。

また、真偽値やストリームに対する論理演算についても併せて説明します。

```{code-cell} ipython3
import jijmodeling as jm
```

:::{admonition} JijModeling 2.8.0 での「集合」からの改称
:class: note

JijModeling 2.7.1 までは、ストリームのことを「集合」と呼び、明示的な変換関数の名前も `jm.set` としていましたが、数学的には「集合」とは特定の順番を持たず重複を持たないものであり、「集合」という名前は誤解を招くものでした。
2.8.0 以後、この概念は一貫してストリームと呼ぶことにしました。
`jm.set` は {py:func}`~jijmodeling.stream` の非推奨の別名として引き続き利用でき、Decorator API での内包表記もそのまま使えますが、呼び出すと `DeprecationWarning` が発生します。
:::

## ストリームに対する総和・総積・最大・最小値などの畳み込み

JijModeling の総和・総積などは、ストリームの要素を順に処理する畳み込み演算の形で実現されています。
以下では、その具体例として、さまざまな総和・総積の記法について説明していきます。

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

`in` の後には、次節以降で説明する方法を使って得られる任意のストリームや暗黙にストリームに変換されるような型の値を渡すことができます。この例では、`for i in N` の自然数 `N` が畳み込みが行われるストリームに対応しています。

:::{admonition} Python 組込みの {py:func}`sum` 関数を使わないように注意！
:class: caution

Decorator API の内包表記を用いて畳み込みを記述する場合は、JijModeling の {py:func}`jm.sum() <jijmodeling.sum>`, {py:func}`jm.prod() <jijmodeling.prod>`, {py:func}`jm.max() <jijmodeling.max>`, {py:func}`jm.min() <jijmodeling.min>` を使います。
誤って Python 組込みの {py:func}`sum` 関数に `a[i] * x[i] for i in N` のような式を渡すとエラーとなるため、注意してください。
:::

また、後ほど説明する {py:func}`jijmodeling.map` 関数を使えば、同じプログラムは Plain API のみで同じものを以下のように書けます：

```{code-cell} ipython3
sum_example_plain = jm.Problem("Sum Example (Plain)")
N = sum_example_plain.Length("N")
a = sum_example_plain.Float("a", shape=(N,))
x = sum_example_plain.BinaryVar("x", shape=(N,))
sum_example_plain += jm.sum(jm.map(lambda i: a[i] * x[i], N))

sum_example_plain
```

このような単純な総和の場合、{py:func}`jm.sum() <jijmodeling.sum>` に定義域と和を取る項を返す関数の二つの引数を渡すことでも、総和を表現できます：

```{code-cell} ipython3
sum_example_plain_alt = jm.Problem("Sum Example (Plain, Alt)")
N = sum_example_plain_alt.Length("N")
a = sum_example_plain_alt.Float("a", shape=(N,))
x = sum_example_plain_alt.BinaryVar("x", shape=(N,))
sum_example_plain_alt += jm.sum(N, lambda i: a[i] * x[i])

sum_example_plain_alt
```

:::{important}
二引数による畳み込みをサポートしているのは、 {py:func}`jm.sum() <jijmodeling.sum>` と {py:func}`jm.prod() <jijmodeling.prod>` のみで、{py:func}`jm.max() <jijmodeling.max>` や {py:func}`jm.min() <jijmodeling.min>` ではサポートされていません。

Decorator API を使わずに Plain API のみで済ませる場合、添え字を渡る式を作成するには Python の {external+python:ref}`lambda 式 <lambda>` を使う必要があります。
:::

:::{tip}
{py:func}`jm.sum() <jijmodeling.sum>` / {py:func}`jm.prod() <jijmodeling.prod>` が一引数関数やメソッドとして呼ばれた場合はストリームの総和・総積を取るため、単に `x` の要素の和を取りたいだけであれば {py:func}`jm.sum(x) <jijmodeling.sum>` や {py:meth}`x.sum() <jijmodeling.Expression.sum>` のように書いたり、また前項で採り上げた限定的なブロードキャストを使えば、上の例は {py:func}`jm.sum(a * x) <jijmodeling.sum>` のように書くこともできます。これは、`x` が二次元以上の配列であったとしても同様です。
:::

これらの畳み込み関数と内包表記の `if` 節などを組み合わせることで、より柔軟な畳み込みを表現することができます。
たとえば、以下の例は、`N` のうち偶数の添え字に対応する `a[i] * x[i]` の総和を取る例です：

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def sum_with_ifs_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(a[i] * x[i] for i in N if i % 2 == 0)


sum_with_ifs_example
```

`if` 節の中では、後述の論理演算を使ってより複雑な条件式を指定することもできます。
具体例については {doc}`../references/cheat_sheet` を参照してください。

## ストリームの構築

JijModeling では、（明示的・自動的問わず）他の型の値からストリームに変換したり、ストリームを新しく構築したり、様々な仕組みや関数が用意されています。

### 既存の型からの自動変換

一部の型の値は自動的にストリームへと変換されます。具体例は次の通りです：

| 式の型 | 対応するストリーム |
| :-------- | :------- |
| 多次元配列 | 要素を行優先順に走査するストリーム |
| 辞書 | 辞書の値を走査するストリーム |
| 決定変数を含まない自然数式 $N$ | $0, 1, \ldots, N-1$ を走査するストリーム |
| カテゴリーラベル `L` | コンパイル時に与えられる `L` の値全体を走査するストリーム |

### {py:func}`~jijmodeling.rows` で多次元配列を部分配列のストリームに変換する

上述の通り、多次元配列は**行優先順に各要素を走査**するストリームに自動的に変換されます。
これ以外にも、内側の行を順に走査するストリームを得たい場合は、{py:func}`~jijmodeling.rows` 関数を使います。
{py:func}`~jijmodeling.rows` 関数は、実際にはシェイプ $N \times M_1 \times \cdots \times M_n$ 多次元配列を、シェイプ $M_1 \times \ldots \times M_n$ の部分配列から成る長さ $N$ の配列に変換する関数であり、配列の自動変換機能を介してストリームに変換されるようになっています。

```{code-cell} ipython3
problem = jm.Problem("Row Sum Example")
N = problem.Length("N")
M = problem.Length("M")
K = problem.Length("K")
x = problem.BinaryVar("x", shape=(N, M, K))
problem.infer(x.rows())
```

:::{admonition} JijModeling 1 系統からの変更点：配列の走査のされ方
:class: caution

JijModeling 1 系統では、多次元配列が `belong_to=` や `forall=` に現れていた場合、内側の行を順に走査していました。
この挙動を使いたい場合、{py:func}`~jijmodeling.rows`関数を使い `jm.rows(A)` または `A.rows()` と明示的に変換してください。
:::

### {py:meth}`~jijmodeling.Expression.indices` で配列の添え字のストリームを取得する

{py:meth}`~jijmodeling.Expression.indices` を使うと、配列の添え字の集合（定義域）に対応するストリームを取得することができます。

```{code-cell} ipython3
problem = jm.Problem("Index and Keys Example")
S = problem.Float("S", ndim=2)
problem.infer(S.indices())
```

### 辞書を明示的にストリームに変換する

上述の通り、JijModeling の自動変換機能では、辞書型の式は**キーではなく値を走査する**ストリームになります。
これは Python の {py:class}`dict` 型の挙動とは異なりますが、多次元配列の振る舞いとの整合性からあえてこの挙動を定めています。
これにより、たとえば当初は多次元配列として定義されていたプレースホルダーや決定変数を、辞書として扱うようにコードを変更した際に、{py:meth}`x.sum() <jijmodeling.Expression.sum>` のようなコードを変更せずに済むようになります。
キー値ペアを走査したい場合は {py:meth}`~jijmodeling.Expression.items` メソッドを、キーを走査したい場合は {py:meth}`~jijmodeling.Expression.keys` メソッドを使うことで目的のストリームを得ることができます。
また、デフォルトの値のストリームへの変換を明示的に行いたい場合は、{py:meth}`~jijmodeling.Expression.values` メソッドを利用できます。

```{code-cell} ipython3
problem = jm.Problem("Row Sum Example")
L = problem.CategoryLabel("L")
N = problem.Length("N")
M = problem.Length("M")
x = problem.TotalDict("x", dict_keys=L, dtype=float)
problem.infer(x.values())
```

```{code-cell} ipython3
problem.infer(x.items())
```

```{code-cell} ipython3
problem.infer(x.keys())
```

また、以下は `PartialDict` プレースホルダーと同じ定義域を持つような決定変数の辞書を定義している例です：

```{code-cell} ipython3
problem = jm.Problem("Index and Keys Example")
N = problem.Length("N")
L = problem.CategoryLabel("L")
S = problem.PartialDict("S", dtype=float, dict_keys=(N, L))
x = problem.BinaryVar("x", dict_keys=S.keys())
problem
```

### {py:func}`~jijmodeling.stream` による明示的なストリームへの変換

基本的にストリームへの変換は自動的に行われますが、明示的にストリームに変換したい場合は {py:func}`~jijmodeling.stream` 関数を使うことができます。
また、Decorator API を使っている場合、{py:func}`jm.stream <jijmodeling.stream>` に内包表記を与えることで直接ストリームを構築することもできます。
{py:func}`~jijmodeling.genarray` や {py:func}`~jijmodeling.gendict` と異なり、{py:func}`~jijmodeling.stream` では任意の個数の `for` 節や `if` 節を含む内包表記をサポートしています。

```{code-cell} ipython3
@jm.Problem.define("Stream Comprehension Example")
def stream_compr_problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()
    x = problem.BinaryVar(dict_keys=(L, N))
    display(jm.stream(i + x[l, i] for l in L for i in N if i % 2 == 0))
```

### {py:func}`~jijmodeling.range` による等差数列の生成

JijModeling 2.3.1 からは、Python 組込みの {py:class}`range() <range>` 関数に対応する {py:func}`~jijmodeling.range` 関数も提供されており、整数の等差数列からなるストリームを定義することができます。
Python の {py:class}`range() <range>` と同様に、引数を一つだけ与えた場合は $0$ から、二つ与えた場合は第 1 引数から第 2 引数の手前までを走査し、第 3 引数を与えるとその値を刻み幅として使います。

```{code-cell} ipython3
range_problem = jm.Problem("Stream Range Example")
N = range_problem.Natural("N")

display(jm.range(N))  # 0, 1, ..., N-1
display(jm.range(1, N))  # 1, 2, ..., N-1
display(jm.range(1, N, 2))  # 1, 3, 5, ...（N 未満）
```

## ストリームの加工

ここまでは、ストリームの畳み込みや構築方法について見てきました。
以下では、既存のストリームを加工したり、複数のストリームを組み合わせて新たなストリームを構築する方法について説明します。

### ストリームのフィルタリング

{py:func}`~jijmodeling.filter` 関数を使うと、既存のストリームのうち特定の条件を満たす要素だけからなる新たなストリームを構築することができます。

```{code-cell} ipython3
filter_problem = jm.Problem("Stream Filter Example")
N = filter_problem.Natural("N")
N.filter(lambda i: i % 2 == 0)
```

### ストリームの重複を取り除く

先述の通り、ストリームには値が重複して現れる場合があります。
ストリームから重複する元を取り除くが必要な場合は {py:func}`~jijmodeling.unique` 関数を使うと、複数回現れる要素は最初の出現位置のもののみが残され、一意になったストリームが得られるようになります。

```{code-cell} ipython3
problem = jm.Problem("Stream Uniquifization Example")
A = problem.Natural("x", ndim=1)
problem += A.unique().sum()  # 配列をストリームと見做し、重複を取り除いてから総和を取る

instance_data = {"x": [1, 3, 1, 2, 2, 1]}
instance = problem.eval(instance_data)
assert instance.objective == 6  # 1, 3, 2 のみが残るため、総和は 6
```

### ストリームの写像

Python 標準ライブラリの {py:func}`~map` 関数に対応する {py:func}`~jijmodeling.map` 関数を使うと、既存のストリームの要素に対して特定の関数を適用した結果からなる新たなストリームを構築することができます。

```{code-cell} ipython3
map_problem = jm.Problem("Stream Map Example")
N = map_problem.Natural("N")
x = map_problem.BinaryVar("x", shape=N)
map_problem += jm.sum(jm.stream(N).map(lambda i: x[i] ** 2))

map_problem
```

:::{admonition} 配列・辞書の写像
:class: info

配列や辞書に対しても {py:func}`~jijmodeling.map` 関数を直接呼び出すことができますが、この場合の結果はストリームではなく、同じシェイプやキー集合を持つ新たな配列や辞書になります。
特に、これらに対する {py:func}`map <jijmodeling.map>` によってシェイプやキー集合の情報は保たれるため、元のコンテナと同じ添え字を使って写像後の要素にアクセスすることができます。
また先述の通りこれらの型は自動的にストリームに変換され、写像後のコンテナに対するストリーム演算の挙動の差はありません。

:::

### ストリームの平坦化写像

{py:func}`~jijmodeling.map` に与える関数がストリームを返す場合、その結果は「ストリームからなるストリーム」になってしまいます。
そこで、{py:func}`jm.flat_map() <jijmodeling.flat_map>`（またはメソッド形式の {py:meth}`Expression.flat_map() <jijmodeling.Expression.flat_map>`）を使うと、写像した結果を一段階平坦化したストリームを得ることができます。
これにより、Decorator API の内包表記を使わずに複数の添え字に渡る走査を記述することができます。

```{code-cell} ipython3
flat_map_problem = jm.Problem("Stream FlatMap Example")
N = flat_map_problem.Natural("N")
M = flat_map_problem.Natural("M")

# 各 i に対し (i, 0), (i, 1), ..., (i, M-1) を並べたストリーム
jm.stream(N).flat_map(lambda i: jm.map(lambda j: (i, j), M))
```

### ストリームの直積

{py:func}`~jijmodeling.product` 関数を使うと、複数のストリームの直積（デカルト積）を取ることができます。

```{code-cell} ipython3
product_problem = jm.Problem("Stream Product Example")
N = product_problem.Natural("N")
M = product_problem.Natural("M")
jm.product(N, M)
```

これは、意味的には以下のように順次 `for` により複数のストリームの要素を走査するのと同じ効果を持ちます：

```{code-cell} ipython3
@product_problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.stream((i, j) for i in N for j in M))
```

ストリームが期待される位置では、{py:func}`~jijmodeling.product` を省略して単にタプルを書くことでも直積を表せます。
Decorator API での内包表記の `in` の右辺や、{py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` の `domain=` キーワード引数などがこれにあたります。

```{code-cell} ipython3
@jm.Problem.define("Tuple Product Example")
def tuple_product_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    Q = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))

    # 注目！ jm.product ではなく、タプルで直積を表している
    problem += jm.sum(Q[i, j] * x[i, j] for (i, j) in (N, M))


tuple_product_example
```

Plain API で `domain=` に与える場合も同様で、この場合は直積の各成分が `lambda` 式の引数として順に渡されます。

```{code-cell} ipython3
tuple_domain_example = jm.Problem("Tuple Domain Example")
N = tuple_domain_example.Length("N")
M = tuple_domain_example.Length("M")
x = tuple_domain_example.BinaryVar("x", shape=(N, M))
tuple_domain_example += tuple_domain_example.Constraint(
    "bound", lambda i, j: x[i, j] <= 1, domain=(N, M)
)

tuple_domain_example
```

## 条件式とストリームの論理演算

JijModeling では、論理積（「かつ）」、「論理和（または）」「否定（でない）」などの論理演算を使って、複雑な条件式を表現したり、ストリームを合成したりすることができます。
残念ながら、Python の `and` や `or`、`not` といった論理演算子はオーバーロードできないため、かわりにビット演算子 `&`（かつ）、`|`（または）、`~`（否定）や、関数{py:func}`jijmodeling.band`（かつ）、{py:func}`jijmodeling.bor`（または）、{py:func}`jijmodeling.bnot` を使って論理演算を表現します。

以下では、条件式とストリームそれぞれの論理演算について説明します。

:::{admonition} ビット演算の優先順位に注意！
:class: caution

`and`, `or` などと異なり、`&` や `|` は `==` や `!=` よりも優先順位が高いため、たとえば `a == b & c == d` のように書くと `a == (b & c) == d` と解釈されてしまいます。
このため、`&` や `|` を使う場合は、各比較式を `(a >= b) & (c == d)` のように常に括弧で囲むようにしてください。
:::

### 条件式の論理演算

上では内包表記の `if` や {py:func}`~jijmodeling.filter` 関数の中で使われる条件式は、単純な条件のみでしたが、一般には論理式として「かつ」や「または」を使って指定したい場合があります。

以下は「`i` が偶数または `j` が奇数の場合」にのみ和をとっている例です：

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(
        a[i, j] * x[i, j] for i in N for j in M if (i % 2 == 0) | (j % 2 == 1)
    )


problem
```

上述の通り、 `|` は `==` よりも演算子の優先順位が高いため、括弧を取ると動かなくなることに注意してください。

:::{admonition} より複雑な条件式の例
:class: hint

論理演算を使ってより現実的かつ複雑な条件式を表現する例としては、JijZept 典型問題集の「{external+zept_tutor:doc}`30_radio_telescope_scheduling`」が参考になるでしょう。
:::


### ストリームの論理演算

論理演算はストリーム式に対しても使うことができ、特に `|`により和集合を、`&` により共通部分を表すことができます。
ただし、集合の否定（補集合）は無限集合になり得るためサポートしておらず、かわりに {py:func}`jijmodeling.diff` 関数を使って特定の二つのストリームの間の差分を取る操作が提供されています。

ストリームの和集合は、最初のストリームの要素を順に走査し、次のストリームの要素を順に走査するものとして表現されます。
以下は、二つの添え字集合の和集合に入っている添え字に対応する `x[i]` の総和を取る例です：

```{code-cell} ipython3
@jm.Problem.define("Stream Union Example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=N)
    target_a = problem.Natural(less_than=N, ndim=1)
    target_b = problem.Natural(less_than=N, ndim=1)

    problem += jm.sum(x[i] for i in jm.stream(target_a) | jm.stream(target_b))


problem
```

```{code-cell} ipython3
import ommx.v1

a_data = [1, 3, 5]
b_data = [7, 3, 4]

instance_data = {"N": 10, "target_a": a_data, "target_b": b_data}
compiler = jm.Compiler.from_problem(problem, instance_data)
xs = [compiler.get_decision_variable_by_name("x", [i]) for i in range(10)]

instance = compiler.eval_problem(problem)

expected = ommx.v1.Function(xs[1] + xs[3] + xs[5] + xs[7] + xs[3] + xs[4])
assert instance.objective.almost_equal(expected)
```

共通部分 `A & B` は、第 1 引数 `A` の要素を順に走査し、第 2 引数 `B` に含まれている場合のみ残す形で計算されます。
特に、`A` 内の要素の順番や重複は保たれる一方、`B` の要素の順番や重複数は無視されます。
以下は、添え字の集合 $A$ と部分的に定義された係数の辞書 $B$ が与えられた時に、両者で定義されている添え字の共通部分上でのみ係数和を取る例です：

```{code-cell} ipython3
@jm.Problem.define("Stream Intersection Example")
def problem(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    A = problem.Placeholder("A", ndim=1, dtype=L)
    B = problem.PartialDict("B", dict_keys=L, dtype=float)
    x = problem.BinaryVar(dict_keys=L)

    problem += jm.sum(B[l] * x[l] for l in jm.stream(A) & B.keys())


problem
```

```{code-cell} ipython3
import ommx.v1

L_data = ["a", "b", "c", "d", "e"]
A_data = ["a", "b", "c", "a"]
B_data = {"e": 1, "c": 10, "d": 100, "a": 1000}

instance_data = {"L": L_data, "A": A_data, "B": B_data}
compiler = jm.Compiler.from_problem(problem, instance_data)
xs = {i: compiler.get_decision_variable_by_name("x", [i]) for i in L_data}

instance = compiler.eval_problem(problem)
expected = ommx.v1.Function(
    B_data["a"] * xs["a"] + B_data["a"] * xs["a"] + B_data["c"] * xs["c"]
)

assert instance.objective.almost_equal(expected)
```

差分 `A.diff(B)` は、第 1 引数 `A` の要素を順に走査し、第 2 引数 `B` に含まれていない要素のみ残す形で計算されます。
`B` の役割が反転しているだけで、各引数の要素の順・重複の扱いは `A & B` と同様です。
以下の例は、共通部分 `A & B` の例添え字 $A$ に含まれない添え字についてだけ総和を取るようにしたものです。

```{code-cell} ipython3
@jm.Problem.define("Stream Intersection Example")
def problem(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    A = problem.Placeholder("A", ndim=1, dtype=L)
    B = problem.PartialDict("B", dict_keys=L, dtype=float)
    x = problem.BinaryVar(dict_keys=L)

    problem += jm.sum(B[l] * x[l] for l in B.keys().diff(jm.stream(A)))


problem
```

```{code-cell} ipython3
import ommx.v1

L_data = ["a", "b", "c", "d", "e"]
A_data = ["a", "b", "c", "a"]
B_data = {"e": 1, "c": 10, "d": 100, "a": 1000}

instance_data = {"L": L_data, "A": A_data, "B": B_data}
compiler = jm.Compiler.from_problem(problem, instance_data)
xs = {i: compiler.get_decision_variable_by_name("x", [i]) for i in L_data}

instance = compiler.eval_problem(problem)
expected = ommx.v1.Function(B_data["e"] * xs["e"] + B_data["d"] * xs["d"])

assert instance.objective.almost_equal(expected)
```

いずれの論理演算も演算結果のストリームで要素の一意性は保証されないため、必要に応じて前述の {py:func}`~jijmodeling.unique` 関数を使って重複を取り除いてください。

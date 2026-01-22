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

# 式の構築

本節では、JijModeling における色々な式の記述方法について説明していきます。
また、JijModeling の式は、幾つかの「種類（＝型）」に分類されます。
JijModeling はこの式の型の情報を Python の型ヒントに加え、独自のより詳細な検査を行う型システムを搭載しており、モデルの構築時に典型的な記述のミスを検出することが可能になっています。
以下では、JijModeling の「型」の概要について触れたあと、頻出するパターンの式の構築方法について学んでいきます。

:::{tip}
以下では頻出と思われるパターンに絞って説明するため、式の構築に使える網羅的な一覧については、API リファレンスの {py:class}`~jijmodeling.Expression` クラスや {py:mod}`~jijmodeling` モジュールのトップレベル関数一覧を参照してください。

また、本サイトの [`Cheat Sheet`](../references/cheat_sheet)には、更に複雑な事例集がまとめられていますので、本節を読んだ後にそちらも参照するとよいでしょう。
:::

```{code-cell} ipython3
import jijmodeling as jm
```

## 式とは

JijModeling では数理モデルの定義と入力データを分離することで種々の機能や効率性を達成しています。
そのため、JijModeling による数理モデルの構築は、数理モデルを直接数式を組み上げるのではなく、まず「入力データを与えられてはじめて具体的な数理モデルになるプログラム」を構築し、そこに入力データを与えて数理モデルの具体例＝インスタンスへとコンパイルする、という流れを取ります。
この「入力データを与えられてはじめて具体的な数理モデルになるプログラム」を、JijModeling では**式**と呼んでいます。

より詳しく言えば、JijModeling の式は具体的な値ではなく、決定変数やプレースホルダー、定数などからはじめてそれらを演算によって繋ぎ合わせた「構文木」の形で保持されています。
次の例を考えましょう：

```{code-cell} ipython3
:label: test-problem

@jm.Problem.define("Test Problem")
def ast_examples(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar()
    y = problem.IntegerVar(lower_bound=0, upper_bound=42, shape=(N,))

    z = x + y[0]
    w = jm.sum(y[i] for i in N)
    display(repr(z))
    display(repr(w))
```

:::{figure-md} expression-as-an-ast
<img src="./images/expressions-and-ast.svg" alt="Python変数には任意の式・変数が束縛されうる。式は演算をノード、定数やパラメータを葉とする構文木で表現される。" class="mb1" width="100%">

Python 変数に束縛された決定変数、プレースホルダー、構文木
:::

{numref}`図%s <expression-as-an-ast>`は `Test Problem` の定義を可視化した図です。
$x, y, N$ といった数理モデルに含まれる決定変数・プレースホルダーに対し、対応する Python 変数 `x`, `y`, `N` が定義されています。
このように、「変数」といったときにはそれがモデルに現れるパラメーターなのか、それらを一時的に束縛している Python 変数なのかに曖昧性があるので、注意が必要です。
それらを使って定義された `z = x + y[0]` や `w = jm.sum(y[i] for i in N)` は、これらの変数を参照しながら作られた記号的な構文木として表現されているのです。

:::{admonition} 式に対する関数呼び出しとメソッド呼び出しは同値
:class: tip

JijModeling では、{py:class}`~jijmodeling.Expression` オブジェクト `A` に対する単項演算は、`jm.log(A)` のように前置式の関数呼び出しとして書くこともできますし、`A.log()` のように後置式のメソッド呼び出しで書くこともできます。
どちらも全く同じ式が構築されるようになっているため、好きな方を使って書くとよいでしょう。{py:class}`~jijmodeling.DecisionVar` や {py:class}`~jijmodeling.Placeholder` に対しても同様です。
ただし、Python の組込み数値などに対してはメソッド呼び出しによるができないため、こうした場合は関数呼び出しを用いて `jm.log(2)` のように書く必要があります。
:::

## JijModeling の式の種類

JijModeling では、式は種類＝型によって分類され、適宜検査されています。
JijModeling を使う上では、こうした型システムの詳細を理解せずとも使えるように設計されています。
一方で、数理モデルを定式化する上で、JijModeling がどのように型検査を提供しているのかを理解することは、依然として有用です。
そこで、本節では、JijModeling における式の型について簡単に触れておきます。

実は、JijModeling では以下の二段階で型検査を行っています：

1. Python の型ヒントによるエディタの補完・型検査支援
2. JijModeling 内蔵の型検査器による、モデル構築時の型検査

(1) はライブラリに Python コードとして同梱されており、 `Pyright` や `ty`、`pyrefly` といった代表的な型検査器によるエディタや Jupyter Notebook 上での補完・静的検査を可能にしています。
しかし、Python の型ヒントで表現できる制約には制限があり、たとえば配列の添え字サイズの検証などには不向きです。こうした表現力の不足を補うため、JijModeling は (2) の独自の型検査器も内蔵しています。
(2)の型検査器は Python のユーザーが呼び出すものではなく、モデルへの制約条件や目的関数項の追加、決定変数・プレースホルダーの `shape` の宣言などの際に適宜呼び出され、記述の誤りがないかを（データを入力する以前に）自動的に検証するようになっています。いわば、エディタや Juptyer Notebook 上では「本来の」JijModeling の型システムよりも「粗い」基準で検査を行い、構築の過程でより細分された形で検査を行う形になっているのです。
具体的には、Python レベルの型検査では「式（{py:class}`Expression <jijmodeling.Expression>`）であるかどうか」しか区別されていませんが、JijModeling 内部ではより詳しく検査されています。
JijModeling が搭載している式の型はいくつかありますが、代表的には以下があります：

- 数値型：自然数や整数、連続変数など。
- カテゴリーラベル型：ユーザーが後から追加するラベルの集合。
- 高次元配列型
- 辞書型
- タプル型

これらを念頭に、以下では数理モデルの定式化でよく現れる演算について順に見ていきましょう。

:::{admonition} エラーになるタイミング
:class: important

JijModeling 内蔵の型検査は、式が**構築された直後ではなく**、以下のタイミングで行われます：

1. 数理モデルの目的関数に項が追加されたとき
2. {py:meth}`Problem.Constraint() <jijmodeling.Problem.Constraint>` により制約条件が宣言されたとき
3. `ndim`, `shape` や `dict_keys` の成分として現れたとき
4. {py:meth}`Problem.eval() <jijmodeling.Problem.eval>`関数や{py:class}`~jijmodeling.Compiler`によりインスタンスへコンパイルされるとき
5. {py:meth}`Problem.infer() <jijmodeling.Problem.infer>`関数により明示的に型推論を行わせたとき

これは、式が文脈に置かれて初めて適切な「型」が定まるためです。
そのため、以下で見ていく式の構築方法について「不正」な記述であっても、単に式を構築した段階でエラーになるとは限らないことに注意してください。
:::

## 式としてのプレースホルダー、決定変数

前節で見たように、JijModeling では {py:meth}`Problem.BinaryVar <jijmodeling.Problem.BinaryVar>` や {py:meth}`Problem.Placeholder <jijmodeling.Problem.Placeholder>` などによって、決定変数やプレースホルダーを定義します。
この際に返されるのは、それぞれの変数のメタデータを保持する {py:class}`DecisionVar <jijmodeling.DecisionVar>` や {py:class}`Placeholder <jijmodeling.Placeholder>` オブジェクトですが、これらは式の構築中に現れると、自動的に {py:class}`Expression <jijmodeling.Expression>` オブジェクトへと変換されます。
`Test Problem`の例でも、Python 変数 `x` や `y` はそれぞれ {py:class}`DecisionVar <jijmodeling.DecisionVar>` オブジェクトですが、それを用いて `z = x + y[0]` などのように構築されると、 `x`, `y` はそれぞれ決定変数と決定変数の配列を表す式に変換されています。
また、`z` の定義中に現れる `0` は通常の Python の数値ですが、このような定数も JijModeling の式中に現れると自動で変換されるようになっています。

## 算術演算

Python 組込みの算術演算（{py:meth}`+ <jijmodeling.Expression.__add__>`, {py:meth}`- <jijmodeling.Expression.__sub__>`, {py:meth}`* <jijmodeling.Expression.__mul__>`, {py:meth}`/ <jijmodeling.Expression.__truediv__>`, {py:meth}`% <jijmodeling.Expression.__mod__>` などの加減乗除）は、JijModeling の式に対して用いることができます。
数値同士の演算は期待通り動作するのに加え、（高次元）配列同士や、キー集合が一致する {py:meth}`TotalDict <jijmodeling.Problem.TotalDict>` に対しても、一定の条件を満たせば演算を行うことができます。
具体的には、以下の組み合わせ（左右問わず）に対して算術演算がサポートされています：

1. スカラー同士の算術演算
2. スカラーと高次元配列の算術演算
3. スカラーと辞書の算術演算
4. 同じシェイプを持つ高次元配列同士の算術演算
5. 同じキー集合を持つ全域辞書（{py:meth}`TotalDict <jijmodeling.Problem.TotalDict>`）同士の算術演算

:::{admonition} JijModeling におけるブロードキャスト
:class: note

(2)-(4) は Numpy などで見られる**ブロードキャスト演算**に相当します。
Numpy ではより一般のシェイプ間の演算（たとえば $(N, M, L)$ と $(M, L)$ の間の演算など）もサポートされています。
このような Numpy の一般化されたブロードキャスト演算は簡潔な略記が可能になる一方で、後ほど読み返す際に意図が不明確になることが多々あります。
このため、JijModeling では意図的にブロードキャストの範囲を制限し、誰にとっても曖昧性がないと思われる場合にのみサポートしています。
:::

言葉だとわかりづらいと思いますので、例を見てみましょう。

```{code-cell} ipython3
problem = jm.Problem("Arithmetic Operations")
x = problem.BinaryVar("x", description="スカラーの決定変数")
N = problem.Length("N")
M = problem.Length("M")
y = problem.IntegerVar(
    "y",
    lower_bound=0, upper_bound=10,
    shape=(N,M), description="2次元配列の決定変数"
)
z = problem.ContinuousVar(
    "z", lower_bound=-1, upper_bound=42, 
    shape=(N,M,N), description="2次元配列の決定変数"
)
S = problem.TotalDict("S", dtype=float, dict_keys=N, description="スカラーの全域辞書")
s = problem.ContinuousVar("s", lower_bound=0, upper_bound=10, dict_keys=N)
W = problem.Float("w", shape=(N, M))

problem
```

### 許容される例

```{code-cell} ipython3
problem.infer(x + 1) # OK! （スカラー同士の加算）
```

```{code-cell} ipython3
problem.infer(y - x) # OK! （多重配列とスカラーの減算）
```

```{code-cell} ipython3
:tags: [raises-exception]

problem.infer(S * x) # OK! （スカラーと辞書の乗算）
```

<!-- TODO: 例外になるべきでない！ -->

```{code-cell} ipython3
problem.infer(y / W) # OK! （同一形状 (N, M) の配列同士の除算）
```

<!-- TODO: max じゃなくて完全一致にならないとだめ！ -->

```{code-cell} ipython3
:tags: [raises-exception]

problem.infer(S + s) # OK! （同一キー集合を持つ全域辞書同士の加算）
```

<!-- TODO: 例外になるべきでない！ -->

### 許容されない例

```{code-cell} ipython3
try:
    # ERROR!（辞書と配列の乗算）
    problem.infer(S * y)
except Exception as e:
    print(e)
```

```{code-cell} ipython3
try:
    # ERROR!（形状が異なる配列どうしの演算）
    problem.infer(y + z)
except Exception as e:
    print(e)
```

:::{admonition} 決定変数による除算について
:class: caution

モデルの構築の時点では、決定変数が現れうる式は加減乗除の左右どちらの辺にも現れることができます。
一方、これをインスタンスへとコンパイルする際には、決定変数が除法の右辺に現れる（上の例では `N / x` など）場合、現時点ではエラーになります。
これは、ソルバーによっては決定変数による除法を（特定のエンコードにより）サポートしている場合もあるので記法としては許容したい一方、現時点において JijModeling や OMMX がそうしたエンコード方法に対応していないためです。
将来的には、JijModeling や OMMX がこのようなエンコード方法の指定に対応し、一部のケースでは実際にインスタンスへとコンパイルできるようになる予定です。
:::

:::{admonition} 初等超越関数
:class: tip

JijModeling の式では、加減乗除だけではなく、三角関数（{py:meth}`~jijmodeling.Expression.sin`, {py:meth}`~jijmodeling.Expression.cos`, {py:meth}`~jijmodeling.Expression.tan`など）や対数関数（{py:meth}`~jijmodeling.Expression.log2`, {py:meth}`~jijmodeling.Expression.log10`, {py:meth}`~jijmodeling.Expression.ln`）などの初等超越関数もサポートしています。
これらの関数も決定変数の有無に関わらず式に適用できますが、現時点ではインスタンスへのコンパイル時に決定変数を含む式に適用されている場合はエラーになります。
:::

## 比較演算

<!-- markdownlint-disable -->
等値演算子（{py:meth}`== <jijmodeling.Expression.__eq__>`, {py:meth}` != <jijmodeling.Expression.__ne__>`）や順序比較演算子（{py:meth}`< <jijmodeling.Expression.__lt__>`, {py:meth}`<= <jijmodeling.Expression.__le__>`, {py:meth}`> <jijmodeling.Expression.__gt__>`, {py:meth}`>= <jijmodeling.Expression.__ge__>`）も、JijModeling の式に対して用いることができます。
<!-- markdownlint-enable -->

これら比較演算子の**両辺が共に決定変数を含まない**場合、値は真偽値型 `Bool` の式として評価されます。一方、両辺の少なくとも一方が決定変数を含みうる場合、これは特別な**比較型**として扱われます。これは、次節で触れる制約条件の定義では決定変数を現れる式同士を比較できる必要がある一方、本節で触れる内包表記などで使われる場合は真偽値が確定する比較式が使える必要があるためです。

現状では、比較演算子はスカラーやカテゴリーラベル、またはそれらから成る配列・辞書に対して用いることができます。
配列や辞書に対する比較演算子の仕様条件は、算術演算のオーバーロード規則と同様です。

```{code-cell} ipython3
problem.infer(x == y) # OK! （スカラーと配列の等値比較）
```

```{code-cell} ipython3
problem.infer(N <= N) # OK! （スカラー同士の順序比較）
```

```{code-cell} ipython3
problem.infer(y > W) # OK! （同一形状配列同士の比較）
```

## 配列・辞書の添え字（インデックス）

### 添え字による要素アクセスと像

Python の組み込みのリストや辞書、あるいは {py:class}`numpy.ndarray` と同様、JijModeling の式でも `x[i]のような多次元の添え字（インデックス）を用いることができます。
具体的には、JijModeling では次の型を持つ式に対して添え字を用いることができます：

1. （高次元）配列
   + **許容される添え字**：決定変数を含まない自然数型の式
2. 辞書
   + **許容される添え字**：辞書のキー集合に含まれるカテゴリーラベル型や、決定変数を含む任意の整数式。
3. タプル
   + **許容される添え字**：決定変数を含まず成分数内の自然数型の式

また、添え字に現れることができるのは決定変数を含まない自然数・整数やカテゴリーラベルのみです。
添え字は `x[i,j,k]` のように複数成分を同時に書くことができますが、タプルの成分数や、配列の次元、辞書のタプル長を越える添え字を用いると型エラーとなります。

配列の添え字では、更に`x[:, 1]` のようなスライス記法を用いることができます。
この場合、`x[:, 1]` は第 0 次元は全て保持しつつ第 1 次元では `1` 番目のものからなる新たな配列を返しますが。`x`が二次元配列であれば返値は一次元配列、三次元以上の$N$次元であれば$N-1$次元配列となり、一次元以下である場合は型エラーとなります。
また、`x[1, 1:N:2]`のようにステップ数や終了インデックスを指定するスライスもサポートしています。
スライス記法の詳細については、Python 公式ドキュメントの「{external+python:ref}`slicings`」を参照してください。

### 配列式や辞書式の添え字の集合の取得

配列型や辞書型を持つ式に対しては、その添え字の集合を取得することができます。
配列に対しては {py:meth}`~jijmodeling.Expression.indices` によりインデックスの全体を、辞書に対しては {py:meth}`~jijmodeling.Expression.keys` によりキー集合を取得することができます。
これを使うと、たとえば `PartialDict` プレースホルダーと同じ定義域を持つような辞書型の決定変数を以下のようにして定義することができます。

```{code-cell} ipython3
:tags: [raises-exception]

problem = jm.Problem("Index and Keys Example")
N = problem.Length("N")
L = problem.CategoryLabel("L")
S = problem.PartialDict("S", dtype=float, dict_keys=(N, L))
x = problem.BinaryVar("x", dict_keys=S.keys())
problem
```

<!-- これはエラーになるべきではない！！！！！ -->

## 集合演算と内包表記による総和・総積

### JijModeling における「集合」

JijModeling では、「特定の型の値からなる一連の値」を表す概念である**集合**をサポートしています。前節の最後で触れた {py:meth}`~jijmodeling.Expression.indices` や {py:meth}`~jijmodeling.Expression.keys` も、実際には**添え字の集合**を表す式を返します。
この集合の概念は、特定の範囲を渡る添え字を使いたい場合や総和・総積を取る場合、または添え字つきの制約条件を定義する際に使われます。

:::{admonition} JijModeling の集合はストリーム
:class: note

他のモデラーに倣い JijModeling でも「集合」と呼んでいますが、数学的には「集合」は重複を持たず、列挙する順番も関係ないものです。
一方で、**JijModeling の「集合」は要素の重複も許容し、要素の順番も保持**します。
厳密には、JijModeling の「集合」は一般のプログラミング言語では**ストリーム**や**イテレーター**（反復子）と呼ばれるものに相当します。
:::

一部の型の値は自動的に集合へと変換されます。たとえば、多次元配列は、要素を行優先順で走査する集合に、自然数$N$は集合 $\{0, 1, \ldots, N-1\}$ に自動的に変換されます。

:::{admonition} JijModeling 1 系統からの変更点：配列の「集合」としての振る舞い
:class: caution

JijModeling 1 系統では、多次元配列が `belong_to=` や `forall=` に現れていた場合、内側の行を順に走査する集合のように振る舞っていました。
つまり、JijModeling 1 では `A` がシェイプ `(N, M)` の配列である場合、`A` に対する走査は長さ `M` の一次元配列からなる `N` 個の要素を持つ集合として扱われていました。

JijModeling 2 からは、こうした振る舞いは廃止され、要素を順に走査する挙動になります。旧来の挙動を使いたい場合、{py:func}`~jijmodeling.rows`関数を使い`jm.rows(A)` または `A.rows()` と明示的に変換してください。
:::

基本的に集合への変換は自動的に行われますが、明示的に集合に変換したい場合は {py:func}`~jijmodeling.set` 関数を使うことができます。

### 集合の総和・総積

JijModeling は Python 標準ライブラリの {py:func}`~map` 関数に対応する、{py:func}`jijmodeling.map` 関数を提供しており、これらと {py:func}`jijmodeling.sum` 関数や {py:func}`jijmodeling.prod` 関数を組み合わせることで、集合に渡る総和・総積を表現することができます。

:::{note}
簡単のため以下では {py:func}`jijmodeling.sum`（または {py:meth}`Expression.sum() <jijmodeling.Expression.sum>`）関数を使った総和の例を示しますが、{py:func}`jijmodeling.prod` や {py:func}`Expression.prod() <jijmodeling.Expression.prod>` を使った総積も同様に記述できます。
:::

更に、Decorator API を使えば、こうした高階関数を直接かかずに、直感的な{external+python:ref}`内包表記 <comprehensions>`の形で集合を構築することができます。

たとえば、決定変数とプレースホルダーの積の総和は、Decorator API を使えば以下のように内包表記で記述することができます：

```{code-cell} ipython3
@jm.Problem.define("Sum Example")
def sum_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(a[i] * x[i] for i in N)

sum_example
```

同じものを、`map` を使って Plain API で書いたものは次のようになります：

```{code-cell} ipython3
sum_example_plain = jm.Problem("Sum Example (Plain)")
N = sum_example_plain.Length("N")
a = sum_example_plain.Float("a", shape=(N,))
x = sum_example_plain.BinaryVar("x", shape=(N,))
sum_example_plain += jm.sum(
    jm.map(
        lambda i: a[i] * x[i],
        N
    )
)

sum_example_plain
```

このような単純な総和の場合、{py:func}`~jijmodeling.sum` に定義域と和を取る項を返す関数の二つの引数を渡すことでも、総和を表現することもできます：

```{code-cell} ipython3
sum_example_plain_alt = jm.Problem("Sum Example (Plain, Alt)")
N = sum_example_plain_alt.Length("N")
a = sum_example_plain_alt.Float("a", shape=(N,))
x = sum_example_plain_alt.BinaryVar("x", shape=(N,))
sum_example_plain_alt += jm.sum(N, lambda i: a[i] * x[i])

sum_example_plain_alt
```

このように、Decorator API を使わずに Plain API のみで済ませる場合、添え字を渡る式を作成するには Python の {external+python:ref}`lambda 式 <lambda>` を使う必要があります。

:::{tip}
{py:func}`~jijmodeling.sum` / {py:func}`~jijmodeling.prod` が一引数関数やメソッドとして呼ばれた場合は集合の総和・総積を取るため、単に `x` の要素の和を取りたいだけであれば `jm.sum(x)` や `x.sum()` のように書いたり、また前項で採り上げた限定的なブロードキャストを使えば、上の例は `jm.sum(a * x)` のように書くこともできます。これは、`x` が二次元以上の配列であったとしても同様です。
:::

### 条件つき総和・総積

Decorator API の内包表記では `if` を使うことができますので、たとえば、偶数であるような `i`についてだけ `a[i] * x[i]` の総和を取りたかった場合、Decorator API では次のように書くことができます：

```{code-cell} ipython3
@jm.Problem.define("Even Sum Example")
def even_sum_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(
        a[i] * x[i] for i in N if (i % 2) == 0
    )

even_sum_example
```

また、JijModeling は Python 標準の {py:func}`filter` 関数に対応する {py:func}`~jijmodeling.filter` 関数を提供していますので、上のモデルに対応するものは Plain API でも次のように書くことができます：

```{code-cell} ipython3
even_sum_example_plain = jm.Problem("Even Sum Example (Plain)")
N = even_sum_example_plain.Length("N")
a = even_sum_example_plain.Float("a", shape=(N,))
x = even_sum_example_plain.BinaryVar("x", shape=(N,))
even_sum_example_plain += jm.sum(
    N.filter(lambda i: (i % 2) == 0),
    lambda i: a[i] * x[i],
)

even_sum_example_plain
```

### 複数の添え字に渡る総和・総積

Decorator API の内包表記はネストされた `for` や `if` をサポートしていますので、複数の添え字を渡るような総和についても単純に `for` を重ねることで書くことができます：

```{code-cell} ipython3
@jm.Problem.define("Double Sum Example")
def double_sum_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    Q = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(Q[i, j] for i in N for j in M)

double_sum_example
```

あるいは、{py:func}`jijmodeling.product` 関数により直積集合 $A_1 \times \ldots \times A_n$ を取ることができますので、以下のように書いても同じことです：

```{code-cell} ipython3
@jm.Problem.define("Double Sum Example (Alt)")
def double_sum_example_alt(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    Q = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(Q[i, j] for (i, j) in jm.product(N, M))

double_sum_example_alt
```

`if`文を使えば、更に以下のような複雑な例も書くことができます：

```{code-cell} ipython3
@jm.Problem.define("Filtered Double Sum Example")
def filtered_double_sum_example(problem: jm.DecoratedProblem):
    N = problem.Length()
    M = problem.Length()
    Q = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=(N, M))
    problem += jm.sum(
        Q[i, j]
        for i in N for j in M
        if (i + j) % 2 == 0 # 和が偶数のときのみ和を取る
    )

filtered_double_sum_example
```

このような例を Plain API のみで書く場合は、次のように書くことになります：

```{code-cell} ipython3
filtered_double_sum_example_plain = jm.Problem("Filtered Double Sum Example (Plain)")
N = filtered_double_sum_example_plain.Length("N")
M = filtered_double_sum_example_plain.Length("M")
Q = filtered_double_sum_example_plain.Float("Q", shape=(N, M))
x = filtered_double_sum_example_plain.BinaryVar("x", shape=(N, M))
filtered_double_sum_example_plain += jm.sum(
    jm.product(N, M).filter(lambda i, j: (i + j) % 2 == 0),
    lambda i, j: Q[i, j]
)

filtered_double_sum_example_plain
```

あるいは、 {py:func}`jijmodeling.flat_map`（またはメソッド形式の {py:meth}`Expression.flat_map() <jijmodeling.Expression.flat_map>`）を使うと返値が集合となるような関数をつかって `map` することができるため、以下のように書くこともできます：

```{code-cell} ipython3
jm.sum(
    N.flat_map(
        lambda i: jm.map(lambda j: (i, j), M),
    ).filter(
        lambda i, j: (i + j) % 2 == 0
    ),
    lambda i, j: Q[i, j]
)
```

このように、Decorator API を使わずとも原理的に全てのモデルを記述することはできますが、複雑でよみづらくなるため、Decorator API の利用をお勧めしています。

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

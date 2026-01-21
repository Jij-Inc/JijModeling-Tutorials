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
また、JijModeling の式は、幾つかの種類＝型に分類されます。
JijModeling はこの式の型の情報を Python の型ヒントに加え、独自のより詳細な検査を行う型システムを搭載しており、モデルの構築時に典型的な記述のミスを検出することが可能になっています。
以下では、JijModeling の「型」の概要について触れたあと、頻出するパターンの式の構築方法について学んでいきます。

:::{tip}
以下では頻出と思われるパターンに絞って説明するため、式の構築に使える網羅的な一覧については、API リファレンスの {py:class}`~jijmodeling.Expression` クラスや {py:mod}`~jijmodeling` モジュールのトップレベル関数一覧を参照してください。
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
5. {py:meth}`Problem.infer () <jijmodeling.Problem.infer>`関数により明示的に型推論を行わせたとき

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
:class: tips

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

## 添え字（インデックス）

## 集合演算と内包表記による総和・総積

### 条件つき総和・総積

### 複数の添え字に渡る総和・総積

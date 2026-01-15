---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# 変数の定義

本節では、JijModeling において現れる二種類の変数、**決定変数**と**プレースホルダー**について、それぞれの役割と定義の仕方を学びます。
まずはいつも通りのモジュールのインポートから始めましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

## JijModelingにおける二種類の「変数」

JijModeling では、二種類の**変数**が存在します。
一つは数理最適化問題の重要な構成要素の一つである**決定変数**であり、ソルバーにより値が決定される意思決定のための変数です。
これに加え、JijModeling ではインスタンスへのコンパイル時にインスタンスデータの値が代入される**プレースホルダー**と呼ばれる種類の変数が存在します。
後者のプレースホルダーの概念は、入力データと数理モデルの定義を分離している JijModeling 特有の概念であり、これによって型検査による誤りの検出や制約検出、簡潔な$\LaTeX$出力などの機能が実現されています。

:::{figure-md} two-kinds-of-vars

<img src="./images/decision-vars-and-placeholders.svg" alt="コンパイル時にインスタンスデータが代入されるのがPlaceholder、コンパイル後も残りソルバーによって決定されるのが決定変数" class="mb1" width="100%">

プレースホルダーと決定変数
:::

[図1](#two-kinds-of-vars)に両者の簡単な例を示しました。
$N$や$d$はコンパイル時にインスタンスデータが代入されるパラメータ、つまり**プレースホルダー**であり、インスタンスでは具体的な値に置き換えられています。
一方、各$x_i$たちはソルバーによって値が決定される**決定変数**であり、インスタンスにおいても残りつづけています。
この例では、$x_n$たちはプレースホルダー$N$の要素$n$によって添え字づけられており、数理モデルの段階では長さは不定になっています。
しかし、コンパイル時に具体的な$N$の値は確定し、この例では$3$個の独立した決定変数へと展開されています。

以上を踏まえて、決定変数・プレースホルダーそれぞれの種類と宣言方法について見ていきましょう。

:::{hint}
以下では構成の都合上決定変数→プレースホルダーの順に宣言方法を見ていきますが、変数間の依存関係さえ守られていれば定義する順番に特に制限はありません。
:::

(single_vars)=
## 単独の変数の宣言

この節では、決定変数・プレースホルダーの種類と、単独の（添え字がついていない）変数の宣言方法について学びます。
「[概要](./overview)」や「[数理モデルの宣言](./problem)」でも説明したように、JijModeling ではこれらの決定変数は特定の数理モデルに紐付けて登録・宣言されます。

### 単独の決定変数

決定変数は各種ソルバーが制約条件と目的関数に基づいて値を決定する変数です。JijModeling は汎用モデラーであるため、代表的な以下の種類をサポートしています：

| 種類 | 数式 | 説明 |
| :---- | :--: | :--- |
| [`BinaryVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.BinaryVar) | $\{0, 1\}$ | $0$ または $1$ の値を取るバイナリ変数。上下界の設定は不要。 |
| [`IntegerVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.IntegerVar) | $\mathbb{Z}$ | 整数変数。上下界の設定が必要。 |
| [`ContinuousVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.ContinuousVar) | $\mathbb{R}$ | 実数値を取る連続変数。上下界の設定が必要。 |
| [`SemiIntegerVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.SemiIntegerVar) | - | 上下界内の整数値またはゼロの値をとる変数。上下界の設定が必要。 |
| [`SemiContinuousVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.SemiContinuousVar) | - | 上下界内の連続値またはゼロの値をとる変数。上下界の設定が必要。 |

特定の種類の決定変数を宣言するには、その変数を登録する `Problem` オブジェクトに対して対応する「種類」と同じ名前のメソッドを呼び出してやれば大丈夫です。
それでは、バイナリ変数 $x$ と、$-5$ 以上 $10.5$ 以下の範囲に値を取る連続変数 $W' \in[-5, 10.5]$ を持つ数理モデルを定義してみましょう。
Plain API では次のように定義できます：

```{code-cell} ipython3
problem = jm.Problem("Model with Variables")
x = problem.BinaryVar("x", description="適当な二値変数")
W = problem.ContinuousVar(
    "W'",
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
どのような式が書けるのかは次節「**式の構築**（近日公開）」を参考にしてください。
:::

更に、**Decorator API を使うと名前の指定を省略**でき、この場合 Python 変数と同じ変数名が自動的に使われます。
次は Decorator API で同様のモデルを定義している例です。

```{code-cell} ipython3
@jm.Problem.define("Model with Variables")
def deco_problem(deco_problem: jm.DecoratedProblem):
    # Decorator API の内側なので、 x の名前を省略している
    x = deco_problem.BinaryVar(description="適当な二値変数")
    # Decorator API 内であっても、名前を明示することもできる
    W = deco_problem.ContinuousVar(
        "W'",
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

(single_ph)=
### 単独のプレースホルダー

決定変数にも種類があるように、プレースホルダーにも種類があり、宣言時に指定する必要があります。
プレースホルダーはコンパイル時にユーザーが入力し得る値ですので、決定変数よりも種類が多くなっています。
代表的なプレースホルダーの型は以下の通りです：

| 種類 | 数式 | 説明 | 別名 |
| :--- | :--: | :-- | :-- |
| [`Binary`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Binary) | $\{0, 1\}$ | $0$ または $1$ の値をとる二値プレースホルダー。 | - |
| [`Natural`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Natural) | $\mathbb{N}$ | ゼロも含む自然数。配列のサイズや添え字などを表すのに使われる。 | [`Dim`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Dim), [`Length`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Length) |
| [`Integer`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Integer) | $\mathbb{Z}$ | 負の数も含む整数値。 | - |
| [`Float`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Float) | $\mathbb{R}$ | 一般の実数値（浮動小数点数値）プレースホルダー。 | - |
| これらのタプル | - | 成分ごとに型の決まった、固定長のタプル。一般にリストと組み合わせて使う。 | - |

決定変数と同様、「種類」に挙げたものと同じ名前の Problem のメソッドを呼ぶことで、プレースホルダーが宣言できます。ただし、プレースホルダーに上下界を指定する必要はなく、また指定のための引数も存在しないという違いがあります。
基本的には、決定変数から `*Var` を取ったものがプレースホルダーとしてだと思っておけばよいですが、`Float` のみ名前が違うことに留意してください。

:::{admonition} プレースホルダーの使い分け
:class: hint

プレースホルダーの種類については、`Natural` と `Float` だけ覚えておけば簡単なモデルの記述には十分でしょう。
特に、以下の基準を念頭に置いておくと使い分けがわかりやすいでしょう：

1. **配列のサイズやアイテムの個数**などを表すものは**自然数**として宣言し、`Natural` やよりわかりやすい `Dim`, `Length` といった別名で宣言する。
2. **それ以外の数値**は `Float` や、場合によってより細分された型の宣言を使えばよい。
:::

例を見てみましょう。

```{code-cell} ipython3
problem = jm.Problem("Another Problem with Placeholder")
ub = problem.Float("ub", description="決定変数 $x$ の上界")
x = problem.ContinuousVar("x", lower_bound=0, upper_bound=ub)
problem
```

式が表しているように、このモデルは決定変数$x$を一つだけ持ち、それが後からユーザーの入力するプレースホルダー $ub$ によって上からおさえられている、というモデルになっています。
決定変数の場合と同様、Decorator API を使えば Python 変数と同じ名前の場合プレースホルダーの名前を省略できます。

```{code-cell} ipython3
@jm.Problem.define("Another Problem with Placeholder")
def deco_problem(problem: jm.DecoratedProblem):
    ub = problem.Float(description="決定変数 $x$ の上界")
    x = problem.ContinuousVar(lower_bound=0, upper_bound=ub)

deco_problem
```

:::{admonition} [`Placeholder`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Placeholder) 構築子
:class: tip

上の表に掲げた `problem.Float`, `problem.Natural` などの構築子は、実はより一般的な [`problem.Placeholder`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Placeholder) 構築子の特別な場合になっており、たとえば`problem.Natural` は `problem.Placeholder(dtype=jm.DataType.NATURAL)` の省略記法として実装されています。`dtype`に対しては、`jm.DataType`列挙体のバリアントの他、Python 組み込みの型指定子 `float`, `int` や、Numpy の型指定子 `numpy.uint*`, `numpy.int*` などが使えます（`*` 以下のビット数の情報は単純に無視されます）。
次節で触れるタプルなどより複雑な型を持つようなものについては、`Placeholder` 構築子を使ってより詳細な仕様を指定することができるようになっています。また、`Placeholder` も他の特化型の構築子同様、Decorator API による変数名の省略もサポートしています。
:::

(var_info)=
## 変数の情報の取得

上記のようにして数理モデルに登録された決定変数・プレースホルダーの一覧は、`Problem` オブジェクトの [`decision_vars`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.DecoratedProblem.decision_vars) プロパティおよび [`placeholders`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.DecoratedProblem.placeholders) プロパティにより取得できます。
また、これらの一覧には、以下で扱う添え字つき変数の情報も含まれています。

両者は変数名をキーとし、それぞれのメタデータを値とする辞書を返します。

```{code-cell} ipython3
deco_problem.decision_vars
```

```{code-cell} ipython3
deco_problem.placeholders
```

こうした変数のメタデータは、変数式としても振る舞います。
そのため、複数の `@problem.update` や `@jm.Problem.define()` デコレータで逐次的に Problem を更新していく場合、それ以前のデコレータブロック内で定義された変数を参照するために使うことができます。

:::{tip}
将来的には `@problem.update` が定義済の変数たちを引数として取れるようにする変更が予定されています。期待してお待ちください！
:::

(family)=
## 添え字つき変数の宣言

前節まででは、単独の決定変数・プレースホルダーを定義する方法を見てきました。
しかし、一般に数理最適化問題の定式化の際には、添え字つきの変数からなる族を定義することが必須になってきます。
たとえば、クイックスタートの節（[SCIP版](../quickstart/scip)、[OpenJij版](../quickstart/openjij)）でも採り上げた典型的なナップザック問題を考えてみましょう。

$$
\begin{alignedat}{2}
\max &&\quad& \sum_{i = 0}^{N - 1} v_i x_i\\
\text{s.t.} &&& \sum_{i = 0}^{N - 1} w_i x_i \leq W,\\
&&& x_i \in \{0, 1\}
\end{alignedat}
$$

それぞれ価値$v_i \in \mathbb{R}$、重さ$w_i \in \mathbb{R}$の$N$個のアイテムを、ナップザックの容量$W$を越えない範囲で価値を最大化するように詰める問題です。
ここで、アイテムの個数$N$は入力されるインスタンスデータによって変更できることが望ましく、したがって $v_0 x_0 + v_1 x_1 + v_2 x_2$ のような固定された項数の和ではなく、範囲がプレースホルダー$N$に依存した総和$\sum$の形で表現できると嬉しいです。
こういった「入力するインスタンスデータによって項数の変わりうる変数一式」を表現するのに使われるのが、本節で説明する**添え字つき変数**になります。

JijModeling では、決定変数やプレースホルダーについて、以下の二種類のコレクションを定義することができます：

1. 変数の**配列**。$0$ から連続的にインデックスがついた配列。Numpy のような多次元配列も対応。
2. 変数の**辞書**。整数や文字列、あるいはカテゴリーラベルのタプルをキーとする離散的な辞書（連想配列）。

これらには専用の構築子も用意されていますが、多くは「[単独の変数の宣言](#single_vars)」で見た構築子に追加でキーワード引数を指定することで宣言することができます。

:::{admonition} 配列と辞書の使い分け
:class: hint

配列と辞書はそれぞれかわりに使うこともできますが、以下のような基準で使い分けると良いでしょう。

- **配列**を使うとよい場面
  1. 添え字が$0$から始まり、密に連続して並んでいる場合
  2. 巡回順など添え字の順番に時間的・空間的な意味がある場合
- **辞書**を使うとよい場面
  1. 添え字が$0$から開始するとは限らなかったり、部分的にしか定義されていない場合
  2. 添え字に自然数ではなく、文字列などで特別な意味を持たせたい場合
  3. 添え字の並び順に特に意味がない場合
:::

:::{admonition} 決定変数の「個数」
:class: important
:name: dec-var-count

決定変数もプレースホルダーもほぼ同じような方法で配列・辞書を定義することができますが、一点重要な違いがあります。

それは、決定変数はソルバーによって値が決定されるという性質上、コンパイル後のインスタンスにおいて**決定変数の個数が完全に確定している必要がある**という点です。
言い方を変えれば、**プレースホルダーの値によってインスタンスに含まれる決定変数の個数が完全に決まる必要がある**ということです。
この要請は、たとえばプレースホルダーとして与えられる配列は次元のみの指定だけでよかったり、辞書も部分的にしか定義されていない場合も許容するのに対し、決定変数の配列・辞書はそれぞれシェイプとキーの集合が（他のプレースホルダーへの参照を含みつつ）完全に指定されている必要がある、という違いに現れています。
:::

それでは、配列と辞書についてそれぞれの宣言方法について見ていきましょう。

### 変数の配列

JijModeling では、変数から成るものに限らず一次元やより高次元の配列を扱うことができます。また、実は[単独の変数の宣言](#single_vars)で宣言されたような、単なるスカラーも内部的にはゼロ次元の配列として扱われています。
JijModeling では、配列の各軸の長さについては入力されたプレースホルダーの値に依存することができますが、**次元（成分数）自体はゼロを含む自然数の定数リテラル**である必要があります。

(array_of_dec_vars)=
#### 決定変数の配列

決定変数の配列は、Plain API / Decorator API ともに、`BinaryVar`, `IntegerVar` などの既存の構築子に新たに `shape=` 引数を渡すことで宣言できます。
`shape`キーワード引数には、自然数から成る固定長のタプルを表す式を指定することができます。また、次元が$1$の場合は単に自然数を表す式で与えることもできます。
試しに、ナップザック問題に必要な変数たちを定義してみましょう。

(partial_knapsack_def)=

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only)", sense=jm.ProblemSense.MAXIMIZE)
def partial_knapsack(problem: jm.DecoratedProblem):
    W = problem.Float(description="ナップザックの耐荷重")
    N = problem.Length(description="アイテム数")
    # 以下の shape の指定は一要素タプルを使って shape=(N,) と書いても同じ
    x = problem.BinaryVar(shape=N, description="アイテム $i$ を入れるときだけ $1$")

partial_knapsack
```

この例では、まず単独のプレースホルダーとして耐荷重を表すプレースホルダー $W$ とアイテムの個数を表す $N$ を定義し、ついで $N$ 個の決定変数から成る決定変数の配列 $(x_i)_{i = 0}^{N-1}$ を定義しています。

:::{tip}
ここでは Decorator API を使って定義していますが、`shape`の指定方法は（変数名が省略できない点を除けば）Plain API でも同様です。
:::

次は `shape` にタプルを渡して二次元配列を定義している例です：

(multidim_arrays)=

```{code-cell} ipython3
multidim_arrays = jm.Problem("multidimensional arrays", sense=jm.ProblemSense.MINIMIZE)
N = multidim_arrays.Length("N") # Plain API なので変数名を指定している
M = multidim_arrays.Length("M")
x = multidim_arrays.BinaryVar(
    "x",
    shape=(N,M), # N x M 配列
)

multidim_arrays
```

(dec_var_array_bounds)=
#### 決定変数配列の上下界の指定

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

#### プレースホルダーの配列

プレースホルダーの配列を宣言する方法は二つあります。

一つは、決定変数の場合と同様に `shape` キーワード引数を使うことです。
ここでは、まず[前節](#array_of_dec_vars)で定義した部分的なナップザック問題に、それぞれ各アイテムの価値と重量を表すプレースホルダー $v_i$, $w_i$ を追加してみましょう。

(partial_knapsack_update)=

```{code-cell} ipython3
@partial_knapsack.update
def _(problem: jm.DecoratedProblem):
    N = problem.placeholders["N"]
    v = problem.Float(shape=(N,), description="各アイテムの価値")
    w = problem.Float(shape=(N,), description="各アイテムの重さ")

partial_knapsack
```

もう一つの方法は、**`ndim` キーワード引数**を用いるものです。
プレースホルダーの構築子の `ndim` キーワード引数として自然数の定数リテラルを渡すことで、次元のみ指定し、各次元の具体的な長さはコンパイル時にインスタンスデータを与えた時に確定するようなプレースホルダー配列が宣言できます。

:::{admonition} `shape` と `ndim` の同時指定について
:class: tip

`ndim` と `shape` キーワード引数を同時に指定することもできますが、この場合 `shape`の成分数と `ndim` の値が正確に一致している必要があります。
:::

たとえば、上で定義した `partial_knapsack` は `ndim` と次節で触れる [`len_at()` 関数](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Expression.len_at)を使って次のように定義することができます：

(partial_knapsack_ndim)=

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only, with ndim)", sense=jm.ProblemSense.MAXIMIZE)
def partial_knapsack_ndim(problem: jm.DecoratedProblem):
    W = problem.Float(description="ナップザックの耐荷重")
    v = problem.Float(ndim=1, description="各アイテムの価値")
    N = v.len_at(0)
    w = problem.Float(shape=N, description="各アイテムの重さ")
    x = problem.BinaryVar(shape=N, description="アイテム $i$ を入れるときだけ $1$")

partial_knapsack_ndim
```

[`array.len_at(i)`関数](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Expression.len_at)は、与えられた配列 `array` の $i$ 番目の軸の長さを返す関数です。
$w, v, x$ の長さはいずれも同じ長さですので、$v$を 1 次元配列として宣言しておき、残る $w$, $x$ はその長さを使って `shape` を指定する形にしているのです。
このように、最初に $N$ を独立して定義する方法と、配列の長さから復元する方法とでは、定義される数理モデルは意味的には同じですが、インスタンスデータの与え方が異なります。
たとえば、最初の `partial_knapsack` の例（[定義](#partial_knapsack_def)およびその[更新](#partial_knapsack_update)）では、$N$ も `Length` プレースホルダーとして宣言しているため、**インスタンスの作成**（近日公開）時に `W`, `v`, `w` だけではなく `N` の値もインスタンスデータとして与える必要があります。
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

JijModeling では、有向グラフ構造に相当する [`Graph` プレースホルダー構築子](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Graph)を提供しています。
たとえば、`G = problem.Graph()` とすると、$G$ は適当な頂点数を持つグラフにあたるプレースホルダーとして宣言されます。
実は、この構築子は一次元配列と「[単独のプレースホルダー](#single_ph)」で触れたタプルの組み合わせで表現されており、次のように書いたのと同値です：

```python
G = problem.Placeholder(
    dtype=typing.Tuple[jm.DataType.NATURAL, jm.DataType.NATURAL],
    ndim=1
)
```

ですので、`N = G.len_at(0)` とすることで $G$ の頂点数を取得することができますし、配列に関する種々の演算を使ってグラフを操作することができるようになります。
このように、JijModeling ではタプルと配列を組み合わせて、複雑な構造を表現できるようになっているのです。
:::

:::{deprecated} 2.0.0 **Jagged Array は強く非推奨**
JijModeling 1 系統には、シェイプが均一ではない Jagged Array というコレクションも用意されていました。
しかし、Jagged Array はその不均一性から型システムなどによる検証をうけづらいため、JijModeling 2 では**Jagged Array は強く非推奨**となっており、将来のリリースで取り除くことが計画されています。
こうした配列とタプルの組み合わせや後述する辞書を使うと、グラフ構造や $0$ 起点でなかったり疎な構造を表すことができますので、移行の際にはこうした新たな構成要素を用いて Jagged Array を用いない記述へと置き換えることを強く推奨します。
:::

### 変数の辞書とカテゴリーラベル

JijModeling では、配列に加えて変数の辞書（または連想配列）を宣言することができます。
配列がゼロから始まる連続的な添え字を持つ構造の記述に有効であったのに対し、辞書は疎であったり部分的にしか定義されていない添え字や、あるいは自然数以外の値を添え字を表現するのに使われます。

JijModeling の辞書には、辞書の「定義域」に関する制約により `PartialDict` と `TotalDict` という二種類が存在します：

| 辞書の種類 | 説明 |
| :------- | :--- |
| `PartialDict[K, V]` | 型 `K` の値をキーとし、各キーに型 `V` の値が割り当てられた辞書。キーの集合は `K` の部分集合でよい。 |
| `TotalDict[K, V]` | 型 `K` の**全てのあり得る値**に対して、それに対応する `V` 型の値が**全域で**割り当てられた辞書。`PartialDict`と違い、辞書は型 `K` 全域で定義されている必要がある |

これを踏まえて、辞書のキーとして使うことができる型を見ていきましょう。基本的には、以下の四種類のみです：

1. 整数（決定変数を含まない）
2. 文字列
3. カテゴリーラベル
4. 各成分が(1)から(3)のいずれかから成るタプル

このうち、(3) **カテゴリーラベル**は JijModeling に固有の概念であり、「辞書のキーとして使うことができ、具体的な値の候補はコンパイル時に与えられるラベルの集合」に相当します。
個別のカテゴリーラベルは、互いの等値性の比較（`==` / `!=`）以外に何の構造ももたないものとして扱われ、**コンパイル時に文字列または整数値の集合をインスタンスデータの一部として与えることで初めて実体化**されます。

:::{admonition} カテゴリーラベルとプレースホルダーの違い
:class: note

インスタンスデータの一部で与えるという点で、カテゴリーラベルはプレースホルダーは似ていますが、厳密には**プレースホルダーとは異なる概念**です。
各カテゴリーラベルはプレースホルダーとして使える**値の種類を新たに追加**するための機能であり、ある意味で Python などの言語で**ユーザーが新たに定義したクラスや型に相当**するものだからです。
:::

:::{admonition} カテゴリーラベルの使いどころ
:class: hint

以下のような場合、添え字にカテゴリーラベルを使うとよいでしょう：

1. 添え字の間の順序関係が本質的でない場合
2. 添え字上の数値演算が必要でない場合
3. 文字列の名前など、人間にとってわかりやすい名前を割り当てたい場合
:::

加えて、`TotalDict` は全ての値が列挙されているような型 `K` に対してのみ使える必要があるため、ある意味で「有界」な範囲が定まっているもののみとなります。
具体的には、各辞書では以下の表に示すようなキーを使うことができます。

| | 整数 | 文字列 | カテゴリーラベル | タプル |
| -----------: | :--: | :---: | :------------: | :---: |
| `PartialDict` | ○ | ○ | ○ | 左から成るものなら何でも |
| `TotalDict` | 決定変数を含まない自然数 $n$ 未満の自然数全体 $\mathbb{N}_{<n}$ | 予め指定された（一意な）文字列のリスト | ○ | 左から成るものなら何でも |

ここで、「○」は「この型として振る舞うものであれば何でもキー型として指定できる」という意味です。

以上は変数の辞書以外の一般の辞書にも適用される一般的な条件です。
以下では、簡単にカテゴリーラベルの宣言方法と、決定変数とプレースホルダーの辞書の定義方法を配列の場合の類推で手短かに採り上げ、その後に実際の定義の例を紹介しましょう。

#### カテゴリーラベルの宣言

カテゴリーラベルの宣言方法はプレースホルダーとほぼ同様であり、数理モデルに対して [`CategoryLabel()`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.CategoryLabel) 関数を呼び出して登録することで宣言します。
Plain API でのカテゴリーラベルの宣言方法は以下のようになります：

```{code-cell} ipython3
problem_catlab_plain = jm.Problem("Category Label Only")
L_plain = problem_catlab_plain.CategoryLabel(
    "L",
    description="適当なカテゴリーラベル"
)

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

Problem オブジェクトに登録されているカテゴリーラベルの一覧は、[`prbolem.category_labels`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.category_labels) プロパティにより取得できます。
また、個別のカテゴリーラベルに属する値の個数を表す式は [`jm.count()`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.count) 関数や [`CategoryLabel.count`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.CategoryLabel.count) メソッドにより取得できます。

#### 決定変数の辞書

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

#### プレースホルダーの辞書

プレースホルダーの辞書の宣言も、同様に `Float` や `Length` などの構築子に `shape` のかわりに `dict_keys` キーワード引数を渡すことで宣言できます。
決定変数の挙動と合わせるため、`dict_keys`のみが指定された場合そのプレースホルダー辞書は `TotalDict` として宣言されますが、同時に `partial_dict=True` 引数を渡すと `PartialDict` として宣言されるようになります。

`TotalDict` として宣言されている場合（つまり、`partial_dict` が指定されていないか `False` に設定されている場合）、`dict_keys` に指定できるものは決定変数の場合と同様以下の通りです：

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

また、[`TotalDict(name, dtype=..., dict_keys=...)`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.TotalDict) 構築子や [`PartialDict(name, dtype=..., dict_keys=...)`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.PartialDict) を `Problem` オブジェクトに対して呼び出すことでもプレースホルダーの辞書を宣言できます。

:::{admonition} プレースホルダー辞書に `ndim` 相当がない理由
:class: caution

プレースホルダー配列における `ndim` 相当の引数は存在しません。これは、キーの型を省略して成分数だけ与えた場合、インスタンスデータへのアクセスなしに具体的なキーの型を確定することができないためです。
:::

具体的な記述例は次節で見ていきましょう。

#### 辞書とカテゴリーラベルを使った問題定義の例

以下はナップザック問題をカテゴリーラベルを使って定式化しなおしたものです：

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only, CATEGORY LABEL)")
def knapsack_cat_dict(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    # TotalDict 構築子を使ってみる
    v = problem.TotalDict("v", dtype=float, dict_keys=L, description="各アイテムの価値")
    # dict_keys を使ってみる
    w = problem.Float(dict_keys=L, description="各アイテムの重量")
    x = problem.BinaryVar(dict_keys=L, description="アイテム $i$ を入れるときのみ $x_i = 1$")

knapsack_cat_dict
```

これだけだと、$N$のかわりに$L$を定義しているだけですね。
そこで、更に「一部のアイテムの組 $(i, j)$に対して、ナップザックに同時に詰めると追加の価値（シナジーボーナス）$s_{i, j}$が発生する」という追加条件を考えてみます。
このような場合に、`PartialDict` は大きな効力を発揮します：

```{code-cell} ipython3
@jm.Problem.define("Knapsack (vars only, with synergy)")
def knapsack_synergy(problem: jm.DecoratedProblem):
    L = problem.CategoryLabel()
    v = problem.TotalDict("v", dtype=float, dict_keys=L, description="各アイテムの価値")
    w = problem.Float(dict_keys=L, description="各アイテムの重量")
    x = problem.BinaryVar(dict_keys=L, description="アイテム $i$ を入れるときのみ $x_i = 1$")
    # PartialDict を使ってシナジーボーナスを表現！
    s = problem.PartialDict(
        dtype=float,
        dict_keys=(L, L),
        description="一部のアイテム間のシナジーボーナス"
    )

knapsack_synergy
```

$s$ が "A *partial* dictionary of placeholders..." と説明されているのが重要です。これにより、「$s$ は一部の$L$の組み合わせについてだけ定義されている」という条件が表現されているのです。
こうした定義はタプルのリストとそれと同じ長さの実数配列の組を使えば表現できなくもありませんが、辞書を使うことでより素直で自然な記述が可能になっています。

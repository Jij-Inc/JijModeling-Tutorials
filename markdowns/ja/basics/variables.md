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

本節では、JijModelingにおいて現れる二種類の変数、**決定変数**と**プレースホルダー**について、それぞれの役割と定義の仕方を学びます。
まずはいつも通りのモジュールのインポートから始めましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

## JijModelingにおける二種類の「変数」

JijModelingでは、二種類の**変数**が存在します。
一つは数理最適化問題の重要な構成要素の一つである**決定変数**であり、ソルバーにより値が決定される意思決定のための変数です。
これに加え、JijModeling ではインスタンスへのコンパイル時にインスタンスデータの値が代入される**プレースホルダー**と呼ばれる種類の変数が存在します。
後者のプレースホルダーの概念は、入力データと数理モデルの定義を分離しているJijModeling特有の概念であり、これによって型検査による誤りの検出や制約検出、簡潔な$\LaTeX$出力などの機能が実現されています。

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

(single_vars)=
## 単独の変数の宣言

この節では、決定変数・プレースホルダーの種類と、単独の（添え字がついていない）変数の宣言方法について学びます。
「[概要](./overview)」や「[数理モデルの宣言](./problem)」でも説明したように、JijModelingではこれらの決定変数は特定の数理モデルに紐付けて登録・宣言されます。

### 単独の決定変数

決定変数は各種ソルバーが制約条件と目的関数に基づいて値を決定する変数です。JijModelingは汎用モデラーであるため、代表的な以下の種類をサポートしています：

| 種類 | 数式 | 説明 | 
| :---- | :--: | :--- |
| [`BinaryVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.BinaryVar)  | $\{0, 1\}$ | $0$ または $1$ の値を取る二値変数。上下界の設定は不要。 |
| [`IntegerVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.IntegerVar) | $\mathbb{Z}$ | 整数変数。上下界の設定が必要。 |
| [`ContinuousVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.ContinuousVar) | $\mathbb{R}$ | 実数値を取る連続変数。上下界の設定が必要。 |
| [`SemiIntegerVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.SemiIntegerVar) | - | 上下界内の整数値またはゼロの値をとる変数。上下界の設定が必要。 |
| [`SemiContinuousVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.SemiContinuousVar) | - | 上下界内の連続値またはゼロの値をとる変数。上下界の設定が必要。 |

特定の種類の決定変数を宣言するには、その変数を登録する `Problem` オブジェクトに対して対応する「種類」と同じ名前のメソッドを呼び出してやれば大丈夫です。
それでは、二値変数 $x$ と、$-5$ 以上 $10.5$ 以下の範囲に値を取る連続変数 $W' \in [-5, 10.5]$ を持つ数理モデルを定義してみましょう。
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

第1引数は変数の名前を表す必須引数です。また、`upper_bound`および`lower_bound`は変数の上下界を表すキーワード引数であり、二値変数以外は必ず指定しなければいけません。
`description`は `Problem` のものと同様、人間があとでみてわかりやすい説明を書くた省略可能なキーワード引数です。

:::{tip}
`upper_bound`および`lower_bound`には、**決定変数を含まない**任意の JijModeling の式を書くことができます。
どのような式が書けるのかは次節「**式の構築**（近日公開）」を参考にしてください。
:::

更に、**Decorator API を使うと名前の指定を省略**でき、この場合Python変数と同じ変数名が自動的に使われます。
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

:::{caution}
Decorator API で変数名を省略できるのは、`x = problem.*Var(...)` のように「変数一つ `=` Var の宣言一つ」のような形をしているときのみです。
`x, y = (problem.BinaryVar(), problem.BinaryVar())` のように複数同時に宣言した場合などはエラーとなりますので注意してください。
:::

### 単独のプレースホルダー

決定変数にも種類があるように、プレースホルダーにも種類があり、宣言時に指定する必要があります。
プレースホルダーはコンパイル時にユーザが入力し得る値ですので、決定変数よりも種類が多くなっています。
代表的なプレースホルダーの型は以下の通りです：

| 種類 | 数式 | 説明 | 別名 |
| :--- | :--: | :-- | :-- |
| [`Binary`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Binary) | $\{0, 1\}$ | $0$ または $1$ の値をとる二値プレースホルダー。 | - |
| [`Natural`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Natural) | $\mathbb{N}$ | ゼロも含む自然数。配列のサイズや添え字などを表すのに使われる。 | [`Dim`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Dim), [`Length`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Length) |
| [`Integer`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Integer) | $\mathbb{Z}$ | 負の数も含む整数値。 | - |
| [`Float`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Float) | $\mathbb{R}$ | 一般の実数値（浮動小数点数値）プレースホルダー。 | - |
| [`CategoryLabel`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.CategoryLabel) | - | 辞書型などで使われるカテゴリラベル。後の節「[添え字つき変数の宣言](#family)」を参照。 | - |

決定変数と同様、「種類」に挙げたものと同じ名前の Problem のメソッドを呼ぶことで、変数が宣言できます。ただし、プレースホルダーに上下界を指定する必要はなく、また指定のための引数も存在しないという違いがあります。。
基本的には、決定変数から `*Var` を取ったものがプレースホルダとしてだと思っておけばよいですが、`Float` のみ名前が違うことに留意してください。

:::{hint}
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

:::{tip}
上の表に掲げた `problem.Float`, `problem.Natural` などの構築子は、実はより一般的な [`problem.Placeholder`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.Placeholder) 構築子の特別な場合になっています。
次節で触れるタプルなどより複雑な型を持つようなものについては、`Placeholder` 構築子を使ってより詳細な仕様を指定することができるようになっています。
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

JijModelingでは、決定変数やプレースホルダーについて、以下の二種類のコレクションを定義することができます：

1. 変数の**配列**。$0$ から連続的にインデックスがついた配列。Numpyのような多次元配列も対応。
2. 変数の**辞書**。整数や文字列、あるいはカテゴリラベルのタプルをキーとする離散的な辞書（連想配列）。

これらには専用の構築子も用意されていますが、多くは「[単独の変数の宣言](#single_vars)」で見た構築子に追加でキーワード引数を指定することで宣言することができます。

:::{hint}
配列と辞書はそれぞれ代わりに使うこともできますが、以下のような基準で使い分けると良いでしょう。

- **配列**を使うとよい場面
  1. 添え字が$0$から始まり、密に連続して並んでいる場合
  2. 巡回順など添え字の順番に時間的・空間的な意味がある場合
- **辞書**を使うとよい場面
  1. 添え字が$0$から開始するとは限らなかったり、部分的にしか定義されていない場合
  2. 添え字に自然数ではなく、文字列などで特別な意味を持たせたい場合
  3. 添え字の並び順に特に意味がない場合
:::

:::{important}
決定変数もプレースホルダーもほぼ同じような方法で配列・辞書を定義することができますが、一点重要な違いがあります。

それは、決定変数はソルバーによって値が決定されるという性質上、コンパイル後のインスタンスにおいて**決定変数の個数が完全に確定している必要がある**という点です。
言い方を変えれば、**プレースホルダーの値によってインスタンスに含まれる決定変数の個数が完全に決まる必要がある**ということです。
この要請は、たとえばプレースホルダーとして与えられる配列は次元のみの指定だけでよかったり、辞書も部分的にしか定義されていない場合も許容するのに対し、決定変数の配列・辞書はそれぞれシェイプと鍵の集合が（他のプレースホルダーへの参照を含みつつ）完全に指定されている必要がある、という違いに現れています。
:::

それでは、配列と辞書についてそれぞれの宣言方法について見ていきましょう。

### 変数の配列

#### 決定変数の配列

#### プレースホルダーの配列

:::{important}
JijModeling 1系統には、シェイプが均一ではない配列である Jagged Array というコレクションも用意されていました。
しかし、Jagged Array はその不均一性から型システムなどによる検証をうけづらいため、JijModeling 2 では**Jagged Array は強く非推奨**となっており、将来のリリースで取り除くことが計画されています。
0起点でなかったり疎な構造を表す場合には辞書が使え、グラフ構造の表現にはタプルを要素に持つ（一次元）配列が使えますので、移行の際にはこうした新たな構成要素を用いて Jagged Array を用いない記述へと置き換えることを強く推奨します。
:::

### 変数の辞書

## 変数の情報の取得

<!-- TODO: タプルについてはリストのところで触れる。 -->

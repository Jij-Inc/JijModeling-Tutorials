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

# JijModeling の式と型

以下では、数節にわたって JijModeling における色々な**式**の記述方法について説明していきます。
また、JijModeling の式は、幾つかの「種類（＝型）」に分類されます。
JijModeling はこの式の型の情報を Python の型ヒントに加え、独自のより詳細な検査を行う型システムを搭載しており、モデルの構築時に典型的な記述のミスを検出することが可能になっています。
本節では、JijModeling の「式」とはなにかと「型」の概要について簡単に説明していきます。

:::{tip}
以下では頻出と思われるパターンに絞って説明するため、式の構築に使える網羅的な一覧については、API リファレンスの {py:class}`~jijmodeling.Expression` クラスや {py:mod}`~jijmodeling` モジュールのトップレベル関数一覧を参照してください。

また、本サイトの {doc}`../references/cheat_sheet` には、更に複雑な事例集がまとめられていますので、本節を読んだ後にそちらも参照するとよいでしょう。
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

:::{figure} ./images/expressions-and-ast.svg
:alt: Python 変数には任意の式・変数が束縛されうる。式は演算をノード、定数やパラメータを葉とする構文木で表現される。
:width: 100%
:name: expression-as-an-ast

Python 変数に束縛された決定変数、プレースホルダー、構文木
:::

{numref}`図%s <expression-as-an-ast>`は `Test Problem` の定義を可視化した図です。
$x, y, N$ といった数理モデルに含まれる決定変数・プレースホルダーに対し、対応する Python 変数 `x`, `y`, `N` が定義されています。
このように、「変数」といったときにはそれがモデルに現れるパラメータなのか、それらを一時的に束縛している Python 変数なのかに曖昧性があるので、注意が必要です。
それらを使って定義された `z = x + y[0]` や `w = jm.sum(y[i] for i in N)` は、これらの変数を参照しながら作られた記号的な構文木として表現されているのです。

ここで `Length` などとして定義されているものが次節「{doc}`placeholders`」で説明するプレースホルダーであり、`BinaryVar` や `IntegerVar` として定義されているものが続く「{doc}`decision_variables`」で説明する決定変数です。
このように、JijModeling の「式」は、定数やプレースホルダー、決定変数などの個々の構成要素をさまざまな演算で組み合わせた形で表現されるのです。

:::{admonition} 式に対する関数呼び出しとメソッド呼び出しは同値
:class: tip

JijModeling では、{py:class}`~jijmodeling.Expression` オブジェクト `A` に対する単項演算は、`jm.log(A)` のように前置式の関数呼び出しとして書くこともできますし、`A.log()` のように後置式のメソッド呼び出しで書くこともできます。
どちらも全く同じ式が構築されるようになっているため、好きな方を使って書くとよいでしょう。{py:class}`~jijmodeling.DecisionVar` や {py:class}`~jijmodeling.Placeholder` に対しても同様です。
ただし、Python の組込み数値などに対してはメソッド呼び出しによるができないため、こうした場合は関数呼び出しを用いて `jm.log(2)` のように書く必要があります。
:::

## JijModeling の「式の種類＝型」

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
JijModeling が搭載している式の型はいくつかありますが、代表的なものを以下にまとめます：

| 種類 | 数式（表記例） | テキスト表記例 | 説明 |
| :--- | :----------- | :------------- | :--- |
| 数値型 | $\mathbb{N}, \mathbb{Z}, \mathbb{R}$ | `natural`, `int`, `float` | 自然数・整数・実数などの数値を表す型。 |
| カテゴリーラベル型 | $L$ | `CategoryLabel("L")` | ユーザーが後から追加するラベルの集合。 |
| 多次元配列型 | $\mathop{\mathrm{Array}}[N_1 \times \cdots \times N_k; A]$ | `Array[N1, .., Nk; A]` | `A`型の成分から成る、シェイプ$N_1 \times \cdots \times N_n$ の多次元配列。 |
| 辞書型 | $\mathrm{TotalDict}[K; V]$ / $\mathrm{PartialDict}[K; V]$ | `TotalDict[K; V]`, `PartialDict[K; V]` | キー集合 $K$ と値型 $V$ を持つ辞書の型。 |
| タプル型 | $T \times U$ | `Tuple[int, float]` | 成分ごとに型を持つ固定長タプルの型。 |

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

以下では、妥当な用例や妥当でない用例を例示するために、{py:meth}`Problem.infer() <jijmodeling.Problem.infer>` メソッドを用いています。
このメソッドは、`Problem`の持っている決定変数・プレースホルダーの情報を基に、与えられた式の型を推論するメソッドであり、不正な式を与えると型エラーを発生させます。
例を見てみましょう。ここでは、バイナリ変数 $x$ と整数 $N$ を足しているので、$x + N$ は整数型 $\mathbb{Z}$を持つものとして推論されています。

```{code-cell} ipython3
problem = jm.Problem("Type Inference Example")
x = problem.BinaryVar("x", description="スカラーの決定変数")
N = problem.Integer("N")

problem.infer(x + N)  # OK! スカラー同士の足し算
```

一方で、スカラー値と文字列は足し算できないため、次の例はエラーとなります。

```{code-cell} ipython3
try:
    # エラー！文字列とスカラーは足し算できない
    problem.infer(x + "hoge")
except Exception as e:
    print(e)
```

:::{admonition} `Expression` と `ExpressionLike` / `ExpressionFunction` の関係は？
:class: note

{external+api_reference:doc}`API リファレンス <index>` やエディタの補完・ドキュメント上では、`ExpressionLike` や `ExpressionFunction` といった型名が登場します。
これらはライブラリの実装には存在しないダミーの略記用の型であり、`Expression` に変換可能な型や、`Expression` から `Expression` への関数を表す型の略記です。
具体的には以下のように考えておけば大丈夫です：

| 型名 | 説明 |
| --- | --- |
| `ExpressionLike` | {py:class}`~jijmodeling.Expression` に変換することができる型を表す。 {py:class}`~jijmodeling.Expression` 自身の他、{py:class}`~jijmodeling.Placeholder`, {py:class}`~jijmodeling.DecisionVar`, {py:class}`~jijmodeling.NamedExpr`や、Python の数値、文字列、それらからなるタプル、リスト・辞書・Numpy配列などが文脈に応じて使えます。 |
| `ExpressoinFunction` | 一つ以上の {py:class}`~jijmodeling.Expression` オブジェクトを取り、 {py:class}`~jijmodeling.Expression` を返す関数。Pythonの型ヒントの仕組み上、最大5つの引数までしか列挙していませんが、実際には引数の個数に上限はありません。 |

:::

## 式のつくりかた

これ以降では、次の数節に分けて具体的な式の構築方法を見ていきます。

{doc}`placeholders`
:   プレースホルダーの宣言方法と、式中での役割について説明します。

{doc}`decision_variables`
:   決定変数の宣言方法と、式中での役割について説明します。

{doc}`arithmetic_and_comparison`
:   加減乗除などの算術演算や、大小・同値性比較などによる式の構築方法を紹介します。

{doc}`arrays_and_dicts`
:   多次元配列や辞書の宣言や要素へのアクセス方法などを説明します。

{doc}`set_and_logical_ops`
:   集合演算を用いて配列や辞書を畳み込む方法や、論理演算を用いた式の構築方法を紹介します。

また、これらの構文の具体的な用例については、{doc}`../references/cheat_sheet` が参考になるでしょう。

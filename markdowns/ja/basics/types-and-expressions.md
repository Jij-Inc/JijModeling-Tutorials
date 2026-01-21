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
以下では、JijModeling の「型」システムの概要について触れたあと、頻出するパターンの式の構築方法について学んでいきます。

```{code-cell} ipython3
import jijmodeling as jm
```

## 式とは

既に触れてきた通り、JijModeling は数理モデルの定義と入力データを分離することで種々の機能や効率性を達成しています。
そのため、JijModeling による数理モデルの構築は、数理モデルを直接数式を組み上げるのではなく、まず「入力データを与えられてはじめて具体的な数理モデルになるプログラム」を構築し、そこに入力データを与えて数理モデルの具体例＝インスタンスへとコンパイルする、という流れを取ります。
この「入力データを与えられてはじめて具体的な数理モデルになるプログラム」を、JijModeling では**式**と呼んでいます。

より詳しく言えば、JijModeling の式は具体的な値ではなく、決定変数やプレースホルダー、定数などからはじめてそれらを演算によって繋ぎ合わせた「構文木」の形で保持されています。
次のプログラムを考えましょう：

```{code-cell} ipython3
@jm.Problem.define("Test Problem")
def ast_examples(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar()
    y = problem.IntegerVar(lower_bound=0, upper_bound=42, shape=(N,))

    z = x + y[0]
    w = jm.sum(y[i] for i in N)
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

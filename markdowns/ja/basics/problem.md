---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# 数理モデルの宣言

JijModeling では、変数や制約条件などはすべて特定の数理モデルに紐付けて扱われます。
そこで、本節では個別の要素に入っていく前に数理モデルを宣言する方法について簡単に触れておきます。

## 数理モデルを表す `Problem` オブジェクトの作成

JijModeling で特定の数理モデルに対応するのは、{py:class}`~jijmodeling.Problem` オブジェクトであり、数理モデルの構築時には最初に宣言することになります。
まずは、JijModeling ライブラリを `jm` という名前で参照できるようにインポートしておきましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

### Plain API でのオブジェクトの作成

`Problem` を作成する方法には、Plain API と Decorator API を使う二種類の方法があります。
一つめは、Plain API を使って直接 `Problem` オブジェクトを作成する方法です。

```{code-cell} ipython3
plain_problem = jm.Problem(
    "Empty Problem",
    sense=jm.ProblemSense.MAXIMIZE,
    description="何の目的関数も制約条件も設定されていない、説明目的の最適化問題",
)
```

第 1 引数は数理モデルの名前を表す必須引数であり、残る二つのキーワード引数`sense`および`description`はいずれもオプション引数です。
`sense`は数理モデルが最大化問題（`jm.ProblemSense.MAXIMIZE`）と最小化問題化（`jm.ProblemSense.MINIMIZE`）のどちらであるかを指定する引数であり、省略した場合最小化問題として扱われます。
`description` は$\LaTeX$出力や OMMX のメタデータなどに出力される、数理モデルの意図を自然言語で表した説明文です。
表示してみると意図がわかるでしょう。

```{code-cell} ipython3
plain_problem
```

この時点では目的関数を設定していないため、ここでは $0$ が目的変数として表示されています。

### Decorator API による Problem オブジェクトの作成

次に、Decorator API を使って `Problem` オブジェクトを作成する方法を見てみましょう:

```{code-cell} ipython3
@jm.Problem.define(
    "Empty Problem",
    sense=jm.ProblemSense.MAXIMIZE,
    description="何の目的関数も制約条件も設定されていない、説明目的の最適化問題",
)
def deco_problem(problem: jm.DecoratedProblem):
    pass  # 何もしない


deco_problem
```

{py:meth}`~jijmodeling.Problem.define` は `jm.Problem()` と全く同じ引数を取りますが、直接変数に束縛するのではなく、直後に関数定義（ここでは `def deco_problem(...)`）を与えるという違いがあります。
`@jm.Problem.define()` では、関数定義を抜けた段階で宣言されている関数名と同じ名前（ここでは `deco_problem`）の変数に実際の `Problem` オブジェクトの定義が束縛されます。実際、上の例では関数定義を終えた直後に `deco_problem`を（Python 変数として）呼び出してその内容を印字させています。
このように、直前に `@` ではじまる式が付された関数は、その式により **デコレートされる**ているといいます。
実際には、このデコレートされた関数定義内では関数の第 1 引数 `problem` に対して種々の関数を呼び出して様々な変更・更新を行ってモデルを構築していくことになります。

:::{admonition} `DecoratedProblem` オブジェクトとは？
:class: caution

デコレートされた関数の第 1 引数は `Problem` オブジェクトではなく **`DecoratedProblem` オブジェクトである**ことに注意しましょう。
`DecoratedProblem` はデコレートされた関数の内側にしか登場し得ない `Problem` ダミーのクラスです。
`DecoratedProblem` は Decorator API にあわせて Python の型ヒントが指定されており、エディタ上での補完や型検査の恩恵が受けられるように用意されています。
:::

今回のように何の変更もしない場合、このような書式はやや冗長に見えるかもしれません。
しかし、`@jm.Problem.define()` でデコレートされた関数内では特に変数名の省略や内包表記を用いた総和・総積など、Decorator API の自然で直感的な記法を使うことができ、以降の節で見るように実際の問題定義の際には非常に便利です。

また、Plain / Decorator どちらの API でもできあがる Problem オブジェクトに差はありませんので、どちらで定義したものであるかを意識する必要は全くありません。
実際、上で定義した二つの `plain_problem` も `deco_problem` も `Problem`オブジェクトとして「同じ問題」であることが判定できます：

```{code-cell} ipython3
jm.is_same(plain_problem, deco_problem)
```

## `Problem` オブジェクトの更新

ここではほとんど空の Problem オブジェクトを作成しましたが、実際には決定変数や制約条件、目的関数などを追加し、`Problem` オブジェクトを逐次的に更新してモデルを構築していくのが実際の流れになります。
いずれの API で定義された `Problem` オブジェクト `problem` も機能に差はありませんので、Plain API を使って更新することもできますし、{py:meth}`@problem.update <jijmodeling.Problem.update>` デコレータを使って Decorator API を用いて更新することもできます。もちろん、両者を混ぜて使うことも可能です。
試しに、先ほど定義した問題たちに変数を追加してみましょう。

```{code-cell} ipython3
# 先程 Plain API で定義した `plain_problem` を Decorator API で更新する：
@plain_problem.update
def _(problem: jm.DecoratedProblem):
    # 単純に新たな二値決定変数 `x` を定義し、それを目的関数に足す。
    x = (
        problem.BinaryVar()
    )  #  Python 変数としての名前と決定変数としての名前が同じ場合、省略可！
    problem += x


# Plain API で今度は `y` という二値決定変数を足してみる。
y = plain_problem.BinaryVar("y")  # Plain API では名前指定 "y" は必須。
plain_problem += y
plain_problem
```

```{code-cell} ipython3
# 逆に Decorator API で定義された deco_problem を Plain API だけで更新してみる
x = deco_problem.BinaryVar("x")
y = deco_problem.BinaryVar("y")
deco_problem += x + y

deco_problem
```

ここでは `@problem.update` にデコレートされる関数の名前を `_` としていますが、`@problem.update` がデコレートする関数の名前は結果に影響がないため、任意の名前を設定して構いません。

:::{admonition} デコレートされた関数と変数スコープ
:class: caution

`@jm.Problem.define()` デコレータや `@problem.update` デコレータで定義されている Python 変数は、関数定義の外側から参照することはできません。
より正確には、数理モデルとしての変数や制約条件などは対応する `Problem` オブジェクトに登録されますが、その登録されたアイテムに対応する Python 変数は関数スコープの外には漏れない、ということです。

このため、`@jm.Problem.define()` や複数の `@problem.update` デコレータを使って逐次的にモデルを更新する場合、次節以降で説明する方法で `Problem` が持つメタデータを改めて引き出してから更新処理を行う必要があることに注意してください。
:::

それでは、次の節から具体的に問題の構築に必要な機能の各論に入っていきましょう。

:::{tip}
以上まではまだ Decorator API の嬉しさが見えてこないかもしれませんが、以下の各節を見ていくとその価値がわかるでしょう。
:::

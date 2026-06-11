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

# 配列・辞書に対する操作

{doc}`./placeholders` や {doc}`./decision_variables`では、各種変数の配列や辞書を定義する方法を扱いました。
JijModeling では、こうした変数から成るものに限らず、一般の要素を持つ配列や辞書（以下まとめて「コレクション」と呼びます）を扱うことができます。
以下では、各種コレクションの概念について改めて復習した後、それらを生成する関数や要素へのアクセス方法を見ていきます。
また、次節「{doc}`./set_and_logical_ops`」では、更に配列や辞書を集合と見なして総和や総積を取る方法についても触れます。

```{code-cell} ipython3
import jijmodeling as jm
```

## 配列・辞書、その違い

JijModeling では、**配列**と**辞書**の二種類のコレクションが存在します：

1. 変数の**配列**。$0$ から連続的にインデックスがついた配列。Numpy のような多次元配列も対応。
2. 変数の**辞書**。整数や文字列、あるいはカテゴリーラベルのタプルをキーとする離散的な辞書（連想配列）。

### JijModeling における（多次元）配列

JijModeling では、一次元やより多次元の配列を扱うことができます。また、単なるスカラーも内部的にはゼロ次元の配列と同値なものとして扱われています。
JijModeling では、配列の各軸の長さについては入力されたプレースホルダーの値に依存することができますが、**次元（成分数）自体はゼロを含む自然数の定数リテラル**である必要があります。

:::{admonition} 配列型の表記
:class: note

JijModeling の配列型は、次元とそ要素の型をセミコロン `;` で区切って表現されます：

| 例 | テキスト表記 | LaTeX表記 | 意味 |
| :-- | :----------- | :-------- | :--- |
| 1次元整数配列 | `Array[N; int]` | $\mathrm{Array}[N; \mathbb{Z}]$ | 長さ $N$ の整数配列 |
| 2次元実数配列 | `Array[N, M; float]` | $\mathrm{Array}[N \times M; \mathbb{R}]$ | $N \times M$ の実数行列 |

:::

### JijModeling における辞書とカテゴリーラベル

JijModeling では、配列に加えて辞書（または連想配列）も扱うことができます。
配列がゼロから始まる連続的な添え字を持つ構造の記述に有効であったのに対し、辞書は疎であったり部分的にしか定義されていない添え字や、あるいは自然数以外の値を添え字を表現するのに使われます。

JijModeling の辞書には、辞書の「定義域」に関する制約により `PartialDict` と `TotalDict` という二種類が存在します：

| 辞書の種類 | 数式 | 説明 |
| :------- | :---: | :--- |
| `PartialDict[K; V]` | $\mathrm{PartialDict}[K; V]$ | 型 `K` の値をキーとし、各キーに型 `V` の値が割り当てられた辞書。キーの集合は `K` の部分集合でよい。 |
| `TotalDict[K; V]` | $\mathrm{TotalDict}[K; V]$ | 型 `K` の**全てのあり得る値**に対して、それに対応する `V` 型の値が**全域で**割り当てられた辞書。`PartialDict`と違い、辞書は型 `K` 全域で定義されている必要がある |

これを踏まえて、辞書のキーとして使うことができる型を見ていきましょう。基本的には、以下の四種類のみです：

1. 整数（決定変数を含まない）
2. 文字列
3. カテゴリーラベル
4. 各成分が(1)から(3)のいずれかから成るタプル

このうち、(3) **カテゴリーラベル**は JijModeling に固有の概念であり、「辞書のキーとして使うことができ、具体的な値の候補はコンパイル時に与えられるラベルの集合」に相当します。
個別のカテゴリーラベルは、互いの等値性の比較（`==` / `!=`）以外に何の構造ももたないものとして扱われ、**コンパイル時に文字列または整数値の集合をインスタンスデータの一部として与えることで初めて実体化**されます。
カテゴリーラベルについては、{doc}`./placeholders`節で詳しく説明していますので、宣言方法等はそちらを参照してください。

加えて、`TotalDict` は全ての値が列挙されているような型 `K` に対してのみ使える必要があるため、ある意味で「有界」な範囲が定まっているもののみとなります。
具体的には、各辞書では以下の表に示すようなキーを使うことができます。

| | 整数 | 文字列 | カテゴリーラベル | タプル |
| -----------: | :--: | :---: | :------------: | :---: |
| `PartialDict` | ○ | ○ | ○ | 左から成るものなら何でも |
| `TotalDict` | 決定変数を含まない自然数 $n$ 未満の自然数全体 $\mathbb{N}_{<n}$ | 予め指定された（一意な）文字列のリスト | ○ | 左から成るものなら何でも |

ここで、「○」は「この型として振る舞うものであれば何でもキー型として指定できる」という意味です。

以上は変数の辞書以外の一般の辞書にも適用される一般的な条件です。
以下では、簡単にカテゴリーラベルの宣言方法と、決定変数とプレースホルダーの辞書の定義方法を配列の場合の類推で手短かに採り上げ、その後に実際の定義の例を紹介しましょう。

### 配列と辞書の使い分け

配列と辞書はそれぞれかわりに使うこともできますが、以下のような基準で使い分けると良いでしょう。

- **配列**を使うとよい場面
  1. 添え字が$0$から始まり、密に連続して並んでいる場合
  2. 巡回順など添え字の順番に時間的・空間的な意味がある場合
- **辞書**を使うとよい場面
  1. 添え字が$0$から開始するとは限らなかったり、部分的にしか定義されていない場合（構造が疎な場合）
  2. 添え字に自然数ではなく、文字列などで特別な意味を持たせたい場合
  3. 添え字の並び順に特に意味がない場合

## コレクションの生成：{py:func}`~jijmodeling.genarray` と {py:func}`~jijmodeling.gendict`

配列や辞書は、{doc}`./placeholders`や{doc}`./decision_variables`で説明したように、変数宣言時に導入することもできますが、他の式を使って新たに生成することができます。
配列の生成に使うのが {py:func}`~jijmodeling.genarray`関数、辞書の生成に使うのが {py:func}`~jijmodeling.gendict`関数です。

### 配列の生成関数：{py:func}`~jijmodeling.genarray`

{py:func}`~jijmodeling.genarray` は numpy の {py:func}`~numpy.fromfunction` に相当する関数であり、シェイプと添え字から要素への関数（生成関数）を与えることで、新しい配列を生成することができます。
以下では、`genarray` を用いて、シェイプ $(N, M)$ で各添え字の和を要素に持つ配列を生成しています：

```{code-cell} ipython3
problem = jm.Problem("Array and Dict Example")
N = problem.Length("N")
M = problem.Length("M")

jm.genarray(lambda i, j: i + j, (N, M))
```

また、Decorator API 内では内包表記を使いより簡潔に書くこともできます：

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.genarray(i + j for (i, j) in (N, M)))
```

{py:func}`~jijmodeling.genarray` で利用できる内包表記は、ただ一つの `for .. in ...` 節のみをサポートしており、また `if` 節は使えません。
たとえば、以下のように複数の `for`-節を使ってしまうと、エラーとなります：

```{code-cell} ipython3
try:

    @jm.Problem.define("genarray example")
    def problem(problem):
        N = problem.Natural()
        M = problem.Natural()
        a = problem.Float(shape=(N, M))
        x = problem.BinaryVar(shape=N)
        Sums = problem.NamedExpr(jm.genarray(a[i, j] * x[i] for i in N for j in M))

except SyntaxError as e:
    print(str(e))
```

### 辞書の生成関数：{py:func}`~jijmodeling.gendict`

辞書の生成関数 {py:func}`~jijmodeling.gendict` も、キーの集合を表す式と、キーから値への生成関数を与えることで、新しい辞書を生成することができます。
この生成関数は必ず値を返すため、{py:func}`~jijmodeling.gendict` により生成される辞書は常に `TotalDict` となります。

以下では、カテゴリーラベル$L$と自然数$N$をキーとする辞書を生成しています：

```{code-cell} ipython3
problem = jm.Problem("Array and Dict Example")
N = problem.Natural("N")
L = problem.CategoryLabel("L")
x = problem.BinaryVar("x", dict_keys=(L))
jm.gendict(lambda l, n: x[l] + n, (L, N))
```

{py:func}`~jijmodeling.gendict` も Decorator API では唯一つの `for` 節のみからなる内包表記をサポートしています。

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.gendict(x[l] + n for (l, n) in (L, N)))
```

## 配列・辞書の定義域の取得

配列のシェイプを表すタプルは、{py:meth}`Expression.shape <jijmodeling.Expression.shape>` メソッドで、辞書のキー集合を表す式は {py:meth}`Expression.keys <jijmodeling.Expression.keys>` メソッドでそれぞれ取得することができます。
また、配列式に対しては、シェイプの $n$ 番目を取得するための {py:meth}`Expression.len_at(n) <jijmodeling.Expression.len_at>` メソッドも用意されています。
これらの式は、配列や辞書の定義域を取得するための関数であり、数理モデルの定式化の際に、定義域を渡る総和や制約条件を定義する際などに使うことができます。

## 添え字による要素アクセスと像

Python の組み込みのリストや辞書、あるいは {py:class}`numpy.ndarray` と同様、JijModeling の式でも `x[i, j]` のように多次元の添え字（インデックス）を用いてコレクションの要素にアクセスすることができます。
具体的には、JijModeling では次の型を持つ式に対して添え字を用いることができます：

1. （多次元）配列
   + **許容される添え字**：決定変数を含まない自然数型の式
2. 辞書
   + **許容される添え字**：辞書のキー集合に含まれるカテゴリーラベル型や、決定変数を含む任意の整数式。
3. タプル
   + **許容される添え字**：決定変数を含まず成分数内の自然数型の式

また、添え字に現れることができるのは決定変数を含まない自然数・整数やカテゴリーラベルのみです。
添え字は `x[i,j,k]` のように複数成分を同時に書くことができますが、タプルの成分数や、配列の次元、辞書のタプル長を越える添え字を用いると型エラーとなります。

配列の添え字では、更に`x[:, 1]` のようなスライス記法を用いることができます。
この場合、`x[:, 1]` は第 0 次元は全て保持しつつ第 1 次元では `1` 番目のものからなる新たな配列を返します。`x`が二次元配列であれば返値は一次元配列、三次元以上の$N$次元であれば$N-1$次元配列となり、一次元以下である場合は型エラーとなります。
また、`x[1, 1:N:2]`のようにステップ数や終了インデックスを指定するスライスもサポートしています。
スライス記法の詳細については、Python 公式ドキュメントの「{external+python:ref}`slicings`」を参照してください。

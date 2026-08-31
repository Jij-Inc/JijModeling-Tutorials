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

# 配列・辞書に対する操作

{doc}`./placeholders` や {doc}`./decision_variables`では、各種変数の配列や辞書を定義する方法を扱いました。
JijModeling では、こうした変数から成るものに限らず、一般の要素を持つ配列や辞書（以下まとめて「コレクション」と呼びます）を扱うことができます。
こうした配列・辞書などの詳しい概念的な説明や使い分けの基準については {doc}`./variables` 章の「[変数の配列と辞書](#containers_of_vars)」節で説明していますので、そちらを参照してください。

以下では、各種コレクションの概念について改めて復習した後、それらを生成する関数や要素へのアクセス方法を見ていきます。
また、次章「{doc}`./folding_and_stream`」では、更に配列や辞書をストリームとして総和や総積を取る方法についても触れます。

```{code-cell} ipython3
import jijmodeling as jm
```

(generators)=
## コレクションの生成：{py:func}`~jijmodeling.genarray` と {py:func}`~jijmodeling.gendict`

配列や辞書は、{doc}`./placeholders`や{doc}`./decision_variables`で説明したように、変数宣言時に導入することもできますが、他の式を使って新たに生成することもできます。
配列の生成に使うのが {py:func}`~jijmodeling.genarray`関数、辞書の生成に使うのが {py:func}`~jijmodeling.gendict`関数です。

### 配列の生成関数：{py:func}`~jijmodeling.genarray`

{py:func}`~jijmodeling.genarray` は NumPy の {py:func}`~numpy.fromfunction` に類似する関数[^numpy-fromfunction]であり、シェイプと添え字から要素への関数（生成関数）を与えることで、新しい配列を生成することができます。
以下では、{py:func}`genarray <jijmodeling.genarray>` を用いて、シェイプ $(N, M)$ の各添え字毎の和を要素に持つ配列を生成しています：

[^numpy-fromfunction]: NumPy の {py:func}`~numpy.fromfunction` は生成関数内の具体的な関数の形によって与えたシェイプと異なる配列やスカラー値が生成される場合がありますが、JijModeling の {py:func}`~jijmodeling.genarray` は、生成関数の形に関わらず、必ず与えたシェイプの配列を返すことが保証されています。

```{code-cell} ipython3
problem = jm.Problem("Array and Dict Example")
N = problem.Length("N")
M = problem.Length("M")

jm.genarray(lambda i, j: i + j, (N, M))
```

また、Decorator API 内では内包表記を使って簡潔に書くこともできます：

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.genarray(i + j for (i, j) in (N, M)))
```

ここで `in` の右辺に現れるタプル `(N, M)` は、`N` と `M` の直積集合を表す省略記法です。
この記法については「{doc}`folding_and_stream`」章で改めて説明します。

{py:func}`~jijmodeling.genarray` で利用できる内包表記は、ただ一つの `for` 節のみをサポートしており、また `if` 節は使えません。
たとえば、以下のように複数の `for` 節を使ってしまうと、エラーとなります：

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
x = problem.BinaryVar("x", dict_keys=L)
jm.gendict(lambda l, n: x[l] + n, (L, N))
```

{py:func}`~jijmodeling.gendict` も Decorator API ではただ一つの `for` 節と任意個の `if` 節からなる内包表記をサポートしています。

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem):
    display(jm.gendict(x[l] + n for (l, n) in (L, N) if n % 2 == 0))
```

## 配列・辞書の定義域の取得

{py:class}`~jijmodeling.Placeholder` や {py:class}`~jijmodeling.DecisionVar` オブジェクトでは、配列のシェイプを表すタプルを `shape` 属性から取得できます。一方、一般の式については {py:meth}`Expression.shape() <jijmodeling.Expression.shape>` メソッドを使います。
辞書のキー集合を表す式は {py:meth}`Expression.keys() <jijmodeling.Expression.keys>` メソッドで取得できます。また、配列式に対しては、シェイプの $n$ 番目を取得するための {py:meth}`Expression.len_at(n) <jijmodeling.Expression.len_at>` メソッドも用意されています。
これらは、数理モデルの定式化の際に、定義域を走査する総和や制約条件を定義する際などに使うことができます。

## 添え字による要素アクセスとスライス

Python の組み込みのリストや辞書、あるいは {py:class}`numpy.ndarray` と同様、JijModeling の式でも `x[i, j]` のように多次元の添え字（インデックス）を用いてコレクションの要素にアクセスすることができます。
具体的には、JijModeling では次の型を持つ式に対して添え字を用いることができます：

1. （多次元）配列
   + **許容される添え字**：決定変数を含まない自然数型の式
2. 辞書
   + **許容される添え字**：辞書のキー型に一致する、決定変数を含まない式。整数、文字列、カテゴリーラベル、またはそれらから成るタプルを指定できます。
3. タプル
   + **許容される添え字**：決定変数を含まず成分数内の自然数型の式

いずれの場合も、添え字に決定変数を含めることはできません。
以下は、配列と辞書に対して添え字を用いて要素にアクセスする例です：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Array and Dict Example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    L = problem.CategoryLabel()

    w = problem.Float(shape=N)  # N要素配列
    x = problem.BinaryVar(dict_keys=(N, L))  # 辞書

    problem += jm.sum(w[i] * x[i, l] for i in N for l in L)


problem
```

添え字は `x[i,j,k]` のように複数成分を同時に書くことができますが、タプルの成分数や、配列の次元、辞書のタプル長を越える添え字を用いると以下のように型エラーとなります。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Array and Dict Example, oversubscripted")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    M = problem.Natural()

    w = problem.Float(shape=(N, M))  # N × M 配列

    try:
        problem += jm.sum(w[i, j, i] for i in N for j in M)  # ERROR! 添え字が多すぎる
    except Exception as e:
        print(e)
```

配列の添え字では、更に`x[:, 1]` のようなスライス記法を用いることができます。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Slicing example")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    M = problem.Natural()

    w = problem.Integer(shape=N)  # N 要素配列
    x = problem.BinaryVar(shape=(N, M))  # N × M 配列

    problem += problem.Constraint("sum-per-n", [x[i, :].sum() == w[i] for i in N])


problem
```

また、`x[1, 1:N:2]`のようにステップ数や終了インデックスを指定するスライスもサポートしています。
スライス記法の詳細については、Python 公式ドキュメントの「{external+python:ref}`slicings`」を参照してください。

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

# 算術式と比較式

前章までで、JijModeling における式と型、そして変数の宣言方法について学んできました。
以下では、より複雑な式として、加減乗除などの算術式や、比較式の構築方法について見ていきましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

## 算術演算

Python 組込みの算術演算（{py:meth}`+ <jijmodeling.Expression.__add__>`, {py:meth}`- <jijmodeling.Expression.__sub__>`, {py:meth}`* <jijmodeling.Expression.__mul__>`, {py:meth}`/ <jijmodeling.Expression.__truediv__>`, {py:meth}`% <jijmodeling.Expression.__mod__>` などの加減乗除）は、JijModeling の式に対しても用いることができます。
数値型の式同士の演算は期待通り動作するのに加え、（多次元）配列同士や、キー集合が一致する {py:meth}`TotalDict <jijmodeling.Problem.TotalDict>` に対しても、一定の条件を満たせば演算を行うことができます。
具体的には、以下の組み合わせ（左右問わず）に対して算術演算がサポートされています：

1. スカラー同士の算術演算
2. スカラーと多次元配列の算術演算
3. スカラーと辞書の算術演算
4. 同じシェイプを持つ多次元配列同士の算術演算
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
    "y", lower_bound=0, upper_bound=10, shape=(N, M), description="2次元配列の決定変数"
)
z = problem.ContinuousVar(
    "z",
    lower_bound=-1,
    upper_bound=42,
    shape=(N, M, N),
    description="2次元配列の決定変数",
)
S = problem.TotalDict("S", dtype=float, dict_keys=N, description="スカラーの全域辞書")
s = problem.ContinuousVar("s", lower_bound=0, upper_bound=10, dict_keys=N)
W = problem.Float("w", shape=(N, M))

problem
```

### 許容される例

```{code-cell} ipython3
problem.infer(x + 1)  # OK! （スカラー同士の加算）
```

```{code-cell} ipython3
problem.infer(y - x)  # OK! （多次元配列とスカラーの減算）
```

```{code-cell} ipython3
problem.infer(S * x)  # OK! （スカラーと辞書の乗算）
```

```{code-cell} ipython3
problem.infer(y / W)  # OK! （同一シェイプ (N, M) の配列同士の除算）
```

```{code-cell} ipython3
problem.infer(S + s)  # OK! （同一キー集合を持つ全域辞書同士の加算）
```

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
    # ERROR!（シェイプが異なる配列どうしの演算）
    problem.infer(y + z)
except Exception as e:
    print(e)
```

### 代替記法：`genarray` による配列の構築

上の例では、`y + z` のように、非自明なブロードキャストを伴う演算は（意図的に）エラーになっていました。
このような場合、{py:func}`~jijmodeling.genarray` や {py:func}`~jijmodeling.gendict` 関数を使い、陽にシェイプと成分の式を指定することで、結果の配列を構築できるようになります：

```{code-cell} ipython3
A = jm.genarray(lambda i, j, k: y[i, j] + z[i, j, k], (N, M, N))
display(A)
problem.infer(A)
```

また、Decorator API を利用している場合、以下のように `jm.genarray` で内包表記を用いることもできます：

```{code-cell} ipython3
@problem.update
def _(problem: jm.DecoratedProblem):
    A = jm.genarray(y[i, j] + z[i, j, k] for i, j, k in (N, M, N))
    display(A)
    display(problem.infer(A))
```

詳細は {doc}`arrays_and_dicts` の[該当する説明部分](#generators)を参照してください。

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

これら比較演算子の**両辺が共に決定変数を含まない**場合、値は真偽値型 `Bool` の式として評価されます。一方、両辺の少なくとも一方が決定変数を含みうる場合、これは特別な**比較型**として扱われます。これは、制約条件の定義では決定変数を現れる式同士を比較できる必要がある一方、内包表記などで使われる場合は真偽値が確定する比較式が使える必要があるためです。

現状では、比較演算子はスカラーやカテゴリーラベル、またはそれらから成る配列・辞書に対して用いることができます。
配列や辞書に対する比較演算子の仕様条件は、算術演算のオーバーロード規則と同様です。

```{code-cell} ipython3
problem.infer(x == y)  # OK! （スカラーと配列の等値比較）
```

```{code-cell} ipython3
problem.infer(N <= N)  # OK! （スカラー同士の順序比較）
```

```{code-cell} ipython3
problem.infer(y > W)  # OK! （同一シェイプ配列同士の比較）
```

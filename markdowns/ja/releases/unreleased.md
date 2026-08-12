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

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### 本物の `Set` 型の追加

JijModeling に本物の*集合*が加わりました。有限・順序なし・重複なしで、成分ごとに添字アクセスできます。`Problem.Set` で宣言し、スパースな決定変数のキー領域として使うことで、許容される添字の組み合わせに対してだけ変数を定義できます。

集合はおなじみの添字構文で*切り出し*（section）できます。一部の成分を束縛し、残りを `:` で残す書き方です。これにより、スパースな制約族が自然に書けるようになります:

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("sparse-knapsack")
N = problem.Natural("N")
K = problem.Natural("K")
mask = problem.Set("mask", dtype=(N, K))
w = problem.Float("w", ndim=1, shape=(N,))
C = problem.Float("C", ndim=1, shape=(K,))
x = problem.BinaryVar("x", dict_keys=mask)

problem += jm.sum(mask, lambda i, k: w[i] * x[i, k])
problem += problem.Constraint(
    "one-truck", lambda i: jm.sum(mask[i, :], lambda k: x[i, k]) <= 1, domain=N
)
problem += problem.Constraint(
    "capacity", lambda k: jm.sum(mask[:, k], lambda i: w[i] * x[i, k]) <= C[k], domain=K
)

problem
```

集合はほかにも、選んだ成分への*射影*（構成上重複なし）、*所属判定*、任意のストリームからの明示的な変換、集合演算 `|`・`&`・`^`・`jm.diff` をサポートします:

```{code-cell} ipython3
items = jm.project(mask, 0)  # いずれかのペアに現れる item の集合
trucks = mask.project(1)  # メソッド形式。[0]、(0,)、個別引数のいずれでも可
is_admissible = jm.member((0, 1), mask)  # x ∈ S。mask.contains((0, 1)) と同じ
evens = jm.to_set(jm.filter(lambda i: i % 2 == 0, jm.stream(N)))
items
```

なお、Python の `in` 演算子では所属判定を作れません。Python は `in` の結果を素の `True`/`False` に変換してしまうため、JijModeling は黙って推測する代わりに専用エラー（`E-SE0014`）を送出し、上記の 4 つの書き方を案内します。

### `genset`: キー集合から集合を生成

`jm.genset` は `gendict` の姉妹関数です。キー集合の各要素に生成関数を適用し、生成された値の*集合*を（重複を除去して）作ります。Decorator API では末尾の `if` 節を含む内包表記が使えます:

```{code-cell} ipython3
@jm.Problem.define("genset-example")
def genset_problem(p: jm.DecoratedProblem):
    K = p.CategoryLabel()
    C = p.Natural(dict_keys=K)
    A = jm.genset(C[k] * 2 for k in K if C[k] >= 2)
    x = p.BinaryVar(dict_keys=A)
    p += jm.sum(A, lambda v: x[v])


genset_problem
```

### `keys()` と `indices()` が集合を返すように

辞書の `keys()` と配列の `indices()` が `Set` 型を返すようになり、ほかの集合と同じく切り出し・射影・所属判定ができるようになりました。これに伴う意図的な挙動変更が 1 つあります。辞書のキーは、インスタンスデータの並び順ではなく*正準順序*（整数が文字列より先、それぞれ昇順）で列挙されるようになりました。これにより `keys()` から導かれる決定変数の識別子が、実行やデータの並び順によらず再現可能になります。

+++

### gendict の LaTeX 出力の改善

`gendict`関数の $\LaTeX$ 出力の体裁を `genarray` と合わせました。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("gendict example")
K = problem.CategoryLabel("K")
a = problem.Float("a", dict_keys=K)
x = problem.BinaryVar("x", dict_keys=K)
Sums = problem.NamedExpr("Sums", jm.gendict(lambda k: a[k] * x[k], K))


problem
```

### `gendict` 内包表記での `if` 節

Decorator API の `gendict` 内包表記で、単一の `for` 節のあとに `if` 節を書けるようになりました。
これにより、定義域を絞り込んだ辞書を `gendict` 内包表記で柔軟に定義できるようになりました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("gendict-if")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.Float(dict_keys=N)
    A = problem.NamedExpr(jm.gendict(c[i] * 2 for i in N if i != 0))


problem
```

以下は複数の `if` 節を使っている例です。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("gendict-tuple-if")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    L = problem.CategoryLabel()
    avoid = problem.Placeholder(dtype=L)
    c = problem.Float(dict_keys=(N, L))
    OffDiag = problem.NamedExpr(
        jm.gendict(i + c[i, l] for (i, l) in (N, L) if i % 2 != 0 if l != avoid)
    )


problem
```

## バグ修正

### バグ修正 1：


## その他の変更

- 変更 1：

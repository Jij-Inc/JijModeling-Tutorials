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

# JijModeling 2.3.0 リリースノート

+++

## 機能強化

+++

### `jm.range` 関数の追加

{py:class}`~jijmodeling.Expression` を使用した値シーケンスを表する関数、 {py:func}`jijmodeling.range` を追加しました。使い方は基本的に python 組み込みの {py:class}`range() <range>` と似ています。

例は以下の通りです:

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("RangeProblem")
def problem(problem: jm.DecoratedProblem):
    S = problem.Natural()
    F = problem.Natural()
    N = problem.Natural()
    x = problem.BinaryVar(shape=(10,))
    problem += jm.sum(x[i] for i in jm.range(S, F, N))
```

### `Problem`の`-=`演算子で目的関数更新の対応  

{py:class}`~jijmodeling.Problem` に `-=` 演算子を追加しました。 `-=` を使って目的関数から項を引くことができます。

`+=` とは異なり、 `-=` で制約条件を削除することはできません。

```{code-cell} ipython3
problem = jm.Problem("problem")
x = problem.ContinuousVar("x", lower_bound=0, upper_bound=5)
y = problem.ContinuousVar("y", lower_bound=0, upper_bound=5)

problem += x
problem -= y
assert jm.is_same(problem.objective, x - y)
```

### `DependentVar` が `NamedExpr` と `Constant` に

JijModeling 2.3 以前では、依存変数を表す `DependentVar` クラスが存在していました。
名前の印象に反し、この機能は Placeholder の長さなど変数に依存しないような値を定義するためにも用いることができました。
この状況は混乱を招く恐れがあるため、 `DependentVar` クラスは廃止され、同様の機能を提供する {py:class}`~jijmodeling.NamedExpr` クラスが定義されるようになり、{py:func}`~jijmodeling.Problem.DependentVar` は {py:func}`~jijmodeling.Problem.NamedExpr` のエイリアスとなり、廃止予定となりました。

{py:class}`~jijmodeling.NamedExpr` クラスの構築子としては、 {py:func}`Problem.NamedExpr() <jijmodeling.Problem.NamedExpr>` および {py:func}`Problem.Constant() <jijmodeling.Problem.Constant>` メソッドの二種類が提供されており、いずれも Decorator API では変数名の省略が可能です。
{py:func}`~jijmodeling.Problem.NamedExpr` で定義された式は一定の条件の下で OMMX instance に `NamedFunction` として登録される一方、{py:func}`~jijmodeling.Problem.Constant` で定義された式は OMMX instance 上には登録されないという違いがあります。

{py:func}`~jijmodeling.Problem.NamedExpr`で定義された式が OMMX インスタンスに含まれるようになる具体的な条件は以下の通りです:

- 従属変数がスカラー値である
- 従属変数がスカラー値を成分に持つ配列または辞書である

これらは {py:class}`ommx.v1.NamedFunction` として OMMX インスタンスに登録され、最適化後には OMMX Solution オブジェクトでも評価後の値を知ることができるようになります。
この機能は、たとえば目的関数の特定の部分項の値を確認したい場合に便利です。興味のある項を {py:class}`~jijmodeling.NamedExpr` として宣言しておくと、OMMX Solution から最適化後の部分項の値が確認できるようになります。

詳細については {doc}`../advanced/named_expr` を御参照ください。

## バグ修正

+++

### 修正：スライス記法内にバグ束縛変数が現れられるように

スライス記法内の束縛変数の扱いを修正し、内包表記や制約の添え字で束縛された変数がスライス記法内で正しく扱われるようになりました。

### 修正：添え字つき制約内での自然数上の総和・所属関係の $\LaTeX$ 出力の修正

これまでの実装では、添え字つき制約の定義域が自然数であったり、総和の範囲が自然数であったりした場合、以下のように所属関係が $\in$ を使って出力されていました：

$$
\text{c1}:\quad\sum _{j\in {N}_{1}}{{x}_{i,j}}=1\quad \forall i\;\text{s.t.}\;i\in {N}_{0}
$$

本リリースから、目的関数や単独の制約の場合と同様、以下のように自然な出力が行われるようになりました：

```{code-cell} ipython3
problem = jm.Problem("P")
N = problem.Natural("N", shape=2)
x = problem.BinaryVar("x", shape=(N[0], N[1]))
problem.Constraint("c1", lambda i: jm.sum(N[1], lambda j: x[i, j]) == 1, domain=N[0])
```

### 修正：未使用のプレースホルダーがある場合のランダムインスタンス生成で発生する復旧不能エラー

問題定義に未使用のプレースホルダーが含まれていた場合、ランダムインスタンス生成時に panic が発生する不具合を修正しました。

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

# JijModeling X.XX.X リリースノート

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

`+=` と違って、 `-=` での制約削除は対応外となります。

```{code-cell} ipython3
problem = jm.Problem("problem")
x = problem.ContinuousVar("x", lower_bound=0, upper_bound=5)
y = problem.ContinuousVar("y", lower_bound=0, upper_bound=5)

problem += x
problem -= y
assert jm.is_same(problem.objective, x - y)
```

### OMMX インスタンスに従属変数の情報を追加

以下の条件を満たす場合、従属変数（{py:class}`~jijmodeling.DependentVar`）の定義が OMMX インスタンスに含まれるようになりました:

- 従属変数がスカラー値である
- 従属変数がスカラー値を成分に持つ配列または辞書である

これらはダミーの決定変数として `decision_variable_dependency` に登録され、最適化後に OMMX Solution オブジェクトで評価されます。
この機能は多目的最適化の定式化で特に有用です。従属変数として各項を宣言し、目的関数をそれらの組み合わせとして設定することで、最適化後に各目的の実際の値を確認できます。

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

## その他の変更

- 変更 1：

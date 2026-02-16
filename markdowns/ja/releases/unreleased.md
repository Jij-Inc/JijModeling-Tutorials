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

### ランダムインスタンスデータ生成

本バージョンから、JijModeling 2 はランダムインスタンスデータを生成する機能をサポートしています。具体的には、{py:meth}`Problem.generate_random_dataset <jijmodeling.Problem.generate_random_dataset>` や {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` メソッドを通じて利用可能です。
詳細は API ドキュメントをご参照ください。

例は以下の通りです:

```{code-cell} ipython3
import jijmodeling as jm
import builtins
problem = jm.Problem("problem")
N = problem.Natural("N")
c = problem.Float("c", shape=(N,))
x = problem.BinaryVar("x", shape=(N,))
problem += jm.sum(N, lambda i: c[i] * x[i])
inputs = problem.generate_random_dataset(
    options={
        'N': {"value": builtins.range(10, 20)},
        'c': {"value": jm.range.value.closed(-1.0, 1.0)}
         # You can also specify "size" for the range of jagged array dimension size.
    },
    seed=123 # omittable
)
assert set(inputs.keys()) == {"N", "c"}
inputs
```

### `jm.Expression()` 構築子のサポート

{py:class}`~jijmodeling.Expression` クラスに構築子の定義が追加され、{py:class}`~jijmodeling.Expression` に変換可能な任意の値（{py:data}`~jijmodeling.ExpressionLike` に該当するもの）を明示的に {py:class}`~jijmodeling.Expression` オブジェクトに変換できるようになりました。

## バグ修正

+++

### バグ修正1：決定変数を含む式に対する除法がコンパイルできない問題の修正

JijModeling 2.0.0 では、 `x / 2` のように決定変数が右辺に現れないような除法も誤ってコンパイル時エラーとなっていました。
このリリースでは、右辺に決定変数が現れなければ、除法が正しくコンパイルされるようになりました。

### バグ修正2：`map` や `filter` 内で添え字と値の比較ができない場合があったバグの修正

ネストされた `map` や `filter` 内で、添え字と値を比較するようなコードがコンパイルできないバグがありました。
たとえば、旧バージョンでは以下のようなエラーが発生していました：

```python
@jm.Problem.define("TestProblem")
def problem(problem: jm.DecoratedProblem):
    V = problem.Natural(ndim=1)
    W = problem.Natural()
    x = problem.BinaryVar( shape=(W,))
    problem += problem.Constraint(
        "constr",
        [jm.sum(x[j] for j in W if j <= i) == 1 for i in V],
    )
# TypeError: Traceback (most recent last):
# ...
#     9  |          [jm.sum(x[j] for j in W if j <= i) == 1 for i in V],
#                                              ^^^^^^

# Type Error: Instance for comparison operator not found for type natural and ElementOf[set(V)]
```

本リリース以降では、問題なくコンパイルされるようになりました。

### バグ修正3：タプルによる添え字アクセスが行えないバグの修正

以前のリリースにはタプルによる添え字アクセス時に、特定の条件下でコンパイラが PanicException によりクラッシュするバグが存在していました。
本リリースからバグが修正され、単独のタプルにより辞書の添え字を指定しても正しく評価されるようになりました。

### バグ修正4：{py:meth}`Problem.infer() <jijmodeling.Problem.infer>` で正しく式への変換が行われるように

旧リリースでは、{py:meth}`Problem.infer() <jijmodeling.Problem.infer>` の引数が {py:class}`~jijmodeling.Problem` オブジェクトでない場合実行時エラーとなっていました。
このリリースから、引数が数値や {py:class}`~jijmodeling.Placeholder` オブジェクトなどの式に変換可能なオブジェクトであっても、式への変換が行われた上で型推論が行われるようになりました。

## その他の変更

- `Problem` クラスに {py:attr}`Problem.name` および {py:attr}`Problem.sense` プロパティが追加されました。

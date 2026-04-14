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

### シェイプと生成関数による配列の生成

本バージョンから、{py:func}`~jijmodeling.genarray` 関数により、シェイプと生成関数を指定して配列を生成できるようになりました。
これは numpy の {py:func}`~numpy.fromfunction` と類似の機能です。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("genarray example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=N)
    Sums = problem.NamedExpr(jm.genarray(lambda i, j: a[i, j] * x[i], (N, M)))


problem
```

## 軸に沿った `min` / `max` のサポート

旧来は {py:func}`jm.sum <jijmodeling.sum>` や {py:meth}`Expression.sum <jijmodeling.Expression.sum>` では `axis` キーワード引数により、多次元配列の特定の軸に沿った和を取ることができましたが、今回のバージョンからは {py:func}`jm.min <jijmodeling.min>` と {py:func}`jm.max <jijmodeling.max>`（そしてその対応する `Expression` メソッド）にも同様の機能が追加されました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("min/max along axes example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    a_min_0 = problem.NamedExpr(a.min(axis=0), save_in_ommx=True)
    a_max_1 = problem.NamedExpr(jm.max(a, axis=1), save_in_ommx=True)
    a_min_both = problem.NamedExpr(jm.min(a, axis=[1, 0]), save_in_ommx=True)


problem
```

```{code-cell} ipython3
import numpy as np

a_data = np.array([[1, 5, 3], [4, 2, 6]])
compiler = jm.Compiler.from_problem(problem, {"N": 2, "M": 3, "a": a_data})
instance = compiler.eval_problem(problem)
print(f"a == {a_data}")

a_min_0_ids = compiler.get_named_function_id_by_name("a_min_0")
a_min_0_values = [
    instance.get_named_function_by_id(a_min_0_ids[(i,)]).function.constant_term
    for i in range(3)
]

print(f"a.min(axis=0) == {a_min_0_values}")
assert np.all(a_min_0_values == np.min(a_data, axis=0))

a_max_1_ids = compiler.get_named_function_id_by_name("a_max_1")
a_max_1_values = [
    instance.get_named_function_by_id(a_max_1_ids[(i,)]).function.constant_term
    for i in range(2)
]
print(f"a.max(axis=1) == {a_max_1_values}")
assert np.all(a_max_1_values == np.max(a_data, axis=1))

a_min_both_ids = compiler.get_named_function_id_by_name("a_min_both")
a_min_both_value = instance.get_named_function_by_id(
    a_min_both_ids[()]
).function.constant_term
print(f"a.min(axis=[1, 0]) == {a_min_both_value}")
assert a_min_both_value == np.min(a_data)
```

## バグ修正

+++

### ランダムインスタンスデータ生成のバグ修正

ランダムインスタンスデータ生成において、以下の二つのバグ修正を行いました：

#### `NamedExpr` に依存したプレースホルダーが正しく扱えない

シェイプ（長さ）やキー集合が`NamedExpr`に依存しているプレースホルダーが正しく扱えないバグを修正しました。
例として、以下のような問題を考えます：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = problem.NamedExpr(a.len_at(0))
    b = problem.Natural(shape=(N, None))
    M = problem.NamedExpr(b.len_at(1))
    problem += jm.sum(a[i] * b[i, j] for i in N for j in M)


problem
```

旧来のバージョンでは、この `problem` に対して `generate_random_dataset()` を呼び出すと例外になっていましたが、本リリースからは正しくデータが生成されるようになりました。

```{code-cell} ipython3
problem.generate_random_dataset(seed=17)
```

#### 利用されていないプレースホルダーの存在下で生成に失敗するバグの修正

`used_placeholder()` に含まれない未使用のプレースホルダーが存在する場合、データ生成に失敗していました。
たとえば、以下のコードでは `N` は定義のみで利用されておらず、以前のバージョンでは実行時例外となっていました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
N = problem.Natural("N")

problem.generate_random_dataset(seed=17)
```

今回のリリースから、上記のように問題なくデータが生成されるようになりました。

## その他の変更

- バージョン条件を緩和し、Python 3.11 以降の任意の Python 3 でのインストールを許容しました。

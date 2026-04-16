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


problem = jm.Problem("genarray example")
N = problem.Natural("N")
M = problem.Natural("M")
a = problem.Float("a", shape=(N, M))
x = problem.BinaryVar("x", shape=N)
Sums = problem.NamedExpr("Sums", jm.genarray(lambda i, j: a[i, j] * x[i], (N, M)))


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

それでは、インスタンスを作成して、含まれる Named Function と `a` の値を確認してみましょう。

```{code-cell} ipython3
import numpy as np

a_data = np.array([[1, 5, 3], [4, 2, 6]])
compiler = jm.Compiler.from_problem(problem, {"N": 2, "M": 3, "a": a_data})
instance = compiler.eval_problem(problem)

display(instance.named_functions_df)
print(f"a == {a_data}")
```

OMMX Instance の Named Function は添え字ごとにバラバラになってしまうので、上の表では読みづらいかもしれません。
そこで、各変数ごとに `compiler` の機能を使って名寄せし、配列を作って比較してみましょう。

まずは軸 0（列）に沿った最小値を取る `a_min_0 = a.min(axis=0)` の例です。こちらは軸 1（行）が残り、構成する列の最小値からなるベクトルになります。

```{code-cell} ipython3
a_min_0_ids = compiler.get_named_function_id_by_name("a_min_0")
a_min_0_values = [
    instance.get_named_function_by_id(a_min_0_ids[(i,)]).function.constant_term
    for i in range(3)
]
assert np.all(a_min_0_values == np.min(a_data, axis=0))  # numpy の挙動と一致！
print(f"a.min(axis=0) == {a_min_0_values}")
```

対して、`a_max_1 = a.max(axis=1)` では軸 1（行）に沿った最大値が取られ、軸 0（列）ごとに構成する行の最大値で置換されたベクトルとなります。

```{code-cell} ipython3
a_max_1_ids = compiler.get_named_function_id_by_name("a_max_1")
a_max_1_values = [
    instance.get_named_function_by_id(a_max_1_ids[(i,)]).function.constant_term
    for i in range(2)
]
assert np.all(a_max_1_values == np.max(a_data, axis=1))  # numpy の挙動と一致！
print(f"a.max(axis=1) == {a_max_1_values}")
```

`a_min_both = a.min(axis=[1, 0])` では複数軸に沿った最小値を取っており、今回は 2 次元入力のため単純な全体の最小値になります。

```{code-cell} ipython3
a_min_both_ids = compiler.get_named_function_id_by_name("a_min_both")
a_min_both_value = instance.get_named_function_by_id(
    a_min_both_ids[()]
).function.constant_term
assert a_min_both_value == np.min(a_data)  # numpy の挙動と一致！
print(f"a.min(axis=[1, 0]) == {a_min_both_value}")
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

#### 決定変数の上下界のLaTeX出力で `latex` 指定が無視されていた問題の修正

決定変数の上下界を $\LaTeX$ 出力する際に、他の変数の `latex=` キーワード引数の値が無視されていた問題を修正しました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("LaTeX bugfix example")
L = problem.Float("L", latex=r"\ell")
U = problem.Float("U", latex=r"\mathcal{U}")
x = problem.ContinuousVar("x", lower_bound=L, upper_bound=U)
problem += x

problem
```

これまでのリリースでは、上記のコードでは `latex` 指定が無視され、$L \leq x \leq U$ のように表示されていましたが、上記のように設定が保たれるようになり、$\ell \leq x \leq \mathcal{U}$ と表示されるようになりました。

## その他の変更

- バージョン条件を緩和し、Python 3.11 以降の任意の Python 3 でのインストールを許容しました。
- Decorator API の `sum` などで不正な内包表記を使った際のエラーメッセージが、具体的なコード上の位置を報告するようになりました。

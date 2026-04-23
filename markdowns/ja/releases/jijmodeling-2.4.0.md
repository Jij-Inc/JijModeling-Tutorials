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

# JijModeling 2.4.0 リリースノート

+++

## パフォーマンス改善

### 辞書型の大幅な性能改善

辞書の内部処理を改善し、旧来に比べ約 30 倍の大幅な性能改善を実現しました！
パフォーマンス上の懸念から辞書を避けていた場合、ぜひこの機会に辞書を活用してみてください。

+++

## 破壊的変更

### Protobuf スキーマの変更

JijModeling 2.4.0 では {py:class}`~jijmodeling.Problem` の Protobuf スキーマが破壊的に変更されました。
これにより、2.4.0 以降で Protobuf にシリアライズされた Problem は、2.3.x 以前のバージョンの JijModeling では読み込めなくなります。
一方で、2.3.x 以前のバージョンでシリアライズされた Problem は、2.4.0 以降のバージョンの JijModeling で読み込むことができます。
これは、MINTO によるデータ保存・交換時に影響が出る可能性がありますが、その場合は依存する JijModeling のバージョンを 2.4.0 以降に更新することで、既存のデータも、新しいデータも問題なく読めるようになります。
また、影響を受けるのは JijModeling の Protobuf スキーマを直接利用している場合であり、OMMX 形式に関しては特に影響はありません。

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

また、Decorator API を利用している場合、以下のように `jm.genarray` で内包表記を用いることもできます：

```{code-cell} ipython3
@jm.Problem.define("genarray example")
def problem(problem):
    N = problem.Natural()
    M = problem.Natural()
    a = problem.Float(shape=(N, M))
    x = problem.BinaryVar(shape=N)
    Sums = problem.NamedExpr(jm.genarray(a[i, j] * x[i] for i, j in (N, M)))


problem
```

`genarray` の内包表記では、`for .. in ...` は一つしか許容されません。
以下は、複数の `for`-節を使ってしまい、エラーになっている例です：

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

### 決定変数の上下界のLaTeX出力で `latex` 指定が無視されていた問題の修正

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

### 決定変数がタプルで添字付けされている場合に制約検出付きの問題評価がクラッシュするバグの修正

決定変数がタプル型のキーを持つ辞書で添字付けされている時、制約検出が有効な状態（デフォルトや、 `constraint_detection` キーワード引数が `False` 以外の場合）で `eval_problem` がクラッシュするバグを修正しました。たとえば、以前のバージョンでは以下のコードはクラッシュしていました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("dict-keyed binary var with tuple subscripts")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    K = problem.Placeholder(ndim=1, dtype=(jm.DataType.NATURAL, jm.DataType.NATURAL))
    x = problem.BinaryVar(dict_keys=K)

    problem += problem.Constraint(
        "sweeps",
        (jm.sum(x[k] for k in K if k[0] == i) <= 1 for i in jm.range(N)),
    )


instance_data = {
    "N": 3,
    "K": [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1)],
}

compiler = jm.Compiler.from_problem(problem, instance_data)
instance = compiler.eval_problem(problem, constraint_detection=True)
```

### バイナリ`{0, 1}`型の式の総和が自然数型ではなくバイナリ型になっていた問題を修正

バイナリ型（`{0, 1}`）の式を `sum` で総和した式の型が `Natural` ではなく `Binary` になってしまっていた問題を修正しました。たとえば、バイナリ変数 $x_0, x_1, \ldots$ の総和 $\sum_i x_i$ は $0$ や $1$ だけでなく $2$ 以上の値も取りうるため、結果の型は `Binary` ではなく `Natural` であるべきです。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("Sum of binary example")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=N)
problem.infer(x.sum())
```

## その他の変更

- バージョン条件を緩和し、Python 3.11 以降の任意の Python 3 でのインストールを許容しました。
- Decorator API の `sum` などで不正な内包表記を使った際のエラーメッセージが、具体的なコード上の位置を報告するようになりました。
- {py:meth}`Problem.used_placeholders <jijmodeling.Problem.used_placeholders>` は用途が明確でなく、{py:class}`~jijmodeling.Compiler` も全てのプレースホルダーの値を要求するため、廃止予定となりました。かわりに {py:meth}`Problem.placeholders <jijmodeling.Problem.placeholders>` を使用してください。

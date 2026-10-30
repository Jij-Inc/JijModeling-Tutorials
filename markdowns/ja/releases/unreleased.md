---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### 引数に依存した返値を返す関数の扱いを適正化

JijModeling では以前から関数の引数に依存した型を持つような関数を記述することができましたが、今回のリリースでその扱いがより体系化され、そのような関数の型も正確に `(n : natural) -> Array[n; natural]` などと表示されるようになりました。

これに伴い、複数のバグが修正されています。本リリースノートの「バグ修正」欄では、この変更に伴い修正されたものには `(Π)` というマークが付けられています。

#### `jm.map` の関数引数の型をより正確に扱うよう改善

この変更の一環として、`jm.map` や `jm.filter` などにおける関数の引数の型がより正確に扱われるようになりました。
以下の例では、`jm.map` の第 1 引数の関数は旧来は自然数の型 `natural` を取るものとしてラフに推論されていましたが、本リリースからは `N`未満の自然数型として正確に扱われるようになっています。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("map argument types")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
problem += jm.map(lambda i: x[i], N).sum()

print(problem.objective)
```

これに伴い、（本来であればエラーとなるべきであるにもかかわらず）これまでのバージョンで誤って受理されていたプログラムが正しく拒否されるようになりました。
このようなプログラムの例としては、以下のようにストリーム内の位置 $n < N$ に依存して型が変わるような配列が挙げられます。
現行の JijModeling では、このような「位置に依存して型が変わるストリーム／配列」を安全に扱う仕組みがないため、本来であればエラーになるべきです。

```{code-cell} ipython3
import jijmodeling as jm

try:

    @jm.Problem.define("problem")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Natural()
        x = problem.NamedExpr(jm.map(lambda n: jm.genarray(lambda j: 42, n), N))

except Exception as e:
    print(e)
```

このプログラムは、以前は `Stream[Array[n_1234, natural]]` というどこでも定義されていない変数 `n_1234` を含む型に誤って推論されていましたが、今回から正しくエラーとして検出されるようになりました。

## バグ修正

+++

### バグ修正 (Π)：辞書のキーに対するパターンマッチを含む制約条件が、制約検出時にエラーを引き起こす問題の修正

辞書（`PartialDict` / `TotalDict`）のキーに対して成分ごとに束縛を行う内包表記（下記の例では `for i, j in c.keys()`）を含む制約条件があるとき、制約検出時に`E-TE0014` エラーが発生していました。このようなケースでも、本リリースからは問題なく動作するようになりました：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    c = problem.PartialDict(dtype=float, dict_keys=(N, N))
    x = problem.BinaryVar(dict_keys=c.keys())
    problem += problem.Constraint("onehot", jm.sum(x[i, j] for i, j in c.keys()) == 1)


problem.eval({"N": 2, "c": {(0, 0): 1.0, (1, 1): 1.0}})
```

### バグ修正 (Π)：先行する `for` 節で束縛した変数を `genarray` 内で使うと、制約検出時でエラーが発生する問題の修正

内包表記の先行する `for` 節で束縛した変数を後続の `jm.genarray` の長さに使った時に（制約検出有効化時に）`E-TE0005`（未束縛変数）が発生していた問題を修正しました。
たとえば、以下の例では ``error[E-TE0005] Unbound variable `d_...` `` のようなエラーが発生していましたが、現在では問題なくコンパイルされるようになっています。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    ub = problem.Natural(less_than=N)
    x = problem.BinaryVar(shape=(N,))
    problem += problem.Constraint(
        "onehot",
        jm.sum(
            x[t]
            for n in ub
            for j in n
            for s, d in [(n, j)]
            for t in jm.genarray(s + i for i in d)
        )
        == 1,
    )


problem.eval({"N": 3, "ub": 1})
```

### バグ修正 (Π)：文字列表現に予期せぬ `__dangling_*` が含まれていた問題の修正

以下のように `for` 文などが複雑にネストした問題を `print` などで文字列表示した際に、`__dangling_*` という不自然な変数名が表示されてしまう問題がありましたが、本リリースからは正しい変数名が表示されるようになりました：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    a = problem.Placeholder(
        shape=(N,), dtype=(jm.DataType.NATURAL, jm.DataType.NATURAL)
    )
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(x[s] for n in N for s, d in [a[n]])


print(problem)
```

以前のリリースでは、上の出力に含まれる `[a[n]]` が `[a[__dangling_0]]` と表示されていました。

### バグ修正：辞書の `keys` に対する `gendict` で生成された辞書にアクセスすると panic が発生していた問題の修正

以下の問題のように、`gendict` で生成された辞書の `keys` にアクセスすると回復不能な panic が発生する場合がありました：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    keys = problem.Natural("keys", ndim=1)
    a = problem.Natural("a", ndim=1)
    d = problem.NamedExpr("d", jm.gendict(k for k in keys))
    problem += jm.sum(a[i] for n in d.keys() for i in n)


problem
```

上のコードはこれまで以下のような回復不能なエラーを引き起こしていました：

```python
PanicException: internal error: entered unreachable code: ElementOf[stream(keys)] must wrap a set type, but got: Array[:; natural]
```

本リリースから、上のようなコードも期待通り動作するようになりました。

### バグ修正：上限付き自然数の総和・総積の結果型を修正

`N` 未満の自然数の要素に対する `sum`／`prod` の結果型が同じ上限 `N` を持つ型になってしまっていた問題を修正しました。
各要素が `N` 未満であっても、総和や総積は `N` 以上になり得るため、本リリースから結果型は上限のない `natural` になります。
最小値・最大値は要素の上限を超えないため、`min`／`max` の結果型は引き続き `N` です。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("sum and prod types")
N = problem.Natural("N")
a = problem.Natural("a", shape=(3,), less_than=N)

print("a:", problem.infer(a))
print("sum:", problem.infer(a.sum()))
print("prod:", problem.infer(a.prod()))
print("min:", problem.infer(a.min()))
print("max:", problem.infer(a.max()))
```

### バグ修正：浮動小数点数の丸め誤差により制約検出が停止しなくなる問題の修正

変数の上下界や目的関数・制約条件の部分項などに、浮動小数点数として厳密な演算が不可能な値が登録されていた場合、制約検出が停止しなくなるバグを修正しました。
定数値をプレースホルダーとして定式化し、インスタンスデータとして浮動小数点数を入力した場合にはこうした問題は起きていませんでしたが、以下のように直接モデル中に浮動小数点数を指定すると停止しなくなる場合がありました。

```{code-cell} ipython3
import jijmodeling as jm


problem = jm.Problem("decimal bounds")

# 0.1 は浮動小数点数として表現不能であること、0.5 との演算により誤差が生じることから、
# これまでは制約検出が無限ループに陥っていました。
problem.ContinuousVar("ratio", lower_bound=0.1, upper_bound=0.5)
instance = problem.eval({})
```

本バージョンから、厳密な演算ができる場合のみ定数畳み込みを行うようにしたため、このような問題は発生しなくなっています。
また、これの影響として $\LaTeX$ 出力では一部の超越関数が簡約されずに表示されるようになりました。

## その他の変更

- 変更 1：

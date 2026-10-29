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

JijModeling では、以前から関数の引数に依存した型を持つような関数を記述することができましたが、今回のリリースでその扱いがより体系化され、そのような関数の型も正確に `(n : natural) -> Array[n; natural]` などと表示されるようになりました。

また、これに伴い複数のバグが修正されており、以下の「バグ修正」欄では、この変更に伴い修正されたものには `(Π)` というマークが付けられています。

## バグ修正

+++

### バグ修正 (Π)：辞書のキーに対するパターンマッチを含む制約条件が、制約検出時にエラーを引き起こす問題の修正

辞書（`PartialDict` / `TotalDict`）のキーに対して成分ごとに束縛を行う内包表記を含む制約条件があると、制約検出時に予期せぬエラーが発生していた問題を修正しました。
以下のケースではこれまで `E-TE0014` エラーが発生していましたが、本リリースからは問題なく動作するようになりました：

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

### バグ修正 (Π)：辞書の `keys` に対する `gendict` で生成された辞書にアクセスすると panic が発生していた問題の修正

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

### バグ修正 (Π)：先行する `for` 節で束縛した変数を `genarray` 内で使うと、制約検出時でエラーが発生する問題の修正

内包表記の先行する `for` 節で束縛した変数を、後続の `jm.genarray` の長さに使うと、制約検出時に `E-TE0005`（未束縛変数）が発生していた問題を修正しました。
たとえば、以下の例では ``error[E-TE0005] Unbound variable `d_...` `` のようなエラーが発生していましたが、現在では問題なくコンパイルされるようになっています。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    x = problem.BinaryVar(shape=(3,))
    problem += problem.Constraint(
        "onehot",
        jm.sum(
            x[t]
            for s, d in [(1, 2)]
            for t in jm.genarray(s + i for i in d)
        ) == 1,
    )

problem.eval({})
```

### バグ修正 (Π)：文字列表現に予期せぬ `__dangling_*` が含まれていた問題の修正

以下のように、`for` 文などが複雑にネストした問題を `print` などで文字列表示した際に、`__dangling_*` という不自然な変数名が表示されてしまう問題がありましたが、本リリースからは正しい変数名が表示されるようになりました：

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
    a = problem.Placeholder(
        shape=(2,), dtype=(jm.DataType.NATURAL, jm.DataType.NATURAL)
    )
    x = problem.BinaryVar(shape=(2,))
    problem += jm.sum(x[s] for n in 2 for s, d in [a[n]])

print(problem)
```

以前のリリースでは、上の出力に含まれる `[a[n]]` が `[a[__dangling_0]]` と表示されていました。

## その他の変更

- 変更 1：

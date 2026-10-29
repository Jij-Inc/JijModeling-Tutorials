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

JijModeling では、以前から関数の引数に依存した型を持つような関数を記述することができましたが、今回のリリースでその扱いがより体系化され、付随するいくつかのバグが修正されました。
また、今回からそのような関数の型が正確に表示されるようになりました。

また、一部これまでの出力では、`__dangling_*` のような予期せぬ変数名がプレビュー時に出力される問題も解消しています。

+++

## バグ修正

+++

### バグ修正：辞書のキーに対するパターンマッチを含む制約条件が、制約検出時にエラーを引き起こす問題の修正

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

## その他の変更

- 変更 1：

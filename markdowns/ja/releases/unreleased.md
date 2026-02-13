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

## バグ修正

+++

### バグ修正1：決定変数を含む式に対する除法がコンパイルできない問題の修正

JijModeling 2.0.0 では、 `x / 2` のように決定変数が右辺に現れないような除法も誤ってコンパイル時エラーとなっていました。
このリリースでは、右辺に決定変数が現れなければ、除法が正しくコンパイルされるようになりました。

## その他の変更

- `Problem` クラスに {py:attr}`Problem.name` および {py:attr}`Problem.sense` プロパティが追加されました。

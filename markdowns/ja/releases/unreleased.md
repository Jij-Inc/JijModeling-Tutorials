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
N = problem.Integer("N")
c = problem.Float("c", shape=(N,))
x = problem.BinaryVar("x", shape=(N,))
i = jm.Element("i", belong_to=N)
problem += jm.sum(i, c[i] * x[i])
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

### バグ修正1：


## その他の変更

- `Problem` クラスに {py:attr}`Problem.name` および {py:attr}`Problem.sense` プロパティが追加されました。

---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### ランダムインスタンス生成でカテゴリーラベルの要素を直接リストで指定できるように

これまではランダムインスタンス生成でカテゴリーラベルの値を固定する場合、 `{"C": {"keys": ["A", "B", "C"]}}` のように `keys` として指定する必要がありましたが、リストで直接指定できるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
  C = problem.CategoryLabel()

  a = problem.Float(dict_keys=C)
  x = problem.BinaryVar(dict_keys=C)

  problem += (a * x).sum()
 
problem.generate_random_dataset(
    seed=42,
    options={"C": ["A", "B", "C"]} # {"C": {"keys": [...]}} と同値
)
```

リストが利用できるのはカテゴリーラベルのみであり、他のプレースホルダーなどについてはこれまで通りの形式で指定する必要があります。

+++

## バグ修正

+++

### バグ修正1：ランダムインスタンス生成にカテゴリーラベルの情報が含まれるように

ランダムインスタンス生成で得られたデータセットにカテゴリーラベルそのものの定義が含まれていなかった問題を修正しました。
これまでは以下の `dataset` には `C` が含まれておらず `eval` に失敗していましたが、本リリースからは問題なく実行されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("problem")
def problem(problem: jm.DecoratedProblem):
  C = problem.CategoryLabel()

  a = problem.Float(dict_keys=C)
  x = problem.BinaryVar(dict_keys=C)

  problem += (a * x).sum()
 
dataset = problem.generate_random_dataset(
    seed=42,
    options={"C": {"keys": ["A", "B", "C"]}}
)

dataset
```

```{code-cell} ipython3
problem.eval(dataset)
```

### バグ修正2：空リスト・空配列をプレースホルダーとして入力できるように

これまで、1 次元配列に対して空の配列やリストをインスタンスデータとして入力することはできましたが、2 次元以上の配列に対してはコンパイル時にエラーになっていました。

今回のリリースから、配列のシェイプが空データを許容する場合、いずれかの不定な軸の次元が 0 であるような多次元配列として解釈されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("p")
def problem(problem: jm.DecoratedProblem):
    cuts = problem.Float(ndim=2)

problem.eval({"cuts": []}) # これまではエラーだったが、$0 \times 0$ 配列として解釈される
```

### バグ修正3：浮動小数点数の丸め誤差により制約検出が停止しなくなる問題の修正

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
これにより、これまで検出されていた制約条件などがごく稀に検出されなくなるコーナーケースが想定されますが、標準的な入力では問題ないはずです。

## その他の変更

- 変更 1：

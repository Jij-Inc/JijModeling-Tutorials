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

### 空リスト・空配列をプレースホルダーとして入力できるように

これまで、1 次元配列に対して空の配列やリストをインスタンスデータとして入力することはできましたが、2 次元以上の配列に対してはコンパイル時にエラーになっていました。

今回のリリースから、配列のシェイプが空データを許容する場合、いずれかの不定な軸の次元が 0 であるような多次元配列として解釈されるようになりました。

```{code-cell} ipython3
@jm.Problem.define("p")
def problem(problem: jm.DecoratedProblem):
    cuts = problem.Float(ndim=2)

problem.eval({"cuts": []}) # これまではエラーだったが、$0 \times 0$ 配列として解釈される
```

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

## その他の変更

- 変更 1：

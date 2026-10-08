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

### バグ修正 1：ランダムインスタンス生成にカテゴリーラベルの情報が含まれるように

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

### $\LaTeX$ 表示のカスタマイズ

`latex` パラメータに加えて、 `element_latex` と `subscript_styles` という、$\LaTeX$ の表示をカスタマイズできる引数を `Placeholder`、`DecisionVar`、`NamedExpr`、`CategoryLabel` のコンストラクタに追加しました。

`element_latex` は、そのオブジェクトを範囲とする添字に共通の名前を設定します。
自動的に割り当てられる名前（`i`、`j` など）のかわりにこの名前が使われます。
なお、`lambda` 式や `for` 句でユーザーが書いた名前が、この名前で上書きされることになるのでご注意ください。

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N", element_latex="n")
c = problem.Float("c", shape=N)
x = problem.BinaryVar("x", shape=N)
problem += jm.sum(c * x)
problem += c.map(lambda v: v * 2).sum()
problem
```

タプル集合などの場合は、`element_latex`に名前のリストも指定できます。
名前が割り当てられなかった要素については、通常の命名挙動になります。

`subscript_styles` は、添字の実際の表示方法を変更します。たとえば、上付き添字、括弧、角括弧による表示に切り替えることができます。
多次元配列型は、スタイルを一つだけ指定した場合、全添字に適応されますが、スタイルのリストを渡すことで、添字の位置ごとに異なるスタイルを設定できます。

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N, N), subscript_styles=jm.SubscriptStyle.BRACKET)
y = problem.BinaryVar(
    "y", shape=(N, N), subscript_styles=[jm.SubscriptStyle.SUP, jm.SubscriptStyle.SUB]
)
problem += x[0, 1] + y[0, 1]
problem
```

## その他の変更

- 変更 1：

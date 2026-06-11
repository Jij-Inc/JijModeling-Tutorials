---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
kernelspec:
  display_name: .venv (3.12.12)
  language: python
  name: python3
---

# インスタンスのランダム生成を用いたデバッグ

本ドキュメントでは、JijModeling で書かれた数理モデルのデバッグ手法として、 {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` を使った方法を紹介します。このデバッグ手法はあくまで「数理モデルの各要素（プレースホルダーや決定変数、それらの成す式）のバグを探す方法」であることに注意してください。

## `generate_random_instance` とは

{py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` とは、数理モデルのプレースホルダーの定義に従ってインスタンスデータをランダムに生成し、その数理モデルとインスタンスデータをコンパイルして OMMX インスタンスを出力するメソッドです。詳しい利用方法は [こちら](./generation) を参照してください。

+++

## `generate_random_instance` を使ったデバッグ手法

グラフ彩色問題を題材に、どのように数理モデルのデバッグが行えるかを見ていきましょう。グラフ彩色問題の定式化の方法は [こちら](https://jij-inc-jijzept-tutorials-ja.readthedocs-hosted.com/ja/latest/src/08_graph_coloring.html) を参照してください。まずは"良くない定式化"をしてみましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

```{code-cell} ipython3
@jm.Problem.define("Graph Coloring Problem (Bad Modeling)")
def gcp_bad_modeling(problem: jm.DecoratedProblem):
    V = problem.Natural(description="Number of vertices")
    E = problem.Graph(description="Edges of the graph")
    N = problem.Natural(description="Number of colors")
    x = problem.BinaryVar(shape=(V, N), description="Binary variables for vertex-color assignment")

    problem += problem.Constraint(
        "one-color",
        [jm.sum(x[v, n] for n in N) == 1 for v in V]
    )

    problem += jm.sum(x[e[0], n] * x[e[1], n] for n in N for e in E )

gcp_bad_modeling
```

この定式化の良くない部分はどこでしょうか。 $\LaTeX$表示の目的関数と制約条件を一見すると、[グラフ彩色問題の定式化](https://jij-inc-jijzept-tutorials-ja.readthedocs-hosted.com/ja/latest/src/08_graph_coloring.html#id4)の通りになっているため、どこにもバグはないように思われます。
ここで、 以下のように {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` を複数回実行してみましょう。

```{code-cell} ipython3
try:
    for _ in range(25):
        _ = gcp_bad_modeling.generate_random_instance()
except jm.ModelingError as e:
    print(e)
```

すると、上記のように `ModelingError` が発生し、決定変数 $x$ の添字の範囲 $V \times N$ の外の値を指定してしまうケースがある事がわかります。なぜ、このようなケースが発生するのかというと、 $e[0]$ あるいは $e[1]$ の取り得る範囲が自然数全体 $\mathbb{N}$ となってしまっているからです。
この数理モデルのバグ（良くない部分）を修正するには、$e[0]$ および $e[1]$ の取り得る範囲を自然数全体ではなく $V$ に制限する必要があります。具体的には、以下のようなコードに変更することでバグを取り除くことができます。

```{code-cell} ipython3
@jm.Problem.define("Graph Coloring Problem (Good Modeling)")
def gcp_good_modeling(problem: jm.DecoratedProblem):
    V = problem.Natural(description="Number of vertices")
    # 修正点: dtype に V を指定することで取り得る範囲を明示的に制限する
    E = problem.Graph(dtype=V, description="Edges of the graph")
    N = problem.Natural(description="Number of colors")
    x = problem.BinaryVar(shape=(V, N), description="Binary variables for vertex-color assignment")

    problem += problem.Constraint(
        "one-color",
        [jm.sum(x[v, n] for n in N) == 1 for v in V]
    )

    problem += jm.sum(x[e[0], n] * x[e[1], n] for n in N for e in E )

gcp_good_modeling
```

では、この修正によりバグが取り除かれたかをどうかを改めて確認してみましょう。

```{code-cell} ipython3
for _ in range(25):
    _ = gcp_good_modeling.generate_random_instance()
```

エラーなく {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` を通すことが出来ました。この結果は、プレースホルダーの定義に従っているインスタンスデータをランダムに入れてもエラーが発生し難くなったこと、すなわち、数理モデルの定義のバグが少なくなったことを示しています。

+++

このように {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` を使えば、数理モデルの定義のバグを取ることができ、その数理モデルの質を高めることができるのです。

+++

## 注意点

JijModeling の表現力は発展途上にあります。そのため、必ずしも数理モデルの変更だけで {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` が通るようになるわけではありません。そのような場合には、 {py:meth}`Problem.generate_random_instance <jijmodeling.Problem.generate_random_instance>` の生成するプレースホルダーの値の範囲を [こちら](./generation) に従って調整してみることをおすすめします。

+++

:::{admonition} お悩みの方へ
:class: tip

JijModeling による数理モデルの定式化やデバッグでお悩みの方は、ぜひ、[Discordコミュニティ](https://discord.gg/34WkHwvY3Y)をご活用ください。
:::

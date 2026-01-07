---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# はじめに

## JijModelingとは

**JijModeling**は、Pythonコードを使用して数理モデルを記述するための数理最適化モデラーです。
多項式などを用いて、さまざまな種類の最適化問題を記述することができます。

## 主な特徴

### 1. 数理モデルとパラメータの分離


JijModeling では、数理モデルの記号的な定義と、入力されるパラメータ（**インスタンスデータ**）を分離しています。
インスタンスデータは数理モデルにおける決定変数以外の係数などに相当し、数理モデルはインスタンスデータを入力されて初めてソルバーへの入力（**インスタンス**）へと変換（コンパイル）されます。

:::{figure-md}
<img src="./images/model-and-instance-illustrated.svg" alt="記号的に記述された数理モデルに「インスタンスデータ」を入力すると、ソルバーへの入力データ（＝インスタンス）が生成される" class="mb1" width="75%">

数理モデルにパラメータ（**インスタンスデータ**）を入力してインスタンスを得る
:::

このように、JijModelingでは個々の数理モデルは個別のインスタンスデータからインスタンスを生成するためのスキーマとして機能し、インスタンスデータのサイズに影響されずに数理モデルを変更することが可能になっています。

### 2. ソルバーに依存しないモデリング

:::{figure-md}
<img src="./images/jijmodeling-workflow.svg" alt="JijModelingで記述された数理モデルは、OMMXを経て各種ソルバーに渡される" class="mb1" width="75%">

JijModelingとOMMXによる数理最適化問題の求解の流れ
:::

JijModelingで定義された数理モデルは、最終的に[OMMX Message形式](https://jij-inc.github.io/ommx/ja/introduction.html)で表現されたインスタンスへと**コンパイル**されます。
OMMX Messageはソルバーに依存しない数理最適化用のデータ交換形式であるため、Jijが提供しているソルバー（JijZeptSolver, OpenJijなど）やその他のソルバー（SCIP, Gurobi, FixstarsAmplifyなど）を**自由に切り替えて**問題を解くことができます。

### 3. 型検査による記述の誤りの早期発見

JijModelingは独自の型システムを搭載しており、添え字の成分数の食い違いなどの誤りを、数理モデルの記述時に発見できるようになっています。
特に、大規模なインスタンスデータを入力する前に間違いを即座に検出することができ、定式化の加速が図られます。

### 4. 制約条件のパターンの検出機能

数理最適化ソルバーには、特定の形をした制約条件に対してより高速な求解アルゴリズムを提供しているものがあります。
こうした高速化用の機能は、通常ユーザが意識的に明示して呼び出す必要があります。
一方、JijModelingは**自動でこうした制約条件の存在を検出**し、OMMX Messageを介してソルバーにその情報を渡すことで、ユーザの介在なしに自動的に求解を高速化します。
以下の例では、検出機能を有効化しただけで圧倒的な速度改善が見られています。

:::{figure-md}
<img src="./images/detection-speedup.svg" alt="検出を行わない場合、求解時間が入力サイズに対し自乗または指数オーダーで悪化しているのに対し、制約検出を有効化すると非常に緩やかな線型の変化になっている" class="mb1" width="100%">

二地区工場配置問題の制約検出による高速化
:::

### 5. 数理モデルの $\LaTeX$ 表示

JijModelingは非常に強力な$\LaTeX$出力機能を備えており、[JijZept IDE](https://www.jijzept.com/ja/products/ide/) や [Google Colab](https://colab.google/)、あるいは一般の [Jupyter Notebook](https://jupyter.org/) 上で数理モデルの定義を直感的に把握でき、数理モデルが期待通りに構築されているかどうかを迅速かつ対話的に確認できます。
以下は、ナップザック問題の定式化と、その$\LaTeX$出力の例です。

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack Problem", sense=jm.ProblemSense.MAXIMIZE)
def knapsack(problem: jm.DecoratedProblem):
    N = problem.Length(description="アイテム数")
    W = problem.Float(description="耐荷重")
    w = problem.Float(shape=N, description="各アイテムの重さ")
    v = problem.Float(shape=N, description="各アイテムの価値")
    x = problem.BinaryVar(shape=N, description="アイテム $i$ をナップザックに入れるときのみ $x_i=1$")

    problem += problem.Constraint(
        "weight",
        jm.sum(w[i] * x[i] for i in N) <= W,
        description="重さの総和が耐荷重を越えない"
    )
    problem += jm.sum(v[i] * x[i] for i in N)

knapsack
```

## Decorator API による直感的な記法

JijModeling 2.0.0から、旧来の記法に相当する Plain API に加えて、`@` つきの関数定義（**デコレータ**）内でのみ利用できる **Decorator API** と呼ばれる**略記法**をサポートしています。
これにより、**変数名の省略**や**内包表記による記号的な総和の記述**など、より「Pythonらしい」自然なコード記述が可能になりました。

### 記述例の比較

**Plain API による記述**：

```python
my_problem = jm.Problem("My Problem")
N = problem.Length("N")
x = problem.BinaryVar("x", shape=N)
problem += jm.sum(N.filter(lambda i: i % 2 == 0).map(lambda i: x[i]))
```

**Decorator API による記述**：

```python
@jm.Problem.define("My Problem")
def my_problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=N)
    problem += jm.sum(x[i] for i in N if i % 2 == 0)
```

+++

## インストール

`pip`を使用している場合、次のコマンドで`jijmodeling`をインストールできます：

```bash
pip install 'jijmodeling>=2.0.0b8'
```

uvを利用している場合、以下のようにして依存関係に追加できます：

<!-- FIXME: 正式リリース後、バージョン指定 >=2.0.0b8 を落とす -->

```bash
uv add 'jijmodeling>=2.0.0b8'
```

`jijmodeling`はPython 3.11以上が必要であることに注意してください。

```{code-cell} ipython3
import jijmodeling
jijmodeling.__version__
```

:::{caution}
本ドキュメントのコードを実行する際には、上記の`jijmodeling`のバージョンと同じものを使うことを強く推奨します。
:::

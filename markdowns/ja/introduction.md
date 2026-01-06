---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# はじめに

## JijModelingとは

**JijModeling**は数理最適化モデラーであり、Pythonコードを使用して数理モデルを記述するためのツールです。
特定のソルバを内蔵しているわけではなく、JijModelingで定式化した数理モデルに実際のパラメータを入力し、OMMXメッセージと呼ばれる中間形式に変換して種々のソルバーに渡して初めて解を求めることができます。
このように数理モデルの代数構造と入力データを分離することで、数理モデルを俯瞰的に考察し、検証し、より迅速に変更できるようになります。また、個々の数理モデルは入力データを差し替えることができるため、パラメータからソルバーへの入力を生成するためのスキーマとしても機能します。

JijModelingで記述した数理モデルをソルバーで解くには、実際のインスタンスデータと組み合わせて、[OMMX Adapter](https://jij-inc.github.io/ommx/ja/introduction.html)などの[JijZeptサービス](https://www.jijzept.com)で提供されるツールでソルバー用の入力形式に変換する必要があります。

JijModelingの主な特徴は次のとおりです。

### 数理モデルの定義とパラメータの分離

定義とデータを分離することで数理モデルの検証が迅速になり、モデルの再利用も容易になります。インスタンスのサイズが数理モデルの記述や操作のパフォーマンスに影響を与えることはありません。

### ソルバに依存しない汎用モデラー

JijModelingは汎用のモデラーとして設計されており、線形計画問題、混合整数計画問題、非線形計画問題など、さまざまな種類の最適化問題に対する共通のインターフェースとして機能します。
また、JijModelingは最終的に[OMMX形式](https://jij-inc.github.io/ommx/ja/introduction.html)にコンパイルされるため、ソルバに依存しない記述が可能になります。

### 記号的なモデルの取り扱い

数理モデルは記号的に記述されるため、数理モデルを段階的に構築したり、既存のモデルを記号的に変換する機能を実装するなど、より複雑な問題の記述をしやすくなっています。
また、JijModelingは数理最適化問題の構造を記号的に検出する機能を備えており、ソルバーによる求解の自動加速に利用できます。
更に、記述された数式は適宜型検査されるため、データを入力する前の段階で添え字の食い違いなど大部分のモデル記述のミスを検出できます。

### Python エコシステムとの統合

JupyterやNumpy、Pandasなどとシームレスに連携できます。
Jupyterでは、LaTeX出力機能により数理モデルが期待通りに構築されているかどうかを迅速かつ対話的に確認できます。

また、JijModeling はバージョン2.0より通常の API に加えて、`@` つきの関数定義（デコレータ）による **Decorator API** と呼ばれる**略記法**をサポートしており、**変数名の省略**や**内包表記による記号的な総和の記述**など、より「Pythonらしい」コード記述が可能になりました。
Decorator API を使わない次のような記述例を考えます：

```python
my_problem = jm.Problem("My Problem")
N = problem.Length("N")
x = problem.BinaryVar("x", shape=N)
problem += jm.sum(N.filter(lambda i: i % 2 == 0).map(lambda i: x[i]))
```

Decorator API を使うと、次のようにより自然に表すことができます：

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

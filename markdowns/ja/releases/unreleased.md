---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## パフォーマンス改善

+++

### 式・制約の構築の高速化

式や制約の作成にかかる時間が短縮されました。
特に Jupyter Notebook 上、`python -m` や `python -c` で実行した場合に、大きな効果があります。
従来、これらの環境では、式や制約を一つ作成するのにかかる時間が、読み込み済みの Python モジュール数に応じて増えていました。そのため、`python script.py` で直接実行する場合の何倍も時間がかかることがありました。
これらの環境でも、スクリプト実行と同程度の速さでモデルを構築できるようになりました。

以下は、制約を一つずつ 2,000 個作成してモデルを構築した際の所要時間です（CPython 3.14、Linux）。

| 実行方法 | 変更前 | 変更後 |
|---|---:|---:|
| Jupyter Notebook | 約 35 秒 | 約 0.14 秒 |
| `python -m` | 約 6.6 秒 | 約 0.26 秒 |
| `python script.py` | 約 0.53 秒 | 約 0.25 秒 |

ただし、このベンチマークのように同じ形の制約を一つずつ大量に作成する方法は推奨しません。
そのような制約は制約条件の族として定義してください（{doc}`../basics/objective_and_constraints` を参照）。族として定義すると JijModeling はそれらの制約を一つの定義として扱えるため、モデルの構築・制約検出・ OMMX インスタンスへのコンパイルのいずれも、制約を個別に作成する場合より高速になります。

## 機能強化

+++

### LaTeX 出力の改善
畳み込みや genarray を使った場合の表示を改善しました。たとえば、以下のような `axis` 指定総和の TSP 問題の表記が改善されました：

```{code-cell} ipython3
import jijmodeling as jm 

@jm.Problem.define("tsp")
def tsp(problem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N, N))
    d = problem.Float(shape=(N,N))
    problem += jm.sum(d[i, j] * x[(t + 1) % N, j] for t in N for i in N for j in N)
    problem += problem.Constraint("one time", x.sum(axis=0) == 1)
    problem += problem.Constraint("one city", x.sum(axis=1) == 1)
tsp
```

また、以下のような `genarray` 等に対する添え字も簡約して表示されるようになりました：

```{code-cell} ipython3
@jm.Problem.define("problem")
def prob(problem):
  N = problem.Natural()
  M = problem.Natural()
  x = problem.IntegerVar(shape=(M,N), lower_bound=1, upper_bound=10)
  a = problem.Integer(shape=(M,N))

  A = problem.NamedExpr(jm.genarray(x[m,n] * a[m] for (n, m) in (N, M)).sum())
  B = problem.NamedExpr(jm.sum(jm.genarray(x[m,n] * a[m] for (n, m) in (N, M))[i, j] for i in N for j in M))
 
prob
```

### エージェントがスキルを発見しやすく

README や API Reference、パッケージのメタデータ、モジュール内ドキュメントなどにスキルの取得方法を明記することで、コーディングエージェントがスキルを発見しやすくなりました。
これにより、コーディングエージェントがより自然なJijModelingコードを書きやすくなりました。

+++

## バグ修正

+++

## その他の変更

-

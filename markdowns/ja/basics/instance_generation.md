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

# インスタンスの生成

{doc}`前節 <modeling>`までで数理モデルの一通りの定式化方法を学んできました。
本節では、いよいよ数理モデルを OMMX インスタンスへとコンパイルし、OMMX Adapter を経由して問題を解くまでの流れを説明します。

:::{figure} ../images/model-and-instance-illustrated.svg
:alt: 記号的に記述された数理モデルに「インスタンスデータ」を入力すると、ソルバーへの入力データ（＝インスタンス）が生成される
:name: modeling-workflow
:width: 75%

インスタンスデータ作成までの流れ
:::

{numref}`図%s <modeling-workflow>` にモデルからインスタンスを得るまでの流れを再掲しました。
これに沿って、インスタンスデータの用意とコンパイルの順に説明します。

以下では、次のシナジーボーナスつきのナップサック問題を例に説明します。

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack with Synergy", sense=jm.ProblemSense.MAXIMIZE)
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    W = problem.Float(description="Weight limit of the problem")
    v = problem.Float(shape=(N,), description="Values of the items")
    w = problem.Float(shape=(N,), description="Weights of the items")
    s = problem.PartialDict(
        dtype=float, dict_keys=(N, N), description="Synergy bonus between items"
    )
    x = problem.BinaryVar(shape=(N,), description="Item selection variables")

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += jm.sum(s[i, j] * x[i] * x[j] for i, j in s.keys())

    problem += problem.Constraint("weight", jm.sum(w[i] * x[i] for i in N) <= W)


problem
```

## インスタンスデータの用意

各プレースホルダーとカテゴリーラベルに対応するデータを用意する必要があります。
現在各データの仕様は以下のようになります：

| プレースホルダーの種類 | 対応する Python のデータ型 |
| ------------------ | ----------------------- |
| 単体のプレースホルダー | 値の型に一致する Python の数値やタプル |
| プレースホルダーの配列 | 値の型に一致する Python の（多重）リストまたは{py:class}`NumPy 配列 <numpy.ndarray>` |
| プレースホルダーの辞書 | 値の型に一致する Python の{py:class}`辞書 <dict>` |
| カテゴリーラベル | 重複のない数値または文字列からなる Python のリスト |

また、配列のシェイプや辞書の全域性に関する制約を満たすようにデータを与える必要があります。
現時点においては、辞書のデータを配列として与えることはできないので注意してください。

インスタンスデータは、これらをそれぞれの変数名に対応させた Python の辞書として用意します。
それでは、`problem` に対するインスタンスデータを用意してみましょう。

```{code-cell} ipython3
import random
import numpy as np

random.seed(42)
N_data = 10
W_data = random.randint(10, 75)
v_data = [random.uniform(1, 20) for _ in range(N_data)]
w_data = np.array([random.uniform(1, 15) for _ in range(N_data)])  # Numpy 配列も可
s_data = {(1, 2): 5.0, (1, 4): 3.0, (2, 9): 5.0, (3, 5): 10}

instance_data = {"N": N_data, "W": W_data, "v": v_data, "w": w_data, "s": s_data}
```

:::{admonition} インスタンスデータのランダム生成
:class: tip

正式リリースまでの間に、インスタンスデータをランダム生成する機能が追加される予定です。
:::

+++

## インスタンスへのコンパイル

モデルとインスタンスデータが用意できたら、いよいよ OMMX インスタンスへのコンパイルを行います。
一番簡単な方法は、{py:meth}`Problem.eval() <jijmodeling.Problem.eval>` メソッドを使う方法です：

```{code-cell} ipython3
instance1 = problem.eval(instance_data)
instance1.constraints_df
```

```{code-cell} ipython3
instance1.decision_variables_df
```

```{code-cell} ipython3
instance1.objective
```

これは実際には {py:meth}`Compiler.from_problem() <jijmodeling.Compiler.from_problem>` メソッドと {py:meth}`Compiler.eval_problem() <jijmodeling.Compiler.eval_problem>` メソッドを呼び出しており、以下のように書くのと同値です：

```{code-cell} ipython3
compiler = jm.Compiler.from_problem(problem, instance_data)
instance2 = compiler.eval_problem(problem)

assert instance1.objective.almost_equal(instance2.objective)
assert len(instance1.constraints) == 1
assert len(instance2.constraints) == 1
assert instance2.constraints[0].equality == instance1.constraints[0].equality
assert instance2.constraints[0].function == instance1.constraints[0].function
```

:::{admonition} 何故問題を二回渡す必要があるのか？
:class: note

上の例では、{py:meth}`~jijmodeling.Compiler.from_problem` と {py:meth}`~jijmodeling.Compiler.eval_problem` の両方に `problem` 問題を渡しています。
これは一見無駄に見えますが、それぞれ以下のように別々の役割を持っています：

{py:meth}`~jijmodeling.Compiler.from_problem` の第 1 引数の {py:class}`~jijmodeling.Problem` オブジェクト
:    {py:class}`~jijmodeling.Compiler` が評価時に用いる決定変数の型の情報などを取得するのに使われています。
     こうした情報の束を JijModeling では {py:class}`~jijmodeling.Namespace` と呼びます。
     実際には {py:class}`~jijmodeling.Problem` が保持している {py:class}`~jijmodeling.Namespace` オブジェクトを {py:meth}`~jijmodeling.Problem.namespace` プロパティにより取得し、それを使って {py:meth}`Compiler の構築子 <jijmodeling.Compiler.__new__>` を呼ぶ形になっています。

{py:meth}`~jijmodeling.Compiler.eval_problem` の第 1 引数の {py:class}`~jijmodeling.Problem` オブジェクト
:    インスタンスにコンパイルしたい {py:class}`~jijmodeling.Problem` オブジェクトを指定します。
     {py:class}`~jijmodeling.Compiler` オブジェクトは特定の {py:class}`~jijmodeling.Problem` に限定されたものではなく、決定変数やプレースホルダーが一致しているような複数の {py:class}`~jijmodeling.Problem` オブジェクトに対して使い回すことができるため、このような形になっています。
:::

単純に {py:class}`~jijmodeling.Problem` をインスタンスにコンパイルするだけであれば {py:meth}`Problem.eval() <jijmodeling.Problem.eval>` メソッドを使うのが手軽ですが、 {py:class}`~jijmodeling.Compiler` オブジェクトは {py:meth}`~jijmodeling.Compiler.get_constraint_id_by_name` や {py:meth}`~jijmodeling.Compiler.get_decision_variable_by_name` メソッドなどを使ってモデルの制約条件や決定変数の OMMX 側での ID の情報を取得することもできます。

また、{py:class}`~jijmodeling.Compiler` はインスタンスへのコンパイル以外にも、以下のように {py:meth}`~jijmodeling.Compiler.eval_function` メソッドを個別のスカラー関数式を OMMX の {py:class}`~ommx.v1.Function` オブジェクトに評価したり、{py:meth}`~jijmodeling.Compiler.eval_constraint` により個別の制約条件を（Problem に登録せずに）OMMX の {py:class}`~ommx.v1.Constraint` オブジェクトに評価したりすることもできます。
以下は `problem` 問題の決定変数を使った関数式を評価している例です：

```{code-cell} ipython3
x_ = problem.decision_vars["x"]
compiler.eval_function(jm.sum(x_.roll(1) * x_) - 1)
```

`eval_function` や `eval_constraint` メソッドはデバッグに使える他、コンパイル後の {py:class}`ommx.v1.Instance` を変形する用途などに利用できます。

また、一度作成した Compiler は、プレースホルダーと決定変数を共有する複数のモデルに対して使い回すことができ、決定変数や制約条件の ID の対応関係も保存されます。
この機能は、同じパラメーターを持ちつつ制約条件や目的関数を変化させた複数のモデルを同時にコンパイルし、結果を比較する用途などに便利です。

:::{admonition} OMMX SDK を用いた問題の変形
:class: tip

OMMX SDK にはコンパイル後の {py:class}`~ommx.v1.Instance` オブジェクトを変形するための様々な機能が用意されています。
たとえば、決定変数の値を固定したり、{py:meth}`ommx.v1.Instance.to_qubo` メソッドなどを使ってペナルティ法を用いて制約つき問題を制約なしの QUBO 問題へと変換したり、といったことが可能です。
こういった機能の詳細については [OMMX の公式ドキュメント](https://jij-inc.github.io/ommx/ja/)を御覧ください。
:::

### `eval` や `eval_problem` のオプション

{py:meth}`Problem.eval() <jijmodeling.Problem.eval>` や {py:meth}`Compiler.eval_problem() <jijmodeling.Compiler.eval_problem>` メソッドは、どちらも以下の共通のキーワード限定引数を渡すことで挙動を制御できるようになっています：

`prune_unused_vars: bool`
:    `True` に設定すると、デフォルトでは目的関数や制約条件に現れる決定変数のみが {py:class}`~ommx.v1.Instance` に登録されるようになります。
     デフォルト値は `False` であり、モデル中に現れない決定変数も登録されるようになっています。

`constraint_detection: Optional[ConstraintDetectionConfig | bool] = None`
:    JijModeling には制約条件の構造を検知して OMMX インスタンスに反映させることで、OMMX Adapter がより効率的にソルバーを呼び出せるようになっています。
     この検出機能はデフォルトで有効になっていますが、現状最大数秒程度のコンパイル時のオーバーヘッドがかかります。
     このオプションに {py:class}`~jijmodeling.ConstraintDetectionConfig` オブジェクトを渡してやることで、検出する制約条件の種類を指定したり、振る舞いに関するパラメーターを調整したりすることができます。
     また、`False` を渡すことで検出機能じたいを無効化できます。

## インスタンスの求解

OMMX インスタンスが得られたら、あとは OMMX Adapter を使ってソルバーで解くだけです。
以下では、SCIP アダプターを使って解く例を示します：

```{code-cell} ipython3
from ommx_pyscipopt_adapter import OMMXPySCIPOptAdapter

# SCIPを介して問題を解き、ommx.v1.Solutionとして解を取得
solution = OMMXPySCIPOptAdapter.solve(instance1)

print(f"目的関数の最適値: {solution.objective}")

solution.decision_variables_df[["name", "subscripts", "value"]]
```

OMMX Adapter の詳しい利用方法については、{external+ommx_doc:doc}`OMMX のユーザーガイド <introduction>`を参照してください。
また、SCIP だけでなく{external+ommx_doc:doc}`さまざまなソルバーに対する OMMX Adapter <user_guide/supported_ommx_adapters>`が用意されており、同様の手順で利用することができます。

:::{admonition} OMMX SDK の名寄せ機能は決定変数や制約の辞書に未対応
:class: important

OMMX SDK の {py:class}`~ommx.v1.Solution` オブジェクトには、決定変数や制約の値を名前から名寄せする {py:meth}`~ommx.v1.Solution.extract_decision_variables` や {py:meth}`~ommx.v1.Solution.extract_constraints` メソッドが用意されています。
これらは現時点で文字列を添え字とする決定変数や制約には対応していないため、辞書やカテゴリーラベルを使ったモデルの `Solution` に対して呼び出すとエラーになってしまいます。
こうした場合は、JijModeling の {py:meth}`Compiler.get_constraint_id_by_name() <jijmodeling.Compiler.get_constraint_id_by_name>`  や {py:meth}`Compiler.get_decision_variable_by_name() <jijmodeling.Compiler.get_decision_variable_by_name>` メソッドを呼び出してコンパイラから ID との対応を取得し、その ID を {py:meth}`ommx.v1.Solution.get_constraint_value` や {py:meth}`ommx.v1.Solution.get_decision_variable_by_id` メソッドに渡して値を取得するようにしてください。
:::

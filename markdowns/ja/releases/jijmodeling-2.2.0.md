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

# JijModeling 2.2.0 リリースノート

+++

## 機能強化

+++

### 辞書の総和・畳み込みの挙動を修正

辞書の総和・畳み込みは {py:meth}`~jijmodeling.Expression.items`, {py:meth}`~jijmodeling.Expression.values`, {py:meth}`~jijmodeling.Expression.keys` を介して行われる想定であり、直接畳み込みはサポートされていない予定でした。
しかし、前バージョンまでは誤って辞書の畳み込みが提供されてしまっており、しかも Python の辞書の挙動と同じくキーの集合について行われるようになっていました。
また、Placeholder や DecisionVar の多次元配列の畳み込みの挙動との整合性の観点から、辞書型はキーではなく値の集合として畳み込まれるのが自然であるため、こちらの挙動を正式な仕様として定め、こちらの挙動を実装しなおしました。

以下が今回の修正の例です。

```{code-cell} ipython3
import jijmodeling as jm
import ommx.v1

problem = jm.Problem("My Problem")
I = problem.CategoryLabel("I")
x = problem.BinaryVar("x", dict_keys=I)

x.sum()  # 旧来の x.values().sum() と同じ挙動に
```

### 決定変数の上下界の表示の改善

決定変数の上下界が $\LaTeX$ 出力でより見やすく表示されるようになりました。

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N")
M = problem.Natural("M")
d = problem.Float("d", shape=(M,))
L = problem.Float("L", shape=(N, M))
x = problem.ContinuousVar(
    "s", shape=(N, M), lower_bound=L, upper_bound=lambda i, j: d[j]
)
problem += x.sum()

problem
```

### 決定変数の値を固定する機能を追加

{py:meth}`Problem.eval <jijmodeling.Problem.eval>` や {py:meth}`Compiler.from_problem <jijmodeling.Compiler.from_problem>` で、決定変数の値を（部分的に）固定する機能を追加しました。
オプショナルなキーワード引数 `fixed_variables` に、固定したい変数名をキーとし、固定値または添え字から固定値への辞書を値とする辞書を渡すことで、変数の値を固定できます。
固定された値は、対応する ommx の決定変数の `fixed_value` 属性に格納されます。

```{code-cell} ipython3
problem = jm.Problem("My Problem")
N = problem.Length("N")
x = problem.ContinuousVar("x", shape=(N, N), lower_bound=-10, upper_bound=10)
y = problem.IntegerVar("y", lower_bound=0, upper_bound=10)
problem += x.sum() + y

compiler = jm.Compiler.from_problem(
    problem,
    {"N": 2},
    fixed_variables={
        "x": {(0, 1): 1, (1, 1): 5},
        "y": 3,  # {(): 3} と書いてもよい
    },
)
instance = compiler.eval_problem(problem)

instance.objective
```

```{code-cell} ipython3
x00 = compiler.get_decision_variable_by_name("x", (0, 0))
x10 = compiler.get_decision_variable_by_name("x", (1, 0))
assert instance.objective.almost_equal(ommx.v1.Function(x00 + x10 + 9))
```

## バグ修正

+++

### バグ修正：制約検出が添え字つき制約条件を正しく処理できない問題の修正

旧リリースでは、添え字つき制約条件が存在する最適化問題のインスタンス生成時に、制約検出が有効（デフォルト状態）だと予期せぬエラーが発生していた問題を修正しました。

+++

### バグ修正： $\LaTeX$ 出力で入れ子の下付き添え字を平坦化

 `x[i][j]` のように入れ子の添え字アクセスが、$\LaTeX$ 出力で旧来の ${{x}_{i}}_{j}$ ではなく ${x}_{i,j}$ としてレンダリングされるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
x = problem.BinaryVar("x", shape=(2, 2))
x[0][1]
```

### バグ修正：不正な決定変数の定義に対するエラーの改善

これまでは、決定変数の上下界の指定が不正である場合、`try-except` などで捕捉できない回復不能な例外が発生していました。
今回の修正から、こうした場合は {py:class}`ValueError` が発生するようになり、また例外のメッセージもよりわかりやすくなりました。

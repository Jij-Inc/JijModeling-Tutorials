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

### 辞書の総和・畳み込みの挙動を修正

辞書の総和・畳み込みは {py:meth}`~jijmodeling.Expression.items`, {py:meth}`~jijmodeling.Expression.values`, {py:meth}`~jijmodeling.Expression.keys` を介して行われる想定であり、直接畳み込みはサポートされていない予定でした。
しかし、前バージョンまでは誤って辞書の畳み込みが提供されてしまっており、しかも Python の辞書の挙動と同じくキーの集合について行われるようになっていました。
また、Placeholder や DecisionVar の多次元配列の畳み込みの挙動との整合性の観点から、辞書型はキーではなく値の集合として畳み込まれるのが自然であるため、こちらの挙動を正式な仕様として定め、こちらの挙動を実装しなおしました。

以下が今回の修正の例です。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
I = problem.CategoryLabel("I")
x = problem.BinaryVar("x", dict_keys=I)

x.sum() # 旧来の x.values().sum() と同じ挙動に
```

### 決定変数の上下界の表示の改善

決定変数の上下界が $\LaTeX$ 出力でより見やすく表示されるようになりました。

```{code-cell} ipython3
problem = jm.Problem("problem")
N = problem.Natural("N")
M = problem.Natural("M")
d = problem.Float("d", shape=(M,))
x = problem.ContinuousVar(
    "s", shape=(N, M), lower_bound=0, upper_bound=lambda i, j: d[j]
)
problem += x.sum()

problem
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

## その他の変更

- 変更 1：

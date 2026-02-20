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

### 機能1

+++

## バグ修正

+++

### バグ修正2： $\LaTeX$ 出力で入れ子の下付き添え字を平坦化

 `x[i][j]` のように入れ子の添え字アクセスが、$\LaTeX$ 出力で旧来の ${{x}_{i}}_{j}$ ではなく ${x}_{i,j}$ としてレンダリングされるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
x = problem.BinaryVar("x", shape=(2, 2))
x[0][1]
```

### バグ修正1：制約検出が添え字つき制約条件を正しく処理できない問題の修正

旧リリースでは、添え字つき制約条件が存在する最適化問題のインスタンス生成時に、制約検出が有効（デフォルト状態）だと予期せぬエラーが発生していた問題を修正しました。

## その他の変更

- 変更 1：

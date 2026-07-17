---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.4
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### JijModeling v1 以上の速度・メモリ効率を達成

コンパイラ基盤の大幅な見直しが行われ、一部のベンチマークでは従来に比べて約10倍の速度向上が達成されました。

<!-- TODO: グラフを挿入 -->

またメモリ使用量にも改善が見られています。 <!-- TODO: 数字を出す -->

この改善により、JijModeling 2 は以前の JijModeling 1 と同等かそれ以上のパフォーマンスを達成するようになりましたので、これを機に JijModeling 2 への移行を是非検討してください。

### [Type Mismatch エラー](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/v2.6.0/error_codes/error/E-TE0004.html)の改善

Type Mismatch エラーが必要に応じて実際に型が合わなかった項を含むようになりました。

```{code-cell} ipython3
import jijmodeling as jm


try:
    @jm.Problem.define("MyProblem")
    def problem(problem: jm.DecoratedProblem):
        N = problem.Length()
        W = problem.Float()
        x = problem.BinaryVar(shape=N)

        problem += x[W] # Error!
except Exception as e:
    print(e)
```

合わせて、エラーコードインデックスの当該エラーの内容がより詳細になりました。

+++

## バグ修正

+++

### バグ修正1：


## その他の変更

-

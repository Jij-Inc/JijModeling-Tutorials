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

### 制約検出の大幅なパフォーマンス改善

制約検出機能が大幅に高速化し、旧来は一時間経っても完了しなかったモデルであっても 1 秒程度で完了するようになりました。
速度面から {py:meth}`jijmodeling.Problem.eval` や {py:meth}`jijmodeling.Compiler.eval_problem` で `constraint_detection=False` を指定していたモデルがある場合、いちど `constraint_detection` オプションを省略し有効化した状態で実行してみてください。

## その他の変更

- 変更 1：

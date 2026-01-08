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

# 変数の定義

本節では、JijModelingにおいて現れる二種類の変数、**決定変数**と**プレースホルダー**について、それぞれの役割と定義の仕方を学びます。
まずはいつも通りのモジュールのインポートから始めましょう。

```{code-cell} ipython3
import jijmodeling as jm
```

## JijModelingにおける二種類の「変数」

JijModelingでは、二種類の**変数**が存在します。
一つは数理最適化問題の重要な構成要素の一つである**決定変数**であり、ソルバーにより値が決定される意思決定のための変数です。
これに加え、JijModeling ではインスタンスへのコンパイル時にインスタンスデータの値が代入される**プレースホルダー**と呼ばれる種類の変数が存在します。
後者のプレースホルダーの概念は、入力データと数理モデルの定義を分離しているJijModeling特有の概念であり、これによって型検査による誤りの検出や制約検出、簡潔な$\LaTeX$出力などの機能が実現されています。

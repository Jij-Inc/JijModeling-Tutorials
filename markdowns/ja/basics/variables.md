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

:::{figure-md} two-kinds-of-vars

<img src="./images/decision-vars-and-placeholders.svg" alt="コンパイル時にインスタンスデータが代入されるのがPlaceholder、コンパイル後も残りソルバーによって決定されるのが決定変数" class="mb1" width="100%">

プレースホルダと決定変数
:::

[図1](#two-kinds-of-vars)に両者の簡単な例を示しました。
$N$や$d$はコンパイル時にインスタンスデータが代入されるパラメータ、つまり**プレースホルダ**であり、インスタンスでは具体的な値に置き換えられています。
一方、各$x_i$たちはソルバーによって値が決定される**決定変数**であり、インスタンスにおいても残りつづけています。
この例では、$x_n$たちはプレースホルダ$N$の要素$n$によって添え字づけられており、数理モデルの段階では長さは不定になっています。
しかし、コンパイル時に具体的な$N$の値は確定し、この例では$3$個の独立した決定変数へと展開されています。

以上を踏まえて、決定変数・プレースホルダーそれぞれの種類と宣言方法について見ていきましょう。

## 単独の決定変数・プレースホルダの宣言

この節では、決定変数・プレースホルダの種類と、単独の（添え字がついていない）変数の宣言方法について学びます。
「[概要](./overview)」や「[数理モデルの宣言](./problem)」でも説明したように、JijModelingではこれらの決定変数は特定の数理モデルに紐付けて登録・宣言されます。

### 決定変数

決定変数は各種ソルバーが制約条件と目的関数に基づいて値を決定する変数です。JijModelingは汎用モデラーであるため、代表的な以下の種類をサポートしています：

| 構築子 | 数式 |説明  | 
| :---- | :--: | :--- |
| [`BinaryVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.BinaryVar)  | $\{0, 1\}$ | $0$ または $1$ の値を取る二値変数。上下界の設定は不要。 |
| [`IntegerVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.IntegerVar) | $\mathbb{Z}$ | 整数変数。上下界の設定が必要。 |
| [`ContinuousVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.ContinuousVar) | $\mathbb{R}$ | 実数値を取る連続変数。上下界の設定が必要。 |
| [`SemiIntegerVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.SemiIntegerVar) | - | 上下界内の整数値またはゼロの値をとる変数。上下界の設定が必要。 |
| [`SemiContinuousVar`](https://jij-inc-jijmodeling.readthedocs-hosted.com/en/latest/autoapi/jijmodeling/index.html#jijmodeling.Problem.SemiContinuousVar) | - | 上下界内の連続値またはゼロの値をとる変数。上下界の設定が必要。 |

特定の種類の決定変数を宣言するには、その変数を登録する `Problem` オブジェクトに対して対応する「構築子」の名前のメソッドを呼び出してやれば大丈夫です。
それでは、二値変数 $x$ と、$-5$ 以上 $10.5$ 以下の範囲に値を取る連続変数 $W \in [-5, 10.5]$ を持つ数理モデルを定義してみましょう。
Plain API では次のように定義できます：

```{code-cell} ipython3
problem = jm.Problem("Model with Variable")
x = problem.BinaryVar("x")
W = problem.ContinuousVar("W", lower_bound=-5, upper_bound=10.5)

problem
```
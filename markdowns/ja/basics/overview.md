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

# 概要

以下の各節では、JijModeling で数理最適化問題を扱う上で必要となる基本的な事項について個別に見ていきます。
また、「[はじめに](../introduction)」節でも触れたPlain APIとDecorator APIそれぞれの記法についても、適宜同時に紹介していきます。

:::{seealso}
そもそも数理最適化とは何か？という点については、JijZeptの「[数理最適化の基礎](https://www.jijzept.com/ja/docs/tutorials/optimization_basics/01-introduction/)」などの他の文献をご参照ください。
:::

本節で扱う内容は以下の通りです：

1. [**数理モデルの宣言**](./problem)：JijModelingでは、変数や制約条件などはすべて特定の数理モデルに紐付けて扱われます。そこで、数理モデルを宣言する方法について最初に扱います。
2. [**変数の定義**](./variables)：数理最適化問題を構成する決定変数と、インスタンスデータを流し込むことで確定するパラメータであるプレースホルダー、またそれらの族の種類や宣言方法について採り上げます。
3. **式の構築**（近日公開）：目的関数や制約条件の定義や、または変数のシェイプの宣言などにも使われるJijModeling の式の構築方法について説明します。
4. **数理モデルの定式化**（近日公開）：これまでの要素を用いて、数理モデルの目的関数や制約条件を設定する方法を紹介します。
5. **インスタンスの生成**（近日公開）：インタンスデータを入力しインスタンスを生成する方法を学びます。また、制約検出の制御についても簡単に触れます。

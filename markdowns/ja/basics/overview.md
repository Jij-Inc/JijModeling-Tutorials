---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# 概要

以下の各節では、JijModeling で最適化問題を扱う上で必要となる基本的な事項について個別に見ていきます。
また、「{doc}`../introduction`」節でも触れた Plain API と Decorator API それぞれの記法についても、適宜同時に紹介していきます。
読み進める前にクイックスタート（{doc}`SCIP版 <../quickstart/scip>`、{doc}`OpenJij版 <../quickstart/openjij>`の少なくとも一方）に目を通して全体の雰囲気を掴んでおくと、スムーズに読み進められるでしょう。

:::{seealso}
そもそも数理最適化とは何か？という点については、JijZept の「[数理最適化の基礎](https://www.jijzept.com/ja/docs/tutorials/optimization_basics/01-introduction/)」などの他の文献をご参照ください。
:::

本節で扱う内容は以下の通りです：

1. **{doc}`problem`**：JijModeling では、変数や制約条件などはすべて特定の数理モデルに紐付けて扱われます。そこで、数理モデルを宣言する方法について最初に扱います。
2. **{doc}`variables`**：数理モデルの重要な構成要素であるプレースホルダー・決定変数などの各種変数について、その種類と概要を説明します。
3. **{doc}`placeholders`**：数理モデルのコンパイルに必要な入力データである**プレースホルダー**や**カテゴリーラベル**の宣言方法について説明します。
4. **{doc}`decision_variables`**：数理モデルを構成する**決定変数**の宣言方法を解説します。
5. **{doc}`expressions`**：目的関数や制約条件の定義や、または変数のシェイプの宣言などにも使われる JijModeling の式の構築方法について説明します。
6. **{doc}`modeling`**：これまでの要素を用いて、数理モデルの目的関数や制約条件を設定する方法を紹介します。
7. **{doc}`instance_generation`**：インタンスデータを入力しインスタンスを生成する方法を学びます。また、制約検出の制御についても簡単に触れます。
## 用語法

以下、「自然数」といった場合は$0$を含む非負整数を指すことにします。また、自然数・整数・実数をまとめて「スカラー」と呼ぶことにします。
また、$1, 2, 3$ や $5.2$ などのように、変数を含まず具体的な数値を表す定数式の事を、以下では「定数リテラル」と呼ぶことにします。

---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.0
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# 式の構築と型

本節では、JijModeling における色々な式の記述方法について説明していきます。
また、JijModeling の式は、幾つかの種類＝型に分類されます。
JijModeling はこの式の型の情報を Python の型ヒントに加え、独自のより詳細な検査を行う型システムを搭載しており、モデルの構築時に典型的な記述のミスを検出することが可能になっています。
以下では、JijModeling の「型」システムの概要について触れたあと、型ごとにどのような式が構築可能なのかについて見ていきます。

## JijModeling の式の種類

JijModeling では以下の二段階で型検査を行っています：

1. Python の型ヒントによるエディタの補完・型検査支援
2. JijModeling 内蔵の型検査器による、モデル構築時の型検査

(1) はライブラリに Python コードとして同梱されており、 `Pyright` や `ty`、`pyrefly` といった代表的な型検査器によるエディタや Jupyter Notebook 上での補完・静的検査を可能にしています。
しかし、Python の型ヒントで表現できる制約には制限があり、たとえば配列の添え字サイズの検証などには不向きです。こうした表現力の不足を補うため、JijModeling は (2) の独自の型検査器も内蔵しています。
(2)の型検査器は Python のユーザーが呼び出すものではなく、モデルへの制約条件や目的関数項の追加、決定変数・プレースホルダーの `shape` の宣言などの際に適宜呼び出され、記述の誤りがないかを（データを入力する以前に）自動的に検証するようになっています。いわば、エディタや Juptyer Notebook 上では「本来の」JijModeling の型システムよりも「粗い」基準で検査を行い、構築の過程でより細分された形で検査を行う形になっているのです。

以下では、より細分された (2) の型システムについての簡単な解説を与えます。特に、型ヒント上では {py:class}`Expression <jijmodeling.Expression>` 型として単一のクラスで表現されている「式」が内部的にどのような型に細分化されているかを見ていきましょう。

JijModeling における式の「型」は以下のいずれかから成ります：

- 数値型
- 文字列型
- 多次元配列型
- 真偽値型
- 比較型
- 辞書型
- 関数型
- タプル型
- 集合型
- ユーザー定義によるカテゴリーラベル型

これらの型は更に細分化された分類が存在し、それぞれの型の値は安全な範囲で自動的に変換されて使うことができます。
以下、それぞれの型の詳細と、その型を持つ式の代表的な演算について見ていきます。

## 各型とその上の演算

### 数値型 `Scalar[stage, domain]` に属する式


整数や連続値などの数値を表す型です。
複数の種類の数値型が存在しますが、それらの間には自然な部分集合の関係が入り、互換性のある数値の間は自動的にキャストされます。
具体的には以下の二つの軸で分類されます：

ステージ
: 決定変数の有無を表します。以下のいずれかです。

  `Static`
  : 決定変数を**含まない**

  `Dynamic`
  : 決定変数を**含みうる**

  `Static` な数値型は `Dynamic` な数値型として扱うこともできます。

ドメイン
: 数値の範囲を表し、以下のいずれかに該当し、下にいくほど広い範囲に対応し、先に現れたものは後に現れたものへ自動でキャストされます。

  `Binary` $\{0, 1\}$
  : $0$ または $1$ の値を取るバイナリ変数です。決定変数としては{py:meth}`BinaryVar <jijmodeling.Problem.BinaryVar>`、プレースホルダーとしては {py:meth}`Binary <jijmodeling.Problem.Binary>` に相当します。

  `RangeNat[n]` $\mathbb{N}_{<n}$
  : 決定変数を含まない（`Static`な）自然数$n$について、$0$以上$n$未満の自然数の全体 $\{0, \ldots, n - 1\}$を表します。
    決定変数としては、`lower_bound=0`かつ`lower_bound=n-1`に指定された{py:meth}`IntegerVar <jijmodeling.Problem.IntegerVar>`に相当します。
    プレースホルダーとして正確に対応するものはありません。
  
  `Natural` $\mathbb{N}$
  : $0$ を含む自然数全体を表します。決定変数としては下界が$0$で上界が無限大の{py:meth}`IntegerVar <jijmodeling.Problem.IntegerVar>`、プレースホルダーとしては {py:meth}`Natural <jijmodeling.Problem.Natural>` やその別名である {py:meth}`Length <jijmodeling.Problem.Length>` と {py:meth}`Dim <jijmodeling.Problem.Dim>` に相当します。

  `Integer` $\mathbb{Z}$
  : 整数全体を表します。決定変数としては {py:meth}`IntegerVar <jijmodeling.Problem.IntegerVar>`、プレースホルダーとしては{py:meth}`Integer <jijmodeling.Problem.Integer>`に対応します。

  `Float` $\mathbb{R}$
  : 実数値（連続値）を表します。決定変数としては {py:meth}`ContinuousVar <jijmodeling.Problem.ContinuousVar>`、プレースホルダーとしては {py:meth}`Float <jijmodeling.Problem.Float>`を表します。

以下の演算が可能です：

- 標準的な四則演算 `+`, `-`, `+`, `/` と剰余 `%` が自由につかえ、型も自然に推論されます。
- `==`, `!=`, `<`, `<=`, `>`, `>=` により値の等値性・大小関係を比較できます。
  + 比較後の型は単なる真偽値型ではなく、後述する**比較型**に推論されます。
  + これは、比較される式同士が決定変数を含みうる場合とそうでない場合で用途がかわってくるためです。
- ゼロ次元の高次元配列は、常に単なる数値型と同一視されます。

### 文字列型 `String`

文字列です。任意の文字列を表す `String` の他、特定の文字列リテラルのいずれかの値を取る `Literal["str1", "str2", .., "strn"]` があります。

### 多次元配列型 `Tensor[A; N1, .., Nk]`

ただし、ゼロ次元配列は自動的に要素の型 `A` と同一視されます。

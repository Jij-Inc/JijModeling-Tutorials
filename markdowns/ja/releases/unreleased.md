---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### 機能 1

+++

## バグ修正

+++

### バグ修正 1：デシリアライズした数理モデルでラムダ式の引数や `for` 節のループ変数の名前が失われる問題の修正

`jm.to_protobuf` でシリアライズした数理モデルを `jm.from_protobuf` でデシリアライズすると、ラムダ式の引数や内包表記の `for` 節のループ変数の名前が失われ、`x`、`x1` といった名前に置き換わる問題を修正しました。

例としては、以下のようなケースで名前が置き換わっていました：

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
problem += jm.sum(N, lambda i: x[i])

deserialized = jm.from_protobuf(jm.to_protobuf(problem))
deserialized.objective
```

これまでは、デシリアライズした数理モデルの目的関数は以下のように表示され、ラムダ式の引数 `i` が決定変数と同じ名前の `x` に置き換わっていました：

$$
\sum_{x=0}^{N-1}{x}_{x}
$$

本リリースからは、元の名前 `i` で表示されます。
ただし、以前のリリースでシリアライズしたデータをデシリアライズした場合は、元の名前には戻らず、`x`、`x1` といった名前で表示されます。

この問題の影響は表示に限られ、$\LaTeX$ による数式表示のほか、`print` などによる文字列表示や、エラーメッセージに引用される式に現れていました。

### バグ修正 2：内容が同じ数理モデルどうしを `jm.is_same` が異なると判定することがある問題の修正

内容が同じ二つの数理モデルを `jm.is_same` で比較したとき、目的関数の組み立て方によっては `False` が返ることがある問題を修正しました。

例としては、以下のようなケースで `False` が返っていました：

```{code-cell} ipython3
import jijmodeling as jm

problem_a = jm.Problem("problem")
x = problem_a.BinaryVar("x")
y = problem_a.BinaryVar("y")
problem_a += x
problem_a += y

problem_b = jm.Problem("problem")
x = problem_b.BinaryVar("x")
y = problem_b.BinaryVar("y")
problem_b += x + y

jm.is_same(problem_a, problem_b)
```

上の二つの数理モデルは、目的関数がどちらも `x + y` で、ほかの内容も同じです。
それにもかかわらず、これまでは `jm.is_same` が `False` を返していました。

また、シリアライズした数理モデルをデシリアライズしたものが、元の数理モデルと異なると判定されることもありました。
目的関数を設定していない数理モデルがその一例です：

```{code-cell} ipython3
problem = jm.Problem("problem")
x = problem.BinaryVar("x")
problem += problem.Constraint("constraint", x <= 1)

deserialized = jm.from_protobuf(jm.to_protobuf(problem))
jm.is_same(deserialized, problem)
```

本リリースからは、どちらの比較も `True` を返します。
シェイプを `(y + 1).shape()` のように一つの式で指定した決定変数を含む数理モデルも、デシリアライズすると元の数理モデルと異なると判定されていましたが、本リリースからは同じと判定されます。

また、`jm.is_same` は `description` を比較しないとドキュメントに記載されていますが、数理モデルや制約条件の `description` だけが異なる場合や、数理モデルに含まれるカテゴリーラベルの `description` だけが異なる場合に、`False` が返っていました。
本リリースからは、これらの `description` も比較されません。

### バグ修正 3：ラムダ式の引数やループ変数が決定変数などと同じ名前で表示される問題の修正

ラムダ式の引数や内包表記の `for` 節のループ変数の名前が決定変数やプレースホルダーなどの名前と同じ場合に、両者が同じ名前で表示されて区別できなくなる問題を修正しました。

例としては、以下のようなケースで区別できなくなっていました：

```{code-cell} ipython3
import jijmodeling as jm


def total(v, n):
    return jm.sum(n, lambda x: v[x])


problem = jm.Problem("problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))

total(x, N)
```

上のコードでは、関数 `total` の中のラムダ式の引数と決定変数の名前がどちらも `x` です。
これまでは、この式は以下のように表示され、ラムダ式の引数と決定変数を区別できませんでした：

$$
\sum_{x=0}^{N-1}{x}_{x}
$$

本リリースからは、表示する式や数理モデルに同じ名前の決定変数やプレースホルダーなどが含まれる場合、ラムダ式の引数やループ変数は `x1` のように末尾に番号を付けた名前で表示されます。

この修正は $\LaTeX$ による数式表示のほか、`print` などによる文字列表示や、エラーメッセージに引用される式にも適用されます。

## その他の変更

- 変更 1：

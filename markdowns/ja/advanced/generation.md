---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# インスタンスのランダム生成の使い方

{py:class}`~jijmodeling.Problem` には、 問題のスキーマ（つまり、プレースホルダー）に基づいたインスタンスデータのランダム生成が行えるメソッドがあります。本節では、そのランダム生成における設定などを説明します。

メソッドは２つあり、以下の通りになります。
- {py:meth}`Problem.generate_random_dataset` は、 {py:meth}`Problem.eval` に渡すような辞書としてデータを返します。
- {py:meth}`Problem.generate_random_instance` は、 同じくデータを生成するが、 OMMX インスタンスとして返します。 `generate_random_dataset` で取得した辞書をそのまま {py:meth}`Problem.eval`に渡すのと同じです。

上記メソッドの生成パラメータは同じです： `default` と `options` と `seed` の３つです。一方、 `generate_random_instance` だけは `Problem.eval` に渡すようなパラメータも対応しています。 （`prune_unused_dec_vars`、`constraint_detection`など）

`seed`パラメータは、RNGの初期化に使われるいわゆる乱数シードです。インスタンス生成に再現性を求める場合に使えます。

`default` と `options` は、インスタンスデータの値の範囲を決めるものです。`options` では、辞書で問題の 各{py:class}`~jijmodeing.Placeholder` に対してそれぞれの値の範囲を指定することができます。 `default` は、特定の範囲指定がない値のためのデフォルト範囲となります。

両方とも必須ではありません。 `options`で全プレースホルダーの範囲を指定している場合は`default`を渡す必要がありませんし、 `default`だけでシンプルなデータを生成できる場合もあります。しかし、生成されたインスタンスが実行可能解という保証はないので注意してください。

実際にパラメータの指定方法を見ていきましょう。

## スカラー指定

`default` と `options` は両方とも様々の指定方法を対応としています。例えば
- 固定値となる数値
- Python組み込みの `range`
- {py:mod}`jijmodeling.generation` 配下の関数から取得されたオブジェクト
- タプルや辞書などを使った範囲指定。詳細は API リファレンスを参照してください

固定値が指定された場合、その数値がそのままプレースホルダーの値に使われます（ランダム数は使いません）。 Python の `range` や {py:mod}`jijmodeling.generation` などの範囲が指定された場合、その範囲がランダム生成の境界になります。

指定方法の例を見てみましょう。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("my problem")
x = problem.BinaryVar("x")
A = problem.Natural("A")
B = problem.Natural("B")
problem += A * x + B

problem.generate_random_dataset(default=range(1, 10))
```

上記の例では、 `options`がないため、 `A` と `B`の値の生成時は、 `default`が参照されます。 `range`の区間以内でそれぞれ別の値が生成されます。

今回使った Python 組み込みの `range`は 左閉右開になっています。（つまり、`range(1,4)` の場合、１、２、3が入って、4は入らない）{py:mod}`jijmodeling.generation` では、 開区間の {py:func}`jijmodeling.generation.open` や 左有界（上界が無限大）の {py:func}`jijmodeling.generation.at_least` など、違うスタイルの範囲を定義するための関数を提供しています。 Python 組み込みの `range` は {py:func}`jijmodeling.generation.closed_open` と同じになります。

`generation` には　{py:mod}`jijmodeling.generation.size` と {py:mod}`jijmodeling.generation.value` というサブモジュールがあります。 `generation` の関数は型が動的ですが、 サブモジュールは、 `size` と `value`オプション（下記で説明）で使うという意図で、それぞれ別の型に対する関数があります。 `size` は自然数で、 `value`は浮動小数点数。 提供されている関数の種類は同じで、型以外は変わりません。

生成された値はプレースホルダーの型に則します。つまり、自然数のプレースホルダーがあった場合、`(-10, 10)` など負数を含む範囲を渡しても、生成されるのは自然数のみです。

それでは、`options` 辞書を使って、 `A` と `B` に別々の範囲を指定したい場合をみてみましょう。 プレースホルダーの名前がキー、値が該当プレースホルダーの生成オプションになります。オプションも複数あり得るので生成オプションも辞書なのですが、スカラーの場合 `value` オプションのみが必要です。他のオプションは下記で説明します。

```{code-cell} ipython3
problem.generate_random_dataset(default=range(1, 10), options={"A": {"value": range(50, 100)}})
```

上記では、 `options` を通じて `A` 特定の値範囲を指定しています。 `B` は `options` に入っていないため、以前通り `default` を参照しています。 両プレースホルダーを `options` に入れることも可能です：

```{code-cell} ipython3
problem.generate_random_dataset(options = {"A": {"value": range(50, 100)}, "B": {"value": range(1, 10)}})
```

## 配列プレスホルダー

配列プレスホルダーの値範囲指定は基本的にスカラーと同じです。プレースホルダーの `shape` が完全に定義された場合、 その `shape` に則した配列が生成されます。要素はすべて `value` 範囲以内となります。（`value`指定がない場合、 `default` が参照されます）

```{code-cell} ipython3
problem = jm.Problem("my problem")
# この際、数値の10にしているが、shapeをプレースホルダーにしても問題ありません。
x = jm.BinaryVar("x", shape=10)
A = jm.Natural("A", shape=10)
problem += jm.sum(lambda i: A[i] * x[i])

problem.generate_random_dataset(options={"A": {"value": range(1,10)}})
```

`shape`が完全に定義されていない場合は、配列の要素数を指定する必要があります。そうするにはオプション辞書に `size` というオプションを入れます。 `size` は要素数を決めるものなので自然数でなければなりませんが、 `value` と同様範囲指定を対応しています。つまり、配列の要素数がランダムなインスタンスも生成可能です。

```{code-cell} ipython3
problem = jm.Problem("my problem")
A = problem.Float("A", ndim=1)
N = A.len_at(0)
x = problem.BinaryVar("x", shape=(N,))

problem += jm.sum(N, lambda i: A[i] * x[i])

problem.generate_random_dataset(
    options={
        "A": {"value": range(-10, 10), "size": range(1,10),}
    },
)
```

`shape` が一部未定のプレースホルダーの場合（例えば `shape=(None, 10)` など）、要素数が未定になっている次元はそれぞれ `size` を参照して要素数を決めます。 `shape` の情報が優先されるので、要素数が完全に定義されているプレースホルダーに `size` オプションをつけても意味ありません。

+++

## 辞書型プレースホルダー

カテゴリーラベル型をキーとしている辞書型のプレースホルダーの場合、`options` でそのカテゴリーラベルに該当するキーを定義する必要があります。カテゴリーラベルのオプションに `keys` に文字列の配列を設定すると、キー集合を明示的に定義できます。例えば、カテゴリーラベル `C` のキー集合を X、Y、Zにするとして：

```python
{ "C": {"keys": ["X", "Y", "Z"]} }
```

`C` をキー集合にしている辞書型プレースホルダーは、 `keys` に渡された各文字列に対して値を生成します。範囲指定はスカラーと配列型と同じで、 `default` を渡すか、各プレースホルダーの `options` エントリーで指定ることができます。

生成したいインスタンスにとってキーに実際使われる文字列はなんでもいいという場合、カテゴリーラベルのオプションに `keys` ではなく、 `size` をすることも可能です（固定値も範囲指定も可）。その場合、その数だけの文字列が適当に生成されます。

`PartialDict` 含め、デフォルトで全辞書型プレースホルダーで全域に対して値を生成するということになっています。 `PartialDict` のキーを制限したいときは、そのプレースホルダーのオプションに追加で `keys` か `size` を渡せます。

例えば、 `C` がキー集合になっている `D` プレースホルダー （`PartialDict`） があるとしたら：

```python
{ "C": {"keys": ["X", "Y", "Z"]}, "D": {"keys": ["X", "Y"], "value": range(10, 100)} } }
```

上記はカテゴリーラベルに `keys`を設定している時のみ使える書き方で、プレースホルダーの方の `keys` がキー集合の部分集合になっていないとエラーになるのでご注意ください。

一方、プレースホルダーのオプションに `size` を使うことで、キー集合の中からその数だけ任意に選ばれます。この方法だとカテゴリーラベルがどんなように定義されても構いません。
```python
# either 1 or 2 keys will be picked at random:
{ "C": {"keys": ["X", "Y", "Z"]}, "D": {"size": range(1, 3), "value": range(10, 100)} } } 
# 1, 2, 3, or 4 keys will be picked at random:
{ "C": {"size": range(3, 10)}, "D": {"size": range(1, 5), "value": range(10, 100)} } } 
```

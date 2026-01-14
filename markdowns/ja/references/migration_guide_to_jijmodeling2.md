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

# JijModeling 2 移行ガイド

本稿では、JijModeling 1 で書かれたコードを JijModeling 2 に移行するための情報を提供します。
JijModeling 2 では、数理モデリングに対する核心的な考え方は維持しつつ、利便性の大幅な改善が行われています。

## 主要な変更の概要

利便性・安全性の向上を念頭に、JijModeling 2 では以下のような大規模な変更が行われています：

1. **`Element`ノードの削除**: 旧来の `Element` クラスは廃止され、Python のジェネレータ式や内包表記、またはラムダ式を用いるようになります。これにより、より自然な記法を提供します。

2. **決定変数とプレースホルダーはProblemインスタンスに登録するように**: `jm.BinaryVar()`、`jm.IntegerVar()`などのコンストラクタを直接呼び出すことはできなくなりました。すべての決定変数・プレースホルダーは Problem の名前空間に登録されるようになるため、`problem.BinaryVar()`、`problem.IntegerVar()`、`problem.Placeholder`などのように、`Problem`インスタンスを通じて作成する必要があります。

3. **Decorator API**: JijModeling 2 は **Plain API** と **Decorator API** という二種類の API を提供しています。
   - Plain API は従来の JijModeling 1 に近い記法を提供しています。
   - Decorator API は Plain API 上に構築されており、両者は混在させて利用することができます。
   - Decorator API では、以下の追加機能が利用できます：
       * 和、積やパラメータを用いた制約の族の定義に Python のリスト内包表記やジェネレータ式が利用可能
       * 決定変数・プレースホルダーのシンボル名を省略可能（Python の変数名が自動的に使用される）

4. **`Interpreter` が `Compiler` に変更**: `Interpreter` クラスは `Compiler` にリネームされ、追加のヘルパーメソッドを提供します。

5. **専用の静的型システム**: JijModeling 2 は、*Problemや制約の構築時およびコンパイル中に*式の型検査を行うようになりました。これにより、意味を成さないプログラム（互換性のない数値・インデックス型の混在、無効な配列のインデックスなど）が、実行前に早期に検出されるようになりました。

6. **型付きプレースホルダーコンストラクタ（推奨）**: 汎用的な`problem.Placeholder`よりも、可能な限り特定の型向けのコンストラクタを優先してください。
    - 現在、以下の型に特化されたコンストラクタを提供しています：
      * 自然数：`problem.Natural()`（配列の次元・長さ・添え字などに使うと便利です）
        + 配列の長さや次元を表す場合には、同義の `problem.Length()` や `problem.Dim()` も利用できます。
      * $\{0, 1\}$-値： `problem.Binary()`
      * 整数値：`problem.Integer`
      * 実数値：`problem.Float()`
    - これらの利用により意図がより明確になり、また正確な型チェックによる精度の高いエラーメッセージが得られるようになります。高度なケース（タプルなどのカスタム`dtype`）にのみ`Placeholder`を使用してください。

7. **従属変数の導入**：新たに導入された`problem.DependentVar(..)`宣言により、頻出する部分式を従属変数として束縛・再利用できるようになりました。これにより、従来の JijModeling で`with_latex()`や`latex=...`で定義された$\LaTeX$上の変数の定義がわからなくなる問題が解消されます。

8. **新しいデータ型**: JijModeling 2 では辞書型とカテゴリーラベル型が追加されました！
   - 従来 Jagged Array で書いていた多くのケースが、辞書を使ってより簡潔に記述できるようになりました！
      * Jagged Array はエラーの温床になるため、長期的には辞書型の利用を強く推奨します。
   - カテゴリーラベルは、連続でないまたはゼロ起点でないラベルとして利用できます。

9.  **Python 3.11以降のみのサポート**：型ヒントや詳細なコールスタックなどの現代的な Python の言語機能によるユーザー体験の向上を達成するため、JijModeling 2 では Python 3.11 以降のみをサポートしています。

10. **データセット読み込み機能の廃止**: JijModeling 1.14.0 以降、`jijmodeling.dataset` や `load_qplib` などのデータセット読み込み機能は削除されました。データセットの読み込みには OMMX の該当機能をご利用ください。


**推奨事項**: 新しいコードを書く際には、**Decorator API**と**型付きコンストラクタ**の利用を推奨します。

+++

### 現在のバージョンで欠けているものは？

<div class="alert alert-block alert-info">
<b>注意:</b> このセクションでは、現在のJijModeling 2で利用できない機能を列挙しています。
</div>

JijModeling 1 に存在し、現時点の JijModeling 2 で欠けている機能のは次のとおりです：

1. 複雑な構文木書き換え API
2. ランダムインスタンス生成機能

また、JijModeling 2 正式リリース後に予定されている変更は以下の通りです：

1. 従属変数情報の評価機構・OMMX への保存機能

これらの機能は JijModeling 2 正式リリース後に随時実装されていく予定です。

+++

### おすすめの読み進め方

次節 [例：JijModeling 2での二次TSP](#example-quadratic-tsp-in-jijmodeling-2)では巡回セールスマン問題の例を通じて、JijModeling 2 の雰囲気を簡単に説明します。

その節の後は、以下の二通りの読み進め方ができます：

- JijModeling 2 の設計詳細に立ち入らずに更なる例を見たい場合、詳細の節は飛ばして[例で見るJijModeling 2（Decorator API）](#jijmodeling-2-decorator-api) に飛び、その後必要に応じて中間の節を読むとよいでしょう。
- JijModeling 2 の設計思想や細かな変更点について先に把握したい場合、そのまま[JijModeling2の設計目標](#id1)を読み進めていくとよいでしょう。

+++

(example-quadratic-tsp-in-jijmodeling-2)=
## 例：JijModeling 2での二次TSP

詳細に入る前に、以下では簡単な例を通して変更の雰囲気を概観しましょう。
以下は、JijModeling 2 による巡回セールスマン問題の二次定式化の例です：

```{code-cell} ipython3
import jijmodeling as jm
import numpy as np

# JijModeling 2 with Decorator API
@jm.Problem.define("TSP", sense=jm.ProblemSense.MINIMIZE)
def tsp_problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    d = problem.Float(shape=(N, N), description="距離行列")
    x = problem.BinaryVar(shape=(N,N), description="$x_{i,t}$は時刻$t$にノード$i$が訪問される場合1")

    problem += problem.Constraint(
        "one-city",
        [jm.sum(x[i, t] for i in N) == 1 for t in N],
        description="各時刻にちょうど1つの都市を訪問"
    )
    problem += problem.Constraint(
        "one-time",
        [jm.sum(x[i, t] for t in N) == 1 for i in N],
        description="各都市はちょうど1回訪問される"
    )
    
    problem += jm.sum(
        d[i, j] * x[i, t] * x[j, (t + 1) % N]
        for i in N for j in N for t in N
    )

tsp_problem
```

それでは、ランダムな値を使ってインスタンスを生成してみましょう。

```{code-cell} ipython3
num_cities = 5
np.random.seed(42)
xs = np.random.rand(num_cities)
ys = np.random.rand(num_cities)
XX, XX_T = np.meshgrid(xs, xs)
YY, YY_T = np.meshgrid(ys, ys)
dist = np.sqrt((XX- XX_T)**2 + (YY-YY_T)**2)
instance_data = {"N": num_cities, "d": dist}

instance = tsp_problem.eval(instance_data)
instance.constraints_df
```

```{code-cell} ipython3
instance.objective
```

上記の`problem.eval`は以下の短縮形です：

```{code-cell} ipython3
compiler = jm.Compiler.from_problem(tsp_problem, instance_data)
instance_2 = compiler.eval_problem(tsp_problem)
assert instance.objective.almost_equal(instance_2.objective)
assert all(instance.constraints[i].function.almost_equal(instance_2.constraints[i].function) for i in range(5))
```

残りは[OMMX Adapter](https://jij-inc.github.io/ommx/ja/user_guide/supported_ommx_adapters.html)を介して以前と同様に解くことができます！

+++

(id1)=
## JijModeling 2の設計目標

JijModeling 2 は、以下の点を念頭に設計されています：

- 名前空間の導入：すべてのパラメータ（決定変数、プレースホルダー）は特定の`Problem`に属し、メタデータは式ノード中ではなく Problem に格納されます。
- 畳み込みと変数束縛を Pythonic に：`Element`ノードを標準的なジェネレータ・内包表記、または生のラムダ式で置き換えます。
- ボイラープレートの削減：変数名の省略により、記述の繰り返しを削減します。
- 安全性の強化：専用の静的型システムが、モデルの構築およびコンパイル時に式の構文的な妥当性（数値の種類、比較、配列・タプルの長さ）を検証します。
- 明示的なコンパイル段階：`Compiler`は評価と下流ツール（ID、診断）を一貫させます。
- 複数の API の提供：関数合成を基本に置いた Plain API と、その上に構築されたより簡便な Decorator API の両方を提供します。

## 主要な変更の概要

本節では、JijModeling 2 で行われた重要な変更について個別に議論します。

### JijModeling 1からの概念的変更とその目的

JijModeling 2 では、いくつかの挙動が変更されています：

- 決定変数・プレースホルダーのコンストラクタ（モジュールレベル）→ 個別の `Problem` に紐付いたコンストラクタ（`problem.BinaryVar()` や `problem.Natural()` など）。
- `Element`（インデックス）→ `Set`（値のストリーム）+ イテレータ（`(f(i) for i in N if ...)`）または`lambda`式。
- `jm.sum(Element, expr)` / `forall=`引数 → 内包表記 `jm.sum(expr for i in N if cond)` / 制約コレクション。
- `Interpreter` → `Compiler`（便利な`problem.eval(data)`パスも含む）。
- 辺集合としての二次元配列 → タプル要素を持つプレースホルダー、または`.rows()`ヘルパ関数。

要約すれば以下のようになります：

| カテゴリー | 目的 | 典型的なコンストラクタ | 注記 |
|----------|---------|----------------------|----------|
| Problem  | 名前空間/モデルルート | `jm.Problem(name, sense=...)` | すべてのパラメータと制約の情報を保持 |
| Placeholders | パラメータテンソル（評価時に与えられる） | `problem.Placeholder(...)`、`problem.Natural(...)`、`problem.Float(...)` | `@problem.update`や`@jm.Problem.define`で名前を省略可能。`Natural`等は型付きショートカット。Problemに対し構築する必要がある |
| Decision Vars | 決定変数 | `problem.BinaryVar`、`problem.IntegerVar`、`problem.FloatVar`など | Problemに対し構築する必要がある |
| Expressions | 構文木 | 代数演算子、`jm.sum`、`.sum()`、`.prod()` | JijModeling 2 から数値以外の値も増え、型検査されるように |
| Sets | 反復可能なシンボリックドメイン | プレースホルダー自体（`for i in N`）、`jm.product(A,B)`、`jm.filter(...)` | ラムダ式または内包表記と共に使用、`Element`オブジェクトを代替。 |
| Constraints | 比較式 | `problem.Constraint(name, expr)` または比較式の族 | パラメータ量化された制約の族は、内包表記または `domain` 引数により表現可能。 |
| Compiler | 評価器 | `Compiler.from_problem(problem, data)` | 最適化問題や式を OMMXメッセージに変換するコンパイラ |
| Instance | インスタンス | `problem.eval(instance_data)` | OMMX Instance |

### 関数呼び出しとメソッドスタイル両方の提供

便宜上、式に対するほとんどの関数（`sum`、`prod`、`map`、`log2`など）は、メソッドスタイルとプレフィックススタイルの両方で使用できます。
たとえば、`x.sum()`と`jm.sum(x)`（または`z.log2()`と`jm.log2(z)`）は交換可能です。

### Setとラムダ式・内包表記による Element の代替

JijModeling 1 では、ユーザーは特定の集合に属する`Element`を陽に宣言する必要があり、特に高次テンソルを扱う際にコーディングが複雑になりました。
かわりに、JijModeling 2 は`Element`ノードを削除し、かわりに第一級の値として`Set`（（多重）集合）を導入し、ラムダ式や Python の内包表記構文と組み合わせて範囲を指定する API を提供します。

具体的には、以下を `Set` として扱うことができます：

- 自然数値の式（決定変数を含まない）：自然数$N$（およびそれと同義の `Length` や `Dim`）は集合$\left\{0, \ldots, N-1\right\}$と同一視されます。
- 配列：任意の次元の配列は、各成分を要素に持つ集合として扱うことができます。
  - ⚠️ これは破壊的変更です！以前は、$(N+1)$次元配列は$N$次元配列の集合と見なされていました。この挙動が必要な場合は、まず`jm.rows()`関数を使用して$(N+1)$-次元配列を「$N$-次元配列を要素に持つ一次元配列」に変換してください。
- 集合になりうる型のタプル：`(L, R)`は、集合としての$L$と$R$の直積（$L \times R$）として解釈されます。

これらの式は、`Set` を期待する位置（例：`jm.sum` / `jm.prod`の引数や制約族の定義域）に現れる場合、暗黙的に Set として扱われます。
`jm.set(expr)`を呼び出すことで、式を明示的に Set に変換することもできます。

<div class="alert alert-block alert-warning">
<b>警告:</b> シンボリック式の総和をとる際は、Pythonの組み込み<code>sum</code>関数<b>ではなく</b>、常に<code>jm.sum</code>を使用してください。組み込み<code>sum</code>は（意図的に）JijModeling の処理対象外となっており、コンパイルエラーになるか意図しないオブジェクトを生成します。
</div>

#### 成分ごとの上下限の指定方法

`Element` を介してインデックスをねじ曲げながら決定変数の各成分に上下限を与えていたケースも、JijModeling 2 では `Set` ベースの API と `Problem.*Var` の構築時引数だけで表現できます。上下限は以下の 2 通りで与えられます：

- **同じシェイプの多重配列・辞書を渡す**：決定変数が多重配列である場合（`shape`が指定されている場合）、同じシェイプの多重配列に評価される式を `lower_bound`・`upper_bound` に渡すことで成分ごとの上下界を指定できます。辞書型変数（`dict_keys`が指定されている場合）についても同様で、同じキー集合を持つ（全域な）辞書を渡せば期待通り設定されます。
- **インデックス→値のラムダ式を渡す**：`lambda i, j: L[i, j] - U[j, i]` のように、添字を受け取って境界値を返す関数を指定することもできます。これにより、従来 `Element` を生成して `L[i, j] - U[j, i]` のように書いていたロジックを純粋な Python のラムダで置き換えられます。

以下は、以前 `Element` を使っていたコードを新しい記法へ置き換えた例です：

```python
# Before (JijModeling 1)
L = jm.Placeholder("L", ndim=2)
N = L.len_at(0)
M = L.len_at(1)
U = jm.Placeholder("U", shape=N)
M = L.len_at(1)
i = jm.Element("i", N)
x = jm.IntegerVar(
    "x",
    shape=(N,M),
    lower_bound=lambda i, j: L[i,j],
    upper_bound=lambda i, j: U[i],
)
y = jm.IntegerVar(
    "y",
    shape=(N,),
    lower_bound=-5,
    upper_bound=lambda i: U[(i - 1) % N]
)
```

```python
# After (JijModeling 2)
N = problem.Natural("N")
M = problem.Natural("M")
L = problem.Float("L", shape=(N,M))
U = problem.Float("U", shape=N)
x = problem.IntegerVar(
    "x",
    shape=(N,M),
    lower_bound=L,                  # 同じ形状のテンソルによる指定
    upper_bound=lambda i, j: U[i],  # 添え字からの関数による指定
)
y = problem.IntegerVar(
    "y",
    shape=N,
    lower_bound=-5,         # 定数はそのまま
    upper_bound=U.roll(1),  # rollで配列の要素を左に1シフトしたものを指定
)
```

このように、決定変数の成分ごとの上下界の指定も `Element` を使わない形で指定できるようになりました。

### パラメータ化された制約の族

JijModeling 1 では、ユーザーは`jm.Constraint(name, body, forall=i)`でパラメータ化された制約族を作成できます。
ここで、i は何らかの集合に属する`Element`です。
JijModeling 2 では、**単一の比較式**（1 つの制約）または**比較式のリスト/ジェネレータ**（量化されたコレクション）のいずれかを用いて制約が定義できます：

```python
problem.Constraint("cap", [C[a] <= N for a in A])
```

ジェネレータ式（つまり、`[]`のかわりに`()`）も使用できます：

```python
problem.Constraint("cap", (C[a] <= N for a in A))
```

これらは Decorator API でのみ利用可能です。
何らかの理由で Plain API のみを利用したい場合、ラムダ式と `domain` キーワード引数を使うことができます：

```python
problem.Constraint("cap", lambda a: C[a] <= N, domain=A)
```

これらの内包表記、ジェネレータ式、ラムダ式を用いた 3 つの記法はすべて内部的には同値です。

上述の記法は左右辺に複雑な式が現れるような制約を表現する際に便利ですが、今回のような単純な制約の場合、単一の比較式を使用することもできます：

```python
problem.Constraint("cap", C <= N)
```

`Constraint` コンストラクタに単一の比較式を与える場合、以下のルールに従う必要があります：

- 比較演算子は`==`、`<=`、`>=`のいずれかでなければなりません。
- 比較の左右辺は以下のいずれかでなければなりません：
  - スカラー
  - 配列とスカラー
  - まったく同じ `shape` の配列

### 利用可能なDecorator API

現在、Decorator API には`@problem.update`と`@jm.Problem.define`の 2 種類のデコレータが提供されています。
どちらも DecoratedProblem を引数に取る関数に対し修飾し、関数内では全く同じ Decorator API の記法が利用できます。
利用上の注意点は以下の通りです：

- `@jm.Problem.define(name, ...)` は Decorator API を使って新たな`Problem`オブジェクトを作成するのに使われます。
  - `@jm.Problem.define(..)` は Problem コンストラクタと同じ引数を受け取って`Problem`オブジェクトを新たに生成し、装飾されている関数と同じ名前の変数に束縛します。
- `@problem.update` デコレータは、既に定義済の数理最適化問題 `problem`の内容を Decorator API を使って更新するのに利用されます。
  - 関数は定義と同時に即座に実行されて元の `problem` が更新されるため、ユーザーが関数自体を呼び出す必要はありません。また、装飾される関数の名前は結果に影響しません。
  - `@problem.update` は一つの `problem` に対して複数回適用できます。この場合、各デコレータで定義した制約条件と目的関数はその `problem` に対して逐次的に追加されます。  
- いずれのデコレータでもブロックの関数の返値は無視されます

個々の `@problem.update`/`@jm.Problem.define` ブロックは別々の関数スコープで実行されるため、ある関数内で定義された Python 変数は、別のブロックのものとは共有されません。
例を挙げましょう。

```python
@jm.Problem.define("My Problem")
def my_problem(my_problem: jm.DecoratedProblem):
    N = my_problem.Length()
    x = my_problem.BinaryVar(shape=(N,))

@my_problem.update
def _update(my_problem: jm.DecoratedProblem):
    # ❗️ NとxはスコープOutOfScope！
```

上の例では場合、変数`N`と`x`（Python 変数として）は`_update`でスコープ外です。
もちろん、問題自体には `N` と `x` の情報が登録されているため、`Problem.placeholders`または`Problem.decision_vars` 属性を使用して情報を再度取得することができます：

```python
@my_problem.update
def _update(my_problem: jm.DecoratedProblem):
    N = my_problem.placeholders["N"]
    x = my_problem.decision_vars["x"]

    # ... NとxPlaceholderコード ...
```

これはかなり不便なので、`@problem.update`に簡単な変数アクセスのためのインターフェースを提供する予定です。今後の更新にご期待ください！

### Decorator API での変数名の省略

Decorator API では、Placeholder や決定変数を定義した際に変数名引数を省略場合、自動的に Python 変数名がシンボルの名前として使用されます。
たとえば、`N = problem.Natural()` は以前の `N = problem.Natural("N")` という記法と同値になります。
一方、名前を明確に指定した場合（例：`N = problem.Natural("number_of_items")`）、Decorator API であっても Python 変数名 `N` ではなく、提供された文字列（ここでは`"number_of_items"`）が JijModeling 内部での変数名として使用されます。

### 重要な変更：Problemインスタンス上の決定変数

JijModeling 2 では、モジュールから直接決定変数を作成することは**できません**。

**JijModeling 1（2 では動作しません）:**

```python
# ❌ JijModeling 2では失敗します - モジュールレベルのコンストラクタを呼び出しています！
N = jm.Placeholder(dtype=jm.DataType.NATURAL)
x = jm.BinaryVar("x", shape=(N,))
y = jm.IntegerVar("y", lower_bound=0, upper_bound=10)
```

**JijModeling 2（必須）:**

```python
# ✅ すべての決定変数はProblemインスタンスを通じて作成する必要があります
problem = jm.Problem("MyProblem")
N = problem.Length() # problem.Placeholder(dtype=jm.DataType.NATURAL)の短縮形
x = problem.BinaryVar("x", shape=(N,))
y = problem.IntegerVar("y", lower_bound=0, upper_bound=10)
```

この変更により、適切な名前空間の管理が保証されるようになります。
プレースホルダーと決定変数のメタデータは、`Problem.placeholders` と `Problem.decision_vars` を介してアクセスできます。

### 例外の変更

JijModeling 2 の例外機構は 1 とほぼ同じですが、適切な場合は Python 標準の例外を投げる場合もあります。

JijModeling 1 と 2 の例外の比較表は次のとおりです：

| JijModeling 2（新） | JijModeling 1（レガシー） | 注記 |
|--------------|-----------|------------------|
| `jm.ModelingError` | `jm.ModelingError` | モデル定式化での無効な式によって発生する例外。 |
| `jm.CompileError` | `jm.InterpreterError` | 評価中にスローされる例外 |
| `jm.TypeError` | N/A | 無効な型を持つ式でスローされる例外。注意：Pythonの組み込み`TypeError`とは異なります。 |


### データセット読み込み機能の廃止

JijModeling 1.14.0 以降、データセット読み込み機能は JijModeling から削除されました。
データセット読み込みには OMMX の該当する機能をご利用ください。

OMMX への移行方法については、以下の OMMX 公式ドキュメントをご参照ください：

- [MIPLIBインスタンスのダウンロード](https://jij-inc.github.io/ommx/ja/tutorial/download_miplib_instance.html)
- [QPLIBインスタンスのダウンロード](https://jij-inc.github.io/ommx/ja/tutorial/download_qplib_instance.html)

(jijmodeling-2-decorator-api)=
## 例で見るJijModeling 2（Decorator API）

本節では、JijModeling 2 で導入された変更の雰囲気をつかむため、さまざまなパターンの JijModeling 2 と JijModeling 1 の解法を比較していきます。

### 基本パターン

#### パターン1：単純な合計

**JijModeling 1:**

```python
import jijmodeling as jm

N = jm.Placeholder("N") # ❌ - プレースホルダーは直接構築不可！dtypeの指定が必須！
x = jm.BinaryVar("x", shape=(N,)) # ❌ - 決定変数も同様
i = jm.Element("i", belong_to=(0, N)) # ❌ - `Element` ノードは廃止済！
objective = jm.sum(i, x[i]) # ❌ 同上！
```

**JijModeling 2（Decorator API）:**

```{code-cell} ipython3
# ✅ まずProblemを作成
@jm.Problem.define("SimpleSum", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    # ✅ プレースホルダーは既に作成された`problem`インスタンスを介して構築する。
    # ここで、変数名`N`はDecorator APIのおかげで省略可能。
    N = problem.Length()
    # または：
    # N = problem.Natural()
    # もしくは：
    # N = problem.Placeholder(dtype=jm.DataType.NATURAL)

    # 決定変数も同様。
    # もちろん、Decorator APIでも変数名を明示的に指定可能。
    x = problem.BinaryVar("x", shape=(N,))
    
    # 内包表記構文による明快な記法
    objective = jm.sum(x[i] for i in N)
    # または：
    # objective = x.sum()  # または jm.sum(x)
    problem += objective

problem
```

#### パターン2：係数付き加重和

**JijModeling 1:**

```python
N = jm.Placeholder("N")             # ❌ プレースホルダーの直接構築
a = jm.Placeholder("a", ndim=1)     # ❌ プレースホルダーの直接構築
x = jm.BinaryVar("x", shape=(N,))   # ❌ 決定変数の直接構築
i = jm.Element("i", belong_to=(N,)) # ❌ Elementノードは廃止
objective = jm.sum(i, a[i] * x[i])
```

**JijModeling 2（Decorator API）:**

```{code-cell} ipython3
# 先に Problem を作成してから、 @problem.update をしてもよい
problem = jm.Problem("WeightedSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    # ✅ プレースホルダーは`problem`を介して構築。型も明示。
    N = problem.Length()
    a = problem.Float(shape=(N,))
    x = problem.BinaryVar(shape=(N,))

    objective = jm.sum(a[i] * x[i] for i in N)
    # 代替（要素ごとの積）：
    # objective = jm.sum(a * x)
    problem += objective

problem
```

#### パターン3：添え字集合に沿った合計

**JijModeling 1:**

```python
N = jm.Placeholder("N")           # ❌ プレースホルダーの直接構築
C = jm.Placeholder("C", ndim=1)   # ❌ プレースホルダーの直接構築
x = jm.BinaryVar("x", shape=(N,)) # ❌ 決定変数の直接構築
i = jm.Element("i", belong_to=C)  # ❌ Elementは廃止
objective = jm.sum(i, x[i])
```

**JijModeling 2（Decorator API）:**

```{code-cell} ipython3
@jm.Problem.define("SumAlongSet", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    N = problem.Length()
    C = problem.Natural(shape=(N,))  # 添え字集合のdtypeを明示
    x = problem.BinaryVar(shape=(N,))
    
    # インデックスセット上の合計。
    objective = jm.sum(x[i] for i in C)
    # またはPlain APIスタイル：
    # jm.sum(C.map(lambda i: x[i]))
    problem += objective

problem
```

#### パターン4：タプルを使用した辺集合

**JijModeling 1:**

```python
V = jm.Placeholder("V") # ❌ プレースホルダーの直接構築
E = jm.Placeholder("E", ndim=2) # ❌ プレースホルダーの直接構築
x = jm.BinaryVar("x", shape=(V,))  # ❌ 決定変数の直接構築
e = jm.Element("e", belong_to=E) # ❌ Elementは廃止
objective = jm.sum(e, x[e[0]] * x[e[1]]) # ❌ Elementは廃止
```

**JijModeling 2（Decorator API）:**

JijModeling 2 では複数の解法があります。
1 つめは、`E` にタプルの 1 次元配列を使用することです：

```{code-cell} ipython3
from typing import Tuple

problem = jm.Problem("EdgeSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    V = problem.Natural() # 頂点数
    # 方法1：よりクリーンなエッジ表現のためにタプル型を使用。
    E = problem.Graph()
    # または：
    # E = problem.Placeholder(dtype=Tuple[np.uint, np.uint], ndim=1)
    # デフォルトで Graph の自然数は自然数値だが、 vertex キーワード引数により指定もできる。
    # E = problem.Graph(vertex=jm.DataType.FLOAT) # 浮動小数点数値の頂点を持つグラフ
    x = problem.BinaryVar(shape=(V,))
    
    # 内包表記でのタプルアンパック。
    objective = jm.sum(x[i] * x[j] for (i, j) in E)
    problem += objective

problem
```

もう一つは、`E`を$(N \times 2)$-次元配列として定式化し、`rows()`関数呼ぶ方法です：

```{code-cell} ipython3
# .rows()を使用した代替方法
@jm.Problem.define("EdgeSumRows", sense=jm.ProblemSense.MINIMIZE)
def problem2(problem: jm.DecoratedProblem):
    V = problem.Placeholder(dtype=np.uint)
    N = problem.Length()
    E = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(N, 2))
    x = problem.BinaryVar(shape=(V,))
    
    # 2Dエッジ表現のための.rows()の使用。
    objective = jm.sum(x[l] * x[r] for (l, r) in E.rows())
    problem += objective

problem2
```

#### パターン5：条件付き合計

**JijModeling 1:**

```python
N = jm.Placeholder("N")
J = jm.Placeholder("J", ndim=2)
x = jm.BinaryVar("x", shape=(N,))
i = jm.Element("i", belong_to=(0, N))
j = jm.Element("j", belong_to=(0, N))

# ❌ sum 左辺の条件式は廃止
objective = jm.sum([i, (j, i > j)], J[i,j] * x[i] * x[j])
```

**JijModeling 2（Decorator API）:**

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    J = problem.Placeholder(dtype=jm.DataType.FLOAT, shape=(N, N))
    x = problem.BinaryVar(shape=(N,))

    # ✅ 条件付きの自然な反復 - はるかに読みやすい！
    objective = jm.sum(J[i, j] * x[i] * x[j] for i in N for j in N if i > j)
    problem += objective

problem
```

この例では、自然数式`i`が集合`0..i-1`と同一視されることも利用できます：

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    J = problem.Placeholder(dtype=jm.DataType.FLOAT, shape=(N, N))
    x = problem.BinaryVar(shape=(N,))

    # ✅ 条件付きの自然な反復 - はるかに読みやすい！
    objective = jm.sum(J[i, j] * x[i] * x[j] for i in N for j in i)
    problem += objective

problem
```

#### パターン6：辞書とカテゴリーラベルによる疎データの表現

```{code-cell} ipython3
problem = jm.Problem("QuadraticKnapsackLogistics", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    # 荷物とトラックのラベルを表す不透明な「カテゴリラベル」を定義
    # これらは整数または文字列の集合として扱われます
    I = problem.CategoryLabel("I", description="荷物のラベル")
    J = problem.CategoryLabel(description="トラックのラベル")

    # デフォルトではコンパイラは、そのドメインのすべてのキーに対して値が定義されていることを期待します
    weights = problem.Integer(
        "w", dict_keys=I, description="各荷物の重さ"
    )
    base_revenues = problem.Integer(
        "r", dict_keys=I, description="各荷物の基本利益"
    )
    capacities = problem.Integer(
        "C", dict_keys=J, description="各トラックの荷重容量"
    )

    # `partial_dict=True`を設定すると、辞書をキーのサブセット上でのみ定義できるようになります
    # ここで`s`は実際にシナジーボーナスがある荷物のペアに対してのみ定義されます
    synergy_bonuses = problem.Integer(
        "s",
        dict_keys=(I, I),
        partial_dict=True,
        description="荷物のペア間のシナジーボーナス",
    )

    # または、構文糖衣を使用：
    # synergy_bonus = problem.PartialDict(
    #     "s",
    #     dtype=int,
    #     keys=(I, I),
    #     description="荷物のペア間のシナジーボーナス",
    # )

    # --- 4. 決定変数 ---
    # 決定変数の数はプレースホルダーから静的に決定される必要があるため、
    # 決定変数の辞書は全キードメイン（全域）で定義される必要があります
    x = problem.BinaryVar(
        dict_keys=(I, J),
        description="荷物iをトラックjに割り当てる場合x[i,j] = 1、そうでない場合0",
    )

    # --- 5. 目的関数 ---
    problem += jm.sum(
        synergy_bonuses[i, k] * x[i, j] * x[k, j]
        for j in J
        # keys()でキーを、
        # items()でキー値ペアを、
        # values()で値をイテレートできます
        for (i, k) in synergy_bonuses.keys()
    ) + jm.sum(base_revenues[i] * x[i, j] for i in I for j in J)

    # --- 6. 制約 ---
    problem += problem.Constraint(
        "parcel_assign", [jm.sum(x[i, j] for j in J) == 1 for i in I]
    )
    problem += problem.Constraint(
        "truck_capacity",
        [jm.sum(weights[i] * x[i, j] for i in I) <= capacities[j] for j in J],
    )

problem
```

```{code-cell} ipython3
synergies_data = {
    (1, 3): 25,
    (2, 5): 30,
    (2, 6): 20,
    (4, 8): 40,
    (5, 7): 22,
}
percels_data = [1, 2, 3, 4, 5, 6, 7, 8]
trucks_data = ["Truck A", "Truck B", "Truck C"]
r_data = {1: 50, 2: 75, 3: 40, 4: 80, 5: 60, 6: 65, 7: 35, 8: 90}
weight_data = {1: 35, 2: 45, 3: 25, 4: 50, 5: 30, 6: 40, 7: 20, 8: 55}
capacity_data = {"Truck A": 100, "Truck B": 120, "Truck C": 80}
data = {
    "I": percels_data,
    "J": trucks_data,
    "w": weight_data,
    "r": r_data,
    "C": capacity_data,
    "s": synergies_data,
}
compiler = jm.Compiler.from_problem(problem, data)
instance = compiler.eval_problem(problem)
```

### 制約記述のパターン

制約の族についても、上記と同様の内包表記などが利用できます：

#### One-hot制約

**JijModeling 1:**

```python
N = jm.Length("N")
x = jm.BinaryVar("x", shape=(N,))
i = jm.Element("i", belong_to=(0, N))
constraint = jm.Constraint("onehot", jm.sum(i, x[i]) == 1)
```

**JijModeling 2（Decorator API）:**

```{code-cell} ipython3
problem = jm.Problem("OneHot", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    x = problem.BinaryVar(shape=(N,))

    # クリーンな制約構文。
    problem += problem.Constraint("onehot", jm.sum(x) == 1)

problem
```

#### セット上のK-hot制約

**JijModeling 1:**

```python
K = jm.Placeholder("K", ndim=1)
C = jm.Placeholder("C", ndim=2)
x = jm.BinaryVar("x", shape=(N,))
a = jm.Element("a", belong_to=(0, M))
i = jm.Element("i", belong_to=C[a])
constraint = jm.Constraint("k-hot", jm.sum(i, x[i]) == K[a], forall=a)
```

**JijModeling 2（Decorator API）:**

```{code-cell} ipython3
problem = jm.Problem("KHotOverSet", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Length()
    C = problem.Natural(jagged=True, ndim=2)
    M = problem.DependentVar(C.len_at(0))
    K = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(M,))
    x = problem.BinaryVar(shape=(N,))
    
    # セット上の制約のためのジェネレータ式。
    constraint = problem.Constraint(
        "k-hot_constraint", 
        [jm.sum(x[i] for i in C[a]) == K[a] for a in M]
    )
    problem += constraint

problem
```

または、同値な書き換えとして：

```python
    constraint = problem.Constraint(
        "k-hot_constraint", 
    lambda a: jm.sum(x[i] for i in C[a]) == K[a],
        domain=M,
    )
```

### コンパイラの移行

JijModeling 2 では、`Interpreter`クラスが`Compiler`に置き換えられ、追加のユーティリティメソッドを提供しています。

**JijModeling 1:**

```python
# JijModeling 1パターン
interp = jm.Interpreter(problem)
instance = interp.eval_problem(data)
```

**JijModeling 2:**

```{code-cell} ipython3
# デモンストレーション用の簡単な問題を作成
problem = jm.Problem("CompilerDemo", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    v = problem.Placeholder(dtype=jm.DataType.FLOAT, ndim=1)
    w = problem.Placeholder(dtype=jm.DataType.FLOAT, ndim=1)
    N = problem.DependentVar(v.len_at(0))
    W = problem.Float()
    x = problem.BinaryVar(shape=(N,))

    problem += (v * x).sum()  # 目的関数
    problem += problem.Constraint("weight", (w * x).sum() <= W)

display(problem)

# サンプルデータ
instance_data = {
    "v": [10, 13, 18, 31, 7, 15],
    "w": [11, 15, 20, 35, 10, 33], 
    "W": 47
}

# 方法1：直接評価（シンプル）
instance = problem.eval(instance_data)

# 方法2：コンパイラを使用（より多くの制御）
compiler = jm.Compiler.from_problem(problem, instance_data)
instance2 = compiler.eval_problem(problem)

print("両方の方法は同等の結果を生成します：", 
      instance2.objective.almost_equal(instance.objective))

# コンパイラは追加のユーティリティメソッドを提供します
constraint_ids = compiler.get_constraint_id_by_name("weight")
print(f"weightの制約ID：{constraint_ids}")
```

## 移行チェックリスト

JijModeling 1 から 2 へコードを移行するには、以下の段階的なチェックリストに従ってください：

### ステップ0：Python 3.11以降への移行

- ✅ `pyproject.toml` や `.python-version` ファイルなどを修正したり、新しいバージョンの Python 処理系をインストールするなどして、Python 3.11 移行が使用されるようにしてください。

### ステップ1：インポートとProblem作成の更新

- ✅ import 文は従来通り：`import jijmodeling as jm`
- ✅ まず問題を作成：`problem = jm.Problem(name, sense)`
- ✅ モデル定義関数に`@problem.update`（または Problem を新規生成する場合は`@jm.Problem.define`）デコレータを追加

### ステップ2：**重要** - 直接変数/プレースホルダー作成の置き換え

すべての直接モジュールレベルのコンストラクタを Problem に紐づいたものに置き換えます：

- 決定変数：
    - 例 ❌ `x = jm.BinaryVar("x", shape=(N,))` → ✅ `x = problem.BinaryVar("x", shape=(N,))`
- プレースホルダー（型付きを優先）：
    - ❌ `N = jm.Placeholder("N", dtype=jm.DataType.NATURAL)` → ✅ `N = problem.Natural("N")` または `N = problem.Length()`
    - ❌ `a = jm.Placeholder("a", ndim=1)` → ✅ `a = problem.Float("a", shape=(N,))`（必要に応じてシェイプを指定）
    - Decorator API では、変数名を省略することもできます。

### ステップ3：Element使用の置き換え

- ❌ **定義の削除**: `i = jm.Element("i", belong_to=(0, N))`
- ❌ **定義の置き換え**: `jm.sum(i, expression)`
  - ✅ **内包表記**: `jm.sum(expression for i in N)`、または
  - ✅ **二項形式**: `jm.sum(N, lambda i: expression)`

### ステップ4：型付きプレースホルダーコンストラクタを優先

- ❌ **汎用（避ける）**: `N = problem.Placeholder(dtype=jm.DataType.NATURAL)` / `a = problem.Placeholder(ndim=1)`
- ✅ **優先（推奨）**: `N = problem.Length()` / `a = problem.Float(ndim=1)` / `W = problem.Float()` / `K = problem.Integer()` / `G = problem.Graph()`
- ▶︎ `Placeholder`は明示的な`dtype`引数と共にのみ使用してください。

### ステップ5：制約構文の更新

- ❌ **以下のいずれかで置き換え**: `jm.Constraint("name", expression, forall=element)`
  - `problem.Constraint("name", (expression for element in domain))`
  - `problem.Constraint("name", [expression for element in domain])`
  - `problem.Constraint("name", lambda element: expression, domain=domain)`。
- ジェネレータ式（`(exp for i in t)`）とリスト内包表記（`[exp for i in t]`）は同値なため、どちらか好きな方を選ぶ

### ステップ6：InterpreterをCompilerに置き換え

- ❌ **置き換え**: `interp = jm.Interpreter(data)`
  - ✅ **コンパイラで置き換え**: `compiler = jm.Compiler.from_problem(problem, data)`
  - ✅ **または直接コンパイル**: `instance = problem.eval(data)`

### ステップ7：テストと検証

- ✅ 問題がエラーなくコンパイルされることを確認（型システムのエラーを参考にしてください）
- ✅ サンプルデータでテストして正しい動作を確保
- ✅ 利用可能な場合は JijModeling 1 実装と結果を比較

## 一般的な落とし穴と解決策

### 落とし穴1：直接変数作成の使用（最も一般的なエラー！）

```python
# ❌ NG - AttributeErrorで失敗
x = jm.BinaryVar("x", shape=(N,))
y = jm.IntegerVar("y", lower_bound=0, upper_bound=10)

# ✅ OK - Problemインスタンスを通じて作成
problem = jm.Problem("MyProblem")
x = problem.BinaryVar("x", shape=(N,))
y = problem.IntegerVar("y", lower_bound=0, upper_bound=10)
```

### 落とし穴2：型付きコンストラクタを使用しない

```python
# ❌ 汎用プレースホルダーはデフォルトでFloatになり、予期しない型付けにつながる可能性あり
a = problem.Placeholder(ndim=1)
# ✅ 型付きコンストラクタにより意図が明確になり、型検査器にもより精度の高い情報が提供できる
a = problem.Float(ndim=1)
```

通常、自然数の汎用`Placeholder`に`dtype`を指定しなかった場合にエラーが発生します。
一般的な間違いのパターン：

```python
N = problem.Placeholder("N")            # ❗️ Nは暗黙裡に浮動小数点数値として扱われる
x = problem.BinaryVar("x", shape=(N,))  # ❌ しかし shape は自然数のタプルを要求！
```

これにより、次のエラーが発生します：

~~~text
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
jijmodeling.TypeError: Traceback (most recent last):
    while checking if expression `N' has type `natural',
        defined at File "<stdin>", line 1, col 5-38

Type Error: Could not match actual type `float' with expected `natural'
~~~

総称的な `Placeholder` のかわりに、`N = problem.Length("N")` を使用することで、このエラーは回避できます。

### 落とし穴3：デコレータを忘れる

```python
# ❌ NG - デコレータがない！
def define_model(problem: jm.DecoratedProblem):
    N = problem.Length()

# ✅ OK
@problem.update
def define_model(problem: jm.DecoratedProblem):
    N = problem.Length()
```

### 落とし穴4：不正な内包表記構文

```python
# ❌ NG - 廃止されたElement構文の仕様
i = jm.Element("i", belong_to=N)
jm.sum((i,), x[i])

# ✅ OK
jm.sum(x[i] for i in N)
```

### 落とし穴5：デコレータの欠落または間違った`sum`による`'... object is not iterable'`

Decorator API で内包表記を使っていると、次のようなエラーが表示される場合があります：

```bash
TypeError: 'jijmodeling.Placeholder' object is not iterable
```

多くの場合、こうした例外次の場合に発生します：

1. デコレータ（例：`@problem.update`や`@jm.Problem.define`）が**指定されていない**文脈で、内包表記（例：`jm.sum(x[i] for i in N)`または`problem.Constraint("MyConstraint", [x[i] <= w[i] * v[i - 1] for i in N])`）が使用されている
2. `jm.sum`のかわりに Python の組み込み`sum`を呼び出している。

### 落とし穴6：Pythonの組み込み`sum`の使用

```python
# ❌ NG
sum(a[i] * x[i] for i in N)

# ✅ OK
jm.sum(a[i] * x[i] for i in N)
```

常に`jm.sum`（またはメソッド形式`expr.sum()`）を使用してください。
Python の組み込み関数`sum`は具体的な反復可能オブジェクトを期待するため、`TypeError`が発生するか意図しない中間オブジェクトを生成します。

## 移行パターン早見表

移行に際して頻出する書き換えパターンの早見表です。

| パターン名 | 旧記法（JM1） | 置き換え（JM2） |
|--------------|-----------|------------------|
| 変数作成 | `jm.BinaryVar("x", shape=...)` | `problem.BinaryVar("x", shape=...)` |
| 範囲のElement | `i = jm.Element("i", belong_to=(0,N))` | ジェネレータ・内包表記での`for i in N` |
| 合計 | `jm.sum(i, expr)` | `jm.sum(expr for i in Domain)`または`x.sum()` |
| 条件付きドメイン | `jm.sum([i,(j,cond)], expr)` | `jm.sum(expr for i in A for j in B if cond)` |
| 量化制約 | `jm.Constraint(name, body, forall=a)` | `problem.Constraint(name, [body_for_a for a in A])` |
| インタープリタ | `jm.Interpreter(problem)` | `jm.Compiler.from_problem(problem, data)`または`problem.eval(data)` |

## ベストプラクティス

1. **常にProblemインスタンスを通じて変数を作成** – JijModeling 2 では必須
2. **型付きプレースホルダーコンストラクタ（`Natural`、`Float`、`Integer`、…）を使用** – 可読性と診断を改善
3. **複雑な場合のみ汎用`Placeholder`を仕様** – タプルなどの複雑な`dtype`のみ。
   - 長さや次元を表す場合は、同義の`Length`や`Dim`といった特化コンストラクタを活用できます。
4. **Decorator APIを優先** – よりクリーンで保守しやすい
5. **名前の省略を活用** – 可能な場合はシステムに変数名を推論させる
6. **条件付き内包表記を使用** – Python 的な構文により可読性・保守性が向上
7. **グラフの辺集合にタプル型を使用** – プログラムおよび数式出力の可読性が向上
   - `Problem.Graph` というスマートコンストラクタも利用できます。
8. **単純なケースには`problem.eval()`を使用** – イントロスペクションまたは高度なワークフローには`Compiler`を使用
9. **Jagged Arrayのかわりに辞書型を利用**：Jagged Array エラーの温床になるため、可能な限り辞書型の利用を推奨します。

## まとめ

JijModeling 2 では、期待される数学的モデリング力を維持しながら、利便性の大幅な向上が図られています。
移行の主な利点は次のとおりです：

- 複雑な数理モデルを**内包表記などPythonにより近い構文で表現可能**
- デコレータと名前の省略による**ボイラープレートの削減**
- 静的型システムと型付きコンストラクタによる**早期エラー検出**
- Problem に紐付けられた**より良い名前空間管理**
- 新しいコンパイラアーキテクチャによる**追加のヘルパーメソッド**

最も重大な変更は、Element の廃止と、すべてのパラメータが Problem インスタンスを通じて作成される必要があることです。
本ガイドのチェックリストに従って、Decorator API と型付きコンストラクタと組み合わせることで、既存のコードを JijModeling 2 へ効果的に移行できるでしょう。

+++

## 付録：上級 - Plain APIの理解

Plain API はラムダ式を使用することで古い`Element` を廃止したものですが、Decorator API は Plain API の糖衣構文として実装されています。
Plain API を理解することは、より多くの制御が必要な場合やデバッグ時に役立ちます。

より正確には、Decorator API を使用して書かれたプログラムは、内部で Plain API のみを使用する同等のプログラムに*変換*（または*脱糖*）されます。
したがって、Decorator API と Plain API はまったく同じ表現力を持っていますが、Decorator API はより読みやすく、慣用的な Python 構文を生成します。

Decorator API から Plain API への変換は、おおよそ次のように行われます：

- 名前なしで決定変数またはプレースホルダーを単一の変数に直接バインドする場合、Python 変数名を変数名として渡します。
- リストまたはジェネレータ内包表記が次のいずれかの位置に現れる場合、`jm.flat_map`、`jm.map`、および`jm.filter`を使って書き直す：
  - `jm.sum`または`jm.prod`（組み込み Python`sum`関数ではない）の唯一の引数、または
  - `domain`キーワード引数なしの`problem.Constraint`の 2 番目の引数。ここで`problem`はデコレートされた関数の最初の`DecoratedProblem`引数です。

### ラムダ式パターン

Decorator API と Plain API 間の脱糖結果の例を次に示します。

**Decorator API:**

```{code-cell} ipython3
@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    N = problem.Length() # problem.Natural() と同義だが意図がより明確
    x = problem.BinaryVar(shape=(N,N))
    problem += jm.sum(x[i, j] for i in N if i % 2 == 0 for j in i)

problem
```

**Plain API相当:**

```{code-cell} ipython3
problem = jm.Problem("My Problem")

N = problem.Length("N")
x = problem.BinaryVar("x", shape=(N,N))
problem += jm.sum(
    N.filter(lambda i: i % 2 == 0).flat_map(lambda i: i.map(lambda j: x[i,j]))
    )

problem
```

### Plain API と Decorator API の使い分け

**Decorator APIを使用する場合:**

- 新しいコードを書く（推奨デフォルト）
- クリーンで読みやすい Python のような構文が欲しい
- 内包表記と条件を使用する

**Plain APIを使用する場合:** 一般的に、使用する必要はありません。Decorator API でバグに遭遇した場合は、Plain API を使用できます。

---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# Cheat Sheet (JijModeling 2 beta)

## 現状

```{code-cell} ipython3
import jijmodeling as jm
import ommx.v1
import numpy as np
from typing import Tuple
```

## 総和

### 決定変数の総和

```{code-cell} ipython3
ns = jm.Problem('basic-sum')
problem = jm.Problem("BasicSum", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))

# Basic sum
objective = x.sum()
objective
```

### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("BasicSum", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    x = problem.BinaryVar("x", shape=(N,))
    # Basic sum
    objective = x.sum()
    problem += objective

problem
```

### 係数付き決定変数の総和

```{code-cell} ipython3
problem = jm.Problem("WeightedSum", sense=jm.ProblemSense.MINIMIZE)
a = problem.Float("a", ndim=1)
N = problem.DependentVar("N", a.len_at(0))
x = problem.BinaryVar("x", shape=(N,))

# Weighted sum
objective = jm.sum(a * x)
objective
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("WeightedSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    a = problem.Placeholder(dtype=jm.DataType.FLOAT, ndim=1)
    N = problem.DependentVar(a.len_at(0))
    x = problem.BinaryVar(shape=(N,))

    # Weighted sum
    objective = (a * x).sum()
    problem += objective

problem
```

### 添字集合に沿った決定変数の総和

```{code-cell} ipython3
problem = jm.Problem("SumAlongSet", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
# You can use numpy dtypes as well (bit sizes and endianness are ignored)
C = problem.Natural("C", ndim=1)
# or, equivalently:
# C = problem.Placeholder("C", ndim=1, dtype=np.dtype("u8"))
jm.sum(jm.map(lambda i: x[i], C))
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("SumAlongSet", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    x = problem.BinaryVar(shape=(N,))
    C = problem.Placeholder(ndim=1, dtype=np.uint64)
    
    problem += jm.sum(x[i] for i in C)

problem
```

### 辺集合に沿った決定変数の総和
#### Tuple を要素にもつテンソルの例（推奨）


JijModeling 2 ではタプルを要素にもつ Placeholder をサポートしているため、辺集合としてのグラフはタプルを要素にもつ一次元配列として表現できる。
このパターンは頻出と思われるため、 `problem.Graph()` というスマートコンストラクタが用意されている：：

```{code-cell} ipython3
problem = jm.Problem("SumAlongEdgeSet", sense=jm.ProblemSense.MINIMIZE)
V = problem.Natural("V")

E = problem.Graph("E")
# 以下の略記法：
# E = problem.Placeholder("E", dtype=Tuple[jm.DataType.NATURAL, jm.DataType.NATURAL], ndim=1)
x = problem.BinaryVar("x", shape=(V,))
jm.map(lambda i, j: x[i] * x[j], E).sum()
```

デフォルトでは `Graph` は自然数を頂点に持つものとして宣言されますが、`vertex` キーワード引数により型を変更できます：`Graph(vertex=jm.DataType.FLOAT)`。

+++

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("SumAlongEdgeSet", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    V = problem.Placeholder(dtype=jm.DataType.NATURAL)
    E = problem.Graph()
    x = problem.BinaryVar(shape=(V,))
    
    problem += jm.sum(x[i] * x[j] for (i, j) in E)

problem
```

#### 辺集合別解 1：rows を使った例


`rows()` を使うと側の軸に沿って二重のテンソルとなり、直接 sum を取れる：

```{code-cell} ipython3
problem = jm.Problem("SumAlongEdgeSet", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
V = problem.Natural("V")
E = problem.Natural("E", shape=(N, 2))
x = problem.BinaryVar("x", shape=(V,))
jm.map(lambda i, j: x[i] * x[j], E.rows()).sum()
```

##### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("SumAlongEdgeSet", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    V = problem.Placeholder(dtype=np.uint)
    N = problem.Natural()
    # 本当は dtype=V と書けるようにしたい
    E = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(N, 2))
    x = problem.BinaryVar(shape=(V,))
    problem += jm.sum(x[l] * x[r] for (l, r) in E.rows())

problem
```

#### 辺集合別解 2：ナイーヴなイテレーション

V の長さについてイテレートする。

```{code-cell} ipython3
problem = jm.Problem("SumAlongEdgeSet1", sense=jm.ProblemSense.MINIMIZE)
V = problem.Placeholder("V", dtype=np.uint) # jm.Natural("V") と同値
N = problem.Natural("N")
E = problem.Natural("E", shape=(N, 2))
x = problem.BinaryVar("x", shape=(V,))
jm.sum(jm.map(lambda i: x[E[i, 0]] * x[E[i, 1]], N))

# 将来的に次のようにも書けるかもしれない：
# jm.sum(x[E[:, 0]]  + x[E[:, 1]])
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("SumAlongEdgeSet1", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    V = problem.Placeholder(dtype=np.uint)
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    E = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(N, 2))
    x = problem.BinaryVar(shape=(V,))
    
    problem += jm.sum(x[E[i, 0]] * x[E[i, 1]] for i in N)

problem
```

### 条件付きの総和

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
J = problem.Float("J", shape=(N, N))
x = problem.BinaryVar("x", shape=(N,))
# This shoule be
jm.map(
    lambda i: jm.map(lambda j: J[i, j] * x[i] * x[j], i).sum(),
    N
).sum()
```

あるいは、 `flat_map` 演算子を使って以下のようにも書ける：

```{code-cell} ipython3
jm.flat_map(
    lambda i: i.map(lambda j: J[i, j] * x[i] * x[j]),
    N
).sum()
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    J = problem.Placeholder(dtype=jm.DataType.FLOAT, shape=(N, N))
    x = problem.BinaryVar(shape=(N,))
    
    # Conditional sum with index filtering
    objective = jm.sum(J[i, j] * x[i] * x[j] for i in N for j in i)
    problem += objective

problem
```

### 行列の対角要素を除く総和

```{code-cell} ipython3
problem = jm.Problem("NonDiagonalSum", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
J = problem.Float("J", shape=(N, N))
jm.map(
    lambda i: jm.filter(lambda j: i != j, N).map(lambda j: J[i, j]).sum(),
    N
).sum()
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("NonDiagonalSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    J = problem.Placeholder(dtype=jm.DataType.FLOAT, shape=(N, N))
    
    objective = jm.sum(J[i, j] for i in N for j in N if i != j)
    problem += objective

problem
```

`flat_map` を使った例：

```{code-cell} ipython3
problem = jm.Problem("NonDiagonalSum", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
J = problem.Float("J", shape=(N, N))
jm.flat_map(
    lambda i: jm.filter(lambda j: i != j, N).map(lambda j: J[i, j]),
    N
).sum()
```

### 別のインデックスに依存した総和

```{code-cell} ipython3
problem = jm.Problem("DependentSum", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
a = problem.Natural("a", ndim=1)
# 今回は M を従属変数として定義する。
# 任意の式を DependentVar として束縛でき、変数名で表示される。
# problem を print すると、M の定義も確認できる。
M = problem.DependentVar("M", a.len_at(0))
jm.sum(jm.flat_map(lambda i: a[i].map(lambda j: x[j]), M))
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("DependentSum", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    x = problem.BinaryVar(shape=(N,))
    a = problem.Placeholder(ndim=1, dtype=jm.DataType.NATURAL)
    M = problem.DependentVar(a.len_at(0))

    objective = jm.sum(x[j] for i in M for j in a[i])
    problem += objective

problem
```

## 制約条件
### One-hot 制約

```{code-cell} ipython3
problem = jm.Problem("OneHot", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))

# One-hot constraint
problem.Constraint("onehot", x.sum() == 1)
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("OneHot", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    x = problem.BinaryVar(shape=(N,))

    # One-hot constraint
    problem += problem.Constraint("onehot", x.sum() == 1)

problem
```

### K-hot 制約

```{code-cell} ipython3
problem = jm.Problem("KHot", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
K = problem.Natural("K")
x = problem.BinaryVar("x", shape=(N,))

# K-hot constraint
problem.Constraint("k_hot", x.sum() == K)
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("KHot", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    K = problem.Placeholder(dtype=jm.DataType.NATURAL)
    x = problem.BinaryVar(shape=(N,))

    # K-hot constraint
    problem += problem.Constraint("k_hot", x.sum() == K)

problem
```

### 2 次元バイナリ変数の各列に対する K-hot 制約

```{code-cell} ipython3
problem = jm.Problem("2D K-Hot", sense=jm.ProblemSense.MINIMIZE)
K = problem.Natural("K", ndim=1)
# 従属変数には説明文やカスタム LaTeX 表記も指定できる。
N = problem.DependentVar("N", K.len_at(0), description=r"\# of rows", latex=r"\#K")
M = problem.Natural("M")

x = problem.BinaryVar("x", shape=(N, M))

problem.Constraint("2d k-hot", x.sum(axis=1) == K)
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("2D K-Hot", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    K = problem.Placeholder(dtype=jm.DataType.NATURAL, ndim=1)
    N = problem.DependentVar(K.len_at(0), description=r"\# of rows", latex=r"\#K")
    M = problem.Placeholder(dtype=jm.DataType.NATURAL)

    x = problem.BinaryVar(shape=(N, M))

    problem += problem.Constraint("2d k-hot", x.sum(axis=1) == K)

problem
```

### 各集合に対する K-hot 制約

旧来は末尾に `forall=` という形で Element を指定していたが、JijModeling 2 では set を定義して `domain=...` として指定する。

```{code-cell} ipython3
problem = jm.Problem("KHotOverSet", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
C = problem.Natural("C", jagged=True, ndim=2)
M = problem.DependentVar("M", C.len_at(0))
K = problem.Natural("K", shape=(M,))
x = problem.BinaryVar("x", shape=(N,))
problem.Constraint(
    "k-hot_constraint", lambda a: C[a].map(lambda i: x[i]).sum() == K[a], domain=M
)
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("KHotOverSet", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    C = problem.Placeholder(jagged=True, ndim=2, dtype=jm.DataType.NATURAL)
    M = problem.DependentVar(C.len_at(0))
    K = problem.Placeholder(dtype=jm.DataType.NATURAL, shape=(M,))
    x = problem.BinaryVar(shape=(N,), description="Random binary variable")

    constr = problem.Constraint(
        "k-hot_constraint", (jm.sum(x[i] for i in C[a]) == K[a] for a in M),
        description="K-hot constraint over sets; $C_a$ is constrained to have exactly $K_a$ ones.",
    )
    problem += constr

problem
```

### ナップサック制約 (線形不等式制約)

```{code-cell} ipython3
problem = jm.Problem("KnapsackConstraint", sense=jm.ProblemSense.MAXIMIZE)

w = problem.Float("w", ndim=1)
N = problem.DependentVar("N", w.len_at(0))
W = problem.Float("W")
x = problem.BinaryVar("x", shape=(N,))

# Knapsack constraint
constraint = problem.Constraint("weight", (w * x).sum() <= W)
constraint
```

```{code-cell} ipython3
problem += constraint

v = problem.Float("v", shape=(N,))
problem += (v * x).sum()
problem
```

```{code-cell} ipython3
v_data = [10, 13, 18, 31, 7, 15]
w_data = [11, 15, 20, 35, 10, 33]
W_data = 47
instance_data = {"v": v_data, "w": w_data, "W": W_data}

# There are two ways to evaluate problem.

# Alternative 1: Directly call eval_* on namespace with instance data.
# Behind the scene, it just creates interpreter, call eval_*.
instance = problem.eval(instance_data)

# Alternative 2: Creating Compiler out of problem and data,
# and call eval_* on interp.
compiler = jm.Compiler.from_problem(problem, instance_data)
instance_2 = compiler.eval_problem(problem)

# The advantage of using compiler is that 
# you can use helper functions like compiler.get_constraint_id_by_name().

assert instance_2.objective.almost_equal(instance.objective)
assert instance_2.sense == instance.sense
assert len(instance.constraints) == len(instance_2.constraints)
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("KnapsackConstraint", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    w = problem.Float(ndim=1)
    N = problem.DependentVar(w.len_at(0))
    W = problem.Float()
    x = problem.BinaryVar(shape=(N,))

    # Knapsack constraint
    problem += problem.Constraint("weight", (w * x).sum() <= W)

problem
```

### SOS1 不等式制約

```{code-cell} ipython3
problem = jm.Problem("SOS-1", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
M = problem.Float("M", shape=(N,), description="$a$の上限")

a = problem.ContinuousVar(
    "a",
    shape=N,
    description="SOS1制約に従う連続変数",
    lower_bound=0,
    upper_bound=M, # 同じ形状 (N,) の配列を指定しているので、成分ごとに上限が取られる。
    # 以下のように書いても同値：
    # upper_bound=lambda i: M[i],
)
x = problem.BinaryVar(
    "x",
    shape=N,
    description="連続変数に対するSOS1制約を表現するための補助変数"
)

problem += problem.Constraint(
    "SOS1",
    x.sum() <= 1,
    description="補助変数に対するSOS1制約",
)
problem += problem.Constraint(
    "Big-M",
    a <= M * x,
    description="big-M制約を介して、連続変数のSOS1制約を表現",
)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("SOS-1", sense=jm.ProblemSense.MINIMIZE)
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural("N")
    M = problem.Float("M", shape=(N,), description="$a$の上限")

    a = problem.ContinuousVar(
        shape=N,
        description="SOS1制約に従う連続変数",
        lower_bound=0,
        upper_bound=M, # 同じ形状 (N,) の配列を指定しているので、成分ごとに上限が取られる。
        # 以下のように書いても同値：
        # upper_bound=lambda i: M[i],
    )
    x = problem.BinaryVar(
        shape=N,
        description="連続変数に対するSOS1制約を表現するための補助変数"
    )

    problem += problem.Constraint(
        "SOS1",
        x.sum() <= 1,
        description="補助変数に対するSOS1制約",
    )
    problem += problem.Constraint(
        "Big-M",
        a <= M * x,
        description="big-M制約を介して、連続変数のSOS1制約を表現",
    )

problem
```

### Big-M 不等式制約

```{code-cell} ipython3
problem = jm.Problem("BigM", sense=jm.ProblemSense.MINIMIZE)
N = problem.Natural("N")
c = problem.Float("c", shape=(N, N))

M = problem.Float("M")

x = problem.BinaryVar("x", shape=(N, N))
e = problem.Float("e", shape=(N,))
l = problem.Float("l", shape=(N,))
t = problem.IntegerVar("t", shape=(N,), lower_bound=e, upper_bound=l)
non_diagonals = jm.product(N, N).filter(lambda i, j: i != j)
constraint = problem.Constraint(
    "Big-M",
    lambda i, j: t[i] + c[i, j] - M * (1 - x[i, j]) <= t[j],
    domain=non_diagonals,
)
constraint
```

```{code-cell} ipython3
problem += constraint
problem
```

#### Decorator API の例

```{code-cell} ipython3
problem = jm.Problem("BigM", sense=jm.ProblemSense.MINIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    N = problem.Placeholder(dtype=jm.DataType.NATURAL)
    c = problem.Float(shape=(N, N))
    M = problem.Float()

    x = problem.BinaryVar(shape=(N, N))
    e = problem.Float(shape=(N,))
    l = problem.Float(shape=(N,))
    t = problem.IntegerVar(shape=(N,), lower_bound=e, upper_bound=l)

    constr = problem.Constraint(
        "Big-M",
        (
            t[i] + c[i, j] - M * (1 - x[i, j]) <= t[j]
            for i in N
            for j in N
            if i != j
        ),
    )
    problem += constr

problem
```

### シナジーボーナスつき配送計画問題

この問題では、以下のような形式の問題の定式化方法を取り上げます：

1. ID が 0-origin でなかったり、連続でなかったりするモノが登場する
2. 対象のうち一部分の組合せについてだけ定義されるパラメータ

+++

#### シナジーボーナス解法 1：辞書による定式化（推奨）

```{code-cell} ipython3
problem = jm.Problem("QuadraticKnapsackLogistics", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    # --- 3. Parameters ---
    # I = problem.Natural("I", ndim=1, description="The set of parcels")
    # J = problem.Natural("J", ndim=1, description="The set of trucks")
    # Category は、実行時に与えられる「ラベル」の集合（整数または文字列の集合）
    I = problem.CategoryLabel("I", description="荷物の集合")
    J = problem.CategoryLabel(description="トラックの集合")

    
    # Category の添え字を使うには、辞書としてデータ型を定義する必要がある
    # 内部表現もテンソルとは異なり、辞書として表現される。
    
    # `shape`/`ndim` のかわりに、`dict_keys` を指定すると、
    # そのキーに指定された型の値をキーに持つ辞書として定義される。
    # デフォルトでは、コンパイラ定義時には `dict_keys` 型の全ての値をキーとして、
    # 値が設定されている（keys の全域で定義されている）ことを要求する。
    weights = problem.Integer(
        "w", dict_keys=I, description="各荷物の重さ"
    )
    base_revenues = problem.Integer(
        "r", dict_keys=I, description="各荷物の基本利益"
    )
    capacities = problem.Integer(
        "C", dict_keys=J, description="各トラックの荷重容量"
    )
    
    # `partial_dict` を指定すると、全域でない辞書を許容する。
    # ここでは、シナジーボーナスが定義されるペアに対してのみ `s` の値を定義できるようにしている。
    synergy_bonuses = problem.Integer(
        "s",
        dict_keys=(I, I),
        partial_dict=True,
        description="荷物の組合せに対するシナジーボーナス",
    )
    # あるいは、上の構文糖衣として以下のようにも書ける予定：
    # synergy_bonus = problem.PartialDict(
    #     "s",
    #     dtype=int,
    #     keys=(I, I),
    #     description="The synergy bonus between pairs of parcels",
    # )

    # --- 4. Decision Variables ---
    # 決定変数の個数は Placeholder のみから静的に決まる必要があるため、
    # 決定変数の辞書は全域で定義される。
    x = problem.BinaryVar(
        "x",
        dict_keys=(I, J),
        description="x[i,j] = 1 if parcel i is assigned to truck j, else 0",
    )
    # たとえば、シナジーボーナスの生じる組合せしか割り当てを行わないような場合（ないだろうけど）、
    # 以下のように書くこともできる：
    # x = problem.BinaryVar(
    #     "x",
    #     dict_keys=s.keys(),
    #     description="荷物 i をトラック j に割り当てるなら$x[i,j] = 1$、そうでないなら$0$",
    # )

    # --- 5. Objective Function ---
    problem += jm.sum(
        synergy_bonuses[i, k] * x[i, j] * x[k, j]
        for j in J

        # .keys() でキー集合を、
        # .items() でキー値ペアを、
        # .values() で値の集合をイテレート可能
        for (i, k) in synergy_bonuses.keys()
    ) + jm.sum(
        base_revenues[i] * x[i, j]
        for i in I
        for j in J
    )

    # --- 6. Constraints ---
    problem += problem.Constraint(
        "parcel_assign", [jm.sum(x[i, j] for j in J) == 1 for i in I]
    )
    problem += problem.Constraint(
        "truck_capacity",
        [
            jm.sum(weights[i] * x[i, j] for i in I) <= capacities[j]
            for j in J
        ],
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

x_var = {
    (i, j): compiler.get_decision_variable_by_name("x", (i, j))
    for i in percels_data
    for j in trucks_data
}

expected_objective = ommx.v1.Function(
    sum(
        synergies_data[i, k] * x_var[i, j] * x_var[k, j]
        for j in trucks_data
        for (i, k) in synergies_data
    )
    + sum(r_data[i] * x_var[i, j] for i in percels_data for j in trucks_data)
)

assert instance.objective.almost_equal(expected_objective)

percel_constrs = compiler.get_constraint_id_by_name("parcel_assign")
for i in percels_data:
    c_id = percel_constrs[(i,)]
    assert c_id is not None
    constr = instance.constraints[c_id]
    assert constr is not None
    assert constr.equality == ommx.v1.Constraint.EQUAL_TO_ZERO
    expected_function = ommx.v1.Function(sum(x_var[i, j] for j in trucks_data) - 1)
    assert constr.function.almost_equal(expected_function)

capacity_constrs = compiler.get_constraint_id_by_name("truck_capacity")
for j in trucks_data:
    c_id = capacity_constrs[(j,)]
    assert c_id is not None
    constr = instance.constraints[c_id]
    assert constr is not None
    assert constr.equality == ommx.v1.Constraint.LESS_THAN_OR_EQUAL_TO_ZERO
    expected_function = ommx.v1.Function(
        sum(weight_data[i] * x_var[i, j] for i in percels_data) - capacity_data[j]
    )
    assert constr.function.almost_equal(expected_function)
```

#### 解法 2：配列の min / max によるテンソル定義

```{code-cell} ipython3
problem = jm.Problem("QuadraticKnapsackLogistics", sense=jm.ProblemSense.MAXIMIZE)

@problem.update
def _(problem: jm.DecoratedProblem):
    # --- 3. Parameters ---
    I = problem.Natural("I", ndim=1, description="The set of parcels")
    J = problem.Natural("J", ndim=1, description="The set of trucks")
    P = problem.Placeholder("P", ndim=1, dtype=Tuple[np.uint, np.uint], description="The set of parcel pairs with a synergy bonus")
    weights = problem.Integer(
        "w", ndim=1, description="The weight of each parcel"
    )
    base_revenues = problem.Integer(
        "r", ndim=1, description="The base revenue of each parcel"
    )
    capacities = problem.Integer(
        "C", ndim=1, description="The capacity of each truck"
    )
    synergy_bonuses = problem.Integer(
        "s",
        ndim=2,
        description="The synergy bonus between pairs of parcels",
    )

    # --- 4. Decision Variables ---
    x = problem.BinaryVar(
        "x",
        shape=(I.max() + 1, J.max() + 1),
        description="x[i,j] = 1 if parcel i is assigned to truck j, else 0",
    )

    # --- 5. Objective Function ---
    problem += jm.sum(
        synergy_bonuses[i, k] * x[i, j] * x[k, j]
        for j in J
        for (i, k) in P
    ) + jm.sum(
        base_revenues[i] * x[i, j]
        for i in I
        for j in J
    )

    # --- 6. Constraints ---
    problem += problem.Constraint(
        "parcel_assign", [jm.sum(x[i, j] for j in J) == 1 for i in I]
    )
    problem += problem.Constraint(
        "truck_capacity",
        [
            jm.sum(weights[i] * x[i, j] for i in I) <= capacities[j]
            for j in J
        ],
    )

problem
```

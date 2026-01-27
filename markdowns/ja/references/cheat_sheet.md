---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.0
kernelspec:
  display_name: jijmodeling-tutorial
  language: python
  name: python3
---

# Cheat Sheet

```{code-cell} ipython3
import jijmodeling as jm
```

## 総和

### 決定変数の総和

```{code-cell} ipython3
problem = jm.Problem("BasicSum")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
problem += x.sum()

problem
```

### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("BasicSum")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += x.sum()

problem
```

### 係数付き決定変数の総和

```{code-cell} ipython3
problem = jm.Problem("WeightedSum")
a = problem.Float("a", ndim=1)
N = problem.DependentVar("N", a.len_at(0))
x = problem.BinaryVar("x", shape=(N,))
problem += jm.sum(a * x)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("WeightedSum")
def problem(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = problem.DependentVar(a.len_at(0))
    x = problem.BinaryVar(shape=(N,))
    problem += (a * x).sum()

problem
```

### 添字集合に沿った決定変数の総和

```{code-cell} ipython3
problem = jm.Problem("SumAlongSet")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
C = problem.Natural("C", ndim=1)
problem += jm.sum(jm.map(lambda i: x[i], C))

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("SumAlongSet")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    C = problem.Natural(ndim=1)
    problem += jm.sum(x[i] for i in C)

problem
```

### 辺集合に沿った決定変数の総和

```{code-cell} ipython3
problem = jm.Problem("SumAlongEdgeSet")
V = problem.Natural("V")
E = problem.Graph("E")
x = problem.BinaryVar("x", shape=(V,))
problem += jm.map(lambda i, j: x[i] * x[j], E).sum()

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("SumAlongEdgeSet")
def problem(problem: jm.DecoratedProblem):
    V = problem.Natural()
    E = problem.Graph()
    x = problem.BinaryVar(shape=(V,))
    problem += jm.sum(x[i] * x[j] for (i, j) in E)

problem
```

### 条件付きの総和

```{code-cell} ipython3
problem = jm.Problem("ConditionalSum")
N = problem.Natural("N")
J = problem.Float("J", shape=(N, N))
x = problem.BinaryVar("x", shape=(N,))
problem += jm.map(
    lambda i: jm.filter(lambda j: i > j, N).map(lambda j: J[i, j] * x[i] * x[j]).sum(),
    N
).sum()

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("ConditionalSum")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    J = problem.Float(shape=(N, N))
    x = problem.BinaryVar(shape=(N,))
    problem += jm.sum(J[i, j] * x[i] * x[j] for i in N for j in N if i > j)

problem
```

### 行列の対角要素を除く総和

```{code-cell} ipython3
problem = jm.Problem("NonDiagonalSum")
N = problem.Natural("N")
J = problem.Float("J", shape=(N, N))
problem += jm.map(
    lambda i: jm.filter(lambda j: i != j, N).map(lambda j: J[i, j]).sum(),
    N
).sum()

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("NonDiagonalSum")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    J = problem.Float(shape=(N, N)) 
    problem += jm.sum(J[i, j] for i in N for j in N if i != j)

problem
```

### 別のインデックスに依存した総和

```{code-cell} ipython3
problem = jm.Problem("DependentSum")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
a = problem.Natural("a", ndim=1)
M = problem.DependentVar("M", a.len_at(0))
problem += jm.sum(jm.flat_map(lambda i: a[i].map(lambda j: x[j]), M))

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("DependentSum")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    a = problem.Natural(ndim=1)
    M = problem.DependentVar(a.len_at(0))
    problem += jm.sum(x[j] for i in M for j in a[i])

problem
```

## 制約条件
### One-hot 制約

```{code-cell} ipython3
problem = jm.Problem("OneHot")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
problem += problem.Constraint("onehot", x.sum() == 1)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("OneHot")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += problem.Constraint("onehot", x.sum() == 1)

problem
```

### K-hot 制約

```{code-cell} ipython3
problem = jm.Problem("KHot")
N = problem.Natural("N")
K = problem.Natural("K")
x = problem.BinaryVar("x", shape=(N,))
problem += problem.Constraint("k_hot", x.sum() == K)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("KHot")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    K = problem.Natural()
    x = problem.BinaryVar(shape=(N,))
    problem += problem.Constraint("k_hot", x.sum() == K)

problem
```

### 2 次元バイナリ変数の各列に対する K-hot 制約

```{code-cell} ipython3
problem = jm.Problem("2D K-Hot")
K = problem.Natural("K", ndim=1)
N = problem.DependentVar("N", K.len_at(0))
M = problem.Natural("M")
x = problem.BinaryVar("x", shape=(N, M))
problem += problem.Constraint("2d k-hot", x.sum(axis=1) == K)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("2D K-Hot")
def problem(problem: jm.DecoratedProblem):
    K = problem.Natural(ndim=1)
    N = problem.DependentVar(K.len_at(0))
    M = problem.Natural()
    x = problem.BinaryVar(shape=(N, M))
    problem += problem.Constraint("2d k-hot", x.sum(axis=1) == K)

problem
```

### 各集合に対する K-hot 制約

```{code-cell} ipython3
problem = jm.Problem("KHotOverSet")
N = problem.Natural("N")
C = problem.Natural("C", jagged=True, ndim=2)
M = problem.DependentVar("M", C.len_at(0))
K = problem.Natural("K", shape=(M,))
x = problem.BinaryVar("x", shape=(N,))
problem += problem.Constraint(
    "k-hot_constraint", lambda a: C[a].map(lambda i: x[i]).sum() == K[a], domain=M
)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("KHotOverSet")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    C = problem.Natural(jagged=True, ndim=2)
    M = problem.DependentVar(C.len_at(0))
    K = problem.Natural(shape=(M,))
    x = problem.BinaryVar(shape=(N,))
    problem += problem.Constraint(
        "k-hot_constraint", (jm.sum(x[i] for i in C[a]) == K[a] for a in M),
    )

problem
```

### 線形不等式制約

```{code-cell} ipython3
problem = jm.Problem("LinearInequality")
w = problem.Float("w", ndim=1)
N = problem.DependentVar("N", w.len_at(0))
W = problem.Float("W")
x = problem.BinaryVar("x", shape=(N,))
problem += problem.Constraint("weight", (w * x).sum() <= W)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("LinearInequality")
def problem(problem: jm.DecoratedProblem):
    w = problem.Float(ndim=1)
    N = problem.DependentVar(w.len_at(0))
    W = problem.Float()
    x = problem.BinaryVar(shape=(N,))
    problem += problem.Constraint("weight", (w * x).sum() <= W)

problem
```

### SOS1 不等式制約

```{code-cell} ipython3
problem = jm.Problem("SOS-1")
N = problem.Natural("N")
M = problem.Float("M", shape=(N,))
a = problem.ContinuousVar("a", shape=N, lower_bound=0, upper_bound=M)
x = problem.BinaryVar("x", shape=N)
problem += problem.Constraint("SOS1", x.sum() <= 1)
problem += problem.Constraint("Big-M", a <= M * x)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("SOS-1")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    M = problem.Float(shape=(N,))
    a = problem.ContinuousVar(shape=N, lower_bound=0, upper_bound=M)
    x = problem.BinaryVar(shape=N)
    problem += problem.Constraint("SOS1", x.sum() <= 1)
    problem += problem.Constraint("Big-M", a <= M * x)

problem
```

### Big-M 不等式制約

```{code-cell} ipython3
problem = jm.Problem("BigM")
N = problem.Natural("N")
c = problem.Float("c", shape=(N, N))
M = problem.Float("M")
x = problem.BinaryVar("x", shape=(N, N))
e = problem.Float("e", shape=(N,))
l = problem.Float("l", shape=(N,))
t = problem.IntegerVar("t", shape=(N,), lower_bound=e, upper_bound=l)
non_diagonals = jm.product(N, N).filter(lambda i, j: i != j)
problem += problem.Constraint(
    "Big-M",
    lambda i, j: t[i] + c[i, j] - M * (1 - x[i, j]) <= t[j],
    domain=non_diagonals,
)

problem
```

#### Decorator API の例

```{code-cell} ipython3
@jm.Problem.define("BigM")
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    c = problem.Float(shape=(N, N))
    M = problem.Float()
    x = problem.BinaryVar(shape=(N, N))
    e = problem.Float(shape=(N,))
    l = problem.Float(shape=(N,))
    t = problem.IntegerVar(shape=(N,), lower_bound=e, upper_bound=l)
    problem += problem.Constraint(
        "Big-M",
        (
            t[i] + c[i, j] - M * (1 - x[i, j]) <= t[j]
            for i in N
            for j in N
            if i != j
        ),
    )

problem
```

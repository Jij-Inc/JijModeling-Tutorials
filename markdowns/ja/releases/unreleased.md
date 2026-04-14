---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### 機能1

+++

## バグ修正

+++

### ランダムインスタンスデータ生成のバグ修正

ランダムインスタンスデータ生成において、以下の二つのバグ修正を行いました：

#### `NamedExpr` に依存したプレースホルダーが正しく扱えない

シェイプ（長さ）やキー集合が`NamedExpr`に依存しているプレースホルダーが正しく扱えないバグを修正しました。
例として、以下のような問題を考えます：

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("My Problem")
def problem(problem: jm.DecoratedProblem):
    a = problem.Float(ndim=1)
    N = problem.NamedExpr(a.len_at(0))
    b = problem.Natural(shape=(N, None))
    M = problem.NamedExpr(b.len_at(1))
    problem += jm.sum(a[i] * b[i, j] for i in N for j in M)


problem
```

旧来のバージョンでは、この `problem` に対して `generate_random_dataset()` を呼び出すと例外になっていましたが、本リリースからは正しくデータが生成されるようになりました。

```{code-cell} ipython3
problem.generate_random_dataset(seed=17)
```

#### 利用されていないプレースホルダーの存在下で生成に失敗するバグの修正

`used_placeholder()` に含まれない未使用のプレースホルダーが存在する場合、データ生成に失敗していました。
たとえば、以下のコードでは `N` は定義のみで利用されておらず、以前のバージョンでは実行時例外となっていました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("My Problem")
N = problem.Natural("N")

problem.generate_random_dataset(seed=17)
```

今回のリリースから、上記のように問題なくデータが生成されるようになりました。

## その他の変更

- バージョン条件を緩和し、Python 3.11 以降の任意の Python 3 でのインストールを許容しました。

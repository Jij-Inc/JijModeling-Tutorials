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

JijModelingで作られた数理モデルは、簡単に[Protobuf](https://protobuf.dev) でシリアライズすることができます。そうするには{py:func}`jijmodeling.to_protobuf`関数か`Problem.to_protobuf　<jijmodeling.Problem.to_protobuf>`メソッドを使います。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("my problem")
N = problem.Placeholder("N", dtype=jm.DataType.NATURAL)
x = problem.BinaryVar("x", shape=(N,))
problem += x.sum()

serialized = problem.to_protobuf()
```

デシリアライズは、{py:func}`jijmodeling.from_protobuf` か{py:meth}`Problem.from_protobuf <jijmodeling.Problem.from_protobuf>`で行えます。

```{code-cell} ipython3
deserialized = jm.from_protobuf(serialized)
```

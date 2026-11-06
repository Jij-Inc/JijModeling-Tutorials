---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# 数理モデルのシリアライズ

JijModeling で作られた数理モデルは、[Protobuf](https://protobuf.dev) で簡単にシリアライズできます。具体的には、[`jijmodeling.to_protobuf`](xref:api_reference#jijmodeling.to_protobuf)関数か[`Problem.to_protobuf`](xref:api_reference#jijmodeling.Problem.to_protobuf)メソッドを使えばシリアライズできます。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("my problem")
N = problem.Placeholder("N", dtype=jm.DataType.NATURAL)
x = problem.BinaryVar("x", shape=(N,))
problem += x.sum()

serialized = problem.to_protobuf()
```

デシリアライズは、[`jijmodeling.from_protobuf`](xref:api_reference#jijmodeling.from_protobuf) か[`Problem.from_protobuf`](xref:api_reference#jijmodeling.Problem.from_protobuf)で行えます。

```{code-cell} ipython3
deserialized = jm.from_protobuf(serialized)
```

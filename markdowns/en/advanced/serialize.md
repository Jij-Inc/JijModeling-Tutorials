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

JijModeling models can be easily serialized to [Protobuf](https://protobuf.dev) using the {py:func}`jijmodeling.to_protobuf` function or the {py:meth}`Problem.to_protobuf <jijmodeling.Problem.to_protobuf>` method.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("my problem")
N = problem.Placeholder("N", dtype=jm.DataType.NATURAL)
x = problem.BinaryVar("x", shape=(N,))
problem += x.sum()

serialized = problem.to_protobuf()
```

To deserialize, use {py:func}`jijmodeling.from_protobuf` or {py:meth}`Problem.from_protobuf <jijmodeling.Problem.from_protobuf>`.

```{code-cell} ipython3
deserialized = jm.from_protobuf(serialized)
```

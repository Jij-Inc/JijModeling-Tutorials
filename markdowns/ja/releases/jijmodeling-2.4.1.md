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

# JijModeling 2.4.1 リリースノート

## バグ修正

+++

### `Constraint`のデシリアライズバグ修正

`from_protobuf`で`Constraint`が正しくデシリアライズされず、`eval`時に"does not have a shape"という例外が発生するというバグを修正しました。

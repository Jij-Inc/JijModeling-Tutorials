---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X リリースノート

+++

## 機能強化

+++

### `generate_random_instance` の `fixed_variables` キーワード引数追加

`eval`に渡す `fixed_variabes`を指定できるよう、`generate_random_instance`にキーワード引数を追加しました。

+++

## バグ修正

+++

### バグ修正 1：OMMXコンパイル時の `min` の畳み込みが `max` になっていた問題の修正

OMMX へのコンパイル時に、定数上の {py:func}`~jijmodeling.min` が誤って最大値を計算していたバグを修正しました。

### バグ修正 2： {py:func}`~jijmodeling.count` 関数を含むモデルがシリアライズできなかった問題の修正

モデル内で CategoryLabel に対する {py:func}`~jijmodeling.count` 関数を使っていた場合、Protobuf 形式へのシリアライズ時に意図せず実行時エラーとなっていた問題を修正しました。

## その他の変更

- 変更 1：

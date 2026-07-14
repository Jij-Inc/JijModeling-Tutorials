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

# JijModeling 2.6.0 リリースノート

+++

## 機能強化

+++

### `generate_random_instance` の `fixed_variables` キーワード引数追加

`eval`に渡す `fixed_variabes`を指定できるよう、`generate_random_instance`にキーワード引数を追加しました。

### エラーコードの付与と包括的なエラーガイドの提供

本リリースから、以下のように全てのエラーメッセージにエラーコードが付与されるようになりました。

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("Test Problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
try:
    problem += x
except Exception as e:
    print(e)
```

`[]` 内部の `E-TE0004` が個別のエラーメッセージに対応します。

また、各エラーコードごとにありうる理由や対処法をまとめたインデックスが公開併せて公開されています。

個別のコードごとに https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/error_codes/error/E-TE0004.html などとしてアクセスすることができます。
一部のターミナルでは、上のようなエラーメッセージ中の `[E-TE0004]` の部分にハイパーリンクが設定されており、直接開くことができます。
また、エラーの一覧やカテゴリー別の概説についても https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/error_codes/index.html から確認できます。

+++

## バグ修正

+++

### バグ修正 1：OMMXコンパイル時の `min` の畳み込みが `max` になっていた問題の修正

OMMX へのコンパイル時に、定数上の {py:func}`~jijmodeling.min` が誤って最大値を計算していたバグを修正しました。

### バグ修正 2： {py:func}`~jijmodeling.count` 関数を含むモデルがシリアライズできなかった問題の修正

モデル内で CategoryLabel に対する {py:func}`~jijmodeling.count` 関数を使っていた場合、Protobuf 形式へのシリアライズ時に意図せず実行時エラーとなっていた問題を修正しました。

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

### エラーコードの付与

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

<!-- FIXME: 最終のURLに変更する -->
また、各エラーコードごとにありうる理由や対処法をまとめたインデックスが公開されるようになっています。
個別のコードごとに https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/errors/E-TE0004.html などとしてアクセスすることができ、一部のターミナルでは `[E-TE0004]` の部分にハイパーリンクが設定されており、直接開くことができます。
エラーの一覧については https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/errors/index.html から確認できます。

+++

## バグ修正

+++

### バグ修正1：


## その他の変更

- 変更1：

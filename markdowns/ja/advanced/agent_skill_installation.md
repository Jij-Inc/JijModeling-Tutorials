---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.5
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
---

# コーディングエージェント向けスキルのインストール

JijModeling **2.9.0 以降**には、コーディングエージェントに JijModeling を使って数理モデルを定式化・求解させるためのスキルが同梱されています。
以下では、そのスキルの保存場所の確認と、既存のスキルマネージャを用いて利用中のコーディングエージェント（Claude Code、Codex、Cursor など）にインストールする方法について簡単に説明します。

+++

## エージェントスキルとは？

**エージェントスキル**とは、大規模言語モデルに特定の作業をする上での指針やツールの使い方を教えるための指示などが書かれた書類です。
多くのコーディングエージェントでは、必要に応じてプロジェクトごとにスキルをインストールしたり、ユーザー単位で個別にインストールしたりすることができます。

JijModeling 同梱のエージェントスキルは、[標準的な Agent Skills 仕様](https://agentskills.io/specification)に準拠しており、Claude Code や Codex など既存の様々なコーディングエージェントで利用することができます。

また、同梱のスキルは機能追加などに応じて更新されていきますので、利用する JijModeling のバージョンを変更した場合は、以下の手順を再度繰り返し、必要に応じてスキルを更新することをお勧めします。

:::{admonition} スキルは万能ではない
:class: caution

スキルはコーディングエージェントによる JijModeling の利用を補助しますが、結果的に生成されたコードが必ず**期待通りに動くか、定式化が適切なものになっているかまでは保証されません**。
スキルの役割は、あくまでもコーディングエージェントが JijModeling をスムーズに書けるようにすることである点に注意しましょう。
:::

## スキルのパスを確認する

`uv` を使って管理されているプロジェクトでは、JijModeling に同梱されているスキルのパスを以下のコマンドにより実行できます：

```bash
uv run jijmodeling skill path
```

以下のように、スキル一式を格納した絶対パスが 1 行で表示されます。

```
/home/user/my-jm-project/.venv/lib/python3.13/site-packages/jijmodeling/.agents/skills
```

uv を使っていない場合は、以下のようにして同様のパスを確認できます：

```bash
python -m jijmodeling skill path
```

+++

## スキルのインストール

`jijmodeling skill path` コマンドで出力されたディレクトリをお使いのエージェントのマニュアルの指示に従ってコピーすれば、エージェントの次回起動時からスキルが自動で使われるようになります。

既存のスキルマネージャーを使うと、プロジェクト単位か個人単位なのか、またどのエージェントで利用できるようにするのか、といった情報を与えることで自動的にインストールしてくれるようになり便利です。
以下では、一般的に用いられている GitHub CLI でのインストール方法を紹介します。

### GitHub CLI の例

[GitHub CLI](https://cli.github.com/) は[バージョン 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0)以降から `gh skill` サブコマンドとしてスキルマネージャの機能を提供しています。
以下の作業は、上記のリンクから作業環境に十分新しい GitHub CLI（`gh` コマンド）をインストールして行ってみてください。

`uv` ベースの最適化プロジェクト内で以下のコマンドを実行すると、ターミナル内で対話的に対象のエージェントやスコープ（プロジェクトなのかユーザー単位なのか）を指定してインストールすることができます：

```bash
gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local
```

また、次のようにオプションにより直接エージェントやスコープを指定できます：

```bash
gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
```

オプションの詳細は、[gh skill install のマニュアル](https://cli.github.com/manual/gh_skill_install)を参照してください。

インストール後は、エージェントに `jijmodeling` スキルを使って定式化やモデルの修正を行うよう依頼できます。

+++

## JijModeling を更新したとき

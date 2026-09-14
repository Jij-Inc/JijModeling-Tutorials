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

# コーディングエージェント向けプラグインのインストール

JijModeling **2.9.0 以降**には、コーディングエージェントに JijModeling を使って数理最適化モデルを定式化・実装・求解させるためのエージェントプラグインが同梱されています。
以下では、同梱プラグインの保存場所の確認と、各種コーディングエージェント（Claude Code、Codex、Cursor、GitHub Copilot、VSCode など）で利用するための設定方法について説明します。

+++

## エージェントプラグインとは？

**エージェントプラグイン**とは、大規模言語モデル（LLM）に対してドメイン固有の知識やスキル（`SKILL.md`）、ルール、プロンプト、ツールの使い方などをパッケージ化して提供するための仕組みです。
JijModeling 同梱のプラグインは、標準的な Agent Plugins 1.0 仕様や Claude Code、Cursor、Codex などのプラグインマニフェストに準拠しています。

### 明示的なバージョン同期

従来のアドホックなプロンプトや単純コピーとは異なり、JijModeling のエージェントプラグインには**明示的なバージョン番号**が付与されており、インストールされている JijModeling パッケージのバージョンと完全に同期しています。
JijModeling に新しいモデリング機能や API、ソルバー連携が追加されると、同梱プラグインも同じバージョンで更新されます。これにより、仮想環境内の Python ライブラリとエージェント向け指示の乖離を防ぐことができます。

:::{admonition} プラグインは万能ではない
:class: caution

プラグインは、コーディングエージェントによる JijModeling の利用を強力に補助しますが、**結果的に生成されるコードや定式化が適切であることを保証するものではありません**。
プラグインの役割は、コーディングエージェントが JijModeling を正しくスムーズに書けるよう支援することである点に注意してください。
:::

## プラグインの確認と設定

以下では、JijModeling に同梱されているプラグインの確認と各エージェントへの設定方法について説明します。

### プラグインのパスを確認する

プラグインを設定するには、まずその保存場所を取得します。
`uv` で管理されているプロジェクトでは、以下のコマンドを実行します：

```bash
uv run jijmodeling plugin path
```

以下のように、`plugin.json` や `skills/` を含むプラグインディレクトリの絶対パスが 1 行で出力されます：

```
/home/user/my-jm-project/.venv/lib/python3.13/site-packages/jijmodeling/plugins/jijmodeling
```

また、マーケットプレイス経由でのインストールに対応したエージェント向けに、マーケットプレイスのパスを取得するサブコマンドも用意されています：

```bash
uv run jijmodeling plugin marketplace path
```

uv を使っていない場合は、以下のように `python -m` で同様のパスを確認できます：

```bash
python -m jijmodeling plugin path
python -m jijmodeling plugin marketplace path
```

:::{note} スキルマネージャーとの後方互換性
`gh skill` などスキルディレクトリを直接期待する既存ツール向けに、従来の `jijmodeling skill path` サブコマンドも引き続き利用可能です：

```bash
uv run jijmodeling skill path
```
:::

+++

### 各種コーディングエージェントでの設定

同梱プラグインは主要なコーディングエージェントに対応しています。お使いのエージェントに合わせて設定してください：

#### Claude Code

Claude Code では、マーケットプレイス経由または直接パスを指定してプラグインを導入できます：

1. **マーケットプレイス経由**:
   ```bash
   claude plugin marketplace add "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install jijmodeling
   ```
2. **プロジェクト設定または起動オプション**:
   プロジェクトの `.claude/plugins/jijmodeling` にシンボリックリンクまたはコピーを配置するか、起動オプションで直接指定します：
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

#### Cursor

Cursor では、プロジェクト単位またはユーザー単位でプラグインやスキルを設定できます。
プロジェクトの `.cursor/plugins` 配下にシンボリックリンクを作成するのが簡単です：

```bash
mkdir -p .cursor/plugins
ln -s "$(uv run jijmodeling plugin path)" .cursor/plugins/jijmodeling
```

また、同梱のスキルを直接 `.cursor/skills` にシンボリックリンクすることも可能です：

```bash
mkdir -p .cursor/skills
ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling
```

#### OpenAI Codex

Codex は `.codex/plugins` や `.agents/plugins` からプラグインやスキルを自動検出します。
プロジェクトディレクトリ内でシンボリックリンクを作成します：

```bash
mkdir -p .codex/plugins
ln -s "$(uv run jijmodeling plugin path)" .codex/plugins/jijmodeling
```

#### GitHub Copilot および VSCode

VSCode や GitHub Copilot で利用する場合：

1. **GitHub CLI (`gh skill`) を利用する場合**:
   [GitHub CLI](https://cli.github.com/) は[バージョン 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0) 以降から `gh skill` サブコマンドとしてスキルマネージャの機能を提供しています。
   ```bash
   gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
   ```
   オプションの詳細は、[gh skill install のマニュアル](https://cli.github.com/manual/gh_skill_install)を参照してください。
2. **ワークスペース指示ファイルを利用する場合**:
   ワークスペースの `.github/copilot-instructions.md` や VSCode 設定からプラグインのルールやガイドラインを参照するように設定します。

### プラグインの更新

JijModeling をバージョンアップ（例: `uv lock --upgrade-package jijmodeling`）した際は、プラグインの更新も確認してください：
- シンボリックリンク（`ln -s`）を用いている場合、仮想環境内の JijModeling が更新されるとプラグイン内容も自動的に最新になります。
- ファイルを直接コピーした場合や `claude plugin install` / `gh skill install` で導入した場合は、JijModeling 更新後に再度コマンドを実行して最新バージョンに同期してください。

インストール後は、エージェントに JijModeling を使って数理モデルの定式化や修正を行うよう依頼できます。

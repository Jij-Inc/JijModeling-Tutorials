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

同梱のプラグインには明示的なバージョン番号が付与されており、インストールされている JijModeling パッケージのバージョンと同期しています。
JijModeling に新しい機能や API が追加されると同梱プラグインも更新されるため、利用する JijModeling のバージョンを変更した場合は、プラグインも合わせて更新することをお勧めします。

:::{admonition} プラグインは万能ではない
:class: caution

プラグインは、コーディングエージェントによる JijModeling の利用を補助しますが、**結果的に生成されるコードや定式化が適切であることを保証するものではありません**。
プラグインの役割は、コーディングエージェントが JijModeling を正しくスムーズに書けるよう支援することである点に注意しましょう。
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

同梱プラグインは主要なコーディングエージェントに対応しています。
手動でコマンドを実行する以外にも、以下の方法でプラグインを導入・設定できます：

- **プロンプトによる直接指示**: お使いのコーディングエージェントとのチャット欄で、`uv run jijmodeling plugin path` で得られるパスを渡し、「このパスにあるプラグインを現在のプロジェクトにインストールして」と直接プロンプトで指示すれば、エージェント自身が必要なディレクトリ作成やシンボリックリンクの配置を行ってくれます。
- **GUI の設定画面**: Cursor や VSCode などのエディタでは、GUI の設定画面（Settings やプラグイン／機能拡張の管理インターフェース）からプラグインやスキルのパスを指定して登録することも可能です。

以下では、代表的なエージェントごとの設定方法と公式ドキュメントを紹介します：

#### Claude Code

- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)

Claude Code では、マーケットプレイス経由や起動オプション、またはチャット対話を通じてプラグインを導入できます：

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
3. **プロンプトでの指示**:
   Claude Code の対話画面で、「`$(uv run jijmodeling plugin path)` にあるプラグインをこのプロジェクトに追加して」と指示して設定させることもできます。

#### Cursor

- [Cursor 公式ドキュメント](https://docs.cursor.com/)（[Rules for AI](https://docs.cursor.com/context/rules-for-ai)）

Cursor では、CLI からの配置、GUI 設定画面、または Cursor Agent へのプロンプト指示によって設定できます：

1. **シンボリックリンクの配置**:
   プロジェクトの `.cursor/plugins` 配下にシンボリックリンクを作成するのが簡単です：
   ```bash
   mkdir -p .cursor/plugins
   ln -s "$(uv run jijmodeling plugin path)" .cursor/plugins/jijmodeling
   ```
   また、同梱のスキルのみを `.cursor/skills` に配置することも可能です：
   ```bash
   mkdir -p .cursor/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling
   ```
2. **GUI 設定画面からの追加**:
   Cursor の設定画面（Cursor Settings > Rules / Features）から、カスタムルールやスキル・プラグインのパスを指定することも可能です。
3. **プロンプトでの指示**:
   Cursor の Agent チャットで「`$(uv run jijmodeling plugin path)` にあるプラグインを `.cursor/plugins/` にリンクして」と指示して自動で設定させることもできます。

#### OpenAI Codex

- [OpenAI プラットフォーム公式ドキュメント](https://platform.openai.com/docs)

Codex は `.codex/plugins` や `.agents/plugins` からプラグインやスキルを自動検出します：

1. **シンボリックリンクの配置**:
   ```bash
   mkdir -p .codex/plugins
   ln -s "$(uv run jijmodeling plugin path)" .codex/plugins/jijmodeling
   ```
2. **プロンプトでの指示**:
   Codex の対話インターフェースでプラグインのパスを渡し、ワークスペースへの設定を指示することも可能です。

#### GitHub Copilot および VSCode

- [GitHub Copilot 公式ドキュメント](https://docs.github.com/en/copilot)
- [Visual Studio Code Copilot 公式ドキュメント](https://code.visualstudio.com/docs/copilot/overview)

VSCode や GitHub Copilot で利用する場合：

1. **GitHub CLI (`gh skill`) を利用する場合**:
   [GitHub CLI](https://cli.github.com/) は[バージョン 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0) 以降から `gh skill` サブコマンドとしてスキルマネージャの機能を提供しています。
   ```bash
   gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
   ```
   オプションの詳細は、[gh skill install のマニュアル](https://cli.github.com/manual/gh_skill_install)を参照してください。
2. **ワークスペース指示ファイルまたは設定画面**:
   VSCode の設定画面（Settings）や、ワークスペースの `.github/copilot-instructions.md` からプラグインのルールやスキルを参照するように設定します。
3. **Copilot Chat でのプロンプト指示**:
   Copilot Chat にプラグインパスを伝えてワークスペース指示ファイルの更新やリンクの配置を依頼することも可能です。

### プラグインの更新

JijModeling をバージョンアップ（例: `uv lock --upgrade-package jijmodeling`）した際は、プラグインの更新も確認してください：
- シンボリックリンク（`ln -s`）を用いている場合、仮想環境内の JijModeling が更新されるとプラグイン内容も自動的に最新になります。
- ファイルを直接コピーした場合や `claude plugin install` / `gh skill install` で導入した場合は、JijModeling 更新後に再度コマンドを実行して最新バージョンに同期してください。

インストール後は、エージェントに JijModeling を使って数理モデルの定式化や修正を行うよう依頼できます。

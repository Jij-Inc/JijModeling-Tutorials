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

JijModeling **2.9.0 以降**には、コーディングエージェントに JijModeling を使って数理最適化モデルを定式化・実装・求解させるためのプラグインが同梱されています。
以下では、同梱プラグインの保存場所の確認と、各種コーディングエージェント（Claude Code、Codex、Cursor、GitHub Copilot、VSCode など）で利用するための設定方法について説明します。

+++

## エージェントプラグインとは？

**エージェントプラグイン**とは、大規模言語モデル（LLM）に対してドメイン固有の知識やスキル（`SKILL.md`）、ルール、プロンプト、ツールの使い方などをパッケージ化して提供するための仕組みです。
JijModeling 同梱のプラグインは、標準的な [Agent Plugins 1.0 仕様](https://agent-plugins.org/)や Claude Code、Cursor、Codex などのプラグインマニフェストに準拠しています。

同梱のプラグインには明示的なバージョン番号が付与されており、インストールされている JijModeling パッケージのバージョンと同期しています。
JijModeling に新しい機能や API が追加されると同梱プラグインも更新されるため、利用する JijModeling のバージョンを変更した場合は、プラグインも合わせて更新することをお勧めします。

:::{admonition} プラグインは万能ではない
:class: caution

プラグインは、コーディングエージェントによる JijModeling の利用を補助しますが、**結果的に生成されるコードや定式化が適切であることを保証するものではありません**。
プラグインの役割は、コーディングエージェントが JijModeling を正しくスムーズに書けるよう支援することである点に注意しましょう。
:::

## プラグインのインストール

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

:::{admonition} スキルマネージャーとの連携
:class: note

`gh skill` など、プラグイン全体ではなく個別のスキルディレクトリを直接指定する必要がある外部ツール向けに、スキルディレクトリのパスを取得する `jijmodeling skill path` サブコマンドも用意されています：

```bash
uv run jijmodeling skill path
```
:::

+++

### 各種コーディングエージェントでの設定

同梱プラグインは、プロジェクトで使用されている JijModeling のバージョンと紐付いています。そのため、ユーザー環境全体ではなく、プロジェクトごとに登録・インストールを行ってください。
CLI コマンドによる配置のほか、Cursor や VSCode などのエディタでは GUI の設定画面（Settings やプラグイン／機能拡張の管理インターフェース）からプラグインやスキルのパスを指定してプロジェクトに登録することも可能です。

以下では、代表的なエージェントごとの設定方法と公式ドキュメントを紹介します：

#### Claude Code

- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)

Claude Code では、マーケットプレイス経由または起動オプション・プロジェクト設定を通じてプロジェクト単位で導入できます：

1. **マーケットプレイス経由（プロジェクトスコープ）**:
   ```bash
   claude plugin marketplace add --scope project "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install --scope project jijmodeling
   ```
2. **プロジェクト設定または起動オプション**:
   プロジェクトの `.claude/plugins/jijmodeling` にシンボリックリンクを配置するか、起動オプションで直接指定します：
   ```bash
   mkdir -p .claude/plugins
   ln -s "$(uv run jijmodeling plugin path)" .claude/plugins/jijmodeling
   ```
   一時的なセッションでのみ利用する場合は、起動オプションで指定することも可能です：
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

#### OpenAI Codex

- [OpenAI プラットフォーム公式ドキュメント](https://platform.openai.com/docs)

Codex はプロジェクトルートから作業ディレクトリまでの `.agents/skills` を自動検出します。プロジェクト単位で JijModeling を導入するには、プロジェクトの `.agents/skills` にシンボリックリンクを作成するのが最も確実です：

```bash
mkdir -p .agents/skills
ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
```

:::{admonition} Codex CLI コマンドのスコープと設定ファイルについて
:class: note
Codex の CLI コマンド（`codex plugin marketplace add` や `codex plugin add`）は、現時点ではプロジェクト単位のオプション（`--scope project` など）を持たず、ユーザー環境全体（`~/.codex/config.toml`）に登録されます。プラグインとしてプロジェクト単位で管理したい場合は、プロジェクトの `.codex/config.toml` に `[marketplaces.jijmodeling]` と `[plugins."jijmodeling@jijmodeling"]` を直接記述します。
:::

#### Cursor

- [Cursor 公式ドキュメント](https://docs.cursor.com/)（[Rules for AI](https://docs.cursor.com/context/rules-for-ai)）

Cursor は、プロジェクト（ワークスペース）の `.agents/skills` および `.cursor/skills` を自動検出します。プロジェクト単位で導入するには、これらのディレクトリにシンボリックリンクを作成します：

```bash
mkdir -p .agents/skills
ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
```

（`.cursor/skills` を利用する場合も同様に `ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling` と配置できます。）

:::{admonition} Cursor のプラグイン検出について
:class: note
Cursor はワークスペース直下の `.cursor/plugins` ディレクトリからの自動検出には対応していません。プロジェクトローカルに JijModeling のルールやスキルを認識させるには、上記のように `.agents/skills` または `.cursor/skills` を使用してください。
:::

#### GitHub Copilot および VSCode

- [GitHub Copilot 公式ドキュメント](https://docs.github.com/en/copilot)
- [Visual Studio Code Copilot 公式ドキュメント](https://code.visualstudio.com/docs/copilot/overview)

VSCode や GitHub Copilot で利用する場合：

1. **GitHub CLI (`gh skill`) を利用する場合**:
   [GitHub CLI](https://cli.github.com/) は[バージョン 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0) 以降から `gh skill` サブコマンドとしてスキルマネージャの機能を提供しています。`--scope project` オプションを付けてプロジェクト単位でインストールします：
   ```bash
   gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
   ```
   オプションの詳細は、[gh skill install のマニュアル](https://cli.github.com/manual/gh_skill_install)を参照してください。
2. **ワークスペース指示ファイルまたは設定画面**:
   プロジェクトの `.vscode/settings.json` や、ワークスペースの `.github/copilot-instructions.md` からプラグインのルールやスキルを参照するように設定します。

:::{admonition} プラグイン設定時の注意点
:class: caution

プロジェクト内にプラグインを設定する場合、以下の点に注意してください：

1. **インストールしたプラグインやスキルは Git にコミットしない（`.gitignore` への追加）**:
   プラグインやスキルを Git にコミットすることは推奨されません。シンボリックリンク方式の場合は各開発者のローカル仮想環境を指しているため他の環境で動作せず、ファイルを直接コピーする方式の場合は JijModeling 本体のバージョン更新に追随できなくなってしまうためです。`.agents/skills/` や `.cursor/skills/`、`.claude/plugins/` などの配置先はプロジェクトの `.gitignore` に追加し、各開発者のローカル環境でのみ設定するようにしてください。
2. **Python バージョン変更や仮想環境再作成時のパス変化**:
   Python のバージョンを切り替えた場合（例: Python 3.12 から 3.13 への変更）や、仮想環境（`.venv`）を再作成した場合は、`site-packages` のパスが変化するため既存のシンボリックリンクが無効になります。この場合は、一度古いリンクを削除して再度 `ln -s "$(uv run jijmodeling plugin path)" ...` を実行してください。
:::

:::{admonition} チーム開発でのヒント
:class: tip

複数人で 1 つのプロジェクトを開発する場合、メンバー各自の環境構築や JijModeling バージョンアップ時の再設定を簡単にするため、プラグインのディレクトリ作成やシンボリックリンク配置を行うインストール用スクリプトを用意して共有しておく運用がおすすめです。
:::

### プラグインの更新

JijModeling をバージョンアップ（例: `uv lock --upgrade-package jijmodeling`）した際は、プラグインの更新も確認してください：
- シンボリックリンク（`ln -s`）を用いている場合、仮想環境内の JijModeling が更新されるとプラグイン内容も自動的に最新になります。ただし、Python のバージョンアップに伴い仮想環境のパスが変わった場合は、前述の通りシンボリックリンクの再作成が必要です。
- ファイルを直接コピーした場合や `claude plugin install` / `gh skill install` で導入した場合は、JijModeling 更新後に再度コマンドを実行して最新バージョンに同期してください。

インストール後は、エージェントに JijModeling を使って数理モデルの定式化や修正を行うよう依頼できます。

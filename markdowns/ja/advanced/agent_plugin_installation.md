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
以下では、同梱プラグインの保存場所の確認と、各種コーディングエージェント（Claude Code、Codex、Cursor、GitHub Copilot、VS Code）で利用するための設定方法について説明します。

+++

## エージェントプラグインとは？

**エージェントプラグイン**とは、大規模言語モデル（LLM）に対してドメイン固有の知識やスキル（`SKILL.md`）、ルール、プロンプト、ツールの使い方などをパッケージ化して提供するための仕組みです。
JijModeling 同梱のプラグインは、[Agent Plugins 1.0 仕様](https://agent-plugins.org/)のマニフェスト（`plugin.json`）を使用し、マーケットプレイス経由の導入・更新に必要な Claude Code 用のメタデータも同梱しています。Claude Code と Cursor はこのプラグインを直接読み込めます。Codex、GitHub Copilot、VS Code では、以下の手順で同梱スキルを利用します。

同梱のプラグインには明示的なバージョン番号が付与されており、インストールされている JijModeling パッケージのバージョンと同期しています。
JijModeling に新しい機能や API が追加されると同梱プラグインも更新されるため、利用する JijModeling のバージョンを変更した場合は、プラグインも合わせて更新することをお勧めします。

:::{admonition} プラグインは万能ではない
:class: caution

プラグインは、コーディングエージェントによる JijModeling の利用を補助しますが、**結果的に生成されるコードや定式化が適切であることを保証するものではありません**。
プラグインの役割は、コーディングエージェントが JijModeling を正しくスムーズに書けるよう支援することである点に注意しましょう。
:::

## プラグインのインストール

JijModeling の機能をエージェントに導入する方法には、大きく分けて**プラグイン全体をインストールする方法**と、**スキル（SKILL）を単体でインストールする方法**の 2 つがあります：

1. **プラグイン全体としてのインストール**:
   Agent Plugins 1.0 仕様に準拠したパッケージ（`plugin.json` や各種メタデータ）として導入します。Claude Code のようにローカルマーケットプレイスの登録に対応したエージェントでは、CLI コマンドを用いてプロジェクト単位で簡単にインストールできます。
2. **スキル（SKILL）単体でのインストール**:
   プラグインに同梱されているスキルのディレクトリ全体を配置します。`SKILL.md` に加え、参照資料や使用例も含まれます。Codex や Cursor では、プロジェクトの `.agents/skills` にこのディレクトリへのシンボリックリンクを作成すると、スキルが自動検出されます。

以下では、各パスの確認方法とエージェントごとの具体的な導入手順を説明します。

JijModeling をインストールしたプロジェクトのルートディレクトリで実行してください。コマンド例は Bash などの POSIX 系シェルを想定しています。

### パスの確認

インストール方式に応じて、プラグインまたはスキルの保存場所を取得します。
`uv` で管理されているプロジェクトでは、以下のコマンドを実行します：

- **プラグイン全体のパス**:
  ```bash
  uv run jijmodeling plugin path
  ```
  以下のように、`plugin.json` や `skills/` を含むプラグインディレクトリの絶対パスが 1 行で出力されます：
  ```
  /home/user/my-jm-project/.venv/lib/python3.13/site-packages/jijmodeling/plugins/jijmodeling
  ```
- **マーケットプレイスのパス**:
  ```bash
  uv run jijmodeling plugin marketplace path
  ```
- **スキル単体のパス**:
  ```bash
  uv run jijmodeling skill path
  ```
  同梱スキルのルートディレクトリ（`jijmodeling` サブディレクトリを含むパス）が出力されます。

uv を使っていない場合は、以下のように `python -m` で同様のパスを確認できます：

```bash
python -m jijmodeling plugin path
python -m jijmodeling plugin marketplace path
python -m jijmodeling skill path
```

:::{admonition} スキルマネージャーとの連携
:class: note

`gh skill` など、プラグイン全体ではなく個別のスキルディレクトリを直接指定する必要がある外部ツール向けにも、上記 `jijmodeling skill path` サブコマンドを利用できます。
:::

+++

### 各種コーディングエージェントでの設定

同梱プラグインは、プロジェクトで使用されている JijModeling のバージョンと紐付いています。そのため、ユーザー環境全体ではなく、プロジェクトごとに登録・インストールを行ってください。

以下では、代表的なエージェントごとの設定方法と公式ドキュメントを紹介します：

#### Claude Code

- [Claude Code のプラグインとインストールスコープ](https://code.claude.com/docs/en/plugins-reference)

Claude Code では、ローカルなマーケットプレイスを追加してプロジェクト単位で直接プラグインをインストールできます：

1. **マーケットプレイス経由（プロジェクトスコープ）**:
   ```bash
   claude plugin marketplace add --scope project "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install --scope project jijmodeling
   ```
   プロジェクト設定は `.claude/settings.json` に保存されます。インストール後に `claude plugin list --json` を実行し、`jijmodeling@jijmodeling` のスコープが `project` であることを確認してください。
2. **起動するセッションでのみ利用する場合**:
   プロジェクトのルートで、プラグインのパスを指定して起動します。この方法は起動するたびに指定が必要です：
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

どちらの方法でも、新しいセッションのスラッシュコマンド候補に `/jijmodeling:jijmodeling` が表示されることを確認してください。

#### OpenAI Codex

- [Codex のスキルと検出場所](https://developers.openai.com/codex/skills/)

Codex は、作業ディレクトリから Git リポジトリのルートまでの各階層にある `.agents/skills` を自動検出します。プロジェクトのルートで、同梱スキルへのシンボリックリンクを作成します：

```bash
mkdir -p .agents/skills
ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
```

プロジェクト内で新しい Codex セッションを開始し、CLI の `/skills` または `$` によるスキル候補に JijModeling が表示されることを確認してください。読み込み元のパスが、このプロジェクトのリンク先にある `SKILL.md` と一致することも確認します。

#### Cursor

- [Cursor のスキルと検出場所](https://cursor.com/docs/skills)

Cursor でプロジェクト単位で利用する場合：

1. **スキル単体をインストールする場合（推奨・最も手軽）**:
   Cursor はプロジェクト（ワークスペース）の `.agents/skills` および `.cursor/skills` を自動検出します。スキル単体のシンボリックリンクを作成します：
   ```bash
   mkdir -p .agents/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
   ```
   Cursor 専用の配置先を使う場合は、かわりに以下を実行します。配置先はどちらか一方を選んでください：
   ```bash
   mkdir -p .cursor/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling
   ```
2. **Cursor CLI のセッションでプラグイン全体を利用する場合**:
   プロジェクトのルートで以下を実行します。`--plugin-dir` は Cursor CLI の起動オプションで、起動するたびに指定が必要です：
   ```bash
   agent --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

新しいセッションを開始し、スキル一覧で JijModeling を確認してください。Cursor CLI では、ファイル検索を行わず、セッションに渡された利用可能なスキル一覧から名前と読み込み元のパスを報告するよう依頼できます。スキル単体の場合はプロジェクト内の配置先、`--plugin-dir` の場合は指定したプラグイン内のスキルが表示されることを確認します。

#### GitHub Copilot および VS Code

- [GitHub Copilot CLI のスキル](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [VS Code のスキル](https://code.visualstudio.com/docs/agent-customization/agent-skills)

GitHub Copilot CLI と VS Code は、プロジェクトの `.agents/skills` に配置されたスキルを検出します。[GitHub CLI](https://cli.github.com/) の [2.90.0 以降](https://github.com/cli/cli/releases/tag/v2.90.0)で利用できる `gh skill` を使い、同梱スキルをプロジェクトにコピーします：

```bash
gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
```

対話形式でエージェントを選択するよう求められた場合は、GitHub Copilot を選びます。オプションの詳細は [gh skill install のマニュアル](https://cli.github.com/manual/gh_skill_install)を参照してください。

- **GitHub Copilot CLI**: プロジェクトのルートで以下を実行し、`jijmodeling` の `source` が `project`、`enabled` が `true` で、`path` がこのプロジェクトの `.agents/skills/jijmodeling` を指していることを確認します：
  ```bash
  copilot skill list --json
  ```
- **VS Code**: プロジェクトを開き、コマンドパレットから `Chat: Configure Skills` を実行します。`jijmodeling` が `Workspace` のスキルとして表示されることを確認します。

いずれのエージェントでも、ファイルが存在することに加え、エージェント自身がスキルを検出していることを確認してください。同名のユーザー用スキルがある場合は、読み込み元のパスやスコープを確認し、今回導入したスキルと区別します。

:::{admonition} プラグイン設定時の注意点
:class: caution

プロジェクト内にプラグインを設定する場合、以下の点に注意してください：

1. **環境ごとに配置するファイルを Git の管理対象から除外する**:
   シンボリックリンクは各開発者の仮想環境を指します。実際に使用する配置先（`.agents/skills/jijmodeling` または `.cursor/skills/jijmodeling`）を `.gitignore` に追加してください。スキルのコピーを各開発者が管理する場合も同様です。チームでコピーを共有する場合は、JijModeling の依存バージョンと合わせて更新してください。
   Claude Code のマーケットプレイス登録は `.claude/settings.json` に仮想環境の絶対パスを保存するため、この環境依存の設定も各開発者が追加し、そのローカルパスをコミットしないようにしてください。
2. **Python バージョン変更や仮想環境再作成時のパス変化**:
   Python のバージョン変更や仮想環境の移動・再作成により、パッケージの保存先が変わることがあります。その場合は、古いシンボリックリンクを削除し、利用するエージェントのスキル配置コマンドを再実行してください。Claude Code のマーケットプレイス経由で導入した場合は、マーケットプレイスの追加コマンドで新しいパスを登録してからプラグインを更新します。
:::

:::{admonition} チーム開発でのヒント
:class: tip

複数人で 1 つのプロジェクトを開発する場合、メンバー各自の環境構築や JijModeling バージョンアップ時の再設定を簡単にするため、プラグインのディレクトリ作成やシンボリックリンク配置を行うインストール用スクリプトを用意して共有しておく運用がおすすめです。
:::

### プラグインの更新

まず、プロジェクトの仮想環境内の JijModeling を更新してください。`uv lock --upgrade-package jijmodeling` でロックファイルを更新した場合は、`uv sync` で仮想環境にも反映します。その後、導入方法に応じて以下を実行してください：

- **シンボリックリンク**: リンク先が変わらなければ、更新後のスキルがそのまま参照されます。パスが変わった場合はリンクを作り直してください。
- **Claude Code のマーケットプレイス経由**: 以下の更新コマンドを実行し、Claude Code を再起動してください：
  ```bash
  claude plugin update --scope project jijmodeling@jijmodeling
  ```
- **`gh skill install` によるコピー**: `--force` を付けて、配置済みのスキルを更新後の内容で上書きします：
  ```bash
  gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project --force
  ```
- **手動でコピーした場合**: 更新後のスキルディレクトリ全体をコピーし直してください。
- **`--plugin-dir` による起動**: 更新後のパッケージから取得したパスを指定して、新しいセッションを開始してください。

更新後は新しいセッションを開始し、各エージェントの手順でスキルの検出を再確認してください。確認できたら、JijModeling を使って数理モデルの定式化や修正を行うよう依頼できます。

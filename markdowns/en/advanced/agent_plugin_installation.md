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

# Coding Agent Plugin Installation

JijModeling **2.9.0 and later** includes a plugin to help coding agents formulate, implement, and solve mathematical optimization models using JijModeling.
This chapter explains how to locate the bundled plugin and configure it for your coding agent, including Claude Code, OpenAI Codex, Cursor, GitHub Copilot, and VSCode.

+++

## What are agent plugins?

**Agent plugins** package domain knowledge, skills (`SKILL.md`), rules, prompts, and tool instructions into a bundle that AI coding agents can discover and use.
The `jijmodeling` plugin adheres to open Agent Plugins specifications (including [Agent Plugins 1.0](https://agent-plugins.org/)) and provides manifests for Claude Code, Cursor, and Codex.

The bundled plugin carries an explicit version number that matches the installed JijModeling package version.
As JijModeling gains new features and APIs, the bundled plugin is updated as well. When you change your JijModeling version, we recommend updating the plugin as needed.

:::{admonition} Plugins do not guarantee correctness
:class: caution

Plugins help coding agents use JijModeling, but **they do not guarantee that the generated code works as intended or that the mathematical model is formulated correctly**.
Their role is to help coding agents write valid, idiomatic JijModeling code more effectively.
:::

## Installing the plugin

There are two primary ways to introduce JijModeling to your coding agent: **installing as a full plugin** or **installing the skill standalone**:

1. **Installing as a full plugin**:
   Installs the package conforming to the Agent Plugins 1.0 specification (including `plugin.json` and metadata). In agents that support configuring local marketplaces (such as Claude Code), you can easily install the plugin per project using CLI commands.
2. **Installing the skill standalone**:
   Installs only the bundled skill (`SKILL.md`). In Codex and Cursor, installing as a full plugin per project requires manually writing repository-local configuration files (such as TOML), so installing just the standalone skill into the auto-discovered `.agents/skills/` directory (via a symbolic link) is the simplest and most reliable approach.

The following sections explain how to locate the paths and configure each agent.

### Locating paths

Depending on your installation method, locate the plugin or skill directory.
In a project managed with `uv`, run the following commands:

- **Path to the full plugin**:
  ```bash
  uv run jijmodeling plugin path
  ```
  This prints the absolute path to the directory containing the bundled plugin (`plugin.json` and packaged `skills/`):
  ```
  /home/user/my-jm-project/.venv/lib/python3.13/site-packages/jijmodeling/plugins/jijmodeling
  ```
- **Path to the marketplace**:
  ```bash
  uv run jijmodeling plugin marketplace path
  ```
- **Path to the standalone skill**:
  ```bash
  uv run jijmodeling skill path
  ```
  This prints the path to the directory containing the bundled skills (including the `jijmodeling` subfolder).

If you do not use `uv`, you can find the same paths with:

```bash
python -m jijmodeling plugin path
python -m jijmodeling plugin marketplace path
python -m jijmodeling skill path
```

:::{admonition} Integration with skill managers
:class: note

For external tools like `gh skill` that require pointing directly to a specific skill directory rather than a full plugin, use the `jijmodeling skill path` subcommand shown above.
:::

+++

### Configuring for your coding agent

Because the bundled plugin is tied to the version of JijModeling used in your project, register and install it per project rather than across your entire user environment.

Below are setup instructions and links to the official documentation for supported agents:

#### Claude Code

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)

Claude Code supports adding a local marketplace directly via CLI commands to install the plugin per project:

1. **Via local marketplace (project scope)**:
   ```bash
   claude plugin marketplace add --scope project "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install --scope project jijmodeling
   ```
2. **Via project configuration or launch option**:
   You can link or copy the plugin into `.claude/plugins/jijmodeling` in your project root, or launch Claude Code with `--plugin-dir`:
   ```bash
   mkdir -p .claude/plugins
   ln -s "$(uv run jijmodeling plugin path)" .claude/plugins/jijmodeling
   ```
   For temporary sessions, you can also pass the path at launch:
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

#### OpenAI Codex

- [OpenAI Documentation](https://platform.openai.com/docs)

When using Codex per project, choose one of the following methods:

1. **Installing the standalone skill (recommended, simplest)**:
   Codex automatically discovers `.agents/skills` from the project root down to your current working directory. Creating a symlink for the skill is the easiest approach:
   ```bash
   mkdir -p .agents/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
   ```
2. **Installing as a full plugin**:
   Because Codex CLI commands (`codex plugin marketplace add` and `codex plugin add`) register plugins across the entire user environment (`~/.codex/config.toml`), installing the plugin per project requires manually creating and editing a repository-local `.codex/config.toml`:
   ```bash
   mkdir -p .codex
   cat << EOF >> .codex/config.toml
   [marketplaces.jijmodeling]
   source_type = "local"
   source = "$(uv run jijmodeling plugin marketplace path)"

   [plugins."jijmodeling@jijmodeling"]
   enabled = true
   EOF
   ```

#### Cursor

- [Cursor Documentation](https://docs.cursor.com/) ([Rules for AI](https://docs.cursor.com/context/rules-for-ai))

When using Cursor per project:

1. **Installing the standalone skill (recommended, simplest)**:
   Cursor automatically discovers `.agents/skills` and `.cursor/skills` within the project (workspace). Create a symlink in one of these directories:
   ```bash
   mkdir -p .agents/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
   ```
   (Similarly, you can link it into `.cursor/skills` using `ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling`.)
2. **Installing as a full plugin**:
   Cursor does not automatically discover plugins from a workspace root directory. To load a plugin per project, you must configure repository-local settings manually or launch with `--plugin-dir`. To avoid manual configuration, installing the standalone skill into `.agents/skills` or `.cursor/skills` as shown above is recommended.

#### GitHub Copilot and VSCode

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Visual Studio Code Copilot Documentation](https://code.visualstudio.com/docs/copilot/overview)

In VSCode with GitHub Copilot:

1. **Using GitHub CLI (`gh skill`)**:
   [GitHub CLI](https://cli.github.com/) provides skill management through the `gh skill` subcommand starting with [version 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0). Install it for the project using `--scope project`:
   ```bash
   gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
   ```
   See the [gh skill install manual](https://cli.github.com/manual/gh_skill_install) for details about the options.
2. **Via workspace instructions and GUI settings**:
   In VSCode Settings or via `.github/copilot-instructions.md`, configure Copilot to reference the plugin's rules and guidelines when authoring optimization models.

:::{admonition} Considerations when configuring plugins
:class: caution

When configuring plugins in your project, keep the following points in mind:

1. **Do not commit installed plugins or skills to Git (add to `.gitignore`)**:
   Committing plugins or skills to Git is not recommended. If you use symbolic links, they point to local virtual environments and will not work in other environments (such as other team members' machines or CI). If you copy the files directly into the repository, the plugin will not follow future version upgrades of the JijModeling package. Add configuration directories (such as `.agents/skills/`, `.cursor/skills/`, or `.claude/plugins/`) to your project's `.gitignore` and configure them only in each developer's local environment.
2. **Path changes on Python version upgrades or virtual environment recreation**:
   Upgrading the Python version (e.g. from Python 3.12 to 3.13) or recreating your virtual environment (`.venv`) changes the `site-packages` directory path, breaking existing symlinks. When this happens, remove the old symlink and recreate it with `ln -s "$(uv run jijmodeling plugin path)" ...`.
:::

:::{admonition} Tip for team development
:class: tip

When collaborating on a project with multiple people, you can share a simple setup script that creates directories and configures the symbolic links. This makes it easy for every member to set up their local environment and keep plugins up to date when upgrading JijModeling.
:::

### Updating the plugin

When you update JijModeling in your environment, update the plugin:
- If you used symlinks (`ln -s`), the plugin updates automatically whenever JijModeling is updated in the same virtual environment. However, if Python was upgraded or the virtual environment was recreated, recreate the symlinks as described above.
- If you copied the plugin files or installed via `claude plugin install` or `gh skill install`, repeat the installation command after updating JijModeling to refresh the plugin to match the new package version.

After installation, ask your agent to formulate or modify a model using JijModeling.

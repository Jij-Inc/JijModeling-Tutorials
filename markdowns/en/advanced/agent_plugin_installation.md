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
The `jijmodeling` plugin adheres to open Agent Plugins specifications (including Agent Plugins 1.0) and provides manifests for Claude Code, Cursor, and Codex.

The bundled plugin carries an explicit version number that matches the installed JijModeling package version.
As JijModeling gains new features and APIs, the bundled plugin is updated as well. When you change your JijModeling version, we recommend updating the plugin as needed.

:::{admonition} Plugins do not guarantee correctness
:class: caution

Plugins help coding agents use JijModeling, but **they do not guarantee that the generated code works as intended or that the mathematical model is formulated correctly**.
Their role is to help coding agents write valid, idiomatic JijModeling code more effectively.
:::

## Installing the plugin

The following sections explain how to discover and install the plugin bundled with JijModeling.

### Find the plugin path

Before setting up the plugin, locate it using the JijModeling CLI.
In a project managed with `uv`, run the following command to find the path to the bundled plugin:

```bash
uv run jijmodeling plugin path
```

The command prints the absolute path to the directory containing the bundled plugin (`plugin.json` and the packaged `skills/`) on a single line, for example:

```
/home/user/my-jm-project/.venv/lib/python3.13/site-packages/jijmodeling/plugins/jijmodeling
```

To locate the plugin marketplace directory (which contains marketplace manifests for agents that support local marketplaces):

```bash
uv run jijmodeling plugin marketplace path
```

If you do not use `uv`, you can find the same paths with:

```bash
python -m jijmodeling plugin path
python -m jijmodeling plugin marketplace path
```

:::{admonition} Integration with skill managers
:class: note

For tools that require specifying an individual skill directory directly rather than an entire plugin (such as `gh skill`), the `jijmodeling skill path` subcommand is also provided:

```bash
uv run jijmodeling skill path
```
:::

+++

### Configuring for your coding agent

The bundled plugin works with major coding agents. Choose the setup appropriate for your environment.
In addition to running CLI commands, editors such as Cursor and VSCode also provide graphical settings (Settings UI, Rules, or Extension configuration) where you can specify plugin or skill directories.

Below are setup instructions and links to the official documentation for supported agents:

#### Claude Code

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)

Claude Code supports plugins via local marketplaces or project configuration:

1. **Via local marketplace**:
   ```bash
   claude plugin marketplace add "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install jijmodeling
   ```
2. **Via project configuration or launch option**:
   You can link or copy the plugin into `.claude/plugins/jijmodeling` in your project root, or launch Claude Code with `--plugin-dir`:
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

#### OpenAI Codex

- [OpenAI Documentation](https://platform.openai.com/docs)

Codex discovers agent plugins and skills from `.codex/plugins` or `.agents/plugins`:

```bash
mkdir -p .codex/plugins
ln -s "$(uv run jijmodeling plugin path)" .codex/plugins/jijmodeling
```

#### Cursor

- [Cursor Documentation](https://docs.cursor.com/) ([Rules for AI](https://docs.cursor.com/context/rules-for-ai))

Cursor supports agent plugins, rules, and skills at the project or user level:

1. **Via symlinks**:
   To install the `jijmodeling` plugin in your project:
   ```bash
   mkdir -p .cursor/plugins
   ln -s "$(uv run jijmodeling plugin path)" .cursor/plugins/jijmodeling
   ```
   Alternatively, you can link the bundled skill into `.cursor/skills/`:
   ```bash
   mkdir -p .cursor/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling
   ```
2. **Via GUI settings**:
   In Cursor Settings (Cursor Settings > Rules / Features), you can specify custom rules or directories for plugins and skills.

#### GitHub Copilot and VSCode

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Visual Studio Code Copilot Documentation](https://code.visualstudio.com/docs/copilot/overview)

In VSCode with GitHub Copilot:

1. **Using GitHub CLI (`gh skill`)**:
   [GitHub CLI](https://cli.github.com/) provides skill management through the `gh skill` subcommand starting with [version 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0). Run:
   ```bash
   gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
   ```
   See the [gh skill install manual](https://cli.github.com/manual/gh_skill_install) for details about the options.
2. **Via workspace instructions and GUI settings**:
   In VSCode Settings or via `.github/copilot-instructions.md`, configure Copilot to reference the plugin's rules and guidelines when authoring optimization models.

:::{admonition} Considerations when configuring plugins
:class: caution

When configuring plugins in your project, keep the following points in mind:

1. **Do not commit installed plugins to Git (add to `.gitignore`)**:
   Committing plugins to Git is not recommended. If you use symbolic links, they point to local virtual environments and will not work in other environments (such as other team members' machines or CI). If you copy the files directly into the repository, the plugin will not follow future version upgrades of the JijModeling package. Add agent plugin directories (such as `.cursor/plugins/` or `.claude/plugins/`) to your project's `.gitignore` and configure them only in each developer's local environment.
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

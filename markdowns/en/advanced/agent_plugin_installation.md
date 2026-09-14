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

JijModeling **2.9.0 and later** includes an agent plugin to help coding agents formulate, implement, and solve mathematical optimization models using JijModeling.
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

## Plugin discovery and installation

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

The bundled plugin works with major coding agents. In addition to running commands manually, you can also set up the plugin using the following methods:

- **Direct prompting**: In your agent's chat interface, provide the path output by `uv run jijmodeling plugin path` and prompt: "Please install the plugin at this path into the current project." The agent can create directories and symlinks automatically.
- **GUI settings screens**: Editors such as Cursor and VSCode provide graphical settings (Settings UI, Rules, or Extension configuration) where you can specify plugin or skill directories.

Below are setup instructions and links to the official documentation for supported agents:

#### Claude Code

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)

Claude Code supports plugins via local marketplaces, project configurations, or direct prompts:

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
3. **Via prompt**:
   In Claude Code, you can ask the agent: "Please add the plugin at `$(uv run jijmodeling plugin path)` to this project."

#### Cursor

- [Cursor Documentation](https://docs.cursor.com/) ([Rules for AI](https://docs.cursor.com/context/rules-for-ai))

In Cursor, you can set up plugins using the CLI, the GUI settings UI, or by prompting the Cursor Agent:

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
3. **Via prompt**:
   In the Cursor Agent chat, ask the agent: "Please link the plugin at `$(uv run jijmodeling plugin path)` into `.cursor/plugins/`."

#### OpenAI Codex

- [OpenAI Documentation](https://platform.openai.com/docs)

Codex discovers agent plugins and skills from `.codex/plugins` or `.agents/plugins`:

1. **Via symlinks**:
   ```bash
   mkdir -p .codex/plugins
   ln -s "$(uv run jijmodeling plugin path)" .codex/plugins/jijmodeling
   ```
2. **Via prompt**:
   You can also prompt Codex in the chat to configure the plugin using the discovered path.

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
3. **Via Copilot Chat prompt**:
   In Copilot Chat, you can prompt the agent to inspect the plugin path and update your workspace instructions or symlinks accordingly.

### Updating the plugin

When you update JijModeling in your environment, update the plugin:
- If you used symlinks (`ln -s`), the plugin updates automatically whenever JijModeling is updated in the virtual environment.
- If you copied the plugin files or installed via `claude plugin install` or `gh skill install`, repeat the installation command after updating JijModeling to refresh the plugin to match the new package version.

After installation, ask your agent to formulate or modify a model using JijModeling.

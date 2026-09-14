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

**Agent plugins** package domain knowledge, skills (`SKILL.md`), rules, prompts, and tool instructions into a versioned bundle that AI coding agents can discover and use.
The `jijmodeling` plugin adheres to open Agent Plugins standards (including Agent Plugins 1.0) and provides manifests for Claude Code, Cursor, and Codex.

### Explicit version synchronization

Unlike unversioned prompt snippets or static copies, the `jijmodeling` plugin carries an **explicit version number** that is synchronized with the installed JijModeling Python library release.
Because JijModeling evolves continuously with new modeling constructs, APIs, and solver integrations, the bundled plugin remains in lockstep with the exact version of the library installed in your virtual environment. When you upgrade JijModeling (e.g. via `uv lock --upgrade-package jijmodeling`), the plugin updates alongside it.

:::{admonition} Plugins do not guarantee correctness
:class: caution

Plugins help coding agents use JijModeling effectively, but **they do not guarantee that the generated code works as intended or that the mathematical model is formulated correctly**.
Their role is to guide coding agents to write valid, idiomatic JijModeling code and adhere to best practices.
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

:::{note} Backward compatibility for skill managers
If your tooling specifically expects an agent skills directory (such as `gh skill`), `jijmodeling skill path` remains available:

```bash
uv run jijmodeling skill path
```
:::

+++

### Configuring for your coding agent

The bundled plugin works with major coding agents. Choose the setup appropriate for your environment:

#### Claude Code

Claude Code supports plugins via local marketplaces or direct project paths:

1. **Via local marketplace**:
   ```bash
   claude plugin marketplace add "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install jijmodeling
   ```
2. **Via project configuration**:
   You can link or copy the plugin into `.claude/plugins/jijmodeling` in your project root, or launch Claude Code with `--plugin-dir`:
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

#### Cursor

Cursor supports agent plugins, rules, and skills at the project or user level.
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

#### OpenAI Codex

Codex discovers agent plugins and skills from `.codex/plugins` or `.agents/plugins`.
In your project directory:

```bash
mkdir -p .codex/plugins
ln -s "$(uv run jijmodeling plugin path)" .codex/plugins/jijmodeling
```

#### GitHub Copilot and VSCode

In VSCode with GitHub Copilot, you can supply workspace agent skills and instructions:

1. **Using GitHub CLI (`gh skill`)**:
   [GitHub CLI](https://cli.github.com/) provides skill management through the `gh skill` subcommand starting with [version 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0). Run:
   ```bash
   gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
   ```
   See the [gh skill install manual](https://cli.github.com/manual/gh_skill_install) for details about the options.
2. **Via workspace instructions**:
   Reference or link the plugin rules in your workspace configuration (`.github/copilot-instructions.md` or `.vscode/` settings) to guide Copilot when authoring optimization models.

### Updating the plugin

When you update JijModeling in your environment, update the plugin:
- If you used symlinks (`ln -s`), the plugin updates automatically whenever JijModeling is updated in the virtual environment.
- If you copied the plugin files or installed via `claude plugin install` or `gh skill install`, repeat the installation command after updating JijModeling to refresh the plugin to match the new package version.

After installation, ask your agent to formulate or modify a model using JijModeling.

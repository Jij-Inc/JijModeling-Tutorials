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
This chapter explains how to locate the bundled plugin and configure it for Claude Code, OpenAI Codex, Cursor, GitHub Copilot, and VS Code.

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
   Places the entire bundled skill directory, including `SKILL.md`, reference material, and examples. Codex and Cursor automatically discover the skill when you create a symbolic link to this directory in the project's `.agents/skills` directory.

The following sections explain how to locate the paths and configure each agent.

Run the commands from the root of the project where JijModeling is installed. The examples assume a POSIX-style shell such as Bash.

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

- [Claude Code plugins and installation scopes](https://code.claude.com/docs/en/plugins-reference)

Claude Code supports adding a local marketplace directly via CLI commands to install the plugin per project:

1. **Via local marketplace (project scope)**:
   ```bash
   claude plugin marketplace add --scope project "$(uv run jijmodeling plugin marketplace path)"
   claude plugin install --scope project jijmodeling
   ```
   Project settings are saved in `.claude/settings.json`. After installation, run `claude plugin list --json` and confirm that `jijmodeling@jijmodeling` has scope `project`.
2. **For the session being launched only**:
   From the project root, pass the plugin path when starting Claude Code. Supply this option each time you launch a session:
   ```bash
   claude --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

With either method, confirm that `/jijmodeling:jijmodeling` appears in the slash-command suggestions in a new session.

#### OpenAI Codex

- [Codex skills and discovery locations](https://developers.openai.com/codex/skills/)

Codex automatically discovers `.agents/skills` in each directory from your working directory up to the Git repository root. From the project root, create a symbolic link to the bundled skill:

```bash
mkdir -p .agents/skills
ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
```

Start a new Codex session in the project and confirm that JijModeling appears in the CLI's `/skills` picker or the skill suggestions shown when you type `$`. Also check that the loaded path matches the `SKILL.md` targeted by this project's symbolic link.

#### Cursor

- [Cursor skills and discovery locations](https://cursor.com/docs/skills)

When using Cursor per project:

1. **Installing the standalone skill (recommended, simplest)**:
   Cursor automatically discovers `.agents/skills` and `.cursor/skills` within the project (workspace). Create a symlink in one of these directories:
   ```bash
   mkdir -p .agents/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .agents/skills/jijmodeling
   ```
   To use a Cursor-specific location, run the following instead. Choose one of these two locations:
   ```bash
   mkdir -p .cursor/skills
   ln -s "$(uv run jijmodeling skill path)/jijmodeling" .cursor/skills/jijmodeling
   ```
2. **Using the full plugin in a Cursor CLI session**:
   Run the following from the project root. `--plugin-dir` is a Cursor CLI launch option; supply it each time you launch a session:
   ```bash
   agent --plugin-dir "$(uv run jijmodeling plugin path)"
   ```

Start a new session and check the skill list for JijModeling. In Cursor CLI, you can ask the agent to report the name and source path from the available-skills list supplied to the session, without searching files. For the standalone skill, confirm the project-local path; for `--plugin-dir`, confirm the skill comes from the specified plugin.

#### GitHub Copilot and VS Code

- [GitHub Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [VS Code skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)

GitHub Copilot CLI and VS Code discover skills in the project's `.agents/skills` directory. Use `gh skill`, available in [GitHub CLI](https://cli.github.com/) [2.90.0 and later](https://github.com/cli/cli/releases/tag/v2.90.0), to copy the bundled skill into the project:

```bash
gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
```

If prompted to choose an agent interactively, select GitHub Copilot. See the [gh skill install manual](https://cli.github.com/manual/gh_skill_install) for details about the options.

- **GitHub Copilot CLI**: From the project root, run the following and confirm that `jijmodeling` has `source: "project"`, `enabled: true`, and a `path` pointing to this project's `.agents/skills/jijmodeling`:
  ```bash
  copilot skill list --json
  ```
- **VS Code**: Open the project and run `Chat: Configure Skills` from the Command Palette. Confirm that `jijmodeling` appears as a `Workspace` skill.

For every agent, confirm that the agent itself discovers the skill as well as checking that the files exist. If a user-level skill has the same name, check the source path or scope to distinguish it from the skill installed here.

:::{admonition} Considerations when configuring plugins
:class: caution

When configuring plugins in your project, keep the following points in mind:

1. **Exclude environment-specific installation files from Git**:
   Symbolic links point to each developer's virtual environment. Add the location you actually use (`.agents/skills/jijmodeling` or `.cursor/skills/jijmodeling`) to `.gitignore`. Do the same for skill copies managed separately by each developer. If your team shares a checked-in copy, update it alongside the project's JijModeling dependency version.
   Claude Code's marketplace registration stores an absolute virtual-environment path in `.claude/settings.json`. Each developer should add this environment-specific setting locally and keep that local path out of commits.
2. **Path changes on Python version upgrades or virtual environment recreation**:
   Changing Python versions or moving or recreating a virtual environment can change the package's location. If the path changes, remove the old symbolic link and repeat your agent's skill placement commands. For a Claude Code marketplace installation, register the new path with the marketplace-add command before updating the plugin.
:::

:::{admonition} Tip for team development
:class: tip

When collaborating on a project with multiple people, you can share a simple setup script that creates directories and configures the symbolic links. This makes it easy for every member to set up their local environment and keep plugins up to date when upgrading JijModeling.
:::

### Updating the plugin

First update JijModeling in the project's virtual environment. If you update the lockfile with `uv lock --upgrade-package jijmodeling`, run `uv sync` to apply the change to the virtual environment. Then follow the instructions for your installation method:

- **Symbolic link**: The link references the updated skill as long as the target path stays the same. Recreate the link if the path changes.
- **Claude Code marketplace installation**: Run the update command below, then restart Claude Code:
  ```bash
  claude plugin update --scope project jijmodeling@jijmodeling
  ```
- **Copy installed with `gh skill install`**: Add `--force` to overwrite the installed skill with the updated contents:
  ```bash
  gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project --force
  ```
- **Manual copy**: Replace the entire skill directory with a fresh copy.
- **Launch with `--plugin-dir`**: Start a new session using the path returned by the updated package.

After updating, start a new session and repeat your agent's skill discovery check. Once the skill is discovered, ask your agent to formulate or modify a model using JijModeling.

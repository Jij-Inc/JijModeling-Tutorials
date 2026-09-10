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

# Coding Agent Skill Installation

JijModeling **2.9.0 and later** includes a skill to help coding agents formulate and solve mathematical optimization models using JijModeling.
This chapter briefly explains how to locate the bundled skill and install it for your coding agent, such as Claude Code, Codex, or Cursor, using an existing skill manager.

+++

## What are agent skills?

**Agent skills** are documents containing instructions that guide large language models through specific tasks and explain how to use tools.
Many coding agents support installing skills for individual projects or for a user across projects.

The agent skill bundled with JijModeling follows the [Agent Skills specification](https://agentskills.io/specification) and can be used with a variety of existing coding agents, including Claude Code and Codex.

The bundled skill is updated as JijModeling gains new features. When you change your JijModeling version, we recommend repeating the installation steps described below to update the skill as needed.

:::{admonition} Skills do not guarantee correctness
:class: caution

Skills help coding agents use JijModeling, but **they do not guarantee that the generated code works as intended or that the model is formulated correctly**.
Their role is to help coding agents write JijModeling code more effectively.
:::

## Skill installation

The following sections explain how to install the skill bundled with JijModeling.

### Find the skill path

Before installing the skill, you need to locate it.
In a project managed with `uv`, run the following command to find the path to the skills bundled with JijModeling:

```bash
uv run jijmodeling skill path
```

The command prints the absolute path to the directory containing the bundled skills on a single line, for example:

```
/home/user/my-jm-project/.venv/lib/python3.13/site-packages/jijmodeling/.agents/skills
```

If you do not use uv, you can find the same path with:

```bash
python -m jijmodeling skill path
```

+++

### Installation

Copy the files under the directory printed by the `jijmodeling skill path` command according to your agent's documentation. The skills will then be available for the agent to use automatically the next time it starts.

A **skill manager** makes installation more convenient: you specify which agent(s) should use the skill and whether to install it for a project or for your user account, and the manager handles the installation.
Several skill managers are available; the following example uses the widely used GitHub CLI.

#### GitHub CLI example

[GitHub CLI](https://cli.github.com/) provides skill management through the `gh skill` subcommand starting with [version 2.90.0](https://github.com/cli/cli/releases/tag/v2.90.0).
Before trying the commands below, follow the links above to install GitHub CLI 2.90.0 or later (the `gh` command) in your environment.

Run the following command in your uv-based optimization project to interactively select the target agent and installation scope (project or user) in your terminal:

```bash
gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local
```

You can also specify the agent or scope using command-line options. For example, to set the scope to the current project:

```bash
gh skill install "$(uv run jijmodeling skill path)" jijmodeling --from-local --scope project
```

See the [gh skill install manual](https://cli.github.com/manual/gh_skill_install) for details about the options.

After installation, ask your agent to use the `jijmodeling` skill to formulate or modify a model.

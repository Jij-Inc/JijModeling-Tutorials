# Tutorial and Learning materials for JijModeling 

[![Book-EN](https://img.shields.io/badge/Book-English-blue)](https://jij-inc-jijmodeling-tutorials-en.readthedocs-hosted.com/en/jijmodeling1/introduction.html)
[![Book-JA](https://img.shields.io/badge/Book-日本語-blue)](https://jij-inc-jijmodeling-tutorials-ja.readthedocs-hosted.com/ja/jijmodeling1/introduction.html)
[![Discord-EN](https://img.shields.io/badge/Discord-English-default?logo=Discord)](https://discord.gg/bcP4g4ar6J)
[![Discord-JP](https://img.shields.io/badge/Discord-日本語-default?logo=Discord)](https://discord.gg/34WkHwvY3Y)

Public repository for the JijModeling project.

- Note that JijModeling is not an OSS project, and source code is not available.
- This repository is for documentation and learning resources.
  - The contents of this repository (not including `jijmodeling` itself) are CC0 public domain.

Build Jupyter Book
-------------------

There are Jupyter Books in both Japanese and English.

| Language | Path | GitHub Pages |
|----------|------|--------------|
| English  | [docs/en](./docs/en) | [![Book-EN](https://img.shields.io/badge/Book-English-blue)](https://jij-inc-jijmodeling-tutorials-en.readthedocs-hosted.com/en/jijmodeling1/introduction.html) |
| 日本語   | [docs/ja](./docs/ja) | [![Book-JA](https://img.shields.io/badge/Book-日本語-blue)](https://jij-inc-jijmodeling-tutorials-ja.readthedocs-hosted.com/ja/jijmodeling1/introduction.html) |

Each notebook is managed independently and translated manually.

### For Developer

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), [task](https://taskfile.dev/installation/) and [yq](https://mikefarah.gitbook.io/yq) for development.

`task` commands can be used to easily execute tasks such as building documentation and adding release notes. To see what `task` commands are available, use the following command:

```shell
task -l
```

# Tutorial and Learning materials for JijModeling 

[![Book-EN](https://img.shields.io/badge/Book-English-blue)](https://jij-inc.github.io/JijModeling-Tutorials/en)
[![Book-JA](https://img.shields.io/badge/Book-日本語-blue)](https://jij-inc.github.io/JijModeling-Tutorials/ja)
[![Discord-EN](https://img.shields.io/badge/Discord-English-default?logo=Discord)](https://discord.gg/bcP4g4ar6J)
[![Discord-JP](https://img.shields.io/badge/Discord-日本語-default?logo=Discord)](https://discord.gg/2wNHCbfG)

Public repository for the JijModeling project.

- Note that JijModeling is not an OSS project, and source code is not available.
- This repository is for documentation and learning resources.
  - The contents of this repository (not including `jijmodeling` itself) are CC0 public domain.

Build Jupyter Book
-------------------

There are Jupyter Books in both Japanese and English.

| Language | Path | GitHub Pages |
|----------|------|--------------|
| English  | [docs/en](./docs/en) | [![Book-EN](https://img.shields.io/badge/Book-English-blue)](https://jij-inc.github.io/JijModeling-Tutorials/en) |
| 日本語   | [docs/ja](./docs/ja) | [![Book-JA](https://img.shields.io/badge/Book-日本語-blue)](https://jij-inc.github.io/JijModeling-Tutorials/ja) |

Each notebook is managed independently and translated manually.

### Build

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and [task](https://taskfile.dev/installation/).

```shell
task book_ja
```

This command builds the Japanese version of the book in `docs/ja/_build/html` and automatically opens it in the browser. To only build the book, use `build_book_ja` task instead. Available tasks are as follows:

```text
$ task -l
task: Available tasks for this project:
* book_en:                 Build and open the English version of the book
* book_en_all:             Build and open the English version of the book (force rebuild all notebooks)
* book_ja:                 Build and open the Japanese version of the book
* book_ja_all:             Build and open the Japanese version of the book (force rebuild all notebooks)
* build_book_en:           Build the English version of the book
* build_book_en_all:       Build the English version of the book (force rebuild all notebooks)
* build_book_ja:           Build the Japanese version of the book
* build_book_ja_all:       Build the Japanese version of the book (force rebuild all notebooks)
* open_book_en:            Open the English version of the book
* open_book_ja:            Open the Japanese version of the book
* watch_book_en:           Watch English notebooks and auto-rebuild of the book
* watch_book_ja:           Watch Japanese notebooks and auto-rebuild of the book
```

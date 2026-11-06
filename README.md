# Learning materials for JijModeling 

[![DeepWiki](https://img.shields.io/badge/DeepWiki-Jij--Inc%2FJijModeling--Tutorials-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/Jij-Inc/JijModeling-Tutorials)


This repository provides learning materials for JijModeling. While JijModeling itself is not open source, the contents of this repository are in the CC0 public domain. The materials is available in both English and Japanese versions, each deployed to [Read The Docs](https://about.readthedocs.com/).

| Language | Path | Read The Docs |
|----------|------|--------------|
| English  | [docs/en](./docs/en) | [![Book-EN](https://img.shields.io/badge/Read_The_Docs-English-blue)](https://jij-inc-jijmodeling-tutorials-en.readthedocs-hosted.com/en/) |
| 日本語   | [docs/ja](./docs/ja) | [![Book-JA](https://img.shields.io/badge/Read_The_Docs-日本語-blue)](https://jij-inc-jijmodeling-tutorials-ja.readthedocs-hosted.com/ja/) |

For questions about JijModeling, we provide community support through the following Discord channels. Please feel free to join us.

| Language | Discord |
|----------|---------|
| English  | [![Discord-EN](https://img.shields.io/badge/Discord-English-default?logo=Discord)](https://discord.gg/bcP4g4ar6J) |
| 日本語   | [![Discord-JP](https://img.shields.io/badge/Discord-日本語-default?logo=Discord)](https://discord.gg/34WkHwvY3Y) |


## For contributors

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), [Task](https://taskfile.dev/installation/), and Node.js 22. From the repository root, run:

```sh
uv sync --locked --extra dev
```

### Edit and preview a tutorial

Each tutorial has a Markdown source in `markdowns/en/` or `markdowns/ja/` and a paired notebook at the same relative path in `docs/en/` or `docs/ja/`. After editing a tutorial, synchronize the pair and include both files in your pull request. For example:

```sh
uv run jupytext --sync --execute markdowns/en/quickstart/scip.md
task watch_book_en
```

Use `task watch_book_ja` for the Japanese book. To preview an HTML export, run `task build_book_en` followed by `task open_book_en` (or the corresponding `_ja` tasks).

When adding a chapter, list its notebook in the language's `toc.yml`. For an external API link, use the inventory names in that language's `myst.yml`, for example ``[`Problem`](xref:api_reference#jijmodeling.Problem)``.

### Check your changes

```sh
task check_paired_notebooks
task check_book_en
task check_book_ja
```

The book checks execute the tutorials and use MyST strict mode by default. For changes to the notebook plugins, also run `node --test plugins/*.test.mjs`.

### Release notes

Run `task create_unreleased_notes` to create the English and Japanese drafts. Edit the paired Markdown files and run `task sync_unreleased`. When the version is known, run `task finalize_release_notes -- <VERSION>` and `task check_release_toc` before merging to `main`. Use `task test_release_toc` when changing the release scripts.

For published URL changes, see the [Read the Docs redirect instructions](deployment/README.md).

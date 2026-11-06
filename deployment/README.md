# Redirect published book URLs on Read the Docs

Use [readthedocs-redirects.json](readthedocs-redirects.json) when switching a published site from Jupyter Book 1 to Jupyter Book 2. The English and Japanese books are separate Read the Docs projects. Each project needs its own copy of the rules.

Paths in the file are relative to the language and version prefix, such as `/en/latest/`. The new URLs preserve the folders, use trailing slashes, and normalize underscores and periods to hyphens.

| Old path | New path |
| --- | --- |
| `quickstart/scip.html` | `quickstart/scip/` |
| `basics/decision_variables.html` | `basics/decision-variables/` |
| `releases/jijmodeling-2.11.0.html` | `releases/jijmodeling-2-11-0/` |
| `introduction.html` | the book root |

1. Verify each destination on the pull request preview. For links to a heading or cell, check the fragment as well.
2. At production rollout, add the page rules through **Admin → Redirects** in each project or submit each rule to its redirects API. Keep `force: false` so an existing page takes precedence.
3. Check the old URLs on each published site. Use the same dashboard or API to disable or remove a rule if needed.

Read the Docs applies project redirects on published sites. PR previews serve the new paths directly. The repository builds and CI leave redirect management to the maintainer.

See the [Jupyter Book URL migration guide](https://jupyterbook.org/latest/resources/upgrade/#how-to-handle-url-changes) and the [Read the Docs redirect documentation](https://docs.readthedocs.com/platform/stable/guides/redirects.html).

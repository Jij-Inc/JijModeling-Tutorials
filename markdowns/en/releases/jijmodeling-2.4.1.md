---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling 2.4.1 Release Notes

## Bugfixes

+++

### Fixed deserialization of Constraints

When using `from_protobuf`, `Constraint`s were not deserialized correctly, which
lead to a "does not have a shape" error when using the problem in `eval`. This has been fixed.

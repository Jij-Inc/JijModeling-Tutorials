---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.3
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Add `fixed_variables` keyword argument to `generate_random_instance`

Added a keyword arugment to specify `fixed_variabes` to be passed to `eval` when using `generate_random_instance`.

+++

## Bugfixes

+++

### Bugfix 1: Fixed `min` folding to `max` during OMMX compilation

Fixed a bug where {py:func}`~jijmodeling.min` over constants incorrectly computed the maximum value when compiling to OMMX.

### Bugfix 2: Fixed models containing the {py:func}`~jijmodeling.count` function failing to serialize

Fixed an issue where using the {py:func}`~jijmodeling.count` function on a CategoryLabel in a model caused an unexpected runtime error during serialization to Protobuf format.

## Other Changes

- Change 1

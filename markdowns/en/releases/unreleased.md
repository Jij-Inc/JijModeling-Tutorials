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


## Other Changes

- Change 1

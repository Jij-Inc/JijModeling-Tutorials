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

# JijModeling 2.6.0 Release Notes

+++

## Feature Enhancements

+++

### Add `fixed_variables` keyword argument to `generate_random_instance`

Added a keyword arugment to specify `fixed_variabes` to be passed to `eval` when using `generate_random_instance`.

### Error Codes and Comprehensive Error Guide

Starting with this release, all error messages now include an error code, as shown below.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("Test Problem")
N = problem.Natural("N")
x = problem.BinaryVar("x", shape=(N,))
try:
    problem += x
except Exception as e:
    print(e)
```

The `E-TE0004` inside `[]` corresponds to the individual error message.

An index is also now available that summarizes possible causes and solutions for each error code.

You can access each individual code at URLs such as https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/error_codes/error/E-TE0004.html.
In some terminals, the `[E-TE0004]` portion in an error message like the one above is hyperlinked so that you can open it directly.
The full list of errors and category-by-category overviews are available at https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/error_codes/index.html.

+++

## Bugfixes

+++

### Bugfix 1: Fixed `min` folding to `max` during OMMX compilation

Fixed a bug where {py:func}`~jijmodeling.min` over constants incorrectly computed the maximum value when compiling to OMMX.

### Bugfix 2: Fixed models containing the {py:func}`~jijmodeling.count` function failing to serialize

Fixed an issue where using the {py:func}`~jijmodeling.count` function on a CategoryLabel in a model caused an unexpected runtime error during serialization to Protobuf format.

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

# JijModeling X.XX.X Release Notes

+++

## Feature Enhancements

+++

### Feature 1

+++

## Bugfixes

+++

### Major performance improvement in constraint detection

Constraint detection has been significantly accelerated. Models that previously did not finish even after an hour can now complete within one second.
If you disabled constraint detection by setting `constraint_detection=False` in {py:meth}`jijmodeling.Problem.eval` or {py:meth}`jijmodeling.Compiler.eval_problem` for performance reasons, try running them again with constraint detection enabled by omitting the `constraint_detection` option.

## Other Changes

- Change 1

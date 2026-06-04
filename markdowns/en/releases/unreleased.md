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

### Error codes

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

<!-- FIXME: Change to the final URL -->
An index is also now available that summarizes possible causes and solutions for each error code.
You can access each individual code at URLs such as https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/errors/E-TE0004.html, and in some terminals, the `[E-TE0004]` part is hyperlinked so that you can open it directly.
The full list of errors is available at https://jij-inc-jijmodeling.readthedocs-hosted.com/en/stable/errors/index.html.

+++

## Bugfixes

+++

### Bugfix 1


## Other Changes

- Change 1

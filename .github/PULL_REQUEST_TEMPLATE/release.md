# Checklist

- [ ] Check if the new version is uploaded to [PyPI](https://pypi.org/project/jijmodeling/).
- [ ] Update `develop` branch so that:
  + [ ] Run `uv sync --upgrade`
  + [ ] `uv pip compile pyproject.toml -o requirements.txt --upgrade` to regenerate `requirements.txt`
  + [ ] Finalize unreleased release notes by `task finalize_release_notes -- <VERSION>`
- [ ] Create a merge commit from `develop` into `main` branch in [`JijModeling-Tutorials`](https://github.com/Jij-Inc/JijModeling-Tutorials)

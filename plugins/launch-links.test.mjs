import assert from 'node:assert/strict';
import test from 'node:test';
import { launchLinks } from './launch-links.mjs';

test('launches the current notebook in each language', () => {
  for (const language of ['en', 'ja']) {
    const links = launchLinks(
      `https://github.com/Jij-Inc/JijModeling-Tutorials/edit/main/docs/${language}/quickstart/scip.ipynb`,
      { repo: 'Jij-Inc/JijModeling-Tutorials', ref: 'main' },
    );
    const binder = new URL(links.binder);
    assert.equal(binder.pathname, '/v2/gh/Jij-Inc/JijModeling-Tutorials/main');
    assert.equal(binder.searchParams.get('urlpath'), `lab/tree/docs/${language}/quickstart/scip.ipynb`);
    assert.equal(links.colab, `https://colab.research.google.com/github/Jij-Inc/JijModeling-Tutorials/blob/main/docs/${language}/quickstart/scip.ipynb`);
  }
});

test('preserves custom Binder paths, branch names, and encoded notebook names', () => {
  const links = launchLinks(
    'https://github.com/Jij-Inc/JijModeling-Tutorials/blob/feature/next/docs/en/a%20notebook.ipynb',
    { repo: 'https://github.com/Jij-Inc/JijModeling-Tutorials.git', ref: 'feature/next', url: 'https://example.org/binder/' },
  );
  const binder = new URL(links.binder);
  assert.equal(binder.pathname, '/binder/v2/gh/Jij-Inc/JijModeling-Tutorials/feature%2Fnext');
  assert.equal(binder.searchParams.get('urlpath'), 'lab/tree/docs/en/a notebook.ipynb');
  assert.equal(links.colab, 'https://colab.research.google.com/github/Jij-Inc/JijModeling-Tutorials/blob/feature/next/docs/en/a%20notebook.ipynb');
});

test('does not launch when the source and runtime revisions disagree', () => {
  assert.equal(launchLinks(
    'https://github.com/Jij-Inc/JijModeling-Tutorials/edit/develop/docs/en/quickstart/scip.ipynb',
    { repo: 'Jij-Inc/JijModeling-Tutorials', ref: 'main' },
  ), undefined);
  assert.equal(launchLinks(undefined, { repo: 'Jij-Inc/JijModeling-Tutorials' }), undefined);
});

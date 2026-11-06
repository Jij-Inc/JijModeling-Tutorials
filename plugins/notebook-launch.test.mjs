import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { notebookLaunchNode } from './notebook-launch.mjs';

test('keeps icon links to the current notebook inside the rocket menu', () => {
  for (const language of ['en', 'ja']) {
    const file = fileURLToPath(new URL(`../docs/${language}/quickstart/scip.ipynb`, import.meta.url));
    const node = notebookLaunchNode(file);
    assert.equal(node.type, 'details');
    assert.equal(node.children[0].type, 'summary');
    const [binder, colab] = node.children[1].children[0].children;
    assert.equal(new URL(binder.url).searchParams.get('urlpath'), `lab/tree/docs/${language}/quickstart/scip.ipynb`);
    assert.ok(colab.url.endsWith(`/docs/${language}/quickstart/scip.ipynb`));
    assert.equal(binder.children[0].url, '../../../assets/launch/binder.svg');
    assert.equal(colab.children[0].url, '../../../assets/launch/colab.png');
  }
});

test('does not add notebook launch controls to Markdown or files outside the books', () => {
  for (const path of ['../README.md', '../.cache/probe.ipynb', '../docs/en/index.md']) {
    assert.equal(notebookLaunchNode(fileURLToPath(new URL(path, import.meta.url))), undefined);
  }
});

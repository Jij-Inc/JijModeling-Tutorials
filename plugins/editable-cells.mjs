import { randomUUID } from 'node:crypto';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const widgetPath = fileURLToPath(new URL('../assets/cell-editor/', import.meta.url));

export default {
  name: 'Live notebook cell editors',
  transforms: [{
    name: 'add-live-cell-controls',
    stage: 'project',
    plugin: () => (tree, file) => {
      const language = file.path.split(sep).join('/').match(/\/docs\/(en|ja)\/.+\.ipynb$/)?.[1];
      if (!language) return;
      const assets = relative(dirname(file.path), widgetPath).split(sep).join('/');
      for (const block of tree.children) {
        if (block.kind !== 'notebook-code') continue;
        const [code, outputs] = block.children;
        if (code?.type !== 'code' || outputs?.type !== 'outputs') continue;
        if (block.children.some(node => node.class === 'cell-edit')) continue;
        block.key ??= randomUUID();
        block.class = [block.class, 'live-code-cell'].filter(Boolean).join(' ');
        for (const action of ['edit', 'add']) {
          block.children.push({
            type: 'anywidget',
            esm: `${assets}/editor.mjs`,
            css: `${assets}/editor.css`,
            class: `cell-${action}`,
            id: `${block.key}-${action}`,
            model: { action, key: block.key, language },
          });
        }
      }
    },
  }],
};

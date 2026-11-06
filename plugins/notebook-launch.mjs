import { readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchLinks } from './launch-links.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { project } = JSON.parse(readFileSync(new URL('../config/jupyter.json', import.meta.url), 'utf8'));

export function notebookLaunchNode(filePath) {
  const file = relative(root, filePath).split(sep).join('/');
  if (!/^docs\/(en|ja)\/.+\.ipynb$/.test(file)) return undefined;
  const binder = project.jupyter.binder;
  const encodedFile = file.split('/').map(encodeURIComponent).join('/');
  const links = launchLinks(`${project.github}/blob/${binder.ref}/${encodedFile}`, binder);
  if (!links) return undefined;
  const children = ['binder', 'colab'].map((service) => ({
    type: 'link',
    class: 'notebook-launch-link',
    url: links[service],
    children: [
      {
        type: 'image',
        url: relative(dirname(filePath), join(root, 'assets/launch', service === 'binder' ? 'binder.svg' : 'colab.png')).split(sep).join('/'),
        alt: '',
      },
      { type: 'text', value: `Open in ${service === 'binder' ? 'Binder' : 'Colab'}` },
    ],
  }));
  return {
    type: 'details',
    class: 'notebook-launch',
    children: [
      {
        type: 'summary',
        children: [{
          type: 'image',
          url: relative(dirname(filePath), join(root, 'assets/launch/rocket.svg')).split(sep).join('/'),
          alt: 'Open this notebook in Binder or Colab',
        }],
      },
      {
        type: 'div',
        class: 'notebook-launch-menu bg-myst-bg-secondary text-myst-text-secondary',
        children: [{ type: 'paragraph', children }],
      },
    ],
  };
}

export default {
  name: 'Current notebook launch buttons',
  transforms: [{
    name: 'notebook-launch-buttons',
    stage: 'document',
    plugin: () => (tree, file) => {
      const node = notebookLaunchNode(file.path);
      if (node) tree.children.unshift(node);
    },
  }],
};

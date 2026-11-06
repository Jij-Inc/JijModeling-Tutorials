import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const assets = new URL('../assets/katex/', import.meta.url);
const { site } = JSON.parse(readFileSync(new URL('../config/jupyter.json', import.meta.url)));
const hash = data => createHash('sha256').update(data).digest('hex');
const installed = new Set();
const templateCache = join('_build', 'templates', 'site', hash(site.template), 'public');
const marker = '\n/* JijModeling notebook math */\n';
const katexModule = 'katex-N7OTSU43.js';

function installTypesetter(publicDir) {
  const entry = join(publicDir, 'thebe-core.min.js');
  const current = readFileSync(entry, 'utf8');
  const upstream = current.split(marker)[0];
  const shared = join(publicDir, 'build', '_shared');
  if (!existsSync(join(shared, katexModule))) throw new Error('Missing book theme KaTeX module');
  const contrib = join(shared, 'katex-contrib');
  mkdirSync(contrib, { recursive: true });
  copyFileSync(new URL('auto-render.mjs', assets), join(contrib, 'auto-render.mjs'));
  copyFileSync(new URL('LICENSE', assets), join(contrib, 'LICENSE'));
  writeFileSync(join(shared, 'katex.mjs'), `export { default } from './${katexModule}';\n`);
  // Thebe must register the typesetter before MyST creates either passive or live output areas.
  const extended = upstream + marker + readFileSync(new URL('thebe-katex.js', assets), 'utf8');
  if (current !== extended) writeFileSync(entry, extended);
}

export default {
  name: 'KaTeX for notebook outputs',
  transforms: [{
    name: 'install-thebe-typesetter',
    stage: 'project',
    plugin: () => (_tree, file) => {
      const project = dirname(file.path.split('#')[0]);
      const publicDir = join(project, templateCache);
      if (installed.has(publicDir) || !existsSync(publicDir)) return;
      installTypesetter(publicDir);
      installed.add(publicDir);
    },
  }],
};

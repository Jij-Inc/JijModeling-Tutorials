import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const { site } = JSON.parse(readFileSync(new URL('../config/jupyter.json', import.meta.url)));
const hash = data => createHash('sha256').update(data).digest('hex');
const installed = new Set();
const templateCache = join('_build', 'templates', 'site', hash(site.template), 'public');
const marker = '\n/* JijModeling notebook math */\n';
const adapter = readFileSync(new URL('../assets/katex/thebe-katex.js', import.meta.url), 'utf8');

function installTypesetter(publicDir) {
  const entry = join(publicDir, 'thebe-core.min.js');
  const current = readFileSync(entry, 'utf8');
  const upstream = current.split(marker)[0];
  // Thebe must register the typesetter before MyST creates either passive or live output areas.
  const extended = upstream + marker + adapter;
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

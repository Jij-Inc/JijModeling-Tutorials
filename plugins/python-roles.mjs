const inventories = new Map([
  ['jijmodeling', 'api_reference'],
  ['numpy', 'numpy'],
  ['ommx', 'ommx_api'],
]);

const legacyTargets = new Map([
  ['Problem.eval', 'jijmodeling.Problem.eval'],
  ['Problem.Graph', 'jijmodeling.Problem.Graph'],
  ['Problem.name', 'jijmodeling.Problem.name'],
  ['Problem.sense', 'jijmodeling.Problem.sense'],
  ['Problem.generate_random_dataset', 'jijmodeling.Problem.generate_random_dataset'],
  ['Problem.generate_random_instance', 'jijmodeling.Problem.generate_random_instance'],
  ['jijmodeling.Compiler.eval_constraint', 'jijmodeling.Compiler.eval_constraints'],
]);

export default {
  name: 'Python API references',
  roles: [{
    name: 'py:obj',
    alias: ['py:func', 'py:meth', 'py:class', 'py:attr', 'py:data', 'py:mod', 'py:exc'],
    body: { type: String, required: true },
    run({ body }) {
      const alias = /^(.*?)\s*<([^<>]+)>$/s.exec(body.trim());
      const name = (alias?.[2] ?? body).trim();
      const path = name.replace(/^~/, '');
      const object = path.replace(/\(\)$/, '');
      const target = legacyTargets.get(object) ?? object;
      const shortName = target.split('.').at(-1) + path.slice(object.length);
      const label = alias?.[1]?.trim() ?? (name.startsWith('~') ? shortName : path);
      const inventory = inventories.get(target.split('.')[0]) ?? 'python';
      return [{ type: 'link', url: `xref:${inventory}#${target}`, children: [{ type: 'inlineCode', value: label }] }];
    },
  }],
  directives: [{
    name: 'eval-rst',
    doc: 'Read legacy tutorial paragraphs that use reStructuredText Python roles.',
    body: { type: String, required: true },
    run({ body }, _file, ctx) {
      const markdown = body.replace(/:(py:\w+):`([^`\n]+)`/g,
        (_, role, value) => `{${role}}\`${value.replace(/\\!/g, '!')}\``);
      return ctx.parseMyst(markdown).children;
    },
  }],
};

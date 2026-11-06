const inventories = new Map([
  ['jijmodeling', 'api_reference'],
  ['numpy', 'numpy'],
  ['ommx', 'ommx_api'],
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
      const label = alias?.[1]?.trim() ?? (name.startsWith('~') ? path.split('.').at(-1) : path);
      let target = path.replace(/\(\)$/, '');
      // Unqualified Class.member references in these tutorials refer to JijModeling.
      if (/^[A-Z]\w*\./.test(target)) target = `jijmodeling.${target}`;
      const inventory = inventories.get(target.split('.')[0]) ?? 'python';
      return [{ type: 'link', url: `xref:${inventory}#${target}`, children: [{ type: 'inlineCode', value: label }] }];
    },
  }],
};

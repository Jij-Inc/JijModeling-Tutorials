export default {
  name: 'Expanded chapter navigation',
  transforms: [{
    name: 'expand-sidebar-parts',
    stage: 'project',
    plugin: () => (tree, file) => {
      if (!file.path.endsWith('#site.parts.primary_sidebar_footer')) return;
      const part = tree.children.find(node => node.data?.part === 'primary_sidebar_footer');
      const toc = part?.children.find(node => node.data?.part === 'toc:project');
      const list = toc?.children.find(node => node.type === 'list');
      if (!list) return;

      toc.class = 'book-chapters';
      toc.children = list.children.map(({ children: [label, chapters] }) => {
        if (!chapters) return label;
        return {
          type: 'details',
          open: true,
          children: [{ type: 'summary', children: [label] }, chapters],
        };
      });
    },
  }],
};

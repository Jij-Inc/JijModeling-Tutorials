(() => {
  const config = document.createElement('script');
  config.type = 'text/x-thebe-config';
  config.textContent = JSON.stringify({ mathjaxUrl: '' });
  document.head.append(config);

  const enhanced = new WeakSet();
  const japanese = document.documentElement.lang.startsWith('ja');

  function enhance(entry) {
    const element = entry.cell[0];
    if (enhanced.has(element)) return;
    enhanced.add(element);

    const registry = entry.cell.data('renderMime');
    registry.addFactory({
      safe: true,
      mimeTypes: ['text/latex'],
      createRenderer: () => {
        const renderer = registry.createRenderer('text/html');
        const render = renderer.renderModel.bind(renderer);
        renderer.renderModel = model => {
          const latex = model.data['text/latex'].trim()
            .replace(/^(\$\$?)([\s\S]*)\1$/, '$2')
            .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
            .replace(/^\\\(([\s\S]*)\\\)$/, '$1');
          return render({
            data: { 'text/html': katex.renderToString(latex, { displayMode: true, throwOnError: false }) },
            metadata: {},
            trusted: true,
          });
        };
        return renderer;
      },
    }, 0);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thebelab-button jij-add-cell';
    button.textContent = japanese ? '＋ コードセルを追加' : '+ Code cell';
    button.addEventListener('click', () => {
      const source = document.createElement('pre');
      source.dataset.language = 'python';
      element.after(source);
      const added = thebelab.renderCell(source);
      added.cell.data('kernel-promise-resolve')(entry.cell.data('kernel'));
      const widgets = registry.getFactory('application/vnd.jupyter.widget-view+json');
      if (widgets) added.cell.data('renderMime').addFactory(widgets, 1);
      const index = thebelab.cells.toArray().indexOf(entry);
      thebelab.cells.splice(index + 1, 0, added);
      enhance(added);
      added.cell[0].querySelector('.CodeMirror').CodeMirror.focus();
    });
    element.append(button);
  }

  const observer = new MutationObserver(() => {
    setTimeout(() => {
      if (!window.thebeKernel || !window.thebelab?.cells) return;
      observer.disconnect();
      thebelab.cells.each((_, entry) => enhance(entry));
    }, 0);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();

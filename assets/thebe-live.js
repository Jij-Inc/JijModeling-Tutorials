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

    const clearOutput = document.createElement('button');
    clearOutput.className = 'thebelab-button jij-clear-output';
    clearOutput.addEventListener('click', () => entry.setOutputText(''));
    element.append(clearOutput);

    const actions = document.createElement('div');
    actions.className = 'jij-cell-actions';
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', japanese ? 'セルの操作' : 'Cell actions');
    for (const [selector, icon, label] of [
      ['.thebelab-run-button', 'far fa-circle-play', japanese ? 'セルを実行' : 'Run cell'],
      ['.jij-clear-output', 'fas fa-eraser', japanese ? 'このセルの出力を消去' : 'Clear cell output'],
      ['.thebelab-restart-button', 'fas fa-arrow-rotate-right', japanese ? 'カーネルを再起動' : 'Restart kernel'],
      ['.thebelab-restartall-button', 'fas fa-forward-fast', japanese ? '再起動してすべてのセルを実行' : 'Restart kernel and run all cells'],
    ]) {
      const button = element.querySelector(selector);
      button.type = 'button';
      button.title = label;
      button.setAttribute('aria-label', label);
      const symbol = document.createElement('i');
      symbol.className = icon;
      symbol.setAttribute('aria-hidden', 'true');
      button.replaceChildren(symbol);
      actions.append(button);
    }
    element.prepend(actions);

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
    button.title = japanese ? 'コードセルを追加' : 'Add code cell';
    button.setAttribute('aria-label', button.title);
    const plus = document.createElement('i');
    plus.className = 'fas fa-plus';
    plus.setAttribute('aria-hidden', 'true');
    button.append(plus);
    button.addEventListener('click', () => {
      const source = document.createElement('pre');
      source.dataset.language = 'python';
      const cell = document.createElement('div');
      cell.className = 'cell docutils container';
      const input = document.createElement('div');
      input.className = 'cell_input docutils container';
      const highlight = document.createElement('div');
      highlight.className = 'highlight';
      highlight.append(source);
      input.append(highlight);
      cell.append(input);
      element.closest('.cell').after(cell);
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
      if (document.querySelector('.jij-clear-outputs')) return;
      observer.disconnect();
      thebelab.cells.each((_, entry) => enhance(entry));
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'thebelab-button jij-clear-outputs';
      clear.textContent = japanese ? 'すべての出力を消去' : 'Clear all outputs';
      clear.addEventListener('click', () => {
        thebelab.cells.each((_, entry) => entry.setOutputText(''));
      });
      document.querySelector('.thebe-launch-button').after(clear);
    }, 0);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();

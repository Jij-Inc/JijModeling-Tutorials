const labels = {
  en: { editHint: 'Double-click, double-tap or press Enter to edit Python code', done: 'Done', copy: 'Copy code',
    add: '+ Code cell', run: 'Run', remove: 'Remove cell', code: 'Python code',
    connect: 'Connect the page kernel to edit cells.', failed: 'Execution failed.',
    unavailable: 'The cell editor could not load.', busy: 'Wait for the running cells to finish.' },
  ja: { editHint: 'ダブルクリック・ダブルタップ・Enter で Python コードを編集', done: '完了', copy: 'コードをコピー',
    add: '＋ コードセルを追加', run: '実行', remove: 'セルを削除', code: 'Python コード',
    connect: '編集するにはページのカーネルに接続してください。', failed: '実行に失敗しました。',
    unavailable: 'セルエディターを読み込めませんでした。', busy: '実行中のセルが終わるまでお待ちください。' },
};

function connectedCell(key) {
  const execution = window.executeScope;
  const ref = execution?.idkmap?.[key];
  if (!ref || ref.pageSlug !== execution.slug) return;
  const notebook = execution.state.pages[ref.pageSlug]?.scopes[ref.notebookSlug]?.notebook;
  const cell = notebook?.getCellById(ref.cellId);
  if (cell && notebook.session?.kernel) return { notebook, cell };
}

function button(label, handler) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', handler);
  return element;
}

let pythonHighlighter;
function loadHighlighter() {
  if (pythonHighlighter) return pythonHighlighter;
  const themeCSS = document.querySelector('link[rel="stylesheet"][href*="/_assets/app-"]')?.href;
  if (!themeCSS) return Promise.resolve(null);
  pythonHighlighter = Promise.all([
    import(new URL('../_shared/core-6K2CMWE5.js', themeCSS).href),
    import(new URL('../_shared/python-KQPMMNS3.js', themeCSS).href),
  ]).then(([{ default: lowlight }, { default: python }]) => {
    if (!lowlight.listLanguages().includes('python')) lowlight.registerLanguage('python', python);
    return lowlight;
  }).catch(() => null);
  return pythonHighlighter;
}

function tokenNode(token) {
  if (token.type === 'text') return document.createTextNode(token.value);
  const span = document.createElement('span');
  span.classList.add(...token.properties.className);
  span.append(...token.children.map(tokenNode));
  return span;
}

export function enableEditGesture(target, start, run, signal) {
  const options = { signal };
  target.addEventListener('dblclick', event => {
    if (event.target.closest('button')) return;
    const pre = target.closest('pre') ?? target.querySelector('pre');
    const selection = pre?.getRootNode().getSelection?.() ?? window.getSelection();
    if (!pre || !selection?.focusNode || !pre.contains(selection.focusNode)) {
      start();
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(pre);
    range.setEnd(selection.focusNode, selection.focusOffset);
    start(range.toString().length);
  }, options);
  target.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing && !event.target.closest('button')) {
      if ((event.shiftKey ? run : start)()) event.preventDefault();
    }
  }, options);
  let lastTap;
  target.addEventListener('pointercancel', () => { lastTap = undefined; }, options);
  target.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' || !event.isPrimary || event.target.closest('button')) return;
    if (lastTap && event.timeStamp - lastTap.time < 350 &&
        Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 24) {
      lastTap = undefined;
      start();
    } else {
      lastTap = { time: event.timeStamp, x: event.clientX, y: event.clientY };
    }
  }, options);
}

const editing = new WeakMap();
const insertedAfter = new WeakMap();

function addedCells({ notebook, cell }) {
  return notebook.cells.filter(item => insertedAfter.get(item) === cell);
}

function editor(cell, notebook, text, report) {
  const panel = document.createElement('div');
  const view = document.createElement('div');
  view.className = 'code-view';
  const preview = document.createElement('pre');
  preview.tabIndex = 0;
  preview.title = text.editHint;
  preview.setAttribute('aria-label', text.code);
  preview.setAttribute('aria-description', text.editHint);
  const copy = button(text.copy, async () => {
    try { await navigator.clipboard.writeText(cell.source); }
    catch (error) { report(error.message); }
  });
  view.append(preview, copy);

  const input = document.createElement('div');
  input.className = 'code-input';
  const mirror = document.createElement('pre');
  mirror.setAttribute('aria-hidden', 'true');
  const tokens = document.createElement('code');
  mirror.append(tokens);
  const field = document.createElement('textarea');
  field.setAttribute('aria-label', text.code);
  field.setAttribute('aria-keyshortcuts', 'Escape Shift+Enter');
  field.spellcheck = false;
  field.wrap = 'off';
  field.autocapitalize = 'off';
  field.setAttribute('autocorrect', 'off');
  input.append(mirror, field);

  let highlighter;
  function paint() {
    const target = input.hidden ? preview : tokens;
    const source = cell.source;
    if (!highlighter) {
      target.textContent = source;
      return;
    }
    try {
      target.replaceChildren(...highlighter.highlight('python', source).value.map(tokenNode));
    } catch {
      target.textContent = source;
    }
  }
  function syncScroll() {
    tokens.style.transform = `translate(${-field.scrollLeft}px, ${-field.scrollTop}px)`;
  }
  field.addEventListener('scroll', syncScroll);
  field.addEventListener('input', () => {
    cell.source = field.value;
    paint();
    syncScroll();
  });
  const run = button(text.run, async () => {
    if (cell.isBusy || run.disabled) return;
    run.disabled = true;
    report('');
    try {
      cell.clear();
      const result = await notebook.executeOnly(cell.id);
      if (!result || result.error?.length) report(text.failed);
    } catch (error) {
      report(error.message);
    } finally {
      run.disabled = false;
    }
  });
  run.title = 'Shift+Enter';
  const done = button(text.done, finish);
  done.title = 'Esc';
  function finish() {
    editing.set(cell, false);
    input.hidden = true;
    done.hidden = true;
    view.hidden = false;
    paint();
    preview.focus();
  }
  function enter(offset, focus = true) {
    if (!input.hidden) return false;
    editing.set(cell, true);
    view.hidden = true;
    done.hidden = false;
    input.hidden = false;
    if (field.value !== cell.source) field.value = cell.source;
    field.rows = Math.min(24, Math.max(3, field.value.split('\n').length));
    paint();
    if (focus) field.focus();
    if (offset !== undefined) field.setSelectionRange(offset, offset);
    syncScroll();
    return true;
  }
  input.hidden = true;
  done.hidden = true;
  const events = new AbortController();
  function execute() {
    if (cell.isBusy || run.disabled) return false;
    preview.focus();
    run.click();
    return true;
  }
  enableEditGesture(preview, enter, execute, events.signal);
  field.addEventListener('keydown', event => {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finish();
    } else if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      finish();
      run.click();
    }
  });
  panel.append(view, input, run, done);
  paint();
  loadHighlighter().then(loaded => { highlighter = loaded; paint(); });
  return { panel, enter, execute, dispose: () => events.abort() };
}

function render({ el, model }) {
  const text = labels[model.get('language')] ?? labels.en;
  const key = model.get('key');
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  const report = message => { status.textContent = message; };
  const host = el.getRootNode().host;

  if (model.get('action') === 'edit') {
    const source = host.parentElement.querySelector(':scope > .myst-code');
    if (!source) return;
    const events = new AbortController();
    let surface;
    const hints = { tabindex: '0', title: text.editHint, 'aria-description': text.editHint,
      'aria-keyshortcuts': 'Enter Shift+Enter' };
    const original = Object.fromEntries(Object.keys(hints).map(name => [name, source.getAttribute(name)]));
    function applyHints(attrs) {
      for (const [name, value] of Object.entries(attrs)) {
        if (value === null) source.removeAttribute(name);
        else source.setAttribute(name, value);
      }
    }
    function getSurface() {
      if (surface) return surface;
      const live = connectedCell(key);
      if (!live) return;
      report('');
      surface = editor(live.cell, live.notebook, text, report);
      el.prepend(surface.panel);
      host.dataset.engaged = '';
      return surface;
    }
    const observer = new ResizeObserver(() => {
      const visible = host.getClientRects().length !== 0;
      applyHints(visible ? hints : original);
      const cell = visible && connectedCell(key)?.cell;
      if (!surface && cell && editing.has(cell)) {
        const restored = getSurface();
        if (editing.get(cell)) restored.enter(undefined, false);
      }
    });
    observer.observe(host);
    enableEditGesture(source, offset => getSurface()?.enter(offset), () => getSurface()?.execute(), events.signal);
    el.append(status);
    return () => {
      events.abort();
      observer.disconnect();
      surface?.dispose();
      delete host.dataset.engaged;
      applyHints(original);
    };
  }

  const mounted = new Map();
  function mountCell(live, cell) {
    const { notebook } = live;
    const row = document.createElement('div');
    row.className = 'added-cell';
    const surface = editor(cell, notebook, text, report);
    const output = document.createElement('div');
    const discard = button(text.remove, () => {
      if (cell.isBusy) return report(text.busy);
      const index = notebook.cells.indexOf(cell);
      if (index >= 0) notebook.cells.splice(index, 1);
      insertedAfter.delete(cell);
      cell.detachSession();
      mounted.delete(cell);
      surface.dispose();
      row.remove();
      report('');
      add.focus();
    });
    row.append(surface.panel, discard, output);
    el.insertBefore(row, add);
    mounted.set(cell, surface);
    cell.attachToDOM(output);
    return surface;
  }
  const add = button(text.add, () => {
    const live = connectedCell(key);
    if (!live) return report(text.connect);
    report('');
    const { notebook } = live;
    if (notebook.code.some(cell => cell.isBusy)) return report(text.busy);
    const { session } = notebook;
    const CodeCell = window.thebeCore?.module?.ThebeCodeCell;
    if (!CodeCell) return report(text.unavailable);
    const cell = new CodeCell(
      crypto.randomUUID(), notebook.id, '', session.server.config, {}, notebook.rendermime,
    );
    cell.attachSession(session);
    const after = addedCells(live).at(-1) ?? live.cell;
    notebook.cells.splice(notebook.cells.indexOf(after) + 1, 0, cell);
    insertedAfter.set(cell, live.cell);
    const surface = mountCell(live, cell);
    surface.enter();
  });
  el.append(add, status);
  const observer = new ResizeObserver(() => {
    if (!host.getClientRects().length) return;
    const live = connectedCell(key);
    if (!live) return;
    for (const cell of addedCells(live)) {
      if (mounted.has(cell)) continue;
      const surface = mountCell(live, cell);
      if (editing.get(cell)) surface.enter(undefined, false);
    }
  });
  observer.observe(host);
  return () => {
    observer.disconnect();
    for (const surface of mounted.values()) surface.dispose();
  };
}

export default { render };

;(() => {
  const core = window.thebeCore;
  const makeRegistry = core.module.makeRenderMimeRegistry;
  const dist = 'https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/';
  function loadRenderer() {
    const css = document.querySelector('link[rel="stylesheet"][href*="/katex@"]') ?? document.createElement('link');
    css.rel = 'stylesheet';
    css.crossOrigin = 'anonymous';
    css.integrity = 'sha384-nH0MfJ44wi1dd7w6jinlyBgljjS8EJAh2JBoRad8a3VDw2K69vfaaqm4WnR+gXtA';
    css.href = dist + 'katex.min.css';
    if (!css.isConnected) document.head.append(css);
    return Promise.all([import(dist + 'katex.mjs'), import(dist + 'contrib/auto-render.mjs')]);
  }
  let renderer;
  const latexTypesetter = {
    async typeset(host) {
      const source = host.textContent.trim();
      const isLatex = host.matches('[data-mime-type="text/latex"]');
      if (!source || (!isLatex && !/[$\\]/.test(source))) return;
      renderer ??= loadRenderer();
      const [{ default: katex }, { default: renderMathInElement }] = await renderer;
      if (host.textContent.trim() !== source) return;
      renderMathInElement(host, {
        delimiters: [
          { left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false },
          ...['equation', 'align', 'alignat', 'gather', 'CD'].map(env => ({
            left: `\\begin{${env}}`, right: `\\end{${env}}`, display: true,
          })),
        ],
        ignoredClasses: ['katex', 'katex-display', 'katex-error'],
        throwOnError: false,
      });
      if (isLatex && !host.childElementCount) katex.render(source, host, { displayMode: true, throwOnError: false });
    },
  };
  const makeRenderMimeRegistry = () => makeRegistry().clone({ latexTypesetter });
  core.module = { ...core.module, makeRenderMimeRegistry };
  core.api.makeRenderMimeRegistry = makeRenderMimeRegistry;
})();

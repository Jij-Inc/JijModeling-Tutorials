;(() => {
  const core = window.thebeCore;
  const makeRegistry = core.module.makeRenderMimeRegistry;
  let renderer;
  const latexTypesetter = {
    async typeset(host) {
      const source = host.textContent.trim();
      const isLatex = host.matches('[data-mime-type="text/latex"]');
      if (!source || (!isLatex && !/[$\\]/.test(source))) return;
      renderer ??= Promise.all([
        import('/myst_assets_folder/_shared/katex.mjs'),
        import('/myst_assets_folder/_shared/katex-contrib/auto-render.mjs'),
      ]);
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

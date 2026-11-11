(() => {
  function setTheme(theme) {
    document.documentElement.dataset.mode = theme;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mode', theme);
    localStorage.setItem('theme', theme);
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.toggle('dropdown-menu-dark', theme === 'dark');
    });
  }

  const saved = localStorage.getItem('mode');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved === 'light' || saved === 'dark' ? saved : preferred);

  document.addEventListener('click', event => {
    if (!event.target.closest('.theme-switch-button')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }, true);
})();

(() => {
  const KEY = 'ggms_theme';

  function setTheme(mode) {
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-theme-set]');
    if (!btn) return;
    const mode = btn.getAttribute('data-theme-set');
    if (!mode) return;
    setTheme(mode);
  });

  // Expose for console/testing if you want:
  window.ggmsSetTheme = setTheme;
})();

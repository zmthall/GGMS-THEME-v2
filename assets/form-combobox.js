// assets/form-combobox.js
(function () {
  const rootSel = '[data-combobox]';
  const listSel = '[data-combobox-list]';
  const btnSel = '[data-combobox-button]';
  const optSel = '[data-option]';

  function isHidden(el) {
    return el.classList.contains('hidden');
  }

  function open(root) {
    const input = root.querySelector('input[role="combobox"]');
    const list = root.querySelector(listSel);
    if (!input || !list) return;
    list.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  }

  function close(root) {
    const input = root.querySelector('input[role="combobox"]');
    const list = root.querySelector(listSel);
    if (!input || !list) return;
    list.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    clearActive(root);
  }

  function toggle(root) {
    const list = root.querySelector(listSel);
    if (!list) return;
    if (isHidden(list)) open(root);
    else close(root);
  }

  function getOptions(root) {
    return Array.from(root.querySelectorAll(optSel));
  }

  function visibleOptions(root) {
    return getOptions(root).filter((o) => o.dataset.hidden !== 'true');
  }

  function setActive(root, idx) {
    const opts = visibleOptions(root);
    opts.forEach((o) => o.classList.remove('bg-brand-blue/5'));
    if (idx < 0 || idx >= opts.length) return;

    const active = opts[idx];
    active.classList.add('bg-brand-blue/5');
    active.scrollIntoView({ block: 'nearest' });

    const input = root.querySelector('input[role="combobox"]');
    if (input) input.setAttribute('aria-activedescendant', active.id || '');
    root.dataset.activeIndex = String(idx);
  }

  function clearActive(root) {
    const opts = getOptions(root);
    opts.forEach((o) => o.classList.remove('bg-brand-blue/5'));
    const input = root.querySelector('input[role="combobox"]');
    if (input) input.removeAttribute('aria-activedescendant');
    root.dataset.activeIndex = '';
  }

  function filter(root, query) {
    const q = String(query || '').trim().toLowerCase();
    const opts = getOptions(root);

    let anyVisible = false;
    opts.forEach((o) => {
      const label = (o.dataset.label || '').toLowerCase();
      const show = !q || label.includes(q);
      o.style.display = show ? '' : 'none';
      o.dataset.hidden = show ? 'false' : 'true';
      if (show) anyVisible = true;
    });

    // If nothing matches, just close.
    if (!anyVisible) {
      close(root);
      return;
    }

    open(root);
    setActive(root, 0);
  }

  function selectOption(root, opt) {
    const hidden = root.querySelector('input[type="hidden"]');
    const input = root.querySelector('input[role="combobox"]');
    if (!hidden || !input || !opt) return;

    hidden.value = opt.dataset.value || '';
    input.value = opt.dataset.label || '';
    close(root);

    // trigger change for anyone listening
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function bind(root) {
    if (root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';

    const input = root.querySelector('input[role="combobox"]');
    const list = root.querySelector(listSel);
    const btn = root.querySelector(btnSel);

    if (!input || !list) return;

    // Ensure options have IDs for aria-activedescendant if needed
    getOptions(root).forEach((opt, i) => {
      if (!opt.id) opt.id = `${root.dataset.listboxId || 'cb'}-opt-${i}`;
    });

    input.addEventListener('focus', () => {
      // open only if options exist
      if (getOptions(root).length) open(root);
    });

    input.addEventListener('input', (e) => {
      filter(root, e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      const opts = visibleOptions(root);
      if (!opts.length) return;

      const current = parseInt(root.dataset.activeIndex || '-1', 10);
      const isOpen = !isHidden(list);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) open(root);
        const next = Math.min(current + 1, opts.length - 1);
        setActive(root, next);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) open(root);
        const prev = Math.max(current - 1, 0);
        setActive(root, prev);
        return;
      }

      if (e.key === 'Enter') {
        if (!isOpen) return;
        e.preventDefault();
        const idx = current >= 0 ? current : 0;
        selectOption(root, opts[idx]);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        close(root);
        return;
      }

      if (e.key === 'Tab') {
        // allow tab to move on, but close list
        close(root);
      }
    });

    // Button should be tabbable and toggle list (separate focusable target)
    if (btn) {
      btn.addEventListener('click', () => {
        toggle(root);
        input.focus();
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(root);
          input.focus();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          close(root);
          input.focus();
        }
      });
    }

    // Option clicks
    root.addEventListener('mousedown', (e) => {
      const opt = e.target.closest(optSel);
      if (!opt) return;
      // prevent input blur before click selection
      e.preventDefault();
    });

    root.addEventListener('click', (e) => {
      const opt = e.target.closest(optSel);
      if (!opt) return;
      selectOption(root, opt);
    });

    // Click outside closes
    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) close(root);
    });
  }

  function init() {
    document.querySelectorAll(rootSel).forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
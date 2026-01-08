(() => {
  function removeParamValue(url, param, value) {
    const u = new URL(url, window.location.origin);

    if (!param) return u;

    if (!u.searchParams.has(param)) return u;

    // If no value provided, remove the entire param
    if (!value) {
      u.searchParams.delete(param);
      return u;
    }

    // Remove only the matching value (handles repeated params)
    const values = u.searchParams.getAll(param);
    u.searchParams.delete(param);

    values.forEach((v) => {
      if (v !== value) u.searchParams.append(param, v);
    });

    return u;
  }

  function onClick(e) {
    const btn = e.target.closest('[data-ui-tag-remove]');

    if (!btn) return;

    const param = btn.getAttribute('data-param') || '';
    const value = btn.getAttribute('data-value') || '';

    // If there is no param, just remove the chip from the DOM (UI-only)
    if (!param) {
      const chip = btn.closest('span');
      if (chip) chip.remove();
      return;
    }

    const next = removeParamValue(window.location.href, param, value);
    window.location.assign(next.toString());
  }

  document.addEventListener('click', onClick);
})();

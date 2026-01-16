// assets/password-toggle.js
// Toggles password visibility for form-input password fields.
// Uses CLASS swapping (inline-flex <-> hidden) so only ONE icon is visible at a time.
(function () {
  function show(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('inline-flex');
    el.setAttribute('aria-hidden', 'false');
  }

  function hide(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove('inline-flex');
    el.setAttribute('aria-hidden', 'true');
  }

  function setShown(btn, shown) {
    var field = btn.closest('[data-form-field]');
    if (!field) return;

    var input = field.querySelector('input[data-password-field="true"]');
    if (!input) return;

    var openIcon = btn.querySelector('[data-eye-open]');
    var closedIcon = btn.querySelector('[data-eye-closed]');

    if (shown) {
      input.type = 'text';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Hide password');

      // show CLOSED icon (meaning "click to hide"), hide OPEN icon
      hide(openIcon);
      show(closedIcon);
    } else {
      input.type = 'password';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Show password');

      // show OPEN icon (meaning "click to show"), hide CLOSED icon
      show(openIcon);
      hide(closedIcon);
    }

    // Keep focus in the field (nice UX)
    try {
      input.focus({ preventScroll: true });
    } catch (e) {
      input.focus();
    }
  }

  function toggle(btn) {
    var field = btn.closest('[data-form-field]');
    if (!field) return;

    var input = field.querySelector('input[data-password-field="true"]');
    if (!input) return;

    var currentlyShown = input.type === 'text';
    setShown(btn, !currentlyShown);
  }

  // Click delegation (works even if inputs are added later)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-password-toggle="true"]');
    if (!btn) return;
    if (btn.disabled) return;

    toggle(btn);
  });

  // Normalize initial state on load
  function init() {
    document.querySelectorAll('[data-password-toggle="true"]').forEach(function (btn) {
      var field = btn.closest('[data-form-field]');
      if (!field) return;

      var input = field.querySelector('input[data-password-field="true"]');
      if (!input) return;

      setShown(btn, input.type === 'text');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

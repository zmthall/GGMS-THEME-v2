// assets/form-validation.js
// Live validation scoped to [data-form-container]
(function () {
  const containerSelector = '[data-form-container]';
  const inputSelector = 'input[data-form-input="true"], textarea[data-form-input="true"]';

  const isEmpty = (v) => !v || !String(v).trim().length;

  const validators = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: (v) => /^(\(\d{3}\)\s?|\d{3}-?)\d{3}-?\d{4}$/.test(v),
    number: (v) => /^[0-9]+$/.test(v),
    text: () => true,
    search: () => true,
    password: () => true,
  };

  function splitClasses(str) {
    return String(str || '').split(/\s+/).filter(Boolean);
  }

  function shouldValidate(input) {
    return !input.hasAttribute('data-no-validate') && input.dataset.noValidate !== 'true';
  }

  function setState(input, state) {
    const base = input.dataset.stateDefault || '';
    const err = input.dataset.stateError || '';
    const ok = input.dataset.stateSuccess || '';

    input.classList.remove(...splitClasses(base), ...splitClasses(err), ...splitClasses(ok));

    if (state === 'error') input.classList.add(...splitClasses(err));
    else if (state === 'success') input.classList.add(...splitClasses(ok));
    else input.classList.add(...splitClasses(base));

    if (state === 'error') input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function setMessage(input, state, text) {
    const field = input.closest('[data-form-field]') || input.parentElement;
    if (!field) return;

    const msg = field.querySelector('[data-input-msg]');
    if (!msg) return;

    if (text && text.trim()) {
      msg.textContent = text;
      msg.classList.remove('hidden');

      msg.classList.remove('text-muted', 'text-success', 'text-danger');
      msg.classList.add(state === 'error' ? 'text-danger' : state === 'success' ? 'text-success' : 'text-muted');

      if (state === 'error') msg.setAttribute('role', 'alert');
      else msg.removeAttribute('role');
    } else {
      msg.classList.add('hidden');
      msg.textContent = '';
      msg.removeAttribute('role');
    }
  }

  function defaultMessage(input, state) {

    if (state === 'error') {
      const t = input.dataset.validateType || input.type || 'text';
      if (t === 'email') return `This field must contain a valid email address.`;
      if (t === 'phone') return `This field must contain a valid phone number.`;
      if (t === 'number') return `This field must contain numbers only.`;
      if (input.required) return `This field is required.`;
      return `This field is invalid.`;
    }

    if (state === 'success') return ''; // keep clean (no noisy "looks good")
    return ''; // default no message
  }

  function validate(input) {
    if (!shouldValidate(input)) return;
    if (input.disabled || input.readOnly) return;

    const t = input.dataset.validateType || input.type || 'text';
    const v = input.value;

    // Empty => reset visuals (do not show error while typing an empty field)
    if (isEmpty(v)) {
      setState(input, 'default');
      setMessage(input, 'default', '');
      return;
    }

    const fn = validators[t] || validators.text;
    const ok = fn(v) && (input.validity ? input.validity.valid : true);

    if (ok) {
      setState(input, 'success');
      setMessage(input, 'success', defaultMessage(input, 'success'));
    } else {
      setState(input, 'error');
      setMessage(input, 'error', defaultMessage(input, 'error'));
    }
  }

  function bind(container) {
    container.querySelectorAll(inputSelector).forEach((input) => {
      if (!shouldValidate(input)) return;

      // Avoid double binding
      if (input.dataset.bound === 'true') return;
      input.dataset.bound = 'true';

      input.addEventListener('input', () => validate(input));
      input.addEventListener('blur', () => validate(input));
    });
  }

  function init() {
    document.querySelectorAll(containerSelector).forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

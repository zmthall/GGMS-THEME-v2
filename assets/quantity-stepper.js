// assets/quantity-stepper.js
(function () {
  const stepperSelector = '[data-stepper]';
  const toInt = (v, fallback) => {
    const n = parseInt(String(v || ''), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function initStepper(stepper) {
    // Prevent double-initializing after content refresh
    if (stepper._stepperInit) return;
    stepper._stepperInit = true;

    const input = stepper.querySelector('[data-stepper-input]');
    const minus = stepper.querySelector('[data-stepper-minus]');
    const plus = stepper.querySelector('[data-stepper-plus]');
    if (!input || !minus || !plus) return;

    const min = toInt(stepper.getAttribute('data-stepper-min'), 1);
    const max = toInt(stepper.getAttribute('data-stepper-max'), 99);
    const step = toInt(stepper.getAttribute('data-stepper-step'), 1);

    function setDisabledState(val) {
      if (input.disabled || input.readOnly) {
        minus.disabled = true;
        plus.disabled = true;
        return;
      }

      minus.disabled = val <= min;
      plus.disabled = val >= max;

      minus.setAttribute('aria-disabled', minus.disabled ? 'true' : 'false');
      plus.setAttribute('aria-disabled', plus.disabled ? 'true' : 'false');
    }

    function setValue(next, { emit = true } = {}) {
      const current = toInt(input.value, min);
      const val = clamp(toInt(next, current), min, max);
      input.value = String(val);
      setDisabledState(val);
      if (emit) input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function sanitizeAndClamp() {
      const raw = String(input.value || '');
      const digits = raw.replace(/[^\d]/g, '');
      if (!digits.length) {
        setValue(min, { emit: true });
        return;
      }
      setValue(toInt(digits, min), { emit: true });
    }

    minus.addEventListener('click', () => {
      if (input.disabled || input.readOnly) return;
      const v = toInt(input.value, min);
      setValue(v - step, { emit: true });
    });

    plus.addEventListener('click', () => {
      if (input.disabled || input.readOnly) return;
      const v = toInt(input.value, min);
      setValue(v + step, { emit: true });
    });

    input.addEventListener('input', () => {
      const raw = String(input.value || '');
      const digits = raw.replace(/[^\d]/g, '');
      if (raw !== digits) input.value = digits;
      const v = digits.length ? clamp(toInt(digits, min), min, max) : min;
      setDisabledState(v);
    });

    input.addEventListener('blur', sanitizeAndClamp);

    // initial sync
    setValue(toInt(input.value, min), { emit: false });
  }

  function init(root) {
    (root || document).querySelectorAll(stepperSelector).forEach(initStepper);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();

  // Expose for cart drawer to re-init after content refresh
  window.GGMS = window.GGMS || {};
  window.GGMS.steppers = { init };
})();
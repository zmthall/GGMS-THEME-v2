(() => {
  const LOGO_SEL = '[data-ggms-logo]';
  const BRIDGE_SEL = '[data-ggms-bridge]';
  const BOTTOM_SEL = '[data-ggms-bottom]';
  const LETTER_SEL = '.ggms-letter';

  const BRIDGE_FADE_MS = 360;
  const LETTER_MOVE_MS = 800;

  const GAP_ABOVE_BOTTOM_PX = 6;
  const LETTER_GAP_PX = 6;
  const WORD_GAP_PX = 18;
  const WORD_BREAK_AFTER_INDEX = 6;

  const LAST_TWO_SHIFT_PX = -4;

  const MIN_AVAILABLE_PX = 24;
  const MIN_SCALE = 0.06;
  const MAX_LAYOUT_RAF_TRIES = 12;

  let cached = null;
  let cachedSig = '';
  let currentAnimationId = 0;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function waitMs(ms) {
    return new Promise((r) => window.setTimeout(r, ms));
  }

  function raf() {
    return new Promise((r) => requestAnimationFrame(r));
  }

  function getLogo() {
    const header = document.querySelector('[data-site-header]');
    return header ? header.querySelector(LOGO_SEL) : null;
  }

  function getLetters(logo) {
    return Array.from(logo.querySelectorAll(LETTER_SEL));
  }

  function snapshotInline(letters) {
    letters.forEach((el) => {
      if (el.dataset.ggmsInline == null) el.dataset.ggmsInline = el.getAttribute('style') || '';
    });
  }

  function restoreInline(letters) {
    letters.forEach((el) => {
      const s = el.dataset.ggmsInline || '';
      if (s) el.setAttribute('style', s);
      else el.removeAttribute('style');
      delete el.dataset.ggmsInline;
    });
  }

  function invalidateCache() {
    cached = null;
    cachedSig = '';
  }

  function layoutSignature(logo) {
    const bottom = logo.querySelector(BOTTOM_SEL);
    if (!bottom) return '';
    return [
      logo.clientWidth,
      logo.clientHeight,
      bottom.offsetLeft,
      bottom.offsetTop,
      bottom.offsetWidth,
      bottom.offsetHeight
    ].join('|');
  }

  function measureWidthsOffDom(logo, letters) {
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.left = '-99999px';
    measurer.style.top = '0';
    measurer.style.visibility = 'hidden';
    measurer.style.pointerEvents = 'none';
    measurer.style.whiteSpace = 'nowrap';

    const clones = letters.map((wrap) => {
      const inner = wrap.querySelector('.gg-letter-3d') || wrap;
      const c = inner.cloneNode(true);
      c.style.transform = 'none';
      c.style.position = 'static';
      measurer.appendChild(c);
      return c;
    });

    logo.appendChild(measurer);

    const widths = clones.map((c) => {
      const r = c.getBoundingClientRect();
      return r && r.width ? r.width : 20;
    });

    measurer.remove();
    return widths;
  }

  function computeFlatLayout(logo) {
    const bottom = logo.querySelector(BOTTOM_SEL);
    if (!bottom) return null;

    const letters = getLetters(logo);
    if (!letters.length) return null;

    const logoW = logo.clientWidth;
    const logoH = logo.clientHeight;
    if (logoW < MIN_AVAILABLE_PX || logoH < 10) return null;

    const bottomW = bottom.offsetWidth;
    const available = Math.max(0, bottomW - 6);
    if (available < MIN_AVAILABLE_PX) return null;

    const firstInner = letters[0].querySelector('.gg-letter-3d') || letters[0];
    const letterH = firstInner.getBoundingClientRect().height || 28;

    const containerH = logo.clientHeight;
    const targetTop = Math.max(0, bottom.offsetTop - GAP_ABOVE_BOTTOM_PX - letterH);
    const flatBottom = Math.max(0, containerH - targetTop - letterH);

    const widths = measureWidthsOffDom(logo, letters);

    let total = 0;
    for (let i = 0; i < widths.length; i++) {
      total += widths[i];
      if (i < widths.length - 1) total += LETTER_GAP_PX;
      if (i === WORD_BREAK_AFTER_INDEX - 1) total += WORD_GAP_PX;
    }
    if (total <= 0) return null;

    const scale = Math.min(1, available / total);
    if (!Number.isFinite(scale) || scale < MIN_SCALE) return null;

    const anchorCenter = bottom.offsetLeft + (bottomW / 2);
    let cursor = Math.round(anchorCenter - (total * scale) / 2);
    if (cursor < 0) cursor = 0;

    const placements = [];
    for (let i = 0; i < letters.length; i++) {
      placements.push({ left: cursor, bottom: flatBottom });
      if (i < letters.length - 1) {
        cursor += (widths[i] + LETTER_GAP_PX) * scale;
        if (i === WORD_BREAK_AFTER_INDEX - 1) cursor += WORD_GAP_PX * scale;
      }
    }

    const shift = LAST_TWO_SHIFT_PX * scale;
    placements[placements.length - 2].left += shift;
    placements[placements.length - 1].left += shift;

    return { placements, scale };
  }

  function ensureCachedLayout() {
    const logo = getLogo();
    if (!logo) return null;
    if (logo.offsetParent === null) return null;

    const sig = layoutSignature(logo);
    if (cached && cachedSig === sig) return cached;

    const layout = computeFlatLayout(logo);
    if (!layout) return null;

    cached = layout;
    cachedSig = sig;
    return cached;
  }

  async function waitForUsableLayout() {
    for (let i = 0; i < MAX_LAYOUT_RAF_TRIES; i++) {
      const layout = ensureCachedLayout();
      if (layout) return layout;
      await raf();
    }
    return null;
  }

  function prewarm() {
    const run = () => {
      const logo = getLogo();
      if (!logo || logo.offsetParent === null) return;
      ensureCachedLayout();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        invalidateCache();
        run();
      }).catch(() => run());
    } else {
      run();
    }

    const logo = getLogo();
    if (!logo) return;

    const imgs = Array.from(logo.querySelectorAll('img'));
    if (imgs.length) {
      let pending = 0;
      const done = () => {
        pending -= 1;
        if (pending <= 0) {
          invalidateCache();
          run();
        }
      };

      imgs.forEach((img) => {
        if (img.complete) return;
        pending += 1;
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    }

    if ('requestIdleCallback' in window) window.requestIdleCallback(() => run(), { timeout: 1500 });
    else window.setTimeout(() => run(), 60);
  }

  async function toFlat() {
    const animId = ++currentAnimationId;
    const logo = getLogo();
    if (!logo || logo.offsetParent === null) return;

    const letters = getLetters(logo);
    if (!letters.length) return;

    logo.classList.add('is-bridge-hidden');

    if (!prefersReducedMotion()) await waitMs(BRIDGE_FADE_MS + 40);
    if (animId !== currentAnimationId) return;

    invalidateCache();
    const layout = await waitForUsableLayout();
    if (!layout) return;
    if (animId !== currentAnimationId) return;

    snapshotInline(letters);

    letters[0].getBoundingClientRect();
    await raf();
    await raf();
    if (animId !== currentAnimationId) return;

    for (let i = 0; i < letters.length; i++) {
      const p = layout.placements[i];
      letters[i].style.left = `${Math.round(p.left)}px`;
      letters[i].style.bottom = `${Math.round(p.bottom)}px`;
      letters[i].style.transformOrigin = 'left bottom';
      letters[i].style.transform = `scale(${layout.scale}) rotate(0deg)`;
    }

    if (!prefersReducedMotion()) await waitMs(LETTER_MOVE_MS + 60);
  }

  async function toDefault() {
    const animId = ++currentAnimationId;
    const logo = getLogo();
    if (!logo || logo.offsetParent === null) return;

    const letters = getLetters(logo);
    if (!letters.length) return;

    letters[0].getBoundingClientRect();
    await raf();
    await raf();
    if (animId !== currentAnimationId) return;

    restoreInline(letters);

    if (!prefersReducedMotion()) await waitMs(LETTER_MOVE_MS + 60);
    if (animId !== currentAnimationId) return;

    logo.classList.remove('is-bridge-hidden');
    if (!prefersReducedMotion()) await waitMs(BRIDGE_FADE_MS + 40);
  }

  function hardReset() {
    currentAnimationId++;
    const logo = getLogo();
    if (!logo) return;

    // Always clear transition suppression
    logo.classList.remove('no-transition');

    const letters = getLetters(logo);
    letters.forEach((el) => {
      el.removeAttribute('style');
      if (el.style) el.style.transition = '';
      delete el.dataset.ggmsInline;
    });

    logo.getBoundingClientRect();
    logo.classList.remove('is-bridge-hidden');
    logo.classList.remove('is-flat');

    const bridge = logo.querySelector('[data-ggms-bridge]');
    if (bridge) {
      bridge.style.transition = '';
      bridge.style.opacity = '';
      bridge.style.transform = '';
    }

    // Force fresh measurements after reset
    invalidateCache();
  }

  function toFlatInstant() {
    const animId = ++currentAnimationId;
    const logo = getLogo();
    if (!logo || logo.offsetParent === null) return;

    const letters = getLetters(logo);
    if (!letters.length) return;

    const bridge = logo.querySelector(BRIDGE_SEL);

    const cleanup = () => {
      if (animId !== currentAnimationId) return;
      logo.classList.remove('no-transition');
      letters.forEach((el) => { el.style.transition = ''; });
      if (bridge) bridge.removeAttribute('style');
    };

    const attempt = async () => {
      if (animId !== currentAnimationId) return;

      logo.classList.add('no-transition');

      if (bridge) {
        bridge.style.transition = 'none';
        bridge.style.opacity = '0';
      }

      letters.forEach((el) => { el.style.transition = 'none'; });

      invalidateCache();
      const layout = await waitForUsableLayout();
      if (!layout) {
        cleanup();
        return;
      }
      if (animId !== currentAnimationId) return;

      snapshotInline(letters);

      logo.getBoundingClientRect();

      for (let i = 0; i < letters.length; i++) {
        const p = layout.placements[i];
        letters[i].style.left = `${Math.round(p.left)}px`;
        letters[i].style.bottom = `${Math.round(p.bottom)}px`;
        letters[i].style.transformOrigin = 'left bottom';
        letters[i].style.transform = `scale(${layout.scale}) rotate(0deg)`;
      }

      logo.classList.add('is-bridge-hidden');
      logo.classList.add('is-flat');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => cleanup());
      });

      window.setTimeout(() => cleanup(), 250);
    };

    attempt();
  }

  function toggle() {
    const logo = getLogo();
    if (!logo) return;
    const letters = getLetters(logo);
    const flat = letters.some((el) => el.dataset.ggmsInline != null);
    if (flat) return toDefault();
    return toFlat();
  }

  let resizeT = null;
  function onResize() {
    if (resizeT) window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      invalidateCache();
      prewarm();
    }, 120);
  }

  function boot() {
    prewarm();
    window.addEventListener('resize', onResize, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.GGMSLogoLockup = { toFlat, toFlatInstant, toDefault, toggle, prewarm, hardReset, invalidateCache };
})();
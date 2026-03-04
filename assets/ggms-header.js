(() => {
  const HEADER_SEL = '[data-site-header]';
  const LOGO_SEL = '[data-ggms-logo]';

  const HEIGHT_FULL = '8rem';
  const HEIGHT_COMPACT = '5rem';
  const FLAT_CLASS = 'is-flat';
  const NO_TRANSITION_CLASS = 'no-transition';
  const SCROLL_THRESHOLD = 150;

  let isCompact = false;
  let animating = false;
  let pendingCompact = false;
  let pendingFull = false;

  const isMobile = () => window.innerWidth < 768;
  const getHeader = () => document.querySelector(HEADER_SEL);
  const getLogo = () => {
    const header = getHeader();
    return header ? header.querySelector(LOGO_SEL) : null;
  };

  const getWrapper = () => {
    const logo = getLogo();
    if (!logo) return null;
    return logo.closest('[data-ggms-logo-wrapper]')
      || logo.closest('.hidden.md\\:block, [class*="hidden"][class*="md:block"]')
      || logo.parentElement;
  };

  const clearTransitionLocks = () => {
    const logo = getLogo();
    if (!logo) return;

    logo.classList.remove(NO_TRANSITION_CLASS);

    const letters = Array.from(logo.querySelectorAll('.ggms-letter'));
    letters.forEach((el) => {
      if (el.style && el.style.transition === 'none') el.style.transition = '';
    });

    const bridge = logo.querySelector('[data-ggms-bridge]');
    if (bridge && bridge.style && bridge.style.transition === 'none') bridge.style.transition = '';
  };

  const toCompact = async (header) => {
    if (isCompact) return;
    if (animating) { pendingCompact = true; pendingFull = false; return; }
    pendingCompact = false;
    animating = true;
    try {
      clearTransitionLocks();

      if (window.GGMSLogoLockup?.toFlat) await window.GGMSLogoLockup.toFlat();

      // Keep this (your CSS likely keys off it)
      const logo = getLogo();
      if (logo) logo.classList.add(FLAT_CLASS);

      header.style.height = HEIGHT_COMPACT;
      header.classList.add('is-compact');
      document.documentElement.style.setProperty('--header-h-current', HEIGHT_COMPACT);
      isCompact = true;
    } finally {
      animating = false;
      if (pendingFull) toFull(header);
      else if (pendingCompact) toCompact(header);
    }
  };

  const toFull = async (header) => {
    if (!isCompact) return;
    if (animating) { pendingFull = true; pendingCompact = false; return; }
    pendingFull = false;
    animating = true;
    try {
      clearTransitionLocks();

      const logo = getLogo();
      if (logo) logo.classList.remove(FLAT_CLASS);

      header.style.height = HEIGHT_FULL;
      header.classList.remove('is-compact');
      document.documentElement.style.setProperty('--header-h-current', HEIGHT_FULL);

      if (window.GGMSLogoLockup?.toDefault) await window.GGMSLogoLockup.toDefault();

      isCompact = false;
    } finally {
      animating = false;
      if (pendingCompact) toCompact(header);
      else if (pendingFull) toFull(header);
    }
  };

  const initDesktop = (header) => {
    if (header._scrollCleanup) { header._scrollCleanup(); header._scrollCleanup = null; }

    if (window.GGMSLogoLockup?.hardReset) window.GGMSLogoLockup.hardReset();
    if (window.GGMSLogoLockup?.invalidateCache) window.GGMSLogoLockup.invalidateCache();

    clearTransitionLocks();

    const wrapper = getWrapper();

    if (window.scrollY > SCROLL_THRESHOLD) {
      header.style.transition = 'none';
      header.style.height = HEIGHT_COMPACT;
      header.classList.add('is-compact');
      document.documentElement.style.setProperty('--header-h-current', HEIGHT_COMPACT);
      requestAnimationFrame(() => { header.style.transition = ''; });

      if (window.GGMSLogoLockup?.toFlatInstant) window.GGMSLogoLockup.toFlatInstant();
      isCompact = true;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (wrapper) wrapper.classList.remove('invisible');
          });
        });
      });
    } else {
      header.style.transition = 'none';
      header.style.height = HEIGHT_FULL;
      header.classList.remove('is-compact');
      document.documentElement.style.setProperty('--header-h-current', HEIGHT_FULL);
      requestAnimationFrame(() => { header.style.transition = ''; });

      if (wrapper) wrapper.classList.remove('invisible');
      isCompact = false;
    }

    let scrollTimer = null;
    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = requestAnimationFrame(() => {
        scrollTimer = null;
        if (window.scrollY > SCROLL_THRESHOLD && !isCompact) toCompact(header);
        else if (window.scrollY <= SCROLL_THRESHOLD && isCompact) toFull(header);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    header._scrollCleanup = () => window.removeEventListener('scroll', onScroll);
  };

  const initMobile = (header) => {
    if (header._scrollCleanup) { header._scrollCleanup(); header._scrollCleanup = null; }
    if (window.GGMSLogoLockup?.hardReset) window.GGMSLogoLockup.hardReset();

    // Pre-hide for return trip to desktop
    const wrapper = getWrapper();
    if (wrapper) wrapper.classList.add('invisible');

    clearTransitionLocks();

    header.style.height = '';
    header.style.transition = '';
    header.classList.remove('is-compact');
    isCompact = false;
    animating = false;
    pendingCompact = false;
    pendingFull = false;
  };

  let lastMobile = null;
  let resizeTimer = null;

  const init = () => {
    const header = getHeader();
    if (!header) return;

    lastMobile = isMobile();
    if (lastMobile) initMobile(header);
    else initDesktop(header);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        header.classList.add('is-ready');
      });
    });

    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nowMobile = isMobile();
        if (nowMobile === lastMobile) return;
        lastMobile = nowMobile;

        isCompact = false;
        animating = false;
        pendingCompact = false;
        pendingFull = false;

        if (nowMobile) {
          initMobile(header);
        } else {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              initDesktop(header);
            });
          });
        }
      }, 300);
    }, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
(() => {
  const GGMS = (window.GGMS = window.GGMS || {})
  if (GGMS.drawer) return

  const SELECTORS = {
    root: '[data-drawer-root]',
    layer: '[data-drawer-layer]',
    panel: '[data-drawer-panel]',
    overlay: '[data-drawer-overlay]',
    open: '[data-drawer-open]',
    close: '[data-drawer-close]',
  }

  let activeDrawerId = null
  let returnFocusEl = null

  function getDrawerRootById(id) {
    return document.querySelector(`${SELECTORS.root}[data-drawer-id="${CSS.escape(id)}"]`)
  }

  function getLayer(root) {
    return root?.querySelector(SELECTORS.layer) || null
  }

  function getPanel(root) {
    return root?.querySelector(SELECTORS.panel) || null
  }

  function getOverlay(root) {
    return root?.querySelector(SELECTORS.overlay) || null
  }

  function getOpenTriggerById(id) {
    return document.querySelector(`${SELECTORS.open}[data-drawer-open="${CSS.escape(id)}"]`)
  }

  function isOpen(id) {
    const root = getDrawerRootById(id)
    const layer = getLayer(root)
    return !!(layer && !layer.classList.contains('hidden'))
  }

  function focusables(panel) {
    if (!panel) return []
    const els = panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')
    return Array.from(els).filter((el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length))
  }

  function lockBody(root) {
    if (!root) return
    if (root.dataset.drawerBodyLock !== 'true') return
    document.body.classList.add('overflow-hidden')
  }

  function unlockBody(root) {
    if (!root) return
    if (root.dataset.drawerBodyLock !== 'true') return
    document.body.classList.remove('overflow-hidden')
  }

  function applyOpenTransform(panel, side) {
    if (!panel) return
    if (side === 'left') {
      panel.classList.remove('-translate-x-full')
      panel.classList.add('translate-x-0')
      return
    }
    panel.classList.remove('translate-x-full')
    panel.classList.add('translate-x-0')
  }

  function applyCloseTransform(panel, side) {
    if (!panel) return
    panel.classList.remove('translate-x-0')
    if (side === 'left') {
      panel.classList.add('-translate-x-full')
      return
    }
    panel.classList.add('translate-x-full')
  }

  function open(id, opener = null) {
    if (!id) return
    if (activeDrawerId && activeDrawerId !== id) {
      close(activeDrawerId, { restoreFocus: false })
    }

    const root = getDrawerRootById(id)
    const layer = getLayer(root)
    const panel = getPanel(root)
    if (!root || !layer || !panel) return

    const side = root.dataset.drawerSide || 'right'
    returnFocusEl = opener || document.activeElement || getOpenTriggerById(id) || null

    layer.classList.remove('hidden')
    lockBody(root)

    requestAnimationFrame(() => {
      applyOpenTransform(panel, side)
    })

    activeDrawerId = id

    const trigger = opener || getOpenTriggerById(id)
    if (trigger) trigger.setAttribute('aria-expanded', 'true')

    const closeBtn = root.querySelector(`${SELECTORS.close}`)
    if (closeBtn) closeBtn.focus()
    else panel.focus()
  }

  function close(id, options = {}) {
    if (!id) return
    const root = getDrawerRootById(id)
    const layer = getLayer(root)
    const panel = getPanel(root)
    if (!root || !layer || !panel) return

    const side = root.dataset.drawerSide || 'right'
    const restoreFocus = options.restoreFocus !== false

    const done = () => {
      layer.classList.add('hidden')
      unlockBody(root)
      panel.removeEventListener('transitionend', done)

      const trigger = getOpenTriggerById(id)
      if (trigger) trigger.setAttribute('aria-expanded', 'false')

      if (restoreFocus && returnFocusEl && typeof returnFocusEl.focus === 'function') {
        returnFocusEl.focus()
      }

      if (activeDrawerId === id) activeDrawerId = null
      if (restoreFocus) returnFocusEl = null
    }

    panel.addEventListener('transitionend', done, { once: true })
    setTimeout(done, 350)
    applyCloseTransform(panel, side)
  }

  function toggle(id, opener = null) {
    if (isOpen(id)) {
      close(id)
      return
    }
    open(id, opener)
  }

  function closeCurrent() {
    if (!activeDrawerId) return
    close(activeDrawerId)
  }

  document.addEventListener('click', (event) => {
    const openBtn = event.target.closest(SELECTORS.open)
    if (openBtn) {
      const id = openBtn.getAttribute('data-drawer-open')
      if (!id) return
      open(id, openBtn)
      return
    }

    const closeBtn = event.target.closest(SELECTORS.close)
    if (closeBtn) {
      const root = closeBtn.closest(SELECTORS.root)
      const id = root?.dataset?.drawerId
      if (!id) return
      close(id)
      return
    }

    const overlay = event.target.closest(SELECTORS.overlay)
    if (overlay) {
      const root = overlay.closest(SELECTORS.root)
      if (!root) return
      if (root.dataset.drawerCloseOnOverlay !== 'true') return
      const id = root.dataset.drawerId
      if (!id) return
      close(id)
    }
  }, true)

  document.addEventListener('keydown', (event) => {
    if (!activeDrawerId) return

    const root = getDrawerRootById(activeDrawerId)
    const panel = getPanel(root)
    if (!root || !panel) return

    if ((event.key === 'Escape' || event.key === 'Esc') && root.dataset.drawerCloseOnEscape === 'true') {
      event.preventDefault()
      close(activeDrawerId)
      return
    }

    if (event.key !== 'Tab') return

    const list = focusables(panel)
    if (!list.length) return

    const first = list[0]
    const last = list[list.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, true)

  GGMS.drawer = {
    open,
    close,
    toggle,
    isOpen,
    closeCurrent,
  }
})()
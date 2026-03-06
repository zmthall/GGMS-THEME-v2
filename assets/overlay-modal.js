(() => {
  const GGMS = (window.GGMS = window.GGMS || {})
  if (GGMS.modal) return

  const SELECTORS = {
    root: '[data-modal-root]',
    layer: '[data-modal-layer]',
    panel: '[data-modal-panel]',
    overlay: '[data-modal-overlay]',
    open: '[data-modal-open]',
    close: '[data-modal-close]',
  }

  let activeModalId = null
  let returnFocusEl = null

  function getModalRootById(id) {
    return document.querySelector(`${SELECTORS.root}[data-modal-id="${CSS.escape(id)}"]`)
  }

  function getLayer(root) {
    return root?.querySelector(SELECTORS.layer) || null
  }

  function getPanel(root) {
    return root?.querySelector(SELECTORS.panel) || null
  }

  function getOpenTriggerById(id) {
    return document.querySelector(`${SELECTORS.open}[data-modal-open="${CSS.escape(id)}"]`)
  }

  function isOpen(id) {
    const root = getModalRootById(id)
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
    if (root.dataset.modalBodyLock !== 'true') return
    document.body.classList.add('overflow-hidden')
  }

  function unlockBody(root) {
    if (!root) return
    if (root.dataset.modalBodyLock !== 'true') return
    document.body.classList.remove('overflow-hidden')
  }

  function applyOpenState(panel) {
    if (!panel) return
    panel.classList.remove('opacity-0', 'translate-y-2', 'scale-[0.98]')
    panel.classList.add('opacity-100', 'translate-y-0', 'scale-100')
  }

  function applyCloseState(panel) {
    if (!panel) return
    panel.classList.remove('opacity-100', 'translate-y-0', 'scale-100')
    panel.classList.add('opacity-0', 'translate-y-2', 'scale-[0.98]')
  }

  function open(id, opener = null) {
    if (!id) return
    if (activeModalId && activeModalId !== id) {
      close(activeModalId, { restoreFocus: false })
    }

    const root = getModalRootById(id)
    const layer = getLayer(root)
    const panel = getPanel(root)
    if (!root || !layer || !panel) return

    returnFocusEl = opener || document.activeElement || getOpenTriggerById(id) || null

    layer.classList.remove('hidden')
    lockBody(root)

    requestAnimationFrame(() => {
      applyOpenState(panel)
    })

    activeModalId = id

    const trigger = opener || getOpenTriggerById(id)
    if (trigger) trigger.setAttribute('aria-expanded', 'true')

    const closeBtn = root.querySelector(SELECTORS.close)
    if (closeBtn) closeBtn.focus()
    else panel.focus()
  }

  function close(id, options = {}) {
    if (!id) return
    const root = getModalRootById(id)
    const layer = getLayer(root)
    const panel = getPanel(root)
    if (!root || !layer || !panel) return

    const restoreFocus = options.restoreFocus !== false

    const done = () => {
      layer.classList.add('hidden')
      unlockBody(root)

      const trigger = getOpenTriggerById(id)
      if (trigger) trigger.setAttribute('aria-expanded', 'false')

      if (restoreFocus && returnFocusEl && typeof returnFocusEl.focus === 'function') {
        returnFocusEl.focus()
      }

      if (activeModalId === id) activeModalId = null
      if (restoreFocus) returnFocusEl = null
    }

    applyCloseState(panel)
    window.setTimeout(done, 250)
  }

  function toggle(id, opener = null) {
    if (isOpen(id)) {
      close(id)
      return
    }
    open(id, opener)
  }

  function closeCurrent() {
    if (!activeModalId) return
    close(activeModalId)
  }

  document.addEventListener('click', (event) => {
    const openBtn = event.target.closest(SELECTORS.open)
    if (openBtn) {
      const id = openBtn.getAttribute('data-modal-open')
      if (!id) return
      open(id, openBtn)
      return
    }

    const closeBtn = event.target.closest(SELECTORS.close)
    if (closeBtn) {
      const root = closeBtn.closest(SELECTORS.root)
      const id = root?.dataset?.modalId
      if (!id) return
      close(id)
      return
    }

    const overlay = event.target.closest(SELECTORS.overlay)
        if (overlay) {
        const root = overlay.closest(SELECTORS.root)
        if (!root) return
        if (root.dataset.modalCloseOnOverlay !== 'true') return

        const panel = root.querySelector(SELECTORS.panel)
        if (panel && panel.contains(event.target)) return

        const id = root.dataset.modalId
        if (!id) return
        close(id)
    }
  }, true)

  document.addEventListener('keydown', (event) => {
    if (!activeModalId) return

    const root = getModalRootById(activeModalId)
    const panel = getPanel(root)
    if (!root || !panel) return

    if ((event.key === 'Escape' || event.key === 'Esc') && root.dataset.modalCloseOnEscape === 'true') {
      event.preventDefault()
      close(activeModalId)
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

  GGMS.modal = {
    open,
    close,
    toggle,
    isOpen,
    closeCurrent,
  }
})()
(() => {
  const GGMS = (window.GGMS = window.GGMS || {})
  if (GGMS.popover) return

  const SELECTORS = {
    root: '[data-popover-root]',
    panel: '[data-popover-panel]',
    toggle: '[data-popover-toggle]',
    open: '[data-popover-open]',
    close: '[data-popover-close]',
  }

  let activePopoverId = null

  function getRootById(id) {
    return document.querySelector(`${SELECTORS.root}[data-popover-id="${CSS.escape(id)}"]`)
  }

  function getPanel(root) {
    return root?.querySelector(SELECTORS.panel) || null
  }

  function getToggleTriggerById(id) {
    return document.querySelector(`${SELECTORS.toggle}[data-popover-toggle="${CSS.escape(id)}"]`)
      || document.querySelector(`${SELECTORS.open}[data-popover-open="${CSS.escape(id)}"]`)
  }

  function isOpen(id) {
    const root = getRootById(id)
    const panel = getPanel(root)
    return !!(panel && !panel.classList.contains('hidden'))
  }

  function applyOpenState(panel) {
    if (!panel) return
    panel.classList.remove('hidden', 'opacity-0', 'scale-95')
    requestAnimationFrame(() => {
      panel.classList.remove('opacity-0', 'scale-95')
      panel.classList.add('opacity-100', 'scale-100')
    })
  }

  function applyCloseState(panel) {
    if (!panel) return
    panel.classList.remove('opacity-100', 'scale-100')
    panel.classList.add('opacity-0', 'scale-95')
    window.setTimeout(() => {
      panel.classList.add('hidden')
    }, 250)
  }

  function open(id) {
    if (!id) return

    if (activePopoverId && activePopoverId !== id) {
      close(activePopoverId)
    }

    const root = getRootById(id)
    const panel = getPanel(root)
    if (!root || !panel) return

    applyOpenState(panel)
    activePopoverId = id

    const trigger = getToggleTriggerById(id)
    if (trigger) trigger.setAttribute('aria-expanded', 'true')
  }

  function close(id) {
    if (!id) return

    const root = getRootById(id)
    const panel = getPanel(root)
    if (!root || !panel) return

    applyCloseState(panel)

    const trigger = getToggleTriggerById(id)
    if (trigger) trigger.setAttribute('aria-expanded', 'false')

    if (activePopoverId === id) activePopoverId = null
  }

  function toggle(id) {
    if (!id) return
    if (isOpen(id)) {
      close(id)
      return
    }
    open(id)
  }

  function closeAll() {
    document.querySelectorAll(SELECTORS.root).forEach((root) => {
      const id = root.dataset.popoverId
      if (id) close(id)
    })
  }

  document.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest(SELECTORS.toggle)
    if (toggleBtn) {
      const id = toggleBtn.getAttribute('data-popover-toggle')
      if (!id) return
      toggle(id)
      return
    }

    const openBtn = event.target.closest(SELECTORS.open)
    if (openBtn) {
      const id = openBtn.getAttribute('data-popover-open')
      if (!id) return
      open(id)
      return
    }

    const closeBtn = event.target.closest(SELECTORS.close)
    if (closeBtn) {
      const root = closeBtn.closest(SELECTORS.root)
      const id = root?.dataset?.popoverId
      if (!id) return
      close(id)
      return
    }

    if (!activePopoverId) return

    const activeRoot = getRootById(activePopoverId)
    if (!activeRoot) return

    const clickedInside = activeRoot.contains(event.target)

    if (clickedInside) {
      if (activeRoot.dataset.popoverCloseOnInsideClick === 'true') {
        const panel = getPanel(activeRoot)
        if (panel && panel.contains(event.target)) {
          close(activePopoverId)
        }
      }
      return
    }

    if (activeRoot.dataset.popoverCloseOnOutside === 'true') {
      close(activePopoverId)
    }
  }, true)

  document.addEventListener('keydown', (event) => {
    if (!activePopoverId) return

    const root = getRootById(activePopoverId)
    if (!root) return

    if ((event.key === 'Escape' || event.key === 'Esc') && root.dataset.popoverCloseOnEscape === 'true') {
      event.preventDefault()
      close(activePopoverId)
    }
  }, true)

  GGMS.popover = {
    open,
    close,
    toggle,
    isOpen,
    closeAll,
  }
})()
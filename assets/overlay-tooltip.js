(() => {
  const GGMS = (window.GGMS = window.GGMS || {})
  if (GGMS.tooltip) return

  const SELECTORS = {
    root: '[data-tooltip-root]',
    trigger: '[data-tooltip-trigger]',
    panel: '[data-tooltip-panel]',
  }

  let activeTooltip = null
  let hideTimer = null

  function getPanel(root) {
    return root?.querySelector(SELECTORS.panel) || null
  }

  function show(root) {
    if (!root) return
    const panel = getPanel(root)
    if (!panel) return

    if (activeTooltip && activeTooltip !== root) {
      hide(activeTooltip)
    }

    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    panel.classList.remove('hidden')
    requestAnimationFrame(() => {
      panel.classList.remove('opacity-0', 'scale-95')
      panel.classList.add('opacity-100', 'scale-100')
    })

    activeTooltip = root
  }

  function hide(root) {
    if (!root) return
    const panel = getPanel(root)
    if (!panel) return

    panel.classList.remove('opacity-100', 'scale-100')
    panel.classList.add('opacity-0', 'scale-95')

    hideTimer = window.setTimeout(() => {
      panel.classList.add('hidden')
      if (activeTooltip === root) activeTooltip = null
    }, 150)
  }

  function bindRoot(root) {
    if (!root || root._tooltipInit) return
    root._tooltipInit = true

    const trigger = root.querySelector(SELECTORS.trigger)
    if (!trigger) return

    trigger.addEventListener('mouseenter', () => show(root))
    trigger.addEventListener('mouseleave', () => hide(root))
    trigger.addEventListener('focus', () => show(root), true)
    trigger.addEventListener('blur', () => hide(root), true)
  }

  function init(scope = document) {
    scope.querySelectorAll(SELECTORS.root).forEach(bindRoot)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true })
  } else {
    init()
  }

  GGMS.tooltip = { init }
})()
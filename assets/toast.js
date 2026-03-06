(() => {
  if (window.GGMSToast) return

  const DESKTOP_BREAKPOINT = 768
  const TOAST_CONTAINER_ID = 'ggms-toast-container'
  const DEFAULT_AUTOHIDE_DELAY = 8000
  const MAX_VISIBLE_TOASTS = 5
  const EXIT_DURATION = 250

  const VARIANT_CONFIG = {
    info: {
      role: 'status',
      autohide: true,
      card: 'border-border bg-surface text-text',
      badge: 'border border-border bg-page text-muted',
      actionLink: 'text-link hover:text-link-hover',
      accentText: 'text-muted',
      iconName: 'information',
      iconType: 'local',
    },
    success: {
      role: 'status',
      autohide: true,
      card: 'border-success/35 bg-surface text-text',
      badge: 'border border-success/20 bg-success/10 text-success',
      actionLink: 'text-link hover:text-link-hover',
      accentText: 'text-success',
      iconName: 'check',
      iconType: 'local',
    },
    warning: {
      role: 'status',
      autohide: true,
      card: 'border-warning/35 bg-surface text-text',
      badge: 'border border-warning/20 bg-warning/10 text-warning',
      actionLink: 'text-link hover:text-link-hover',
      accentText: 'text-warning',
      iconName: 'warning',
      iconType: 'local',
    },
    danger: {
      role: 'alert',
      autohide: false,
      card: 'border-danger/40 bg-surface text-text',
      badge: 'border border-danger/20 bg-danger/10 text-danger',
      actionLink: 'text-link hover:text-link-hover',
      accentText: 'text-danger',
      iconName: 'cancel',
      iconType: 'local',
    },
    cart: {
      role: 'status',
      autohide: true,
      card: 'border-border bg-surface text-text',
      badge: 'border border-brand-blue/20 bg-brand-blue/10 text-brand-blue',
      actionLink: 'text-link hover:text-link-hover',
      accentText: 'text-brand-blue',
      iconName: 'cart',
      iconType: 'local',
    },
  }

  function canShowToasts() {
    return window.innerWidth >= DESKTOP_BREAKPOINT
  }

  function ensureContainer() {
    if (!canShowToasts()) return null

    let container = document.getElementById(TOAST_CONTAINER_ID)
    if (container) return container

    container = document.createElement('div')
    container.id = TOAST_CONTAINER_ID
    container.setAttribute('aria-live', 'polite')
    container.setAttribute('aria-relevant', 'additions removals')
    container.className = 'pointer-events-none fixed bottom-6 left-4 z-toast flex w-[26rem] max-w-[calc(100vw-2rem)] flex-col gap-3'
    document.body.appendChild(container)

    return container
  }

  function getVisibleToasts(container) {
    return Array.from(container.querySelectorAll('[data-toast-id]')).filter((toast) => toast.dataset.toastClosing !== 'true')
  }

  function normalizeOptions(options = {}) {
    const variant = VARIANT_CONFIG[options.variant] ? options.variant : 'info'
    const config = VARIANT_CONFIG[variant]

    return {
      id: options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      variant,
      title: typeof options.title === 'string' ? options.title.trim() : '',
      message: typeof options.message === 'string' ? options.message.trim() : '',
      actionLabel: typeof options.actionLabel === 'string' ? options.actionLabel.trim() : '',
      actionUrl: typeof options.actionUrl === 'string' ? options.actionUrl.trim() : '',
      dismissible: typeof options.dismissible === 'boolean' ? options.dismissible : true,
      autohide: typeof options.autohide === 'boolean' ? options.autohide : config.autohide,
      autohideDelay: Number.isFinite(options.autohideDelay) ? Math.max(1000, options.autohideDelay) : DEFAULT_AUTOHIDE_DELAY,
      role: options.role === 'alert' ? 'alert' : config.role,
      config,
    }
  }

  function buildToast(options) {
    const toast = document.createElement('section')
    toast.dataset.toastId = options.id
    toast.dataset.toastVariant = options.variant
    toast.setAttribute('role', options.role)
    toast.className = [
      'pointer-events-auto relative w-full overflow-hidden rounded-card border-2 shadow-md transition-all duration-normal ease-standard',
      'opacity-0 translate-y-2',
      options.config.card,
    ].join(' ')

    const inner = document.createElement('div')
    inner.className = 'flex items-start gap-3 p-4'

    const badge = document.createElement('div')
    badge.className = [
      'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
      options.config.badge,
    ].join(' ')
    badge.setAttribute('aria-hidden', 'true')
    badge.innerHTML = renderUiIconMarkup({
      name: options.config.iconName,
      type: options.config.iconType,
      size: '1.25rem',
      className: `${options.config.accentText} pointer-events-none`,
      decorative: true,
    })

    const content = document.createElement('div')
    content.className = 'min-w-0 flex-1'

    if (options.title) {
      const title = document.createElement('p')
      title.className = `font-heading text-base font-semibold leading-tight text-text ${options.variant === 'info' || options.variant === 'cart' ? '' : options.config.accentText}`.trim()
      title.textContent = options.title
      content.appendChild(title)
    }

    if (options.message) {
      const message = document.createElement('p')
      message.className = options.title ? 'mt-1 text-sm leading-6 text-text' : 'text-sm leading-6 text-text'
      message.textContent = options.message
      content.appendChild(message)
    }

    if (options.actionLabel && options.actionUrl) {
      const actionWrap = document.createElement('div')
      actionWrap.className = 'mt-2'

      const action = document.createElement('a')
      action.href = options.actionUrl
      action.className = [
        'inline-flex justify-center items-center gap-1 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-page',
        options.config.actionLink,
      ].join(' ')
      action.innerHTML = `<span class="underline underline-offset-4">${escapeHtml(options.actionLabel)}</span>`

      actionWrap.appendChild(action)
      content.appendChild(actionWrap)
    }

    inner.appendChild(badge)
    inner.appendChild(content)

    if (options.dismissible) {
        const dismiss = document.createElement('button')
        dismiss.type = 'button'
        dismiss.className = 'cursor-pointer inline-flex items-center justify-center rounded-md p-2 text-text hover:bg-button-hover hover:text-link focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
        dismiss.setAttribute('aria-label', 'Dismiss notification')
        dismiss.innerHTML = renderUiIconMarkup({
            name: 'cancel',
            type: 'local',
            size: '1.5rem',
            className: 'text-base-icon',
            decorative: true,
        })
        dismiss.addEventListener('click', () => dismissToast(toast))
        inner.appendChild(dismiss)
    }

    toast.appendChild(inner)

    return toast
  }

  function startAutohideTimer(toast, delay) {
    if (!delay || delay < 1) return
    clearToastTimer(toast)

    const timer = window.setTimeout(() => {
      dismissToast(toast)
    }, delay)

    toast.dataset.toastTimer = String(timer)
  }

  function clearToastTimer(toast) {
    if (!toast?.dataset?.toastTimer) return
    window.clearTimeout(Number(toast.dataset.toastTimer))
    delete toast.dataset.toastTimer
  }

  function bindHoverPause(toast, options) {
    if (!options.autohide) return

    toast.addEventListener('mouseenter', () => {
      clearToastTimer(toast)
    })

    toast.addEventListener('mouseleave', () => {
      if (toast.dataset.toastClosing === 'true') return
      startAutohideTimer(toast, 1500)
    })
  }

  function enforceMaxVisible(container) {
    const visibleToasts = getVisibleToasts(container)
    if (visibleToasts.length < MAX_VISIBLE_TOASTS) return

    const oldestToast = visibleToasts[0]
    if (oldestToast) dismissToast(oldestToast)
  }

  function showToast(options = {}) {
    if (!canShowToasts()) return undefined

    const normalized = normalizeOptions(options)
    if (!normalized.title && !normalized.message) return undefined

    const container = ensureContainer()
    if (!container) return undefined

    enforceMaxVisible(container)

    const toast = buildToast(normalized)
    container.appendChild(toast)

    bindHoverPause(toast, normalized)

    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-2')
      toast.classList.add('opacity-100', 'translate-y-0')
    })

    if (normalized.autohide) {
      startAutohideTimer(toast, normalized.autohideDelay)
    }

    return toast
  }

  function dismissToast(toastOrId) {
    const toast = typeof toastOrId === 'string'
      ? document.querySelector(`[data-toast-id="${CSS.escape(toastOrId)}"]`)
      : toastOrId

    if (!toast || toast.dataset.toastClosing === 'true') return

    toast.dataset.toastClosing = 'true'
    clearToastTimer(toast)

    toast.classList.remove('opacity-100', 'translate-y-0')
    toast.classList.add('opacity-0', 'translate-y-2')

    window.setTimeout(() => {
      toast.remove()
    }, EXIT_DURATION)
  }

  function clearToasts() {
    const container = document.getElementById(TOAST_CONTAINER_ID)
    if (!container) return

    Array.from(container.querySelectorAll('[data-toast-id]')).forEach((toast) => {
      dismissToast(toast)
    })
  }

  function renderUiIconMarkup({ name, type = 'local', size = '1.25rem', className = '', decorative = true, label = '' }) {
    if (!name) return ''

    const aria = decorative || !label
      ? 'aria-hidden="true"'
      : `role="img" aria-label="${escapeAttribute(label)}"`

    if (type === 'iconify' || name.includes(':')) {
      return `
        <span class="ui-icon ${className} pointer-events-none" style="--ui-icon-size: ${size};" ${aria}>
          <iconify-icon icon="${escapeAttribute(name)}"></iconify-icon>
        </span>
      `
    }

    return `
      <span class="ui-icon ${className} pointer-events-none" style="--ui-icon-size: ${size};" ${aria}>
        <svg xmlns="http://www.w3.org/2000/svg">
          <use href="#icon-${escapeAttribute(name)}"></use>
        </svg>
      </span>
    `
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function escapeAttribute(value) {
    return escapeHtml(value)
  }

  window.toastTest = {
    info: () => window.GGMSToast?.show({ variant: 'info', title: 'Info', message: 'Info toast test.' }),
    success: () => window.GGMSToast?.show({ variant: 'success', title: 'Success', message: 'Success toast test.' }),
    warning: () => window.GGMSToast?.show({ variant: 'warning', title: 'Warning', message: 'Warning toast test.' }),
    danger: () => window.GGMSToast?.show({ variant: 'danger', title: 'Danger', message: 'Danger toast test.' }),
    cart: () => window.GGMSToast?.show({
        variant: 'cart',
        title: 'Added to cart',
        message: '1 item added.',
        actionLabel: 'View cart',
        actionUrl: '/cart'
    })
  }

  window.GGMSToast = {
    show: showToast,
    dismiss: dismissToast,
    clear: clearToasts,
  }
})()
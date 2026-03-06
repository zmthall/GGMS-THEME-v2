// assets/ggms-cart-drawer.js
(() => {
  const GGMS = (window.GGMS = window.GGMS || {})
  if (GGMS.cartDrawer) return

  const SEL = {
    root: '[data-cart-drawer-root]',
    content: '[data-cart-drawer-content]',
    scroll: '[data-cart-drawer-scroll]',
    badgeWrap: '[data-cart-badge-wrap]',
    updateForm: 'form[data-cart-update-form]',
    remove: '[data-cart-remove][data-line]',
    cartItem: '[data-cart-item]',
    stepperInput: '[data-stepper-input]',
  }

  const DRAWER_ID = 'CartDrawer'
  const sectionId = 'ggms-cart-drawer'

  const $ = (sel, ctx = document) => ctx.querySelector(sel)

  const getRoot = () => $(SEL.root)

  const setBadge = (count) => {
    const wrap = $(SEL.badgeWrap)
    if (!wrap) return

    if (count > 0) {
      wrap.classList.remove('hidden')
      const inner = wrap.querySelector('span')
      if (inner) inner.textContent = String(count)
      else wrap.textContent = String(count)
    } else {
      wrap.classList.add('hidden')
    }
  }

  const changeCart = async (line, quantity) => {
    if (GGMS.cart && typeof GGMS.cart.change === 'function') {
      return await GGMS.cart.change({ line, quantity }, { skipCartFetch: true })
    }

    const res = await fetch('/cart/change.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line, quantity }),
    })

    if (!res.ok) throw new Error('Cart change failed')
    return await res.json()
  }

  const findScrollEl = (root) => {
    const els = Array.from(root.querySelectorAll(SEL.scroll))
    if (!els.length) return null
    return els.find((el) => el.scrollHeight > el.clientHeight + 1) || els[0]
  }

  const refreshContent = async () => {
    const root = getRoot()
    if (!root) return

    const currentContent = $(SEL.content, root)
    if (!currentContent) return

    const beforeScrollEl = findScrollEl(root)
    const scrollTop = beforeScrollEl ? beforeScrollEl.scrollTop : 0

    const url = new URL(window.location.href)
    url.searchParams.set('section_id', sectionId)

    const res = await fetch(url.toString(), { credentials: 'same-origin' })
    if (!res.ok) throw new Error('Section render failed')
    const html = await res.text()

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const nextRoot = doc.querySelector(SEL.root)
    if (!nextRoot) return

    const nextContent = nextRoot.querySelector(SEL.content)
    if (!nextContent) return

    currentContent.replaceWith(nextContent)

    const afterScrollEl = findScrollEl(root)
    if (afterScrollEl) afterScrollEl.scrollTop = scrollTop

    if (GGMS.steppers && typeof GGMS.steppers.init === 'function') {
      GGMS.steppers.init(root)
    }
  }

  document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest(`${SEL.root} ${SEL.remove}`)
    if (removeBtn) return

    const item = e.target.closest(SEL.cartItem)
    if (!item) return
    if (e.target.closest('a, button, input, select, textarea, label, summary')) return

    const url = item.getAttribute('href')
    if (url) window.location.href = url
  }, true)

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest(`${SEL.root} ${SEL.updateForm}`)
    if (!form) return

    e.preventDefault()

    const lineEl = form.querySelector('input[name="line"]')
    const qtyEl = form.querySelector(SEL.stepperInput) || form.querySelector('input[name="quantity"]')

    const line = lineEl ? parseInt(lineEl.value, 10) : NaN
    const quantity = qtyEl ? parseInt(qtyEl.value, 10) : NaN

    if (!Number.isFinite(line) || !Number.isFinite(quantity)) return

    try {
      const cart = await changeCart(line, quantity)
      if (cart && typeof cart.item_count === 'number') setBadge(cart.item_count)
      await refreshContent()
    } catch (err) {
      console.error(err)
    }
  }, true)

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest(`${SEL.root} ${SEL.remove}`)
    if (!btn) return

    e.preventDefault()

    const line = parseInt(btn.getAttribute('data-line') || '', 10)
    if (!Number.isFinite(line)) return

    try {
      const cart = await changeCart(line, 0)
      if (cart && typeof cart.item_count === 'number') setBadge(cart.item_count)
      await refreshContent()
    } catch (err) {
      console.error(err)
    }
  }, true)

  GGMS.cartDrawer = {
    open: () => GGMS.drawer?.open(DRAWER_ID),
    close: () => GGMS.drawer?.close(DRAWER_ID),
    refresh: refreshContent,
  }
})()
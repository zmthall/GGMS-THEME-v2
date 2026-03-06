(() => {
  const DESKTOP_BREAKPOINT = 768
  const loadedScripts = new Set()

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BREAKPOINT
  }

  function getDesktopScripts() {
    const scripts = window.GGMSTheme?.desktopScripts
    return Array.isArray(scripts) ? scripts.filter(Boolean) : []
  }

  function loadScript(src) {
    if (!src || loadedScripts.has(src)) return

    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      loadedScripts.add(src)
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.defer = true
    script.dataset.desktopScript = 'true'

    loadedScripts.add(src)
    document.head.appendChild(script)
  }

  function init() {
    if (!isDesktop()) return
    getDesktopScripts().forEach(loadScript)
  }

  init()
})()
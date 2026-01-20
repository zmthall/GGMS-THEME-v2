(function () {
  var root = document.documentElement
  var threshold = 40
  var ticking = false

  function update() {
    var y = window.scrollY || window.pageYOffset || 0
    if (y > threshold) root.classList.add('is-nav-compact')
    else root.classList.remove('is-nav-compact')
    ticking = false
  }

  window.addEventListener('scroll', function () {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(update)
  }, { passive: true })

  update()
})()
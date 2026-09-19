/**
 * BLACK SOULS 手表版 · 宣传站 —— 页面层交互
 * 只做三件事：初始化可玩表盘、BGM 试听、大图查看 / 滚动淡入。
 * 零依赖，纯原生；不用 ES module，双击 index.html 也能跑。
 */
;(function () {
  'use strict'

  function $(id) { return document.getElementById(id) }

  /* ==================== 1. 可玩表盘 ==================== */
  function bootWatch() {
    if (!window.BSWatch) return
    window.BSWatch.init()

    var btn = $('btnRestart')
    if (btn) {
      btn.addEventListener('click', function () {
        window.BSWatch.restart()
        var stage = $('stage')
        if (stage) stage.focus()
      })
    }
  }

  /* ==================== 2. BGM 试听 ==================== */
  function bootBgm() {
    var btn = $('btnBgm')
    if (!btn) return

    var audio = new Audio()
    audio.src = 'assets/audio/title.mp3'
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'none'

    function sync() {
      var playing = !audio.paused
      btn.textContent = playing ? '❚❚ 暂停 BGM' : '♪ 播放 BGM'
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false')
    }

    btn.addEventListener('click', function () {
      if (audio.paused) {
        var p = audio.play()
        if (p && typeof p.catch === 'function') {
          p.then(sync).catch(function () {
            btn.textContent = '♪ 播放失败，点此重试'
          })
        } else {
          sync()
        }
      } else {
        audio.pause()
      }
      setTimeout(sync, 60)
    })

    audio.addEventListener('play', sync)
    audio.addEventListener('pause', sync)
    sync()
  }

  /* ==================== 3. 大图查看 ==================== */
  function bootLightbox() {
    var box = $('lightbox')
    var img = $('lightboxImg')
    var cap = $('lightboxCap')
    var close = $('lightboxClose')
    if (!box || !img) return

    var lastFocus = null

    function open(src, text) {
      lastFocus = document.activeElement
      img.src = src
      img.alt = text || ''
      cap.textContent = text || ''
      box.removeAttribute('hidden')
      document.body.style.overflow = 'hidden'
      if (close) close.focus()
    }

    function shut() {
      box.setAttribute('hidden', '')
      img.removeAttribute('src')
      document.body.style.overflow = ''
      if (lastFocus && lastFocus.focus) lastFocus.focus()
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.thumb') : null
      if (btn) {
        open(btn.getAttribute('data-full'), btn.getAttribute('data-cap'))
        return
      }
      if (e.target === box) shut()
    })

    if (close) close.addEventListener('click', shut)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hasAttribute('hidden')) shut()
    })
  }

  /* ==================== 4. 滚动淡入 ==================== */
  function bootReveal() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return

    var nodes = document.querySelectorAll(
      '.sec__title, .sec__lead, .card, .note, .shot, .gallery li, .fold, .play__side, .figure, .foot__legal'
    )
    if (!nodes.length) return

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return
        en.target.classList.add('in')
        io.unobserve(en.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })

    Array.prototype.forEach.call(nodes, function (n, i) {
      n.classList.add('reveal')
      n.style.transitionDelay = Math.min(i % 4, 3) * 55 + 'ms'
      io.observe(n)
    })
  }

  /* ==================== 启动 ==================== */
  function boot() {
    bootWatch()
    bootBgm()
    bootLightbox()
    bootReveal()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()

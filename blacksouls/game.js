/**
 * BLACK SOULS 手表版 —— 浏览器还原版
 *
 * 这是把手表应用的界面与流程在网页里 1:1 重做一遍：
 *   - 坐标系、图层位置、字号、行高、光标位置全部照搬 src/pages/Title/index.ux
 *     与 src/pages/Story/index.ux 里的常量（设计单位 466 x 538）
 *   - 文字画在 canvas 上（和原应用一样，绝对坐标，不受 CSS 布局影响）
 *   - 界面素材是应用里的原始 PNG（整屏 390x450 图层，按设计单位拉伸到 466x538）
 *
 * 与手表实机的差异只有两点，都会在页面上注明：
 *   1. 输入方式：表冠旋转 -> 鼠标滚轮 / 上下键 / 触摸上下滑
 *   2. CONTINUE 会读取浏览器本地存档（手表版没有存档功能）
 */
;(function () {
  'use strict'

  /* ==================== 设计单位常量（照搬 .ux） ==================== */
  var W = 466
  var H = 538

  // 对话框
  var PLATE_CX = 195, PLATE_CY = 376, PLATE_FS = 18
  var SAY_X = 154, SAY_Y = 414, SAY_W = 296, SAY_FS = 21, SAY_LH = 28
  var SAY_MAX_LINES = 4
  var BASE_MID = 0.35

  // 选项（右侧窗口：2 行从 302 起 / 3 行从 267 起，行高 36）
  var CH_X = 269, CH_W = 190
  var CH2_Y = 302, CH3_Y = 267
  var CH_ROW = 36, CH_TX = 283, CH_FS = 22
  var CH_TY = 26
  var CH_CURSOR_L = 271

  // 取名（上=输入行，左=字库，右=按键窗）
  var NM_MAX = 6
  var IN_X = 26, IN_FS = 26, IN_SLOT = 30, IN_BASE = 50
  var GRID_X = 17, GRID_Y = 98, CELL_W = 60, CELL_H = 51
  var COLS = 6, ROWS = 8
  var GRID_FS = 26, GRID_TY = 34
  var BTN_X = 392, BTN_W = 64, BTN_Y0 = 98, BTN_STEP = 72, BTN_H = 51
  var BTN_FS = 20, BTN_TY = 32
  var GRID_CELLS = COLS * ROWS
  var BTNS = ['決定', '削除', '翻页']
  var NAME_ITEMS = GRID_CELLS + BTNS.length

  // 立绘 / 场景小图 / 继续箭头
  var BUST_X = 10, BUST_Y = 406, BUST_S = 115
  var SPRITE_X = 143, SPRITE_Y = 246, SPRITE_W = 232, SPRITE_H = 114
  var ARROW_X = 220, ARROW_Y = 510, ARROW_W = 26, ARROW_H = 14

  // 标题菜单
  var MENU_X = 114, MENU_Y = 358, MENU_W = 239, MENU_H = 141
  var CURSOR_X = 123, CURSOR_W = 223, CURSOR_H = 39
  var CURSOR_TOPS = [372, 410, 446]
  var TITLE_ITEMS = ['NEW GAME', 'CONTINUE', 'END']

  // menu_box.png 里的 END 行底色是缺的（从原图抠框时把选中光标那块一起抠掉了），
  // 实机上会透出背景纹理。这里用纯黑补一块底，位置按图片内实际透明范围换算。
  var MENU_PATCH_X = 117.8, MENU_PATCH_Y = 437.7
  var MENU_PATCH_W = 231.3, MENU_PATCH_H = 55.2

  var TYPE_SPEED = 50        // 打字机速度（ms/字），与应用一致
  var BLINK_MS = 700         // 取名光标闪烁
  var SAVE_KEY = 'bs-watch-web-save-v1'

  // 字库（每页 48 字；最后一页是英数）
  // 必须与 ui_name0/1/2.png 里烘进去的字格逐字一致，否则点到的字和看到的不一样。
  var CHAR_PAGES = [
    '爱丽丝米卡黑小红帽白雪长发光公主芳丹格蕾特娜莉娃狼剑士骑士盗贼魔术师' +
    '风雷雨云川山海星辰日月华琳岚子猫犬鸟鱼花草木金木水火土天地人神鬼佛魔龙虎',
    '一二十三四五六七八九十百千万上下左右前后东西南北中大小新旧高低赤青白黑' +
    '安贝本田中人名号儿女子男心梦影夜霜雾露泉林森岩谷原野空翔真琴咲舞',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  ]

  var FONT = '"Noto Sans SC","Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif'

  /* ==================== DOM ==================== */
  function $(id) { return document.getElementById(id) }

  var el = {}
  var ctx = null
  var scale = 1              // 设计单位 -> CSS 像素
  var ready = false

  /* ==================== 状态 ==================== */
  var S = {
    mode: 'idle',            // title | say | choice | input | idle
    pc: 0,
    steps: [],
    labels: {},
    vars: {},
    savedPc: 0,
    sayName: '',
    sayFull: '',
    sayShown: 0,
    typing: null,
    showNext: false,
    rows: [],
    rowLabels: [],
    sel: 0,
    name: '',
    navIdx: 0,
    page: 0,
    blink: true,
    bustWanted: true,
    sprite: null,
    titleIndex: 0,
    fade: 1,
    busy: false
  }

  /* ==================== 画布文字 ==================== */
  function setFont(size) {
    ctx.font = 'normal ' + size + 'px ' + FONT
    ctx.textBaseline = 'alphabetic'
  }

  function drawText(s, x, y, size, color, align) {
    if (!s) return
    setFont(size)
    ctx.textAlign = align || 'left'
    ctx.fillStyle = color || '#ffffff'
    ctx.fillText(s, x, y)
  }

  // 逐字按"一个字 = 一个字宽"排：与应用里按 col * 字号 画字的算法一致
  function drawMono(s, x, y, size, color, advance) {
    if (!s) return
    setFont(size)
    ctx.textAlign = 'left'
    ctx.fillStyle = color || '#ffffff'
    var step = advance || size
    for (var i = 0; i < s.length; i++) {
      ctx.fillText(s.charAt(i), x + i * step, y)
    }
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }

  function wrapSay(s) {
    var per = Math.floor(SAY_W / SAY_FS)
    var out = []
    for (var i = 0; i < s.length && out.length < SAY_MAX_LINES; i += per) {
      out.push(s.slice(i, i + per))
    }
    return out
  }

  function paint() {
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)

    if (S.mode === 'say' || S.mode === 'choice') {
      drawText(S.sayName, PLATE_CX, PLATE_CY + PLATE_FS * BASE_MID, PLATE_FS, '#ffffff', 'center')
      var lines = wrapSay(S.sayFull.slice(0, S.sayShown))
      for (var i = 0; i < lines.length; i++) {
        drawMono(lines[i], SAY_X, SAY_Y + SAY_FS + i * SAY_LH, SAY_FS, '#ffffff')
      }
    }

    if (S.mode === 'choice') {
      var base = S.rows.length >= 3 ? CH3_Y : CH2_Y
      for (var k = 0; k < S.rows.length; k++) {
        var color = k === S.sel ? '#ffffff' : '#b9c6d6'
        drawText(S.rows[k], CH_TX, base + CH_TY + k * CH_ROW, CH_FS, color, 'left')
      }
    }

    if (S.mode === 'input') {
      for (var j = 0; j < NM_MAX; j++) {
        var x = IN_X + j * IN_SLOT
        if (j < S.name.length) {
          setFont(IN_FS); ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff'
          ctx.fillText(S.name.charAt(j), x, IN_BASE)
        } else if (j === S.name.length && S.blink) {
          drawRect(x, IN_BASE + 6, IN_SLOT - 8, 3, '#ffffff')
        } else {
          drawRect(x, IN_BASE + 6, IN_SLOT - 8, 2, '#6d7a8a')
        }
      }
    }
  }

  /* ==================== 图层显隐 ==================== */
  function show(node, on) {
    if (!node) return
    if (on) node.removeAttribute('hidden')
    else node.setAttribute('hidden', '')
  }

  // 懒加载：图层和立绘只在真正要用到的时候才去请求，首屏不用背这些体积
  function ensure(node) {
    if (!node) return
    if (!node.getAttribute('src') && node.getAttribute('data-src')) {
      node.setAttribute('src', node.getAttribute('data-src'))
    }
  }

  function syncDom() {
    show(el.titleLayer, S.mode === 'title')
    show(el.storyLayer, S.mode !== 'title')

    var inDialog = S.mode === 'say' || S.mode === 'choice'
    if (inDialog) ensure(el.uiDialog)
    show(el.uiDialog, inDialog)

    var c2 = S.mode === 'choice' && S.rows.length < 3
    if (c2) ensure(el.uiChoice2)
    show(el.uiChoice2, c2)

    var c3 = S.mode === 'choice' && S.rows.length >= 3
    if (c3) ensure(el.uiChoice3)
    show(el.uiChoice3, c3)

    if (S.mode === 'input') ensure(el['uiName' + S.page])
    show(el.uiName0, S.mode === 'input' && S.page === 0)
    show(el.uiName1, S.mode === 'input' && S.page === 1)
    show(el.uiName2, S.mode === 'input' && S.page === 2)

    show(el.bust, inDialog && S.bustWanted)

    if (S.sprite === 'knight') ensure(el.spriteKnight)
    if (S.sprite === 'thief') ensure(el.spriteThief)
    if (S.sprite === 'mage') ensure(el.spriteMage)
    show(el.spriteKnight, S.sprite === 'knight')
    show(el.spriteThief, S.sprite === 'thief')
    show(el.spriteMage, S.sprite === 'mage')

    show(el.nextArrow, S.showNext)
    updateCursor()
  }

  function updateCursor() {
    if (S.mode === 'choice') {
      var base = S.rows.length >= 3 ? CH3_Y : CH2_Y
      el.rowCursor.style.left = CH_CURSOR_L + 'px'
      el.rowCursor.style.top = (base + 8 + S.sel * CH_ROW) + 'px'
      show(el.rowCursor, true)
    } else {
      show(el.rowCursor, false)
    }

    if (S.mode === 'input') {
      var left, top
      if (S.navIdx < GRID_CELLS) {
        left = GRID_X + (S.navIdx % COLS) * CELL_W
        top = GRID_Y + Math.floor(S.navIdx / COLS) * CELL_H
      } else {
        left = BTN_X
        top = BTN_Y0 + (S.navIdx - GRID_CELLS) * BTN_STEP
      }
      el.cellCursor.style.left = left + 'px'
      el.cellCursor.style.top = top + 'px'
      show(el.cellCursor, true)
    } else {
      show(el.cellCursor, false)
    }
  }

  function refresh() {
    syncDom()
    paint()
  }

  /* ==================== 尺寸自适应 ==================== */
  function layout() {
    var wrap = el.screenWrap
    var stage = el.stage
    // 量外层那一列，不能量表盘本身 —— 表盘宽度是由这里算出来的，量它会循环依赖
    var host = wrap.closest('.play__device') || wrap.parentElement
    var avail = (host ? host.clientWidth : 390) - 30   // 扣掉表壳内边距与边框
    // 实机是 390x450 设备像素：桌面按实机尺寸显示，窄屏等比缩小，不放大
    var k = Math.min(390 / W, avail / W)
    k = Math.max(0.42, k)
    scale = k
    stage.style.transform = 'scale(' + k + ')'
    wrap.style.width = Math.round(W * k) + 'px'
    wrap.style.height = Math.round(H * k) + 'px'
  }

  /* ==================== 淡入淡出 ==================== */
  function fadeTo(target, done) {
    el.fade.style.opacity = target
    if (done) setTimeout(done, 300)
  }

  /* ==================== 存档 ==================== */
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        pc: S.savedPc, vars: S.vars, ts: Date.now()
      }))
    } catch (e) { /* 隐私模式下写不了，忽略 */ }
  }

  function readSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      var d = JSON.parse(raw)
      if (!d || typeof d.pc !== 'number') return null
      return d
    } catch (e) { return null }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY) } catch (e) {}
  }

  /* ==================== 标题 ==================== */
  function enterTitle() {
    S.mode = 'title'
    S.typing = null
    S.showNext = false
    S.titleIndex = 0
    el.titleCursor.style.top = CURSOR_TOPS[0] + 'px'
    refresh()
    fadeTo(0)
  }

  function moveTitle(d) {
    var n = Math.max(0, Math.min(TITLE_ITEMS.length - 1, S.titleIndex + d))
    if (n === S.titleIndex) return
    S.titleIndex = n
    el.titleCursor.style.top = CURSOR_TOPS[n] + 'px'
  }

  function confirmTitle() {
    if (S.busy) return
    S.busy = true
    if (S.titleIndex === 2) {
      // END：黑一下再回来（和手表版一致）
      fadeTo(1, function () {
        fadeTo(0, function () { S.busy = false })
      })
      return
    }
    var resume = S.titleIndex === 1 ? readSave() : null
    if (S.titleIndex === 1 && !resume) notify('没有找到存档，已从开头开始')
    fadeTo(1, function () {
      S.busy = false
      enterStory(resume)
    })
  }

  /* ==================== 剧情 ==================== */
  function enterStory(resume) {
    var story = window.BS_STORY
    S.vars = {}
    S.steps = story.scenes[story.start]
    S.labels = {}
    for (var i = 0; i < S.steps.length; i++) {
      if (S.steps[i].label) S.labels[S.steps[i].label] = i
    }
    S.sprite = null
    S.bustWanted = true
    if (resume) {
      S.vars = resume.vars || {}
      S.pc = resume.pc
    } else {
      S.pc = 0
    }
    fadeTo(0)
    next()
  }

  function next() {
    for (var guard = 0; guard < 300; guard++) {
      if (S.pc >= S.steps.length) { finish(); return }
      var idx = S.pc
      var s = S.steps[S.pc]
      S.pc++

      if (s.label) continue

      if (s.set) {
        for (var key in s.set) { if (Object.prototype.hasOwnProperty.call(s.set, key)) S.vars[key] = s.set[key] }
        continue
      }

      if (s.goto) {
        if (S.labels[s.goto] !== undefined) S.pc = S.labels[s.goto]
        continue
      }

      if (s.sprite !== undefined) S.sprite = s.sprite
      if (s.bust !== undefined) S.bustWanted = (s.bust !== null && s.bust !== '')

      if (s.say) {
        S.savedPc = idx
        saveGame()
        startSay(s.say[0] || '', s.say[1] || '')
        return
      }
      if (s.choice) {
        S.savedPc = idx
        saveGame()
        startList(s.choice)
        return
      }
      if (s.input) {
        S.savedPc = idx
        saveGame()
        startInput()
        return
      }
      if (s.end) { finish(); return }
    }
  }

  function fill(t) {
    return String(t).replace(/\{(\w+)\}/g, function (m, k) {
      return S.vars[k] !== undefined ? S.vars[k] : m
    })
  }

  function startSay(who, text) {
    S.mode = 'say'
    S.showNext = false
    S.sayName = who
    S.sayFull = fill(text)
    S.sayShown = 0
    if (S.typing) { clearInterval(S.typing); S.typing = null }
    refresh()
    S.typing = setInterval(function () {
      S.sayShown++
      if (S.sayShown >= S.sayFull.length) {
        S.sayShown = S.sayFull.length
        clearInterval(S.typing)
        S.typing = null
        S.showNext = true
      }
      paint()
      syncDom()
    }, TYPE_SPEED)
  }

  function finishTyping() {
    if (S.typing) { clearInterval(S.typing); S.typing = null }
    S.sayShown = S.sayFull.length
    S.showNext = true
    refresh()
  }

  function advance() {
    S.showNext = false
    next()
  }

  function startList(items) {
    S.mode = 'choice'
    S.showNext = false
    S.rows = []
    S.rowLabels = []
    for (var i = 0; i < items.length; i++) {
      S.rows.push(items[i][0])
      S.rowLabels.push(items[i][1])
    }
    S.sel = 0
    refresh()
  }

  function confirmChoice() {
    var label = S.rowLabels[S.sel]
    if (label && S.labels[label] !== undefined) S.pc = S.labels[label]
    next()
  }

  function startInput() {
    S.mode = 'input'
    S.showNext = false
    S.bustWanted = false
    S.name = ''
    S.navIdx = 0
    S.page = 0
    S.blink = true
    refresh()
  }

  function currentChar() {
    var chars = CHAR_PAGES[S.page] || ''
    return chars.charAt(S.navIdx) || ''
  }

  function pressItem() {
    if (S.navIdx < GRID_CELLS) {
      var ch = currentChar()
      if (ch && S.name.length < NM_MAX) {
        S.name += ch
        refresh()
      }
      return
    }
    var i = S.navIdx - GRID_CELLS
    if (i === 0) {
      if (S.name.length === 0) { notify('请先选几个字'); return }
      S.vars.name = S.name
      next()
      return
    }
    if (i === 1) {
      if (S.name.length > 0) { S.name = S.name.slice(0, -1); refresh() }
      return
    }
    S.page = (S.page + 1) % CHAR_PAGES.length
    refresh()
  }

  function moveName(d, vertical) {
    var n = S.navIdx
    if (!vertical) {
      // 左右：字格内按列走，按键列退回字格
      if (n < GRID_CELLS) {
        var c = n % COLS
        var nc = c + d
        if (nc < 0 || nc >= COLS) return
        n = n + d
      } else {
        if (d < 0) n = GRID_CELLS - 1
        else return
      }
    } else {
      if (n < GRID_CELLS) {
        var r = Math.floor(n / COLS)
        var nr = r + d
        if (nr < 0 || nr >= ROWS) return
        n = n + d * COLS
      } else {
        var b = n - GRID_CELLS + d
        if (b < 0 || b >= BTNS.length) return
        n = GRID_CELLS + b
      }
    }
    if (n !== S.navIdx) { S.navIdx = n; updateCursor() }
  }

  function finish() {
    S.mode = 'idle'
    S.showNext = false
    clearSave()
    refresh()
    fadeTo(1, function () { enterTitle() })
  }

  /* ==================== 指针 / 触摸命中 ==================== */
  function toDesign(clientX, clientY) {
    var r = el.stage.getBoundingClientRect()
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale }
  }

  function tapAtName(p) {
    var chars = CHAR_PAGES[S.page] || ''
    for (var i = 0; i < BTNS.length; i++) {
      var top = BTN_Y0 + i * BTN_STEP - 10
      if (p.x >= BTN_X - 10 && p.y >= top && p.y <= top + BTN_H + 20) {
        S.navIdx = GRID_CELLS + i
        updateCursor()
        pressItem()
        return true
      }
    }
    var best = -1, bestD = 1e9
    for (var j = 0; j < GRID_CELLS; j++) {
      if (!chars.charAt(j)) continue
      var c = j % COLS, r = Math.floor(j / COLS)
      var dx = p.x - (GRID_X + c * CELL_W + CELL_W / 2)
      var dy = p.y - (GRID_Y + r * CELL_H + CELL_H / 2)
      var d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = j }
    }
    var limit = CELL_W * 1.1
    if (best >= 0 && bestD <= limit * limit) {
      S.navIdx = best
      updateCursor()
      pressItem()
      return true
    }
    return false
  }

  function tapChoice(p) {
    var base = S.rows.length >= 3 ? CH3_Y : CH2_Y
    for (var i = 0; i < S.rows.length; i++) {
      var top = base + i * CH_ROW
      if (p.y >= top && p.y <= top + CH_ROW && p.x >= CH_X - 6) {
        S.sel = i
        updateCursor()
        paint()
        return true
      }
    }
    return false
  }

  function tapTitle(p) {
    for (var i = 0; i < TITLE_ITEMS.length; i++) {
      var top = CURSOR_TOPS[i] - 4
      if (p.y >= top && p.y <= top + CURSOR_H + 6 && p.x >= CURSOR_X - 8) {
        if (i === S.titleIndex) confirmTitle()
        else { S.titleIndex = i; el.titleCursor.style.top = CURSOR_TOPS[i] + 'px' }
        return true
      }
    }
    return false
  }

  /* ==================== 输入：滚轮 / 键盘 / 触摸 / 点击 ==================== */
  function step(dir) {
    if (S.mode === 'title') { moveTitle(dir); return }
    if (S.mode === 'choice') {
      var n = S.sel + dir
      if (n >= 0 && n < S.rows.length) { S.sel = n; updateCursor(); paint() }
      return
    }
    if (S.mode === 'input') {
      var m = S.navIdx + dir
      while (m < 0) m += NAME_ITEMS
      while (m >= NAME_ITEMS) m -= NAME_ITEMS
      S.navIdx = m
      updateCursor()
      return
    }
    if (S.mode === 'say' && S.showNext) advance()
  }

  function confirm() {
    if (S.mode === 'title') { confirmTitle(); return }
    if (S.mode === 'say') {
      if (S.typing) finishTyping()
      else advance()
      return
    }
    if (S.mode === 'choice') { confirmChoice(); return }
    if (S.mode === 'input') { pressItem(); return }
  }

  function bindInput() {
    var zone = el.stage

    zone.addEventListener('wheel', function (e) {
      e.preventDefault()
      step(e.deltaY > 0 ? 1 : -1)
    }, { passive: false })

    zone.addEventListener('keydown', function (e) {
      var k = e.key
      if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); step(1); return }
      if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); step(-1); return }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); confirm(); return }
    })

    // 触摸 / 鼠标：短按=确定，上下滑=滚动
    var down = null
    zone.addEventListener('pointerdown', function (e) {
      zone.focus()
      down = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false }
    })
    zone.addEventListener('pointermove', function (e) {
      if (!down) return
      if (Math.abs(e.clientY - down.y) > 22) {
        down.moved = true
        step(e.clientY > down.y ? 1 : -1)
        down.y = e.clientY
      }
    })
    zone.addEventListener('pointerup', function (e) {
      if (!down) return
      var wasMove = down.moved
      var dt = Date.now() - down.t
      down = null
      if (wasMove) return
      if (dt > 700) return
      var p = toDesign(e.clientX, e.clientY)
      if (S.mode === 'title') { if (!tapTitle(p)) confirmTitle(); return }
      if (S.mode === 'say') { confirm(); return }
      if (S.mode === 'choice') { if (!tapChoice(p)) return; confirmChoice(); return }
      if (S.mode === 'input') { if (!tapAtName(p)) return; return }
    })
    zone.addEventListener('pointercancel', function () { down = null })
  }

  /* ==================== 提示条 ==================== */
  function notify(msg) {
    if (!el.status) return
    el.status.textContent = msg
    el.status.classList.add('is-on')
    clearTimeout(notify._t)
    notify._t = setTimeout(function () { el.status.classList.remove('is-on') }, 2600)
  }

  /* ==================== 初始化 ==================== */
  function init() {
    el.stage = $('stage')
    el.screenWrap = $('screenWrap')
    el.titleLayer = $('titleLayer')
    el.storyLayer = $('storyLayer')
    el.uiDialog = $('uiDialog')
    el.uiChoice2 = $('uiChoice2')
    el.uiChoice3 = $('uiChoice3')
    el.uiName0 = $('uiName0')
    el.uiName1 = $('uiName1')
    el.uiName2 = $('uiName2')
    el.bust = $('bust')
    el.spriteKnight = $('spriteKnight')
    el.spriteThief = $('spriteThief')
    el.spriteMage = $('spriteMage')
    el.rowCursor = $('rowCursor')
    el.cellCursor = $('cellCursor')
    el.nextArrow = $('nextArrow')
    el.titleCursor = $('titleCursor')
    el.menuPatch = $('menuPatch')
    el.fade = $('fade')
    el.status = $('watchStatus')
    var cv = $('watchCanvas')
    if (!el.stage || !cv) return

    // 内部按 2 倍分辨率画，缩放到 390 宽后依然清晰
    var dpr = 2
    cv.width = W * dpr
    cv.height = H * dpr
    ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.textBaseline = 'alphabetic'

    el.menuPatch.style.left = MENU_PATCH_X + 'px'
    el.menuPatch.style.top = MENU_PATCH_Y + 'px'
    el.menuPatch.style.width = MENU_PATCH_W + 'px'
    el.menuPatch.style.height = MENU_PATCH_H + 'px'

    layout()
    bindInput()
    window.addEventListener('resize', layout)

    setInterval(function () {
      if (S.mode !== 'input') return
      S.blink = !S.blink
      paint()
    }, BLINK_MS)

    ready = true
    fadeTo(1, function () { enterTitle() })
  }

  /* ==================== 对外接口 ==================== */
  window.BSWatch = {
    init: init,
    restart: function () { clearSave(); fadeTo(1, function () { enterTitle() }) },
    startNew: function () { fadeTo(1, function () { enterStory(null) }) },
    layout: layout,
    state: S
  }
})()

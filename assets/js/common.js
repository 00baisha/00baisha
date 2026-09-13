/* ============================================================
   白鲨工具站 - 公共脚本
   功能：顶部导航、页脚、主题切换、自定义壁纸、轻提示、站内搜索
   ============================================================ */
(function () {
  'use strict';

  var SITE_NAME = '白鲨工具站';
  var LS_THEME = 'bs-theme';
  var LS_WALLPAPER = 'bs-wallpaper';

  // ---------- 主题 ----------
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(LS_THEME); } catch (e) {}
    var theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem(LS_THEME, cur); } catch (e) {}
    updateThemeIcon();
  }

  function updateThemeIcon() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var sun = document.getElementById('theme-icon-sun');
    var moon = document.getElementById('theme-icon-moon');
    if (sun) sun.style.display = dark ? 'none' : '';
    if (moon) moon.style.display = dark ? '' : 'none';
  }

  // ---------- 壁纸（v2 设计系统：纯色预设，无渐变） ----------
  var WALLPAPER_PRESETS = [
    { id: 'none', label: '无', css: '' },
    { id: 'ocean', label: '海蓝', css: '#155E75' },
    { id: 'night', label: '墨夜', css: '#1E293B' },
    { id: 'clay', label: '陶土', css: '#B45309' },
    { id: 'forest', label: '森林', css: '#166534' },
    { id: 'violet', label: '暮紫', css: '#6D28D9' },
  ];

  function wallpaperCSS(cfg) {
    if (!cfg || !cfg.css) return '';
    return cfg.css;
  }

  function applyWallpaper() {
    var cfg = null;
    try { cfg = JSON.parse(localStorage.getItem(LS_WALLPAPER) || 'null'); } catch (e) {}
    var layer = document.querySelector('.wallpaper-layer');
    var body = document.body;
    if (!cfg || !cfg.css) {
      if (layer) layer.style.background = '';
      body.classList.remove('wallpaper-on');
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'wallpaper-layer';
      document.body.prepend(layer);
      var overlay = document.createElement('div');
      overlay.className = 'wallpaper-overlay';
      document.body.prepend(overlay);
    }
    layer.style.background = cfg.css;
    body.classList.add('wallpaper-on');
  }

  function setWallpaper(cfg) {
    try { localStorage.setItem(LS_WALLPAPER, JSON.stringify(cfg)); } catch (e) {}
    applyWallpaper();
  }

  // ---------- 轻提示 ----------
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ---------- 导航注入 ----------
  function currentNav() {
    var path = location.pathname.split('/').pop() || 'index.html';
    if (path === 'index.html' || path === '') return 'home';
    if (path === 'tools.html') return 'tools';
    if (path === 'nav.html') return 'nav';
    if (path === 'ai.html') return 'ai';
    return 'tool';
  }

  function injectHeader() {
    var nav = currentNav();
    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="header-inner">' +
      '<a class="logo" href="index.html" aria-label="白鲨工具站首页">' +
      '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="5" fill="var(--primary)"/><path d="M5 14 L10 5 L15 14 Z" fill="#fff"/></svg>' +
      '<span class="logo-text">白鲨工具站</span>' +
      '</a>' +
      '<nav class="site-nav" aria-label="主导航">' +
      '<a href="index.html"' + (nav === 'home' ? ' class="active"' : '') + '>首页</a>' +
      '<a href="tools.html"' + (nav === 'tools' ? ' class="active"' : '') + '>工具</a>' +
      '<a href="nav.html"' + (nav === 'nav' ? ' class="active"' : '') + '>导航</a>' +
      '<a href="ai.html"' + (nav === 'ai' ? ' class="active"' : '') + '>AI专区</a>' +
      '</nav>' +
      '<div class="header-actions">' +
      '<button class="icon-btn" id="theme-btn" aria-label="切换深色 / 浅色主题" title="切换主题">' +
      '<svg id="theme-icon-sun" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13"/></svg>' +
      '<svg id="theme-icon-moon" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" style="display:none"><path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7Z"/></svg>' +
      '</button>' +
      '<button class="icon-btn" id="wallpaper-btn" aria-label="自定义壁纸" title="自定义壁纸">' +
      '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="5.8" cy="5.8" r="1.2"/><path d="M2 12l3.5-3.5 3 3 2.5-2.5L14 12"/></svg>' +
      '</button>' +
      '</div>' +
      '</div>';
    document.body.prepend(header);
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('wallpaper-btn').addEventListener('click', openWallpaperModal);
    updateThemeIcon();
  }

  function injectFooter() {
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="f-links">' +
      '<a href="tools.html">全部工具</a>' +
      '<a href="nav.html">网址导航</a>' +
      '<a href="ai.html">AI专区</a>' +
      '<a href="about.html">关于我们</a>' +
      '<a href="mailto:baisha-tools@example.com">意见反馈</a>' +
      '</div>' +
      '<div>© 2025 ' + SITE_NAME + ' · 数据均在本地浏览器处理，不上传服务器</div>';
    document.body.appendChild(footer);
  }

  // ---------- 壁纸弹窗 ----------
  function openWallpaperModal() {
    var old = document.getElementById('wp-modal');
    if (old) old.remove();
    var mask = document.createElement('div');
    mask.className = 'modal-mask show';
    mask.id = 'wp-modal';
    var cur = null;
    try { cur = JSON.parse(localStorage.getItem(LS_WALLPAPER) || 'null'); } catch (e) {}
    var presetsHtml = WALLPAPER_PRESETS.map(function (p) {
      return '<div class="wp-preset' + (cur && cur.id === p.id ? ' on' : '') + '" data-id="' + p.id + '" title="' + p.label + '" style="background:' + (p.css || 'var(--bg-soft-2)') + '"></div>';
    }).join('');
    mask.innerHTML =
      '<div class="modal">' +
      '<h3>自定义壁纸</h3>' +
      '<div class="m-row"><label>选择预设</label><div class="wp-presets">' + presetsHtml + '</div></div>' +
      '<div class="m-row"><label>或上传图片作为壁纸</label>' +
      '<input type="file" id="wp-file" accept="image/*" style="font-size:13px;width:100%"></div>' +
      '<div class="m-actions">' +
      '<button class="btn ghost small" id="wp-cancel">关闭</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(mask);

    mask.querySelectorAll('.wp-preset').forEach(function (el) {
      el.addEventListener('click', function () {
        var p = WALLPAPER_PRESETS.find(function (x) { return x.id === el.dataset.id; });
        setWallpaper(p);
        mask.querySelectorAll('.wp-preset').forEach(function (o) { o.classList.remove('on'); });
        el.classList.add('on');
      });
    });
    document.getElementById('wp-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        setWallpaper({ id: 'custom', label: '自定义', css: 'url(' + reader.result + ') center/cover no-repeat' });
        toast('壁纸已更新 🎉');
        mask.remove();
      };
      reader.readAsDataURL(f);
    });
    document.getElementById('wp-cancel').addEventListener('click', function () { mask.remove(); });
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
  }

  // ---------- 站内搜索 ----------
  // 依赖 window.BS_DATA（tools.json + sites.json 数据），由各页面加载后设置
  window.BS_DATA = window.BS_DATA || { tools: [], sites: [] };

  function attachSearch() {
    var box = document.getElementById('site-search');
    var panel = document.getElementById('search-panel');
    if (!box || !panel) return;
    box.addEventListener('input', function () {
      var q = box.value.trim().toLowerCase();
      if (!q) { panel.classList.remove('show'); panel.innerHTML = ''; return; }
      var results = [];
      window.BS_DATA.tools.forEach(function (t) {
        if ((t.name + ' ' + t.desc + ' ' + (t.keywords || '')).toLowerCase().indexOf(q) !== -1) {
          results.push({ icon: t.icon, name: t.name, cat: '工具', url: t.url });
        }
      });
      window.BS_DATA.sites.forEach(function (s) {
        if ((s.name + ' ' + (s.desc || '') + ' ' + (s.cat || '')).toLowerCase().indexOf(q) !== -1) {
          results.push({ icon: s.icon || '🔗', name: s.name, cat: '导航·' + s.cat, url: s.url, ext: true });
        }
      });
      if (results.length > 8) results = results.slice(0, 8);
      var html = '';
      if (!results.length) {
        html = '<div class="r-empty">没有找到「' + box.value.trim() + '」相关的内容</div>';
      } else {
        results.forEach(function (r) {
          html += '<a href="' + r.url + '"' + (r.ext ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<span class="r-icon">' + r.icon + '</span>' +
            '<span class="r-name">' + r.name + '</span>' +
            '<span class="r-cat">' + r.cat + '</span>' +
            '</a>';
        });
      }
      panel.innerHTML = html;
      panel.classList.add('show');
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target) && !panel.contains(e.target)) panel.classList.remove('show');
    });
  }

  // ---------- 工具页面包屑 ----------
  function injectBreadcrumb(toolName) {
    var bc = document.querySelector('.tool-breadcrumb');
    if (!bc) return;
    bc.innerHTML = '<a href="../index.html">首页</a> › <a href="../tools.html">工具</a> › ' + toolName;
  }

  // ---------- 启动 ----------
  function boot() {
    initTheme();
    applyWallpaper();
    injectHeader();
    injectFooter();
    attachSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 暴露给工具页使用
  window.BS = {
    toast: toast,
    setWallpaper: setWallpaper,
    currentNav: currentNav,
    injectBreadcrumb: injectBreadcrumb,
  };
})();

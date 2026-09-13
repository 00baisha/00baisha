/* ============================================================
   白鲨工具站 - 页面渲染辅助脚本
   ============================================================ */
(function () {
  'use strict';

  var CATS = {
    image: '图片处理',
    video: '视频工具',
    text: '文本处理',
    convert: '格式转换',
  };

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('加载失败: ' + url);
      return r.json();
    });
  }

  function toolCard(t) {
    return '<a class="tool-card" href="' + t.url + '">' +
      '<span class="tc-icon">' + t.icon + '</span>' +
      '<span class="tc-name">' + t.name + '</span>' +
      '<span class="tc-desc">' + t.desc + '</span>' +
      '<span class="tc-go">打开工具 →</span>' +
      '</a>';
  }

  function navCard(s) {
    return '<a class="nav-card" href="' + s.url + '" target="_blank" rel="noopener">' +
      '<span class="nv-icon">' + (s.icon || '🔗') + '</span>' +
      '<span><span class="nv-name">' + s.name + '</span>' +
      (s.desc ? '<span class="nv-desc">' + s.desc + '</span>' : '') + '</span>' +
      '<span class="nv-ext">' + s.cat + '</span>' +
      '</a>';
  }

  function aiCard(a) {
    return '<a class="nav-card" href="' + a.url + '" target="_blank" rel="noopener">' +
      '<span class="nv-icon">' + a.icon + '</span>' +
      '<span><span class="nv-name">' + a.name + (a.hot ? ' <span style="font-size:11px;color:#eab308">🔥</span>' : '') + '</span>' +
      (a.desc ? '<span class="nv-desc">' + a.desc + '</span>' : '') + '</span>' +
      '</a>';
  }

  // 渲染工具卡片到容器（可指定分类过滤）
  function renderTools(container, tools, opts) {
    opts = opts || {};
    var list = tools.slice();
    if (opts.category) list = list.filter(function (t) { return t.category === opts.category; });
    if (opts.featured) list = list.filter(function (t) { return t.featured; });
    container.innerHTML = list.map(toolCard).join('') ||
      '<div class="r-empty">该分类下暂无工具</div>';
    return list;
  }

  // 渲染网址导航分组
  function renderNav(container, sites) {
    container.innerHTML = sites.map(function (g) {
      return '<div class="nav-group">' +
        '<div class="nav-group-title">' + g.icon + ' ' + g.cat +
        ' <span class="ng-count">' + g.sites.length + ' 个</span></div>' +
        '<div class="nav-grid">' + g.sites.map(navCard).join('') + '</div>' +
        '</div>';
    }).join('');
  }

  // 渲染 AI 专区分组
  function renderAI(container, groups) {
    container.innerHTML = groups.map(function (g) {
      return '<div class="nav-group">' +
        '<div class="nav-group-title">' + g.icon + ' ' + g.tag +
        ' <span class="ng-count">' + g.items.length + ' 个</span></div>' +
        '<div class="nav-grid">' + g.items.map(aiCard).join('') + '</div>' +
        '</div>';
    }).join('');
  }

  // 分类标签页过滤
  function attachCatTabs(tools) {
    var tabs = document.querySelectorAll('.cat-tab');
    var grid = document.getElementById('tool-grid');
    if (!tabs.length || !grid) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var cat = tab.dataset.cat;
        var list = cat === 'all' ? tools : tools.filter(function (t) { return t.category === cat; });
        grid.innerHTML = list.map(toolCard).join('');
      });
    });
  }

  // 站点数据加载（供搜索使用）
  function loadAllData(cb) {
    Promise.all([
      fetchJSON('assets/data/tools.json'),
      fetchJSON('assets/data/sites.json'),
      fetchJSON('assets/data/ai-tools.json'),
    ]).then(function (res) {
      window.BS_DATA.tools = res[0];
      window.BS_DATA.sites = [];
      res[1].forEach(function (g) {
        g.sites.forEach(function (s) {
          window.BS_DATA.sites.push({ name: s.name, desc: s.desc, url: s.url, icon: s.icon, cat: g.cat });
        });
      });
      window.BS_DATA.ai = res[2];
      cb && cb();
    }).catch(function (e) { console.error(e); });
  }

  window.BS_UI = {
    CATS: CATS,
    fetchJSON: fetchJSON,
    toolCard: toolCard,
    navCard: navCard,
    aiCard: aiCard,
    renderTools: renderTools,
    renderNav: renderNav,
    renderAI: renderAI,
    attachCatTabs: attachCatTabs,
    loadAllData: loadAllData,
  };
})();

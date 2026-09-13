/* ============================================================
   白鲨工具站 - 热搜聚合模块
   本地 server.js 和云端 Cloudflare Pages Functions 共用
   数据源：百度热搜（可用）、B站热搜（可用）
   ============================================================ */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// 百度热搜
async function fetchBaidu() {
  try {
    const r = await fetch('https://top.baidu.com/api/board?platform=wise&tab=realtime', {
      headers: { 'User-Agent': UA, 'Referer': 'https://top.baidu.com/' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const items = j?.data?.cards?.[0]?.content?.[0]?.content || [];
    return items
      .filter((it) => it && it.word)
      .map((it, i) => ({
        rank: it.index || i + 1,
        word: it.word,
        url: it.url || '',
        heat: it.hotScore || it.hotTag || it.hotShow || '',
      }))
      .slice(0, 20);
  } catch (e) {
    throw new Error('百度热搜获取失败：' + e.message);
  }
}

// B站热搜
async function fetchBilibili() {
  try {
    const r = await fetch('https://api.bilibili.com/x/web-interface/search/square?limit=20', {
      headers: { 'User-Agent': UA, 'Referer': 'https://www.bilibili.com/' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (j.code !== 0) throw new Error(j.message || 'code ' + j.code);
    const list = j?.data?.trending?.list || [];
    return list
      .filter((it) => it && it.keyword)
      .map((it, i) => ({
        rank: i + 1,
        word: it.keyword,
        url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(it.keyword),
        heat: it.hot_score || it.hotId || '',
      }))
      .slice(0, 20);
  } catch (e) {
    throw new Error('B站热搜获取失败：' + e.message);
  }
}

// 聚合入口：全部数据源尽力获取，单个失败不阻断
export async function getHotSearch() {
  const sources = [
    { id: 'baidu', name: '百度', icon: '🔎', fetch: fetchBaidu },
    { id: 'bilibili', name: 'B站', icon: '📺', fetch: fetchBilibili },
  ];
  const results = [];
  for (const s of sources) {
    try {
      results.push({ id: s.id, name: s.name, icon: s.icon, items: await s.fetch() });
    } catch (e) {
      results.push({ id: s.id, name: s.name, icon: s.icon, items: [], error: e.message });
    }
  }
  return { time: Date.now(), sources: results };
}

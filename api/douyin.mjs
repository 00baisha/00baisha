/* ============================================================
   白鲨工具站 - 抖音解析模块（尽力而为模式）
   原理：用（可选）用户提供的 Cookie 访问抖音页面，
   从 _ROUTER_DATA 提取视频数据，playwm → play 去水印。
   匿名请求会被抖音反爬拦截，需要 Cookie 才可靠。
   ============================================================ */

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// 从链接提取抖音作品 ID
export function extractDouyinId(input) {
  const s = String(input).trim();
  let m = s.match(/(?:douyin\.com\/(?:video|note)|(?:iesdouyin|m\.douyin)\.com\/share\/(?:video|note))\/(\d+)/i);
  if (m) return m[1];
  m = s.match(/v\.douyin\.com\/[A-Za-z0-9_-]+/i);
  if (m) return { short: m[0] }; // 短链需先解析跳转
  m = s.match(/^(\d{15,20})$/);
  if (m) return m[1];
  throw new Error('无法识别抖音链接，请粘贴 https://www.douyin.com/video/xxx 或 v.douyin.com 短链');
}

// 解析 v.douyin.com 短链，拿到真实 ID
export async function resolveShortLink(rawUrl) {
  const r = await fetch(rawUrl, {
    method: 'HEAD',
    redirect: 'manual',
    headers: { 'User-Agent': UA, 'accept-language': 'zh-CN,zh;q=0.9' },
  });
  const loc = r.headers.get('location');
  if (loc) return extractDouyinId(loc);
  // 兜底：跟随跳转
  const r2 = await fetch(rawUrl, { redirect: 'follow', headers: { 'User-Agent': UA } });
  return extractDouyinId(r2.url);
}

// 抓取页面并提取视频信息（cookie 可选）
export async function fetchDouyinPost(id, cookie) {
  const pages = [
    'https://m.douyin.com/share/video/' + id,
    'https://www.iesdouyin.com/share/video/' + id,
    'https://www.douyin.com/video/' + id,
  ];
  let lastErr = '';
  for (const page of pages) {
    try {
      const headers = {
        'User-Agent': UA,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'referer': 'https://www.douyin.com/',
      };
      if (cookie) headers['Cookie'] = cookie;
      const r = await fetch(page, { headers, redirect: 'follow' });
      const html = await r.text();
      const m = html.match(/window\._ROUTER_DATA\s*=\s*([\s\S]*?)<\/script>/);
      if (!m) { lastErr = page + ': 页面无数据'; continue; }
      let json;
      try { json = JSON.parse(m[1].trim().replace(/;+\s*$/, '')); }
      catch (e) { lastErr = page + ': 数据解析失败'; continue; }
      const item = json?.loaderData?.['video_(id)/page']?.videoInfoRes?.item_list?.[0]
        || json?.loaderData?.['note_(id)/page']?.videoInfoRes?.item_list?.[0];
      if (!item) { lastErr = page + ': 未返回视频数据（可能需要 Cookie）'; continue; }
      return buildPost(item, id);
    } catch (e) {
      lastErr = page + ': ' + e.message;
    }
  }
  const hint = cookie ? '' : '。抖音匿名访问被限制，请在页面"高级选项"中粘贴登录 Cookie 后重试';
  throw new Error(lastErr + hint || '抖音解析失败');
}

function buildPost(item, id) {
  const video = item.video || {};
  const urlList = video.play_addr?.url_list || [];
  const rawUrl = urlList[0];
  if (!rawUrl) throw new Error('未找到视频地址');
  return {
    platform: 'douyin',
    bvid: id,
    title: item.desc || '抖音作品',
    desc: item.desc || '',
    pic: pickUrl(video.cover?.url_list) || '',
    owner: item.author?.nickname || '未知作者',
    duration: typeof video.duration === 'number' ? Math.round(video.duration / 1000) : 0,
    // 去水印：playwm → play
    videoUrl: rawUrl.replace('playwm', 'play'),
    rawUrl: rawUrl,
  };
}

function pickUrl(list) {
  return Array.isArray(list) && typeof list[0] === 'string' ? list[0] : '';
}

// 完整解析入口
export async function resolveDouyin(input, cookie) {
  let id;
  const extracted = extractDouyinId(input);
  if (typeof extracted === 'object' && extracted.short) {
    id = await resolveShortLink('https://' + extracted.short);
  } else {
    id = extracted;
  }
  return fetchDouyinPost(id, cookie);
}

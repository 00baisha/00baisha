/* ============================================================
   白鲨工具站 - B站视频解析模块（第二阶段）
   本地 server.js 和云端 Cloudflare Pages Functions 共用
   ============================================================ */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const REFERER = 'https://www.bilibili.com/';
const API = 'https://api.bilibili.com';

async function biliFetch(path, extraHeaders = {}) {
  const r = await fetch(API + path, {
    headers: { 'User-Agent': UA, 'Referer': REFERER, ...extraHeaders },
  });
  const json = await r.json().catch(() => null);
  if (!json) throw new Error('B站接口返回异常（HTTP ' + r.status + '）');
  if (json.code !== 0) throw new Error('B站接口错误：' + (json.message || ('code ' + json.code)));
  return json.data;
}

// 从任意形式的链接里提取 bvid 或 aid
export function extractId(input) {
  const s = String(input).trim();
  let m = s.match(/BV[0-9A-Za-z]{10}/);
  if (m) return { bvid: m[0] };
  m = s.match(/av(\d+)/i);
  if (m) return { aid: m[1] };
  m = s.match(/^BV[0-9A-Za-z]{10}$/);
  if (m) return { bvid: s };
  m = s.match(/^av(\d+)$/i);
  if (m) return { aid: m[1] };
  throw new Error('无法识别链接，请粘贴 B 站视频链接（如 https://www.bilibili.com/video/BVxxxx）或 BV 号');
}

// 解析视频信息（标题、文案、封面、UP主、时长）
export async function getInfo(id) {
  const query = id.bvid ? 'bvid=' + id.bvid : 'aid=' + id.aid;
  const d = await biliFetch('/x/web-interface/view?' + query);
  return {
    bvid: d.bvid,
    aid: d.aid,
    title: d.title || '',
    desc: d.desc || '',
    pic: d.pic || '',
    owner: d.owner ? d.owner.name : '',
    duration: d.duration || 0, // 秒
    cid: d.cid,
    tname: d.tname || '',
    pubdate: d.pubdate || 0,
  };
}

// 获取单文件（视频+音频合并）mp4 地址，按清晰度
export async function getPlayUrls(bvid, cid) {
  const qnMap = { 16: '流畅 360P', 32: '清晰 480P', 64: '高清 720P' };
  const out = [];
  for (const qn of [16, 32, 64]) {
    try {
      const d = await biliFetch('/x/player/playurl?bvid=' + bvid + '&cid=' + cid + '&fnval=0&qn=' + qn);
      const durl = d.durl && d.durl[0];
      if (durl && durl.url) {
        out.push({ qn: qn, label: qnMap[qn], url: durl.url, size: durl.size || 0 });
      }
    } catch (e) { /* 某些清晰度可能不可用，跳过 */ }
  }
  if (!out.length) throw new Error('未能获取视频地址（该视频可能需要登录）');
  return out;
}

// 获取纯音频流地址（用于提取 MP3）
export async function getAudioUrl(bvid, cid) {
  const d = await biliFetch('/x/player/playurl?bvid=' + bvid + '&cid=' + cid + '&fnval=16&qn=64');
  const audio = d.dash && d.dash.audio && d.dash.audio[0];
  if (!audio || !audio.baseUrl) throw new Error('未能获取音频流');
  return { url: audio.baseUrl, bandwidth: audio.bandwidth || 0 };
}

// 带 B站 请求头抓取（下载/代理用）
export async function fetchUpstream(url, init = {}) {
  return fetch(url, {
    ...init,
    headers: { 'User-Agent': UA, 'Referer': REFERER, ...(init.headers || {}) },
  });
}

// 安全校验：只允许代理 B站 相关域名的地址
export function isAllowedHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ['bili', 'hdslb', 'mcdn', 'mountaintoys', 'akamaized'].some((k) => host.includes(k));
  } catch (e) {
    return false;
  }
}

// 完整解析入口
export async function resolveVideo(input) {
  const id = extractId(input);
  const info = await getInfo(id);
  const playUrls = await getPlayUrls(info.bvid, info.cid);
  let audio = null;
  try { audio = await getAudioUrl(info.bvid, info.cid); } catch (e) { /* 音频不可用不阻断 */ }
  return { info, playUrls, audio };
}

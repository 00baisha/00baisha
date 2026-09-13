// Cloudflare Pages Function：热搜聚合 API
// 部署后自动成为 https://你的域名/api/hot-search
import { getHotSearch } from '../../api/hot.mjs';

export async function onRequestGet() {
  try {
    const data = await getHotSearch();
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || '热搜获取失败' });
  }
}

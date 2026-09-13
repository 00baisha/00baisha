// Cloudflare Pages Function：抖音解析 API（Cookie 可选）
// 部署后自动成为 https://你的域名/api/douyin-parse
import { resolveDouyin } from '../../api/douyin.mjs';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const input = url.searchParams.get('url') || '';
  const cookie = url.searchParams.get('cookie') || '';
  try {
    const data = await resolveDouyin(input, cookie || undefined);
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || '解析失败' });
  }
}

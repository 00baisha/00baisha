// Cloudflare Pages Function：B站视频/音频下载代理
// 部署后自动成为 https://你的域名/api/bili-download
import { isAllowedHost, fetchUpstream } from '../../api/bili.mjs';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('url') || '';
  const name = url.searchParams.get('name') || 'video';
  if (!target || !isAllowedHost(target)) {
    return Response.json({ ok: false, error: '不允许的下载地址' }, { status: 400 });
  }
  try {
    const upstream = await fetchUpstream(target);
    if (!upstream.ok) {
      return Response.json({ ok: false, error: '上游下载失败（HTTP ' + upstream.status + '）' }, { status: 502 });
    }
    const headers = new Headers(upstream.headers);
    headers.set('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(name));
    headers.set('Cache-Control', 'no-store');
    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    return Response.json({ ok: false, error: '下载失败：' + e.message }, { status: 500 });
  }
}

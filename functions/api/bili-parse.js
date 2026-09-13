// Cloudflare Pages Function：B站视频解析 API
// 部署后自动成为 https://你的域名/api/bili-parse
import { resolveVideo } from '../../api/bili.mjs';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const input = url.searchParams.get('url') || '';
  try {
    const data = await resolveVideo(input);
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || '解析失败' });
  }
}

import { GALLERY_PLAYLISTS } from '@/configs/media';

// ponytail: scrapes YouTube's ytInitialData instead of the Data API. No key, but
// fragile — if YouTube changes markup this returns [] and Gallery falls back to a
// plain playlist embed. Upgrade path: YouTube Data API + YOUTUBE_API_KEY.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const YOUTUBE_TIMEOUT_MS = 8000;

function extractVideoIds(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) return [];
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return [];
  }
  const seen = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    const lv = node.lockupViewModel;
    if (lv?.contentId && lv.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') seen.add(lv.contentId);
    for (const key in node) walk(node[key]);
  })(data);
  return [...seen];
}

// Drop videos that would grey-out & stall the embed: deleted/private (status != OK)
// AND embed-disabled/age-restricted (playableInEmbed false). The watch page carries
// both flags; oEmbed can't see embeddability, so it isn't enough.
async function isEmbeddable(id) {
  try {
    const html = await (
      await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': UA },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(YOUTUBE_TIMEOUT_MS),
      })
    ).text();
    const status = html.match(/"playabilityStatus":\{"status":"([^"]+)"/)?.[1];
    const inEmbed = html.match(/"playableInEmbed":(true|false)/)?.[1];
    return status === 'OK' && inEmbed === 'true';
  } catch {
    return false; // transient failure → skip for now, self-heals next revalidate
  }
}

export async function getGalleryPlaylists() {
  return Promise.all(
    GALLERY_PLAYLISTS.map(async (playlist) => {
      try {
        const res = await fetch(
          `https://www.youtube.com/playlist?list=${playlist.playlistId}&hl=en`,
          {
            headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': UA },
            next: { revalidate: 86400 }, // refresh daily, no rebuild needed
            signal: AbortSignal.timeout(YOUTUBE_TIMEOUT_MS),
          }
        );
        const ids = extractVideoIds(await res.text());
        const flags = await Promise.all(ids.map(isEmbeddable));
        return { ...playlist, videoIds: ids.filter((_, i) => flags[i]) };
      } catch {
        return { ...playlist, videoIds: [] };
      }
    })
  );
}

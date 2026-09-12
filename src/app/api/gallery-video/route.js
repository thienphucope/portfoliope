import { getGalleryPlaylists } from '@/lib/galleryPlaylists';

// Feeds the sidebar its random clips. Reuses the gallery scrape (cached daily)
// and keeps the per-playlist grouping so the client can round-robin (a big
// playlist shouldn't drown out a small one).
export const revalidate = 86400;

export async function GET() {
  const playlists = await getGalleryPlaylists();
  const groups = playlists.map((p) => p.videoIds || []).filter((ids) => ids.length);
  return Response.json({ groups });
}

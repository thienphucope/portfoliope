import { getGalleryPlaylists } from '@/lib/galleryPlaylists';

// Feeds the sidebar its random clips. Reuses the gallery scrape (cached daily)
// and keeps the per-playlist grouping so the client can round-robin (a big
// playlist shouldn't drown out a small one).
// YouTube can stall requests from build-provider IPs, so resolve this on demand
// instead of making a successful deployment depend on an external scrape.
export const dynamic = 'force-dynamic';

export async function GET() {
  const playlists = await getGalleryPlaylists();
  const groups = playlists.map((p) => p.videoIds || []).filter((ids) => ids.length);
  return Response.json({ groups });
}

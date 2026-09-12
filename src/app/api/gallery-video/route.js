import { getGalleryPlaylists } from '@/lib/galleryPlaylists';

// Fetch on demand so deployments do not depend on an external API. Individual
// YouTube Data API responses are cached for a day in galleryPlaylists.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const playlists = await getGalleryPlaylists();
    const groups = playlists.map((p) => p.videoIds || []).filter((ids) => ids.length);
    if (!groups.length && playlists.length) {
      return Response.json(
        { groups: [], error: 'YouTube Data API returned no playable videos' },
        { status: 502 }
      );
    }
    return Response.json(
      { groups },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    console.error('Gallery video API failed:', error);
    return Response.json({ groups: [], error: 'Unable to load gallery videos' }, { status: 503 });
  }
}

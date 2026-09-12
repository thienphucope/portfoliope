import { getGalleryPlaylists } from '@/lib/galleryPlaylists';

// Feeds the sidebar its random clip. Reuses the gallery scrape (cached daily),
// so this just flattens the already-filtered, embeddable video IDs.
export const revalidate = 86400;

export async function GET() {
  const playlists = await getGalleryPlaylists();
  const videoIds = playlists.flatMap((p) => p.videoIds || []);
  return Response.json({ videoIds });
}

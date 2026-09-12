import { GALLERY_PLAYLISTS } from '@/configs/media';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_TIMEOUT_MS = 8000;
const YOUTUBE_CACHE_SECONDS = 86400;
const MAX_RESULTS = 50;

function normalizePlaylistId(value) {
  return String(value || '').split('&')[0].trim();
}

async function fetchYouTube(resource, params) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not configured');

  const url = new URL(`${YOUTUBE_API_BASE}/${resource}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, String(value));
  }
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    next: { revalidate: YOUTUBE_CACHE_SECONDS },
    signal: AbortSignal.timeout(YOUTUBE_TIMEOUT_MS),
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {}
    throw new Error(`YouTube Data API ${resource} failed (${response.status}): ${message}`);
  }

  return response.json();
}

async function getPlaylistVideoIds(playlistId) {
  const ids = [];
  let pageToken = null;

  do {
    const data = await fetchYouTube('playlistItems', {
      part: 'contentDetails',
      playlistId,
      maxResults: MAX_RESULTS,
      pageToken,
      fields: 'nextPageToken,items(contentDetails(videoId))',
    });

    for (const item of data.items || []) {
      const id = item?.contentDetails?.videoId;
      if (id) ids.push(id);
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return [...new Set(ids)];
}

async function keepEmbeddableVideos(ids) {
  const batches = [];
  for (let i = 0; i < ids.length; i += MAX_RESULTS) {
    batches.push(ids.slice(i, i + MAX_RESULTS));
  }

  const responses = await Promise.all(
    batches.map((batch) => fetchYouTube('videos', {
      part: 'status',
      id: batch.join(','),
      fields: 'items(id,status(embeddable,privacyStatus,uploadStatus))',
    }))
  );

  const allowed = new Set();
  for (const data of responses) {
    for (const video of data.items || []) {
      const status = video.status;
      if (status?.embeddable && status.privacyStatus !== 'private' && status.uploadStatus === 'processed') {
        allowed.add(video.id);
      }
    }
  }

  return ids.filter((id) => allowed.has(id));
}

export async function getGalleryPlaylists() {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }

  return Promise.all(
    GALLERY_PLAYLISTS.map(async (playlist) => {
      const playlistId = normalizePlaylistId(playlist.playlistId);
      try {
        const ids = await getPlaylistVideoIds(playlistId);
        const videoIds = await keepEmbeddableVideos(ids);
        return { ...playlist, playlistId, videoIds };
      } catch (error) {
        console.error(`Gallery playlist "${playlist.title}" failed:`, error);
        return { ...playlist, playlistId, videoIds: [] };
      }
    })
  );
}

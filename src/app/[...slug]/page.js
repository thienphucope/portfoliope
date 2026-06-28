import { notFound, permanentRedirect } from 'next/navigation';
import { hydrateServerCache } from '@/services/caseProvider';

// Mirror the slug -> file resolution used in the case archive route.
function resolveCaseKey(rawCache, slugParts) {
  if (!rawCache || !slugParts || slugParts.length === 0) return null;
  const target = decodeURIComponent(slugParts.join('/')).replace(/\.md$/i, '').toLowerCase();
  const lastSeg = target.split('/').pop();
  for (const key of Object.keys(rawCache)) {
    const lower = key.toLowerCase();
    const noExt = lower.replace(/\.md$/i, '');
    const nameNoExt = lower.split('/').pop().replace(/\.md$/i, '');
    if (noExt === target || nameNoExt === target || nameNoExt === lastSeg) return key;
  }
  return null;
}

// Legacy case URLs used to live at the root (/<slug>). They now live under
// /casearchive/<slug>. A real old case → permanent (308) redirect to its
// canonical archive URL so indexed links keep working. Anything that is not a
// case (deleted pages like /about, typos) → a clean 404, not a redirect.
// Reserved routes (/chat, /voice, /casearchive, /privacy, /terms, /noirboard,
// /api) match their own segments first and never reach here.
export default async function LegacyCaseRedirect({ params }) {
  const slug = (await params)?.slug || [];

  let snapshot = null;
  try {
    snapshot = await hydrateServerCache(false);
  } catch (e) {
    console.error('Legacy redirect: failed to hydrate cache:', e);
  }
  const rawCache = snapshot?.rawCache || {};

  const key = resolveCaseKey(rawCache, slug);
  // Pass the raw (decoded) key; Next encodes the Location header once.
  if (key) permanentRedirect('/casearchive/' + key.replace(/\.md$/i, ''));

  // Cache loaded but no match → genuinely not a case → clean 404.
  if (Object.keys(rawCache).length > 0) notFound();

  // Cache empty (GitHub down): don't false-404 a real case; defer to the archive route.
  permanentRedirect('/casearchive/' + slug.join('/'));
}

import CaseClient from '@/features/casearchives/CaseArchives';
import HeroSection from '@/components/sections/HeroSection';
import NoteFeed from '@/features/casearchives/NoteFeed';
import { hydrateServerCache } from '@/services/caseProvider';

function caseTitleFromKey(key) {
  return key.split('/').pop().replace(/\.md$/i, '');
}

// Mirror the slug -> file resolution used client-side in CaseArchives.
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

function buildDescription(raw) {
  if (!raw) return undefined;
  const body = String(raw)
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (t.startsWith('#')) return false;        // headings
      if (/^\*.*\*$/.test(t)) return false;        // *author* / *tag* / *links* meta lines
      return true;
    })
    .join(' ')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!body) return undefined;
  return body.length > 155 ? body.slice(0, 152).trimEnd() + '...' : body;
}

export async function generateMetadata({ params }) {
  const slug = (await params)?.slug;
  if (!slug || slug.length === 0) {
    return {
      title: 'Ope Watson',
      description: 'Detective case archives, notes, and stories by Ope Watson.',
      alternates: { canonical: '/' },
    };
  }

  let snapshot = null;
  try {
    snapshot = await hydrateServerCache(false);
  } catch (e) {
    console.error('generateMetadata: failed to hydrate cache:', e);
  }

  const key = snapshot ? resolveCaseKey(snapshot.rawCache, slug) : null;
  if (!key) {
    return { alternates: { canonical: '/' + slug.join('/') } };
  }

  const title = `${caseTitleFromKey(key)} | Ope Watson`;
  const description = buildDescription(snapshot.rawCache[key]);
  const canonical = '/' + key.replace(/\.md$/i, '');

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
  };
}

export default async function CasePage({ params }) {
  let githubData = null;
  try {
    githubData = await hydrateServerCache(false);
  } catch (e) {
    console.error("Failed to hydrate server cache in CasePage:", e);
  }

  const slug = (await params)?.slug;
  const isRoot = !slug || slug.length === 0;

  const rawCache = githubData?.rawCache || {};
  const htmlCache = githubData?.htmlCache || {};

  const activeKey = !isRoot ? resolveCaseKey(rawCache, slug) : null;
  const caseLinks = isRoot
    ? Object.keys(rawCache).map((key) => ({ href: '/' + key.replace(/\.md$/i, ''), title: caseTitleFromKey(key) }))
    : [];

  return (
    <main>
      {/* SSR fallback for crawlers: unique content per URL. The interactive UI is client-rendered. */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {isRoot ? (
          <section>
            <h1>Ope Watson — Case Archives</h1>
            <ul>
              {caseLinks.map((c) => (
                <li key={c.href}><a href={c.href}>{c.title}</a></li>
              ))}
            </ul>
          </section>
        ) : activeKey ? (
          <article>
            <h1>{caseTitleFromKey(activeKey)}</h1>
            <div dangerouslySetInnerHTML={{ __html: htmlCache[activeKey] || rawCache[activeKey] }} />
          </article>
        ) : null}
      </div>

      {isRoot
        ? (
          <div className="nf-shell">
            <HeroSection />
            <NoteFeed serverData={githubData} />
          </div>
        )
        : <CaseClient serverHydratedData={githubData} />
      }
    </main>
  );
}

import CaseClient from '@/features/casearchives/CaseArchives';
import NoteFeed from '@/features/casearchives/NoteFeed';
import HeroSection from '@/components/sections/HeroSection';
import Link from 'next/link';
import TextToSpeech from '@/features/texttospeech/TextToSpeech';
import { hydrateServerCache } from '@/services/caseProvider';

export default async function CasePage({ params }) {
  let githubData = null;
  try {
    githubData = await hydrateServerCache(false);
  } catch (e) {
    console.error("Failed to hydrate server cache in CasePage:", e);
  }

  const slug = (await params)?.slug;
  const isRoot = !slug || slug.length === 0;

  const seoArticles = githubData ? Object.entries(githubData.rawCache).map(([path, raw]) => ({
    id: path,
    name: path.split('/').pop(),
    content: raw,
    html: githubData.htmlCache[path] || null
  })) : [];

  return (
    <main>
      <div style={{ display: 'none', visibility: 'hidden', height: 0, overflow: 'hidden' }} aria-hidden="true">
        {seoArticles.map(f => (
          <article key={f.id} id={`seo-${f.id}`}>
            <h2>{f.name}</h2>
            <div dangerouslySetInnerHTML={{ __html: f.html || f.content }} />
          </article>
        ))}
      </div>

      {isRoot
        ? (
          <NoteFeed
            serverData={githubData}
            hero={(
              <HeroSection>
                <div className="nf-desktop-only">
                  <TextToSpeech />
                </div>
                <Link href="/voice" className="nf-mobile-only nf-block-ref-link">
                  Voice synthesis →
                </Link>
              </HeroSection>
            )}
          />
        )
        : <CaseClient serverHydratedData={githubData} />
      }
    </main>
  );
}

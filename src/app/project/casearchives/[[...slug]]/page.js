import CaseClient from './CaseClient';
import { hydrateServerCache } from '@/services/caseProvider';

export default async function CasePage({ params }) {
  // Fetch GitHub data using the shared service
  let githubData = null;
  try {
    githubData = await hydrateServerCache(false);
  } catch (e) {
    console.error("Failed to hydrate server cache in CasePage:", e);
  }

  // Use GitHub data for SEO rendering
  const seoArticles = githubData ? Object.entries(githubData.rawCache).map(([path, raw]) => ({
    id: path,
    name: path.split('/').pop(),
    content: raw,
    html: githubData.htmlCache[path] || null
  })) : [];

  return (
    <main>
      {/* SEO Content for AdSense - Hidden from users but visible to crawlers */}
      <div 
        style={{ 
          display: 'none', 
          visibility: 'hidden', 
          height: 0, 
          overflow: 'hidden' 
        }} 
        aria-hidden="true"
      >
        {seoArticles.map(f => (
          <article key={f.id} id={`seo-${f.id}`}>
            <h2>{f.name}</h2>
            <div dangerouslySetInnerHTML={{ 
              __html: f.html || f.content 
            }} />
          </article>
        ))}
      </div>

      {/* Pass only hydrated GitHub data to Client Component */}
      <CaseClient 
        serverHydratedData={githubData}
      />
    </main>
  );
}

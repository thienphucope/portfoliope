import fs from 'fs';
import path from 'path';
import CaseClient from './CaseClient';
import { hydrateServerCache } from '@/services/caseProvider';

export default async function CasePage({ params }) {
  // 1. Fetch static records from local content folder
  const contentDir = path.join(process.cwd(), 'content');
  const filenames = fs.readdirSync(contentDir)
    .filter(file => file.endsWith('.md') && file !== 'about.md' && file !== 'privacy.md');

  const initialStaticData = filenames.map(name => {
    try {
      const fullPath = path.join(contentDir, name);
      return { 
        id: name, 
        name: name,
        content: fs.readFileSync(fullPath, 'utf8') 
      };
    } catch (e) {
      console.error(`Error reading ${name}:`, e);
      return { id: name, name: name, content: "" };
    }
  });

  // 2. Fetch GitHub data using the shared service
  let githubData = null;
  try {
    githubData = await hydrateServerCache(false);
  } catch (e) {
    console.error("Failed to hydrate server cache in CasePage:", e);
  }

  // Combine for SEO rendering
  const seoArticles = [
    ...initialStaticData,
    ...(githubData ? Object.entries(githubData.rawCache).map(([path, raw]) => ({
      id: path,
      name: path.split('/').pop(),
      content: raw
    })) : [])
  ];

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
              __html: githubData?.htmlCache?.[f.id] || f.content 
            }} />
          </article>
        ))}
      </div>

      {/* Pass both static data and hydrated GitHub data to Client Component */}
      <CaseClient 
        staticRecords={initialStaticData} 
        serverHydratedData={githubData}
      />
    </main>
  );
}

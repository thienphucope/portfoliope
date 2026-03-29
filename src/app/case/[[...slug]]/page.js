import fs from 'fs';
import path from 'path';
import CaseClient from './CaseClient';

export default async function CasePage() {
  const contentDir = path.join(process.cwd(), 'src', 'content');
  
  // Automatically read all .md files from the folder, 
  // excluding specific page-level content like 'about.md' and 'privacy.md'
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

  return (
    <main>
      {/* SEO Content for AdSense */}
      <div 
        style={{ 
          display: 'none', 
          visibility: 'hidden', 
          height: 0, 
          overflow: 'hidden' 
        }} 
        aria-hidden="true"
      >
        {initialStaticData.map(f => (
          <article key={f.id}>
            <h2>{f.name}</h2>
            {f.content}
          </article>
        ))}
      </div>

      {/* Pass static data to Client Component */}
      <CaseClient staticRecords={initialStaticData} />
    </main>
  );
}

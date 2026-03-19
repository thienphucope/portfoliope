import fs from 'fs';
import path from 'path';
import CaseClient from './CaseClient';

export default async function CasePage() {
  const contentDir = path.join(process.cwd(), 'src', 'content');
  const staticFiles = [
    { id: 'system::about-project', name: 'About This Project.md', path: 'About This Project.md' },
    { id: 'system::technical-architecture', name: 'Technical Architecture.md', path: 'Technical Architecture.md' },
    { id: 'system::interactive-features', name: 'Interactive Features.md', path: 'Interactive Features.md' },
    { id: 'system::faq', name: 'FAQ.md', path: 'faq.md' },
    { id: 'system::house-rules', name: 'House Rules.md', path: 'House Rules.md' },
    { id: 'system::development-journey', name: 'Development Journey.md', path: 'Development Journey.md' }
  ];

  const initialStaticData = staticFiles.map(file => {
    try {
      const fullPath = path.join(contentDir, file.path);
      if (fs.existsSync(fullPath)) {
        return { 
          ...file, 
          content: fs.readFileSync(fullPath, 'utf8') 
        };
      }
    } catch (e) {
      console.error(`Error reading ${file.name}:`, e);
    }
    return { ...file, content: "" };
  });

  return (
    <main>
      {/* 
        Nội dung SEO cho AdSense: Chèn tất cả file tĩnh vào HTML.
        Giúp AdSense thấy hàng nghìn chữ thực tế về dự án ngay khi trang vừa tải.
      */}
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

      {/* Truyền dữ liệu tĩnh vào Client Component */}
      <CaseClient staticRecords={initialStaticData} />
    </main>
  );
}

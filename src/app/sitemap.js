import fs from 'fs';
import path from 'path';
import { hydrateServerCache } from '@/services/caseProvider';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://opewatson.com'; // Thay bằng domain của bạn nếu cần

  // 1. Các trang tĩnh cơ bản
  const staticPages = [
    { route: '', priority: 1.0, changeFrequency: 'daily' },
    { route: '/case', priority: 0.9, changeFrequency: 'daily' },
    { route: '/about', priority: 0.3, changeFrequency: 'monthly' },
    { route: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
    { route: '/home', priority: 0.3, changeFrequency: 'monthly' },
    { route: '/terms', priority: 0.3, changeFrequency: 'monthly' },
  ].map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: new Date(),
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 2. Lấy danh sách các case từ thư mục content (local)
  const contentDir = path.join(process.cwd(), 'content');
  let localCases = [];
  try {
    const filenames = fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.md') && file !== 'about.md' && file !== 'privacy.md');
    
    localCases = filenames.map(name => ({
      url: `${baseUrl}/case/${name.replace('.md', '')}`,
      lastModified: new Date(),
      changeFrequency: 'daily', // Note có thể thay đổi thường xuyên
      priority: 0.8, // Ưu tiên các note
    }));
  } catch (e) {
    console.error("Sitemap: Error reading local content:", e);
  }

  // 3. Lấy danh sách các case từ GitHub (qua cache provider)
  let githubCases = [];
  try {
    const snapshot = await hydrateServerCache(false);
    if (snapshot && snapshot.rawCache) {
      githubCases = Object.keys(snapshot.rawCache).map(filePath => {
        const slug = filePath.replace(/\.md$/i, '');
        return {
          url: `${baseUrl}/case/${slug}`,
          lastModified: new Date(snapshot.hydratedAt || Date.now()),
          changeFrequency: 'daily',
          priority: 0.8, // Ưu tiên các note
        };
      });
    }
  } catch (e) {
    console.error("Sitemap: Error fetching GitHub cases:", e);
  }

  // Kết hợp tất cả lại, loại bỏ trùng lặp nếu có
  const allRoutes = [...staticPages, ...localCases, ...githubCases];
  
  // Loại bỏ các URL trùng (ví dụ file có cả ở local và github)
  const uniqueRoutes = Array.from(new Map(allRoutes.map(item => [item.url, item])).values());

  return uniqueRoutes;
}

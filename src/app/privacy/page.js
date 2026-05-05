import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Background from '@/components/layout/Background';
import Header from '@/components/layout/Header';
import MomentumScroll from '@/components/layout/MomentumScroll';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'public', 'content', 'Privacy.md');
  let content = "";
  try {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    console.error("Error reading Privacy.md", e);
  }

  return (
    <>
      <Background />
      <Header />
      <MomentumScroll />
      <div className="min-h-screen bg-[#121212] py-30 px-6 md:px-20" style={{ fontFamily: 'var(--md-font)' }}>
        <div className="max-w-4xl mx-auto">
          <article className="relative z-50 prose prose-invert prose-lg md:prose-xl max-w-none
            prose-headings:font-fredericka prose-headings:text-[var(--colorone)]
            prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-justify
            prose-strong:text-[var(--colorone)]
            prose-li:text-gray-300
            prose-code:text-[var(--colorone)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </>
  );
}

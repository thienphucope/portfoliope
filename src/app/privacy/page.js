import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'privacy.md');
  const content = fs.readFileSync(filePath, 'utf8');

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-fredericka p-6 md:p-20 overflow-y-auto no-scrollbar">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--colorone)] hover:text-white transition-colors mb-8 group">
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
        
        <article className="prose prose-invert prose-stone max-w-none 
          prose-headings:text-[var(--colorone)] prose-headings:font-fredericka
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-strong:text-[var(--colorone)]
          prose-li:text-gray-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'about.md');
  const content = fs.readFileSync(filePath, 'utf8');

  return (
    <div className="h-screen bg-[var(--background)] text-[var(--foreground)] p-6 md:p-20 overflow-y-auto no-scrollbar font-lora">
      <div className="max-w-3xl mx-auto pb-20">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--colorone)] hover:text-white transition-colors mb-12 group font-fredericka">
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xl">Back to Home</span>
        </Link>
        
        <article className="prose prose-invert prose-stone max-w-none 
          prose-headings:text-[var(--colorone)] prose-headings:font-fredericka prose-headings:font-normal
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

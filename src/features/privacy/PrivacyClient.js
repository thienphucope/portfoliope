"use client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useMomentumScroll from '@/features/shared/hooks/useMomentumScroll';
import Background from '@/features/shared/components/Background';
import Header from '@/features/shared/components/Header';

export default function PrivacyContent({ content }) {
  useMomentumScroll();

  return (
    <>
      <Background />
      <Header />
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

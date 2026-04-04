import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * IntroProject component that renders markdown content passed from its parent.
 */
export default function IntroProject({ content }) {
  if (!content) return null;

  return (
    <section className="relative z-50 bg-[#121212] py-10 px-6 md:px-20 border-t border-[var(--colorone)]/20" style={{ fontFamily: 'var(--md-font)' }}>
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-invert prose-lg md:prose-xl max-w-none 
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
    </section>
  );
}

import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * A self-contained, modular server component that fetches and renders the 'About' content.
 * It follows SOLID principles by encapsulating its own data-fetching logic.
 */
export default function About() {
  const aboutPath = path.join(process.cwd(), 'src', 'content', 'about.md');
  let aboutContent = "";
  try {
    if (fs.existsSync(aboutPath)) {
      aboutContent = fs.readFileSync(aboutPath, 'utf8');
    }
  } catch (e) {
    // In a real app, you might want to log this to a service
    console.error("Could not read about.md for About component", e);
    // Return a fallback or null if the content is critical
    return null;
  }

  return (
    <section className="relative z-50 bg-[#121212] py-20 px-6 md:px-20 border-t border-[var(--colorone)]/20 font-lora">
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-invert prose-lg md:prose-xl max-w-none 
          prose-headings:font-fredericka prose-headings:text-[var(--colorone)] 
          prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-justify
          prose-strong:text-[var(--colorone)]
          prose-li:text-gray-300
          prose-code:text-[var(--colorone)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {aboutContent}
          </ReactMarkdown>
        </article>
      </div>
    </section>
  );
}

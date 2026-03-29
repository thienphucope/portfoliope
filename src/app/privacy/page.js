import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Script from 'next/script';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'privacy.md');
  const content = fs.readFileSync(filePath, 'utf8');

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-6 pt-10 pb-20 md:px-20 md:pt-16 md:pb-20 font-lora">
      <div className="max-w-3xl mx-auto pb-20">
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

      <Script id="momentum-scroll" strategy="afterInteractive">
        {`
          (function() {
            if (window.__momentumScrollHandler) {
              window.removeEventListener('wheel', window.__momentumScrollHandler);
            }

            let verticalScrollTarget = window.scrollY;
            let isWheelScrolling = false;

            const handleWheel = (e) => {
              if (window.innerWidth <= 1024 || e.deltaY === 0 || e.shiftKey) return;
              
              e.preventDefault();
              
              if (!isWheelScrolling) {
                verticalScrollTarget = window.scrollY;
              }

              verticalScrollTarget = Math.max(
                0, 
                Math.min(
                  verticalScrollTarget + e.deltaY * 0.8, 
                  document.documentElement.scrollHeight - window.innerHeight
                )
              );

              if (!isWheelScrolling) {
                isWheelScrolling = true;
                const animate = () => {
                  const currentY = window.scrollY;
                  const diff = verticalScrollTarget - currentY;
                  
                  if (Math.abs(diff) < 0.2) {
                    window.scrollTo(0, verticalScrollTarget);
                    isWheelScrolling = false;
                  } else {
                    window.scrollTo(0, currentY + diff * 0.075); 
                    requestAnimationFrame(animate);
                  }
                };
                requestAnimationFrame(animate);
              }
            };

            window.__momentumScrollHandler = handleWheel;
            window.addEventListener('wheel', handleWheel, { passive: false });
          })();
        `}
      </Script>
    </div>
  );
}

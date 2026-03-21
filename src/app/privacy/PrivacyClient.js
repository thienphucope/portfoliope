"use client";
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PrivacyClient({ content }) {
  const verticalScrollTarget = useRef(0);
  const isWheelScrolling = useRef(false);

  useEffect(() => {
    const handleWheel = (e) => {
      // Disable custom momentum scroll on mobile/touch devices or if it's a touch-pad scroll
      if (window.innerWidth <= 1024 || e.deltaY === 0 || e.shiftKey) return;
      
      e.preventDefault();
      
      if (!isWheelScrolling.current) {
        verticalScrollTarget.current = window.scrollY;
      }

      // Increase scroll target based on deltaY
      verticalScrollTarget.current = Math.max(
        0, 
        Math.min(
          verticalScrollTarget.current + e.deltaY * 0.8, 
          document.documentElement.scrollHeight - window.innerHeight
        )
      );

      if (!isWheelScrolling.current) {
        isWheelScrolling.current = true;
        const animate = () => {
          const currentY = window.scrollY;
          const diff = verticalScrollTarget.current - currentY;
          
          if (Math.abs(diff) < 0.2) {
            window.scrollTo(0, verticalScrollTarget.current);
            isWheelScrolling.current = false;
          } else {
            window.scrollTo(0, currentY + diff * 0.075); 
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

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
    </div>
  );
}

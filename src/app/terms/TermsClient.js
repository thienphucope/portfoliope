'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fitHeading } from '@/lib/markdown';
import WindowFrame from '@/components/ui/WindowFrame';
import BaseStyles from '@/styles/BaseStyles';
import TabPanelStyles from '@/styles/TabPanelStyles';
import MarkdownStyles from '@/styles/MarkdownStyles';

export default function TermsClient({ content, title }) {
  const [isMaximized, setIsMaximized] = useState(true);
  const router = useRouter();
  const titleRef = useRef(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const update = () => fitHeading(el, 160);
    update();
    const fontTimer = setTimeout(update, 500);
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => {
      clearTimeout(fontTimer);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [title]);

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className="accordion-app pc-layout has-active">
      <div className="case-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/casebg2.png" alt="" />
      </div>
      <div className="video-overlay" />
      
      <div className={`windows-container has-editor ${isMaximized ? 'has-maximized' : ''}`} style={{ width: '100vw', height: '100vh', margin: 0, display: 'flex', flexDirection: 'row' }}>
        <div className="window-frame-wrapper" style={isMaximized ? {} : { flex: 1, height: '100%' }}>
          <WindowFrame
            id="editor"
            title="Case Archives - Terms of Service"
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized(!isMaximized)}
            onClose={handleClose}
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <article className="markdown-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                <div className="note-content-wrapper" style={{ padding: '2rem 1.5rem' }}>
                  <div className="markdown-content" style={{ textAlign: 'center', width: '100%', overflow: 'visible' }}>
                    <h1
                      ref={titleRef}
                      className="fit-heading"
                      style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'visible', textAlign: 'center', margin: 0, padding: '18px 0 14px', fontFamily: 'var(--font-display)', fontWeight: 900 }}
                    >
                      {title}
                    </h1>
                  </div>
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              </article>
            </div>
          </WindowFrame>
        </div>
      </div>

      <BaseStyles />
      <TabPanelStyles />
      <MarkdownStyles />
    </div>
  );
}

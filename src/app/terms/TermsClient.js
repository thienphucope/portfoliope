'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import WindowFrame from '@/features/casearchives/components/WindowFrame';
import BaseStyles from '@/features/casearchives/styles/BaseStyles';
import TabPanelStyles from '@/features/casearchives/styles/TabPanelStyles';
import MarkdownStyles from '@/features/casearchives/styles/MarkdownStyles';

export default function TermsClient({ content }) {
  const [isMaximized, setIsMaximized] = useState(true);
  const router = useRouter();

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
            <article className="markdown-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="note-content-wrapper" style={{ padding: '2rem 1.5rem' }}>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
          </WindowFrame>
        </div>
      </div>

      <BaseStyles />
      <TabPanelStyles />
      <MarkdownStyles />
    </div>
  );
}

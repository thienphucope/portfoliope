'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WindowFrame from '@/features/casearchives/components/WindowFrame';
import BaseStyles from '@/features/casearchives/styles/BaseStyles';
import TabPanelStyles from '@/features/casearchives/styles/TabPanelStyles';
import Hero from '@/components/sections/AboutHero';
import SnowEffect from '@/components/sections/SnowEffect';
import FingerprintEffect from '@/components/sections/FingerprintEffect';

export default function AboutClient() {
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
      <FingerprintEffect />
      
      <div className={`windows-container has-editor ${isMaximized ? 'has-maximized' : ''}`} style={{ width: '100vw', height: '100vh', margin: 0, display: 'flex', flexDirection: 'row' }}>
        <div className="window-frame-wrapper" style={isMaximized ? {} : { flex: 1, height: '100%' }}>
          <WindowFrame
            id="editor"
            title="Case Archives - Watson Dossier"
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized(!isMaximized)}
            onClose={handleClose}
          >
            <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
              <SnowEffect mounted={true} />
            </div>
            
            <article className="markdown-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
              <div className="note-content-wrapper" style={{ padding: '2rem 1.5rem', minHeight: '100%' }}>
                <Hero />
              </div>
            </article>
          </WindowFrame>
        </div>
      </div>

      <BaseStyles />
      <TabPanelStyles />
    </div>
  );
}

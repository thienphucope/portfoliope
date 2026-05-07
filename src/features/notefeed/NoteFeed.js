"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ensureLibsLoaded } from '@/features/casearchives/utils/markdown';
import { useBootstrapData } from './hooks/useBootstrapData';
import { useFetchBatch, BATCH_SIZE } from './hooks/useFetchBatch';
import { useFeedEffects } from './hooks/useFeedEffects';
import HeroSection from './components/HeroSection';
import CasesSection from './components/CasesSection';
import FeedFooter from './components/FeedFooter';
import NoteFeedStyles from './styles/NoteFeedStyles';

export default function NoteFeed({ onLinkClick, serverData }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);

  const scrollRef    = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const fogCanvasRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    ensureLibsLoaded().then(() => setLibsReady(true));
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  const { allFiles, fileRegistry, fullContentCache, upsertCacheEntry } = useBootstrapData(serverData);
  const { displayedCases, loading, loadedCount, fetchBatch, totalCount } = useFetchBatch({
    allFiles, fileRegistry, fullContentCache, upsertCacheEntry, isMounted, libsReady,
  });
  const { activeSection } = useFeedEffects({
    isMounted, displayedCases, libsReady, scrollRef, cursorDotRef, cursorRingRef, fogCanvasRef,
  });

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  };

  const handleLinkClick = (targetId) => {
    if (onLinkClick) {
      const link = document.createElement('a');
      link.setAttribute('data-target', targetId);
      link.classList.add('internal-link');
      onLinkClick({ target: link, preventDefault: () => {} });
    } else {
      router.push(`/${targetId.replace(/\.md$/i, '')}`);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="mind-palace-scroll-container" ref={scrollRef}>
      <nav className="nav-mind-palace">
        {[{ id: 'hero', label: 'Entry' }, { id: 'cases', label: 'Dossier' }, { id: 'contact', label: 'Signal' }].map(({ id, label }) => (
          <button key={id} className={`nav-item ${activeSection === id ? 'active' : ''}`} onClick={() => scrollToSection(id)}>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="effects-layer">
        <div className="grain" />
        <div className="cursor-dot"  ref={cursorDotRef} />
        <div className="cursor-ring" ref={cursorRingRef} />
        <canvas className="fog-canvas" ref={fogCanvasRef} />
      </div>

      <div className="scroll-content">
        <HeroSection scrollToSection={scrollToSection} />
        <CasesSection
          displayedCases={displayedCases}
          onLinkClick={handleLinkClick}
          loadedCount={loadedCount}
          totalCount={totalCount}
          loading={loading}
          onLoadMore={() => fetchBatch(loadedCount, loadedCount + BATCH_SIZE)}
        />
        <FeedFooter />
      </div>

      <NoteFeedStyles />
    </div>
  );
}
